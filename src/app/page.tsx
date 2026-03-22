export const dynamic = "force-dynamic";

import {
  getDashboardTotals,
  getCategoryBreakdown,
  getTopMarkets,
} from "@/lib/api/clickhouse";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { BarChart3, DollarSign, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const [totals, catRows, topMarketsRaw] = await Promise.all([
    getDashboardTotals(),
    getCategoryBreakdown(),
    getTopMarkets(15),
  ]);

  // ── Totals ──
  const poly = totals.find((t) => t.source === "Polymarket");
  const kalshi = totals.find((t) => t.source === "Kalshi");
  const totalOI = (poly?.total_oi ?? 0) + (kalshi?.total_oi ?? 0);
  const totalVolume = (poly?.total_volume ?? 0) + (kalshi?.total_volume ?? 0);
  const totalMarkets = (poly?.market_count ?? 0) + (kalshi?.market_count ?? 0);

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

  // Also build subcategory hierarchy for treemap
  const hierarchy = new Map<
    string,
    Map<string, { name: string; size: number }[]>
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

    // Hierarchy for treemap
    if (!hierarchy.has(cat)) hierarchy.set(cat, new Map());
    const subMap = hierarchy.get(cat)!;
    if (!subMap.has(sub)) subMap.set(sub, []);
    const size = row.oi > 0 ? row.oi : row.volume;
    if (size > 0) {
      subMap
        .get(sub)!
        .push({ name: `${row.source}: ${sub}`, size });
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
      children: Array.from(subMap.entries()).map(([subName, markets]) => ({
        name: subName,
        children: markets.sort((a, b) => b.size - a.size).slice(0, 20),
      })),
    }))
    .sort((a, b) => {
      const aTotal = a.children.reduce(
        (s, sub) => s + sub.children.reduce((ss, m) => ss + m.size, 0),
        0
      );
      const bTotal = b.children.reduce(
        (s, sub) => s + sub.children.reduce((ss, m) => ss + m.size, 0),
        0
      );
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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Prediction market analytics across Polymarket & Kalshi
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Open Interest"
          value={formatCurrency(totalOI, true)}
          sub={`Poly ${formatCurrency(poly?.total_oi ?? 0, true)} / Kalshi ${formatCurrency(kalshi?.total_oi ?? 0, true)}`}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatCard
          label="Total Volume"
          value={formatCurrency(totalVolume, true)}
          sub={`Poly ${formatCurrency(poly?.total_volume ?? 0, true)} / Kalshi ${formatCurrency(kalshi?.total_volume ?? 0, true)}`}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <StatCard
          label="Active Markets"
          value={formatNumber(totalMarkets)}
          sub={`Poly ${formatNumber(poly?.market_count ?? 0)} / Kalshi ${formatNumber(kalshi?.market_count ?? 0)}`}
          icon={<BarChart3 className="h-4 w-4" />}
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
