"use client";

import type { BrierData } from "@/app/accuracy/types";

interface BrierScoreSectionProps {
  polymarket: BrierData;
  kalshi: BrierData;
}

interface GradeInfo {
  grade: string;
  label: string;
  color: string;
}

function getGrade(brier: number): GradeInfo {
  if (brier <= 0.05) return { grade: "A+", label: "Exceptional", color: "#10b981" };
  if (brier <= 0.10) return { grade: "A", label: "Excellent", color: "#22c55e" };
  if (brier <= 0.15) return { grade: "B+", label: "Very Good", color: "#84cc16" };
  if (brier <= 0.20) return { grade: "B", label: "Good", color: "#eab308" };
  if (brier <= 0.25) return { grade: "C", label: "Average", color: "#f97316" };
  return { grade: "D", label: "Poor", color: "#ef4444" };
}

function formatN(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString();
}

const BENCHMARKS = [
  { label: "Perfect", value: 0.0 },
  { label: "Superforecasters", value: 0.10 },
  { label: "Weather forecasts", value: 0.18 },
  { label: "Coin flip", value: 0.25 },
];

function brierToPercent(brier: number): number {
  return (brier / 0.25) * 100;
}

export function BrierScoreSection({ polymarket, kalshi }: BrierScoreSectionProps) {
  if (polymarket.overall == null && kalshi.overall == null) return null;

  const polyGrade = polymarket.overall != null ? getGrade(polymarket.overall) : null;
  const kalshiGrade = kalshi.overall != null ? getGrade(kalshi.overall) : null;

  return (
    <div className="rounded-xl border border-pm-border-base bg-pm-bg-card p-5">
      {/* Header */}
      <h3 className="text-sm font-semibold text-pm-fg-base">Brier Score Analysis</h3>
      <p className="mt-0.5 text-xs text-pm-fg-faint">
        Prediction accuracy on a 0 &ndash; 0.25 scale &middot; lower is better
      </p>

      {/* Score Cards — the hero */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        {polymarket.overall != null && polyGrade && (
          <ScoreCard
            platform="Polymarket"
            dotClass="bg-pm-polymarket"
            score={polymarket.overall}
            grade={polyGrade}
            n={polymarket.n}
          />
        )}
        {kalshi.overall != null && kalshiGrade && (
          <ScoreCard
            platform="Kalshi"
            dotClass="bg-pm-kalshi"
            score={kalshi.overall}
            grade={kalshiGrade}
            n={kalshi.n}
          />
        )}
      </div>

      {/* Gauge */}
      <div className="mt-5">
        <div className="relative">
          {/* Track */}
          <div
            className="h-2.5 w-full rounded-full"
            style={{
              background: "linear-gradient(to right, #10b981 0%, #22c55e 30%, #84cc16 50%, #eab308 70%, #f97316 85%, #ef4444 100%)",
              opacity: 0.25,
            }}
          />

          {/* Benchmark markers */}
          {BENCHMARKS.map((b) => (
            <div
              key={b.label}
              className="absolute top-0 h-2.5"
              style={{ left: `${brierToPercent(b.value)}%` }}
            >
              <div className="h-full w-px bg-pm-fg-faint/30" />
            </div>
          ))}

          {/* Platform markers */}
          {kalshi.overall != null && (
            <div
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${brierToPercent(kalshi.overall)}%` }}
            >
              <div
                className="h-4 w-4 rounded-full border-2"
                style={{
                  backgroundColor: "var(--pm-kalshi)",
                  borderColor: "var(--pm-bg-card)",
                  boxShadow: "0 0 0 1px var(--pm-kalshi), 0 0 8px rgba(59, 130, 246, 0.4)",
                }}
              />
            </div>
          )}
          {polymarket.overall != null && (
            <div
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${brierToPercent(polymarket.overall)}%` }}
            >
              <div
                className="h-4 w-4 rounded-full border-2"
                style={{
                  backgroundColor: "var(--pm-polymarket)",
                  borderColor: "var(--pm-bg-card)",
                  boxShadow: "0 0 0 1px var(--pm-polymarket), 0 0 8px rgba(139, 92, 246, 0.4)",
                }}
              />
            </div>
          )}
        </div>

        {/* Benchmark labels */}
        <div className="mt-2.5 flex justify-between">
          {BENCHMARKS.map((b) => (
            <div
              key={b.label}
              className="flex flex-col items-center"
              style={{
                position: "relative",
                left: b.value === 0 ? "0" : b.value === 0.25 ? "0" : undefined,
              }}
            >
              <span className="text-[10px] tabular-nums text-pm-fg-faint">
                {b.value.toFixed(2)}
              </span>
              <span className="text-[10px] text-pm-fg-faint/70">
                {b.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Explainer */}
      <p className="mt-4 text-xs leading-relaxed text-pm-fg-muted">
        A Brier Score measures prediction accuracy where 0 is perfect and 0.25 is random guessing.
        Both platforms score in the 0.11&ndash;0.13 range, placing them alongside expert-level
        forecasters &mdash; significantly better than chance.
      </p>
    </div>
  );
}

function ScoreCard({
  platform,
  dotClass,
  score,
  grade,
  n,
}: {
  platform: string;
  dotClass: string;
  score: number;
  grade: GradeInfo;
  n: number;
}) {
  return (
    <div className="rounded-lg border border-pm-border-subtle bg-pm-bg-elevated/50 px-4 py-3">
      <div className="flex items-center gap-2">
        <div className={`h-2 w-2 rounded-full ${dotClass}`} />
        <span className="text-xs font-medium text-pm-fg-subtle">{platform}</span>
      </div>
      <div className="mt-2 flex items-baseline gap-2.5">
        <span
          className="text-2xl font-bold tabular-nums"
          style={{ color: grade.color }}
        >
          {grade.grade}
        </span>
        <span className="text-sm tabular-nums text-pm-fg-muted">
          {score.toFixed(4)}
        </span>
      </div>
      <div className="mt-1 flex items-center gap-1.5">
        <span className="text-[11px] text-pm-fg-faint" style={{ color: `${grade.color}99` }}>
          {grade.label}
        </span>
        <span className="text-[11px] text-pm-fg-faint">&middot;</span>
        <span className="text-[11px] tabular-nums text-pm-fg-faint">
          {formatN(n)} markets
        </span>
      </div>
    </div>
  );
}
