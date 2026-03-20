"use client";

import { useState } from "react";
import Link from "next/link";
import type {
  Platform,
  PolymarketRankingItem,
  KalshiRankingItem,
} from "@/lib/api/types";
import { PlatformToggle } from "@/components/platform-toggle";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

type RankTab = "volume" | "oi";

interface Props {
  polyByVolume: PolymarketRankingItem[];
  polyByOI: PolymarketRankingItem[];
  kalshiByVolume: KalshiRankingItem[];
  kalshiByOI: KalshiRankingItem[];
}

export function RankingsClient({
  polyByVolume,
  polyByOI,
  kalshiByVolume,
  kalshiByOI,
}: Props) {
  const [platform, setPlatform] = useState<Platform>("both");
  const [tab, setTab] = useState<RankTab>("volume");

  const getList = () => {
    const items: {
      rank: number;
      question: string;
      platform: string;
      value: number;
      href: string;
    }[] = [];

    if (tab === "volume") {
      if (platform !== "kalshi") {
        polyByVolume.forEach((m, i) =>
          items.push({
            rank: i + 1,
            question: m.question,
            platform: "Polymarket",
            value: m.notional_volume_usd,
            href: `/markets/poly-${m.condition_id}`,
          })
        );
      }
      if (platform !== "polymarket") {
        kalshiByVolume.forEach((m, i) =>
          items.push({
            rank: i + 1,
            question: m.title,
            platform: "Kalshi",
            value: m.notional_volume_usd,
            href: `/markets/kalshi-${m.market_ticker}`,
          })
        );
      }
    } else {
      if (platform !== "kalshi") {
        polyByOI.forEach((m, i) =>
          items.push({
            rank: i + 1,
            question: m.question,
            platform: "Polymarket",
            value: m.open_interest_usd,
            href: `/markets/poly-${m.condition_id}`,
          })
        );
      }
      if (platform !== "polymarket") {
        kalshiByOI.forEach((m, i) =>
          items.push({
            rank: i + 1,
            question: m.title,
            platform: "Kalshi",
            value: m.open_interest,
            href: `/markets/kalshi-${m.market_ticker}`,
          })
        );
      }
    }

    return items.sort((a, b) => b.value - a.value).slice(0, 50);
  };

  const list = getList();
  const maxValue = list[0]?.value || 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Rankings</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Top markets by volume and open interest
        </p>
      </div>

      <div className="flex items-center gap-3">
        <PlatformToggle value={platform} onChange={setPlatform} />
        <div className="flex rounded-lg border border-zinc-800 bg-zinc-900/50 p-0.5">
          {(["volume", "oi"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                tab === t
                  ? "bg-zinc-700 text-white"
                  : "text-zinc-400 hover:text-white"
              )}
            >
              {t === "volume" ? "By Volume" : "By Open Interest"}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {list.map((item, i) => (
          <Link
            key={`${item.platform}-${item.question}-${i}`}
            href={item.href}
            className="flex items-center gap-3 rounded-lg border border-zinc-800/50 bg-zinc-900/30 px-4 py-3 transition-colors hover:bg-zinc-800/50"
          >
            <span className="w-8 text-right text-sm font-medium text-zinc-500">
              {i + 1}
            </span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm text-white">
                  {item.question.slice(0, 60)}
                  {item.question.length > 60 ? "..." : ""}
                </span>
                <span
                  className={`text-xs ${
                    item.platform === "Polymarket"
                      ? "text-violet-400"
                      : "text-blue-400"
                  }`}
                >
                  {item.platform}
                </span>
              </div>
              <div className="mt-1 h-1 w-full rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-violet-600"
                  style={{ width: `${(item.value / maxValue) * 100}%` }}
                />
              </div>
            </div>
            <span className="text-sm font-medium text-zinc-300">
              {formatCurrency(item.value, true)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
