import { getTraderStats } from "@/lib/data";
import { formatCurrency, formatNumber } from "@/lib/format";
import { StatCard } from "@/components/StatCard";
import { BetHistogram } from "@/components/charts/BetHistogram";
import { SegmentPie } from "@/components/charts/SegmentPie";
import { ConcentrationChart } from "@/components/charts/ConcentrationChart";
import { TradersTable } from "@/components/tables/TradersTable";

export default async function TradersPage() {
  const stats = await getTraderStats();
  const hasData = stats.aggregate && stats.aggregate.unique_traders > 0;

  if (!hasData) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Trader Analytics</h1>
          <p className="mt-1 text-sm text-zinc-500">Bet size distributions, whale analysis, and volume concentration</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
          <p className="text-zinc-400">No trade data available yet. Run the collection script to populate this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Trader Analytics</h1>
        <p className="mt-1 text-sm text-zinc-500">Bet size distributions, whale analysis, and volume concentration</p>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Unique Traders" value={formatNumber(stats.aggregate.unique_traders, true)} sub="Across sampled markets" />
        <StatCard label="Total Trades" value={formatNumber(stats.aggregate.total_trades, true)} />
        <StatCard label="Total Volume" value={formatCurrency(stats.aggregate.total_volume, true)} sub="From sampled trades" />
        <StatCard label="Avg Bet Size" value={formatCurrency(stats.aggregate.avg_bet_size)} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <BetHistogram data={stats.bet_distribution} title="Bet Size Distribution (by count)" colorBy="count" />
        <BetHistogram data={stats.bet_distribution} title="Volume by Bet Size Bucket" colorBy="volume" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <SegmentPie data={stats.segmentation} title="Trader Segments (by volume)" metric="volume" />
        <ConcentrationChart data={stats.concentration} title="Volume Concentration (Lorenz Curve)" />
      </div>
      {stats.top_traders.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-white">Top 20 Traders by Volume</h2>
          <TradersTable traders={stats.top_traders} />
        </div>
      )}
    </div>
  );
}
