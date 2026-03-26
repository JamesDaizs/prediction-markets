# 04: Bot Taxonomy — Seven Documented Strategies

## Strategy Overview

| # | Strategy | Example | Profit Range | Edge Source | Status |
|---|----------|---------|--------------|-------------|--------|
| 1 | **Information Arbitrage** | Theo ($85M) | $1M-$85M | Private polling, domain expertise | Active |
| 2 | **Market Making** | 0xd0d6, 0x63ce | $1M-$10M | Spread + fees + liquidity rewards | Active |
| 3 | **Latency/Speed Trading** | 0x8dxd ($438K) | $100K-$500K | Exchange feed speed vs CLOB | **Countered** (dynamic fees) |
| 4 | **Domain Specialization** | gopfan2 ($700K), TeemuTeemu ($230K) | $50K-$700K | NOAA, game APIs, PandaScore | Active |
| 5 | **NegRisk Rebalancing** | Anonymous ($2M top) | $50K-$2M | Sum-to-one violations | Active |
| 6 | **Cross-Platform Arb** | Various | $100K-$2M | Polymarket vs Kalshi gaps | Active |
| 7 | **High-Probability Bond** | Large-order whales | Annualized 1800% | Buy >95¢ outcomes near resolution | Active |

---

## 1. Information Arbitrage

**How it works**: Trader has private or superior information about event outcomes. Places large directional bets across multiple wallets to avoid market impact.

**Case study — Theo/Fredi9999**:
- French national, operated 11 accounts (Fredi9999, Theo4, PrincessCaro, Michie, +7 more)
- Commissioned private polling using "neighbor effect" — asking "who are your neighbors voting for?"
- Revealed "shy Trump voter" effect missed by mainstream polls
- Bet across correlated markets: electoral college, swing states (PA/MI/WI), popular vote
- **Result**: ~$85M profit on 2024 US presidential election
- **Multi-wallet reason**: Execution optimization — minimize market impact (same as institutional TWAP/VWAP)
- **Identified by**: Chainalysis forensics (shared funding sources, correlated timestamps, cash-out convergence)

**Our cluster finding**: 11 wallets, $41M combined, sports arbitrage operation (see `06-multi-wallet-clusters.md`)

## 2. Market Making

**How it works**: Post both bid and ask orders, earn the spread + Polymarket's maker fee rebates + liquidity rewards.

**Key players**:
- 0xd0d6: 1,085 markets/day, 102,545 trades/day, +$1.69M PnL
- 0x63ce: 408 markets/day, 61,484 trades/day, +$2.35M PnL
- 0x507e: 257 markets/day, +$4.37M PnL
- 0x2005: 227 markets/day, +$6.16M PnL

**Fee collection (1 week, Mar 15-21)**:
| Wallet | Maker Trades | Maker Volume | Fees Collected |
|--------|-------------|-------------|----------------|
| 0xd0d6 | 785K | $7.3M | $1.4M |
| 0x63ce | 438K | $6.2M | $1.15M |
| 0x2005 | 223K | $17.9M | $425K |
| 0xee61 | 97K | $15.7M | $681K |
| 0x507e | 66K | $6.6M | $205K |

**Liquidity rewards formula**: `S(v,s) = ((v-s)/v)² · b` (quadratic, sampled every minute, ~$3M+/year budget)

**Risk**: Adverse selection. Top losing MMs: 0xa5ea (-$5.78M), 0x9648 (-$4.84M). ~50% win rate but consistent losses to informed traders.

## 3. Latency/Speed Trading

**How it works**: Monitor real-time price feeds (Binance/Coinbase WebSocket), buy mispriced Polymarket contracts before market catches up.

**Case study — 0x8dxd**:
- Turned $313 → $438,000 in one month (Dec 2025-Jan 2026)
- 98% win rate, 6,615 trades
- Targeted 15-minute BTC/ETH up/down contracts
- **Edge**: Exchange prices move first, Polymarket CLOB reprices slower
- **Polymarket response**: Dynamic taker fees (~3.15% at midpoint) introduced Feb 2026, specifically to kill this strategy

## 4. Domain Specialization

### Weather — gopfan2 (+$700K)
- Address: `0xf2f6af4f27ec2dcf4072095ab804016e14cd5817`
- Uses NOAA GFS 31-member ensemble forecasts
- **5-10 minute edge window** after model publication (human markets slow to react)
- Fractional Kelly sizing, $1 per position
- Buys YES below $0.15 or NO above $0.45 when NOAA disagrees with market
- Open source implementation: github.com/suislanchez/polymarket-kalshi-weather-bot

### Esports — TeemuTeemuTeemu ($900→$230K)
- Trades LoL, Dota 2, CS2 markets exclusively
- Direct game API connections (Riot Games API, Valve Game State Integration)
- **30-40 second edge** over public Twitch/YouTube streams due to stream delay
- Buys mispriced side immediately after decisive in-game events (baron, ace, round wins)

### Sports — Our cluster wallets ($28-41M combined)
- Real-time scoring data applied in final 10-90 minutes before market close
- NHL/NBA/NFL/Soccer/UFC coverage across 11 wallets
- See `06-multi-wallet-clusters.md` for full analysis

## 5. NegRisk Rebalancing (Dutch Book)

**How it works**: In multi-outcome NegRisk events, YES prices across all outcomes should sum to $1.00. When they don't, buy all underpriced NO tokens and merge for guaranteed profit.

**ArXiv paper findings (2508.03474)**:
- $39.6M total arb extracted (Apr 2024-Apr 2025)
- $10.6M from single-condition rebalancing (YES+NO ≠ $1)
- $23.3M from market rebalancing (multi-condition sum ≠ $1)
- $95.2K from combinatorial (cross-market logical relationships)
- Top single arbitrageur: $2.01M profit
- **Execution is NOT atomic**: ~950-block (~1 hour) windows, real risk

**Our findings on NegRisk mispricing (Mar 2026)**:
- Sports 3-outcome events: price sums 1.78-2.83 (gap $0.78-$1.83 per set)
- NCAA Tournament (36 conditions): sum 1.104, 10.4% overpriced
- Elon Musk tweets (17 conditions): sum 1.182, 18.2% overpriced
- Masters Golf (25 conditions): sum 0.845, 15.5% underpriced
- FIFA World Cup (42 conditions): sum 0.991 (well-priced by bots)

## 6. Cross-Platform Arbitrage

**How it works**: Same event priced differently on Polymarket vs Kalshi. Buy cheap side on one, sell expensive on the other.

**Challenges**:
- Kalshi is custodial (slower execution)
- Different market structures (Kalshi = daily resolution only for many markets)
- Settlement risk (different resolution sources)
- Capital efficiency (must maintain balances on both platforms)

## 7. High-Probability Bond

**How it works**: Buy outcomes trading at 95-99¢ near resolution, guaranteed $1.00 payout.

**Economics**:
- Buy at $0.95 → $0.05 profit (5.26% return)
- If resolution is 24h away: annualized ~1,900% APY
- Risk: rare event reversal (e.g., late game comeback)
- **0xdb27 pattern**: Average $16,964 per trade at 0.80 price bucket — massive favorite bets
