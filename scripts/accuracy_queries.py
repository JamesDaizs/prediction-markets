"""
Compute prediction market accuracy by category at various time intervals
before resolution. Replicates PredictParity's analysis methodology.

Accuracy = % of markets where price-implied direction at T before resolution
matched the final outcome.
  - YES price > 0.50 at time T AND YES won → correct
  - YES price < 0.50 at time T AND NO won → correct
  - Exactly 0.50 → excluded
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

KALSHI_SQL = f"""
SELECT
  mapped_category,
  count(*) as markets,
{acc_cols_kalshi(["4h", "12h", "1d", "1w", "1mo"])}
  1 as _dummy
FROM (
  SELECT
    d.market_ticker,
    d.result,
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
    ) as mapped_category,
    -- 4h approx: latest daily price on or before close date
    argMaxIf(r.last_price, r.date, r.date <= toDate(d.close_time)) as p4h,
    -- 12h/1d approx: latest daily price before close date (daily resolution limit)
    argMaxIf(r.last_price, r.date, r.date <= toDate(d.close_time) - 1) as p12h,
    argMaxIf(r.last_price, r.date, r.date <= toDate(d.close_time) - 1) as p1d,
    -- 1w
    argMaxIf(r.last_price, r.date, r.date <= toDate(d.close_time) - 7) as p1w,
    -- 1mo
    argMaxIf(r.last_price, r.date, r.date <= toDate(d.close_time) - 30) as p1mo
  FROM agent.kalshi_market_details d
  INNER JOIN agent.kalshi_market_report r
    ON d.market_ticker = r.market_ticker
  WHERE d.result IN ('yes', 'no')
  GROUP BY d.market_ticker, d.result, d.close_time, d.category, d.subcategory
)
GROUP BY mapped_category
ORDER BY markets DESC
SETTINGS max_execution_time = 300
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
            if h == "mapped_category" or h == "result":
                row[h] = v
            else:
                try:
                    row[h] = float(v) if "." in v else int(v)
                except ValueError:
                    row[h] = v
        rows.append(row)

    print(f"  {label}: {len(rows)} categories returned", flush=True)
    return rows


def merge_poly_results(
    hourly: list[dict], daily: list[dict]
) -> list[dict]:
    """Merge hourly (4h/12h/1d) and daily (1w/1mo) Polymarket results."""
    daily_map = {r["mapped_category"]: r for r in daily}
    merged = []
    for h in hourly:
        cat = h["mapped_category"]
        d = daily_map.get(cat, {})
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
            }
        )
    return sorted(merged, key=lambda x: x["markets"], reverse=True)


def format_kalshi(rows: list[dict]) -> list[dict]:
    """Format Kalshi results."""
    result = []
    for r in rows:
        result.append(
            {
                "category": r["mapped_category"],
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
    return rows + [total]


def main():
    print("=== Prediction Market Accuracy by Category ===\n")

    # Polymarket queries
    print("Polymarket:")
    poly_hourly = run_query(POLYMARKET_HOURLY_SQL, "hourly (4h/12h/1d)")
    poly_daily = run_query(POLYMARKET_DAILY_SQL, "daily (1w/1mo)")
    poly_merged = merge_poly_results(poly_hourly, poly_daily)
    poly_final = add_total_row(poly_merged)

    # Kalshi query
    print("\nKalshi:")
    kalshi_raw = run_query(KALSHI_SQL, "daily report (all windows)")
    kalshi_final = add_total_row(format_kalshi(kalshi_raw))

    # Print summary
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

    # Save JSON
    output = {
        "generated_at": __import__("datetime").datetime.now().isoformat(),
        "methodology": {
            "description": "% of markets where price-implied direction at T before resolution matched final outcome",
            "correct_if": "YES price > 0.50 and YES won, or YES price < 0.50 and NO won",
            "excluded": "Markets where price = 0.50 or no price data at time window",
            "polymarket_source": "polymarket_market_prices_hourly (4h/12h/1d), polymarket_market_prices_daily (1w/1mo)",
            "kalshi_source": "kalshi_market_report (daily snapshots for all windows; 4h/12h are approximations)",
        },
        "polymarket": poly_final,
        "kalshi": kalshi_final,
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
