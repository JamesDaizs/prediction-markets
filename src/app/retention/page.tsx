export const dynamic = "force-dynamic";

import { getWalletGrowth, getWalletLifecycle } from "@/lib/api/clickhouse";
import { RetentionClient } from "./retention-client";

export default async function RetentionPage() {
  const [growth, lifecycle] = await Promise.all([
    getWalletGrowth(90),
    getWalletLifecycle(),
  ]);

  return <RetentionClient initialGrowth={growth} initialLifecycle={lifecycle} />;
}
