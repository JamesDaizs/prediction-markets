import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type {
  PolymarketRankingItem,
  KalshiRankingItem,
  UnifiedMarket,
} from "./api/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, compact = false): string {
  if (compact) {
    if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number, compact = false): string {
  if (compact) {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  }
  return new Intl.NumberFormat("en-US").format(Math.round(value));
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatTimestamp(ts: number): string {
  if (!ts) return "-";
  return new Date(ts * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatTimeAgo(ts: number): string {
  const seconds = Math.floor(Date.now() / 1000 - ts);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function shortenAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr || "-";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function unifyPolymarketMarket(
  m: PolymarketRankingItem
): UnifiedMarket {
  return {
    id: m.condition_id,
    platform: "polymarket",
    question: m.question,
    status: m.status,
    volume: m.notional_volume_usd,
    openInterest: m.open_interest_usd,
    lastPrice: 0, // ranking doesn't have price
    endTime: m.end_time,
    link: m.polymarket_link,
  };
}

export function unifyKalshiMarket(m: KalshiRankingItem): UnifiedMarket {
  return {
    id: m.market_ticker,
    platform: "kalshi",
    question: m.title,
    status: m.status,
    volume: m.notional_volume_usd,
    openInterest: m.open_interest,
    lastPrice: m.last_price,
    endTime: m.timestamp,
    category: m.category,
    link: `https://kalshi.com/markets/${m.market_ticker.toLowerCase()}`,
  };
}
