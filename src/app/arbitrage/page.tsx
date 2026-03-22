export const dynamic = "force-dynamic";

import { getPolymarketRanking, getPolymarketPrices } from "@/lib/api/polymarket";
import { getKalshiRanking } from "@/lib/api/kalshi";
import { ArbitrageClient } from "./arbitrage-client";

interface MatchCandidate {
  polyId: string;
  polyQuestion: string;
  polyPrice: number;
  polyVolume: number;
  polyLink: string;
  kalshiTicker: string;
  kalshiTitle: string;
  kalshiPrice: number;
  kalshiVolume: number;
  kalshiLink: string;
  spread: number;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

function jaccardSimilarity(a: string[], b: string[]): number {
  const setA = new Set(a);
  const setB = new Set(b);
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return union.size > 0 ? intersection.size / union.size : 0;
}

export default async function ArbitragePage() {
  const [polyMarkets, kalshiMarkets] = await Promise.all([
    getPolymarketRanking({ sort_by: "open_interest", limit: 50 }),
    getKalshiRanking({ sort_by: "open_interest", limit: 50 }),
  ]);

  // Fuzzy match markets across platforms
  const rawMatches: {
    poly: (typeof polyMarkets)[0];
    kalshi: (typeof kalshiMarkets)[0];
  }[] = [];

  const polyTokens = polyMarkets.map((m) => ({
    market: m,
    tokens: tokenize(m.question),
  }));
  const kalshiTokens = kalshiMarkets.map((m) => ({
    market: m,
    tokens: tokenize(m.title),
  }));

  for (const poly of polyTokens) {
    let bestMatch: (typeof kalshiTokens)[0] | null = null;
    let bestScore = 0;
    for (const kalshi of kalshiTokens) {
      const score = jaccardSimilarity(poly.tokens, kalshi.tokens);
      if (score > bestScore && score > 0.3) {
        bestScore = score;
        bestMatch = kalshi;
      }
    }
    if (bestMatch) {
      rawMatches.push({ poly: poly.market, kalshi: bestMatch.market });
    }
  }

  // Fetch real Polymarket prices for matched markets in batches of 5
  const BATCH_SIZE = 5;
  const priceResults: (number | null)[] = [];
  for (let i = 0; i < rawMatches.length; i += BATCH_SIZE) {
    const batch = rawMatches.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(async ({ poly }) => {
        try {
          const prices = await getPolymarketPrices(poly.condition_id, "7d", "latest");
          return prices[0]?.side_a?.price ?? null;
        } catch {
          return null;
        }
      })
    );
    priceResults.push(...batchResults);
  }

  // Build final matches with real prices
  const matches: MatchCandidate[] = rawMatches.map(({ poly, kalshi }, i) => {
    const polyPrice = priceResults[i] ?? 0;
    const kalshiPrice = kalshi.last_price;
    const spread = Math.abs(polyPrice - kalshiPrice);

    return {
      polyId: poly.condition_id,
      polyQuestion: poly.question,
      polyPrice,
      polyVolume: poly.notional_volume_usd,
      polyLink: poly.polymarket_link,
      kalshiTicker: kalshi.market_ticker,
      kalshiTitle: kalshi.title,
      kalshiPrice,
      kalshiVolume: kalshi.notional_volume_usd,
      kalshiLink: `https://kalshi.com/markets/${kalshi.market_ticker.toLowerCase()}`,
      spread,
    };
  });

  // Sort by spread descending
  matches.sort((a, b) => b.spread - a.spread);

  return <ArbitrageClient matches={matches} />;
}
