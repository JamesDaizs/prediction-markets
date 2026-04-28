"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { StatCard } from "@/components/StatCard";
import { Card } from "@/components/ui/card";
import { formatCurrency, shortenAddress } from "@/lib/utils";
import type { BotAnalysisData } from "./types";

interface Props {
  data: BotAnalysisData;
}

const CLASS_COLORS: Record<string, string> = {
  Bot: "#ef4444",
  "Likely Bot": "#f97316",
  "Likely Human": "#3b82f6",
  Human: "#22c55e",
};

const tooltipStyle = {
  contentStyle: {
    backgroundColor: "var(--pm-bg-card)",
    border: "1px solid var(--pm-border-base)",
    borderRadius: "8px",
    fontSize: "12px",
    color: "var(--pm-fg-base)",
  },
};

function compactNum(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return v.toLocaleString();
}

function compactDollar(v: number): string {
  const sign = v >= 0 ? "+" : "";
  if (Math.abs(v) >= 1_000_000)
    return `${sign}$${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `${sign}$${(v / 1_000).toFixed(1)}K`;
  return `${sign}$${v.toFixed(0)}`;
}

export function BotsClient({ data }: Props) {
  const generatedDate = new Date(data.generated_at).toLocaleDateString(
    "en-US",
    { year: "numeric", month: "long", day: "numeric" }
  );

  // Waterfall chart needs running totals
  const waterfallData = useMemo(() => {
    let running = 0;
    return data.pnlWaterfall.map((row) => {
      const start = running;
      running += row.pnl;
      return {
        name: row.class,
        value: row.pnl,
        start: Math.min(start, running),
        height: Math.abs(row.pnl),
        fill: CLASS_COLORS[row.class] || "#6366f1",
      };
    });
  }, [data.pnlWaterfall]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-pm-fg-base">
          Bot Analysis
        </h1>
        <p className="mt-1 text-sm text-pm-fg-faint">
          ML-classified wallet analysis across {data.wallet_count.toLocaleString()} Polymarket wallets
        </p>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Bot Volume Share"
          value={`${data.heroStats.botVolumePercent.toFixed(1)}%`}
          sub="of total volume"
          accentColor="#f97316"
        />
        <StatCard
          label="Human Net PnL"
          value={compactDollar(data.heroStats.humanNetPnl)}
          sub="pure Human class only"
          accentColor="#ef4444"
        />
        <StatCard
          label="Active Bots"
          value={compactNum(data.heroStats.activeBots)}
          sub="Bot + Likely Bot wallets"
          accentColor="#f97316"
        />
        <StatCard
          label="Human-Human Trades"
          value={`${data.heroStats.humanHumanTradePct}%`}
          sub="of all trade pairs"
          accentColor="#22c55e"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* V1: Classification Breakdown */}
        <Card title="Classification Breakdown">
          <div className="space-y-4">
            {data.classificationSummary.map((row) => {
              const maxVol = Math.max(
                ...data.classificationSummary.map((r) => r.volume)
              );
              const volPct = maxVol > 0 ? (row.volume / maxVol) * 100 : 0;
              return (
                <div key={row.class} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{
                          backgroundColor: CLASS_COLORS[row.class],
                        }}
                      />
                      <span className="font-medium text-pm-fg-base">
                        {row.class}
                      </span>
                    </div>
                    <span className="text-pm-fg-muted">
                      {row.count.toLocaleString()} wallets
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-pm-bg-elevated">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${volPct}%`,
                          backgroundColor: CLASS_COLORS[row.class],
                          opacity: 0.7,
                        }}
                      />
                    </div>
                    <span className="w-20 text-right text-xs tabular-nums text-pm-fg-muted">
                      {formatCurrency(row.volume, true)} vol
                    </span>
                  </div>
                  <div className="flex gap-4 text-xs text-pm-fg-faint">
                    <span>PnL: {compactDollar(row.pnl)}</span>
                    <span>
                      Avg: {compactDollar(row.avgPnl)}
                    </span>
                    <span>{row.profitablePercent.toFixed(0)}% profitable</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* V2: PnL Waterfall */}
        <Card title="PnL by Classification">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={waterfallData} barCategoryGap="20%">
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--pm-border-subtle)"
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "var(--pm-fg-faint)" }}
                axisLine={{ stroke: "var(--pm-border-subtle)" }}
              />
              <YAxis
                tickFormatter={(v) => compactDollar(v)}
                tick={{ fontSize: 11, fill: "var(--pm-fg-faint)" }}
                axisLine={{ stroke: "var(--pm-border-subtle)" }}
              />
              <Tooltip
                {...tooltipStyle}
                formatter={(value) => [compactDollar(Number(value)), "PnL"]}
              />
              <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                {waterfallData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* V3: Hourly Activity */}
        <Card title="Trading Activity by Time of Day">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.hourlyActivity}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--pm-border-subtle)"
              />
              <XAxis
                dataKey="hours"
                tick={{ fontSize: 11, fill: "var(--pm-fg-faint)" }}
                axisLine={{ stroke: "var(--pm-border-subtle)" }}
                tickFormatter={(v) => `${v} UTC`}
              />
              <YAxis
                tickFormatter={(v) => `${v.toFixed(0)}%`}
                tick={{ fontSize: 11, fill: "var(--pm-fg-faint)" }}
                axisLine={{ stroke: "var(--pm-border-subtle)" }}
              />
              <Tooltip
                {...tooltipStyle}
                formatter={(value) => [
                  `${Number(value).toFixed(1)}%`,
                  undefined,
                ]}
              />
              <Legend
                wrapperStyle={{ fontSize: "12px", color: "var(--pm-fg-muted)" }}
              />
              <Bar
                dataKey="highFreqPct"
                name="High Frequency"
                fill="#f97316"
                radius={[3, 3, 0, 0]}
              />
              <Bar
                dataKey="lowFreqPct"
                name="Low Frequency"
                fill="#3b82f6"
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
          <p className="mt-2 text-center text-xs text-pm-fg-faint">
            High-freq traders show uniform activity; humans cluster during US hours (12-24 UTC)
          </p>
        </Card>

        {/* V4: Trade Size Distribution */}
        <Card title="Trade Size Distribution">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.tradeSizeDistribution}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--pm-border-subtle)"
              />
              <XAxis
                dataKey="bucket"
                tick={{ fontSize: 10, fill: "var(--pm-fg-faint)" }}
                axisLine={{ stroke: "var(--pm-border-subtle)" }}
                angle={-20}
                textAnchor="end"
                height={50}
              />
              <YAxis
                tickFormatter={(v) => `${v}%`}
                tick={{ fontSize: 11, fill: "var(--pm-fg-faint)" }}
                axisLine={{ stroke: "var(--pm-border-subtle)" }}
              />
              <Tooltip
                {...tooltipStyle}
                formatter={(value, name) => [
                  `${value}%`,
                  name === "pctTrades" ? "% of Trades" : "% of Volume",
                ]}
              />
              <Legend
                wrapperStyle={{ fontSize: "12px", color: "var(--pm-fg-muted)" }}
              />
              <Bar
                dataKey="pctTrades"
                name="% of Trades"
                fill="#8b5cf6"
                radius={[3, 3, 0, 0]}
              />
              <Bar
                dataKey="pctVolume"
                name="% of Volume"
                fill="#06b6d4"
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
          <p className="mt-2 text-center text-xs text-pm-fg-faint">
            64.6% of trades are under $5, but 36.9% of volume comes from 0.16% of trades over $2K
          </p>
        </Card>

        {/* V5: Bot Concentration by Category */}
        <Card title="Bot Concentration by Category">
          <div className="space-y-3">
            {data.categoryBotConcentration.map((row) => (
              <div key={row.category} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-pm-fg-base">
                    {row.category}
                  </span>
                  <span className="text-pm-fg-muted">
                    {row.botPct}% bot
                  </span>
                </div>
                <div className="flex h-3 overflow-hidden rounded-full">
                  <div
                    className="transition-all"
                    style={{
                      width: `${row.botPct}%`,
                      backgroundColor: "#f97316",
                    }}
                  />
                  <div
                    className="transition-all"
                    style={{
                      width: `${row.humanPct}%`,
                      backgroundColor: "#3b82f6",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-4 text-xs text-pm-fg-faint">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-[#f97316]" />
              Bot/Likely Bot
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-[#3b82f6]" />
              Human/Likely Human
            </span>
          </div>
        </Card>

        {/* V6: Trade Matrix */}
        <Card title="Trade Counterparty Matrix">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="pb-2 text-left text-pm-fg-faint">
                    Taker \ Maker
                  </th>
                  {data.tradeMatrix.labels.map((label) => (
                    <th
                      key={label}
                      className="pb-2 text-center text-pm-fg-faint"
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.tradeMatrix.labels.map((rowLabel, i) => (
                  <tr key={rowLabel}>
                    <td className="py-1.5 font-medium text-pm-fg-base">
                      {rowLabel}
                    </td>
                    {data.tradeMatrix.data[i].map((val, j) => {
                      const maxVal = Math.max(
                        ...data.tradeMatrix.data.flat()
                      );
                      const intensity = maxVal > 0 ? val / maxVal : 0;
                      return (
                        <td key={j} className="py-1.5 text-center">
                          <span
                            className="inline-block rounded px-2 py-1 tabular-nums"
                            style={{
                              backgroundColor: `rgba(139, 92, 246, ${intensity * 0.5})`,
                              color:
                                intensity > 0.5
                                  ? "white"
                                  : "var(--pm-fg-muted)",
                            }}
                          >
                            {val}%
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-center text-xs text-pm-fg-faint">
            94.4% of trades have a bot counterparty. Human-Human: only 0.3%
          </p>
        </Card>
      </div>

      {/* Bot Volume Timeline + CTF vs NegRisk + Same-Block Stats */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Bot Volume Share Over Time */}
        {data.botVolumeTimeline && data.botVolumeTimeline.length > 0 && (
          <Card title="Weekly High-Frequency Volume Share">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={data.botVolumeTimeline}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--pm-border-subtle)"
                />
                <XAxis
                  dataKey="week"
                  tickFormatter={(v) => {
                    const d = new Date(v + "T00:00:00");
                    return d.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                  tick={{ fontSize: 10, fill: "var(--pm-fg-faint)" }}
                  axisLine={{ stroke: "var(--pm-border-subtle)" }}
                />
                <YAxis
                  tickFormatter={(v) => `${v.toFixed(0)}%`}
                  tick={{ fontSize: 11, fill: "var(--pm-fg-faint)" }}
                  axisLine={{ stroke: "var(--pm-border-subtle)" }}
                  domain={[0, 100]}
                />
                <Tooltip
                  {...tooltipStyle}
                  labelFormatter={(v) => {
                    const d = new Date(v + "T00:00:00");
                    return `Week of ${d.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}`;
                  }}
                  formatter={(value) => [
                    `${Number(value).toFixed(1)}%`,
                    "High-Freq Volume %",
                  ]}
                />
                <Area
                  dataKey="highFreqPct"
                  stroke="#f97316"
                  fill="#f97316"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
            <p className="mt-2 text-center text-xs text-pm-fg-faint">
              High-frequency = wallets with 1,000+ trades/week (proxy for bot activity)
            </p>
          </Card>
        )}

        {/* CTF vs NegRisk Daily Active Wallets */}
        {data.ctfVsNegRisk && data.ctfVsNegRisk.length > 0 && (
          <Card title="CTF vs NegRisk Daily Active Wallets">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={data.ctfVsNegRisk}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--pm-border-subtle)"
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v) => {
                    const d = new Date(v + "T00:00:00");
                    return d.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                  tick={{ fontSize: 10, fill: "var(--pm-fg-faint)" }}
                  axisLine={{ stroke: "var(--pm-border-subtle)" }}
                />
                <YAxis
                  tickFormatter={(v) => compactNum(v)}
                  tick={{ fontSize: 11, fill: "var(--pm-fg-faint)" }}
                  axisLine={{ stroke: "var(--pm-border-subtle)" }}
                />
                <Tooltip
                  {...tooltipStyle}
                  formatter={(value) => [
                    Number(value).toLocaleString(),
                    undefined,
                  ]}
                />
                <Legend
                  wrapperStyle={{
                    fontSize: "12px",
                    color: "var(--pm-fg-muted)",
                  }}
                />
                <Area
                  dataKey="ctfDAW"
                  name="CTF Markets"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.15}
                  strokeWidth={2}
                  stackId="1"
                />
                <Area
                  dataKey="negRiskDAW"
                  name="NegRisk Markets"
                  stroke="#06b6d4"
                  fill="#06b6d4"
                  fillOpacity={0.15}
                  strokeWidth={2}
                  stackId="1"
                />
              </AreaChart>
            </ResponsiveContainer>
            <p className="mt-2 text-center text-xs text-pm-fg-faint">
              NegRisk = multi-outcome events (elections, sports). CTF = binary markets.
            </p>
          </Card>
        )}
      </div>

      {/* Same-Block Stats */}
      {data.sameBlockStats && (
        <Card title="Same-Block Multi-Trade Detection (Yesterday)">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-lg border border-pm-border-subtle bg-pm-bg-subtle p-4 text-center">
              <div className="text-lg font-semibold tabular-nums text-pm-fg-base">
                {data.sameBlockStats.walletsWithMulti.toLocaleString()}
              </div>
              <div className="mt-1 text-xs text-pm-fg-muted">
                Wallets with 3+ trades/block
              </div>
            </div>
            <div className="rounded-lg border border-pm-border-subtle bg-pm-bg-subtle p-4 text-center">
              <div className="text-lg font-semibold tabular-nums text-pm-fg-base">
                {data.sameBlockStats.multiBlocks.toLocaleString()}
              </div>
              <div className="mt-1 text-xs text-pm-fg-muted">
                Multi-trade blocks
              </div>
            </div>
            <div className="rounded-lg border border-pm-border-subtle bg-pm-bg-subtle p-4 text-center">
              <div className="text-lg font-semibold tabular-nums text-pm-fg-base">
                {data.sameBlockStats.maxTradesInBlock.toLocaleString()}
              </div>
              <div className="mt-1 text-xs text-pm-fg-muted">
                Max trades in one block
              </div>
            </div>
            <div className="rounded-lg border border-pm-border-subtle bg-pm-bg-subtle p-4 text-center">
              <div className="text-lg font-semibold tabular-nums text-pm-fg-base">
                {data.sameBlockStats.totalMultiTrades.toLocaleString()}
              </div>
              <div className="mt-1 text-xs text-pm-fg-muted">
                Total batched trades
              </div>
            </div>
          </div>
          <p className="mt-3 text-center text-xs text-pm-fg-faint">
            Multiple trades in the same block is a strong bot signature — humans cannot execute this fast
          </p>
        </Card>
      )}

      {/* V7: Fee Extraction */}
      <Card title="Daily Fee Extraction (March 20, 2026)">
        <div className="grid grid-cols-3 gap-4">
          {data.feeExtraction.map((row) => (
            <div
              key={row.class}
              className="rounded-lg border border-pm-border-subtle bg-pm-bg-subtle p-4 text-center"
            >
              <div className="text-lg font-semibold tabular-nums text-pm-fg-base">
                ${(row.feesCollected / 1_000_000).toFixed(1)}M
              </div>
              <div className="mt-1 text-xs font-medium text-pm-fg-muted">
                {row.class}
              </div>
              <div className="mt-1 text-xs text-pm-fg-faint">
                {row.pctTotal}% of total fees
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-center text-xs text-pm-fg-faint">
          147 bot wallets collect 61% of all trading fees ($11.1M/day, ~$75K per wallet)
        </p>
      </Card>

      {/* V8: Strategy Taxonomy */}
      <Card title="Bot Strategy Taxonomy">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.strategies.map((s) => (
            <div
              key={s.name}
              className="rounded-lg border border-pm-border-subtle bg-pm-bg-subtle p-4"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-pm-fg-base">
                  {s.name}
                </h4>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    s.status === "Active"
                      ? "bg-green-500/10 text-green-400"
                      : "bg-red-500/10 text-red-400"
                  }`}
                >
                  {s.status}
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-pm-fg-muted">
                {s.description}
              </p>
              <div className="mt-3 space-y-1 text-xs text-pm-fg-faint">
                <div>
                  <span className="text-pm-fg-muted">Range:</span>{" "}
                  {s.profitRange}
                </div>
                <div>
                  <span className="text-pm-fg-muted">Example:</span>{" "}
                  {s.example}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Top Wallets Tables */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Bots */}
        <Card title="Top Bot Wallets by PnL">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-pm-border-subtle">
                  <th className="pb-2 text-left text-pm-fg-faint">
                    Wallet
                  </th>
                  <th className="pb-2 text-right text-pm-fg-faint">PnL</th>
                  <th className="pb-2 text-right text-pm-fg-faint">
                    Volume
                  </th>
                  <th className="pb-2 text-right text-pm-fg-faint">
                    Win%
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.topBots.slice(0, 10).map((w) => (
                  <tr
                    key={w.address}
                    className="border-b border-pm-border-subtle/50"
                  >
                    <td className="py-1.5">
                      <a
                        href={`https://polygonscan.com/address/${w.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pm-brand hover:underline"
                      >
                        {shortenAddress(w.address)}
                      </a>
                      <span className="ml-1.5 text-pm-fg-faint">
                        {w.label}
                      </span>
                    </td>
                    <td className="py-1.5 text-right tabular-nums text-pm-positive">
                      {compactDollar(w.pnl)}
                    </td>
                    <td className="py-1.5 text-right tabular-nums text-pm-fg-muted">
                      {formatCurrency(w.volume, true)}
                    </td>
                    <td className="py-1.5 text-right tabular-nums text-pm-fg-muted">
                      {(w.winRate * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Top Humans */}
        <Card title="Top Human Wallets by PnL">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-pm-border-subtle">
                  <th className="pb-2 text-left text-pm-fg-faint">
                    Wallet
                  </th>
                  <th className="pb-2 text-right text-pm-fg-faint">PnL</th>
                  <th className="pb-2 text-right text-pm-fg-faint">
                    Volume
                  </th>
                  <th className="pb-2 text-right text-pm-fg-faint">
                    Win%
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.topHumans.slice(0, 10).map((w) => (
                  <tr
                    key={w.address}
                    className="border-b border-pm-border-subtle/50"
                  >
                    <td className="py-1.5">
                      <a
                        href={`https://polygonscan.com/address/${w.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pm-brand hover:underline"
                      >
                        {shortenAddress(w.address)}
                      </a>
                      <span className="ml-1.5 text-pm-fg-faint">
                        {w.label}
                      </span>
                    </td>
                    <td className="py-1.5 text-right tabular-nums text-pm-positive">
                      {compactDollar(w.pnl)}
                    </td>
                    <td className="py-1.5 text-right tabular-nums text-pm-fg-muted">
                      {formatCurrency(w.volume, true)}
                    </td>
                    <td className="py-1.5 text-right tabular-nums text-pm-fg-muted">
                      {(w.winRate * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Methodology + Footer */}
      <div className="rounded-lg border border-pm-border-subtle bg-pm-bg-subtle px-5 py-4">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-pm-fg-faint">
          Methodology
        </h3>
        <div className="space-y-1.5 text-xs text-pm-fg-muted leading-relaxed">
          <p>
            <strong className="text-pm-fg-subtle">Classification</strong>:
            XGBoost model trained on 38,839 wallets with features: trading
            frequency, hourly entropy, maker ratio, trade size distribution,
            market breadth, and anomaly scores.
          </p>
          <p>
            <strong className="text-pm-fg-subtle">Four classes</strong>:
            Bot (high confidence automated), Likely Bot (probable automated),
            Likely Human (probable manual), Human (high confidence manual).
          </p>
          <p>
            <strong className="text-pm-fg-subtle">Data source</strong>:
            890M trades, 2.42M wallets, $50.87B volume (Nov 2022 - Mar 2026)
            from Polymarket on-chain data.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-pm-fg-faint">
        <p>
          Based on research: &ldquo;Polymarket is not built for humans, it&rsquo;s for
          agents&rdquo; (March 2026).{" "}
          {data.wallet_count.toLocaleString()} wallets classified.
        </p>
        <p>Generated {generatedDate}</p>
      </div>
    </div>
  );
}
