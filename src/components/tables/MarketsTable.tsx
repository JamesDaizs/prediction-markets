"use client";
import { useState } from "react";
import Link from "next/link";
import { formatCurrency, formatNumber, formatDate } from "@/lib/format";
import type { Market } from "@/lib/types";

type SortKey = "volume" | "open_interest" | "unique_traders" | "avg_trade_size";

export function MarketsTable({ markets }: { markets: Market[] }) {
  const [sortBy, setSortBy] = useState<SortKey>("volume");
  const [asc, setAsc] = useState(false);

  const sorted = [...markets].sort((a, b) => {
    const va = (a[sortBy] as number) ?? 0;
    const vb = (b[sortBy] as number) ?? 0;
    return asc ? va - vb : vb - va;
  });

  function handleSort(key: SortKey) {
    if (sortBy === key) setAsc(!asc);
    else { setSortBy(key); setAsc(false); }
  }

  const th = (label: string, key: SortKey) => (
    <th className="cursor-pointer px-3 py-2 text-right text-xs font-medium text-zinc-500 hover:text-zinc-300" onClick={() => handleSort(key)}>
      {label} {sortBy === key ? (asc ? "\u2191" : "\u2193") : ""}
    </th>
  );

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/50">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800">
            <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">Market</th>
            {th("Volume", "volume")}
            {th("Open Interest", "open_interest")}
            {th("Traders", "unique_traders")}
            {th("Avg Bet", "avg_trade_size")}
            <th className="px-3 py-2 text-right text-xs font-medium text-zinc-500">End Date</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((m) => (
            <tr key={m.condition_id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
              <td className="max-w-xs truncate px-3 py-2.5 text-zinc-200">
                <Link href={`/markets/${m.condition_id}`} className="hover:text-violet-400">{m.question || m.slug}</Link>
              </td>
              <td className="whitespace-nowrap px-3 py-2.5 text-right text-zinc-300">{formatCurrency(m.volume, true)}</td>
              <td className="whitespace-nowrap px-3 py-2.5 text-right text-zinc-300">{formatCurrency(m.open_interest, true)}</td>
              <td className="whitespace-nowrap px-3 py-2.5 text-right text-zinc-300">{m.unique_traders ? formatNumber(m.unique_traders) : "\u2014"}</td>
              <td className="whitespace-nowrap px-3 py-2.5 text-right text-zinc-300">{m.avg_trade_size ? formatCurrency(m.avg_trade_size) : "\u2014"}</td>
              <td className="whitespace-nowrap px-3 py-2.5 text-right text-zinc-400">{formatDate(m.end_date)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
