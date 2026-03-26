# 01: Data Coverage & Sources

## ClickHouse Tables Used

### Primary: `agent.polymarket_market_trades`
- **Rows**: ~890M total trades
- **Time range**: November 2022 - March 2026
- **Columns**: block_date, block_time (DateTime64(3)), block_number, tx_hash, exchange_address, order_hash, maker_address, taker_address, maker_asset_id, taker_asset_id, maker_amount_filled, taker_amount_filled, fee_raw, outcome_token_id, shares, amount_usd, price, fee_usd, condition_id, question, outcome_index, outcome_label, category, market_slug, market_end_date, neg_risk, question_id, event_slug, event_title
- **Key quirks**: `category` field is mostly empty — must derive categories from `market_slug` patterns using CASE WHEN LIKE statements

### Leaderboard: `polymarket_polygon.leaderboard_by_pnl`
- **Rows**: 2.42M wallets (filtered to 819K with 50+ trades for analysis)
- **Columns**: address, pnl, volume, positions, positions_won, positions_lost, positions_open, total_trades, first_trade_date, last_trade_date

### Kalshi: `agent.kalshi_trades`
- **Rows**: 288M trades
- **Columns**: trade_id, ticker, num_contracts, taker_side, maker_side, yes_price, no_price, trade_date, created_time
- **CRITICAL LIMITATION**: NO user-level columns (no taker_member_id, no maker_member_id). Individual wallet analysis is IMPOSSIBLE on Kalshi.

### Other tables referenced:
- `agent.polymarket_market_details` — 636K markets, `winning_outcome_index`
- `agent.polymarket_market_prices_hourly` — 16M rows
- `agent.polymarket_market_prices_daily` — 2.8M rows
- `agent.polymarket_market_category` — category mapping
- `agent.kalshi_market_details` — 49M rows, `result` field
- `agent.kalshi_market_report` — 15.6M daily snapshots

## Volume by Month (2026)

| Month | Trades | Volume |
|-------|--------|--------|
| January 2026 | ~200M+ | ~$6B+ |
| February 2026 | ~220M+ | ~$6.5B+ |
| March 2026 (to 21st) | 236M | $7.14B |

## Data Extraction Pipeline

1. ClickHouse queries via `surf-data-clickhouse` skill (`scripts/ch-query`)
2. Leaderboard features → `/tmp/polymarket_leaderboard_features.csv` (819K wallets)
3. 7-day taker features → `/tmp/polymarket_taker_7day.csv` (38.8K wallets, 100+ trades Mar 15-21)
4. 7-day maker features → `/tmp/polymarket_maker_7day.csv` (38.4K wallets)
5. ML classification → `/tmp/polymarket_classified_wallets.csv` (38,839 wallets)
6. ML script → `/tmp/polymarket_bot_classifier.py` (377 lines)

## Query Gotchas Encountered

1. **Exit code 22**: Memory limit on large GROUP BY queries. Fix: narrow date ranges, raise HAVING thresholds
2. **Dollar signs in SQL labels**: Break curl `--data` parsing. Fix: remove $ from labels
3. **`category` field empty**: Use `market_slug` LIKE patterns instead
4. **Entropy calculation**: Too complex for ClickHouse SQL. Fix: extract hourly buckets, compute in Python with scipy
5. **Kalshi `count` column**: Doesn't exist — actual column is `num_contracts`
6. **Bot-vs-bot LEFT JOIN**: Too memory-heavy. Fix: INNER JOIN with pre-aggregated CTEs, single-day window
