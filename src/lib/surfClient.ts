const DEFAULT_BASE_URL = "https://api.asksurf.ai/gateway/v1";

export interface SurfMeta {
  cached: boolean;
  credits_used: number;
  empty_reason?: string;
  has_more?: boolean;
  limit: number;
  offset: number;
  total?: number;
}

export interface SearchPredictionMarketEntry {
  category: string;
  condition_id?: string;
  market_ticker?: string;
  days_to_resolution?: number;
  latest_price?: number;
  market_link?: string;
  matched_counterpart?: string;
  open_interest_usd: number;
  platform: "polymarket" | "kalshi";
  question: string;
  smart_money_direction?: "BULLISH" | "BEARISH" | "NEUTRAL";
  status: string;
  subcategory?: string;
  trade_count_7d: number;
  volume_1d: number;
  volume_30d: number;
  volume_7d: number;
}

export interface SearchPredictionMarketParams {
  q?: string;
  category?: string;
  platform?: "polymarket" | "kalshi";
  status?: "active" | "closed" | "finalized";
  smart_money?: "bullish" | "bearish";
  condition_id?: string;
  market_ticker?: string;
  sort_by?: "volume_1d" | "volume_7d" | "volume_30d" | "open_interest" | "trade_count_7d" | "days_to_resolution";
  order?: "asc" | "desc";
  limit?: number;
  offset?: number;
}

export interface SearchPredictionMarketResponse {
  data: SearchPredictionMarketEntry[];
  meta: SurfMeta;
}

export interface CategoryTrendPoint {
  market_count: number;
  open_interest_usd: number;
  source: "Polymarket" | "Kalshi";
  timestamp: number;
  volume_usd: number;
}

export interface MomentumSummary {
  confirming_down: number;
  confirming_up: number;
  diverging_down: number;
  diverging_up: number;
  neutral: number;
  total_active: number;
  volume_decreasing: number;
  volume_increasing: number;
}

export interface MomentumMarket {
  category: string;
  condition_id: string;
  latest_price: number;
  oi_change_7d: number;
  price_change_7d: number;
  price_momentum: string;
  question: string;
  smart_money_direction: string;
  smart_wallets_involved: number;
  subcategory?: string;
  volume_7d: number;
  volume_direction: string;
  whale_flow_net_1d: number;
  whale_flow_net_7d: number;
}

export interface PredictionMarketAnalyticsData {
  category_trends: CategoryTrendPoint[];
  momentum_markets: MomentumMarket[];
  momentum_summary: MomentumSummary;
  top_markets: SearchPredictionMarketEntry[];
}

export interface PredictionMarketAnalyticsResponse {
  data: PredictionMarketAnalyticsData;
  meta: SurfMeta;
}

export interface PredictionMarketAnalyticsParams {
  category?: "crypto" | "culture" | "economics" | "financials" | "politics" | "stem" | "sports";
  platform?: "polymarket" | "kalshi";
  time_range?: "7d" | "30d" | "90d" | "180d" | "1y";
  sort_by?: "volume_7d" | "whale_flow_net_7d" | "price_change_7d" | "oi_change_7d";
  order?: "asc" | "desc";
  top_n?: number;
  limit?: number;
  offset?: number;
}

export interface LeaderboardEntry {
  address: string;
  pnl: number;
  volume: number;
  trade_count: number;
  positions: number;
  positions_won: number;
  positions_lost: number;
  positions_open: number;
}

export interface LeaderboardResponse {
  data: LeaderboardEntry[];
  meta: SurfMeta;
}

export interface LeaderboardParams {
  sort_by?: "pnl" | "volume" | "trade_count";
  order?: "asc" | "desc";
  limit?: number;
  offset?: number;
}

export interface PolymarketSmartMoneyTradeEntry {
  taker_address?: string;
  address?: string;
  block_time?: string;
  amount_usd: number;
  shares: number;
  price: number;
  outcome_label: string;
  condition_id: string;
  question?: string;
  market_slug?: string;
  category?: string;
}

export interface PolymarketSmartMoneyResponse {
  data: PolymarketSmartMoneyTradeEntry[];
  meta: SurfMeta;
}

export interface PolymarketSmartMoneyParams {
  view?: "positioning" | "trades";
  condition_id?: string;
  category?: string;
  direction?: "bullish" | "bearish" | "neutral";
  whale_tier?: "whale" | "large" | "mega";
  sort_by?: "smart_wallets_involved" | "smart_buy_volume_usd" | "smart_sell_volume_usd" | "amount_usd" | "block_time";
  order?: "asc" | "desc";
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

export interface PolymarketTradeEntry {
  block_time: number;
  block_number?: number;
  tx_hash?: string;
  condition_id: string;
  outcome_token_id?: string;
  outcome_label: string;
  question?: string;
  price: number;
  shares: number;
  amount_usd: number;
  fee_usd?: number;
  taker_address?: string;
  maker_address?: string;
}

export interface PolymarketTradesResponse {
  data: PolymarketTradeEntry[];
  meta: SurfMeta;
}

export interface PolymarketTradesParams {
  address?: string;
  condition_id?: string;
  outcome_label?: "Yes" | "No";
  type?: "trade" | "redemption" | "all";
  min_amount?: number;
  sort_by?: "timestamp" | "notional_volume_usd";
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

export class SurfClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(opts: { apiKey?: string; baseUrl?: string } = {}) {
    this.apiKey = opts.apiKey ?? process.env.SURF_API_KEY ?? "";
    this.baseUrl = opts.baseUrl ?? DEFAULT_BASE_URL;
  }

  private requireKey(): void {
    if (!this.apiKey) {
      throw new Error(
        "SURF_API_KEY is required. Get a key at https://agents.asksurf.ai and set it in .env.local"
      );
    }
  }

  async searchPredictionMarket(params: SearchPredictionMarketParams = {}): Promise<SearchPredictionMarketResponse> {
    return this.request<SearchPredictionMarketResponse>("/search/prediction-market", params);
  }

  async getPredictionMarketAnalytics(params: PredictionMarketAnalyticsParams = {}): Promise<PredictionMarketAnalyticsResponse> {
    return this.request<PredictionMarketAnalyticsResponse>("/prediction-market/analytics", params);
  }

  async getPolymarketLeaderboard(params: LeaderboardParams = {}): Promise<LeaderboardResponse> {
    return this.request<LeaderboardResponse>("/prediction-market/polymarket/leaderboard", params);
  }

  async getPolymarketSmartMoney(params: PolymarketSmartMoneyParams = {}): Promise<PolymarketSmartMoneyResponse> {
    return this.request<PolymarketSmartMoneyResponse>("/prediction-market/polymarket/smart-money", params);
  }

  async getPolymarketTrades(params: PolymarketTradesParams = {}): Promise<PolymarketTradesResponse> {
    return this.request<PolymarketTradesResponse>("/prediction-market/polymarket/trades", params);
  }

  private async request<T>(path: string, params: object = {}): Promise<T> {
    this.requireKey();
    const url = new URL(this.baseUrl + path);
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }

    let lastErr: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      const res = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Accept: "application/json",
        },
      });
      if (res.ok) {
        return (await res.json()) as T;
      }
      if (res.status >= 400 && res.status < 500) {
        const body = await res.text();
        throw new Error(`Surf API ${res.status} on ${path}: ${body}`);
      }
      lastErr = new Error(`Surf API ${res.status} on ${path}`);
      await new Promise((r) => setTimeout(r, 200 * Math.pow(2, attempt)));
    }
    throw lastErr ?? new Error(`Surf API request failed: ${path}`);
  }
}
