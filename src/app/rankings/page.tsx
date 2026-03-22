export const dynamic = "force-dynamic";

import { getMarketRanking } from "@/lib/api/clickhouse";
import { RankingsClient } from "./rankings-client";

export default async function RankingsPage() {
  const [byVolume, byOI] = await Promise.all([
    getMarketRanking({ limit: 100, sortBy: "volume" }),
    getMarketRanking({ limit: 100, sortBy: "oi" }),
  ]);

  return <RankingsClient byVolume={byVolume} byOI={byOI} />;
}
