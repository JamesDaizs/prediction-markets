import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const CH_SCRIPT = `${process.env.HOME}/.claude/work-skills/surf-data-clickhouse/scripts/ch-query`;
const CACHE_TTL = 5 * 60 * 1000; // 5 min

// ─── Cache ──────────────────────────────────────────────────────
const cache = new Map<string, { data: unknown; fetchedAt: number }>();

// ─── Generic query helper ───────────────────────────────────────
async function queryClickHouse<T>(sql: string): Promise<T[]> {
  const key = sql.trim();
  const cached = cache.get(key);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
    return cached.data as T[];
  }

  try {
    const { stdout } = await execAsync(
      `${CH_SCRIPT} --instance surf --db prediction_markets --sql "${sql.replace(/"/g, '\\"')}" --format JSON`,
      { timeout: 30000 }
    );

    const rows = stdout
      .trim()
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => JSON.parse(line) as T);

    cache.set(key, { data: rows, fetchedAt: Date.now() });
    return rows;
  } catch (err) {
    console.error("ClickHouse query failed:", err);
    // Stale-while-error: return expired cache if available
    if (cached) return cached.data as T[];
    return [];
  }
}

// ─── Row types ──────────────────────────────────────────────────
export interface CHMarketRow {
  source: string;
  market_id: string;
  title: string;
  category: string;
  subcategory: string;
  notional_volume_usd: number;
  open_interest_usd: number;
  status: string;
}

export interface CHCategoryRow {
  source: string;
  category: string;
  subcategory: string;
  volume: number;
  oi: number;
  market_count: number;
}

export interface CHDashboardTotals {
  source: string;
  total_volume: number;
  total_oi: number;
  market_count: number;
}

// ─── Latest-date subquery (handles per-source lag) ──────────────
// Polymarket and Kalshi may have different latest dates.
// This CTE filters each source to its own max(date).
const LATEST_DATE_CTE = `
  latest AS (
    SELECT source, max(date) AS d FROM market_daily GROUP BY source
  )
`;

// Polymarket has 3x duplicate rows per market_id — dedup with GROUP BY
const DEDUPED_BASE = `
  WITH ${LATEST_DATE_CTE}
  SELECT
    any(md.source) AS source,
    md.market_id,
    any(md.title) AS title,
    any(md.category) AS category,
    any(md.subcategory) AS subcategory,
    any(md.notional_volume_usd) AS notional_volume_usd,
    any(md.open_interest_usd) AS open_interest_usd,
    any(md.status) AS status
  FROM market_daily md
  JOIN latest ON md.source = latest.source AND md.date = latest.d
`;

// ─── Query functions ────────────────────────────────────────────

/**
 * Unified market ranking across both platforms.
 * Replaces getPolymarketRanking + getKalshiRanking + getAll* variants.
 */
export async function getMarketRanking(params?: {
  limit?: number;
  sortBy?: "volume" | "oi";
  source?: "Polymarket" | "Kalshi";
  status?: string;
}): Promise<CHMarketRow[]> {
  const limit = params?.limit ?? 200;
  const sort =
    params?.sortBy === "oi"
      ? "open_interest_usd DESC"
      : "notional_volume_usd DESC";
  const sourceFilter = params?.source
    ? `AND md.source = '${params.source}'`
    : "";
  const statusFilter = params?.status
    ? `AND md.status = '${params.status}'`
    : "";

  const sql = `
    ${DEDUPED_BASE}
    WHERE 1=1 ${sourceFilter} ${statusFilter}
    GROUP BY md.market_id
    HAVING notional_volume_usd > 0 OR open_interest_usd > 0
    ORDER BY ${sort}
    LIMIT ${limit}
  `;

  const rows = await queryClickHouse<Record<string, string>>(sql);
  return rows.map(parseMarketRow);
}

/**
 * Category breakdown with per-platform OI/volume.
 * Replaces getCategoryMetrics (Hermod) + getKalshiCategoryOI (ClickHouse).
 */
export async function getCategoryBreakdown(): Promise<CHCategoryRow[]> {
  const sql = `
    WITH ${LATEST_DATE_CTE},
    deduped AS (
      SELECT
        any(md.source) AS source,
        md.market_id,
        any(md.category) AS category,
        any(md.subcategory) AS subcategory,
        any(md.notional_volume_usd) AS notional_volume_usd,
        any(md.open_interest_usd) AS open_interest_usd
      FROM market_daily md
      JOIN latest ON md.source = latest.source AND md.date = latest.d
      GROUP BY md.market_id
      HAVING notional_volume_usd > 0 OR open_interest_usd > 0
    )
    SELECT
      source,
      category,
      subcategory,
      sum(notional_volume_usd) AS volume,
      sum(open_interest_usd) AS oi,
      count() AS market_count
    FROM deduped
    GROUP BY source, category, subcategory
    ORDER BY oi DESC
  `;

  const rows = await queryClickHouse<Record<string, string>>(sql);
  return rows.map((r) => ({
    source: r.source,
    category: normalizeCHCategory(r.category),
    subcategory: r.subcategory || "Other",
    volume: parseFloat(r.volume) || 0,
    oi: parseFloat(r.oi) || 0,
    market_count: parseInt(r.market_count) || 0,
  }));
}

/**
 * Dashboard totals per platform.
 * Replaces manual reduce() over ranking arrays.
 */
export async function getDashboardTotals(): Promise<CHDashboardTotals[]> {
  const sql = `
    WITH ${LATEST_DATE_CTE},
    deduped AS (
      SELECT
        any(md.source) AS source,
        md.market_id,
        any(md.notional_volume_usd) AS notional_volume_usd,
        any(md.open_interest_usd) AS open_interest_usd,
        any(md.status) AS status
      FROM market_daily md
      JOIN latest ON md.source = latest.source AND md.date = latest.d
      GROUP BY md.market_id
    )
    SELECT
      source,
      sum(notional_volume_usd) AS total_volume,
      sum(open_interest_usd) AS total_oi,
      count() AS market_count
    FROM deduped
    WHERE status IN ('open', 'active')
    GROUP BY source
  `;

  const rows = await queryClickHouse<Record<string, string>>(sql);
  return rows.map((r) => ({
    source: r.source,
    total_volume: parseFloat(r.total_volume) || 0,
    total_oi: parseFloat(r.total_oi) || 0,
    market_count: parseInt(r.market_count) || 0,
  }));
}

/**
 * Cross-platform top markets by OI, with volume fallback for Kalshi.
 */
export async function getTopMarkets(
  limit = 15
): Promise<CHMarketRow[]> {
  // Sort by whichever is larger: OI or volume (Kalshi has minimal OI)
  const sql = `
    ${DEDUPED_BASE}
    WHERE 1=1
    GROUP BY md.market_id
    HAVING notional_volume_usd > 0 OR open_interest_usd > 0
    ORDER BY greatest(open_interest_usd, notional_volume_usd) DESC
    LIMIT ${limit}
  `;

  const rows = await queryClickHouse<Record<string, string>>(sql);
  return rows.map(parseMarketRow);
}

// ─── Helpers ────────────────────────────────────────────────────

function parseMarketRow(r: Record<string, string>): CHMarketRow {
  return {
    source: r.source,
    market_id: r.market_id,
    title: r.title,
    category: normalizeCHCategory(r.category),
    subcategory: r.subcategory || "Other",
    notional_volume_usd: parseFloat(r.notional_volume_usd) || 0,
    open_interest_usd: parseFloat(r.open_interest_usd) || 0,
    status: r.status,
  };
}

/** Map CH-specific category names to dashboard-standard names */
function normalizeCHCategory(cat: string): string {
  if (!cat) return "Other";
  switch (cat) {
    case "Financials":
      return "Finance";
    case "STEM":
      return "Science";
    case "Unknown":
    case "Early Polymarket Trades":
      return "Other";
    default:
      return cat;
  }
}
