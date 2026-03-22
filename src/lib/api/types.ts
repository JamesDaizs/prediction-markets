// ─── API Envelope ───────────────────────────────────────────────
export interface ApiResponse<T> {
  $schema?: string;
  data: T[] | null;
  meta: {
    limit: number;
    offset: number;
    total?: number;
    credits_used: number;
    cached: boolean;
  };
}

export interface ApiError {
  $schema?: string;
  error: { code: string; message: string };
}

// ─── Polymarket ─────────────────────────────────────────────────
export interface PolymarketRankingItem {
  condition_id: string;
  question: string;
  status: string;
  notional_volume_usd: number;
  open_interest_usd: number;
  end_time: number;
  polymarket_link: string;
  tags?: string[];
  category?: string;
  subcategory?: string;
}

export interface PolymarketSide {
  id?: string;
  token_id?: string;
  label: string;
  price?: number;
}

export interface PolymarketMarketItem {
  market_slug: string;
  event_slug: string;
  condition_id: string;
  title: string;
  description: string;
  start_time: number;
  end_time: number;
  completed_time: number;
  close_time: number;
  game_start_time?: number;
  tags: string[];
  category?: string;
  subcategory?: string;
  volume_1_week: number;
  volume_1_month: number;
  volume_1_year: number;
  volume_total: number;
  resolution_source: string;
  image: string;
  negative_risk_id?: string;
  side_a: PolymarketSide;
  side_b: PolymarketSide;
  winning_side: string;
  status: string;
  polymarket_link: string;
}

export interface PolymarketEvent {
  event_slug: string;
  title: string;
  description: string;
  status: string;
  start_time: number;
  end_time: number;
  volume_total: number;
  settlement_sources: string;
  image: string;
  tags: string[];
  market_count: number;
  markets: PolymarketMarketItem[];
}

export interface PolymarketPricePoint {
  timestamp: number;
  side_a: PolymarketSide;
  side_b: PolymarketSide;
}

export interface PolymarketTrade {
  block_time: number;
  block_number: number;
  tx_hash: string;
  evt_index: number;
  condition_id: string;
  outcome_token_id: string;
  outcome_label: string;
  question: string;
  price: number;
  shares: number;
  amount_usd: number;
  fee_usd: number;
  maker_address: string;
  taker_address: string;
  exchange_address: string;
  neg_risk: boolean;
}

export interface PolymarketOIPoint {
  timestamp: number;
  open_interest_usd: number;
  daily_net_change_usd: number;
}

export interface PolymarketVolumePoint {
  timestamp: number;
  notional_volume_usd: number;
  trade_count: number;
}

export interface PolymarketPosition {
  address: string;
  condition_id: string;
  token_id: string;
  outcome_label: string;
  balance: number;
  day: string;
  event_title: string;
  question: string;
  market_end_date: string;
  status: string;
}

// ─── Kalshi ─────────────────────────────────────────────────────
export interface KalshiRankingItem {
  market_ticker: string;
  event_ticker: string;
  title: string;
  event_title: string;
  category: string;
  subcategory?: string;
  status: string;
  payout_type: string;
  notional_volume_usd: number;
  open_interest: number;
  last_day_open_interest?: number;
  high: number;
  low: number;
  last_price: number;
  end_time?: number;
  timestamp: number;
}

export interface KalshiMarketItem {
  market_ticker: string;
  event_ticker: string;
  title: string;
  status: string;
  category?: string;
  subcategory?: string;
  tags?: string[];
  last_price: number;
  total_volume: number;
  start_time: number;
  end_time: number;
  close_time: number;
  result: string;
}

export interface KalshiEvent {
  event_ticker: string;
  event_title: string;
  event_subtitle: string;
  market_count: number;
  markets: KalshiMarketItem[];
}

export interface KalshiPricePoint {
  timestamp: number;
  side_a: { label: string; price: number };
  side_b: { label: string; price: number };
  high: number;
  low: number;
}

export interface KalshiTrade {
  timestamp: number;
  trade_id: string;
  market_ticker: string;
  event_ticker: string;
  taker_side: string;
  yes_price: number;
  no_price: number;
  notional_volume_usd: number;
}

export interface KalshiOIPoint {
  timestamp: number;
  open_interest: number;
}

export interface KalshiVolumePoint {
  timestamp: number;
  notional_volume_usd: number;
}

// ─── Cross-Platform ─────────────────────────────────────────────
export interface CategoryMetricsItem {
  timestamp: number;
  source: "Polymarket" | "Kalshi";
  category: string;
  subcategory: string;
  notional_volume_usd: number;
  open_interest_usd: number;
}

// ─── Shared Types ───────────────────────────────────────────────
export type Platform = "polymarket" | "kalshi" | "both";
export type TimeRange = "7d" | "30d" | "90d" | "180d" | "1y" | "all";
export type Interval = "1h" | "1d" | "latest";
export type SortBy = "notional_volume_usd" | "open_interest" | "ticker";
export type MarketStatus = "active" | "finalized" | "ended" | "closed";

// Unified market type for cross-platform display
export interface UnifiedMarket {
  id: string; // condition_id or market_ticker
  platform: "polymarket" | "kalshi";
  question: string;
  status: string;
  volume: number;
  openInterest: number;
  lastPrice: number;
  endTime: number;
  category?: string;
  link: string;
}
