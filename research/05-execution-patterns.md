# 05: On-Chain Execution Patterns — Top Non-MM Bots

## Wallet Inventory

| Label | Address | PnL | Trades | Trades/Day | Volume | Active Period | Status |
|-------|---------|-----|--------|------------|--------|---------------|--------|
| **W1** | `0x6a72f61820b26b1fe4d956e17b6dc2a1ea3033ee` | +$11.32M | 158K | 586 | $258M | Jun 2025 - present | **ACTIVE** |
| **W2** | `0xe90bec87d9ef430f27f9dcfe72c34b76967d5da2` | +$4.96M | 164K | 1,559 | $529M | Nov 2025 - Mar 2 | **DEAD** |
| **W3** | `0xdc876e6873772d38716fda7f2452a78d426d7ab6` | +$4.61M | 144K | 2,284 | $185M | Jan 5 - Mar 9 | **DEAD** |
| **W4** | `0xdb27bf2ac5d428a9c63dbc914611036855a6c56e` | +$4.08M | 263K | 884 | $221M | May 2025 - present | **ACTIVE** |
| **W5** | `0x16b29c50f2439faf627209b2ac0c7bbddaa8a881` | +$3.61M | 133K | 1,706 | $193M | Oct 21 - Jan 7 | **DEAD** |

**Critical finding**: 3 of 5 wallets ceased operations. Consistent with wallet rotation.

---

## Archetype 1: W1 (0x6a72) — "Late-Game NHL/NBA Specialist"

### Strategy
- Enters markets **10-90 minutes before close** with large directional bets
- Average trade size: $1,545
- NHL = 78% of trades (but NBA = higher per-trade volume at $5,359)

### Timing Profile
| UTC Bucket | Trades | % |
|-----------|--------|---|
| 0-6 (US evening) | 553 | **69%** |
| 6-12 | 0 | 0% |
| 12-18 | 78 | 10% |
| 18-24 | 174 | 22% |

### Same-Block Behavior
- 133 multi-trade blocks, max 67 trades in single block
- Top block (84293352): 67 trades on OKC Thunder NBA Finals market — buying BOTH Yes at 0.36-0.39 AND No at 0.61-0.64. **NegRisk arb signature.**
- Block 84252692: 36 trades on NHL Utah-Dallas, 35 buying Stars at 0.59

### Price Distribution
| Price | Trades | Volume | Avg Size |
|-------|--------|--------|----------|
| 0.0-0.3 | 196 | $17.5K | $89 |
| **0.4** | **162** | **$594K** | **$3,669** |
| **0.5** | **182** | **$317K** | **$1,742** |
| 0.6-0.9 | 181 | $240K | $1,328 |

**Massive 0.4-0.5 concentration** (72% of volume). Bets big on slight underdogs.

### Market Entry Timing (top markets by volume)
- nba-dal-nop spread: $285K, entered 10 min before close
- nba-uta-sac spread: $279K, entered 30 min before close
- nba-bkn-phi spread: $271K, entered 1 hour before close
- nba-gsw-nyk spread: $224K, entered 28 min before close

### Edge Type
**Real-time game data** — enters positions in the final minutes when live scoring data provides strongest signal. Likely monitors live game APIs or scores feeds.

---

## Archetype 2: W2 (0xe90b) — "Block-Spam Microstructure Bot" (STOPPED Mar 2)

### Strategy
- Floods blocks with **50-149 micro-trades** ($1-3 each)
- Trades EVERY sport and esport: NBA, EPL, Serie A, La Liga, Turkish league, CS:GO, LoL, UFC, MLS, politics

### Same-Block Behavior (EXTREME)
- 472 multi-trade blocks, **max 149 trades in single block**
- Block 83378370: 149 trades on EPL Everton-Man Utd draw, ALL buying Yes at $0.26 for $1.30 each
- Block 83434971: 100 trades on NBA Blazers at $0.31 for $1.55 each
- Block 83217042: 68 trades on NBA Hornets at **$0.01** (penny contracts)

### Timing Profile
| UTC Bucket | Trades | % |
|-----------|--------|---|
| 0-6 | 1,840 | **56%** |
| 6-12 | 196 | 6% |
| 12-18 | 314 | 10% |
| 18-24 | 935 | 28% |

### Price Distribution
**Most even distribution with spike at 0.9**:
- 0.0 bucket: 473 trades (penny contracts)
- 0.4-0.6: $4.5M volume (bulk of activity)
- **0.9**: $2.0M volume, **$5,629 avg** (22% of volume on near-certainties)

### Market Entry Timing
- MLS Orlando-Miami total: $125K single trade at $0.99
- NBA Cleveland-Brooklyn: entered **9 minutes before close**
- CS:GO/LoL matches: entered hours before resolution

### Edge Type
**Order book microstructure exploitation** — spamming tiny orders to capture inefficiencies. Also takes large near-certainty bets.

---

## Archetype 3: W3 (0xdc87) — "Pure Dual-Side Arbitrageur" (STOPPED Mar 9)

### Strategy
- Buys **BOTH sides** of markets in same block
- **46% of volume is NegRisk** — highest of all 5 wallets (2,768 neg-risk trades, $3.8M)

### Same-Block Behavior
- 1,608 multi-trade blocks, max 79 trades per block
- Block 83796999: 67 trades on NHL Boston-Nashville, buying BOTH Bruins (0.49) AND Predators (0.51)
- Block 83751395: 60 trades on EPL match, buying BOTH Yes (0.67) AND No (0.33)
- Consistently trades BOTH SIDES in same block

### Timing Profile (Most Uniform)
| UTC Bucket | Trades | % |
|-----------|--------|---|
| 0-6 | 3,631 | 34% |
| 6-12 | 655 | 6% |
| 12-18 | 2,899 | 27% |
| 18-24 | 3,403 | 32% |

### Price Distribution (Bell Curve at 0.50)
- **81% of volume at 0.4-0.6**
- Peak at 0.5: $3.16M volume (31% of total)
- Avg size at 0.6: $1,490 (largest bucket)

### Category Concentration
Most diversified: Soccer ($3.77M) + NBA ($2.08M) + NHL ($1.12M)

### Edge Type
**Structural NegRisk arbitrage** — captures spread when Yes+No prices don't sum to $1.00. Pure mathematical edge, no information needed.

---

## Archetype 4: W4 (0xdb27) — "NBA Whale"

### Strategy
- **92% NBA by volume**, nearly zero diversification
- Massive single-position bets: **$16,964 avg at 0.80 price**

### Same-Block Behavior
- Only 31 multi-trade blocks, but avg 8.65 trades per block (densest)
- Block 84289094: 14 trades on NBA Orlando-Atlanta, 12 buying Hawks at 0.59
- Block 84496223: 10 trades on NBA Indiana-San Antonio, all Spurs at $0.93

### Timing Profile
| UTC Bucket | Trades | % |
|-----------|--------|---|
| 0-6 | 75 | 28% |
| 6-12 | 0 | 0% |
| 12-18 | 22 | 8% |
| 18-24 | 173 | **64%** |

Trades during US afternoon (1pm-7pm EST). Zero during 6-12 UTC.

### Price Distribution (BIMODAL)
- 0.4-0.5: moderate positions ($267K)
- **0.7**: $241K, $8,054 avg
- **0.8**: $254K, **$16,964 avg** (massive favorite bets)

### Market Entry Timing
- NBA Utah-Philly: $473K, entered 2.5 hours before close
- NBA Brooklyn-Detroit: $412K, entered ~1 hour before end
- NBA Dallas-Cleveland: $250K, entered **21 minutes before close**

### Edge Type
**NBA-specific information** — deep knowledge of lineups, injuries, matchups. Takes massive positions on favorites he's confident about.

---

## Archetype 5: W5 (0x16b2) — "Mid-Line Grinder" (STOPPED Jan 7)

### Strategy
- **62% of volume at exactly the 0.50 price bucket**
- 2,166 multi-trade blocks (most of all 5), max 93 per block

### Timing Profile (Unique: European Afternoon)
| UTC Bucket | Trades | % |
|-----------|--------|---|
| 0-6 | 3,830 | 25% |
| 6-12 | 406 | 3% |
| 12-18 | 6,870 | **45%** |
| 18-24 | 4,171 | 27% |

Only wallet peaking during European afternoon (12-18 UTC / 7am-1pm EST).

### Price Distribution (Extreme 0.50 Concentration)
- **0.5 bucket**: $7.97M volume (**62%** of total)
- 0.4-0.5 combined: 83% of volume
- Avg size at 0.5: $1,210

### Category
NHL + NBA + some soccer (derived from active period Oct-Jan)

### Edge Type
**Systematic midpoint mispricing capture** — trades precisely at the 0.50 point where market uncertainty is maximum and mispricing opportunities are most frequent.

---

## Cross-Wallet Comparison

### All Avoid 6-12 UTC
Every wallet has 0-6% of trades in the 6-12 UTC window. This is the overnight US / early morning Europe slot with lowest sports activity.

### NegRisk Usage
| Wallet | Neg-Risk Trades | Neg-Risk Volume | % of Volume |
|--------|----------------|-----------------|-------------|
| W3 (0xdc87) | 2,768 | $3.8M | **46%** |
| W5 (0x16b2) | 1,687 | $819K | 6% |
| W1 (0x6a72) | 156 | $37K | 3% |
| W4 (0xdb27) | 77 | $65K | 8% |
| W2 (0xe90b) | — | — | Low |

### Maker/Taker Ratio
| Wallet | Taker % | Role |
|--------|---------|------|
| W4 | 2.9% | Pure maker (liquidity provider) |
| W1 | 12.3% | Primarily maker |
| W2 | 18.5% | Mixed |
| W5 | 24.6% | Mixed |
| W3 | 25.9% | Mixed / hub |
