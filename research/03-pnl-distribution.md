# 03: PnL Distribution & Money Flow

## Zero-Sum Reality

Total PnL across all 2.42M wallets = **exactly $0**

- **Winners**: 743,204 wallets (30.7%), extract +$1.032B total, avg +$1,389
- **Losers**: 1,661,112 wallets (68.6%), bleed -$1.032B total, avg -$621
- **Break-even**: ~16K wallets

## Money Flow by Bot Class

| Bot Class | Winners | Winners Extract | Losers | Losers Bleed | Net |
|-----------|---------|-----------------|--------|--------------|-----|
| Bot | 32 | +$1,719,415 | 48 | -$121,324 | +$1.6M |
| Likely Bot | 5,599 | +$100,701,233 | 9,645 | -$34,865,380 | +$65.8M |
| Likely Human | 6,137 | +$115,364,919 | 12,566 | -$63,800,640 | +$51.6M |
| **Human** | **1,331** | **+$10,411,620** | **3,481** | **-$19,194,512** | **-$8.8M** |

**Simplified**:
- Bot/Likely Bot: Net +$67.4M (RoV: 0.352%)
- Human/Likely Human: Net +$42.8M (RoV: 0.247%)
- **Net transfer from humans to bots: ~$24.7M**

## Profit Concentration

**Gini coefficient: 0.949** (more concentrated than any country's income inequality)

| Top N Winners | PnL Extracted | % of All Profits | Bot Breakdown |
|--------------|---------------|-------------------|---------------|
| Top 10 | $47.6M | 20.8% | 5 Likely Human, 5 Likely Bot |
| Top 25 | $75.4M | 33.1% | 13 LH, 12 LB |
| Top 50 | $99.9M | 43.8% | 25 LH, 25 LB |
| Top 100 | $125.9M | 55.2% | 52 LH, 45 LB, 2 Bot, 1 Human |
| Top 250 | $163.5M | 71.6% | 120 LH, 113 LB, 13 Human, 4 Bot |
| **Top 1% (388)** | **$179.9M** | **78.8%** | 76.6% MM Bot cluster, 19.3% Algo/Bot |

## Bot Tier PnL (by lifetime trade count)

| Tier | Wallets | Win % | Total PnL | Losers | Losers PnL |
|------|---------|-------|-----------|--------|------------|
| 50K+ trades | 1,112 | 57.5% | +$36.5M | 473 | -$24.5M |
| 100K+ trades | 914 | 75.2% | +$77.0M | 227 | -$21.3M |
| 1M+ trades | 114 | **96.5%** | +$43.4M | 4 | -$1.25M |

**The more you trade, the more likely you win.** At 1M+ lifetime trades, only 4 wallets out of 114 are losers.

## Wallet Lifespan vs PnL

| Lifespan | Wallets | Avg PnL | Total PnL | % Profitable |
|----------|---------|---------|-----------|-------------|
| Single Day | 12,510 | -$826 | -$10.3M | 22.1% |
| 2-7 Days | 61,099 | +$204 | +$12.5M | 23.2% |
| 8-30 Days | 82,578 | +$42 | +$3.5M | 25.3% |
| **1-3 Months** | **98,239** | **-$342** | **-$33.6M** | **30.7%** |
| 3-12 Months | 114,984 | +$331 | +$38.0M | 36.5% |
| 1+ Year | 84,794 | +$881 | +$74.7M | 34.2% |

**The "death zone"**: 1-3 month wallets. Enough time to lose significant money, not enough to develop an edge. They bleed -$33.6M collectively.

## Trade Size Distribution (March 20, single day)

| Size Bucket | % Trades | % Volume | Unique Takers |
|------------|----------|----------|---------------|
| Dust (<$1) | 21.2% | 0.3% | 80,500 |
| Tiny ($1-5) | 43.4% | 3.7% | — |
| Small ($5-20) | 22.4% | 7.1% | — |
| Medium ($20-100) | 9.6% | 13.4% | — |
| Large ($100-500) | 2.5% | 16.7% | — |
| Whale ($500-2K) | 0.7% | 21.9% | — |
| Mega ($2K+) | 0.16% | 36.9% | 2,297 |

**64.6% of trades are under $5**, but **36.9% of volume comes from the 0.16% of trades over $2K**.

## Fee Extraction (March 20, single day)

| Class | Wallets | Fees Collected | % of Total | Fee/Volume |
|-------|---------|---------------|------------|------------|
| Bot | 147 | $11.1M | 61% | 5.9% |
| Active | 1,378 | $2.7M | 15% | 8.6% |
| Human | 126,989 | $4.4M | 24% | 4.3% |

147 bot wallets collect 61% of all trading fees ($11.1M/day, ~$75K per wallet).

## Top Losing Bots (Adverse Selection / Market Makers)

| Wallet | PnL | Volume | Trades | Win Rate |
|--------|-----|--------|--------|----------|
| 0xa5ea | -$5.78M | $115M | 55K | 49.0% |
| 0x9648 | -$4.84M | $58M | 112K | 52.9% |
| 0x5375 | -$3.35M | $130M | 346K | 50.5% |
| 0xc3c3 | -$2.70M | $129M | 104K | 48.9% |
| 0xb744 | -$2.44M | $192M | 75K | 49.1% |

These are market makers with ~50% win rates but negative PnL — classic adverse selection pattern. They provide liquidity and get picked off by informed traders.

## Top Winning Bots (50K+ trades, non-MM)

| Wallet | PnL | Volume | Trades | Trades/Day | Win Rate |
|--------|-----|--------|--------|------------|----------|
| 0x6a72 | +$11.3M | $258M | 158K | 586 | 50.7% |
| 0x2005 | +$6.16M | $306M | 1.59M | 6,224 | 49.4% |
| 0x204f | +$5.26M | $589M | 3.12M | 13,870 | 48.0% |
| 0xe90b | +$4.96M | $529M | 164K | 1,559 | 50.8% |
| 0xdc87 | +$4.61M | $185M | 144K | 2,284 | 49.7% |
| 0x507e | +$4.37M | $279M | 1.14M | 8,719 | 50.3% |
| 0xdb27 | +$4.08M | $221M | 263K | 884 | 47.9% |
| 0x63ce | +$2.35M | $195M | 6.64M | 61,484 | 50.0% |
| 0xd0d6 | +$1.69M | $204M | 9.74M | 102,545 | 49.8% |

Note: 0x2005, 0x204f, 0x507e, 0x63ce, 0xd0d6 are actually market makers (high trades/day). True non-MM bots: 0x6a72, 0xe90b, 0xdc87, 0xdb27.
