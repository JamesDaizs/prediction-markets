import { hermodFetch, getData } from "./client";
import type {
  PolymarketRankingItem,
  PolymarketMarketItem,
  PolymarketEvent,
  PolymarketPricePoint,
  PolymarketTrade,
  PolymarketOIPoint,
  PolymarketVolumePoint,
  PolymarketPosition,
  TimeRange,
  Interval,
} from "./types";

const BASE = "/v1/prediction-market/polymarket";

export async function getPolymarketRanking(params?: {
  sort_by?: "notional_volume_usd" | "open_interest";
  order?: "asc" | "desc";
  status?: string;
  end_before?: string;
  limit?: number;
  offset?: number;
}) {
  const res = await hermodFetch<PolymarketRankingItem>(`${BASE}/ranking`, {
    params: params as Record<string, string | number | undefined>,
  });
  return getData(res);
}

export async function getPolymarketMarkets(params?: {
  market_slug?: string;
  limit?: number;
  offset?: number;
}) {
  const res = await hermodFetch<PolymarketMarketItem>(`${BASE}/markets`, {
    params: params as Record<string, string | number | undefined>,
  });
  return getData(res);
}

export async function getPolymarketEvents(params?: {
  event_slug?: string;
  limit?: number;
  offset?: number;
}) {
  const res = await hermodFetch<PolymarketEvent>(`${BASE}/events`, {
    params: params as Record<string, string | number | undefined>,
  });
  return getData(res);
}

export async function getPolymarketPrices(
  conditionId: string,
  timeRange: TimeRange = "30d",
  interval: Interval = "1d"
) {
  const res = await hermodFetch<PolymarketPricePoint>(`${BASE}/prices`, {
    params: { condition_id: conditionId, time_range: timeRange, interval },
    revalidate: 60,
  });
  return getData(res);
}

export async function getPolymarketTrades(params: {
  condition_id: string;
  outcome_label?: string;
  min_amount?: number;
  from?: string;
  to?: string;
  sort_by?: "timestamp" | "notional_volume_usd";
  order?: "asc" | "desc";
  limit?: number;
  offset?: number;
}) {
  const res = await hermodFetch<PolymarketTrade>(`${BASE}/trades`, {
    params: params as Record<string, string | number | undefined>,
    revalidate: 60,
  });
  return getData(res);
}

export async function getPolymarketOpenInterest(
  conditionId: string,
  timeRange: TimeRange = "30d"
) {
  const res = await hermodFetch<PolymarketOIPoint>(`${BASE}/open-interest`, {
    params: { condition_id: conditionId, time_range: timeRange },
  });
  return getData(res);
}

export async function getPolymarketVolumes(
  conditionId: string,
  timeRange: TimeRange = "30d",
  interval: Interval = "1d"
) {
  const res = await hermodFetch<PolymarketVolumePoint>(`${BASE}/volumes`, {
    params: { condition_id: conditionId, time_range: timeRange, interval },
  });
  return getData(res);
}

export async function getPolymarketPositions(
  address: string,
  params?: {
    condition_id?: string;
    status?: "active" | "closed" | "all";
    day?: string;
    limit?: number;
    offset?: number;
  }
) {
  const res = await hermodFetch<PolymarketPosition>(`${BASE}/positions`, {
    params: {
      address,
      ...params,
    } as Record<string, string | number | undefined>,
  });
  return getData(res);
}
