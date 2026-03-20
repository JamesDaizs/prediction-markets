export const dynamic = "force-dynamic";

import { getCategoryMetrics } from "@/lib/api/search";
import { getPolymarketRanking } from "@/lib/api/polymarket";
import { getKalshiRanking } from "@/lib/api/kalshi";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { BarChart3, DollarSign, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  // Fetch ranking + category metrics from BOTH platforms separately
  // (single call hits 50-item limit, cutting off one platform)
  const [polyRanking, kalshiRanking, polyCatMetrics, kalshiCatMetrics] =
    await Promise.all([
      getPolymarketRanking({ sort_by: "open_interest", limit: 50 }),
      getKalshiRanking({ sort_by: "open_interest", limit: 50 }),
      getCategoryMetrics({ source: "Polymarket", time_range: "30d", limit: 50 }),
      getCategoryMetrics({ source: "Kalshi", time_range: "30d", limit: 50 }),
    ]);

  const totalPolyOI = polyRanking.reduce(
    (sum, m) => sum + m.open_interest_usd,
    0
  );
  const totalKalshiOI = kalshiRanking.reduce(
    (sum, m) => sum + m.open_interest,
    0
  );
  const totalPolyVolume = polyRanking.reduce(
    (sum, m) => sum + m.notional_volume_usd,
    0
  );
  const totalKalshiVolume = kalshiRanking.reduce(
    (sum, m) => sum + m.notional_volume_usd,
    0
  );

  // Merge both platform category metrics
  const catMap = new Map<
    string,
    { polymarket: number; kalshi: number }
  >();
  for (const cm of polyCatMetrics) {
    const key = cm.category || "Uncategorized";
    const existing = catMap.get(key) ?? { polymarket: 0, kalshi: 0 };
    existing.polymarket += cm.notional_volume_usd;
    catMap.set(key, existing);
  }
  for (const cm of kalshiCatMetrics) {
    const key = cm.category || "Uncategorized";
    const existing = catMap.get(key) ?? { polymarket: 0, kalshi: 0 };
    existing.kalshi += cm.notional_volume_usd;
    catMap.set(key, existing);
  }

  const categoryData = Array.from(catMap.entries())
    .map(([name, v]) => ({
      name,
      polymarket: v.polymarket,
      kalshi: v.kalshi,
      totalVolume: v.polymarket + v.kalshi,
    }))
    .filter((c) => c.name !== "Uncategorized" || c.totalVolume > 1000)
    .sort((a, b) => b.totalVolume - a.totalVolume);

  const treemapData = categoryData.map((c) => ({
    name: c.name,
    size: c.totalVolume,
  }));

  const barData = categoryData.map((c) => ({
    name: c.name,
    polymarket: c.polymarket,
    kalshi: c.kalshi,
  }));

  const topMarkets = [
    ...polyRanking.slice(0, 10).map((m) => ({
      name: m.question.slice(0, 50),
      value: m.open_interest_usd,
      platform: "Polymarket" as const,
    })),
    ...kalshiRanking.slice(0, 10).map((m) => ({
      name: m.title.slice(0, 50),
      value: m.open_interest,
      platform: "Kalshi" as const,
    })),
  ]
    .sort((a, b) => b.value - a.value)
    .slice(0, 15);

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
          value={formatCurrency(totalPolyOI + totalKalshiOI, true)}
          sub={`Poly ${formatCurrency(totalPolyOI, true)} / Kalshi ${formatCurrency(totalKalshiOI, true)}`}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatCard
          label="Total Volume (top 100)"
          value={formatCurrency(totalPolyVolume + totalKalshiVolume, true)}
          sub={`Poly ${formatCurrency(totalPolyVolume, true)} / Kalshi ${formatCurrency(totalKalshiVolume, true)}`}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <StatCard
          label="Active Markets"
          value={formatNumber(polyRanking.length + kalshiRanking.length)}
          sub={`Poly ${polyRanking.length} / Kalshi ${kalshiRanking.length}`}
          icon={<BarChart3 className="h-4 w-4" />}
        />
        <StatCard
          label="Top Category"
          value={categoryData[0]?.name ?? "-"}
          sub={
            categoryData[0]
              ? formatCurrency(categoryData[0].totalVolume, true) + " volume"
              : ""
          }
          icon={<BarChart3 className="h-4 w-4" />}
        />
      </div>

      <DashboardClient
        treemapData={treemapData}
        barData={barData}
        topMarkets={topMarkets}
      />
    </div>
  );
}
