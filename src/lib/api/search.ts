import { hermodFetch, getData } from "./client";
import type {
  PolymarketEvent,
  KalshiEvent,
  CategoryMetricsItem,
  TimeRange,
} from "./types";

export async function searchPolymarket(
  q: string,
  params?: { status?: string; limit?: number; offset?: number }
) {
  const res = await hermodFetch<PolymarketEvent>("/v1/search/polymarket", {
    params: { q, ...params } as Record<string, string | number | undefined>,
    revalidate: 60,
  });
  return getData(res);
}

export async function searchKalshi(
  q: string,
  params?: { status?: string; limit?: number; offset?: number }
) {
  const res = await hermodFetch<KalshiEvent>("/v1/search/kalshi", {
    params: { q, ...params } as Record<string, string | number | undefined>,
    revalidate: 60,
  });
  return getData(res);
}

export async function getCategoryMetrics(params?: {
  source?: "Kalshi" | "Polymarket";
  category?: string;
  subcategory?: string;
  time_range?: TimeRange;
  limit?: number;
  offset?: number;
}) {
  const res = await hermodFetch<CategoryMetricsItem>(
    "/v1/prediction-market/category-metrics",
    {
      params: params as Record<string, string | number | undefined>,
    }
  );
  return getData(res);
}
