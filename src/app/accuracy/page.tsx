import { promises as fs } from "fs";
import path from "path";
import { AccuracyTable } from "./accuracy-table";

interface AccuracyData {
  generated_at: string;
  methodology: {
    description: string;
    correct_if: string;
    excluded: string;
    polymarket_source: string;
    kalshi_source: string;
  };
  polymarket: CategoryRow[];
  kalshi: CategoryRow[];
}

interface CategoryRow {
  category: string;
  markets: number;
  acc_4h: number | null;
  n_4h: number;
  acc_12h: number | null;
  n_12h: number;
  acc_1d: number | null;
  n_1d: number;
  acc_1w: number | null;
  n_1w: number;
  acc_1mo: number | null;
  n_1mo: number;
}

async function loadAccuracyData(): Promise<AccuracyData | null> {
  try {
    const filePath = path.join(
      process.cwd(),
      "data",
      "processed",
      "accuracy_by_category.json"
    );
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default async function AccuracyPage() {
  const data = await loadAccuracyData();

  if (!data) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">
          Prediction Market Accuracy
        </h1>
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-8 text-center">
          <p className="text-zinc-400">
            No accuracy data available. Run{" "}
            <code className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-violet-400">
              cd scripts && uv run python accuracy_queries.py
            </code>{" "}
            to generate data.
          </p>
        </div>
      </div>
    );
  }

  const polyTotal = data.polymarket.find((r) => r.category === "Total");
  const kalshiTotal = data.kalshi.find((r) => r.category === "Total");
  const generatedDate = new Date(data.generated_at).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Prediction Market Accuracy by Category
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          How accurately did market prices predict outcomes at various intervals
          before resolution?
        </p>
      </div>

      {/* Methodology */}
      <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/30 px-5 py-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
          Methodology
        </h3>
        <p className="text-xs text-zinc-400 leading-relaxed">
          <strong className="text-zinc-300">Accuracy</strong> ={" "}
          {data.methodology.description}. A market is{" "}
          <strong className="text-zinc-300">correct</strong> if{" "}
          {data.methodology.correct_if}.{" "}
          <strong className="text-zinc-300">Excluded:</strong>{" "}
          {data.methodology.excluded}. Column headers show time before
          resolution (4h = 4 hours before market resolved).
        </p>
      </div>

      {/* Tables */}
      <AccuracyTable
        platform="Polymarket"
        data={data.polymarket}
        totalMarkets={polyTotal?.markets}
      />

      <AccuracyTable
        platform="Kalshi"
        data={data.kalshi}
        totalMarkets={kalshiTotal?.markets}
      />

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-zinc-600">
        <p>
          Data sourced from ClickHouse (Polymarket on-chain + Kalshi market
          reports). Inspired by{" "}
          <span className="text-zinc-500">@PredictParity</span>.
        </p>
        <p>Generated {generatedDate}</p>
      </div>
    </div>
  );
}
