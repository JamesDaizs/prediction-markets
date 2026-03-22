"use client";

import { useState } from "react";
import { PlatformToggle } from "@/components/platform-toggle";
import { ViewToggle, type ViewMode } from "@/components/view-toggle";
import { CategoryTreemap, type HierarchicalNode } from "@/components/charts/treemap";
import { CategoryBarChart } from "@/components/charts/bar-chart";
import type { Platform } from "@/lib/api/types";
import { formatCurrency } from "@/lib/utils";
import { ChevronDown, ChevronRight } from "lucide-react";

interface CompareCategory {
  name: string;
  polymarket: number;
  kalshi: number;
  total: number;
  polyMarkets: { name: string; value: number }[];
  kalshiMarkets: { name: string; value: number }[];
}

interface Props {
  treemapData: { name: string; size: number }[];
  barData: { name: string; polymarket: number; kalshi: number }[];
  topMarkets: { name: string; value: number; platform: string }[];
  hierarchicalData?: HierarchicalNode[];
  compareData?: CompareCategory[];
}

export function DashboardClient({ treemapData, barData, topMarkets, hierarchicalData, compareData }: Props) {
  const [platform, setPlatform] = useState<Platform>("both");
  const [view, setView] = useState<ViewMode>("treemap");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Filter bar data by platform
  const filteredBar = barData.map((d) => {
    if (platform === "polymarket")
      return { name: d.name, polymarket: d.polymarket, kalshi: 0 };
    if (platform === "kalshi")
      return { name: d.name, polymarket: 0, kalshi: d.kalshi };
    return d;
  });

  // Filter treemap by platform
  const filteredTreemap = barData
    .map((d) => {
      const size =
        platform === "polymarket"
          ? d.polymarket
          : platform === "kalshi"
            ? d.kalshi
            : d.polymarket + d.kalshi;
      return { name: d.name, size };
    })
    .filter((d) => d.size > 0)
    .sort((a, b) => b.size - a.size);

  const toggleExpand = (name: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  return (
    <>
      <div className="flex items-center gap-3">
        <PlatformToggle value={platform} onChange={setPlatform} />
        <ViewToggle value={view} onChange={setView} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {view === "treemap" && (
          <>
            <CategoryTreemap
              data={filteredTreemap}
              hierarchicalData={platform === "both" ? hierarchicalData : undefined}
              title="Open Interest by Category"
              valueLabel="OI"
            />
            <CategoryBarChart
              data={filteredBar}
              title="Open Interest by Category (Stacked)"
              stacked
            />
          </>
        )}

        {view === "bar" && (
          <>
            <CategoryBarChart
              data={filteredBar}
              title="Open Interest by Category"
            />
            <CategoryBarChart
              data={filteredBar}
              title="OI Share (%)"
              showPercentage
            />
          </>
        )}

        {view === "compare" && compareData && (
          <div className="col-span-2 space-y-1">
            {/* Header */}
            <div className="grid grid-cols-[1fr_200px_1fr] items-center gap-4 px-4 pb-2 text-xs font-medium text-zinc-500">
              <div className="text-right">
                <span className="text-violet-400">Polymarket</span>
              </div>
              <div className="text-center">Category</div>
              <div>
                <span className="text-blue-400">Kalshi</span>
              </div>
            </div>

            {compareData.map((cat) => {
              const isExpanded = expanded.has(cat.name);
              const polyPct =
                cat.total > 0 ? (cat.polymarket / cat.total) * 100 : 50;
              const maxTotal = compareData[0]?.total ?? 1;

              return (
                <div key={cat.name}>
                  <button
                    onClick={() => toggleExpand(cat.name)}
                    className="grid w-full grid-cols-[1fr_200px_1fr] items-center gap-4 rounded-lg px-4 py-3 text-left transition-colors hover:bg-zinc-800/50"
                  >
                    <div className="text-right">
                      <div className="text-sm text-white">
                        {formatCurrency(cat.polymarket, true)}
                      </div>
                    </div>

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
                      <div className="h-1 w-full rounded-full bg-zinc-800">
                        <div
                          className="h-full rounded-full bg-zinc-600"
                          style={{
                            width: `${(cat.total / maxTotal) * 100}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-white">
                        {formatCurrency(cat.kalshi, true)}
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="mx-4 mb-2 grid grid-cols-2 gap-4 rounded-lg border border-zinc-800/50 bg-zinc-900/30 p-4">
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
                                  {formatCurrency(m.value, true)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
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
                                  {formatCurrency(m.value, true)}
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
          </div>
        )}

        {view === "table" && (
          <div className="col-span-2 overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/50">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-xs text-zinc-500">
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 text-right font-medium">
                    Polymarket OI
                  </th>
                  <th className="px-4 py-3 text-right font-medium">
                    Kalshi Volume
                  </th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {barData.map((d) => (
                  <tr
                    key={d.name}
                    className="border-b border-zinc-800/50 transition-colors hover:bg-zinc-800/30"
                  >
                    <td className="px-4 py-3 text-white">{d.name}</td>
                    <td className="px-4 py-3 text-right text-violet-400">
                      {formatCurrency(d.polymarket, true)}
                    </td>
                    <td className="px-4 py-3 text-right text-blue-400">
                      {formatCurrency(d.kalshi, true)}
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-300">
                      {formatCurrency(d.polymarket + d.kalshi, true)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {view === "line" && (
          <div className="col-span-2 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <h3 className="mb-4 text-sm font-medium text-zinc-400">
              Top Markets by Open Interest
            </h3>
            <div className="space-y-2">
              {topMarkets.map((m, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-6 text-right text-xs text-zinc-600">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white">{m.name}</span>
                      <span
                        className={`text-xs ${
                          m.platform === "Polymarket"
                            ? "text-violet-400"
                            : "text-blue-400"
                        }`}
                      >
                        {m.platform}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 w-full rounded-full bg-zinc-800">
                      <div
                        className="h-full rounded-full bg-violet-600"
                        style={{
                          width: `${(m.value / (topMarkets[0]?.value || 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-zinc-400">
                    {formatCurrency(m.value, true)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
