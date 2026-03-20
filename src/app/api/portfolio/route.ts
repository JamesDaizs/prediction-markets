import { NextRequest, NextResponse } from "next/server";
import { getPolymarketPositions } from "@/lib/api/polymarket";

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address");
  if (!address) {
    return NextResponse.json(
      { error: "Address parameter required" },
      { status: 400 }
    );
  }

  try {
    const positions = await getPolymarketPositions(address, {
      status: "active",
      limit: 50,
    });

    const mapped = positions.map((p) => ({
      conditionId: p.condition_id,
      question: p.question,
      outcomeLabel: p.outcome_label,
      balance: p.balance,
      currentPrice: 0, // Would need a separate price fetch per position
      eventTitle: p.event_title,
      status: p.status,
    }));

    return NextResponse.json(mapped);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
