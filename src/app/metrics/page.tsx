export const dynamic = "force-dynamic";

import { MetricsClient } from "./metrics-client";
import { getPlatformAnalytics, type MetricsAnalytics } from "@/lib/queries/markets";

interface DailyTotals {
  date: string;
  polymarket: number;
  kalshi: number;
}

function rollUpByDate(rows: MetricsAnalytics["category_trends"], pick: "volume" | "oi" | "market_count"): DailyTotals[] {
  const byDate = new Map<string, { polymarket: number; kalshi: number }>();
  for (const r of rows) {
    const slot = byDate.get(r.date) ?? { polymarket: 0, kalshi: 0 };
    const value = pick === "volume" ? r.volume : pick === "oi" ? r.oi : r.market_count;
    if (r.source === "Polymarket") slot.polymarket += value;
    else slot.kalshi += value;
    byDate.set(r.date, slot);
  }
  return Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, ...v }));
}

export default async function MetricsPage() {
  let analytics: MetricsAnalytics | null = null;
  try {
    analytics = await getPlatformAnalytics("30d");
  } catch (err) {
    console.error("Failed to load platform analytics:", err);
  }

  const trends = analytics?.category_trends ?? [];
  const volumeDaily = rollUpByDate(trends, "volume");
  const oiDaily = rollUpByDate(trends, "oi");
  const marketCountDaily = rollUpByDate(trends, "market_count");

  const transactions = volumeDaily.map((d) => ({ period: d.date, polymarket: d.polymarket, kalshi: d.kalshi }));
  const oi = oiDaily.map((d) => ({ period: d.date, polymarket: d.polymarket, kalshi: d.kalshi }));
  const marketCounts = marketCountDaily.map((d) => ({ period: d.date, polymarket: d.polymarket, kalshi: d.kalshi }));

  // Volume by category (one row per period × category, with platform bucket).
  const volumeByCategory: { period: string; category: string; volume: number; platform: string }[] = [];
  if (analytics) {
    // The category_trends data is per-source per-day, but doesn't carry the category label.
    // For the dashboard, we approximate by labeling everything under "All" (the analytics endpoint
    // collapses across categories when called without --category).
    // The Volume by Category card is therefore omitted here.
  }

  return (
    <MetricsClient
      initialTransactions={transactions}
      initialOI={oi}
      initialNewMarkets={marketCounts}
      initialVolumeByCategory={volumeByCategory}
      topMarkets={analytics?.top_markets ?? []}
      momentumSummary={analytics?.momentum_summary ?? null}
    />
  );
}
