import { NextRequest, NextResponse } from "next/server";
import {
  getCategoryTimeSeries,
  getDashboardTotalsTimeSeries,
  type TimeRangeLabel,
} from "@/lib/queries/markets";

export const dynamic = "force-dynamic";

const VALID_RANGES: TimeRangeLabel[] = ["7d", "30d", "90d", "180d", "1y"];

function normalizeRange(raw: string): TimeRangeLabel {
  if (raw === "14d") return "30d";
  if (raw === "all") return "1y";
  if ((VALID_RANGES as string[]).includes(raw)) return raw as TimeRangeLabel;
  return "30d";
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const range = normalizeRange(searchParams.get("range") || "30d");
  const type = searchParams.get("type") || "categories";

  try {
    if (type === "totals") {
      const data = await getDashboardTotalsTimeSeries(range);
      return NextResponse.json(data);
    }
    const data = await getCategoryTimeSeries(range);
    return NextResponse.json(data);
  } catch (err) {
    console.error("dashboard-timeseries error:", err);
    return NextResponse.json([], { status: 500 });
  }
}
