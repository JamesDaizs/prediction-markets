export const dynamic = "force-dynamic";

import { getPolymarketRanking } from "@/lib/api/polymarket";
import { getKalshiRanking } from "@/lib/api/kalshi";
import { RankingsClient } from "./rankings-client";

export default async function RankingsPage() {
  const [polyByVolume, polyByOI, kalshiByVolume, kalshiByOI] =
    await Promise.all([
      getPolymarketRanking({
        sort_by: "notional_volume_usd",
        limit: 50,
      }),
      getPolymarketRanking({ sort_by: "open_interest", limit: 50 }),
      getKalshiRanking({
        sort_by: "notional_volume_usd",
        limit: 50,
      }),
      getKalshiRanking({ sort_by: "open_interest", limit: 50 }),
    ]);

  return (
    <RankingsClient
      polyByVolume={polyByVolume}
      polyByOI={polyByOI}
      kalshiByVolume={kalshiByVolume}
      kalshiByOI={kalshiByOI}
    />
  );
}
