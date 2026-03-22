import { hermodFetch, getData } from "./client";
import type {
  KalshiRankingItem,
  KalshiMarketItem,
  KalshiEvent,
  KalshiPricePoint,
  KalshiTrade,
  KalshiOIPoint,
  KalshiVolumePoint,
  TimeRange,
} from "./types";

const BASE = "/v1/prediction-market/kalshi";

export async function getKalshiRanking(params?: {
  sort_by?: "notional_volume_usd" | "open_interest" | "ticker";
  order?: "asc" | "desc";
  status?: string;
  limit?: number;
  offset?: number;
}) {
  const res = await hermodFetch<KalshiRankingItem>(`${BASE}/ranking`, {
    params: params as Record<string, string | number | undefined>,
  });
  return getData(res);
}

export async function getAllKalshiRanking(params?: {
  sort_by?: "notional_volume_usd" | "open_interest" | "ticker";
  order?: "asc" | "desc";
  status?: string;
  maxPages?: number;
}) {
  const PAGE_SIZE = 50;
  const maxPages = params?.maxPages ?? 10;
  const all: KalshiRankingItem[] = [];
  let offset = 0;
  for (let page = 0; page < maxPages; page++) {
    const { maxPages: _, ...rest } = params ?? {};
    const batch = await getKalshiRanking({
      ...rest,
      limit: PAGE_SIZE,
      offset,
    });
    all.push(...batch);
    if (batch.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  return all;
}

export async function getKalshiMarkets(params?: {
  market_ticker?: string;
  limit?: number;
  offset?: number;
}) {
  const res = await hermodFetch<KalshiMarketItem>(`${BASE}/markets`, {
    params: params as Record<string, string | number | undefined>,
  });
  return getData(res);
}

export async function getKalshiEvents(params?: {
  event_ticker?: string;
  limit?: number;
  offset?: number;
}) {
  const res = await hermodFetch<KalshiEvent>(`${BASE}/events`, {
    params: params as Record<string, string | number | undefined>,
  });
  return getData(res);
}

export async function getKalshiPrices(
  ticker: string,
  timeRange: TimeRange = "30d",
  interval: "1d" | "latest" = "1d"
) {
  const res = await hermodFetch<KalshiPricePoint>(`${BASE}/prices`, {
    params: { ticker, time_range: timeRange, interval },
    revalidate: 60,
  });
  return getData(res);
}

export async function getKalshiTrades(params: {
  ticker: string;
  taker_side?: "yes" | "no";
  min_amount?: number;
  from?: string;
  to?: string;
  sort_by?: "timestamp" | "notional_volume_usd";
  order?: "asc" | "desc";
  limit?: number;
  offset?: number;
}) {
  const res = await hermodFetch<KalshiTrade>(`${BASE}/trades`, {
    params: params as Record<string, string | number | undefined>,
    revalidate: 60,
  });
  return getData(res);
}

export async function getKalshiOpenInterest(
  ticker: string,
  timeRange: TimeRange = "30d"
) {
  const res = await hermodFetch<KalshiOIPoint>(`${BASE}/open-interest`, {
    params: { ticker, time_range: timeRange },
  });
  return getData(res);
}

export async function getKalshiVolumes(
  ticker: string,
  timeRange: TimeRange = "30d"
) {
  const res = await hermodFetch<KalshiVolumePoint>(`${BASE}/volumes`, {
    params: { ticker, time_range: timeRange },
  });
  return getData(res);
}
