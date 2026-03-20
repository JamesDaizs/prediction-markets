"use client";

import { useState } from "react";
import { PlatformToggle } from "@/components/platform-toggle";
import { ViewToggle, type ViewMode } from "@/components/view-toggle";
import { CategoryTreemap } from "@/components/charts/treemap";
import { CategoryBarChart } from "@/components/charts/bar-chart";
import type { Platform } from "@/lib/api/types";
import { formatCurrency } from "@/lib/utils";

interface Props {
  treemapData: { name: string; size: number }[];
  barData: { name: string; polymarket: number; kalshi: number }[];
  topMarkets: { name: string; value: number; platform: string }[];
}

export function DashboardClient({ treemapData, barData, topMarkets }: Props) {
  const [platform, setPlatform] = useState<Platform>("both");
  const [view, setView] = useState<ViewMode>("treemap");

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
              title="Volume by Category"
              valueLabel="Volume"
            />
            <CategoryBarChart
              data={filteredBar}
              title="Volume by Category (Stacked)"
              stacked
            />
          </>
        )}

        {view === "bar" && (
          <>
            <CategoryBarChart
              data={filteredBar}
              title="Volume by Category"
            />
            <CategoryBarChart
              data={filteredBar}
              title="Volume Share (%)"
              showPercentage
            />
          </>
        )}

        {view === "table" && (
          <div className="col-span-2 overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/50">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-xs text-zinc-500">
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 text-right font-medium">
                    Polymarket Volume
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
