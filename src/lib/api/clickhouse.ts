// ─── ClickHouse HTTP API client ──────────────────────────────────

const CH_HOST = process.env.CLICKHOUSE_HOST || "clickhouse.ask.surf";
const CH_USER = process.env.CLICKHOUSE_USER || "";
const CH_PASS = process.env.CLICKHOUSE_PASSWORD || "";
const CH_DB = process.env.CLICKHOUSE_DB || "prediction_markets";
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
    const url = `https://${CH_HOST}:8443/?database=${encodeURIComponent(CH_DB)}`;
    const body = `${sql.replace(/\s+/g, " ").trim()} FORMAT JSONEachRow`;
    const auth = Buffer.from(`${CH_USER}:${CH_PASS}`).toString("base64");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "text/plain",
      },
      body,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`ClickHouse HTTP ${res.status}: ${errText.slice(0, 500)}`);
    }

    const text = await res.text();
    const rows = text
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

// ─── Unified market CTE (bypasses broken market_daily view) ─────
// market_daily VIEW references non-existent polymarket_polygon.market_daily_categorized.
// Instead, we query source tables directly:
//   Polymarket: market_report_daily_v5 + market_details + market_category_v3
//   Kalshi: kalshi.market_daily_categorized (self-contained)

/**
 * Two-phase CTE: first aggregate numeric data (fast, no JOINs on huge tables),
 * then resolve titles/categories only for the filtered results.
 *
 * Phase 1 (`unified_raw`): source, market_id, volume, oi, status — no title/category
 * Phase 2: callers JOIN metadata only on the top-N rows they need.
 *
 * For Kalshi, title/category come from the same table so it's included directly.
 * For Polymarket, title/category require JOINing market_details + market_category_v3.
 */
const UNIFIED_RAW_CTE = `
  poly_latest AS (
    SELECT max(date) AS d FROM polymarket_polygon.market_report_daily_v5
  ),
  kalshi_latest AS (
    SELECT max(date) AS d FROM kalshi.market_daily_categorized
  ),
  poly_raw AS (
    SELECT
      'Polymarket' AS source,
      r.condition_id AS market_id,
      sum(r.notional_volume_usd) AS notional_volume_usd,
      sum(r.open_interest_usd) AS open_interest_usd,
      any(r.status) AS status
    FROM polymarket_polygon.market_report_daily_v5 r
    CROSS JOIN poly_latest pl
    WHERE r.date = pl.d
    GROUP BY r.condition_id
  ),
  kalshi_raw AS (
    SELECT
      'Kalshi' AS source,
      k.market_ticker AS market_id,
      toFloat64(any(k.daily_volume_usd)) AS notional_volume_usd,
      toFloat64(any(k.open_interest_usd)) AS open_interest_usd,
      any(k.status) AS status
    FROM kalshi.market_daily_categorized k
    CROSS JOIN kalshi_latest kl
    WHERE k.date = kl.d
    GROUP BY k.market_ticker
  ),
  unified_raw AS (
    SELECT * FROM poly_raw
    UNION ALL
    SELECT * FROM kalshi_raw
  )
`;

/**
 * Enrichment JOINs: resolve title + category for a set of market_ids.
 * For Polymarket: LEFT JOIN market_details + market_category_v3
 * For Kalshi: LEFT JOIN kalshi.market_daily_categorized (latest date)
 * Use this after filtering to top-N to avoid scanning full metadata tables.
 */
function enrichmentSelect(tableAlias: string): string {
  return `
    SELECT
      ${tableAlias}.source,
      ${tableAlias}.market_id,
      CASE
        WHEN ${tableAlias}.source = 'Polymarket' THEN coalesce(pd.question, ${tableAlias}.market_id)
        ELSE coalesce(kd.title, ${tableAlias}.market_id)
      END AS title,
      CASE
        WHEN ${tableAlias}.source = 'Polymarket' THEN coalesce(pc.category, '')
        ELSE coalesce(kd.category, '')
      END AS category,
      CASE
        WHEN ${tableAlias}.source = 'Polymarket' THEN coalesce(pc.subcategory, '')
        ELSE coalesce(kd.subcategory, '')
      END AS subcategory,
      ${tableAlias}.notional_volume_usd,
      ${tableAlias}.open_interest_usd,
      ${tableAlias}.status
    FROM filtered ${tableAlias}
    LEFT JOIN polymarket_polygon.market_details pd
      ON ${tableAlias}.source = 'Polymarket' AND ${tableAlias}.market_id = pd.condition_id
    LEFT JOIN polymarket_polygon.market_category_v3 pc
      ON ${tableAlias}.source = 'Polymarket' AND ${tableAlias}.market_id = pc.condition_id
    LEFT JOIN kalshi.market_daily_categorized kd
      ON ${tableAlias}.source = 'Kalshi' AND ${tableAlias}.market_id = kd.market_ticker
      AND kd.date = (SELECT max(date) FROM kalshi.market_daily_categorized)
    GROUP BY ${tableAlias}.source, ${tableAlias}.market_id,
      ${tableAlias}.notional_volume_usd, ${tableAlias}.open_interest_usd, ${tableAlias}.status,
      pd.question, pc.category, pc.subcategory, kd.title, kd.category, kd.subcategory
  `;
}

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
    ? `AND source = '${params.source}'`
    : "";
  const statusFilter = params?.status
    ? `AND status = '${params.status}'`
    : "";

  const sql = `
    WITH ${UNIFIED_RAW_CTE},
    filtered AS (
      SELECT * FROM unified_raw
      WHERE (notional_volume_usd > 0 OR open_interest_usd > 0)
        ${sourceFilter} ${statusFilter}
      ORDER BY ${sort}
      LIMIT ${limit}
    )
    ${enrichmentSelect("f")}
    ORDER BY f.notional_volume_usd DESC
  `;

  const rows = await queryClickHouse<Record<string, string>>(sql);
  return rows.map(parseMarketRow);
}

/**
 * Category breakdown with per-platform OI/volume.
 * Replaces getCategoryMetrics (Hermod) + getKalshiCategoryOI (ClickHouse).
 */
export async function getCategoryBreakdown(): Promise<CHCategoryRow[]> {
  // Two separate queries — each is simple and fast, no cross-platform JOINs
  const polySql = `
    WITH pl AS (SELECT max(date) AS d FROM polymarket_polygon.market_report_daily_v5)
    SELECT
      'Polymarket' AS source,
      coalesce(c.category, '') AS category,
      coalesce(c.subcategory, '') AS subcategory,
      sum(r.notional_volume_usd) AS volume,
      sum(r.open_interest_usd) AS oi,
      count(DISTINCT r.condition_id) AS market_count
    FROM polymarket_polygon.market_report_daily_v5 r
    CROSS JOIN pl
    LEFT JOIN polymarket_polygon.market_category_v3 c ON r.condition_id = c.condition_id
    WHERE r.date = pl.d AND (r.notional_volume_usd > 0 OR r.open_interest_usd > 0)
    GROUP BY c.category, c.subcategory
    ORDER BY oi DESC
  `;

  const kalshiSql = `
    WITH kl AS (SELECT max(date) AS d FROM kalshi.market_daily_categorized)
    SELECT
      'Kalshi' AS source,
      category,
      subcategory,
      sum(daily_volume_usd) AS volume,
      sum(open_interest_usd) AS oi,
      count(DISTINCT market_ticker) AS market_count
    FROM kalshi.market_daily_categorized k
    CROSS JOIN kl
    WHERE k.date = kl.d AND (k.daily_volume_usd > 0 OR k.open_interest_usd > 0)
    GROUP BY category, subcategory
    ORDER BY oi DESC
  `;

  const [polyRows, kalshiRows] = await Promise.all([
    queryClickHouse<Record<string, string>>(polySql),
    queryClickHouse<Record<string, string>>(kalshiSql),
  ]);

  const parse = (r: Record<string, string>) => ({
    source: r.source,
    category: normalizeCHCategory(r.category),
    subcategory: r.subcategory || "Other",
    volume: parseFloat(r.volume) || 0,
    oi: parseFloat(r.oi) || 0,
    market_count: parseInt(r.market_count) || 0,
  });

  return [...polyRows.map(parse), ...kalshiRows.map(parse)];
}

/**
 * Dashboard totals per platform.
 * Replaces manual reduce() over ranking arrays.
 */
export async function getDashboardTotals(): Promise<CHDashboardTotals[]> {
  const sql = `
    WITH ${UNIFIED_RAW_CTE}
    SELECT
      source,
      sum(notional_volume_usd) AS total_volume,
      sum(open_interest_usd) AS total_oi,
      count() AS market_count
    FROM unified_raw
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
  const sql = `
    WITH ${UNIFIED_RAW_CTE},
    filtered AS (
      SELECT * FROM unified_raw
      WHERE notional_volume_usd > 0 OR open_interest_usd > 0
      ORDER BY greatest(open_interest_usd, notional_volume_usd) DESC
      LIMIT ${limit}
    )
    ${enrichmentSelect("f")}
    ORDER BY greatest(f.open_interest_usd, f.notional_volume_usd) DESC
  `;

  const rows = await queryClickHouse<Record<string, string>>(sql);
  return rows.map(parseMarketRow);
}

// ─── Market Detail types & functions ────────────────────────────

export interface CHPriceRow {
  date: string;
  yes: number;
  no: number;
}

export interface CHOIRow {
  date: string;
  oi: number;
}

export interface CHTradeRow {
  time: string;
  side: string;
  price: number;
  amount: number;
  txHash?: string;
}

export interface CHMarketMetadata {
  title: string;
  status: string;
  link: string;
  category: string;
}

function timeRangeToDays(tr: string): number {
  switch (tr) {
    case "7d": return 7;
    case "30d": return 30;
    case "90d": return 90;
    case "180d": return 180;
    case "1y": return 365;
    case "all": return 3650;
    default: return 30;
  }
}

/**
 * Price history for a single market. Pivots Yes/No rows into columns.
 * Polymarket: hourly for <=30d, daily for >30d.
 * Kalshi: aggregated from kalshi_trades by day.
 */
export async function getMarketPrices(
  platform: "polymarket" | "kalshi",
  marketId: string,
  timeRange: string
): Promise<CHPriceRow[]> {
  const days = timeRangeToDays(timeRange);
  const safeId = marketId.replace(/'/g, "");

  if (platform === "polymarket") {
    if (days <= 30) {
      const sql = `
        SELECT
          formatDateTime(block_hour, '%Y-%m-%d %H:00') AS date,
          maxIf(price, outcome_label = 'Yes') AS yes,
          maxIf(price, outcome_label = 'No') AS no
        FROM agent.polymarket_market_prices_hourly
        WHERE condition_id = '${safeId}'
          AND block_hour >= now() - INTERVAL ${days} DAY
        GROUP BY block_hour
        ORDER BY block_hour
      `;
      const rows = await queryClickHouse<Record<string, string>>(sql);
      return rows.map(parsePriceRow);
    } else {
      const sql = `
        SELECT
          toString(block_date) AS date,
          maxIf(close, outcome_label = 'Yes') AS yes,
          maxIf(close, outcome_label = 'No') AS no
        FROM agent.polymarket_market_prices_daily
        WHERE condition_id = '${safeId}'
          AND block_date >= today() - ${days}
        GROUP BY block_date
        ORDER BY block_date
      `;
      const rows = await queryClickHouse<Record<string, string>>(sql);
      return rows.map(parsePriceRow);
    }
  } else {
    // Kalshi: aggregate from kalshi_trades
    const sql = `
      SELECT
        toString(trade_date) AS date,
        avg(yes_price) AS yes,
        avg(no_price) AS no
      FROM agent.kalshi_trades
      WHERE ticker = '${safeId}'
        AND trade_date >= today() - ${days}
      GROUP BY trade_date
      ORDER BY trade_date
      SETTINGS max_execution_time = 120
    `;
    const rows = await queryClickHouse<Record<string, string>>(sql);
    return rows.map(parsePriceRow);
  }
}

/**
 * Open interest history for a single market.
 */
export async function getMarketOI(
  platform: "polymarket" | "kalshi",
  marketId: string,
  timeRange: string
): Promise<CHOIRow[]> {
  const days = timeRangeToDays(timeRange);
  const safeId = marketId.replace(/'/g, "");

  if (platform === "polymarket") {
    const sql = `
      SELECT
        toString(block_date) AS date,
        max(open_interest_usd) AS oi
      FROM polymarket_polygon.market_open_interest_daily
      WHERE condition_id = '${safeId}'
        AND block_date >= today() - ${days}
      GROUP BY block_date
      ORDER BY block_date
    `;
    const rows = await queryClickHouse<Record<string, string>>(sql);
    return rows.map((r) => ({
      date: r.date,
      oi: parseFloat(r.oi) || 0,
    }));
  } else {
    const sql = `
      SELECT
        toString(date) AS date,
        max(open_interest) AS oi
      FROM agent.kalshi_market_report
      WHERE market_ticker = '${safeId}'
        AND date >= today() - ${days}
      GROUP BY date
      ORDER BY date
      SETTINGS max_execution_time = 120
    `;
    const rows = await queryClickHouse<Record<string, string>>(sql);
    return rows.map((r) => ({
      date: r.date,
      oi: parseFloat(r.oi) || 0,
    }));
  }
}

/**
 * Recent trades for a single market.
 */
export async function getMarketTrades(
  platform: "polymarket" | "kalshi",
  marketId: string,
  limit = 20
): Promise<CHTradeRow[]> {
  const safeId = marketId.replace(/'/g, "");

  if (platform === "polymarket") {
    const sql = `
      SELECT
        formatDateTime(block_time, '%b %e, %l:%M%p') AS time,
        outcome_label AS side,
        price,
        amount_usd AS amount,
        tx_hash AS txHash
      FROM agent.polymarket_market_trades
      WHERE condition_id = '${safeId}'
      ORDER BY block_time DESC
      LIMIT ${limit}
    `;
    const rows = await queryClickHouse<Record<string, string>>(sql);
    return rows.map((r) => ({
      time: r.time,
      side: r.side,
      price: parseFloat(r.price) || 0,
      amount: parseFloat(r.amount) || 0,
      txHash: r.txHash || undefined,
    }));
  } else {
    const sql = `
      SELECT
        formatDateTime(created_time, '%b %e, %l:%M%p') AS time,
        if(yes_price > no_price, 'Yes', 'No') AS side,
        greatest(yes_price, no_price) AS price,
        num_contracts AS amount
      FROM agent.kalshi_trades
      WHERE ticker = '${safeId}'
      ORDER BY created_time DESC
      LIMIT ${limit}
      SETTINGS max_execution_time = 60
    `;
    const rows = await queryClickHouse<Record<string, string>>(sql);
    return rows.map((r) => ({
      time: r.time,
      side: r.side,
      price: parseFloat(r.price) || 0,
      amount: parseFloat(r.amount) || 0,
    }));
  }
}

/**
 * Market metadata for both platforms.
 * Fixes the "Polymarket Market" title bug by reading from polymarket_market_details.
 */
export async function getMarketMetadata(
  platform: "polymarket" | "kalshi",
  marketId: string
): Promise<CHMarketMetadata | null> {
  const safeId = marketId.replace(/'/g, "");

  if (platform === "polymarket") {
    const sql = `
      SELECT
        any(question) AS title,
        any(status) AS status,
        any(category) AS category
      FROM agent.polymarket_market_details
      WHERE condition_id = '${safeId}'
    `;
    const rows = await queryClickHouse<Record<string, string>>(sql);
    if (rows.length === 0 || !rows[0].title) return null;
    return {
      title: rows[0].title,
      status: rows[0].status || "",
      category: normalizeCHCategory(rows[0].category),
      link: `https://polymarket.com/event/${safeId}`,
    };
  } else {
    const sql = `
      SELECT
        any(title) AS title,
        any(status) AS status,
        any(category) AS category
      FROM agent.kalshi_market_report
      WHERE market_ticker = '${safeId}'
      SETTINGS max_execution_time = 60
    `;
    const rows = await queryClickHouse<Record<string, string>>(sql);
    if (rows.length === 0 || !rows[0].title) return null;
    return {
      title: rows[0].title,
      status: rows[0].status || "",
      category: normalizeCHCategory(rows[0].category),
      link: `https://kalshi.com/markets/${(safeId || "").toLowerCase()}`,
    };
  }
}

// ─── Whale Tracker types & functions ────────────────────────────

export interface CHWhaleTradeRow {
  platform: string;
  market_id: string;
  title: string;
  side: string;
  price: number;
  amount: number;
  time: string;
  txHash?: string;
}

export interface CHTopTraderRow {
  address: string;
  trade_count: number;
  total_volume: number;
  market_count: number;
  avg_size: number;
}

export interface CHHotMarketRow {
  market_id: string;
  title: string;
  platform: string;
  trade_count: number;
  volume: number;
  unique_traders: number;
}

/**
 * Largest trades across both platforms in the given window.
 */
export async function getWhaleTrades(
  days = 7,
  limit = 50
): Promise<CHWhaleTradeRow[]> {
  // Find top trades first, then resolve titles in a subquery
  const polySql = `
    WITH top_trades AS (
      SELECT
        condition_id AS market_id,
        outcome_label AS side,
        price,
        amount_usd AS amount,
        formatDateTime(block_time, '%Y-%m-%d %H:%M') AS time,
        tx_hash AS txHash
      FROM agent.polymarket_market_trades
      WHERE block_time >= now() - INTERVAL ${days} DAY
        AND amount_usd >= 1000
      ORDER BY amount_usd DESC
      LIMIT ${limit}
    )
    SELECT
      'Polymarket' AS platform,
      t.market_id,
      coalesce(any(d.question), t.market_id) AS title,
      t.side, t.price, t.amount, t.time, t.txHash
    FROM top_trades t
    LEFT JOIN agent.polymarket_market_details d ON t.market_id = d.condition_id
    GROUP BY t.market_id, t.side, t.price, t.amount, t.time, t.txHash
    ORDER BY t.amount DESC
  `;

  // Kalshi: only scan recent trades, skip the JOIN (ticker IS the title)
  const kalshiSql = `
    SELECT
      'Kalshi' AS platform,
      ticker AS market_id,
      ticker AS title,
      if(yes_price > no_price, 'Yes', 'No') AS side,
      greatest(yes_price, no_price) AS price,
      num_contracts AS amount,
      formatDateTime(created_time, '%Y-%m-%d %H:%M') AS time
    FROM agent.kalshi_trades
    WHERE trade_date >= today() - ${days}
      AND num_contracts >= 100
    ORDER BY num_contracts DESC
    LIMIT ${limit}
    SETTINGS max_execution_time = 120
  `;

  const [polyRows, kalshiRows] = await Promise.all([
    queryClickHouse<Record<string, string>>(polySql),
    queryClickHouse<Record<string, string>>(kalshiSql),
  ]);

  const all: CHWhaleTradeRow[] = [
    ...polyRows.map((r) => ({
      platform: r.platform,
      market_id: r.market_id,
      title: r.title,
      side: r.side,
      price: parseFloat(r.price) || 0,
      amount: parseFloat(r.amount) || 0,
      time: r.time,
      txHash: r.txHash || undefined,
    })),
    ...kalshiRows.map((r) => ({
      platform: r.platform,
      market_id: r.market_id,
      title: r.title,
      side: r.side,
      price: parseFloat(r.price) || 0,
      amount: parseFloat(r.amount) || 0,
      time: r.time,
    })),
  ];

  // Sort combined by amount descending, take top N
  all.sort((a, b) => b.amount - a.amount);
  return all.slice(0, limit);
}

/**
 * Top traders by volume (Polymarket only — has taker_address).
 */
export async function getTopTraders(
  days = 7,
  limit = 50,
  sortBy: "volume" | "count" = "volume"
): Promise<CHTopTraderRow[]> {
  const orderCol = sortBy === "count" ? "trade_count" : "total_volume";
  const sql = `
    SELECT
      taker_address AS address,
      count() AS trade_count,
      sum(amount_usd) AS total_volume,
      uniq(condition_id) AS market_count,
      avg(amount_usd) AS avg_size
    FROM agent.polymarket_market_trades
    WHERE block_time >= now() - INTERVAL ${days} DAY
      AND amount_usd > 0
    GROUP BY taker_address
    ORDER BY ${orderCol} DESC
    LIMIT ${limit}
  `;

  const rows = await queryClickHouse<Record<string, string>>(sql);
  return rows.map((r) => ({
    address: r.address,
    trade_count: parseInt(r.trade_count) || 0,
    total_volume: parseFloat(r.total_volume) || 0,
    market_count: parseInt(r.market_count) || 0,
    avg_size: parseFloat(r.avg_size) || 0,
  }));
}

/**
 * Most active markets by trade count & volume.
 */
export async function getHotMarkets(
  days = 1,
  limit = 30
): Promise<CHHotMarketRow[]> {
  const sql = `
    WITH agg AS (
      SELECT
        condition_id AS market_id,
        count() AS trade_count,
        sum(amount_usd) AS volume,
        uniq(taker_address) AS unique_traders
      FROM agent.polymarket_market_trades
      WHERE block_time >= now() - INTERVAL ${days} DAY
        AND amount_usd > 0
      GROUP BY condition_id
      ORDER BY volume DESC
      LIMIT ${limit}
    )
    SELECT
      a.market_id,
      coalesce(any(d.question), a.market_id) AS title,
      'Polymarket' AS platform,
      a.trade_count,
      a.volume,
      a.unique_traders
    FROM agg a
    LEFT JOIN agent.polymarket_market_details d ON a.market_id = d.condition_id
    GROUP BY a.market_id, a.trade_count, a.volume, a.unique_traders
    ORDER BY a.volume DESC
  `;

  const rows = await queryClickHouse<Record<string, string>>(sql);
  return rows.map((r) => ({
    market_id: r.market_id,
    title: r.title,
    platform: r.platform,
    trade_count: parseInt(r.trade_count) || 0,
    volume: parseFloat(r.volume) || 0,
    unique_traders: parseInt(r.unique_traders) || 0,
  }));
}

// ─── Time Series types & functions ────────────────────────────

export interface CHCategoryTimeSeriesRow {
  date: string;
  category: string;
  source: string;
  volume: number;
  oi: number;
}

export interface CHDashboardTotalsTimeSeriesRow {
  date: string;
  source: string;
  total_volume: number;
  total_oi: number;
  market_count: number;
}

/**
 * Daily category-level OI/volume for time dimension charts.
 * Two parallel queries (Polymarket + Kalshi), merged.
 */
export async function getCategoryTimeSeries(
  days: number
): Promise<CHCategoryTimeSeriesRow[]> {
  const polySql = `
    SELECT
      toString(r.date) AS date,
      coalesce(c.category, '') AS category,
      'Polymarket' AS source,
      sum(r.notional_volume_usd) AS volume,
      sum(r.open_interest_usd) AS oi
    FROM polymarket_polygon.market_report_daily_v5 r
    LEFT JOIN polymarket_polygon.market_category_v3 c ON r.condition_id = c.condition_id
    WHERE r.date >= today() - ${days}
      AND (r.notional_volume_usd > 0 OR r.open_interest_usd > 0)
    GROUP BY r.date, c.category
    ORDER BY r.date
  `;

  const kalshiSql = `
    SELECT
      toString(k.date) AS date,
      k.category,
      'Kalshi' AS source,
      sum(k.daily_volume_usd) AS volume,
      sum(k.open_interest_usd) AS oi
    FROM kalshi.market_daily_categorized k
    WHERE k.date >= today() - ${days}
      AND (k.daily_volume_usd > 0 OR k.open_interest_usd > 0)
    GROUP BY k.date, k.category
    ORDER BY k.date
    SETTINGS max_execution_time = 60
  `;

  const [polyRows, kalshiRows] = await Promise.all([
    queryClickHouse<Record<string, string>>(polySql),
    queryClickHouse<Record<string, string>>(kalshiSql),
  ]);

  const parse = (r: Record<string, string>): CHCategoryTimeSeriesRow => ({
    date: r.date,
    category: normalizeCHCategory(r.category),
    source: r.source,
    volume: parseFloat(r.volume) || 0,
    oi: parseFloat(r.oi) || 0,
  });

  return [...polyRows.map(parse), ...kalshiRows.map(parse)];
}

/**
 * Daily totals per platform for sparklines and trend calculations.
 */
export async function getDashboardTotalsTimeSeries(
  days: number
): Promise<CHDashboardTotalsTimeSeriesRow[]> {
  const polySql = `
    SELECT
      toString(r.date) AS date,
      'Polymarket' AS source,
      sum(r.notional_volume_usd) AS total_volume,
      sum(r.open_interest_usd) AS total_oi,
      count(DISTINCT r.condition_id) AS market_count
    FROM polymarket_polygon.market_report_daily_v5 r
    WHERE r.date >= today() - ${days}
      AND r.status IN ('open', 'active')
    GROUP BY r.date
    ORDER BY r.date
  `;

  const kalshiSql = `
    SELECT
      toString(k.date) AS date,
      'Kalshi' AS source,
      sum(k.daily_volume_usd) AS total_volume,
      sum(k.open_interest_usd) AS total_oi,
      count(DISTINCT k.market_ticker) AS market_count
    FROM kalshi.market_daily_categorized k
    WHERE k.date >= today() - ${days}
      AND k.status IN ('active', 'open')
    GROUP BY k.date
    ORDER BY k.date
    SETTINGS max_execution_time = 60
  `;

  const [polyRows, kalshiRows] = await Promise.all([
    queryClickHouse<Record<string, string>>(polySql),
    queryClickHouse<Record<string, string>>(kalshiSql),
  ]);

  const parse = (
    r: Record<string, string>
  ): CHDashboardTotalsTimeSeriesRow => ({
    date: r.date,
    source: r.source,
    total_volume: parseFloat(r.total_volume) || 0,
    total_oi: parseFloat(r.total_oi) || 0,
    market_count: parseInt(r.market_count) || 0,
  });

  return [...polyRows.map(parse), ...kalshiRows.map(parse)];
}

// ─── Daily Active Wallets ────────────────────────────────────────

export interface CHDailyActiveWalletsRow {
  day: string;
  dau: number;
}

/**
 * Daily unique traders on Polymarket for sparkline + trend.
 */
export async function getDailyActiveWallets(
  days = 30
): Promise<CHDailyActiveWalletsRow[]> {
  const sql = `
    SELECT
      toString(toDate(block_time)) AS day,
      uniq(taker_address) AS dau
    FROM agent.polymarket_market_trades
    WHERE block_time >= today() - ${days}
    GROUP BY toDate(block_time)
    ORDER BY day
  `;

  const rows = await queryClickHouse<Record<string, string>>(sql);
  return rows.map((r) => ({
    day: r.day,
    dau: parseInt(r.dau) || 0,
  }));
}

// ─── Market Search ──────────────────────────────────────────────

/**
 * Search markets by keyword across both platforms.
 */
export async function searchMarkets(
  query: string,
  limit = 50
): Promise<CHMarketRow[]> {
  const safeQ = query.replace(/'/g, "");

  const polySql = `
    WITH poly_ld AS (
      SELECT max(date) AS d FROM polymarket_polygon.market_report_daily_v5
    ),
    poly_agg AS (
      SELECT condition_id, sum(notional_volume_usd) AS notional_volume_usd,
        sum(open_interest_usd) AS open_interest_usd, any(status) AS status
      FROM polymarket_polygon.market_report_daily_v5
      WHERE date = (SELECT d FROM poly_ld)
      GROUP BY condition_id
    )
    SELECT
      'Polymarket' AS source,
      d.condition_id AS market_id,
      d.question AS title,
      coalesce(c.category, '') AS category,
      coalesce(c.subcategory, '') AS subcategory,
      coalesce(r.notional_volume_usd, 0) AS notional_volume_usd,
      coalesce(r.open_interest_usd, 0) AS open_interest_usd,
      coalesce(r.status, '') AS status
    FROM agent.polymarket_market_details d
    LEFT JOIN polymarket_polygon.market_category_v3 c ON d.condition_id = c.condition_id
    LEFT JOIN poly_agg r ON d.condition_id = r.condition_id
    WHERE d.question ILIKE '%${safeQ}%'
    ORDER BY greatest(coalesce(r.open_interest_usd, 0), coalesce(r.notional_volume_usd, 0)) DESC
    LIMIT ${limit}
  `;

  const kalshiSql = `
    WITH kalshi_ld AS (
      SELECT max(date) AS d FROM kalshi.market_daily_categorized
    )
    SELECT
      'Kalshi' AS source,
      k.market_ticker AS market_id,
      any(k.title) AS title,
      any(k.category) AS category,
      any(k.subcategory) AS subcategory,
      toFloat64(any(k.daily_volume_usd)) AS notional_volume_usd,
      toFloat64(any(k.open_interest_usd)) AS open_interest_usd,
      any(k.status) AS status
    FROM kalshi.market_daily_categorized k
    WHERE k.date = (SELECT d FROM kalshi_ld)
      AND k.title ILIKE '%${safeQ}%'
    GROUP BY k.market_ticker
    ORDER BY greatest(any(k.open_interest_usd), any(k.daily_volume_usd)) DESC
    LIMIT ${limit}
  `;

  const [polyRows, kalshiRows] = await Promise.all([
    queryClickHouse<Record<string, string>>(polySql),
    queryClickHouse<Record<string, string>>(kalshiSql),
  ]);

  const all = [
    ...polyRows.map(parseMarketRow),
    ...kalshiRows.map(parseMarketRow),
  ];

  all.sort(
    (a, b) =>
      Math.max(b.open_interest_usd, b.notional_volume_usd) -
      Math.max(a.open_interest_usd, a.notional_volume_usd)
  );
  return all.slice(0, limit);
}

// ─── Wallet Lookup types & functions ─────────────────────────────

export interface CHWalletStatsRow {
  address: string;
  trade_count: number;
  total_volume: number;
  market_count: number;
  avg_size: number;
  first_trade: string;
  last_trade: string;
}

export interface CHWalletTradeHistoryRow {
  market_id: string;
  title: string;
  side: string;
  price: number;
  amount: number;
  time: string;
  tx_hash: string;
}

/**
 * Aggregate stats for a single wallet address (Polymarket).
 */
export async function getWalletStats(
  address: string
): Promise<CHWalletStatsRow | null> {
  const safeAddr = address.replace(/'/g, "").toLowerCase();
  const sql = `
    SELECT
      taker_address AS address,
      count() AS trade_count,
      sum(amount_usd) AS total_volume,
      uniq(condition_id) AS market_count,
      avg(amount_usd) AS avg_size,
      formatDateTime(min(block_time), '%Y-%m-%d') AS first_trade,
      formatDateTime(max(block_time), '%Y-%m-%d') AS last_trade
    FROM agent.polymarket_market_trades
    WHERE lower(taker_address) = '${safeAddr}'
    GROUP BY taker_address
  `;

  const rows = await queryClickHouse<Record<string, string>>(sql);
  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    address: r.address,
    trade_count: parseInt(r.trade_count) || 0,
    total_volume: parseFloat(r.total_volume) || 0,
    market_count: parseInt(r.market_count) || 0,
    avg_size: parseFloat(r.avg_size) || 0,
    first_trade: r.first_trade,
    last_trade: r.last_trade,
  };
}

/**
 * Recent trades for a single wallet address (Polymarket).
 */
export async function getWalletTrades(
  address: string,
  limit = 50
): Promise<CHWalletTradeHistoryRow[]> {
  const safeAddr = address.replace(/'/g, "").toLowerCase();
  const sql = `
    WITH trades AS (
      SELECT condition_id, outcome_label, price, amount_usd, block_time, tx_hash
      FROM agent.polymarket_market_trades
      WHERE lower(taker_address) = '${safeAddr}'
      ORDER BY block_time DESC
      LIMIT ${limit}
    )
    SELECT
      t.condition_id AS market_id,
      coalesce(any(d.question), t.condition_id) AS title,
      t.outcome_label AS side,
      t.price,
      t.amount_usd AS amount,
      formatDateTime(t.block_time, '%Y-%m-%d %H:%M') AS time,
      t.tx_hash
    FROM trades t
    LEFT JOIN agent.polymarket_market_details d ON t.condition_id = d.condition_id
    GROUP BY t.condition_id, t.outcome_label, t.price, t.amount_usd, t.block_time, t.tx_hash
    ORDER BY t.block_time DESC
  `;

  const rows = await queryClickHouse<Record<string, string>>(sql);
  return rows.map((r) => ({
    market_id: r.market_id,
    title: r.title,
    side: r.side,
    price: parseFloat(r.price) || 0,
    amount: parseFloat(r.amount) || 0,
    time: r.time,
    tx_hash: r.tx_hash || "",
  }));
}

// ─── Wallet Retention types & functions ─────────────────────────

export interface CHRetentionRow {
  cohort_week: string;
  week_number: number;
  active_wallets: number;
}

export interface CHWalletGrowthRow {
  week: string;
  new_wallets: number;
  returning_wallets: number;
  total_active: number;
}

export interface CHWalletLifecycleRow {
  segment: string;
  wallet_count: number;
  avg_trades: number;
  avg_volume: number;
}

/**
 * Weekly cohort retention matrix (Polymarket only — has taker_address).
 */
export async function getWalletRetention(): Promise<CHRetentionRow[]> {
  const sql = `
    WITH user_first_week AS (
      SELECT taker_address, toMonday(min(block_time)) AS cohort_week
      FROM agent.polymarket_market_trades
      WHERE block_time >= today() - 180
      GROUP BY taker_address
    ),
    weekly_activity AS (
      SELECT taker_address, toMonday(block_time) AS active_week
      FROM agent.polymarket_market_trades
      WHERE block_time >= today() - 180
      GROUP BY taker_address, active_week
    )
    SELECT
      toString(uf.cohort_week) AS cohort_week,
      toUInt32(dateDiff('week', uf.cohort_week, wa.active_week)) AS week_number,
      count(DISTINCT wa.taker_address) AS active_wallets
    FROM user_first_week uf
    JOIN weekly_activity wa ON uf.taker_address = wa.taker_address
    WHERE wa.active_week >= uf.cohort_week
    GROUP BY uf.cohort_week, week_number
    ORDER BY uf.cohort_week, week_number
    SETTINGS max_execution_time = 300
  `;

  const rows = await queryClickHouse<Record<string, string>>(sql);
  return rows.map((r) => ({
    cohort_week: r.cohort_week,
    week_number: parseInt(r.week_number) || 0,
    active_wallets: parseInt(r.active_wallets) || 0,
  }));
}

/**
 * New vs returning wallets per week (Polymarket only).
 */
export async function getWalletGrowth(
  days = 90
): Promise<CHWalletGrowthRow[]> {
  const sql = `
    WITH first_trades AS (
      SELECT taker_address, toMonday(min(block_time)) AS first_week
      FROM agent.polymarket_market_trades
      GROUP BY taker_address
    ),
    weekly AS (
      SELECT taker_address, toMonday(block_time) AS week
      FROM agent.polymarket_market_trades
      WHERE block_time >= today() - ${days}
      GROUP BY taker_address, week
    )
    SELECT
      toString(w.week) AS week,
      countIf(f.first_week = w.week) AS new_wallets,
      countIf(f.first_week < w.week) AS returning_wallets,
      count(DISTINCT w.taker_address) AS total_active
    FROM weekly w
    JOIN first_trades f ON w.taker_address = f.taker_address
    GROUP BY w.week
    ORDER BY w.week
    SETTINGS max_execution_time = 300
  `;

  const rows = await queryClickHouse<Record<string, string>>(sql);
  return rows.map((r) => ({
    week: r.week,
    new_wallets: parseInt(r.new_wallets) || 0,
    returning_wallets: parseInt(r.returning_wallets) || 0,
    total_active: parseInt(r.total_active) || 0,
  }));
}

/**
 * Wallet lifecycle segmentation (Polymarket only).
 */
export async function getWalletLifecycle(): Promise<CHWalletLifecycleRow[]> {
  const sql = `
    SELECT
      segment,
      count() AS wallet_count,
      avg(lifetime_trades) AS avg_trades,
      avg(lifetime_volume) AS avg_volume
    FROM (
      SELECT
        taker_address,
        count() AS lifetime_trades,
        sum(amount_usd) AS lifetime_volume,
        max(block_time) AS last_trade,
        CASE
          WHEN dateDiff('day', max(block_time), now()) <= 7 THEN 'Active (7d)'
          WHEN dateDiff('day', max(block_time), now()) <= 30 THEN 'At Risk (8-30d)'
          WHEN dateDiff('day', max(block_time), now()) <= 90 THEN 'Dormant (31-90d)'
          ELSE 'Churned (90d+)'
        END AS segment
      FROM agent.polymarket_market_trades
      GROUP BY taker_address
      HAVING lifetime_trades < 1000000
    )
    GROUP BY segment
    ORDER BY segment
    SETTINGS max_execution_time = 300
  `;

  const rows = await queryClickHouse<Record<string, string>>(sql);
  return rows.map((r) => ({
    segment: r.segment,
    wallet_count: parseInt(r.wallet_count) || 0,
    avg_trades: parseFloat(r.avg_trades) || 0,
    avg_volume: parseFloat(r.avg_volume) || 0,
  }));
}

// ─── Subcategory Market Drill-down ──────────────────────────────

export interface CHSubcategoryMarket {
  source: string;
  title: string;
  oi: number;
  volume: number;
}

export async function getSubcategoryMarkets(
  category: string,
  subcategory: string,
  platform: "both" | "polymarket" | "kalshi" = "both",
  limit = 20
): Promise<CHSubcategoryMarket[]> {
  const safeCat = category.replace(/'/g, "''");
  const safeSub = subcategory.replace(/'/g, "''");
  const results: CHSubcategoryMarket[] = [];

  if (platform !== "kalshi") {
    const sql = `
      WITH pl AS (SELECT max(date) AS d FROM polymarket_polygon.market_report_daily_v5)
      SELECT
        coalesce(any(pd.question), r.condition_id) AS title,
        sum(r.open_interest_usd) AS oi,
        sum(r.notional_volume_usd) AS volume
      FROM polymarket_polygon.market_report_daily_v5 r
      CROSS JOIN pl
      LEFT JOIN polymarket_polygon.market_category_v3 c ON r.condition_id = c.condition_id
      LEFT JOIN polymarket_polygon.market_details pd ON r.condition_id = pd.condition_id
      WHERE r.date = pl.d
        AND coalesce(c.category, '') = '${safeCat}'
        AND coalesce(c.subcategory, '') = '${safeSub}'
        AND (r.notional_volume_usd > 0 OR r.open_interest_usd > 0)
      GROUP BY r.condition_id
      HAVING greatest(sum(r.open_interest_usd), sum(r.notional_volume_usd)) > 0
      ORDER BY greatest(sum(r.open_interest_usd), sum(r.notional_volume_usd)) DESC
      LIMIT ${limit}
    `;
    const rows = await queryClickHouse<Record<string, string>>(sql);
    results.push(
      ...rows.map((r) => ({
        source: "Polymarket" as const,
        title: r.title || "Unknown",
        oi: parseFloat(r.oi) || 0,
        volume: parseFloat(r.volume) || 0,
      }))
    );
  }

  if (platform !== "polymarket") {
    const sql = `
      WITH kl AS (SELECT max(date) AS d FROM kalshi.market_daily_categorized)
      SELECT
        coalesce(any(k.title), k.market_ticker) AS title,
        toFloat64(sum(k.open_interest_usd)) AS oi,
        toFloat64(sum(k.daily_volume_usd)) AS volume
      FROM kalshi.market_daily_categorized k
      CROSS JOIN kl
      WHERE k.date = kl.d
        AND coalesce(k.category, '') = '${safeCat}'
        AND coalesce(k.subcategory, '') = '${safeSub}'
        AND (k.daily_volume_usd > 0 OR k.open_interest_usd > 0)
      GROUP BY k.market_ticker
      HAVING greatest(oi, volume) > 0
      ORDER BY greatest(oi, volume) DESC
      LIMIT ${limit}
    `;
    const rows = await queryClickHouse<Record<string, string>>(sql);
    results.push(
      ...rows.map((r) => ({
        source: "Kalshi" as const,
        title: r.title || "Unknown",
        oi: parseFloat(r.oi) || 0,
        volume: parseFloat(r.volume) || 0,
      }))
    );
  }

  return results
    .sort((a, b) => Math.max(b.oi, b.volume) - Math.max(a.oi, a.volume))
    .slice(0, limit);
}

// ─── Helpers ────────────────────────────────────────────────────

function parsePriceRow(r: Record<string, string>): CHPriceRow {
  return {
    date: r.date,
    yes: parseFloat(r.yes) || 0,
    no: parseFloat(r.no) || 0,
  };
}

function parseMarketRow(r: Record<string, string>): CHMarketRow {
  return {
    source: r.source,
    market_id: r.market_id || "",
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
