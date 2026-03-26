"""
Polymarket Bot vs Human Classifier
Uses unsupervised ML (K-Means + Isolation Forest) on behavioral features
to classify wallets as bot/human and quantify the money flow.
"""

import pandas as pd
import numpy as np
from scipy.stats import entropy
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.ensemble import IsolationForest
from sklearn.decomposition import PCA
import warnings
warnings.filterwarnings('ignore')

print("=" * 70)
print("POLYMARKET BOT vs HUMAN CLASSIFIER")
print("ML-based wallet classification using behavioral features")
print("=" * 70)

# ============================================================
# 1. LOAD DATA
# ============================================================
print("\n[1/6] Loading data...")

leaderboard = pd.read_csv('/tmp/polymarket_leaderboard_features.csv')
taker = pd.read_csv('/tmp/polymarket_taker_7day.csv')
maker = pd.read_csv('/tmp/polymarket_maker_7day.csv')

print(f"  Leaderboard: {len(leaderboard):,} wallets (50+ lifetime trades)")
print(f"  Taker features (7d): {len(taker):,} wallets (100+ taker trades)")
print(f"  Maker features (7d): {len(maker):,} wallets (100+ maker trades)")

# ============================================================
# 2. MERGE & ENGINEER FEATURES
# ============================================================
print("\n[2/6] Engineering features...")

# Merge taker + maker features
df = taker.merge(maker, on='address', how='outer')
df = df.merge(leaderboard[['address', 'pnl', 'volume', 'total_trades',
                            'positions_won', 'positions_lost', 'trades_per_day',
                            'avg_trade_size', 'win_rate', 'active_days']],
              on='address', how='inner')

print(f"  Merged dataset: {len(df):,} wallets with both trade + leaderboard data")

# Fill NaN for wallets that only appear on one side
df['maker_trades_1wk'] = df['maker_trades_1wk'].fillna(0)
df['maker_avg_size'] = df['maker_avg_size'].fillna(0)
df['maker_unique_markets'] = df['maker_unique_markets'].fillna(0)
df['trades_1wk'] = df['trades_1wk'].fillna(0)

# Compute derived features
# 1. Hourly entropy (how uniform is trading across 4 time quadrants)
# Max entropy = log2(4) = 2.0 (perfectly uniform = bot signal)
def compute_entropy(row):
    counts = [row.get('h0_6', 0), row.get('h6_12', 0),
              row.get('h12_18', 0), row.get('h18_24', 0)]
    total = sum(counts)
    if total == 0:
        return 0
    probs = [c / total for c in counts]
    probs = [p for p in probs if p > 0]
    return entropy(probs, base=2)

df['hourly_entropy'] = df.apply(compute_entropy, axis=1)
# Normalize to 0-1 (max entropy = log2(4) = 2.0)
df['hourly_entropy_norm'] = df['hourly_entropy'] / 2.0

# 2. Maker ratio (what % of total 7d trades are on maker side)
df['total_7d_trades'] = df['trades_1wk'] + df['maker_trades_1wk']
df['maker_ratio'] = df['maker_trades_1wk'] / df['total_7d_trades'].clip(lower=1)

# 3. Trade size coefficient of variation (bots have more consistent sizing)
df['trade_size_cv'] = df['std_size'] / df['avg_size'].clip(lower=0.01)

# 4. Weekend ratio (bots trade uniformly; humans skip weekends)
df['weekend_ratio'] = df['weekend_trades'] / df['trades_1wk'].clip(lower=1)

# 5. Night ratio (0-6 UTC)
df['night_ratio'] = df['h0_6'] / df['trades_1wk'].clip(lower=1)

# 6. Market breadth (unique markets per 1000 trades — diversification signal)
df['market_breadth'] = df['unique_markets'] / (df['trades_1wk'].clip(lower=1) / 1000)

# 7. Trades per active day in the 7d window
df['trades_per_active_day'] = df['trades_1wk'] / df['active_days_x'].clip(lower=1)

# 8. Log total trades (scale normalization)
df['log_total_trades'] = np.log10(df['total_trades'].clip(lower=1))

print(f"  Features computed: {len(df.columns)} columns")

# ============================================================
# 3. ML FEATURE MATRIX
# ============================================================
print("\n[3/6] Preparing feature matrix for clustering...")

feature_cols = [
    'hourly_entropy_norm',  # Time uniformity (1.0 = perfectly uniform = bot)
    'maker_ratio',          # Maker side % (high = market maker bot)
    'trade_size_cv',        # Trade size consistency (low CV = algorithmic)
    'weekend_ratio',        # Weekend activity (high + uniform = bot)
    'night_ratio',          # Night trading (high = bot, timezone-agnostic)
    'log_total_trades',     # Scale (more trades = more likely bot)
    'trades_per_active_day', # Intensity (high = algorithmic)
    'win_rate',             # Win rate pattern
    'market_breadth',       # Markets per 1K trades
]

# Filter to wallets with valid features
df_ml = df.dropna(subset=feature_cols).copy()
print(f"  Wallets with complete features: {len(df_ml):,}")

# Cap outliers at 99th percentile for clustering stability
for col in feature_cols:
    p99 = df_ml[col].quantile(0.99)
    p01 = df_ml[col].quantile(0.01)
    df_ml[col] = df_ml[col].clip(lower=p01, upper=p99)

X = df_ml[feature_cols].values
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# ============================================================
# 4. CLUSTERING (K-Means + Isolation Forest)
# ============================================================
print("\n[4/6] Running ML classification...")

# K-Means with 4 clusters (human casual, human active, bot MM, bot HFT)
kmeans = KMeans(n_clusters=4, random_state=42, n_init=20)
df_ml['cluster'] = kmeans.fit_predict(X_scaled)

# Isolation Forest for anomaly detection (bots as anomalies)
iso = IsolationForest(contamination=0.15, random_state=42, n_estimators=200)
df_ml['anomaly_score'] = iso.fit_predict(X_scaled)  # -1 = anomaly (likely bot)
df_ml['anomaly_raw'] = iso.decision_function(X_scaled)

# PCA for visualization
pca = PCA(n_components=2)
X_pca = pca.fit_transform(X_scaled)
df_ml['pca_1'] = X_pca[:, 0]
df_ml['pca_2'] = X_pca[:, 1]

print(f"  K-Means clusters: {df_ml['cluster'].nunique()}")
print(f"  Isolation Forest anomalies: {(df_ml['anomaly_score'] == -1).sum():,} ({(df_ml['anomaly_score'] == -1).mean():.1%})")

# ============================================================
# 5. CHARACTERIZE CLUSTERS
# ============================================================
print("\n[5/6] Characterizing clusters...")
print()

# Cluster profiles
cluster_stats = df_ml.groupby('cluster').agg({
    'address': 'count',
    'hourly_entropy_norm': 'mean',
    'maker_ratio': 'mean',
    'trade_size_cv': 'mean',
    'weekend_ratio': 'mean',
    'night_ratio': 'mean',
    'log_total_trades': 'mean',
    'trades_per_active_day': 'mean',
    'win_rate': 'mean',
    'market_breadth': 'mean',
    'pnl': ['mean', 'median', 'sum'],
    'volume': 'sum',
    'total_trades': 'sum',
}).round(3)

# Flatten multi-level columns
cluster_stats.columns = ['_'.join(col).strip('_') for col in cluster_stats.columns]

# Label clusters based on behavioral signatures
labels = {}
for c in range(4):
    row = df_ml[df_ml['cluster'] == c]
    ent = row['hourly_entropy_norm'].mean()
    maker = row['maker_ratio'].mean()
    trades = row['log_total_trades'].mean()
    tpd = row['trades_per_active_day'].mean()

    if maker > 0.5:
        labels[c] = 'Market Maker Bot'
    elif ent > 0.9 and tpd > 5000:
        labels[c] = 'HFT Bot'
    elif ent > 0.85 and trades > 4:
        labels[c] = 'Algorithmic Trader'
    elif ent < 0.7:
        labels[c] = 'Human Trader'
    elif tpd > 1000:
        labels[c] = 'Algo/Bot Hybrid'
    else:
        labels[c] = 'Active Trader'

df_ml['label'] = df_ml['cluster'].map(labels)

print("CLUSTER PROFILES:")
print("-" * 120)
for c in sorted(labels.keys()):
    sub = df_ml[df_ml['cluster'] == c]
    lbl = labels[c]
    n = len(sub)
    pct = n / len(df_ml) * 100

    print(f"\n  Cluster {c}: {lbl} ({n:,} wallets, {pct:.1f}%)")
    print(f"    Hourly entropy:    {sub['hourly_entropy_norm'].mean():.3f} (1.0 = perfectly uniform)")
    print(f"    Maker ratio:       {sub['maker_ratio'].mean():.3f} (1.0 = all maker)")
    print(f"    Trade size CV:     {sub['trade_size_cv'].mean():.2f} (low = consistent)")
    print(f"    Weekend ratio:     {sub['weekend_ratio'].mean():.3f} (0.286 = uniform)")
    print(f"    Night ratio (0-6): {sub['night_ratio'].mean():.3f} (0.250 = uniform)")
    print(f"    Trades/active day: {sub['trades_per_active_day'].mean():,.0f}")
    print(f"    Log total trades:  {sub['log_total_trades'].mean():.2f} (3=1K, 4=10K, 5=100K, 6=1M)")
    print(f"    Win rate:          {sub['win_rate'].mean():.3f}")
    print(f"    Market breadth:    {sub['market_breadth'].mean():.1f} markets/1K trades")
    print(f"    --- PnL ---")
    print(f"    Mean PnL:          ${sub['pnl'].mean():,.2f}")
    print(f"    Median PnL:        ${sub['pnl'].median():,.2f}")
    print(f"    Total PnL:         ${sub['pnl'].sum():,.0f}")
    print(f"    % Profitable:      {(sub['pnl'] > 0).mean():.1%}")
    print(f"    Total Volume:      ${sub['volume'].sum():,.0f}")

# ============================================================
# 6. COMPOSITE BOT SCORE
# ============================================================
print("\n" + "=" * 70)
print("[6/6] COMPOSITE BOT SCORING")
print("=" * 70)

# Create a composite bot score (0-100) based on multiple signals
df_ml['bot_score'] = (
    df_ml['hourly_entropy_norm'] * 25 +  # Time uniformity (25 pts)
    df_ml['maker_ratio'] * 20 +           # Maker dominance (20 pts)
    (1 - df_ml['trade_size_cv'].clip(0, 5) / 5) * 15 +  # Size consistency (15 pts)
    np.clip(df_ml['trades_per_active_day'] / 10000, 0, 1) * 20 +  # Trade frequency (20 pts)
    np.clip(df_ml['night_ratio'] / 0.25, 0, 1.5) / 1.5 * 10 +  # Night activity (10 pts)
    np.clip(df_ml['weekend_ratio'] / 0.286, 0, 1.5) / 1.5 * 10   # Weekend activity (10 pts)
)

# Classify
df_ml['bot_class'] = pd.cut(df_ml['bot_score'],
                              bins=[0, 30, 50, 70, 100],
                              labels=['Human', 'Likely Human', 'Likely Bot', 'Bot'])

print("\nBOT SCORE DISTRIBUTION:")
print("-" * 70)
for cls in ['Human', 'Likely Human', 'Likely Bot', 'Bot']:
    sub = df_ml[df_ml['bot_class'] == cls]
    if len(sub) == 0:
        continue
    n = len(sub)
    pct = n / len(df_ml) * 100
    avg_pnl = sub['pnl'].mean()
    med_pnl = sub['pnl'].median()
    tot_pnl = sub['pnl'].sum()
    pct_prof = (sub['pnl'] > 0).mean() * 100
    tot_vol = sub['volume'].sum()
    avg_trades = sub['total_trades'].mean()

    print(f"\n  {cls:15s}  ({n:,} wallets, {pct:.1f}%)")
    print(f"    Avg Bot Score:   {sub['bot_score'].mean():.1f}/100")
    print(f"    Avg PnL:         ${avg_pnl:>12,.2f}")
    print(f"    Median PnL:      ${med_pnl:>12,.2f}")
    print(f"    Total PnL:       ${tot_pnl:>15,.0f}")
    print(f"    % Profitable:    {pct_prof:.1f}%")
    print(f"    Total Volume:    ${tot_vol:>15,.0f}")
    print(f"    Avg Trades:      {avg_trades:>12,.0f}")

# ============================================================
# MONEY FLOW ANALYSIS
# ============================================================
print("\n" + "=" * 70)
print("MONEY FLOW: WHO PAYS WHOM")
print("=" * 70)

bot_mask = df_ml['bot_class'].isin(['Bot', 'Likely Bot'])
human_mask = df_ml['bot_class'].isin(['Human', 'Likely Human'])

bot_pnl = df_ml[bot_mask]['pnl'].sum()
human_pnl = df_ml[human_mask]['pnl'].sum()
bot_count = bot_mask.sum()
human_count = human_mask.sum()
bot_vol = df_ml[bot_mask]['volume'].sum()
human_vol = df_ml[human_mask]['volume'].sum()

print(f"\n  Bots (score > 50):    {bot_count:,} wallets ({bot_count/len(df_ml)*100:.1f}%)")
print(f"    Total PnL:          ${bot_pnl:>15,.0f}")
print(f"    Total Volume:       ${bot_vol:>15,.0f}")
print(f"    Avg PnL/wallet:     ${bot_pnl/max(bot_count,1):>12,.2f}")
print(f"    % Profitable:       {(df_ml[bot_mask]['pnl'] > 0).mean():.1%}")

print(f"\n  Humans (score <= 50): {human_count:,} wallets ({human_count/len(df_ml)*100:.1f}%)")
print(f"    Total PnL:          ${human_pnl:>15,.0f}")
print(f"    Total Volume:       ${human_vol:>15,.0f}")
print(f"    Avg PnL/wallet:     ${human_pnl/max(human_count,1):>12,.2f}")
print(f"    % Profitable:       {(df_ml[human_mask]['pnl'] > 0).mean():.1%}")

print(f"\n  NET TRANSFER: ${abs(human_pnl):,.0f} flows from humans to bots")
print(f"  (This is among the {len(df_ml):,} most active wallets only)")

# ============================================================
# FEATURE IMPORTANCE
# ============================================================
print("\n" + "=" * 70)
print("FEATURE IMPORTANCE (what distinguishes bots from humans)")
print("=" * 70)

for feat in feature_cols:
    bot_mean = df_ml[bot_mask][feat].mean()
    human_mean = df_ml[human_mask][feat].mean()
    separation = abs(bot_mean - human_mean) / max(df_ml[feat].std(), 0.001)
    direction = "BOT >" if bot_mean > human_mean else "HUMAN >"
    print(f"  {feat:25s}  Bot: {bot_mean:8.3f}  Human: {human_mean:8.3f}  Sep: {separation:.2f}  {direction}")

# ============================================================
# TOP BOTS BY PnL
# ============================================================
print("\n" + "=" * 70)
print("TOP 20 CLASSIFIED BOTS BY PnL")
print("=" * 70)

top_bots = df_ml[bot_mask].nlargest(20, 'pnl')
print(f"\n{'Address':44s} {'PnL':>14s} {'Bot Score':>10s} {'Maker%':>8s} {'Entropy':>8s} {'Trades/Day':>12s}")
print("-" * 100)
for _, row in top_bots.iterrows():
    print(f"{row['address']:44s} ${row['pnl']:>12,.0f} {row['bot_score']:>8.1f} {row['maker_ratio']:>7.1%} {row['hourly_entropy_norm']:>7.3f} {row['trades_per_active_day']:>11,.0f}")

# ============================================================
# TOP HUMANS BY PnL
# ============================================================
print("\n" + "=" * 70)
print("TOP 20 CLASSIFIED HUMANS BY PnL")
print("=" * 70)

top_humans = df_ml[human_mask].nlargest(20, 'pnl')
print(f"\n{'Address':44s} {'PnL':>14s} {'Bot Score':>10s} {'Maker%':>8s} {'Entropy':>8s} {'Trades/Day':>12s}")
print("-" * 100)
for _, row in top_humans.iterrows():
    print(f"{row['address']:44s} ${row['pnl']:>12,.0f} {row['bot_score']:>8.1f} {row['maker_ratio']:>7.1%} {row['hourly_entropy_norm']:>7.3f} {row['trades_per_active_day']:>11,.0f}")

# ============================================================
# SUMMARY STATISTICS
# ============================================================
print("\n" + "=" * 70)
print("FINAL SUMMARY")
print("=" * 70)

total_wallets_analyzed = len(df_ml)
total_bot = bot_mask.sum()
total_human = human_mask.sum()
bot_pnl_pct = bot_pnl / max(abs(bot_pnl) + abs(human_pnl), 1) * 100

print(f"""
  Population analyzed:    {total_wallets_analyzed:,} most active wallets
  (Filtered: 50+ lifetime trades AND 100+ trades in Mar 15-21 week)

  Classification:
    Bot/Likely Bot:       {total_bot:,} ({total_bot/total_wallets_analyzed*100:.1f}%)
    Human/Likely Human:   {total_human:,} ({total_human/total_wallets_analyzed*100:.1f}%)

  Money Flow:
    Bot total PnL:        ${bot_pnl:>15,.0f}
    Human total PnL:      ${human_pnl:>15,.0f}
    Net transfer to bots: ${abs(human_pnl):>15,.0f}

  Key Signals:
    Bots trade {df_ml[bot_mask]['trades_per_active_day'].mean()/max(df_ml[human_mask]['trades_per_active_day'].mean(),1):.0f}x more frequently per active day
    Bots have {df_ml[bot_mask]['hourly_entropy_norm'].mean()/max(df_ml[human_mask]['hourly_entropy_norm'].mean(),0.01):.2f}x more uniform time distribution
    Bots are makers {df_ml[bot_mask]['maker_ratio'].mean()*100:.0f}% of the time vs humans {df_ml[human_mask]['maker_ratio'].mean()*100:.0f}%
""")

# Save results
df_ml.to_csv('/tmp/polymarket_classified_wallets.csv', index=False)
print(f"  Results saved to /tmp/polymarket_classified_wallets.csv")
print("  Done.")
