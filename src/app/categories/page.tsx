import { getCategories } from "@/lib/data";
import { formatCurrency, formatNumber } from "@/lib/format";
import { VolumeBarChart } from "@/components/charts/VolumeChart";

export default async function CategoriesPage() {
  const categories = await getCategories();
  const polyCats = categories.filter((c) => c.source === "Polymarket");
  const kalshiCats = categories.filter((c) => c.source === "Kalshi");

  const subGroups = new Map<string, { volume: number; oi: number; count: number }>();
  for (const c of polyCats) {
    const name = c.subcategory || c.category || "Other";
    const existing = subGroups.get(name) || { volume: 0, oi: 0, count: 0 };
    existing.volume += c.volume;
    existing.oi += c.open_interest;
    existing.count += c.market_count;
    subGroups.set(name, existing);
  }
  const sortedSubs = Array.from(subGroups.entries())
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.volume - a.volume);

  const chartData = sortedSubs.slice(0, 20).map((s) => ({ name: s.name, volume: s.volume }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Categories</h1>
        <p className="mt-1 text-sm text-zinc-500">Volume and open interest by category across platforms</p>
      </div>
      <VolumeBarChart data={chartData} title="Top 20 Subcategories by Volume (Polymarket)" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sortedSubs.slice(0, 30).map((sub) => (
          <div key={sub.name} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <h3 className="text-sm font-medium text-white">{sub.name}</h3>
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
              <div><div className="text-zinc-500">Volume</div><div className="text-zinc-200">{formatCurrency(sub.volume, true)}</div></div>
              <div><div className="text-zinc-500">Open Interest</div><div className="text-zinc-200">{formatCurrency(sub.oi, true)}</div></div>
              <div><div className="text-zinc-500">Markets</div><div className="text-zinc-200">{formatNumber(sub.count)}</div></div>
            </div>
          </div>
        ))}
      </div>
      {kalshiCats.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-white">Kalshi Categories</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {kalshiCats.filter((c) => c.volume > 0).slice(0, 20).map((c) => (
              <div key={`${c.category}-${c.subcategory}`} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                <h3 className="text-sm font-medium text-white">{c.subcategory || c.category}</h3>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div><div className="text-zinc-500">Volume</div><div className="text-zinc-200">{formatCurrency(c.volume, true)}</div></div>
                  <div><div className="text-zinc-500">Open Interest</div><div className="text-zinc-200">{formatCurrency(c.open_interest, true)}</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
