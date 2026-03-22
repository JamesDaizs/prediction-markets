export const dynamic = "force-dynamic";

import {
  getCategoryBreakdown,
  getMarketRanking,
} from "@/lib/api/clickhouse";
import { CompareClient } from "./compare-client";

export default async function ComparePage() {
  const [catRows, markets] = await Promise.all([
    getCategoryBreakdown(),
    getMarketRanking({ limit: 200 }),
  ]);

  // Build per-category comparison data
  const catMap = new Map<
    string,
    {
      polyVolume: number;
      kalshiVolume: number;
      polyOI: number;
      kalshiOI: number;
      polyMarkets: { name: string; volume: number; oi: number }[];
      kalshiMarkets: { name: string; volume: number; oi: number }[];
    }
  >();

  const ensure = (cat: string) => {
    if (!catMap.has(cat)) {
      catMap.set(cat, {
        polyVolume: 0,
        kalshiVolume: 0,
        polyOI: 0,
        kalshiOI: 0,
        polyMarkets: [],
        kalshiMarkets: [],
      });
    }
    return catMap.get(cat)!;
  };

  // Aggregate from category breakdown
  for (const row of catRows) {
    const cat = row.category || "Other";
    const entry = ensure(cat);
    if (row.source === "Polymarket") {
      entry.polyVolume += row.volume;
      entry.polyOI += row.oi;
    } else {
      entry.kalshiVolume += row.volume;
      entry.kalshiOI += row.oi;
    }
  }

  // Add individual markets per category
  for (const m of markets) {
    const cat = m.category || "Other";
    const entry = ensure(cat);
    if (m.source === "Polymarket") {
      entry.polyMarkets.push({
        name: m.title,
        volume: m.notional_volume_usd,
        oi: m.open_interest_usd,
      });
    } else {
      entry.kalshiMarkets.push({
        name: m.title,
        volume: m.notional_volume_usd,
        oi: m.open_interest_usd,
      });
    }
  }

  const categories = Array.from(catMap.entries())
    .map(([name, data]) => ({
      name,
      ...data,
      polyMarkets: data.polyMarkets
        .sort((a, b) => b.volume - a.volume)
        .slice(0, 20),
      kalshiMarkets: data.kalshiMarkets
        .sort((a, b) => b.volume - a.volume)
        .slice(0, 20),
      totalVolume: data.polyVolume + data.kalshiVolume,
    }))
    .filter((c) => c.totalVolume > 0)
    .sort((a, b) => b.totalVolume - a.totalVolume);

  return <CompareClient categories={categories} />;
}
