"use client";

import { ExternalLink } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface MatchCandidate {
  polyId: string;
  polyQuestion: string;
  polyPrice: number;
  polyVolume: number;
  polyLink: string;
  kalshiTicker: string;
  kalshiTitle: string;
  kalshiPrice: number;
  kalshiVolume: number;
  kalshiLink: string;
  spread: number;
}

interface Props {
  matches: MatchCandidate[];
}

export function ArbitrageClient({ matches }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Arbitrage Detector</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Cross-platform price spreads between Polymarket & Kalshi.{" "}
          {matches.length} potential matches found.
        </p>
      </div>

      {matches.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center text-zinc-500">
          No cross-platform matches found. Markets may use different
          questions or categories.
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((m, i) => (
            <div
              key={i}
              className={`rounded-xl border p-5 ${
                m.spread > 0.05
                  ? "border-yellow-700/50 bg-yellow-900/10"
                  : "border-zinc-800 bg-zinc-900/50"
              }`}
            >
              <div className="mb-3 flex items-center justify-between">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    m.spread > 0.1
                      ? "bg-red-900/50 text-red-300"
                      : m.spread > 0.05
                        ? "bg-yellow-900/50 text-yellow-300"
                        : "bg-zinc-800 text-zinc-400"
                  }`}
                >
                  {(m.spread * 100).toFixed(1)}% spread
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-violet-400">
                      Polymarket
                    </span>
                    <a
                      href={m.polyLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-600 hover:text-white"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <p className="text-sm text-white">{m.polyQuestion}</p>
                  <div className="flex gap-4 text-xs text-zinc-400">
                    <span>
                      Price:{" "}
                      <span className="text-white">
                        {(m.polyPrice * 100).toFixed(1)}%
                      </span>
                    </span>
                    <span>
                      Volume:{" "}
                      <span className="text-white">
                        {formatCurrency(m.polyVolume, true)}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-blue-400">
                      Kalshi
                    </span>
                    <a
                      href={m.kalshiLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-600 hover:text-white"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <p className="text-sm text-white">{m.kalshiTitle}</p>
                  <div className="flex gap-4 text-xs text-zinc-400">
                    <span>
                      Price:{" "}
                      <span className="text-white">
                        {(m.kalshiPrice * 100).toFixed(1)}%
                      </span>
                    </span>
                    <span>
                      Volume:{" "}
                      <span className="text-white">
                        {formatCurrency(m.kalshiVolume, true)}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
