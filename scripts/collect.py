"""Collect data from Surf Prediction Market API."""

import json
import re
import time
from pathlib import Path

import httpx

from auth import BASE_URL, get_headers

RAW_DIR = Path(__file__).parent.parent / "data" / "raw"
RAW_DIR.mkdir(parents=True, exist_ok=True)

client = httpx.Client(headers=get_headers(), timeout=60.0)


def save(data: dict | list, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2))
    print(f"  Saved {path.name} ({len(json.dumps(data))} bytes)")


def collect_categories() -> None:
    """Fetch category metrics for Polymarket and Kalshi."""
    for source in ["Polymarket", "Kalshi"]:
        all_items: list = []
        for offset in range(0, 200, 100):
            url = f"{BASE_URL}/category-metrics?source={source}&limit=100&offset={offset}"
            resp = client.get(url)
            if resp.status_code != 200:
                print(f"  {source} offset={offset}: HTTP {resp.status_code}")
                break
            data = resp.json()
            items = data.get("data", data) if isinstance(data, dict) else data
            if not items:
                break
            all_items.extend(items if isinstance(items, list) else [items])
            time.sleep(0.3)
        save(all_items, RAW_DIR / f"categories_{source.lower()}.json")


def collect_rankings() -> None:
    """Fetch Polymarket market rankings by volume and OI."""
    for sort_by in ["notional_volume_usd", "open_interest_usd"]:
        url = f"{BASE_URL}/polymarket/ranking?sort_by={sort_by}&limit=50"
        resp = client.get(url)
        if resp.status_code == 200:
            save(resp.json(), RAW_DIR / f"rankings_{sort_by.split('_')[1]}.json")
        else:
            print(f"  Rankings {sort_by}: HTTP {resp.status_code}")
        time.sleep(0.3)


def collect_events() -> None:
    """Fetch Polymarket events using event_slug from top-ranked markets."""
    # Get event slugs from ranking data
    rankings_path = RAW_DIR / "rankings_volume.json"
    if not rankings_path.exists():
        print("  No rankings data — run collect_rankings() first")
        return

    data = json.loads(rankings_path.read_text())
    items = data.get("data", data) if isinstance(data, dict) else data
    if not isinstance(items, list):
        print("  Invalid rankings data format")
        return

    # Extract unique event slugs from polymarket_link
    seen_slugs: set[str] = set()
    for item in items:
        link = item.get("polymarket_link", "")
        # Link format: https://polymarket.com/event/slug/... or /event/slug
        match = re.search(r"/event/([^/?]+)", link)
        if match:
            seen_slugs.add(match.group(1))

    print(f"  Found {len(seen_slugs)} unique event slugs from rankings")

    all_events: list = []
    for slug in sorted(seen_slugs):
        url = f"{BASE_URL}/polymarket/events?event_slug={slug}"
        try:
            resp = client.get(url)
            if resp.status_code == 200:
                event_data = resp.json()
                event_items = event_data.get("data", event_data) if isinstance(event_data, dict) else event_data
                if isinstance(event_items, list):
                    all_events.extend(event_items)
                elif event_items:
                    all_events.append(event_items)
            else:
                print(f"  Event {slug}: HTTP {resp.status_code}")
        except httpx.ReadTimeout:
            print(f"  Timeout for event {slug}")
        time.sleep(0.3)

    save(all_events, RAW_DIR / "events.json")
    print(f"  Collected {len(all_events)} events")


def collect_trades(condition_ids: list[str]) -> None:
    """Fetch trades for top markets."""
    trades_dir = RAW_DIR / "trades"
    trades_dir.mkdir(exist_ok=True)
    for cid in condition_ids:
        if (trades_dir / f"{cid}.json").exists():
            existing = json.loads((trades_dir / f"{cid}.json").read_text())
            if isinstance(existing, list) and len(existing) > 0:
                print(f"  Skipping {cid[:12]}... (already have {len(existing)} trades)")
                continue
        all_trades: list = []
        for offset in range(0, 2000, 100):
            url = f"{BASE_URL}/polymarket/trades?condition_id={cid}&limit=100&offset={offset}"
            try:
                resp = client.get(url)
            except httpx.ReadTimeout:
                print(f"  Timeout for {cid[:12]}... at offset {offset}")
                break
            if resp.status_code != 200:
                break
            data = resp.json()
            items = data.get("data", data) if isinstance(data, dict) else data
            if not items or (isinstance(items, list) and len(items) == 0):
                break
            if isinstance(items, list):
                all_trades.extend(items)
            else:
                all_trades.append(items)
            time.sleep(0.3)
        if all_trades:
            save(all_trades, trades_dir / f"{cid}.json")
        print(f"  Trades for {cid[:12]}...: {len(all_trades)} trades")


def collect_timeseries(condition_ids: list[str]) -> None:
    """Fetch volume, OI, and price time series for top markets."""
    ts_dir = RAW_DIR / "timeseries"
    ts_dir.mkdir(exist_ok=True)
    for cid in condition_ids:
        if (ts_dir / f"{cid}.json").exists():
            print(f"  Skipping timeseries for {cid[:12]}... (exists)")
            continue
        market_data = {}
        for endpoint in ["volumes", "open-interest", "prices"]:
            url = f"{BASE_URL}/polymarket/{endpoint}?condition_id={cid}"
            try:
                resp = client.get(url)
                if resp.status_code == 200:
                    market_data[endpoint] = resp.json()
            except httpx.ReadTimeout:
                print(f"  Timeout on {endpoint} for {cid[:12]}...")
            time.sleep(0.3)
        if market_data:
            save(market_data, ts_dir / f"{cid}.json")


def get_top_condition_ids(n: int = 10) -> list[str]:
    """Extract top N condition IDs from volume rankings."""
    path = RAW_DIR / "rankings_volume.json"
    if not path.exists():
        return []
    data = json.loads(path.read_text())
    items = data.get("data", data) if isinstance(data, dict) else data
    if not isinstance(items, list):
        return []
    ids = []
    for item in items[:n]:
        cid = item.get("condition_id") or item.get("conditionId") or item.get("id", "")
        if cid:
            ids.append(cid)
    return ids


def main() -> None:
    print("=== Collecting Prediction Market Data ===\n")

    print("[1/5] Categories...")
    collect_categories()

    print("\n[2/5] Rankings...")
    collect_rankings()

    print("\n[3/5] Events...")
    collect_events()

    top_ids = get_top_condition_ids(10)
    print(f"\nTop condition IDs: {len(top_ids)}")

    if top_ids:
        print("\n[4/5] Trades for top markets...")
        collect_trades(top_ids)

        print("\n[5/5] Time series for top markets...")
        collect_timeseries(top_ids)
    else:
        print("\n[4/5] Skipping trades (no condition IDs found)")
        print("[5/5] Skipping time series")

    print("\n=== Collection complete ===")


if __name__ == "__main__":
    main()
