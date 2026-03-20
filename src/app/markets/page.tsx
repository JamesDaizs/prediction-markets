export const dynamic = "force-dynamic";

import { getPolymarketRanking } from "@/lib/api/polymarket";
import { getKalshiRanking } from "@/lib/api/kalshi";
import { unifyPolymarketMarket, unifyKalshiMarket } from "@/lib/utils";
import { MarketsClient } from "./markets-client";

export default async function MarketsPage() {
  const [polyMarkets, kalshiMarkets] = await Promise.all([
    getPolymarketRanking({ sort_by: "notional_volume_usd", limit: 50 }),
    getKalshiRanking({ sort_by: "notional_volume_usd", limit: 50 }),
  ]);

  const unified = [
    ...polyMarkets.map(unifyPolymarketMarket),
    ...kalshiMarkets.map(unifyKalshiMarket),
  ].sort((a, b) => b.volume - a.volume);

  return <MarketsClient markets={unified} />;
}
