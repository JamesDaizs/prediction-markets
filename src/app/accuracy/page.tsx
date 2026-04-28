import { promises as fs } from "fs";
import path from "path";
import { AccuracyTable } from "./accuracy-table";
import { AccuracyClient } from "./accuracy-client";
import { StatCard } from "@/components/StatCard";
import type { AccuracyData } from "./types";

async function loadAccuracyData(): Promise<AccuracyData | null> {
  try {
    const filePath = path.join(
      process.cwd(),
      "public",
      "data",
      "accuracy_by_category.json"
    );
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export default async function AccuracyPage() {
  const data = await loadAccuracyData();

  if (!data) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-pm-fg-base">
          Prediction Market Accuracy
        </h1>
        <div className="flex flex-col items-center justify-center rounded-xl border border-pm-border-base bg-pm-bg-card px-6 py-12 text-center">
          <p className="text-sm text-pm-fg-muted">
            No accuracy data available. Drop a generated{" "}
            <code className="rounded bg-pm-bg-elevated px-2 py-0.5 text-xs text-pm-brand">
              public/data/accuracy_by_category.json
            </code>{" "}
            to populate this view.
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

  const totalResolved =
    (data.resolution?.polymarket.total ?? polyTotal?.markets ?? 0) +
    (data.resolution?.kalshi.total ?? kalshiTotal?.markets ?? 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-pm-fg-base">
          Prediction Market Accuracy
        </h1>
        <p className="mt-1 text-sm text-pm-fg-faint">
          Calibration, accuracy, and resolution analysis across Polymarket and
          Kalshi
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Polymarket 1d Acc"
          value={polyTotal?.acc_1d != null ? `${polyTotal.acc_1d}%` : "-"}
          sub={polyTotal ? `${formatNum(polyTotal.n_1d)} markets` : undefined}
          accentColor="#8b5cf6"
        />
        <StatCard
          label="Kalshi 1d Acc"
          value={kalshiTotal?.acc_1d != null ? `${kalshiTotal.acc_1d}%` : "-"}
          sub={
            kalshiTotal
              ? `${formatNum(kalshiTotal.n_1d)} markets`
              : undefined
          }
          accentColor="#3b82f6"
        />
        <StatCard
          label="Combined Brier Grade"
          value={(() => {
            const pb = data.brier?.polymarket;
            const kb = data.brier?.kalshi;
            if (!pb?.overall && !kb?.overall) return "-";
            const pn = pb?.n ?? 0;
            const kn = kb?.n ?? 0;
            const weighted =
              ((pb?.overall ?? 0) * pn + (kb?.overall ?? 0) * kn) /
              (pn + kn || 1);
            if (weighted <= 0.05) return "A+";
            if (weighted <= 0.10) return "A";
            if (weighted <= 0.15) return "B+";
            if (weighted <= 0.20) return "B";
            if (weighted <= 0.25) return "C";
            return "D";
          })()}
          sub={(() => {
            const pb = data.brier?.polymarket;
            const kb = data.brier?.kalshi;
            if (!pb?.overall && !kb?.overall) return undefined;
            const pn = pb?.n ?? 0;
            const kn = kb?.n ?? 0;
            const weighted =
              ((pb?.overall ?? 0) * pn + (kb?.overall ?? 0) * kn) /
              (pn + kn || 1);
            return `${weighted.toFixed(4)} weighted avg`;
          })()}
          accentColor="#22c55e"
        />
        <StatCard
          label="Total Resolved"
          value={formatNum(totalResolved)}
          sub="across both platforms"
        />
      </div>

      {/* Charts — client component for interactivity */}
      <AccuracyClient
        calibration={data.calibration}
        polymarket={data.polymarket}
        kalshi={data.kalshi}
        resolution={data.resolution}
        brier={data.brier}
      />

      {/* Methodology */}
      <div className="rounded-lg border border-pm-border-subtle bg-pm-bg-subtle px-5 py-4">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-pm-fg-faint">
          Methodology
        </h3>
        <div className="space-y-1.5 text-xs text-pm-fg-muted leading-relaxed">
          <p>
            <strong className="text-pm-fg-subtle">Accuracy</strong> ={" "}
            {data.methodology.description}. A market is{" "}
            <strong className="text-pm-fg-subtle">correct</strong> if{" "}
            {data.methodology.correct_if}.{" "}
            <strong className="text-pm-fg-subtle">Excluded:</strong>{" "}
            {data.methodology.excluded}.
          </p>
          {data.methodology.brier_formula && (
            <p>
              <strong className="text-pm-fg-subtle">Brier Score</strong> ={" "}
              {data.methodology.brier_formula}
            </p>
          )}
          {data.methodology.calibration_method && (
            <p>
              <strong className="text-pm-fg-subtle">Calibration</strong> ={" "}
              {data.methodology.calibration_method}
            </p>
          )}
        </div>
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
      <div className="flex items-center justify-between text-xs text-pm-fg-faint">
        <p>
          Inspired by{" "}
          <span className="text-pm-fg-muted">@PredictParity</span> and{" "}
          <span className="text-pm-fg-muted">Brier.fyi</span>.
        </p>
        <p>Generated {generatedDate}</p>
      </div>
    </div>
  );
}
