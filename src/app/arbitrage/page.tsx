export const dynamic = "force-dynamic";

import { getPolymarketRanking } from "@/lib/api/polymarket";
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
  const matches: MatchCandidate[] = [];
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
      // Estimate price from available data
      const polyPrice = 0.5; // ranking doesn't have price, placeholder
      const kalshiPrice = bestMatch.market.last_price;
      const spread = Math.abs(polyPrice - kalshiPrice);

      matches.push({
        polyId: poly.market.condition_id,
        polyQuestion: poly.market.question,
        polyPrice,
        polyVolume: poly.market.notional_volume_usd,
        polyLink: poly.market.polymarket_link,
        kalshiTicker: bestMatch.market.market_ticker,
        kalshiTitle: bestMatch.market.title,
        kalshiPrice,
        kalshiVolume: bestMatch.market.notional_volume_usd,
        kalshiLink: `https://kalshi.com/markets/${bestMatch.market.market_ticker.toLowerCase()}`,
        spread,
      });
    }
  }

  // Sort by spread descending
  matches.sort((a, b) => b.spread - a.spread);

  return <ArbitrageClient matches={matches} />;
}
