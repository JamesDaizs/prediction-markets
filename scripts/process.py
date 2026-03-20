"""Process raw API data into dashboard-ready JSON."""

import json
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

RAW_DIR = Path(__file__).parent.parent / "data" / "raw"
OUT_DIR = Path(__file__).parent.parent / "data" / "processed"
OUT_DIR.mkdir(parents=True, exist_ok=True)


def load(path: Path) -> list | dict:
    if not path.exists():
        return []
    return json.loads(path.read_text())


def save(data: dict | list, name: str) -> None:
    path = OUT_DIR / name
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2))
    print(f"  Wrote {name}")


def process_categories() -> list[dict]:
    """Process category metrics for both platforms."""
    categories = []
    for source in ["polymarket", "kalshi"]:
        raw = load(RAW_DIR / f"categories_{source}.json")
        if not raw:
            continue
        for item in raw:
            cat = item.get("category", "") or ""
            subcat = item.get("subcategory", "") or ""
            if not cat and not subcat:
                continue  # Skip empty rows
            categories.append({
                "source": source.capitalize(),
                "category": cat,
                "subcategory": subcat,
                "volume": float(item.get("notional_volume_usd", 0) or 0),
                "open_interest": float(item.get("open_interest_usd", 0) or 0),
                "market_count": int(item.get("market_count", 0) or 0),
            })
    categories.sort(key=lambda x: x["volume"], reverse=True)
    return categories


def process_rankings() -> list[dict]:
    """Process market rankings into unified format."""
    volume_data = load(RAW_DIR / "rankings_volume.json")

    vol_items = volume_data.get("data", []) if isinstance(volume_data, dict) else volume_data
    if not isinstance(vol_items, list):
        return []

    markets = []
    for item in vol_items:
        cid = item.get("condition_id", "")
        volume = float(item.get("notional_volume_usd", 0) or 0)
        oi = float(item.get("open_interest_usd", 0) or 0)
        end_time = item.get("end_time", 0)
        end_date = ""
        if end_time:
            try:
                end_date = datetime.fromtimestamp(end_time, tz=timezone.utc).isoformat()
            except (ValueError, OSError):
                pass

        # Extract slug from polymarket link
        link = item.get("polymarket_link", "")
        slug = link.split("/")[-1] if link else cid[:16]

        markets.append({
            "condition_id": cid,
            "slug": slug,
            "question": item.get("question", ""),
            "volume": volume,
            "open_interest": oi,
            "end_date": end_date,
            "status": item.get("status", ""),
            "polymarket_link": link,
        })
    markets.sort(key=lambda x: x["volume"], reverse=True)
    return markets


def process_events() -> list[dict]:
    """Process events for enrichment."""
    raw = load(RAW_DIR / "events.json")
    if not isinstance(raw, list):
        raw = raw.get("data", []) if isinstance(raw, dict) else []

    events = []
    for item in raw:
        # Filter out noise like "Up or Down" markets
        title = item.get("title", "") or item.get("question", "")
        if "Up or Down" in title:
            continue
        events.append({
            "id": item.get("id", ""),
            "title": title,
            "slug": item.get("slug", ""),
            "category": item.get("category", ""),
            "volume": float(item.get("notional_volume_usd", 0) or item.get("volume", 0) or 0),
            "liquidity": float(item.get("liquidity", 0) or 0),
            "end_date": item.get("end_date_iso", "") or item.get("end_date", ""),
        })
    events.sort(key=lambda x: x["volume"], reverse=True)
    return events


def process_trades() -> dict:
    """Process trades to get per-market and aggregate trader stats."""
    trades_dir = RAW_DIR / "trades"
    if not trades_dir.exists() or not list(trades_dir.glob("*.json")):
        return {"per_market": {}, "aggregate": {}, "bet_distribution": [], "top_traders": [], "concentration": [], "segmentation": []}

    all_traders: dict[str, dict] = defaultdict(lambda: {"volume": 0.0, "trades": 0, "markets": set()})
    all_amounts: list[float] = []
    per_market: dict[str, dict] = {}

    for tf in sorted(trades_dir.glob("*.json")):
        cid = tf.stem
        trades = load(tf)
        if isinstance(trades, dict):
            trades = trades.get("data", [])
        if not isinstance(trades, list):
            continue

        market_traders: set[str] = set()
        market_amounts: list[float] = []

        for t in trades:
            amount = float(t.get("amount_usd", 0) or t.get("size", 0) or t.get("amount", 0) or 0)
            maker = t.get("maker_address") or t.get("maker", "")
            taker = t.get("taker_address") or t.get("taker", "")

            if amount > 0:
                market_amounts.append(amount)
                all_amounts.append(amount)

            for addr in [maker, taker]:
                if addr:
                    market_traders.add(addr)
                    all_traders[addr]["volume"] += amount
                    all_traders[addr]["trades"] += 1
                    all_traders[addr]["markets"].add(cid)

        if market_amounts:
            per_market[cid] = {
                "trade_count": len(trades),
                "unique_traders": len(market_traders),
                "total_volume": sum(market_amounts),
                "avg_trade_size": sum(market_amounts) / len(market_amounts),
                "median_trade_size": sorted(market_amounts)[len(market_amounts) // 2],
                "whale_count": sum(1 for a in market_amounts if a >= 10000),
            }

    # Bet size distribution (log buckets)
    buckets = [
        ("$0-10", 0, 10),
        ("$10-100", 10, 100),
        ("$100-1K", 100, 1000),
        ("$1K-10K", 1000, 10000),
        ("$10K-100K", 10000, 100000),
        ("$100K+", 100000, float("inf")),
    ]
    bet_distribution = []
    for label, lo, hi in buckets:
        count = sum(1 for a in all_amounts if lo <= a < hi)
        volume = sum(a for a in all_amounts if lo <= a < hi)
        bet_distribution.append({"bucket": label, "count": count, "volume": volume})

    # Top traders
    trader_list = [
        {
            "address": addr,
            "total_volume": stats["volume"],
            "trade_count": stats["trades"],
            "market_count": len(stats["markets"]),
            "avg_trade_size": stats["volume"] / stats["trades"] if stats["trades"] > 0 else 0,
        }
        for addr, stats in all_traders.items()
    ]
    trader_list.sort(key=lambda x: x["total_volume"], reverse=True)

    # Volume concentration
    total_vol = sum(t["total_volume"] for t in trader_list)
    concentration = []
    if trader_list and total_vol > 0:
        cumulative = 0.0
        checkpoints = {1, 5, 10, 25, 50, 75, 100}
        for i, t in enumerate(trader_list):
            cumulative += t["total_volume"]
            pct_traders = round((i + 1) / len(trader_list) * 100, 1)
            pct_volume = round(cumulative / total_vol * 100, 1)
            if pct_traders in checkpoints or i < 3 or (i + 1) == len(trader_list):
                concentration.append({
                    "pct_traders": pct_traders,
                    "pct_volume": pct_volume,
                    "traders": i + 1,
                })

    # Segmentation
    whales = [t for t in trader_list if t["total_volume"] >= 10000]
    mid = [t for t in trader_list if 1000 <= t["total_volume"] < 10000]
    retail = [t for t in trader_list if t["total_volume"] < 1000]
    segmentation = [
        {"segment": "Whale (>$10K)", "count": len(whales), "volume": sum(t["total_volume"] for t in whales)},
        {"segment": "Mid ($1K-10K)", "count": len(mid), "volume": sum(t["total_volume"] for t in mid)},
        {"segment": "Retail (<$1K)", "count": len(retail), "volume": sum(t["total_volume"] for t in retail)},
    ]

    trader_total_vol = sum(t["total_volume"] for t in trader_list)

    return {
        "per_market": per_market,
        "bet_distribution": bet_distribution,
        "top_traders": trader_list[:20],
        "concentration": concentration,
        "segmentation": segmentation,
        "aggregate": {
            "unique_traders": len(all_traders),
            "total_trades": len(all_amounts),
            "avg_bet_size": sum(all_amounts) / len(all_amounts) if all_amounts else 0,
            "total_volume": trader_total_vol,
            "trade_volume": sum(all_amounts),
        },
    }


def process_timeseries() -> dict:
    """Process time series data per market."""
    ts_dir = RAW_DIR / "timeseries"
    if not ts_dir.exists():
        return {}

    result = {}
    for tf in sorted(ts_dir.glob("*.json")):
        cid = tf.stem
        data = load(tf)
        if not isinstance(data, dict):
            continue

        processed = {}
        for key in ["volumes", "open-interest", "prices"]:
            raw = data.get(key, {})
            items = raw.get("data", raw) if isinstance(raw, dict) else raw
            if isinstance(items, (list, dict)):
                processed[key.replace("-", "_")] = items

        if processed:
            result[cid] = processed

    return result


def process_overview(categories: list, markets: list, trade_stats: dict) -> dict:
    """Build overview stats."""
    poly_cats = [c for c in categories if c["source"] == "Polymarket"]
    total_volume = sum(c["volume"] for c in poly_cats)
    total_oi = sum(c["open_interest"] for c in poly_cats)

    # Use market count from rankings if available
    active_markets = len(markets) if markets else sum(c.get("market_count", 0) for c in poly_cats)

    top_cat = max(poly_cats, key=lambda x: x["volume"], default={"category": "N/A", "volume": 0})

    return {
        "total_volume": total_volume,
        "total_open_interest": total_oi,
        "active_markets": active_markets,
        "unique_traders": trade_stats.get("aggregate", {}).get("unique_traders", 0),
        "avg_bet_size": trade_stats.get("aggregate", {}).get("avg_bet_size", 0),
        "top_category": top_cat.get("subcategory") or top_cat.get("category", "N/A"),
        "top_category_volume": top_cat["volume"],
    }


def main() -> None:
    print("=== Processing Data ===\n")

    print("[1/6] Categories...")
    categories = process_categories()
    save(categories, "categories.json")

    print("[2/6] Rankings / Top Markets...")
    markets = process_rankings()

    print("[3/6] Events...")
    events = process_events()
    save(events[:100], "events.json")

    print("[4/6] Trades & Trader Stats...")
    trade_stats = process_trades()

    # Enrich markets with trade stats
    for m in markets:
        cid = m["condition_id"]
        if cid in trade_stats["per_market"]:
            m.update(trade_stats["per_market"][cid])
    save(markets, "top_markets.json")
    save(trade_stats, "trader_stats.json")

    print("[5/6] Time Series...")
    timeseries = process_timeseries()
    details_dir = OUT_DIR / "market_details"
    details_dir.mkdir(exist_ok=True)
    for cid, ts_data in timeseries.items():
        market_info = next((m for m in markets if m["condition_id"] == cid), {})
        detail = {**market_info, "timeseries": ts_data}
        save(detail, f"market_details/{cid}.json")

    print("[6/6] Overview...")
    overview = process_overview(categories, markets, trade_stats)
    save(overview, "overview.json")

    # Meta
    save({
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "markets_count": len(markets),
        "categories_count": len(categories),
        "events_count": len(events),
        "has_trades": bool(trade_stats.get("per_market")),
    }, "meta.json")

    print(f"\n=== Done. {len(list(OUT_DIR.rglob('*.json')))} files in {OUT_DIR} ===")


if __name__ == "__main__":
    main()
