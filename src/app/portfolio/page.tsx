export const dynamic = "force-dynamic";

import { getWhaleTrades } from "@/lib/api/clickhouse";
import { WhaleTrackerClient } from "./whale-tracker-client";

export default async function WhaleTrackerPage() {
  // Only fetch the default tab (whale trades) on SSR — other tabs load on demand
  const whaleTrades = await getWhaleTrades(7, 50);

  return (
    <WhaleTrackerClient
      initialWhales={whaleTrades}
    />
  );
}
