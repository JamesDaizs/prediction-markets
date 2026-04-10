import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

export async function GET(request: NextRequest) {
  try {
    // Read the collected surf data
    const dataDir = join(process.cwd(), "data", "surf");

    // Read prediction markets data
    const marketsData = JSON.parse(readFileSync(join(dataDir, "prediction_markets.json"), "utf8"));

    // Read market analytics
    const analyticsData = JSON.parse(readFileSync(join(dataDir, "market_analytics.json"), "utf8"));

    // Calculate totals from the markets data
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

    return NextResponse.json({
      totals: [polyTotal, kalshiTotal],
      categoryBreakdown: Object.values(categoryBreakdown),
      topMarkets,
      analytics: analyticsData.data || {},
      meta: {
        source: "surf-cli",
        timestamp: new Date().toISOString(),
        dataFiles: ["prediction_markets.json", "market_analytics.json"]
      }
    });

  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json({
      error: "Failed to load dashboard data",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}