import { NextRequest, NextResponse } from "next/server";
import {
  getCategoryTimeSeries,
  getDashboardTotalsTimeSeries,
} from "@/lib/api/clickhouse";

function rangeToDays(range: string): number {
  switch (range) {
    case "7d": return 7;
    case "14d": return 14;
    case "30d": return 30;
    case "90d": return 90;
    case "180d": return 180;
    case "1y": return 365;
    case "all": return 3650;
    default: return 30;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const range = searchParams.get("range") || "30d";
  const type = searchParams.get("type") || "categories";
  const days = rangeToDays(range);

  try {
    if (type === "totals") {
      const data = await getDashboardTotalsTimeSeries(days);
      return NextResponse.json(data);
    }

    // Default: categories
    const data = await getCategoryTimeSeries(days);
    return NextResponse.json(data);
  } catch (err) {
    console.error("Dashboard timeseries error:", err);
    return NextResponse.json([], { status: 500 });
  }
}
