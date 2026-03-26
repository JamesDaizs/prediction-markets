# 02: ML Bot Classification

## Methodology

### Feature Engineering (9 features)

| Feature | Description | Bot Separation |
|---------|-------------|----------------|
| `hourly_entropy_norm` | Normalized Shannon entropy of 4 hourly trade buckets (0-6, 6-12, 12-18, 18-24 UTC). 1.0 = perfectly uniform, 0 = all trades in one bucket | **1.01** (strongest) |
| `maker_ratio` | maker_trades / (maker_trades + taker_trades). High = market maker | **1.00** |
| `log_total_trades` | log10(total lifetime trades). Scale normalization | 0.85 |
| `trades_per_active_day` | 7-day trades / active days. Intensity measure | 0.78 |
| `trade_size_cv` | Coefficient of variation (std/mean) of trade sizes. Low = algorithmic consistency | 0.65 |
| `weekend_ratio` | Weekend trades / total 7-day trades | 0.52 |
| `night_ratio` | Trades during 0-6 UTC / total | 0.45 |
| `market_breadth` | Unique markets traded in 7 days | 0.40 |
| `win_rate` | positions_won / (positions_won + positions_lost) | 0.30 |

### Algorithms

1. **K-Means Clustering** (k=4, n_init=20, random_state=42)
   - Unsupervised grouping into 4 behavioral clusters

2. **Isolation Forest** (contamination=0.15, n_estimators=200, random_state=42)
   - Anomaly detection for outlier bots

3. **Composite Bot Score** (0-100 weighted)
   - hourly_entropy_norm: 25 points
   - maker_ratio: 20 points
   - trade_frequency (log_total_trades): 20 points
   - trade_size_cv (inverted — low CV = more bot-like): 15 points
   - night_ratio: 10 points
   - weekend_ratio: 10 points
   - Thresholds: [0,30) = Human, [30,50) = Likely Human, [50,70) = Likely Bot, [70,100] = Bot

### Full script: `/tmp/polymarket_bot_classifier.py` (377 lines)

## Results

### Classification Distribution (38,839 wallets)

| Class | Count | % | Total PnL | Avg PnL |
|-------|-------|---|-----------|---------|
| Bot | 80 | 0.2% | +$1.6M | +$19,976 |
| Likely Bot | 15,244 | 39.3% | +$65.8M | +$4,319 |
| Likely Human | 18,703 | 48.2% | +$51.6M | +$2,757 |
| Human | 4,812 | 12.4% | **-$8.8M** | **-$1,825** |

### 4 Behavioral Clusters

| Cluster | Count | % | Net PnL | Description |
|---------|-------|---|---------|-------------|
| Market Maker Bot | 12,723 | 32.8% | +$77.8M | High-volume, high maker_ratio, uniform timing |
| Algo/Bot Hybrid | 1,124 | 2.9% | +$41.2M | Algorithmic directional traders |
| Active Trader | 12,773 | 32.9% | -$1.2M | Mid-frequency, break-even |
| Human Trader | 12,219 | 31.5% | -$7.5M | Low-frequency, time-clustered, net losers |

### PnL Efficiency by Class

| Class | PnL Per Trade |
|-------|--------------|
| Likely Human | +$0.4645 |
| Likely Bot | +$0.2054 |
| Bot | +$0.0674 |
| Human | **-$0.8358** |

### Sharp vs Dumb Money

- **Sharp traders** (WR >55% AND PnL >$100K): Only 23 wallets. 12 Likely Bot, 11 Likely Human. $5.8M total.
- **Dumb money** (WR <45% AND PnL <-$10K): 98 wallets. 51 Likely Human, 30 Likely Bot, 17 Human. -$4.4M total.

### Output File

`/tmp/polymarket_classified_wallets.csv` — 38,839 rows
Columns: address, trades_1wk, h0_6, h6_12, h12_18, h18_24, weekend_trades, avg_size, std_size, unique_markets, active_days_x, maker_trades_1wk, maker_avg_size, maker_unique_markets, pnl, volume, total_trades, positions_won, positions_lost, trades_per_day, avg_trade_size, win_rate, active_days_y, hourly_entropy, hourly_entropy_norm, total_7d_trades, maker_ratio, trade_size_cv, weekend_ratio, night_ratio, market_breadth, trades_per_active_day, log_total_trades, cluster, anomaly_score, anomaly_raw, pca_1, pca_2, label, bot_score, bot_class
