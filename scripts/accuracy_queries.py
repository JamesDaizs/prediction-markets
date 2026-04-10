"""
Compute prediction market accuracy by category at various time intervals
before resolution. Replicates PredictParity's analysis methodology.

Accuracy = % of markets where price-implied direction at T before resolution
matched the final outcome.
  - YES price > 0.50 at time T AND YES won → correct
  - YES price < 0.50 at time T AND NO won → correct
  - Exactly 0.50 → excluded

Also computes:
  - Calibration curves (20 probability buckets, predicted vs actual)
  - Brier scores (overall)
  - Resolution distribution (YES/NO split by platform)
"""

import json
import subprocess
import sys
from pathlib import Path

CH_QUERY = Path.home() / ".claude/work-skills/surf-data-clickhouse/scripts/ch-query"

CATEGORY_MAPPING_SQL = """
multiIf(
    c.category = 'Sports', 'Sports',
    c.category = 'Crypto', 'Crypto',
    c.category = 'Financials' AND c.subcategory = 'Stock Indices', 'Stock Index',
    c.category = 'Financials', 'Financials',
    c.category = 'Politics' AND c.subcategory = 'Military Conflicts', 'Geopolitics',
    c.category = 'Politics' AND c.subcategory = 'International Elections', 'Geopolitics',
    c.category = 'Politics', 'Politics',
    c.category = 'STEM' AND c.subcategory = 'Climate and Weather', 'Weather',
    c.category = 'STEM' AND c.subcategory = 'Health', 'Health',
    c.category = 'STEM', 'AI/Tech',
    c.category = 'Culture', 'Entertainment',
    c.category = 'Economics', 'Economics',
    'Other'
)
""".strip()

KALSHI_CATEGORY_MAPPING_SQL = """
multiIf(
    d.category = 'Sports', 'Sports',
    d.category = 'Crypto', 'Crypto',
    d.category = 'Financials' AND d.subcategory = 'Stock Indices', 'Stock Index',
    d.category = 'Financials', 'Financials',
    d.category = 'Politics', 'Politics',
    d.category = 'STEM' AND d.subcategory = 'Climate and Weather', 'Weather',
    d.category = 'STEM' AND d.subcategory = 'Health', 'Health',
    d.category = 'STEM', 'AI/Tech',
    d.category = 'Culture', 'Entertainment',
    d.category = 'Economics', 'Economics',
    'Other'
)
""".strip()

# Accuracy formula helper for SQL: correct prediction + has valid price
ACC_CORRECT = "(p{w} > 0.50 AND win = 0) OR (p{w} < 0.50 AND win = 1)"
ACC_VALID = "p{w} > 0 AND p{w} < 1 AND p{w} != 0.50"
ACC_CORRECT_K = "(p{w} > 0.50 AND result = 'yes') OR (p{w} < 0.50 AND result = 'no')"


def acc_cols_poly(windows: list[str]) -> str:
    """Generate accuracy + sample size columns for Polymarket."""
    lines = []
    for w in windows:
        c = ACC_CORRECT.format(w=w)
        v = ACC_VALID.format(w=w)
        # Numerator must also have validity guard to exclude argMaxIf default of 0
        lines.append(
            f"  round(countIf(({v}) AND ({c})) * 100.0 / nullIf(countIf({v}), 0), 1) as acc_{w},"
        )
        lines.append(f"  countIf({v}) as n_{w},")
    return "\n".join(lines)


def acc_cols_kalshi(windows: list[str]) -> str:
    """Generate accuracy + sample size columns for Kalshi."""
    lines = []
    for w in windows:
        c = ACC_CORRECT_K.format(w=w)
        v = ACC_VALID.format(w=w)
        lines.append(
            f"  round(countIf(({v}) AND ({c})) * 100.0 / nullIf(countIf({v}), 0), 1) as acc_{w},"
        )
        lines.append(f"  countIf({v}) as n_{w},")
    return "\n".join(lines)


POLYMARKET_HOURLY_SQL = f"""
SELECT
  mapped_category,
  count(*) as markets,
{acc_cols_poly(["4h", "12h", "1d"])}
  1 as _dummy
FROM (
  SELECT
    r.condition_id,
    r.win,
    r.mapped_category,
    argMaxIf(h.price, h.block_hour,
      h.block_hour <= toStartOfHour(r.resolved_at - INTERVAL 4 HOUR)
    ) as p4h,
    argMaxIf(h.price, h.block_hour,
      h.block_hour <= toStartOfHour(r.resolved_at - INTERVAL 12 HOUR)
    ) as p12h,
    argMaxIf(h.price, h.block_hour,
      h.block_hour <= toStartOfHour(r.resolved_at - INTERVAL 1 DAY)
    ) as p1d
  FROM (
    SELECT
      m.condition_id,
      m.winning_outcome_index as win,
      toDateTime(m.resolved_at) as resolved_at,
      {CATEGORY_MAPPING_SQL} as mapped_category
    FROM agent.polymarket_market_details m
    INNER JOIN agent.polymarket_market_category c
      ON m.condition_id = c.condition_id
    WHERE m.winning_outcome_index >= 0
      AND m.outcome_index = 0
  ) r
  LEFT JOIN agent.polymarket_market_prices_hourly h
    ON r.condition_id = h.condition_id AND h.outcome_index = 0
  GROUP BY r.condition_id, r.win, r.mapped_category
)
GROUP BY mapped_category
ORDER BY markets DESC
"""

POLYMARKET_DAILY_SQL = f"""
SELECT
  mapped_category,
  count(*) as markets,
{acc_cols_poly(["1w", "1mo"])}
  1 as _dummy
FROM (
  SELECT
    r.condition_id,
    r.win,
    r.mapped_category,
    argMaxIf(d.close, d.block_date,
      d.block_date <= toDate(r.resolved_at - INTERVAL 7 DAY)
    ) as p1w,
    argMaxIf(d.close, d.block_date,
      d.block_date <= toDate(r.resolved_at - INTERVAL 30 DAY)
    ) as p1mo
  FROM (
    SELECT
      m.condition_id,
      m.winning_outcome_index as win,
      toDateTime(m.resolved_at) as resolved_at,
      {CATEGORY_MAPPING_SQL} as mapped_category
    FROM agent.polymarket_market_details m
    INNER JOIN agent.polymarket_market_category c
      ON m.condition_id = c.condition_id
    WHERE m.winning_outcome_index >= 0
      AND m.outcome_index = 0
  ) r
  LEFT JOIN agent.polymarket_market_prices_daily d
    ON r.condition_id = d.condition_id AND d.outcome_index = 0
  GROUP BY r.condition_id, r.win, r.mapped_category
)
GROUP BY mapped_category
ORDER BY markets DESC
"""

# Kalshi accuracy: split into hourly (4h/12h/1d) and daily (1w/1mo)
# matching Polymarket's two-phase pattern.
# Uses kalshi_market_prices_hourly and kalshi_market_prices_daily
# (NOT kalshi_market_report which has no price column).

KALSHI_HOURLY_SQL = f"""
SELECT
  mapped_category,
  count(*) as markets,
{acc_cols_kalshi(["4h", "12h", "1d"])}
  1 as _dummy
FROM (
  SELECT
    d.market_ticker,
    d.result,
    {KALSHI_CATEGORY_MAPPING_SQL} as mapped_category,
    argMaxIf(h.close, h.block_hour,
      h.block_hour <= toStartOfHour(d.close_time - INTERVAL 4 HOUR)
    ) as p4h,
    argMaxIf(h.close, h.block_hour,
      h.block_hour <= toStartOfHour(d.close_time - INTERVAL 12 HOUR)
    ) as p12h,
    argMaxIf(h.close, h.block_hour,
      h.block_hour <= toStartOfHour(d.close_time - INTERVAL 1 DAY)
    ) as p1d
  FROM agent.kalshi_market_details d
  LEFT JOIN agent.kalshi_market_prices_hourly h
    ON d.market_ticker = h.ticker
  WHERE d.result IN ('yes', 'no')
  GROUP BY d.market_ticker, d.result, d.close_time, d.category, d.subcategory
)
GROUP BY mapped_category
ORDER BY markets DESC
SETTINGS max_execution_time = 600
"""

KALSHI_DAILY_SQL = f"""
SELECT
  mapped_category,
  count(*) as markets,
{acc_cols_kalshi(["1w", "1mo"])}
  1 as _dummy
FROM (
  SELECT
    d.market_ticker,
    d.result,
    {KALSHI_CATEGORY_MAPPING_SQL} as mapped_category,
    argMaxIf(p.close, p.block_date,
      p.block_date <= toDate(d.close_time) - 7
    ) as p1w,
    argMaxIf(p.close, p.block_date,
      p.block_date <= toDate(d.close_time) - 30
    ) as p1mo
  FROM agent.kalshi_market_details d
  LEFT JOIN agent.kalshi_market_prices_daily p
    ON d.market_ticker = p.ticker
  WHERE d.result IN ('yes', 'no')
  GROUP BY d.market_ticker, d.result, d.close_time, d.category, d.subcategory
)
GROUP BY mapped_category
ORDER BY markets DESC
SETTINGS max_execution_time = 600
"""

# --- Calibration: 20 probability buckets, predicted vs actual resolution ---

POLY_CALIBRATION_SQL = f"""
SELECT
  floor(p1d * 20) / 20 as bucket_low,
  floor(p1d * 20) / 20 + 0.05 as bucket_high,
  round(avg(p1d), 4) as avg_predicted,
  round(countIf(win = 0) / count(), 4) as actual_rate,
  count() as n
FROM (
  SELECT
    r.condition_id,
    r.win,
    argMaxIf(h.price, h.block_hour,
      h.block_hour <= toStartOfHour(r.resolved_at - INTERVAL 1 DAY)
    ) as p1d
  FROM (
    SELECT
      m.condition_id,
      m.winning_outcome_index as win,
      toDateTime(m.resolved_at) as resolved_at
    FROM agent.polymarket_market_details m
    WHERE m.winning_outcome_index >= 0
      AND m.outcome_index = 0
  ) r
  LEFT JOIN agent.polymarket_market_prices_hourly h
    ON r.condition_id = h.condition_id AND h.outcome_index = 0
  GROUP BY r.condition_id, r.win
)
WHERE p1d > 0 AND p1d < 1
GROUP BY bucket_low, bucket_high
ORDER BY bucket_low
"""

KALSHI_CALIBRATION_SQL = """
SELECT
  floor(p1d * 20) / 20 as bucket_low,
  floor(p1d * 20) / 20 + 0.05 as bucket_high,
  round(avg(p1d), 4) as avg_predicted,
  round(countIf(result = 'yes') / count(), 4) as actual_rate,
  count() as n
FROM (
  SELECT
    d.market_ticker,
    d.result,
    argMaxIf(h.close, h.block_hour,
      h.block_hour <= toStartOfHour(d.close_time - INTERVAL 1 DAY)
    ) as p1d
  FROM agent.kalshi_market_details d
  LEFT JOIN agent.kalshi_market_prices_hourly h
    ON d.market_ticker = h.ticker
  WHERE d.result IN ('yes', 'no')
  GROUP BY d.market_ticker, d.result, d.close_time
)
WHERE p1d > 0 AND p1d < 1
GROUP BY bucket_low, bucket_high
ORDER BY bucket_low
SETTINGS max_execution_time = 600
"""

# --- Brier score: mean((predicted - actual)^2) ---
# For Polymarket: actual = 1 - winning_outcome_index (0=YES won → actual=1)
# For Kalshi: actual = if(result='yes', 1, 0)

POLY_BRIER_SQL = f"""
SELECT
  'overall' as tier,
  round(avg(pow(p1d - (1 - win), 2)), 4) as brier_score,
  count() as n
FROM (
  SELECT
    r.condition_id,
    r.win,
    argMaxIf(h.price, h.block_hour,
      h.block_hour <= toStartOfHour(r.resolved_at - INTERVAL 1 DAY)
    ) as p1d
  FROM (
    SELECT
      m.condition_id,
      m.winning_outcome_index as win,
      toDateTime(m.resolved_at) as resolved_at
    FROM agent.polymarket_market_details m
    WHERE m.winning_outcome_index >= 0
      AND m.outcome_index = 0
  ) r
  LEFT JOIN agent.polymarket_market_prices_hourly h
    ON r.condition_id = h.condition_id AND h.outcome_index = 0
  GROUP BY r.condition_id, r.win
)
WHERE p1d > 0 AND p1d < 1
"""

KALSHI_BRIER_SQL = """
SELECT
  'overall' as tier,
  round(avg(pow(p1d - if(result = 'yes', 1, 0), 2)), 4) as brier_score,
  count() as n
FROM (
  SELECT
    d.market_ticker,
    d.result,
    argMaxIf(h.close, h.block_hour,
      h.block_hour <= toStartOfHour(d.close_time - INTERVAL 1 DAY)
    ) as p1d
  FROM agent.kalshi_market_details d
  LEFT JOIN agent.kalshi_market_prices_hourly h
    ON d.market_ticker = h.ticker
  WHERE d.result IN ('yes', 'no')
  GROUP BY d.market_ticker, d.result, d.close_time
)
WHERE p1d > 0 AND p1d < 1
SETTINGS max_execution_time = 600
"""

# --- Per-category Brier scores ---

POLY_BRIER_BY_CATEGORY_SQL = f"""
SELECT
  mapped_category,
  round(avg(pow(p1d - (1 - win), 2)), 4) as brier_score,
  count() as n
FROM (
  SELECT
    r.condition_id,
    r.win,
    r.mapped_category,
    argMaxIf(h.price, h.block_hour,
      h.block_hour <= toStartOfHour(r.resolved_at - INTERVAL 1 DAY)
    ) as p1d
  FROM (
    SELECT
      m.condition_id,
      m.winning_outcome_index as win,
      toDateTime(m.resolved_at) as resolved_at,
      {CATEGORY_MAPPING_SQL} as mapped_category
    FROM agent.polymarket_market_details m
    INNER JOIN agent.polymarket_market_category c
      ON m.condition_id = c.condition_id
    WHERE m.winning_outcome_index >= 0
      AND m.outcome_index = 0
  ) r
  LEFT JOIN agent.polymarket_market_prices_hourly h
    ON r.condition_id = h.condition_id AND h.outcome_index = 0
  GROUP BY r.condition_id, r.win, r.mapped_category
)
WHERE p1d > 0 AND p1d < 1
GROUP BY mapped_category
ORDER BY n DESC
"""

KALSHI_BRIER_BY_CATEGORY_SQL = f"""
SELECT
  mapped_category,
  round(avg(pow(p1d - if(result = 'yes', 1, 0), 2)), 4) as brier_score,
  count() as n
FROM (
  SELECT
    d.market_ticker,
    d.result,
    {KALSHI_CATEGORY_MAPPING_SQL} as mapped_category,
    argMaxIf(h.close, h.block_hour,
      h.block_hour <= toStartOfHour(d.close_time - INTERVAL 1 DAY)
    ) as p1d
  FROM agent.kalshi_market_details d
  LEFT JOIN agent.kalshi_market_prices_hourly h
    ON d.market_ticker = h.ticker
  WHERE d.result IN ('yes', 'no')
  GROUP BY d.market_ticker, d.result, d.close_time, d.category, d.subcategory
)
WHERE p1d > 0 AND p1d < 1
GROUP BY mapped_category
ORDER BY n DESC
SETTINGS max_execution_time = 600
"""

# --- Resolution distribution ---

POLY_RESOLUTION_SQL = """
SELECT
  countIf(winning_outcome_index = 0) as yes_count,
  countIf(winning_outcome_index = 1) as no_count,
  count() as total
FROM agent.polymarket_market_details
WHERE winning_outcome_index >= 0
  AND outcome_index = 0
"""

KALSHI_RESOLUTION_SQL = """
SELECT
  countIf(result = 'yes') as yes_count,
  countIf(result = 'no') as no_count,
  count() as total
FROM agent.kalshi_market_details
WHERE result IN ('yes', 'no')
"""



def run_query(sql: str, label: str) -> list[dict]:
    """Execute a ClickHouse query via ch-query and parse TSV output."""
    print(f"  Running {label}...", flush=True)
    result = subprocess.run(
        [str(CH_QUERY), "--instance", "surf", "--sql", sql],
        capture_output=True,
        text=True,
        timeout=600,
    )
    if result.returncode != 0:
        print(f"  ERROR in {label}: {result.stderr[:500]}", file=sys.stderr)
        return []

    lines = result.stdout.strip().split("\n")
    if len(lines) < 2:
        print(f"  WARNING: {label} returned no data", file=sys.stderr)
        return []

    headers = lines[0].split("\t")
    rows = []
    for line in lines[1:]:
        vals = line.split("\t")
        row = {}
        for h, v in zip(headers, vals):
            if h == "_dummy":
                continue
            if h in ("mapped_category", "result", "tier"):
                row[h] = v
            else:
                try:
                    row[h] = float(v) if "." in v else int(v)
                except ValueError:
                    row[h] = v
        rows.append(row)

    print(f"  {label}: {len(rows)} rows returned", flush=True)
    return rows


def merge_poly_results(
    hourly: list[dict], daily: list[dict], brier_by_cat: list[dict] | None = None
) -> list[dict]:
    """Merge hourly (4h/12h/1d) and daily (1w/1mo) Polymarket results."""
    daily_map = {r["mapped_category"]: r for r in daily}
    brier_map = {r["mapped_category"]: r for r in (brier_by_cat or [])}
    merged = []
    for h in hourly:
        cat = h["mapped_category"]
        d = daily_map.get(cat, {})
        b = brier_map.get(cat, {})
        merged.append(
            {
                "category": cat,
                "markets": h["markets"],
                "acc_4h": h.get("acc_4h"),
                "n_4h": h.get("n_4h", 0),
                "acc_12h": h.get("acc_12h"),
                "n_12h": h.get("n_12h", 0),
                "acc_1d": h.get("acc_1d"),
                "n_1d": h.get("n_1d", 0),
                "acc_1w": d.get("acc_1w"),
                "n_1w": d.get("n_1w", 0),
                "acc_1mo": d.get("acc_1mo"),
                "n_1mo": d.get("n_1mo", 0),
                "brier": b.get("brier_score"),
                "brier_n": b.get("n", 0),
            }
        )
    return sorted(merged, key=lambda x: x["markets"], reverse=True)


def format_kalshi(rows: list[dict], brier_by_cat: list[dict] | None = None) -> list[dict]:
    """Format Kalshi results."""
    brier_map = {r["mapped_category"]: r for r in (brier_by_cat or [])}
    result = []
    for r in rows:
        cat = r["mapped_category"]
        b = brier_map.get(cat, {})
        result.append(
            {
                "category": cat,
                "markets": r["markets"],
                "acc_4h": r.get("acc_4h"),
                "n_4h": r.get("n_4h", 0),
                "acc_12h": r.get("acc_12h"),
                "n_12h": r.get("n_12h", 0),
                "acc_1d": r.get("acc_1d"),
                "n_1d": r.get("n_1d", 0),
                "acc_1w": r.get("acc_1w"),
                "n_1w": r.get("n_1w", 0),
                "acc_1mo": r.get("acc_1mo"),
                "n_1mo": r.get("n_1mo", 0),
                "brier": b.get("brier_score"),
                "brier_n": b.get("n", 0),
            }
        )
    return sorted(result, key=lambda x: x["markets"], reverse=True)


def add_total_row(rows: list[dict]) -> list[dict]:
    """Add a 'Total' row that computes weighted accuracy across categories."""
    windows = ["4h", "12h", "1d", "1w", "1mo"]
    total = {"category": "Total", "markets": sum(r["markets"] for r in rows)}
    for w in windows:
        correct_sum = 0
        valid_sum = 0
        for r in rows:
            acc = r.get(f"acc_{w}")
            n = r.get(f"n_{w}", 0)
            if acc is not None and n > 0:
                correct_sum += acc / 100.0 * n
                valid_sum += n
        total[f"acc_{w}"] = round(correct_sum / valid_sum * 100, 1) if valid_sum > 0 else None
        total[f"n_{w}"] = valid_sum
    # Weighted Brier across categories
    brier_sum = 0.0
    brier_n_sum = 0
    for r in rows:
        b = r.get("brier")
        bn = r.get("brier_n", 0)
        if b is not None and bn > 0:
            brier_sum += b * bn
            brier_n_sum += bn
    total["brier"] = round(brier_sum / brier_n_sum, 4) if brier_n_sum > 0 else None
    total["brier_n"] = brier_n_sum
    return rows + [total]


def format_calibration(rows: list[dict]) -> list[dict]:
    """Format calibration bucket rows."""
    return [
        {
            "bucket_low": r["bucket_low"],
            "bucket_high": r["bucket_high"],
            "avg_predicted": r["avg_predicted"],
            "actual_rate": r["actual_rate"],
            "n": r["n"],
        }
        for r in rows
    ]


def format_brier(rows: list[dict], by_category: list[dict] | None = None) -> dict:
    """Format Brier score results."""
    if not rows:
        result = {"overall": None, "n": 0}
    else:
        r = rows[0]
        result = {"overall": r.get("brier_score"), "n": r.get("n", 0)}
    if by_category:
        result["per_category"] = [
            {"category": r["mapped_category"], "brier": r["brier_score"], "n": r["n"]}
            for r in by_category
        ]
    return result


def format_resolution(rows: list[dict]) -> dict:
    """Format resolution distribution."""
    if not rows:
        return {"yes": 0, "no": 0, "total": 0}
    r = rows[0]
    return {
        "yes": r.get("yes_count", 0),
        "no": r.get("no_count", 0),
        "total": r.get("total", 0),
    }



def main():
    print("=== Prediction Market Accuracy by Category ===\n")

    # Polymarket accuracy queries
    print("Polymarket:")
    poly_hourly = run_query(POLYMARKET_HOURLY_SQL, "hourly (4h/12h/1d)")
    poly_daily = run_query(POLYMARKET_DAILY_SQL, "daily (1w/1mo)")

    # Kalshi accuracy queries (hourly + daily, matching Polymarket pattern)
    print("\nKalshi:")
    kalshi_hourly = run_query(KALSHI_HOURLY_SQL, "hourly (4h/12h/1d)")
    kalshi_daily = run_query(KALSHI_DAILY_SQL, "daily (1w/1mo)")

    # Calibration queries
    print("\nCalibration:")
    poly_cal = run_query(POLY_CALIBRATION_SQL, "Polymarket calibration (20 buckets)")
    kalshi_cal = run_query(KALSHI_CALIBRATION_SQL, "Kalshi calibration (20 buckets)")

    # Brier score queries
    print("\nBrier Scores:")
    poly_brier = run_query(POLY_BRIER_SQL, "Polymarket Brier score")
    kalshi_brier = run_query(KALSHI_BRIER_SQL, "Kalshi Brier score")

    # Per-category Brier scores
    print("\nPer-Category Brier Scores:")
    poly_brier_cat = run_query(POLY_BRIER_BY_CATEGORY_SQL, "Polymarket Brier by category")
    kalshi_brier_cat = run_query(KALSHI_BRIER_BY_CATEGORY_SQL, "Kalshi Brier by category")

    # Resolution distribution
    print("\nResolution Distribution:")
    poly_res = run_query(POLY_RESOLUTION_SQL, "Polymarket resolution")
    kalshi_res = run_query(KALSHI_RESOLUTION_SQL, "Kalshi resolution")

    # Merge accuracy + brier data
    poly_merged = merge_poly_results(poly_hourly, poly_daily, poly_brier_cat)
    poly_final = add_total_row(poly_merged)
    kalshi_merged = merge_poly_results(kalshi_hourly, kalshi_daily, kalshi_brier_cat)
    kalshi_final = add_total_row(kalshi_merged)

    # Print accuracy summary
    print("\n--- Polymarket Accuracy ---")
    print(f"{'Category':<16} {'Markets':>8} {'4h':>7} {'12h':>7} {'1d':>7} {'1w':>7} {'1mo':>7}")
    print("-" * 70)
    for r in poly_final:
        print(
            f"{r['category']:<16} {r['markets']:>8,} "
            f"{r['acc_4h'] or '-':>6}% {r['acc_12h'] or '-':>6}% "
            f"{r['acc_1d'] or '-':>6}% {r['acc_1w'] or '-':>6}% "
            f"{r['acc_1mo'] or '-':>6}%"
        )

    print("\n--- Kalshi Accuracy ---")
    print(f"{'Category':<16} {'Markets':>8} {'4h':>7} {'12h':>7} {'1d':>7} {'1w':>7} {'1mo':>7}")
    print("-" * 70)
    for r in kalshi_final:
        print(
            f"{r['category']:<16} {r['markets']:>8,} "
            f"{r['acc_4h'] or '-':>6}% {r['acc_12h'] or '-':>6}% "
            f"{r['acc_1d'] or '-':>6}% {r['acc_1w'] or '-':>6}% "
            f"{r['acc_1mo'] or '-':>6}%"
        )

    # Print calibration summary
    print("\n--- Calibration (1d) ---")
    print(f"{'Bucket':<12} {'Poly Pred':>10} {'Poly Act':>10} {'Poly N':>8} {'Kalshi Pred':>12} {'Kalshi Act':>12} {'Kalshi N':>8}")
    print("-" * 80)
    poly_cal_fmt = format_calibration(poly_cal)
    kalshi_cal_fmt = format_calibration(kalshi_cal)
    kalshi_cal_map = {round(r["bucket_low"], 2): r for r in kalshi_cal_fmt}
    for p in poly_cal_fmt:
        k = kalshi_cal_map.get(round(p["bucket_low"], 2), {})
        print(
            f"{p['bucket_low']:.2f}-{p['bucket_high']:.2f}  "
            f"{p['avg_predicted']:>9.4f} {p['actual_rate']:>9.4f} {p['n']:>7,}  "
            f"{k.get('avg_predicted', '-'):>11} {k.get('actual_rate', '-'):>11} {k.get('n', '-'):>7}"
        )

    # Print Brier scores
    poly_brier_fmt = format_brier(poly_brier, poly_brier_cat)
    kalshi_brier_fmt = format_brier(kalshi_brier, kalshi_brier_cat)
    print(f"\n--- Brier Scores (1d, lower = better) ---")
    print(f"  Polymarket: {poly_brier_fmt['overall']} (n={poly_brier_fmt['n']:,})")
    print(f"  Kalshi:     {kalshi_brier_fmt['overall']} (n={kalshi_brier_fmt['n']:,})")

    # Print resolution
    poly_res_fmt = format_resolution(poly_res)
    kalshi_res_fmt = format_resolution(kalshi_res)
    print(f"\n--- Resolution Distribution ---")
    print(f"  Polymarket: YES={poly_res_fmt['yes']:,} NO={poly_res_fmt['no']:,} Total={poly_res_fmt['total']:,}")
    print(f"  Kalshi:     YES={kalshi_res_fmt['yes']:,} NO={kalshi_res_fmt['no']:,} Total={kalshi_res_fmt['total']:,}")

    # Save JSON
    output = {
        "generated_at": __import__("datetime").datetime.now().isoformat(),
        "methodology": {
            "description": "% of markets where price-implied direction at T before resolution matched final outcome",
            "correct_if": "YES price > 0.50 and YES won, or YES price < 0.50 and NO won",
            "excluded": "Markets where price = 0.50 or no price data at time window",
            "polymarket_source": "polymarket_market_prices_hourly (4h/12h/1d), polymarket_market_prices_daily (1w/1mo)",
            "kalshi_source": "kalshi_market_report (daily snapshots for all windows; 4h/12h are approximations)",
            "brier_formula": "mean((predicted_prob - actual_outcome)^2). 0 = perfect, 0.25 = coin flip.",
            "calibration_method": "20 probability buckets at 5% intervals using 1d-before-resolution price.",
        },
        "polymarket": poly_final,
        "kalshi": kalshi_final,
        "calibration": {
            "polymarket": poly_cal_fmt,
            "kalshi": kalshi_cal_fmt,
        },
        "brier": {
            "polymarket": poly_brier_fmt,
            "kalshi": kalshi_brier_fmt,
        },
        "resolution": {
            "polymarket": poly_res_fmt,
            "kalshi": kalshi_res_fmt,
        },
    }

    out_dir = Path(__file__).parent.parent / "data" / "processed"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "accuracy_by_category.json"
    out_path.write_text(json.dumps(output, indent=2))
    print(f"\nSaved to {out_path}")

    # Also copy to public/data for the frontend
    pub_dir = Path(__file__).parent.parent / "public" / "data"
    pub_dir.mkdir(parents=True, exist_ok=True)
    pub_path = pub_dir / "accuracy_by_category.json"
    pub_path.write_text(json.dumps(output, indent=2))
    print(f"Saved to {pub_path}")


if __name__ == "__main__":
    main()
