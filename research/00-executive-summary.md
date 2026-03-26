# Polymarket Bot Analysis: Executive Summary

**Thesis**: "Polymarket is not built for humans, it's for agents"
**Date**: March 23, 2026
**Data**: 890M trades, 2.42M wallets, $50.87B volume (Nov 2022 - Mar 2026)

## Verdict: CONFIRMED

Polymarket is a bot-dominated ecosystem where human retail traders are systematically disadvantaged. The data shows:

1. **68.9% of volume is bot-driven** (Mar 2026), up from 58.7% in Jun 2025
2. **Humans are the only net-losing class**: -$8.8M aggregate PnL, losing $0.84 per trade
3. **94.4% of trades have a bot counterparty** — humans almost never trade with other humans
4. **Top 1% extract 78.8% of all profits** (Gini = 0.949) — more concentrated than any country's income inequality
5. **One entity operating 11 wallets extracted $41M+** through coordinated sports arbitrage
6. **Bot count grew 33x** from Oct 2025 to Mar 2026, accelerated by OpenClaw/Polyclaw frameworks

## Key Numbers

| Metric | Value |
|--------|-------|
| Total trades analyzed | 890M |
| Unique wallets | 2.42M |
| Total volume | $50.87B |
| Bot volume share (Mar 2026) | 68.9% |
| Human net PnL | -$8.8M |
| Bot/Likely Bot net PnL | +$67.4M |
| Profit Gini coefficient | 0.949 |
| Top 1% profit share | 78.8% |
| 24/7 bot wallets (single day) | 484 |
| Fastest bot | 3.19M trades/day (2-second intervals) |
| Largest multi-wallet cluster | 11 wallets, $41.2M combined PnL |

## File Index

| File | Contents |
|------|----------|
| `01-data-coverage.md` | Dataset scope, tables, time ranges |
| `02-ml-classification.md` | Bot detection methodology, features, results |
| `03-pnl-distribution.md` | Who wins, who loses, money flow analysis |
| `04-bot-taxonomy.md` | Seven documented bot strategies |
| `05-execution-patterns.md` | On-chain execution analysis for top non-MM bots |
| `06-multi-wallet-clusters.md` | The 11-wallet cluster discovery (smoking gun) |
| `07-category-analysis.md` | Bot concentration and PnL by market category |
| `08-openclaw-timeline.md` | Bot ecosystem growth timeline |
| `09-named-players.md` | Known profitable wallets and their strategies |
| `10-web-research.md` | NegRisk mechanics, detection tools, framework analysis |
| `11-kalshi-comparison.md` | Kalshi vs Polymarket structural differences |
| `12-raw-data-inventory.md` | CSV files, queries used, data sources |
