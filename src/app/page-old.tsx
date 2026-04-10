// Static at deploy time — rebuild locally to refresh (CH is IP-restricted, no ISR from Vercel)
export const dynamic = "force-static";

import {
  getDashboardTotals,
  getCategoryBreakdown,
  getTopMarkets,
  getDashboardTotalsTimeSeries,
} from "@/lib/api/clickhouse";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { BarChart3, DollarSign, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const [totals, catRows, topMarketsRaw, trendData] = await Promise.all([
    getDashboardTotals(),
    getCategoryBreakdown(),
    getTopMarkets(15),
    getDashboardTotalsTimeSeries(30),
  ]);

  // ── Totals ──
  const poly = totals.find((t) => t.source === "Polymarket");
  const kalshi = totals.find((t) => t.source === "Kalshi");
  const totalOI = (poly?.total_oi ?? 0) + (kalshi?.total_oi ?? 0);
  const totalVolume = (poly?.total_volume ?? 0) + (kalshi?.total_volume ?? 0);
  const totalMarkets = (poly?.market_count ?? 0) + (kalshi?.market_count ?? 0);

  // ── Sparkline & Trend from 30-day time series ──
  const dailyMap = new Map<string, { oi: number; volume: number; markets: number }>();
  for (const row of trendData) {
    const existing = dailyMap.get(row.date) || { oi: 0, volume: 0, markets: 0 };
    existing.oi += row.total_oi;
    existing.volume += row.total_volume;
    existing.markets += row.market_count;
    dailyMap.set(row.date, existing);
  }
  const dailySorted = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b));
  const oiSparkline = dailySorted.map(([, v]) => v.oi);
  const volumeSparkline = dailySorted.map(([, v]) => v.volume);
  const marketSparkline = dailySorted.map(([, v]) => v.markets);

  // Calculate 7d change
  function calc7dChange(sparkline: number[]): number | undefined {
    if (sparkline.length < 8) return undefined;
    const current = sparkline[sparkline.length - 1];
    const prev = sparkline[sparkline.length - 8];
    if (prev === 0) return undefined;
    return ((current - prev) / prev) * 100;
  }

  const oiChange = calc7dChange(oiSparkline);
  const volumeChange = calc7dChange(volumeSparkline);

  // ── Category aggregation ──
  const catMap = new Map<
    string,
    {
      polymarket: number;
      kalshi: number;
      polyMarkets: { name: string; value: number }[];
      kalshiMarkets: { name: string; value: number }[];
    }
  >();

  // Also build subcategory hierarchy for treemap (clean 2-level: Category > Subcategory)
  const hierarchy = new Map<
    string,
    Map<string, { polymarket: number; kalshi: number }>
  >();

  for (const row of catRows) {
    const cat = row.category || "Other";
    const sub = row.subcategory || "Other";

    // Category map for bar chart + compare
    const existing = catMap.get(cat) ?? {
      polymarket: 0,
      kalshi: 0,
      polyMarkets: [],
      kalshiMarkets: [],
    };
    if (row.source === "Polymarket") {
      existing.polymarket += row.oi;
      if (row.oi > 0) {
        existing.polyMarkets.push({
          name: `${sub} (${row.market_count} mkts)`,
          value: row.oi,
        });
      }
    } else {
      existing.kalshi += row.oi > 0 ? row.oi : row.volume;
      if (row.volume > 0 || row.oi > 0) {
        existing.kalshiMarkets.push({
          name: `${sub} (${row.market_count} mkts)`,
          value: row.oi > 0 ? row.oi : row.volume,
        });
      }
    }
    catMap.set(cat, existing);

    // Hierarchy for treemap — aggregate by subcategory, store per-platform sizes
    if (!hierarchy.has(cat)) hierarchy.set(cat, new Map());
    const subMap = hierarchy.get(cat)!;
    if (!subMap.has(sub)) subMap.set(sub, { polymarket: 0, kalshi: 0 });
    const entry = subMap.get(sub)!;
    const size = row.oi > 0 ? row.oi : row.volume;
    if (row.source === "Polymarket") {
      entry.polymarket += size;
    } else {
      entry.kalshi += size;
    }
  }

  const categoryData = Array.from(catMap.entries())
    .map(([name, v]) => ({
      name,
      polymarket: v.polymarket,
      kalshi: v.kalshi,
      total: v.polymarket + v.kalshi,
      polyMarkets: v.polyMarkets.sort((a, b) => b.value - a.value).slice(0, 15),
      kalshiMarkets: v.kalshiMarkets
        .sort((a, b) => b.value - a.value)
        .slice(0, 15),
    }))
    .filter((c) => c.total > 1000)
    .sort((a, b) => b.total - a.total);

  const treemapData = categoryData.map((c) => ({
    name: c.name,
    size: c.total,
  }));

  const hierarchicalData = Array.from(hierarchy.entries())
    .map(([catName, subMap]) => ({
      name: catName,
      children: Array.from(subMap.entries())
        .map(([subName, vals]) => ({
          name: subName,
          size: vals.polymarket + vals.kalshi,
          polymarket: vals.polymarket,
          kalshi: vals.kalshi,
        }))
        .filter((sub) => sub.size > 0)
        .sort((a, b) => b.size - a.size),
    }))
    .sort((a, b) => {
      const aTotal = a.children.reduce((s, c) => s + c.size, 0);
      const bTotal = b.children.reduce((s, c) => s + c.size, 0);
      return bTotal - aTotal;
    });

  const barData = categoryData.map((c) => ({
    name: c.name,
    polymarket: c.polymarket,
    kalshi: c.kalshi,
  }));

  const compareData = categoryData.map((c) => ({
    name: c.name,
    polymarket: c.polymarket,
    kalshi: c.kalshi,
    total: c.total,
    polyMarkets: c.polyMarkets,
    kalshiMarkets: c.kalshiMarkets,
  }));

  const topMarkets = topMarketsRaw.map((m) => ({
    name: m.title.slice(0, 50),
    value: Math.max(m.open_interest_usd, m.notional_volume_usd),
    platform: (m.source === "Kalshi" ? "Kalshi" : "Polymarket") as
      | "Polymarket"
      | "Kalshi",
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-pm-fg-base">Dashboard</h1>
        <p className="mt-1 text-sm text-pm-fg-faint">
          Prediction market analytics across Polymarket & Kalshi
        </p>
      </div>

      <div className="animate-stagger grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Open Interest"
          value={formatCurrency(totalOI, true)}
          sub={`Poly ${formatCurrency(poly?.total_oi ?? 0, true)} / Kalshi ${formatCurrency(kalshi?.total_oi ?? 0, true)}`}
          icon={<TrendingUp className="h-4 w-4" />}
          trend={oiChange !== undefined ? { value: oiChange, label: "vs 7d ago" } : undefined}
          sparkline={oiSparkline.length > 1 ? oiSparkline : undefined}
        />
        <StatCard
          label="Total Volume"
          value={formatCurrency(totalVolume, true)}
          sub={`Poly ${formatCurrency(poly?.total_volume ?? 0, true)} / Kalshi ${formatCurrency(kalshi?.total_volume ?? 0, true)}`}
          icon={<DollarSign className="h-4 w-4" />}
          trend={volumeChange !== undefined ? { value: volumeChange, label: "vs 7d ago" } : undefined}
          sparkline={volumeSparkline.length > 1 ? volumeSparkline : undefined}
        />
        <StatCard
          label="Active Markets"
          value={formatNumber(totalMarkets)}
          sub={`Poly ${formatNumber(poly?.market_count ?? 0)} / Kalshi ${formatNumber(kalshi?.market_count ?? 0)}`}
          icon={<BarChart3 className="h-4 w-4" />}
          sparkline={marketSparkline.length > 1 ? marketSparkline : undefined}
        />
        <StatCard
          label="Top Category"
          value={categoryData[0]?.name ?? "-"}
          sub={
            categoryData[0]
              ? formatCurrency(categoryData[0].total, true) + " OI"
              : ""
          }
          icon={<BarChart3 className="h-4 w-4" />}
        />
      </div>

      <DashboardClient
        treemapData={treemapData}
        barData={barData}
        topMarkets={topMarkets}
        hierarchicalData={hierarchicalData}
        compareData={compareData}
      />
    </div>
  );
}
