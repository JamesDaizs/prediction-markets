import { NextRequest, NextResponse } from "next/server";
import {
  getWhaleTrades,
  getTopTraders,
  getHotMarkets,
  searchMarkets,
  getWalletStats,
  getWalletTrades,
} from "@/lib/api/clickhouse";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const tab = sp.get("tab") || "whales";
  const days = parseInt(sp.get("days") || "7", 10);

  try {
    if (tab === "whales") {
      const data = await getWhaleTrades(days, 50);
      return NextResponse.json(data);
    }

    if (tab === "traders") {
      const sortBy = (sp.get("sort") || "volume") as "volume" | "count";
      const data = await getTopTraders(days, 50, sortBy);
      return NextResponse.json(data);
    }

    if (tab === "hot") {
      const data = await getHotMarkets(days, 30);
      return NextResponse.json(data);
    }

    if (tab === "lookup") {
      const q = sp.get("q") || "";
      if (q.length < 2) return NextResponse.json([]);
      const data = await searchMarkets(q);
      return NextResponse.json(data);
    }

    if (tab === "wallet") {
      const address = sp.get("address") || "";
      if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
        return NextResponse.json(
          { error: "Invalid address" },
          { status: 400 }
        );
      }
      const [stats, trades] = await Promise.all([
        getWalletStats(address),
        getWalletTrades(address),
      ]);
      return NextResponse.json({ stats, trades });
    }

    return NextResponse.json({ error: "Invalid tab" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
