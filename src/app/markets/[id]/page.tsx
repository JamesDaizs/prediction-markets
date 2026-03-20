export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getKalshiMarkets } from "@/lib/api/kalshi";
import { MarketDetailClient } from "./market-detail-client";

function parseMarketId(id: string): {
  platform: "polymarket" | "kalshi";
  marketId: string;
} {
  if (id.startsWith("poly-")) {
    return { platform: "polymarket", marketId: id.slice(5) };
  }
  if (id.startsWith("kalshi-")) {
    return { platform: "kalshi", marketId: id.slice(7) };
  }
  return { platform: "polymarket", marketId: id };
}

export default async function MarketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { platform, marketId } = parseMarketId(id);

  let title = "";
  let status = "";
  let link = "";
  const conditionId = platform === "polymarket" ? marketId : "";
  const ticker = platform === "kalshi" ? marketId : "";
  const labelA = "Yes";
  const labelB = "No";

  if (platform === "polymarket") {
    title = "Polymarket Market";
    link = "https://polymarket.com";
  } else {
    const markets = await getKalshiMarkets({
      market_ticker: ticker,
      limit: 1,
    });
    if (markets.length > 0) {
      const m = markets[0];
      title = m.title;
      status = m.status;
      link = `https://kalshi.com/markets/${ticker.toLowerCase()}`;
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/markets"
          className="rounded-lg border border-zinc-800 p-2 text-zinc-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white">
            {title || `Market ${marketId.slice(0, 12)}...`}
          </h1>
          <div className="mt-1 flex items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                platform === "polymarket"
                  ? "bg-violet-900/50 text-violet-300"
                  : "bg-blue-900/50 text-blue-300"
              }`}
            >
              {platform === "polymarket" ? "Polymarket" : "Kalshi"}
            </span>
            {status && (
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  status === "active"
                    ? "bg-green-900/50 text-green-300"
                    : "bg-zinc-800 text-zinc-400"
                }`}
              >
                {status}
              </span>
            )}
            {link && (
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-zinc-500 hover:text-white"
              >
                View on platform <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      </div>

      <MarketDetailClient
        platform={platform}
        conditionId={conditionId}
        ticker={ticker}
        labelA={labelA}
        labelB={labelB}
      />
    </div>
  );
}
