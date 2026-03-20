"use client";

import { useState, useMemo } from "react";
import type { Platform, UnifiedMarket } from "@/lib/api/types";
import { PlatformToggle } from "@/components/platform-toggle";
import { SearchBar } from "@/components/search-bar";
import { MarketTable } from "@/components/market-table";

interface Props {
  markets: UnifiedMarket[];
}

type SortField = "volume" | "openInterest" | "lastPrice";

export function MarketsClient({ markets }: Props) {
  const [platform, setPlatform] = useState<Platform>("both");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("volume");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const filtered = useMemo(() => {
    let result = markets;
    if (platform !== "both") {
      result = result.filter((m) => m.platform === platform);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((m) => m.question.toLowerCase().includes(q));
    }
    result = [...result].sort((a, b) => {
      const mult = sortDir === "desc" ? -1 : 1;
      return (a[sortBy] - b[sortBy]) * mult;
    });
    return result;
  }, [markets, platform, search, sortBy, sortDir]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Market Explorer</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Browse and search {markets.length} markets across Polymarket & Kalshi
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="w-80">
          <SearchBar value={search} onChange={setSearch} />
        </div>
        <PlatformToggle value={platform} onChange={setPlatform} />
        <div className="flex rounded-lg border border-zinc-800 bg-zinc-900/50 p-0.5">
          {(
            [
              ["volume", "Volume"],
              ["openInterest", "OI"],
              ["lastPrice", "Price"],
            ] as const
          ).map(([field, label]) => (
            <button
              key={field}
              onClick={() => {
                if (sortBy === field) {
                  setSortDir((d) => (d === "desc" ? "asc" : "desc"));
                } else {
                  setSortBy(field);
                  setSortDir("desc");
                }
              }}
              className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                sortBy === field
                  ? "bg-zinc-700 text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {label}{" "}
              {sortBy === field && (sortDir === "desc" ? "\u2193" : "\u2191")}
            </button>
          ))}
        </div>
        <span className="text-xs text-zinc-500">
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      <MarketTable markets={filtered} />
    </div>
  );
}
