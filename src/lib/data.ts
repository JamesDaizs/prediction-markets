import { promises as fs } from "fs";
import path from "path";
import type {
  Overview,
  Category,
  Market,
  TraderStats,
  MarketDetail,
  Meta,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "public", "data");

async function loadJson<T>(filename: string): Promise<T> {
  const raw = await fs.readFile(path.join(DATA_DIR, filename), "utf-8");
  return JSON.parse(raw) as T;
}

export async function getOverview(): Promise<Overview> {
  return loadJson<Overview>("overview.json");
}

export async function getCategories(): Promise<Category[]> {
  return loadJson<Category[]>("categories.json");
}

export async function getMarkets(): Promise<Market[]> {
  return loadJson<Market[]>("top_markets.json");
}

export async function getTraderStats(): Promise<TraderStats> {
  return loadJson<TraderStats>("trader_stats.json");
}

export async function getMarketDetail(
  conditionId: string
): Promise<MarketDetail | null> {
  try {
    return await loadJson<MarketDetail>(
      `market_details/${conditionId}.json`
    );
  } catch {
    return null;
  }
}

export async function getMeta(): Promise<Meta> {
  return loadJson<Meta>("meta.json");
}
