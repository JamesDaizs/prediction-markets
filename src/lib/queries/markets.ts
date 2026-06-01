import { SurfClient, type CategoryTrendPoint } from "../surfClient";

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

// ---------------------------------------------------------------------------
// Dashboard snapshot — live replacement for the old static data/surf/*.json.
// Platform totals + per-category breakdown come from prediction-market-analytics
// (open interest / market count are point-in-time, taken from the latest day;
// volume is summed across the 30-day window). Top markets come from search
// sorted by 30d volume.
// ---------------------------------------------------------------------------

export interface DashboardTotals {
  source: "Polymarket" | "Kalshi";
  total_oi: number;
  total_volume: number;
  market_count: number;
}

export interface DashboardCategory {
  category: string;
  market_count: number;
  total_volume: number;
}

export interface DashboardTopMarket {
  question: string;
  volume_30d: number;
  open_interest_usd: number;
  platform: string;
  category: string;
  latest_price?: number;
}

export interface DashboardSnapshot {
  totals: DashboardTotals[];
  categoryBreakdown: DashboardCategory[];
  topMarkets: DashboardTopMarket[];
}

/** Sum 30d volume per source and capture latest-day OI / market_count. */
function aggregateTrends(trends: CategoryTrendPoint[]) {
  const latestTs = trends.reduce((mx, r) => Math.max(mx, r.timestamp), 0);
  const bySource = new Map<"Polymarket" | "Kalshi", { oi: number; vol: number; mc: number }>();
  for (const r of trends) {
    const cur = bySource.get(r.source) ?? { oi: 0, vol: 0, mc: 0 };
    cur.vol += r.volume_usd;
    if (r.timestamp === latestTs) {
      cur.oi = r.open_interest_usd;
      cur.mc = r.market_count;
    }
    bySource.set(r.source, cur);
  }
  return bySource;
}

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  const [totalsResp, categoryBreakdown, topResp] = await Promise.all([
    client.getPredictionMarketAnalytics({ time_range: "30d" }),
    Promise.all(
      CATEGORIES.map((cat) =>
        client
          .getPredictionMarketAnalytics({ category: cat, time_range: "30d" })
          .then((r): DashboardCategory => {
            const bySource = aggregateTrends(r.data.category_trends ?? []);
            let market_count = 0;
            let total_volume = 0;
            for (const v of bySource.values()) {
              market_count += v.mc;
              total_volume += v.vol;
            }
            return { category: normalizeCategory(cat), market_count, total_volume };
          })
          .catch((): DashboardCategory => ({
            category: normalizeCategory(cat),
            market_count: 0,
            total_volume: 0,
          }))
      )
    ),
    client.searchPredictionMarket({ sort_by: "volume_30d", order: "desc", limit: 15 }),
  ]);

  const bySource = aggregateTrends(totalsResp.data.category_trends ?? []);
  const totals: DashboardTotals[] = (["Polymarket", "Kalshi"] as const).map((source) => {
    const v = bySource.get(source) ?? { oi: 0, vol: 0, mc: 0 };
    return { source, total_oi: v.oi, total_volume: v.vol, market_count: v.mc };
  });

  const topMarkets: DashboardTopMarket[] = topResp.data.map((m) => ({
    question: m.question,
    volume_30d: m.volume_30d,
    open_interest_usd: m.open_interest_usd,
    platform: m.platform,
    category: m.category,
    latest_price: m.latest_price,
  }));

  return { totals, categoryBreakdown, topMarkets };
}
