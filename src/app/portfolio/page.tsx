export const dynamic = "force-dynamic";

import { getWhaleTrades } from "@/lib/queries/whales";
import { WhaleTrackerClient } from "./whale-tracker-client";

export default async function WhaleTrackerPage() {
  let initialWhales: Awaited<ReturnType<typeof getWhaleTrades>> = [];
  try {
    initialWhales = await getWhaleTrades(50);
  } catch (err) {
    console.error("Failed to load whale trades:", err);
  }

  return <WhaleTrackerClient initialWhales={initialWhales} />;
}
