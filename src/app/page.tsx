// Live data from the public Surf API (prediction-market-analytics + search).
export const dynamic = "force-dynamic";

import { formatCurrency, formatNumber } from "@/lib/utils";
import { BarChart3, DollarSign, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { getDashboardSnapshot } from "@/lib/queries/markets";

async function getDashboardData() {
  try {
    const { totals, categoryBreakdown, topMarkets } = await getDashboardSnapshot();
    return {
      totals,
      categoryBreakdown,
      topMarkets,
      meta: {
        source: "Surf API (live)",
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("Failed to load dashboard data:", error);
    return {
      totals: [],
      categoryBreakdown: [],
      topMarkets: [],
      meta: { source: "error", error: error instanceof Error ? error.message : "Unknown error" },
    };
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  const { totals, categoryBreakdown, topMarkets, meta } = data;

  // Calculate totals
  const poly = totals.find((t: any) => t.source === "Polymarket");
  const kalshi = totals.find((t: any) => t.source === "Kalshi");
  const totalOI = (poly?.total_oi ?? 0) + (kalshi?.total_oi ?? 0);
  const totalVolume = (poly?.total_volume ?? 0) + (kalshi?.total_volume ?? 0);
  const totalMarkets = (poly?.market_count ?? 0) + (kalshi?.market_count ?? 0);

  // Category data for display
  const categoryData: { category: string; market_count: number; total_volume: number }[] =
    Array.isArray(categoryBreakdown)
      ? (categoryBreakdown as { category: string; market_count: number; total_volume: number }[])
          .sort((a, b) => b.total_volume - a.total_volume)
      : [];
  const topCategory = categoryData[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-pm-fg-base">Dashboard</h1>
        <p className="mt-1 text-sm text-pm-fg-faint">
          Prediction market analytics across Polymarket & Kalshi
        </p>
        {meta.source && (
          <p className="mt-1 text-xs text-pm-fg-faint">
            Data source: {meta.source} {meta.timestamp && `(${new Date(meta.timestamp).toLocaleTimeString()})`}
          </p>
        )}
      </div>

      <div className="animate-stagger grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Open Interest"
          value={formatCurrency(totalOI, true)}
          sub={`Poly ${formatCurrency(poly?.total_oi ?? 0, true)} / Kalshi ${formatCurrency(kalshi?.total_oi ?? 0, true)}`}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatCard
          label="Total Volume (30d)"
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
          value={topCategory?.category ?? "-"}
          sub={topCategory ? `${formatNumber(topCategory.market_count)} markets` : ""}
          icon={<BarChart3 className="h-4 w-4" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Categories */}
        <div className="bg-pm-bg-card border border-pm-border-base rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Markets by Category</h3>
          <div className="space-y-3">
            {categoryData.slice(0, 8).map((cat: any, i: number) => (
              <div key={cat.category} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-sm font-medium">{cat.category}</div>
                  <div className="text-xs text-gray-500">{formatNumber(cat.market_count)} markets</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{formatCurrency(cat.total_volume, true)}</div>
                  <div className="text-xs text-gray-500">30d volume</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Markets */}
        <div className="bg-pm-bg-card border border-pm-border-base rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Top Markets by Volume</h3>
          <div className="space-y-3">
            {topMarkets.slice(0, 8).map((market: any, i: number) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex-1 pr-3">
                  <div className="text-sm font-medium line-clamp-2">{market.question}</div>
                  <div className="text-xs text-gray-500">
                    {market.platform} • {market.category}
                  </div>
                </div>
                <div className="text-right text-sm font-medium">
                  {formatCurrency(market.volume_30d, true)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {meta.error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> Using fallback data due to: {meta.error}
          </p>
        </div>
      )}
    </div>
  );
}