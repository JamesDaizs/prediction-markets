// Use static data import instead of API calls for better reliability
export const dynamic = "force-static";

import { formatCurrency, formatNumber } from "@/lib/utils";
import { BarChart3, DollarSign, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { readFileSync } from "fs";
import { join } from "path";

async function getDashboardData() {
  try {
    // Read the collected surf data directly
    const dataDir = join(process.cwd(), "data", "surf");
    const marketsData = JSON.parse(readFileSync(join(dataDir, "prediction_markets.json"), "utf8"));
    const analyticsData = JSON.parse(readFileSync(join(dataDir, "market_analytics.json"), "utf8"));

    const markets = marketsData.data || [];

    // Group by platform
    const polymarkets = markets.filter((m: any) => m.platform === "polymarket");
    const kalshiMarkets = markets.filter((m: any) => m.platform === "kalshi");

    // Calculate totals
    const polyTotal = {
      source: "Polymarket",
      total_oi: polymarkets.reduce((sum: number, m: any) => sum + (m.open_interest_usd || 0), 0),
      total_volume: polymarkets.reduce((sum: number, m: any) => sum + (m.volume_30d || 0), 0),
      market_count: polymarkets.length
    };

    const kalshiTotal = {
      source: "Kalshi",
      total_oi: kalshiMarkets.reduce((sum: number, m: any) => sum + (m.open_interest_usd || 0), 0),
      total_volume: kalshiMarkets.reduce((sum: number, m: any) => sum + (m.volume_30d || 0), 0),
      market_count: kalshiMarkets.length
    };

    // Category breakdown
    const categoryBreakdown = markets.reduce((acc: any, market: any) => {
      const cat = market.category || "Other";
      if (!acc[cat]) {
        acc[cat] = { category: cat, market_count: 0, total_volume: 0 };
      }
      acc[cat].market_count++;
      acc[cat].total_volume += market.volume_30d || 0;
      return acc;
    }, {});

    // Top markets (sorted by volume)
    const topMarkets = markets
      .sort((a: any, b: any) => (b.volume_30d || 0) - (a.volume_30d || 0))
      .slice(0, 15)
      .map((m: any) => ({
        question: m.question,
        volume_30d: m.volume_30d || 0,
        open_interest_usd: m.open_interest_usd || 0,
        platform: m.platform,
        category: m.category,
        latest_price: m.latest_price
      }));

    return {
      totals: [polyTotal, kalshiTotal],
      categoryBreakdown: Object.values(categoryBreakdown),
      topMarkets,
      analytics: analyticsData.data || {},
      meta: {
        source: "surf-cli",
        timestamp: new Date().toISOString(),
        dataFiles: ["prediction_markets.json", "market_analytics.json"]
      }
    };
  } catch (error) {
    console.error('Failed to load dashboard data:', error);
    return {
      totals: [],
      categoryBreakdown: [],
      topMarkets: [],
      analytics: {},
      meta: { source: 'error', error: error instanceof Error ? error.message : 'Unknown error' }
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