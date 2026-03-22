"use client";

import { useState } from "react";
import Link from "next/link";
import type { Platform } from "@/lib/api/types";
import type { CHMarketRow } from "@/lib/api/clickhouse";
import { PlatformToggle } from "@/components/platform-toggle";
import { formatCurrency, cn } from "@/lib/utils";

type RankTab = "volume" | "oi";

interface Props {
  byVolume: CHMarketRow[];
  byOI: CHMarketRow[];
}

function marketHref(m: CHMarketRow): string {
  return m.source === "Kalshi"
    ? `/markets/kalshi-${m.market_id}`
    : `/markets/poly-${m.market_id}`;
}

export function RankingsClient({ byVolume, byOI }: Props) {
  const [platform, setPlatform] = useState<Platform>("both");
  const [tab, setTab] = useState<RankTab>("volume");

  const getList = () => {
    const source = tab === "volume" ? byVolume : byOI;
    const filtered =
      platform === "both"
        ? source
        : source.filter(
            (m) =>
              m.source.toLowerCase() ===
              (platform === "polymarket" ? "polymarket" : "kalshi")
          );

    return filtered.slice(0, 50).map((m) => ({
      question: m.title,
      platform: m.source,
      value:
        tab === "volume" ? m.notional_volume_usd : m.open_interest_usd,
      href: marketHref(m),
    }));
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
