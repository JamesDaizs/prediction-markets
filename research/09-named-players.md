# 09: Named Players & Notable Wallets

## Mega Winners

### Theo/Fredi9999 — $85M (US Election)
- **Identity**: French national, former banker
- **Accounts**: 11 (Fredi9999, Theo4, PrincessCaro, Michie, +7 more)
- **Strategy**: Commissioned private polling using "neighbor effect" — asking "who are your neighbors voting for?" to detect shy Trump voters
- **Markets**: Electoral college winner, swing states (PA/MI/WI), popular vote
- **Why multi-wallet**: Minimize market impact (institutional TWAP equivalent)
- **Identified by**: Chainalysis forensics (shared funding, correlated timestamps, cash-out convergence)
- **Sources**: CNBC, Cointelegraph, Entrepreneur, Chainalysis

### Our Sports Cluster — $28-41M (Sports Arb)
- **Wallets**: 5 core + up to 6 extended (see `06-multi-wallet-clusters.md`)
- **Strategy**: Sports information + liquidity provision with self-dealing
- **Anchor wallets**: 0x6a72 (+$11.3M), 0xdb27 (+$4.08M) — still active
- **Hub wallet**: 0xdc87 (+$4.61M) — dead Mar 9
- **Categories**: NHL, NBA, NFL, Soccer, UFC (zero crypto)

## Information/Domain Specialists

### gopfan2 — +$700K (Weather/Politics)
- **Address**: `0xf2f6af4f27ec2dcf4072095ab804016e14cd5817`
- **Strategy**: NOAA GFS 31-member ensemble forecasts. 5-10 min edge window after model update.
- **Sizing**: Fractional Kelly, $1 per position. Buys YES <$0.15, NO >$0.45.
- **Quote**: "Up over half a million dollars betting that things won't happen" — Polymarket official
- **Source**: Polymarket X account, Polymarket Analytics

### TeemuTeemuTeemu — $900→$230K (Esports)
- **Strategy**: Trades LoL, Dota 2, CS2 exclusively
- **Edge**: Direct game API connections (Riot API, Valve GSI). 30-40 second advantage over Twitch/YouTube stream delay.
- **Execution**: Buys mispriced side immediately after decisive in-game events
- **Sources**: Kotaku, esports.net

### 0xc2e7 — +$4.73M (European Soccer In-Play)
- **Address**: `0xc2e7800b5af46e6093872b177b7a5e7f0563be51`
- **Strategy**: Trades exclusively during live EPL/UCL/La Liga matches in 30-90 min windows
- **Avg trade size**: ~$7,400
- **Top market**: Tottenham vs West Ham — $3.5M volume in 43-minute window
- **Note**: Probable 6th member of our sports cluster (474 direct trades, $33M bilateral volume with core 5)

### 0xf705 — +$1.8M (Crypto Price Thresholds)
- **Address**: `0xf705fa043ca7ca3a18af82c01b95cb72b2e8bc97` (approximate)
- **Strategy**: Trades EXCLUSIVELY BTC/ETH binary price markets
- **Volume**: 48,933 trades, 456/day — automated exchange price monitoring
- **Top markets**: "Bitcoin dip to $80K?" ($444K), "Bitcoin above $90K?" ($312K)

## Latency Arbitrageurs

### 0x8dxd — $313→$438K (Crypto Latency Arb)
- **Address**: `0x63ce342161250d705dc0b16df89036c8e5f9ba9a`
- **Strategy**: Binance/Coinbase WebSocket feeds (sub-100ms) vs 15-min Polymarket contracts
- **Stats**: 98% win rate, 6,615 trades, $4-5K per trade
- **Status**: Strategy killed by Polymarket's dynamic taker fees (~3.15%, Feb 2026)
- **Source**: Polymarket Analytics, Finance Magnates

## Market Makers (for reference, excluded from main analysis)

### 0xd0d6 — +$1.69M (Mega MM)
- **Full address**: `0xd0d6bc64b38c1cbb24e3c3b07a70ed87c3f4fc60` (approximate)
- **Stats**: 102,545 trades/day, 1,085 markets/day, $600K daily volume
- **Role**: Broadest market coverage of any single wallet

### 0x63ce — +$2.35M (MM)
- **Stats**: 61,484 trades/day, 408 markets/day
- **Note**: Uses raw conditional tokens (0 yes_trades, 0 no_trades in data)

### 0x2005 — +$6.16M (Sports MM)
- **Strategy**: Soccer specialist (PL, La Liga, Bundesliga), NBA, NCAA, CS2 esports
- **Avg price**: $0.47 (below fair value — information edge on top of MM)
- **Top market**: Deportivo Alavés vs Villarreal ($177K)

### @defiance_cr — $700-800/day (Retail MM)
- **Capital**: Started with $10K
- **Strategy**: Market making from small capital, documented publicly

### HyperLiquid0xb — $1.4M+ (Sports)
- **Strategy**: Sports specialist, cross-referenced with HyperLiquid activity

## Top Arb Wallets (from arXiv paper)

| Rank | Wallet | Profit | Strategy |
|------|--------|--------|----------|
| 1 | Anonymous | $2,009,632 | Market rebalancing |
| 2 | Anonymous | $1,200K+ | NegRisk multi-condition |
| 3 | Anonymous | $1,000K+ | NegRisk multi-condition |
| @Tutaaa91 | Known | $58,900 (single trade) | Extreme mispricing |

Total arb profit documented: $39.6M (Apr 2024-Apr 2025)

## Academic/Research References

### arXiv:2508.03474 — "Unravelling the Probabilistic Forest"
- $39.6M arb extracted
- $5.9M single-condition longs, $4.7M single shorts
- $11.1M NegRisk buy YES, $17.3M NegRisk buy NO
- $612K NegRisk sell YES, $94K combinatorial
- Top arbitrageur: $2.01M

### arXiv:2603.03136 — "The Anatomy of Polymarket"
- Kyle's lambda dropped from 0.518 to 0.01 during 2024 election (market becoming more liquid)
- Polymarket Brier scores: 0.08-0.18
- Overconfidence at price extremes

### ChainCatcher Analysis
- Analyzed 95M on-chain transactions
- Only 0.51% of wallets have ever achieved >$1K profit
- 14 of top 20 most profitable wallets are bots
- Whale accounts (>$50K volume) = 1.74% of wallets

## Dual-Role Wallets (Both Top Taker AND Maker)

| Wallet | Maker Trades | Taker Trades | Total | Maker % |
|--------|-------------|-------------|-------|---------|
| 0xb27b | 316K | 26K | 342K | 92.5% |
| 0xd0d6 | 107K | 60K | 166K | 64.2% |
| 0x1f0e | 57K | 78K | 135K | 42.6% |
| 0xa45f | 110K | 25K | 135K | 81.7% |
