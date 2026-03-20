"use client";

import { useState, useCallback } from "react";
import { Wallet } from "lucide-react";
import { formatCurrency, formatPercent } from "@/lib/utils";

interface Position {
  conditionId: string;
  question: string;
  outcomeLabel: string;
  balance: number;
  currentPrice: number;
  eventTitle: string;
  status: string;
}

export default function PortfolioPage() {
  const [address, setAddress] = useState("");
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const fetchPositions = useCallback(async () => {
    if (!address.trim()) return;
    setLoading(true);
    setError("");
    setSearched(true);

    try {
      const res = await fetch(
        `/api/portfolio?address=${encodeURIComponent(address.trim())}`
      );
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to fetch positions");
      }
      const data = await res.json();
      setPositions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setPositions([]);
    } finally {
      setLoading(false);
    }
  }, [address]);

  const totalValue = positions.reduce(
    (sum, p) => sum + p.balance * p.currentPrice,
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Portfolio Tracker</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Track Polymarket positions for any wallet address
        </p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Wallet className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchPositions()}
            placeholder="Enter Polygon wallet address (0x...)"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 py-2 pl-9 pr-4 text-sm text-white placeholder:text-zinc-500 focus:border-violet-600 focus:outline-none"
          />
        </div>
        <button
          onClick={fetchPositions}
          disabled={loading || !address.trim()}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700 disabled:opacity-50"
        >
          {loading ? "Loading..." : "Look Up"}
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-800/50 bg-red-900/20 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {searched && !loading && !error && positions.length === 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center text-zinc-500">
          No positions found for this address. The wallet may not have any
          active Polymarket positions.
        </div>
      )}

      {positions.length > 0 && (
        <>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="text-sm text-zinc-400">Total Position Value</div>
            <div className="mt-1 text-3xl font-bold text-white">
              {formatCurrency(totalValue)}
            </div>
            <div className="mt-1 text-xs text-zinc-500">
              {positions.length} active position
              {positions.length !== 1 ? "s" : ""}
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/50">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-xs text-zinc-500">
                  <th className="px-4 py-3 font-medium">Market</th>
                  <th className="px-4 py-3 font-medium">Side</th>
                  <th className="px-4 py-3 text-right font-medium">Shares</th>
                  <th className="px-4 py-3 text-right font-medium">
                    Current Price
                  </th>
                  <th className="px-4 py-3 text-right font-medium">Value</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((p, i) => (
                  <tr
                    key={i}
                    className="border-b border-zinc-800/50 transition-colors hover:bg-zinc-800/30"
                  >
                    <td className="max-w-xs truncate px-4 py-3 text-white">
                      {p.question || p.eventTitle}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          p.outcomeLabel === "Yes"
                            ? "text-green-400"
                            : "text-red-400"
                        }
                      >
                        {p.outcomeLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-300">
                      {p.balance.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-300">
                      {formatPercent(p.currentPrice)}
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-300">
                      {formatCurrency(p.balance * p.currentPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
