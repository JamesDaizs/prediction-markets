"use client";
import { formatCurrency, formatNumber, shortenAddress } from "@/lib/format";
import type { Trader } from "@/lib/types";

export function TradersTable({ traders }: { traders: Trader[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-pm-border-base bg-pm-bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-pm-border-base">
            <th className="px-3 py-2 text-left text-xs font-medium text-pm-fg-muted">#</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-pm-fg-muted">Address</th>
            <th className="px-3 py-2 text-right text-xs font-medium text-pm-fg-muted">Total Volume</th>
            <th className="px-3 py-2 text-right text-xs font-medium text-pm-fg-muted">Trades</th>
            <th className="px-3 py-2 text-right text-xs font-medium text-pm-fg-muted">Markets</th>
            <th className="px-3 py-2 text-right text-xs font-medium text-pm-fg-muted">Avg Bet</th>
          </tr>
        </thead>
        <tbody>
          {traders.map((t, i) => (
            <tr key={t.address} className="border-b border-pm-border-subtle hover:bg-pm-bg-card-hover">
              <td className="px-3 py-2.5 text-pm-fg-muted">{i + 1}</td>
              <td className="px-3 py-2.5 font-mono text-xs text-pm-fg-subtle">{shortenAddress(t.address)}</td>
              <td className="whitespace-nowrap px-3 py-2.5 text-right text-pm-fg-subtle">{formatCurrency(t.total_volume, true)}</td>
              <td className="whitespace-nowrap px-3 py-2.5 text-right text-pm-fg-subtle">{formatNumber(t.trade_count)}</td>
              <td className="whitespace-nowrap px-3 py-2.5 text-right text-pm-fg-subtle">{formatNumber(t.market_count)}</td>
              <td className="whitespace-nowrap px-3 py-2.5 text-right text-pm-fg-subtle">{formatCurrency(t.avg_trade_size)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
