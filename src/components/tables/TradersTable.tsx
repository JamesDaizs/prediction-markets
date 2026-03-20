"use client";
import { formatCurrency, formatNumber, shortenAddress } from "@/lib/format";
import type { Trader } from "@/lib/types";

export function TradersTable({ traders }: { traders: Trader[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/50">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800">
            <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">#</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">Address</th>
            <th className="px-3 py-2 text-right text-xs font-medium text-zinc-500">Total Volume</th>
            <th className="px-3 py-2 text-right text-xs font-medium text-zinc-500">Trades</th>
            <th className="px-3 py-2 text-right text-xs font-medium text-zinc-500">Markets</th>
            <th className="px-3 py-2 text-right text-xs font-medium text-zinc-500">Avg Bet</th>
          </tr>
        </thead>
        <tbody>
          {traders.map((t, i) => (
            <tr key={t.address} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
              <td className="px-3 py-2.5 text-zinc-500">{i + 1}</td>
              <td className="px-3 py-2.5 font-mono text-xs text-zinc-300">{shortenAddress(t.address)}</td>
              <td className="whitespace-nowrap px-3 py-2.5 text-right text-zinc-200">{formatCurrency(t.total_volume, true)}</td>
              <td className="whitespace-nowrap px-3 py-2.5 text-right text-zinc-300">{formatNumber(t.trade_count)}</td>
              <td className="whitespace-nowrap px-3 py-2.5 text-right text-zinc-300">{formatNumber(t.market_count)}</td>
              <td className="whitespace-nowrap px-3 py-2.5 text-right text-zinc-300">{formatCurrency(t.avg_trade_size)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
