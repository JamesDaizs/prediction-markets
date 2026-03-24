import { NextRequest, NextResponse } from "next/server";
import {
  getWalletRetention,
  getWalletGrowth,
  getWalletLifecycle,
} from "@/lib/api/clickhouse";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const type = sp.get("type") || "growth";

  try {
    if (type === "cohort") {
      const data = await getWalletRetention();
      return NextResponse.json(data);
    }

    if (type === "growth") {
      const days = Math.min(Math.max(parseInt(sp.get("days") || "90", 10) || 90, 7), 365);
      const data = await getWalletGrowth(days);
      return NextResponse.json(data);
    }

    if (type === "lifecycle") {
      const data = await getWalletLifecycle();
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
