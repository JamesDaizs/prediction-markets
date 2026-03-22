export interface Overview {
  total_volume: number;
  total_open_interest: number;
  active_markets: number;
  unique_traders: number;
  avg_bet_size: number;
  top_category: string;
  top_category_volume: number;
}

export interface Category {
  source: string;
  category: string;
  subcategory: string;
  volume: number;
  open_interest: number;
}

export interface Market {
  condition_id: string;
  slug: string;
  question: string;
  volume: number;
  open_interest: number;
  end_date: string;
  category: string;
  outcome_a: string;
  outcome_b: string;
  price_a: number;
  status: string;
  polymarket_link: string;
  // Enriched from trades
  trade_count?: number;
  unique_traders?: number;
  total_volume?: number;
  avg_trade_size?: number;
  median_trade_size?: number;
  whale_count?: number;
}

export interface BetBucket {
  bucket: string;
  count: number;
  volume: number;
}

export interface Trader {
  address: string;
  total_volume: number;
  trade_count: number;
  market_count: number;
  avg_trade_size: number;
}

export interface Segment {
  segment: string;
  count: number;
  volume: number;
}

export interface Concentration {
  pct_traders: number;
  pct_volume: number;
  traders: number;
}

export interface TraderStats {
  per_market: Record<string, object>;
  bet_distribution: BetBucket[];
  top_traders: Trader[];
  concentration: Concentration[];
  segmentation: Segment[];
  aggregate: {
    unique_traders: number;
    total_trades: number;
    avg_bet_size: number;
    total_volume: number;
  };
}

export interface MarketDetail extends Market {
  timeseries: {
    volumes?: unknown[];
    open_interest?: unknown[];
    prices?: unknown[];
  };
}

export interface Meta {
  generated_at: string;
  markets_count: number;
  categories_count: number;
  has_trades: boolean;
}
