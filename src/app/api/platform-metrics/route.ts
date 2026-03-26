import { NextRequest, NextResponse } from "next/server";
import {
  getPlatformActiveWallets,
  getPlatformTransactions,
  getPlatformVolumeByCategory,
  getPlatformNewMarkets,
  getPlatformOI,
  type Granularity,
} from "@/lib/api/clickhouse";

const VALID_GRANULARITIES = new Set(["weekly", "monthly"]);
const VALID_METRICS = new Set([
  "wallets",
  "transactions",
  "volume",
  "new_markets",
  "oi",
]);

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const metric = sp.get("metric") || "transactions";
  const granularity = sp.get("granularity") || "weekly";

  if (!VALID_METRICS.has(metric)) {
    return NextResponse.json({ error: "Invalid metric" }, { status: 400 });
  }
  if (!VALID_GRANULARITIES.has(granularity)) {
    return NextResponse.json(
      { error: "Invalid granularity" },
      { status: 400 }
    );
  }

  const g = granularity as Granularity;

  try {
    let data;
    switch (metric) {
      case "wallets":
        data = await getPlatformActiveWallets(g);
        break;
      case "transactions":
        data = await getPlatformTransactions(g);
        break;
      case "volume":
        data = await getPlatformVolumeByCategory(g);
        break;
      case "new_markets":
        data = await getPlatformNewMarkets(g);
        break;
      case "oi":
        data = await getPlatformOI(g);
        break;
    }
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
