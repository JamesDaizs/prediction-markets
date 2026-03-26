# 08: Bot Ecosystem Growth Timeline

## OpenClaw Impact on Bot Population

| Date | Event | Bot Wallets (1K+/day) | Bot % |
|------|-------|-----------------------|-------|
| Oct 2025 | Pre-OpenClaw baseline | ~98 | 0.065% |
| Nov 24, 2025 | **OpenClaw (Clawdbot) created** by Peter Steinberger | 231 | — |
| Dec 1-8, 2025 | Early adoption phase | 309→411 | — |
| Dec 29, 2025 | Steady growth | 659 | 0.334% |
| Jan 5, 2026 | Crosses 1,000 | 1,023 | — |
| Jan 27, 2026 | Renamed Moltbot (Anthropic trademark issue) | — | — |
| Jan 30, 2026 | **Renamed OpenClaw; Polyclaw (Polymarket skill) created** | — | — |
| Feb 9, 2026 | **Olas Polystrat announced** | 1,968 | — |
| Feb 15, 2026 | Peter Steinberger joins OpenAI | — | — |
| Feb 16, 2026 | **Polymarket US public APIs launched** | 2,264 | **0.959%** (peak rate) |
| Feb 17, 2026 | Permissionless liquidity rewards opened | — | — |
| Feb 24, 2026 | Polymarket CLI (Rust) released | — | — |
| Mar 2-16, 2026 | Stabilization | 2,350-2,506 | ~1% |

**33x increase** in bot wallets from Oct 2025 (72) to Mar 2026 (2,349).

## Bot Volume Share Over Time

| Month | Bot Volume | Total Volume | Bot Share |
|-------|-----------|-------------|-----------|
| Jun 2025 | $685M | $1.17B | 58.7% |
| Sep 2025 | — | — | 63.7% |
| Dec 2025 | — | — | 65.6% |
| Feb 2026 | — | — | 68.7% |
| Mar 2026 | — | — | **68.9%** |

Steady ~2% growth per quarter. The rate of increase has slowed (stabilizing near 70%).

## Key Framework Timeline

| Date | Framework | Description |
|------|-----------|-------------|
| Dec 2021 | clob-client (TS) | First TypeScript CLOB client |
| Feb 2022 | py-clob-client | Python CLOB client |
| Jul 2024 | Polymarket Agents | Official Python agent framework |
| Nov 24, 2025 | **OpenClaw (Clawdbot)** | AI agent framework by Peter Steinberger |
| Dec 2025 | rs-clob-client | Rust CLOB client |
| Jan 30, 2026 | **Polyclaw** | Polymarket-specific OpenClaw skill (Chainstack) |
| Feb 9, 2026 | **Olas Polystrat** | Autonomous prediction agent (FSM-based) |
| Feb 16, 2026 | Polymarket US public APIs | Official API access expansion |
| Feb 24, 2026 | Polymarket CLI (Rust) | Official Rust CLI tool |
| Mid-Feb 2026 | **IronClaw** | Near AI's secure Rust agent framework |
| ~Feb 2026 | OpenClaw hits 250K GitHub stars | Mass adoption milestone |

## Polystrat vs OpenClaw Comparison

| Feature | Polystrat (Olas) | OpenClaw |
|---------|-----------------|----------|
| Architecture | Finite State Machine (hardcoded) | Unrestricted LLM agent |
| Strategy | NLP sentiment, <4-day markets | Flexible — arb, split+CLOB |
| Security | Self-custodial Safe, restricted actions | Can leak private keys |
| Performance | 4,200+ trades/month, 37% profitable | Varies by skill |
| Setup | <10 min, social login | Technical setup required |
| Cost | Gas only | Gas + LLM API costs |

## 24/7 Trading Metrics (March 20, single day)

| Metric | Value |
|--------|-------|
| Wallets active all 24 hours | 484 |
| Wallets with 1,000+ trades | 755 |
| Wallets with 10,000+ trades | 72 |
| Wallets with 100,000+ trades | 2 |
| Total wallets that day | 128,648 |
| Top wallet (0x4bfb) trades | 3.19M (133K/hour) |

## Inter-Trade Timing (Fastest Bots)

| Wallet | Trades/Day | Trades/Hour | Median Interval |
|--------|-----------|-------------|-----------------|
| 0x4bfb | 3.19M | 133K | **2 seconds** (Polygon block floor) |
| 0xc5d5 | 549K | 22.9K | ~3 seconds |
| 0x1f0e | 77.5K | 3.2K | ~11 seconds |
| 0xd1eb | 63.9K | 2.7K | ~13 seconds |
| 0xd0d6 | 59.5K | 2.5K | ~14 seconds |

The fastest bot operates at the **physical limit of the blockchain** — every single Polygon block.

## Trade Matrix: Who Trades with Whom (March 20)

| Pair | % of Trades | Volume | Avg Trade Size |
|------|------------|--------|----------------|
| Bot → Bot | 27.2% | $37.4M | $13.47 |
| Bot → Human | 17.9% | $119.1M | $65.22 |
| Bot → Active | 13.9% | $30.8M | $21.71 |
| Human → Bot | 12.2% | $19.7M | $15.81 |
| Active → Bot | 10.8% | $10.6M | $9.62 |
| Human → Active | 6.4% | — | — |
| Human → Human | **5.6%** | — | — |
| Active → Active | 3.8% | — | — |
| Active → Human | 2.3% | — | — |

**Only 5.6% of trades are human-to-human.** 94.4% involve at least one bot.

## Price Sniping Pattern

| Direction | Avg Price | Avg Size | Interpretation |
|-----------|-----------|----------|----------------|
| Bot Taker → Human Maker | **$0.60** | $65.22 | Bots buy high-probability side from humans |
| Human Taker → Bot Maker | **$0.44** | $15.81 | Humans buy long-shots from bots |
| Bot → Bot | $0.49 | $13.47 | Near midpoint, structural arb |

Bots systematically buy the winning side (0.60 = 60% probability outcomes) from human liquidity providers, while humans buy the losing side (0.44 = long shots) from bots.
