import { NextRequest, NextResponse } from "next/server";
import { getPolymarketPositions, getPolymarketPrices } from "@/lib/api/polymarket";

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

    // Fetch current prices in parallel (max 5 concurrent)
    // One API call returns both sides, so deduplicate by condition_id
    const BATCH_SIZE = 5;
    const priceMap = new Map<string, number>();
    const fetchedConditions = new Set<string>();

    for (let i = 0; i < positions.length; i += BATCH_SIZE) {
      const batch = positions.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async (p) => {
          if (fetchedConditions.has(p.condition_id)) return;
          fetchedConditions.add(p.condition_id);
          try {
            const prices = await getPolymarketPrices(p.condition_id, "7d", "latest");
            if (prices[0]) {
              const sideA = prices[0].side_a?.price ?? 0;
              const sideB = prices[0].side_b?.price ?? 0;
              // Store price for the outcome the user holds
              const price =
                p.outcome_label.toLowerCase() === "yes" ||
                p.outcome_label === prices[0].side_a?.label
                  ? sideA
                  : sideB;
              priceMap.set(`${p.condition_id}:${p.outcome_label}`, price);
            }
          } catch {
            // Price fetch failed — leave as 0
          }
        })
      );
    }

    const mapped = positions.map((p) => ({
      conditionId: p.condition_id,
      question: p.question,
      outcomeLabel: p.outcome_label,
      balance: p.balance,
      currentPrice: priceMap.get(`${p.condition_id}:${p.outcome_label}`) ?? 0,
      eventTitle: p.event_title,
      status: p.status,
    }));

    return NextResponse.json(mapped);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
