export const dynamic = "force-dynamic";

import { getMarketRanking } from "@/lib/api/clickhouse";
import { unifyFromClickHouse } from "@/lib/utils";
import { MarketsClient } from "./markets-client";

export default async function MarketsPage() {
  const markets = await getMarketRanking({ limit: 300, sortBy: "volume" });
  const unified = markets.map(unifyFromClickHouse).sort((a, b) => b.volume - a.volume);

  return <MarketsClient markets={unified} />;
}
