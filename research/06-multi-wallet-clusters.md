# 06: Multi-Wallet Cluster Discovery

## The Smoking Gun

The top 5 non-MM profitable wallets ($28.6M combined PnL) are almost certainly operated by a **single entity** running a coordinated multi-wallet sports arbitrage operation.

## Evidence Summary

### 1. Sequential Wallet Rotation

```
Timeline:
W4 (0xdb27) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  (May 2025 → present)
W1 (0x6a72) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  (Jun 2025 → present)
W5 (0x16b2)          ━━━━━━━━━━━━━━━━━━━━━  (Oct 21 → Jan 7)
W2 (0xe90b)               ━━━━━━━━━━━━━━━━━━━━━━━  (Nov 17 → Mar 2)
W3 (0xdc87)                         ━━━━━━━━━━━━━━━  (Jan 5 → Mar 9)
                                     ↑
                              W5 dies Jan 7, W3 takes over (2-day overlap)
```

- W4 and W1 are **persistent anchor wallets**
- W5, W2, W3 are **rotating satellite wallets** with handoff overlaps
- When all satellites die (Mar 9), only anchors remain

### 2. Direct Bilateral Trading ($8.5M+ volume)

The wallets trade directly with each other:

| Direction | Trades | Volume |
|-----------|--------|--------|
| W2 → W4 (W2 makes, W4 takes) | 15 | **$1.59M** |
| W2 → W3 | 399 | $1.51M |
| W1 ↔ W3 | 110 | $1.93M |
| W4 → W3 | 316 | $690K |
| W2 ↔ W1 | 44 | $1.07M |
| W4 ↔ W2 | 28 | $2.22M |
| W2 → W5 | 88 | $183K |
| W4 → W5 | 37 | $50K |
| W3 → W4 | 13 | $271K |

**W3 (0xdc87) is the hub** — it directly trades with ALL other cluster members.

### 3. Co-Trading in Same Markets

In March 1-21, the number of shared markets between wallet pairs:

| Pair | Shared Markets |
|------|---------------|
| W1 + W3 | **83** |
| W4 + W3 | **80** |
| W3 + W2 | 32 |
| W1 + W4 | 22 |
| W1 + W2 | 4 |
| W4 + W2 | 3 |

**One NBA market** (`nba-nop-uta-2026-02-28`) had **4 out of 5 wallets** trading simultaneously.

### 4. Identical Strategy — ALL Sports, Zero Crypto

| Wallet | NBA | NHL | NFL | Soccer | UFC | Crypto |
|--------|-----|-----|-----|--------|-----|--------|
| W5 | 43.7K | 16.2K | 37.3K | 11.6K | 1.8K | 0 |
| W3 | 78.2K | 17.2K | 21.2K | 10.2K | 2.8K | 0 |
| W2 | 75.2K | 11K | 16.3K | 10.8K | 3.8K | 2.1K |
| W1 | 4.3K | 15K | 0 | 0 | 0.6K | 0 |
| W4 | 18K | 0 | 0 | 1.1K | 0.1K | 0 |

W5/W2/W3 have nearly identical distributions. W1 specializes in NHL/NBA. W4 focuses on NBA only.

### 5. Complementary Roles

| Wallet | Taker % | Role |
|--------|---------|------|
| W4 | **2.9%** | Pure liquidity provider (maker) |
| W1 | **12.3%** | Primarily maker |
| W2 | 18.5% | Mixed — takes positions |
| W5 | 24.6% | Mixed — takes positions |
| W3 | 25.9% | Hub / connector |

**The anchors (W1/W4) provide liquidity, the satellites (W2/W3/W5) take positions against it.** This is a self-dealing operation where the operator controls both sides.

### 6. First Trade Counterparties

| Wallet | First Trade Market | Notable Counterparty |
|--------|-------------------|--------------------|
| W4 | Microsoft largest company (May 2025) | 0x5e65 |
| W1 | MLB Arizona-CWS (Jun 2025) | **0x4bfb** (infra) |
| W5 | NFL Minnesota-LAC (Oct 2025) | **0x4bfb** (infra) |
| W2 | BTC 15-min + UEFA (Nov 2025) | **0x4bfb** (infra) |
| W3 | College Football Championship (Jan 2026) | 0x7740, 0xc5d5 |

`0x4bfb41d5b3570defd03c39a9a4d8de6bd8b8982e` appears in first trades of 3 wallets — this is a Polymarket infrastructure/settlement address.

## Cluster Topology

```
W4 (0xdb27) ──── W1 (0x6a72)     ← Persistent anchors (both still active)
   │    \         │     │
   │     W3 (0xdc87)    │         ← Hub (dead Mar 9), traded with everyone
   │    /         \     /
W2 (0xe90b)       W5 (0x16b2)    ← Satellites (dead Mar 2 / dead Jan 7)
   │
W6 (0xc2e7)                      ← Probable 6th member (+$4.73M)
```

## Extended Cluster (Probable Additional Members)

Six more wallets trade directly with the core cluster, are sports-focused, and profitable:

| Address | PnL | First Active | Direct Trades w/ Core 5 | Strongest Link |
|---------|-----|-------------|------------------------|----------------|
| `0xc2e7800b5af46e6093872b177b7a5e7f0563be51` | **+$4.73M** | Nov 30 2025 | 474 trades, $33M vol | 194 trades w/ W2 |
| `0x93abbc022ce98d6f45d4444b594791cc4b7a9723` | +$1.84M | Jan 11 2026 | 153 trades, $1.84M | W3 linkage |
| `0x03e8a544e97eeff5753bc1e90d46e5ef22af1697` | +$1.67M | Dec 22 2025 | 206 trades, $2.41M | W2/W3 |
| `0x1bc0d88ca86b9049cf05d642e634836d5ddf4429` | +$1.50M | Dec 23 2025 | 127 trades, $2.47M | W2/W3 |
| `0xf195721ad850377c96cd634457c70cd9e8308057` | +$1.46M | Jan 20 2026 | 59 trades, $903K | W3 |
| `0xbddf61af533ff524d27154e589d2d7a81510c684` | +$1.42M | Nov 7 2025 | 71 trades, $2.84M | W4 |

**0xc2e7 (W6)** is the strongest candidate — $4.73M PnL, directly traded with all 5 core wallets, $33M bilateral volume. The extended members also trade with each other (e.g., 0x03e8 ↔ 0xf195: 24 trades, $598K).

## Combined PnL

| Scope | Wallets | Combined PnL |
|-------|---------|-------------|
| Core 5 (high confidence) | W1-W5 | **$28.57M** |
| + W6 (0xc2e7) | 6 wallets | **$33.30M** |
| Full extended cluster | 11 wallets | **$41.19M** |

## Comparison with Theo/Fredi9999 Operation

| Dimension | Theo (Election) | Our Cluster (Sports) |
|-----------|----------------|---------------------|
| Wallets | 11 accounts | 5-11 wallets |
| Combined PnL | ~$85M | $28-41M |
| Strategy | Information arb (private polling) | Sports arb/information + liquidity provision |
| Multi-wallet reason | Minimize market impact | Minimize impact + role specialization |
| Detection method | Chainalysis (funding, timing) | Co-trading, bilateral trades, rotation timing |
| Self-dealing | Unknown | **Yes** — anchors make, satellites take |
| Duration | ~2 months (election cycle) | 10+ months (ongoing) |

## Detection Methodology Used

1. **Leaderboard scan**: Identified top non-MM profitable wallets by PnL and moderate trade frequency
2. **First trade analysis**: Checked earliest counterparties for shared funding patterns
3. **Co-trading analysis**: Counted shared markets in 3-week window
4. **Bilateral trade query**: Checked if target wallets trade directly with each other
5. **Counterparty mapping**: Found other wallets frequently trading with cluster members
6. **Temporal analysis**: Mapped daily trade volumes to identify rotation patterns

## Tools That Could Further Validate

| Tool | What It Would Show |
|------|-------------------|
| **Chainalysis** | Shared CEX deposit/withdrawal addresses |
| **PolyTrack** | Behavioral fingerprinting and cluster alerts |
| **Polygonscan** | Gnosis Safe deployer address (shared = same entity) |
| **Forta Sybil Defender** | Louvain community detection + Jaccard similarity |
| **suislanchez/insider-detector** | USDC funding trace on Polygon |
