# 11: Kalshi vs Polymarket Structural Comparison

## Data Availability

| Dimension | Polymarket | Kalshi |
|-----------|-----------|-------|
| Trade-level data | Full (maker/taker addresses, amounts, prices) | Partial (no user IDs) |
| User identification | On-chain wallet addresses | **ANONYMOUS** — impossible |
| Individual analysis | Yes — can profile any wallet | **No** — cannot identify individuals |
| Volume data | Per-trade granularity | Per-trade (but no user attribution) |
| Market metadata | Full (slug, question, category, end_date) | Full (ticker, result) |

**Critical limitation**: Kalshi's `agent.kalshi_trades` table has ONLY: trade_id, ticker, num_contracts, taker_side, maker_side, yes_price, no_price, trade_date, created_time. There are NO `taker_member_id` or `maker_member_id` columns. Individual-level Kalshi analysis is impossible with available data.

## Structural Differences

| Dimension | Polymarket | Kalshi |
|-----------|-----------|-------|
| **Infrastructure** | Polygon blockchain (on-chain) | Centralized exchange (off-chain) |
| **Settlement** | Smart contracts (CTF Exchange) | Kalshi's internal ledger |
| **Token standard** | ERC-1155 conditional tokens | None (internal positions) |
| **Custody** | Self-custodial (Gnosis Safe wallets) | Custodial (Kalshi holds funds) |
| **KYC** | Optional (crypto-native) | **Required** (CFTC-regulated) |
| **Regulation** | Unregulated (offshore) | **CFTC-regulated DCM** |
| **Multi-account** | Easy (new wallet = new account) | Difficult (KYC verification) |
| **Bot access** | Open APIs + on-chain | API access (rate-limited) |
| **Market types** | Binary + multi-outcome (NegRisk) | Primarily binary |
| **Resolution** | Various (hourly to monthly) | Daily (for most markets) |
| **Geographic** | Global (no US restriction for most markets) | US only |

## Why Polymarket Is More Bot-Friendly

1. **Transparent order book**: All orders and trades visible on-chain. Bots can see the full state.
2. **No KYC barrier**: New wallet = new account. Enables multi-wallet operations like Theo's 11 accounts.
3. **NegRisk framework**: Creates structural arbitrage opportunities (multi-outcome sum deviations).
4. **On-chain composability**: Smart contract interactions enable complex strategies (split, merge, convert).
5. **Liquidity rewards**: Quadratic formula incentivizes automated market making.
6. **Low gas costs**: Polygon's ~$0.007/tx makes high-frequency strategies viable.
7. **Open data**: On-chain history enables backtesting and counterparty analysis.

## Why Kalshi Is More Human-Friendly

1. **KYC prevents sybil**: Can't easily operate 11 accounts.
2. **Anonymous trades**: Counterparties can't be profiled. No "bot bullying."
3. **Regulated**: CFTC oversight provides consumer protections.
4. **Rate limits**: API restrictions limit bot trade frequency.
5. **No NegRisk**: Fewer structural arb opportunities.
6. **Daily resolution**: Most markets resolve daily, limiting latency arb windows.

## Kalshi Data Points (from our analysis)

| Metric | Value |
|--------|-------|
| Total trades | 288M |
| Market details | 49M rows |
| Daily snapshots | 15.6M |
| Max OI | ~$118K (vs Polymarket $382M) |
| Active volume | $317M |

Kalshi 12h and 1d accuracy are identical (daily resolution only). 1mo accuracy inflated by survivorship bias.

## Key Insight

Polymarket's on-chain transparency is a double-edged sword:
- **For researchers**: Full visibility enables analysis like this entire report
- **For bots**: Full visibility enables counterparty profiling, order flow analysis, and multi-wallet coordination
- **For humans**: Full visibility means bots can see your orders, analyze your patterns, and trade against you with superior information
