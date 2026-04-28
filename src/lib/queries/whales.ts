import { SurfClient } from "../surfClient";

const client = new SurfClient();

export interface WhaleTradeRow {
  platform: "Polymarket";
  market_id: string;
  title: string;
  side: string;
  price: number;
  amount: number;
  time: string;
  txHash?: string;
}

export async function getWhaleTrades(limit: number): Promise<WhaleTradeRow[]> {
  const r = await client.getPolymarketSmartMoney({
    view: "trades",
    whale_tier: "whale",
    sort_by: "amount_usd",
    order: "desc",
    limit,
  });
  return r.data.map((t) => ({
    platform: "Polymarket" as const,
    market_id: t.condition_id,
    title: t.question || t.condition_id,
    side: t.outcome_label,
    price: t.price,
    amount: t.amount_usd,
    time: t.block_time ?? "",
  }));
}

export interface TopTraderRow {
  address: string;
  trade_count: number;
  total_volume: number;
  market_count: number;
  avg_size: number;
}

export async function getTopTraders(
  limit: number,
  sortBy: "volume" | "count"
): Promise<TopTraderRow[]> {
  const r = await client.getPolymarketLeaderboard({
    sort_by: sortBy === "count" ? "trade_count" : "volume",
    limit,
  });
  return r.data.map((e) => ({
    address: e.address.toLowerCase(),
    trade_count: e.trade_count,
    total_volume: e.volume,
    market_count: 0,
    avg_size: e.trade_count > 0 ? e.volume / e.trade_count : 0,
  }));
}

export interface HotMarketRow {
  market_id: string;
  title: string;
  platform: string;
  trade_count: number;
  volume: number;
  unique_traders: number;
}

export async function getHotMarkets(limit: number): Promise<HotMarketRow[]> {
  const r = await client.searchPredictionMarket({
    sort_by: "trade_count_7d",
    platform: "polymarket",
    limit,
  });
  return r.data.map((m) => ({
    market_id: m.condition_id ?? "",
    title: m.question,
    platform: "Polymarket",
    trade_count: m.trade_count_7d,
    volume: m.volume_7d,
    unique_traders: 0,
  }));
}

export interface MarketSearchRow {
  source: "Polymarket" | "Kalshi";
  market_id: string;
  title: string;
  category: string;
  subcategory: string;
  notional_volume_usd: number;
  open_interest_usd: number;
  status: string;
}

export async function searchMarkets(q: string, limit: number): Promise<MarketSearchRow[]> {
  const r = await client.searchPredictionMarket({ q, limit });
  return r.data.map((m): MarketSearchRow => ({
    source: m.platform === "kalshi" ? "Kalshi" : "Polymarket",
    market_id: m.condition_id ?? m.market_ticker ?? "",
    title: m.question,
    category: m.category,
    subcategory: m.subcategory ?? "Other",
    notional_volume_usd: m.volume_30d,
    open_interest_usd: m.open_interest_usd,
    status: m.status,
  }));
}

export interface WalletStatsRow {
  address: string;
  trade_count: number;
  total_volume: number;
  market_count: number;
  avg_size: number;
  first_trade: string;
  last_trade: string;
}

export interface WalletTradeHistoryRow {
  market_id: string;
  title: string;
  side: string;
  price: number;
  amount: number;
  time: string;
  tx_hash: string;
}

export async function getWalletStatsAndTrades(
  address: string
): Promise<{ stats: WalletStatsRow | null; trades: WalletTradeHistoryRow[] }> {
  const lower = address.toLowerCase();
  const r = await client.getPolymarketTrades({ address: lower, limit: 100 });
  const trades = r.data;
  if (!trades.length) return { stats: null, trades: [] };

  const totalVolume = trades.reduce((s, t) => s + t.amount_usd, 0);
  const markets = new Set(trades.map((t) => t.condition_id));
  const times = trades.map((t) => t.block_time).sort((a, b) => a - b);

  const stats: WalletStatsRow = {
    address: lower,
    trade_count: trades.length,
    total_volume: totalVolume,
    market_count: markets.size,
    avg_size: trades.length > 0 ? totalVolume / trades.length : 0,
    first_trade: new Date(times[0] * 1000).toISOString().slice(0, 10),
    last_trade: new Date(times[times.length - 1] * 1000).toISOString().slice(0, 10),
  };

  const tradeRows: WalletTradeHistoryRow[] = trades.map((t) => ({
    market_id: t.condition_id,
    title: t.question ?? t.condition_id,
    side: t.outcome_label,
    price: t.price,
    amount: t.amount_usd,
    time: new Date(t.block_time * 1000).toISOString().replace("T", " ").slice(0, 16),
    tx_hash: t.tx_hash ?? "",
  }));

  return { stats, trades: tradeRows };
}
