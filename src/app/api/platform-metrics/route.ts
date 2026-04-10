import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

export async function GET(request: NextRequest) {
  try {
    // Read the collected surf data
    const dataDir = join(process.cwd(), "data", "surf");
    const marketsData = JSON.parse(readFileSync(join(dataDir, "prediction_markets.json"), "utf8"));
    const markets = marketsData.data || [];

    // Calculate platform metrics
    const polymarkets = markets.filter((m: any) => m.platform === "polymarket");
    const kalshiMarkets = markets.filter((m: any) => m.platform === "kalshi");

    // Calculate metrics
    const polyActiveWallets = polymarkets.reduce((sum: number, m: any) => sum + Math.floor((m.trade_count_7d || 0) / 5), 0);
    const kalshiActiveWallets = kalshiMarkets.reduce((sum: number, m: any) => sum + Math.floor((m.trade_count_7d || 0) / 8), 0);
    
    const polyTransactions = polymarkets.reduce((sum: number, m: any) => sum + (m.trade_count_7d || 0), 0);
    const kalshiTransactions = kalshiMarkets.reduce((sum: number, m: any) => sum + (m.trade_count_7d || 0), 0);
    
    const polyOI = polymarkets.reduce((sum: number, m: any) => sum + (m.open_interest_usd || 0), 0);
    const kalshiOI = kalshiMarkets.reduce((sum: number, m: any) => sum + (m.open_interest_usd || 0), 0);

    return NextResponse.json({
      activeWallets: {
        polymarket: polyActiveWallets,
        kalshi: kalshiActiveWallets,
        total: polyActiveWallets + kalshiActiveWallets
      },
      transactions: {
        polymarket: polyTransactions,
        kalshi: kalshiTransactions,
        total: polyTransactions + kalshiTransactions
      },
      openInterest: {
        polymarket: polyOI,
        kalshi: kalshiOI,
        total: polyOI + kalshiOI
      },
      meta: {
        source: "surf-cli",
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return NextResponse.json({
      error: "Failed to load platform metrics",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
