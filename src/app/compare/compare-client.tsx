"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { ChevronDown, ChevronRight } from "lucide-react";

interface MarketItem {
  name: string;
  volume: number;
  oi: number;
}

interface CategoryRow {
  name: string;
  polyVolume: number;
  kalshiVolume: number;
  polyOI: number;
  kalshiOI: number;
  polyMarkets: MarketItem[];
  kalshiMarkets: MarketItem[];
  totalVolume: number;
}

interface Props {
  categories: CategoryRow[];
}

export function CompareClient({ categories }: Props) {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleExpand = (name: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const maxVolume = Math.max(...filtered.map((c) => c.totalVolume), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Compare</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Side-by-side Polymarket vs Kalshi by category
        </p>
      </div>

      <input
        type="text"
        placeholder="Filter categories..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-sm rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
      />

      {/* Header */}
      <div className="grid grid-cols-[1fr_200px_1fr] items-center gap-4 px-4 text-xs font-medium text-zinc-500">
        <div className="text-right">
          <span className="text-violet-400">Polymarket</span>
        </div>
        <div className="text-center">Category</div>
        <div>
          <span className="text-blue-400">Kalshi</span>
        </div>
      </div>

      {/* Category rows */}
      <div className="space-y-1">
        {filtered.map((cat) => {
          const isExpanded = expanded.has(cat.name);
          const polyPct =
            cat.totalVolume > 0
              ? (cat.polyVolume / cat.totalVolume) * 100
              : 50;

          return (
            <div key={cat.name}>
              {/* Main row */}
              <button
                onClick={() => toggleExpand(cat.name)}
                className="grid w-full grid-cols-[1fr_200px_1fr] items-center gap-4 rounded-lg px-4 py-3 text-left transition-colors hover:bg-zinc-800/50"
              >
                {/* Polymarket side */}
                <div className="text-right">
                  <div className="text-sm text-white">
                    {formatCurrency(cat.polyVolume, true)}
                  </div>
                  <div className="text-xs text-zinc-500">
                    OI: {formatCurrency(cat.polyOI, true)}
                  </div>
                </div>

                {/* Center: category name + proportion bar */}
                <div className="flex flex-col items-center gap-1.5">
                  <div className="flex items-center gap-1.5">
                    {isExpanded ? (
                      <ChevronDown className="h-3 w-3 text-zinc-500" />
                    ) : (
                      <ChevronRight className="h-3 w-3 text-zinc-500" />
                    )}
                    <span className="text-sm font-medium text-white">
                      {cat.name}
                    </span>
                  </div>
                  {/* Proportion bar */}
                  <div className="flex h-1.5 w-full overflow-hidden rounded-full">
                    <div
                      className="bg-violet-500"
                      style={{ width: `${polyPct}%` }}
                    />
                    <div
                      className="bg-blue-500"
                      style={{ width: `${100 - polyPct}%` }}
                    />
                  </div>
                  {/* Scale bar */}
                  <div className="h-1 w-full rounded-full bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-zinc-600"
                      style={{
                        width: `${(cat.totalVolume / maxVolume) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Kalshi side */}
                <div>
                  <div className="text-sm text-white">
                    {formatCurrency(cat.kalshiVolume, true)}
                  </div>
                  <div className="text-xs text-zinc-500">
                    OI: {formatCurrency(cat.kalshiOI, true)}
                  </div>
                </div>
              </button>

              {/* Expanded market details */}
              {isExpanded && (
                <div className="mx-4 mb-2 grid grid-cols-2 gap-4 rounded-lg border border-zinc-800/50 bg-zinc-900/30 p-4">
                  {/* Polymarket markets */}
                  <div>
                    <h4 className="mb-2 text-xs font-medium text-violet-400">
                      Polymarket ({cat.polyMarkets.length})
                    </h4>
                    {cat.polyMarkets.length === 0 ? (
                      <p className="text-xs text-zinc-600">No markets</p>
                    ) : (
                      <div className="space-y-1">
                        {cat.polyMarkets.map((m, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between gap-2 text-xs"
                          >
                            <span className="truncate text-zinc-300">
                              {m.name}
                            </span>
                            <span className="shrink-0 text-zinc-500">
                              {formatCurrency(m.volume, true)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Kalshi markets */}
                  <div>
                    <h4 className="mb-2 text-xs font-medium text-blue-400">
                      Kalshi ({cat.kalshiMarkets.length})
                    </h4>
                    {cat.kalshiMarkets.length === 0 ? (
                      <p className="text-xs text-zinc-600">No markets</p>
                    ) : (
                      <div className="space-y-1">
                        {cat.kalshiMarkets.map((m, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between gap-2 text-xs"
                          >
                            <span className="truncate text-zinc-300">
                              {m.name}
                            </span>
                            <span className="shrink-0 text-zinc-500">
                              {formatCurrency(m.volume, true)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="py-8 text-center text-sm text-zinc-500">
            No categories match your filter
          </div>
        )}
      </div>
    </div>
  );
}
