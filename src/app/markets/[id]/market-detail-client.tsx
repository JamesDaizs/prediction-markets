"use client";

import { useState, useEffect, useCallback } from "react";
import type { TimeRange } from "@/lib/api/types";
import { TimeRangeSelector } from "@/components/time-range-selector";
import { PriceChart } from "@/components/charts/price-chart";
import { TimeSeriesChart } from "@/components/charts/line-chart";
import { formatCurrency, shortenAddress } from "@/lib/utils";

interface Props {
  platform: "polymarket" | "kalshi";
  conditionId: string;
  ticker: string;
  labelA: string;
  labelB: string;
}

interface PriceData {
  date: string;
  yes: number;
  no: number;
}

interface OIData {
  date: string;
  oi: number;
}

interface TradeData {
  time: string;
  side: string;
  price: number;
  amount: number;
  txHash?: string;
}

export function MarketDetailClient({
  platform,
  conditionId,
  ticker,
  labelA,
  labelB,
}: Props) {
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [prices, setPrices] = useState<PriceData[]>([]);
  const [oi, setOI] = useState<OIData[]>([]);
  const [trades, setTrades] = useState<TradeData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const marketKey = platform === "polymarket" ? conditionId : ticker;
    const paramKey = platform === "polymarket" ? "condition_id" : "ticker";

    try {
      const [priceRes, oiRes, tradeRes] = await Promise.all([
        fetch(
          `/api/market-data?endpoint=prices&platform=${platform}&${paramKey}=${marketKey}&time_range=${timeRange}`
        ),
        fetch(
          `/api/market-data?endpoint=oi&platform=${platform}&${paramKey}=${marketKey}&time_range=${timeRange}`
        ),
        fetch(
          `/api/market-data?endpoint=trades&platform=${platform}&${paramKey}=${marketKey}&limit=20`
        ),
      ]);

      if (priceRes.ok) setPrices(await priceRes.json());
      if (oiRes.ok) setOI(await oiRes.json());
      if (tradeRes.ok) setTrades(await tradeRes.json());
    } catch (err) {
      console.error("Failed to fetch market data:", err);
    } finally {
      setLoading(false);
    }
  }, [platform, conditionId, ticker, timeRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-zinc-500">
        Loading market data...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TimeRangeSelector value={timeRange} onChange={setTimeRange} />

      <div className="grid gap-6 lg:grid-cols-2">
        <PriceChart
          data={prices}
          title="Price History"
          labelA={labelA}
          labelB={labelB}
        />
        <TimeSeriesChart
          data={oi.map((d) => ({ date: d.date, oi: d.oi }))}
          lines={[
            { dataKey: "oi", name: "Open Interest", color: "#8b5cf6" },
          ]}
          title="Open Interest"
          yFormatter={(v) => formatCurrency(v, true)}
        />
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
        <h3 className="mb-4 text-sm font-medium text-zinc-400">
          Recent Trades
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-xs text-zinc-500">
                <th className="px-3 py-2 font-medium">Time</th>
                <th className="px-3 py-2 font-medium">Side</th>
                <th className="px-3 py-2 text-right font-medium">Price</th>
                <th className="px-3 py-2 text-right font-medium">Amount</th>
                {platform === "polymarket" && (
                  <th className="px-3 py-2 font-medium">Tx</th>
                )}
              </tr>
            </thead>
            <tbody>
              {trades.map((t, i) => (
                <tr
                  key={i}
                  className="border-b border-zinc-800/50 transition-colors hover:bg-zinc-800/30"
                >
                  <td className="px-3 py-2 text-zinc-400">{t.time}</td>
                  <td className="px-3 py-2">
                    <span
                      className={
                        t.side.toLowerCase() === "yes"
                          ? "text-green-400"
                          : "text-red-400"
                      }
                    >
                      {t.side}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right text-zinc-300">
                    {(t.price * 100).toFixed(1)}%
                  </td>
                  <td className="px-3 py-2 text-right text-zinc-300">
                    {formatCurrency(t.amount)}
                  </td>
                  {platform === "polymarket" && (
                    <td className="px-3 py-2 text-zinc-500">
                      {t.txHash ? (
                        <a
                          href={`https://polygonscan.com/tx/${t.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-white"
                        >
                          {shortenAddress(t.txHash)}
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {trades.length === 0 && (
                <tr>
                  <td
                    colSpan={platform === "polymarket" ? 5 : 4}
                    className="px-3 py-6 text-center text-zinc-500"
                  >
                    No trades available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
