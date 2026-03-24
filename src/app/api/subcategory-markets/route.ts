import { NextResponse } from "next/server";
import { getSubcategoryMarkets } from "@/lib/api/clickhouse";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") || "";
  const subcategory = searchParams.get("subcategory") || "";
  const platform = (searchParams.get("platform") || "both") as
    | "both"
    | "polymarket"
    | "kalshi";
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

  if (!category || !subcategory) {
    return NextResponse.json(
      { error: "Missing category or subcategory" },
      { status: 400 }
    );
  }

  try {
    const markets = await getSubcategoryMarkets(
      category,
      subcategory,
      platform,
      limit
    );
    return NextResponse.json(markets, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
      },
    });
  } catch {
    return NextResponse.json({ error: "Query failed" }, { status: 500 });
  }
}
