import { NextRequest, NextResponse } from "next/server";
import {
  getPolymarketPrices,
  getPolymarketOpenInterest,
  getPolymarketTrades,
} from "@/lib/api/polymarket";
import {
  getKalshiPrices,
  getKalshiOpenInterest,
  getKalshiTrades,
} from "@/lib/api/kalshi";
import type { TimeRange } from "@/lib/api/types";

function formatDate(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatTime(ts: number): string {
  return new Date(ts * 1000).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const endpoint = sp.get("endpoint");
  const platform = sp.get("platform");
  const conditionId = sp.get("condition_id") || "";
  const ticker = sp.get("ticker") || "";
  const timeRange = (sp.get("time_range") || "30d") as TimeRange;
  const limit = parseInt(sp.get("limit") || "20", 10);

  try {
    if (endpoint === "prices") {
      if (platform === "polymarket" && conditionId) {
        const data = await getPolymarketPrices(conditionId, timeRange);
        return NextResponse.json(
          data.map((p) => ({
            date: formatDate(p.timestamp),
            yes: p.side_a?.price ?? 0,
            no: p.side_b?.price ?? 0,
          }))
        );
      }
      if (platform === "kalshi" && ticker) {
        const data = await getKalshiPrices(ticker, timeRange);
        return NextResponse.json(
          data.map((p) => ({
            date: formatDate(p.timestamp),
            yes: p.side_a?.price ?? 0,
            no: p.side_b?.price ?? 0,
            high: p.high,
            low: p.low,
          }))
        );
      }
    }

    if (endpoint === "oi") {
      if (platform === "polymarket" && conditionId) {
        const data = await getPolymarketOpenInterest(conditionId, timeRange);
        return NextResponse.json(
          data.map((p) => ({
            date: formatDate(p.timestamp),
            oi: p.open_interest_usd,
          }))
        );
      }
      if (platform === "kalshi" && ticker) {
        const data = await getKalshiOpenInterest(ticker, timeRange);
        return NextResponse.json(
          data.map((p) => ({
            date: formatDate(p.timestamp),
            oi: p.open_interest,
          }))
        );
      }
    }

    if (endpoint === "trades") {
      if (platform === "polymarket" && conditionId) {
        const data = await getPolymarketTrades({
          condition_id: conditionId,
          limit,
        });
        return NextResponse.json(
          data.map((t) => ({
            time: formatTime(t.block_time),
            side: t.outcome_label,
            price: t.price,
            amount: t.amount_usd,
            txHash: t.tx_hash,
          }))
        );
      }
      if (platform === "kalshi" && ticker) {
        const data = await getKalshiTrades({ ticker, limit });
        return NextResponse.json(
          data.map((t) => ({
            time: formatTime(t.timestamp),
            side: t.taker_side,
            price: t.yes_price,
            amount: t.notional_volume_usd,
          }))
        );
      }
    }

    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
