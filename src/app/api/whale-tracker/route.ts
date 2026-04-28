import { NextRequest, NextResponse } from "next/server";
import {
  getWhaleTrades,
  getTopTraders,
  getHotMarkets,
  searchMarkets,
  getWalletStatsAndTrades,
} from "@/lib/queries/whales";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const tab = sp.get("tab") || "whales";

  try {
    if (tab === "whales") {
      const data = await getWhaleTrades(50);
      return NextResponse.json(data);
    }

    if (tab === "traders") {
      const rawSort = sp.get("sort") || "volume";
      const sortBy = (rawSort === "count" ? "count" : "volume") as "volume" | "count";
      const data = await getTopTraders(50, sortBy);
      return NextResponse.json(data);
    }

    if (tab === "hot") {
      const data = await getHotMarkets(30);
      return NextResponse.json(data);
    }

    if (tab === "lookup") {
      const q = sp.get("q") || "";
      if (q.length < 2 || q.length > 200) return NextResponse.json([]);
      const data = await searchMarkets(q, 50);
      return NextResponse.json(data);
    }

    if (tab === "wallet") {
      const address = sp.get("address") || "";
      if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
        return NextResponse.json({ error: "Invalid address" }, { status: 400 });
      }
      const data = await getWalletStatsAndTrades(address);
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: "Invalid tab" }, { status: 400 });
  } catch (err) {
    console.error("whale-tracker API error:", err);
    return NextResponse.json({ error: "Query failed" }, { status: 500 });
  }
}
