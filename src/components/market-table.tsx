"use client";

import Link from "next/link";
import type { UnifiedMarket } from "@/lib/api/types";
import { formatCurrency, formatPercent, formatTimestamp } from "@/lib/utils";

interface Props {
  markets: UnifiedMarket[];
}

export function MarketTable({ markets }: Props) {
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/50">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-800 text-xs text-zinc-500">
            <th className="px-4 py-3 font-medium">Market</th>
            <th className="px-4 py-3 font-medium">Platform</th>
            <th className="px-4 py-3 font-medium text-right">Volume</th>
            <th className="px-4 py-3 font-medium text-right">Open Interest</th>
            <th className="px-4 py-3 font-medium text-right">Price</th>
            <th className="px-4 py-3 font-medium text-right">End Date</th>
          </tr>
        </thead>
        <tbody>
          {markets.map((m) => {
            const href =
              m.platform === "polymarket"
                ? `/markets/poly-${m.id}`
                : `/markets/kalshi-${m.id}`;
            return (
              <tr
                key={`${m.platform}-${m.id}`}
                className="border-b border-zinc-800/50 transition-colors hover:bg-zinc-800/30"
              >
                <td className="max-w-xs truncate px-4 py-3">
                  <Link href={href} className="text-white hover:text-violet-400">
                    {m.question}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      m.platform === "polymarket"
                        ? "text-violet-400"
                        : "text-blue-400"
                    }
                  >
                    {m.platform === "polymarket" ? "Poly" : "Kalshi"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-zinc-300">
                  {formatCurrency(m.volume, true)}
                </td>
                <td className="px-4 py-3 text-right text-zinc-300">
                  {formatCurrency(m.openInterest, true)}
                </td>
                <td className="px-4 py-3 text-right text-zinc-300">
                  {m.lastPrice > 0 ? formatPercent(m.lastPrice) : "-"}
                </td>
                <td className="px-4 py-3 text-right text-zinc-500">
                  {formatTimestamp(m.endTime)}
                </td>
              </tr>
            );
          })}
          {markets.length === 0 && (
            <tr>
              <td
                colSpan={6}
                className="px-4 py-8 text-center text-zinc-500"
              >
                No markets found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
