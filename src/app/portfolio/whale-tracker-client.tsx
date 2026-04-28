"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Flame, TrendingUp, Users, Loader2, Search, Wallet, ExternalLink } from "lucide-react";
import { formatCurrency, shortenAddress } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { PlatformBadge } from "@/components/ui/platform-badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type {
  WhaleTradeRow,
  TopTraderRow,
  HotMarketRow,
  MarketSearchRow,
  WalletStatsRow,
  WalletTradeHistoryRow,
} from "@/lib/queries/whales";

type Tab = "whales" | "traders" | "hot" | "lookup";
type LookupMode = "markets" | "wallets";
type Days = 1 | 7 | 30;

const TABS: { key: Tab; label: string; icon: typeof Flame }[] = [
  { key: "whales", label: "Whale Trades", icon: TrendingUp },
  { key: "traders", label: "Top Traders", icon: Users },
  { key: "hot", label: "Hot Markets", icon: Flame },
  { key: "lookup", label: "Lookup", icon: Search },
];

const DAY_OPTIONS: { label: string; value: Days }[] = [
  { label: "24h", value: 1 },
  { label: "7d", value: 7 },
  { label: "30d", value: 30 },
];

interface Props {
  initialWhales: WhaleTradeRow[];
}

export function WhaleTrackerClient({ initialWhales }: Props) {
  const [tab, setTab] = useState<Tab>("whales");
  const [days, setDays] = useState<Days>(7);
  const [whales, setWhales] = useState(initialWhales);
  const [traders, setTraders] = useState<TopTraderRow[]>([]);
  const [hot, setHot] = useState<HotMarketRow[]>([]);
  const [lookupResults, setLookupResults] = useState<MarketSearchRow[]>([]);
  const [lookupQuery, setLookupQuery] = useState("");
  const [lookupMode, setLookupMode] = useState<LookupMode>("markets");
  const [walletAddress, setWalletAddress] = useState("");
  const [walletStats, setWalletStats] = useState<WalletStatsRow | null>(null);
  const [walletTrades, setWalletTrades] = useState<WalletTradeHistoryRow[]>([]);
  const [walletSearched, setWalletSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const fetchData = useCallback(
    async (newTab: Tab, newDays: Days) => {
      if (newTab === "lookup") return;
      setLoading(true);
      try {
        const res = await fetch(
          `/api/whale-tracker?tab=${newTab}&days=${newDays}`
        );
        if (!res.ok) return;
        const data = await res.json();
        if (newTab === "whales") setWhales(data);
        else if (newTab === "traders") setTraders(data);
        else setHot(data);
      } catch {
        // Keep existing data on error
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const fetchLookup = useCallback((q: string) => {
    if (q.length < 2) {
      setLookupResults([]);
      return;
    }
    setLoading(true);
    fetch(`/api/whale-tracker?tab=lookup&q=${encodeURIComponent(q)}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setLookupResults(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const fetchWallet = useCallback(async (address: string) => {
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) return;
    setLoading(true);
    setWalletSearched(true);
    try {
      const res = await fetch(
        `/api/whale-tracker?tab=wallet&address=${encodeURIComponent(address)}`
      );
      if (!res.ok) {
        setWalletStats(null);
        setWalletTrades([]);
        return;
      }
      const data = await res.json();
      setWalletStats(data.stats || null);
      setWalletTrades(data.trades || []);
    } catch {
      setWalletStats(null);
      setWalletTrades([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearchChange = (value: string) => {
    setLookupQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchLookup(value), 300);
  };

  const handleTabChange = (newTab: Tab) => {
    setTab(newTab);
    if (newTab !== "lookup") fetchData(newTab, days);
  };

  const handleDaysChange = (newDays: Days) => {
    setDays(newDays);
    fetchData(tab, newDays);
  };

  const handleWalletSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchWallet(walletAddress);
  };

  const isValidAddress = /^0x[a-fA-F0-9]{40}$/.test(walletAddress);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-pm-fg-base">Traders</h1>
        <p className="mt-1 text-sm text-pm-fg-faint">
          Whale trades, top traders, hot markets, and cross-platform lookup
        </p>
      </div>

      {/* Tab bar + day selector */}
      <div className="flex items-center justify-between">
        <div className="flex border-b border-pm-border-base">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => handleTabChange(key)}
              className={cn(
                "flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-xs font-medium transition-colors",
                tab === key
                  ? "border-pm-brand text-pm-fg-base"
                  : "border-transparent text-pm-fg-muted hover:text-pm-fg-base"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {tab !== "lookup" && (
          <div className="flex rounded-lg border border-pm-border-base bg-pm-bg-card p-0.5">
            {DAY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleDaysChange(opt.value)}
                className={cn(
                  "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                  days === opt.value
                    ? "bg-pm-bg-elevated text-pm-fg-base"
                    : "text-pm-fg-muted hover:text-pm-fg-base"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lookup sub-toggle + search */}
      {tab === "lookup" && (
        <div className="space-y-4">
          {/* Sub-toggle: Markets / Wallets */}
          <div className="flex rounded-lg border border-pm-border-base bg-pm-bg-card p-0.5 w-fit">
            <button
              onClick={() => setLookupMode("markets")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                lookupMode === "markets"
                  ? "bg-pm-bg-elevated text-pm-fg-base"
                  : "text-pm-fg-muted hover:text-pm-fg-base"
              )}
            >
              <Search className="h-3 w-3" />
              Markets
            </button>
            <button
              onClick={() => setLookupMode("wallets")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                lookupMode === "wallets"
                  ? "bg-pm-bg-elevated text-pm-fg-base"
                  : "text-pm-fg-muted hover:text-pm-fg-base"
              )}
            >
              <Wallet className="h-3 w-3" />
              Wallets
            </button>
          </div>

          {/* Markets search */}
          {lookupMode === "markets" && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pm-fg-faint" />
              <input
                type="text"
                value={lookupQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search markets across Polymarket & Kalshi..."
                className="w-full rounded-lg border border-pm-border-base bg-pm-bg-card py-2.5 pl-10 pr-4 text-sm text-pm-fg-base placeholder:text-pm-fg-faint focus:border-pm-brand focus:outline-none focus:ring-1 focus:ring-pm-brand"
                autoFocus
              />
            </div>
          )}

          {/* Wallet search */}
          {lookupMode === "wallets" && (
            <form onSubmit={handleWalletSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Wallet className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pm-fg-faint" />
                <input
                  type="text"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value.trim())}
                  placeholder="Enter Polymarket wallet (0x...)"
                  className="w-full rounded-lg border border-pm-border-base bg-pm-bg-card py-2.5 pl-10 pr-4 font-mono text-sm text-pm-fg-base placeholder:font-sans placeholder:text-pm-fg-faint focus:border-pm-brand focus:outline-none focus:ring-1 focus:ring-pm-brand"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={!isValidAddress || loading}
                className="rounded-lg bg-pm-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-pm-brand/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Search
              </button>
            </form>
          )}
        </div>
      )}

      {loading && (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-pm-brand" />
          <span className="ml-2 text-sm text-pm-fg-muted">Loading...</span>
        </div>
      )}

      {!loading && tab === "whales" && <WhaleTradesTable data={whales} />}
      {!loading && tab === "traders" && <TopTradersTable data={traders} />}
      {!loading && tab === "hot" && <HotMarketsTable data={hot} />}
      {!loading && tab === "lookup" && lookupMode === "markets" && (
        <LookupTable data={lookupResults} hasQuery={lookupQuery.length >= 2} />
      )}
      {!loading && tab === "lookup" && lookupMode === "wallets" && (
        <WalletResults
          stats={walletStats}
          trades={walletTrades}
          searched={walletSearched}
        />
      )}
    </div>
  );
}

/* ──── Wallet Results ──── */

function WalletResults({
  stats,
  trades,
  searched,
}: {
  stats: WalletStatsRow | null;
  trades: WalletTradeHistoryRow[];
  searched: boolean;
}) {
  if (!searched) {
    return (
      <EmptyState
        icon={<Wallet className="h-8 w-8" />}
        title="Search for a wallet"
        description="Enter a Polymarket wallet address (0x...) to see trading history."
      />
    );
  }

  if (!stats) {
    return (
      <EmptyState
        icon={<Wallet className="h-8 w-8" />}
        title="Wallet not found"
        description="No trades found for this address on Polymarket."
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats card */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-pm-fg-base">
              {shortenAddress(stats.address)}
            </span>
            <a
              href={`https://polygonscan.com/address/${stats.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-pm-fg-faint transition-colors hover:text-pm-brand"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
          <span className="text-xs text-pm-fg-faint">Polymarket</span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <div>
            <div className="text-xs text-pm-fg-faint">Trades</div>
            <div className="text-lg font-semibold tabular-nums text-pm-fg-base">
              {stats.trade_count.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-xs text-pm-fg-faint">Volume</div>
            <div className="text-lg font-semibold tabular-nums text-pm-fg-base">
              {formatCurrency(stats.total_volume, true)}
            </div>
          </div>
          <div>
            <div className="text-xs text-pm-fg-faint">Markets</div>
            <div className="text-lg font-semibold tabular-nums text-pm-fg-base">
              {stats.market_count.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-xs text-pm-fg-faint">Avg Size</div>
            <div className="text-lg font-semibold tabular-nums text-pm-fg-base">
              {formatCurrency(stats.avg_size)}
            </div>
          </div>
          <div>
            <div className="text-xs text-pm-fg-faint">Active</div>
            <div className="text-sm font-medium tabular-nums text-pm-fg-base">
              {stats.first_trade} &rarr; {stats.last_trade}
            </div>
          </div>
        </div>
      </Card>

      {/* Trade history */}
      {trades.length > 0 && (
        <Card noPadding>
          <div className="border-b border-pm-border-subtle px-4 py-3">
            <h3 className="text-sm font-medium text-pm-fg-base">
              Recent Trades ({trades.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-pm-border-subtle text-xs text-pm-fg-faint">
                  <th className="px-4 py-2.5 font-medium">#</th>
                  <th className="px-4 py-2.5 font-medium">Market</th>
                  <th className="px-4 py-2.5 font-medium">Side</th>
                  <th className="px-4 py-2.5 text-right font-medium">Price</th>
                  <th className="px-4 py-2.5 text-right font-medium">Amount</th>
                  <th className="px-4 py-2.5 font-medium">Time</th>
                  <th className="px-4 py-2.5 font-medium">Tx</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((t, i) => (
                  <tr
                    key={i}
                    className={cn(
                      "border-b border-pm-border-subtle/50 transition-colors hover:bg-pm-bg-card-hover",
                      i % 2 === 1 && "bg-pm-bg-subtle/30"
                    )}
                  >
                    <td className="px-4 py-2.5 tabular-nums text-pm-fg-faint">
                      {i + 1}
                    </td>
                    <td className="max-w-xs truncate px-4 py-2.5">
                      <a
                        href={`https://polymarket.com/event/${t.market_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pm-fg-base hover:text-pm-brand"
                      >
                        {t.title}
                      </a>
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={
                          t.side === "Yes"
                            ? "text-pm-positive"
                            : "text-pm-negative"
                        }
                      >
                        {t.side}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-pm-fg-subtle">
                      {(t.price * 100).toFixed(1)}%
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-pm-fg-subtle">
                      {formatCurrency(t.amount, true)}
                    </td>
                    <td className="px-4 py-2.5 text-pm-fg-muted">{t.time}</td>
                    <td className="px-4 py-2.5">
                      {t.tx_hash && (
                        <a
                          href={`https://polygonscan.com/tx/${t.tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-pm-fg-faint hover:text-pm-brand"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

/* ──── Existing table components ──── */

function WhaleTradesTable({ data }: { data: WhaleTradeRow[] }) {
  if (data.length === 0) {
    return (
      <EmptyState
        icon={<TrendingUp className="h-8 w-8" />}
        title="No whale trades found"
        description="No large trades detected in this time period."
      />
    );
  }
  return (
    <Card noPadding>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-pm-border-subtle text-xs text-pm-fg-faint">
              <th className="px-4 py-2.5 font-medium">Platform</th>
              <th className="px-4 py-2.5 font-medium">Market</th>
              <th className="px-4 py-2.5 font-medium">Side</th>
              <th className="px-4 py-2.5 text-right font-medium">Price</th>
              <th className="px-4 py-2.5 text-right font-medium">Amount</th>
              <th className="px-4 py-2.5 font-medium">Time</th>
            </tr>
          </thead>
          <tbody>
            {data.map((t, i) => (
              <tr
                key={i}
                className={cn(
                  "border-b border-pm-border-subtle/50 transition-colors hover:bg-pm-bg-card-hover",
                  i % 2 === 1 && "bg-pm-bg-subtle/30"
                )}
              >
                <td className="px-4 py-2.5">
                  <PlatformBadge platform={t.platform} />
                </td>
                <td className="max-w-xs truncate px-4 py-2.5 text-pm-fg-base">
                  {t.title}
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className={
                      t.side === "Yes"
                        ? "text-pm-positive"
                        : "text-pm-negative"
                    }
                  >
                    {t.side}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-pm-fg-subtle">
                  {(t.price * 100).toFixed(1)}%
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-pm-fg-subtle">
                  {formatCurrency(t.amount, true)}
                </td>
                <td className="px-4 py-2.5 text-pm-fg-muted">{t.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function TopTradersTable({ data }: { data: TopTraderRow[] }) {
  if (data.length === 0) {
    return (
      <EmptyState
        icon={<Users className="h-8 w-8" />}
        title="No trader data found"
        description="No active traders detected in this time period."
      />
    );
  }
  return (
    <Card noPadding>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-pm-border-subtle text-xs text-pm-fg-faint">
              <th className="px-4 py-2.5 font-medium">#</th>
              <th className="px-4 py-2.5 font-medium">Address</th>
              <th className="px-4 py-2.5 text-right font-medium">Trades</th>
              <th className="px-4 py-2.5 text-right font-medium">Volume</th>
              <th className="px-4 py-2.5 text-right font-medium">Markets</th>
              <th className="px-4 py-2.5 text-right font-medium">Avg Size</th>
            </tr>
          </thead>
          <tbody>
            {data.map((t, i) => (
              <tr
                key={i}
                className={cn(
                  "border-b border-pm-border-subtle/50 transition-colors hover:bg-pm-bg-card-hover",
                  i % 2 === 1 && "bg-pm-bg-subtle/30"
                )}
              >
                <td className="px-4 py-2.5 tabular-nums text-pm-fg-faint">
                  {i + 1}
                </td>
                <td className="px-4 py-2.5">
                  <a
                    href={`https://polygonscan.com/address/${t.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-pm-polymarket hover:text-pm-brand"
                  >
                    {shortenAddress(t.address)}
                  </a>
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-pm-fg-subtle">
                  {t.trade_count.toLocaleString()}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-pm-fg-subtle">
                  {formatCurrency(t.total_volume, true)}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-pm-fg-subtle">
                  {t.market_count}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-pm-fg-subtle">
                  {formatCurrency(t.avg_size)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function HotMarketsTable({ data }: { data: HotMarketRow[] }) {
  if (data.length === 0) {
    return (
      <EmptyState
        icon={<Flame className="h-8 w-8" />}
        title="No hot markets found"
        description="No markets with high activity in this time period."
      />
    );
  }
  return (
    <Card noPadding>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-pm-border-subtle text-xs text-pm-fg-faint">
              <th className="px-4 py-2.5 font-medium">#</th>
              <th className="px-4 py-2.5 font-medium">Market</th>
              <th className="px-4 py-2.5 text-right font-medium">Trades</th>
              <th className="px-4 py-2.5 text-right font-medium">Volume</th>
              <th className="px-4 py-2.5 text-right font-medium">
                Unique Traders
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((m, i) => (
              <tr
                key={i}
                className={cn(
                  "border-b border-pm-border-subtle/50 transition-colors hover:bg-pm-bg-card-hover",
                  i % 2 === 1 && "bg-pm-bg-subtle/30"
                )}
              >
                <td className="px-4 py-2.5 tabular-nums text-pm-fg-faint">
                  {i + 1}
                </td>
                <td className="max-w-xs truncate px-4 py-2.5 text-pm-fg-base">
                  {m.title}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-pm-fg-subtle">
                  {m.trade_count.toLocaleString()}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-pm-fg-subtle">
                  {formatCurrency(m.volume, true)}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-pm-fg-subtle">
                  {m.unique_traders.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function LookupTable({
  data,
  hasQuery,
}: {
  data: MarketSearchRow[];
  hasQuery: boolean;
}) {
  if (!hasQuery) {
    return (
      <EmptyState
        icon={<Search className="h-8 w-8" />}
        title="Search for markets"
        description="Search across Polymarket & Kalshi by keyword."
      />
    );
  }
  if (data.length === 0) {
    return (
      <EmptyState
        icon={<Search className="h-8 w-8" />}
        title="No markets found"
        description="Try a different search term."
      />
    );
  }
  return (
    <Card noPadding>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-pm-border-subtle text-xs text-pm-fg-faint">
              <th className="px-4 py-2.5 font-medium">#</th>
              <th className="px-4 py-2.5 font-medium">Market</th>
              <th className="px-4 py-2.5 font-medium">Platform</th>
              <th className="px-4 py-2.5 text-right font-medium">Volume</th>
              <th className="px-4 py-2.5 text-right font-medium">
                Open Interest
              </th>
              <th className="px-4 py-2.5 font-medium">Category</th>
            </tr>
          </thead>
          <tbody>
            {data.map((m, i) => {
              const href =
                m.source === "Polymarket"
                  ? `https://polymarket.com/event/${m.market_id}`
                  : `https://kalshi.com/markets/${m.market_id.toLowerCase()}`;
              return (
                <tr
                  key={`${m.source}-${m.market_id}`}
                  className={cn(
                    "border-b border-pm-border-subtle/50 transition-colors hover:bg-pm-bg-card-hover",
                    i % 2 === 1 && "bg-pm-bg-subtle/30"
                  )}
                >
                  <td className="px-4 py-2.5 tabular-nums text-pm-fg-faint">
                    {i + 1}
                  </td>
                  <td className="max-w-xs truncate px-4 py-2.5">
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-pm-fg-base hover:text-pm-brand"
                    >
                      {m.title}
                    </a>
                  </td>
                  <td className="px-4 py-2.5">
                    <PlatformBadge platform={m.source} />
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-pm-fg-subtle">
                    {formatCurrency(m.notional_volume_usd, true)}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-pm-fg-subtle">
                    {formatCurrency(m.open_interest_usd, true)}
                  </td>
                  <td className="px-4 py-2.5 text-pm-fg-muted">
                    {m.category || "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
