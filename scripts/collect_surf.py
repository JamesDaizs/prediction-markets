#!/usr/bin/env python3
"""Collect data using Surf CLI instead of internal API gateway."""

import json
import subprocess
import time
from pathlib import Path
from typing import Any, Dict, List

RAW_DIR = Path(__file__).parent.parent / "data" / "raw"
RAW_DIR.mkdir(parents=True, exist_ok=True)


def run_surf_command(command: List[str]) -> Dict[str, Any] | None:
    """Execute a surf CLI command and return parsed JSON response."""
    try:
        result = subprocess.run(
            ["surf"] + command,
            capture_output=True,
            text=True,
            check=True,
        )
        return json.loads(result.stdout)
    except subprocess.CalledProcessError as e:
        print(f"  Surf command failed: {' '.join(command)}")
        print(f"  Error: {e.stderr}")
        return None
    except json.JSONDecodeError as e:
        print(f"  Failed to parse JSON response: {e}")
        return None


def save(data: dict | list, path: Path) -> None:
    """Save data to JSON file."""
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2))
    print(f"  Saved {path.name} ({len(json.dumps(data))} bytes)")


def collect_prediction_markets() -> None:
    """Fetch trending prediction markets from both platforms."""
    print("  Fetching prediction market data...")

    # Get general prediction market search results
    data = run_surf_command(["search-prediction-market", "--limit", "100"])
    if data:
        markets = data.get("data", [])
        save(markets, RAW_DIR / "prediction_markets_all.json")
        print(f"  Found {len(markets)} prediction markets")

        # Separate by platform
        polymarket_data = [m for m in markets if m.get("platform") == "polymarket"]
        kalshi_data = [m for m in markets if m.get("platform") == "kalshi"]

        save(polymarket_data, RAW_DIR / "prediction_markets_polymarket.json")
        save(kalshi_data, RAW_DIR / "prediction_markets_kalshi.json")

        print(f"  Polymarket markets: {len(polymarket_data)}")
        print(f"  Kalshi markets: {len(kalshi_data)}")

        return markets

    return []


def collect_polymarket_events() -> List[str]:
    """Collect Polymarket events and return condition IDs."""
    print("  Fetching Polymarket events...")

    # Note: polymarket-events requires event-slug, so we'll extract from prediction markets
    prediction_markets = json.loads((RAW_DIR / "prediction_markets_polymarket.json").read_text())

    condition_ids = []
    events = []

    for market in prediction_markets:
        if "condition_id" in market:
            condition_ids.append(market["condition_id"])
            # Create simplified event structure
            events.append({
                "condition_id": market["condition_id"],
                "question": market["question"],
                "category": market.get("category", ""),
                "subcategory": market.get("subcategory", ""),
                "status": market.get("status", ""),
                "market_link": market.get("market_link", ""),
                "volume_total": market.get("volume_30d", 0),  # Use 30d volume as proxy
            })

    save(events, RAW_DIR / "polymarket_events.json")
    print(f"  Extracted {len(events)} Polymarket events")

    return condition_ids


def collect_polymarket_prices(condition_ids: List[str]) -> None:
    """Fetch price history for top Polymarket condition IDs."""
    if not condition_ids:
        return

    print(f"  Fetching price history for top {min(10, len(condition_ids))} markets...")

    prices_dir = RAW_DIR / "prices"
    prices_dir.mkdir(exist_ok=True)

    # Only process top 10 to avoid rate limits
    for i, condition_id in enumerate(condition_ids[:10]):
        if (prices_dir / f"{condition_id}.json").exists():
            print(f"  Skipping prices for {condition_id[:12]}... (exists)")
            continue

        print(f"  Fetching prices {i+1}/{min(10, len(condition_ids))}: {condition_id[:12]}...")

        data = run_surf_command([
            "polymarket-prices",
            "--condition-id", condition_id,
            "--limit", "100"
        ])

        if data and data.get("data"):
            save(data["data"], prices_dir / f"{condition_id}.json")

        # Rate limiting
        time.sleep(0.5)


def collect_polymarket_trades(condition_ids: List[str]) -> None:
    """Fetch trade history for top Polymarket condition IDs."""
    if not condition_ids:
        return

    print(f"  Fetching trades for top {min(5, len(condition_ids))} markets...")

    trades_dir = RAW_DIR / "trades"
    trades_dir.mkdir(exist_ok=True)

    # Only process top 5 to avoid hitting limits
    for i, condition_id in enumerate(condition_ids[:5]):
        if (trades_dir / f"{condition_id}.json").exists():
            existing = json.loads((trades_dir / f"{condition_id}.json").read_text())
            if isinstance(existing, list) and len(existing) > 0:
                print(f"  Skipping trades for {condition_id[:12]}... (already have {len(existing)} trades)")
                continue

        print(f"  Fetching trades {i+1}/{min(5, len(condition_ids))}: {condition_id[:12]}...")

        data = run_surf_command([
            "polymarket-trades",
            "--condition-id", condition_id,
            "--limit", "100"
        ])

        if data and data.get("data"):
            save(data["data"], trades_dir / f"{condition_id}.json")

        # Rate limiting
        time.sleep(0.5)


def collect_market_analytics() -> None:
    """Fetch prediction market analytics."""
    print("  Fetching prediction market analytics...")

    data = run_surf_command(["prediction-market-analytics"])
    if data and data.get("data"):
        save(data["data"], RAW_DIR / "market_analytics.json")


def main() -> None:
    """Main collection pipeline using Surf CLI."""
    print("=== Surf CLI Prediction Market Data Collection ===\n")

    print("[1/6] Prediction markets overview...")
    markets = collect_prediction_markets()

    print(f"\n[2/6] Polymarket events extraction...")
    condition_ids = collect_polymarket_events()

    print(f"\n[3/6] Price history for top markets...")
    collect_polymarket_prices(condition_ids)

    print(f"\n[4/6] Trade history for top markets...")
    collect_polymarket_trades(condition_ids)

    print(f"\n[5/6] Market analytics...")
    collect_market_analytics()

    print(f"\n[6/6] Cross-platform comparison...")
    # Fetch cross-platform market matching data
    data = run_surf_command(["matching-market-pairs", "--limit", "50"])
    if data and data.get("data"):
        save(data["data"], RAW_DIR / "cross_platform_matches.json")

    print("\n=== Surf CLI Collection Complete ===")
    print(f"Data saved to: {RAW_DIR}")
    print("\nFiles created:")
    for file in sorted(RAW_DIR.rglob("*.json")):
        size_kb = file.stat().st_size / 1024
        print(f"  {file.relative_to(RAW_DIR)}: {size_kb:.1f}KB")


if __name__ == "__main__":
    main()