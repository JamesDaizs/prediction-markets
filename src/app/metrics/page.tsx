export const dynamic = "force-dynamic";

import {
  getPlatformActiveWallets,
  getPlatformTransactions,
  getPlatformVolumeByCategory,
  getPlatformNewMarkets,
  getPlatformOI,
} from "@/lib/api/clickhouse";
import { MetricsClient } from "./metrics-client";

export default async function MetricsPage() {
  const [wallets, transactions, volumeByCat, newMarkets, oi] =
    await Promise.all([
      getPlatformActiveWallets("weekly", 12),
      getPlatformTransactions("weekly", 12),
      getPlatformVolumeByCategory("weekly", 12),
      getPlatformNewMarkets("weekly", 12),
      getPlatformOI("weekly", 12),
    ]);

  return (
    <MetricsClient
      initialWallets={wallets}
      initialTransactions={transactions}
      initialVolumeByCategory={volumeByCat}
      initialNewMarkets={newMarkets}
      initialOI={oi}
    />
  );
}
