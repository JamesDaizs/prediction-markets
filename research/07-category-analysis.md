# 07: Market Category Analysis

## Bot Concentration by Category (Mar 15-21, 2026)

| Category | Bot % (trades) | Bot % (volume) | Total Trades | Observation |
|----------|---------------|----------------|-------------|-------------|
| NCAA Tournament | **87.2%** | 67.1% | 543K | Highest bot trade share |
| FIFA World Cup | 85.4% | **90.8%** | 940K | Highest bot volume share |
| Eurovision | 76.8% | 83.6% | 236K | |
| Bitcoin/Crypto | 75.0% | 77.2% | 38.0M | Largest by trade count |
| Sports Props | 64.6% | 66.8% | 1.1M | |
| Weather | 64.2% | 62.4% | 2.2M | |
| Elon Musk Tweets | 60.6% | 64.1% | 1.0M | |
| NBA | 58.8% | 67.3% | 1.9M | |
| NHL | 56.4% | 63.5% | 551K | |
| F1 | 54.0% | **88.3%** | 171K | Low trades but very high bot volume |
| US Politics | 50.7% | 66.7% | 1.2M | |
| Geopolitics | 53.7% | **47.8%** | 981K | **Only category where humans > bots by volume** |
| Golf | 43.2% | 59.1% | 112K | |
| Awards | 37.7% | 58.3% | 32K | |
| Financial Markets | 37.3% | 50.6% | 287K | |

## Most Botted Individual Markets (95-99%)

| Market | Bot % | Category |
|--------|-------|----------|
| Weather temperature bets | 99.3% | Weather |
| FIFA individual country winners | 97-99% | FIFA |
| NCAA individual team winners | 95-98% | NCAA |
| Eurovision | 95-97% | Culture |

## Least Botted Markets (Human-Dominated)

| Market | Bot % | Category |
|--------|-------|----------|
| WTA tennis | 2.5% | Sports |
| S&P 500 targets | 13.5% | Financial |
| Silver price targets | 24.8% | Financial |
| Bitcoin ATH | 24.8% | Crypto |
| Iran/Israel conflict | 28-31% | Geopolitics |
| Crude oil | 29-31% | Financial |

## Top Non-MM Winners by Category

| Wallet | PnL | Primary Category | Detail |
|--------|-----|-----------------|--------|
| 0xc2e7 | +$4.73M | European Soccer in-play | EPL, UCL, La Liga — trades during live matches in 30-90 min windows |
| 0x0b9c | +$2.7M | Multi-sport | NFL 31%, misc 36%, Soccer 9%, Crypto 12% |
| 0x5bff | +$2.2M | Diversified | Sports 37%, Culture 21%, Politics 20% |
| 0xee00 | +$2.2M | Sports 100% | Misc sports, NHL, Tennis, F1 |
| 0x44c1 | +$2.0M | Politics 67% | Politics + Culture |
| 0xf705 | +$1.8M | **Crypto 100%** | BTC/ETH price threshold markets only |
| 0x93ab | +$1.7M | **NBA 79%** | NBA specialist |
| 0xed10 | +$1.6M | Diversified | Economics 30%, Culture 17%, Politics 16%, Crypto 14% |
| 0xbddf | +$1.6M | **NBA 95%** | Pure NBA |
| 0x000d | +$1.5M | **Politics 90%** | Politics specialist |

**Pattern**: Winners are deep specialists — European soccer in-play, crypto-only, NBA-only, politics-only.

## Top Non-MM Losers by Category

| Wallet | PnL | Primary Category |
|--------|-----|-----------------|
| 0xd1be | -$3.2M | European Soccer in-play 100% |
| 0x1117 | -$2.1M | Sports 100% |
| 0xb45a | -$1.4M | Sports 100% |
| 0x2e35 | -$1.4M | European Soccer in-play 100% |
| 0xabb8 | -$1.4M | Sports 100% |
| 0x2643 | -$1.3M | Sports 100% |
| 0x84cb | -$1.3M | Sports 100% |
| 0x3333 | -$784K | Sports 96% |
| 0x2c1d | -$708K | Sports 91% |
| 0x14ac | -$674K | Sports 100% |

**ALL 10 top losers are sports bettors** (most 100% sports). The biggest loser (-$3.2M) trades the EXACT same category (European soccer in-play) as the biggest winner (+$4.73M). Same game, opposite outcome.

## Overall Volume by Category (Jan-Mar 2026)

| Category | Volume | Share |
|----------|--------|-------|
| Sports | $8.9B | 43% |
| Crypto | $6.3B | 31% |
| Politics | $3.2B | 16% |
| Culture | $765M | 4% |
| Economics | $685M | 3% |
| Financials | $332M | 2% |
| STEM | $296M | 1% |

## Top 4 Overall Losers (Including MM)

| Wallet | PnL | Category | Volume |
|--------|-----|----------|--------|
| 0x4924 | **-$11.0M** | Sports 100% | $191M |
| 0xa5ea | -$5.8M | Sports 100% | $115M |
| 0x9648 | -$4.8M | Politics 97% | $58M |
| 0x5375 | -$3.4M | Sports 98% | $130M |

## #1 Non-MM Winner Deep Dive: 0xc2e7 (+$4.73M)

Trades European soccer DURING live play:

| Market | Volume | Avg Price | Window |
|--------|--------|-----------|--------|
| Tottenham vs West Ham (EPL) | $3.5M | 0.51 | 14:16-14:59 (43 min) |
| Liverpool vs Newcastle (EPL) | $3.3M | 0.42 | 19:25-20:00 (35 min) |
| Barcelona vs Slavia Prague (UCL) | $3.1M | 0.69 | 19:22-20:57 (95 min) |
| Liverpool vs Olympiakos (UCL) | $2.9M | 0.43 | 19:14-21:05 (111 min) |
| Barcelona vs Real Sociedad (La Liga) | $2.9M | 0.57 | 19:01-19:52 (51 min) |

Average trade size ~$7,400. All trades in 30-90 minute windows during live matches. Could be human watching matches with bot execution, or pure bot processing live match data feeds.

## Crypto Specialist: 0xf705 (+$1.8M)

Trades EXCLUSIVELY crypto price threshold markets:

| Market | Volume | Avg Price |
|--------|--------|-----------|
| Bitcoin dip to $80K in January? | $444K | 0.53 |
| Bitcoin above $90K on Jan 23? | $312K | 0.63 |
| Bitcoin dip to $75K in January? | $291K | 0.55 |
| Ethereum dip to $2,600 in January? | $257K | 0.49 |
| Bitcoin above $68K on Feb 13? | $255K | 0.48 |

48,933 trades, 456/day — automated system tracking exchange prices and trading binary crypto markets.

## Weather Market Ecosystem (Mar 15-21)

| Metric | Value |
|--------|-------|
| Total trades | 2.2M |
| Total volume | $37.4M |
| Markets | 3,260 |
| Unique takers | 20,946 |
| Median trade size | $1.78 |
| Dust trades (<$1) | 40.7% |

### Shenzhen Temperature Market (Example)
- Total volume: $1,956
- Total traders: 24
- Dominated by:
  - 0xc5d5: 2,075 trades at $0.022 avg
  - 0x66a1: 2,005 trades at $0.004 avg
- Micro-bots farming liquidity rewards with dust trades

### Top Weather Trader: gopfan2 (+$700K)
- Address: `0xf2f6af4f27ec2dcf4072095ab804016e14cd5817`
- Uses NOAA GFS ensemble forecasts (5-10 min edge window)
- Fractional Kelly sizing, $1 per position
- "Up over half a million dollars betting that things won't happen" — Polymarket
