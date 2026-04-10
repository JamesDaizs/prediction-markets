#!/bin/bash
# Simple bash script to collect prediction market data using Surf CLI

set -e

# Create data directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATA_DIR="$SCRIPT_DIR/../data/surf"
mkdir -p "$DATA_DIR"

echo "=== Surf CLI Data Collection ==="
echo "Data directory: $DATA_DIR"
echo

# Function to run surf command with JSON output
run_surf() {
    local output_file="$1"
    shift
    echo "Collecting: $output_file"
    surf "$@" > "$DATA_DIR/$output_file"
    echo "  ✓ Saved $(wc -c < "$DATA_DIR/$output_file") bytes"
}

# 1. General prediction market search
echo "[1/6] Prediction markets overview..."
run_surf "prediction_markets.json" search-prediction-market --limit 100

# 2. Market analytics
echo "[2/6] Market analytics..."
run_surf "market_analytics.json" prediction-market-analytics

# 3. Cross-platform market matching
echo "[3/6] Cross-platform market matching..."
run_surf "cross_platform_matches.json" matching-market-pairs --limit 50

# 4. Polymarket leaderboard
echo "[4/5] Polymarket leaderboard..."
run_surf "polymarket_leaderboard.json" polymarket-leaderboard --limit 50

# 5. Market correlations
echo "[5/5] Market correlations..."
run_surf "market_correlations.json" prediction-market-correlations --limit 20

echo
echo "=== Collection Complete ==="
echo "All data saved to: $DATA_DIR"
echo
echo "Files created:"
ls -lh "$DATA_DIR"/*.json | awk '{print "  " $9 ": " $5}'