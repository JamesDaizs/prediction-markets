import { SurfClient } from "../surfClient";

const client = new SurfClient();

export type TimeRangeLabel = "7d" | "30d" | "90d" | "180d" | "1y";

const CATEGORIES = ["crypto", "culture", "economics", "financials", "politics", "stem", "sports"] as const;
type CategoryEnum = (typeof CATEGORIES)[number];

function normalizeCategory(c: CategoryEnum): string {
  // Public schema returns lowercase; UI elsewhere uses Title-case names.
  switch (c) {
    case "crypto": return "Crypto";
    case "culture": return "Culture";
    case "economics": return "Economics";
    case "financials": return "Finance";
    case "politics": return "Politics";
    case "stem": return "Science";
    case "sports": return "Sports";
  }
}

function tsToDate(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toISOString().slice(0, 10);
}

export interface CategoryTimeSeriesRow {
  date: string;
  category: string;
  source: "Polymarket" | "Kalshi";
  volume: number;
  oi: number;
}

export async function getCategoryTimeSeries(timeRange: TimeRangeLabel): Promise<CategoryTimeSeriesRow[]> {
  const all = await Promise.all(
    CATEGORIES.map((cat) =>
      client
        .getPredictionMarketAnalytics({ category: cat, time_range: timeRange })
        .then((r) =>
          r.data.category_trends.map((row) => ({
            date: tsToDate(row.timestamp),
            category: normalizeCategory(cat),
            source: row.source,
            volume: row.volume_usd,
            oi: row.open_interest_usd,
          }))
        )
        .catch(() => [] as CategoryTimeSeriesRow[])
    )
  );
  return all.flat();
}

export interface DashboardTotalsTimeSeriesRow {
  date: string;
  source: "Polymarket" | "Kalshi";
  total_volume: number;
  total_oi: number;
  market_count: number;
}

export async function getDashboardTotalsTimeSeries(timeRange: TimeRangeLabel): Promise<DashboardTotalsTimeSeriesRow[]> {
  const r = await client.getPredictionMarketAnalytics({ time_range: timeRange });
  return r.data.category_trends.map((row) => ({
    date: tsToDate(row.timestamp),
    source: row.source,
    total_volume: row.volume_usd,
    total_oi: row.open_interest_usd,
    market_count: row.market_count,
  }));
}

export interface SubcategoryMarketRow {
  source: "Polymarket" | "Kalshi";
  title: string;
  oi: number;
  volume: number;
}

export async function getSubcategoryMarkets(
  category: string,
  subcategory: string,
  platform: "both" | "polymarket" | "kalshi",
  limit: number
): Promise<SubcategoryMarketRow[]> {
  // The public schema uses lowercase enum values. The dashboard category labels are Title-case.
  const lower = category.toLowerCase();
  const apiCategory: CategoryEnum | undefined = (CATEGORIES as readonly string[]).includes(lower)
    ? (lower as CategoryEnum)
    : (lower === "finance" ? "financials" : lower === "science" ? "stem" : undefined);

  if (!apiCategory) return [];

  const r = await client.searchPredictionMarket({
    category: apiCategory,
    platform: platform === "both" ? undefined : platform,
    sort_by: "open_interest",
    limit: 100,
  });

  return r.data
    .filter((m) => (m.subcategory ?? "Other").toLowerCase() === subcategory.toLowerCase())
    .map((m): SubcategoryMarketRow => ({
      source: m.platform === "kalshi" ? "Kalshi" : "Polymarket",
      title: m.question,
      oi: m.open_interest_usd,
      volume: m.volume_30d,
    }))
    .slice(0, limit);
}

export interface MetricsAnalytics {
  category_trends: { date: string; source: "Polymarket" | "Kalshi"; volume: number; oi: number; market_count: number }[];
  top_markets: { question: string; platform: string; volume_7d: number; open_interest_usd: number; category: string }[];
  momentum_summary: {
    confirming_up: number;
    confirming_down: number;
    diverging_up: number;
    diverging_down: number;
    neutral: number;
    total_active: number;
    volume_increasing: number;
    volume_decreasing: number;
  };
}

export async function getPlatformAnalytics(timeRange: TimeRangeLabel = "30d"): Promise<MetricsAnalytics> {
  const r = await client.getPredictionMarketAnalytics({ time_range: timeRange });
  return {
    category_trends: r.data.category_trends.map((row) => ({
      date: tsToDate(row.timestamp),
      source: row.source,
      volume: row.volume_usd,
      oi: row.open_interest_usd,
      market_count: row.market_count,
    })),
    top_markets: r.data.top_markets.map((m) => ({
      question: m.question,
      platform: m.platform,
      volume_7d: m.volume_7d,
      open_interest_usd: m.open_interest_usd,
      category: m.category,
    })),
    momentum_summary: r.data.momentum_summary,
  };
}
