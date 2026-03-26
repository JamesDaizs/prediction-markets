"use client";

import { CalibrationChart } from "@/components/charts/calibration-chart";
import { AccuracyWindowChart } from "@/components/charts/accuracy-window-chart";
import { ResolutionDonut } from "@/components/charts/resolution-donut";
import { BrierScoreSection } from "@/components/charts/brier-score-section";
import type {
  CalibrationBucket,
  CategoryRow,
  BrierData,
  ResolutionData,
} from "./types";

interface Props {
  calibration?: {
    polymarket: CalibrationBucket[];
    kalshi: CalibrationBucket[];
  };
  polymarket: CategoryRow[];
  kalshi: CategoryRow[];
  resolution?: {
    polymarket: ResolutionData;
    kalshi: ResolutionData;
  };
  brier?: {
    polymarket: BrierData;
    kalshi: BrierData;
  };
}

export function AccuracyClient({
  calibration,
  polymarket,
  kalshi,
  resolution,
  brier,
}: Props) {
  const hasCalibration =
    calibration &&
    calibration.polymarket.length > 0;
  const hasResolution =
    resolution &&
    (resolution.polymarket.total > 0 || resolution.kalshi.total > 0);

  const hasBrier =
    brier &&
    (brier.polymarket.overall != null || brier.kalshi.overall != null);

  return (
    <div className="space-y-6">
      {/* Brier Score Analysis — full width */}
      {hasBrier && (
        <BrierScoreSection
          polymarket={brier.polymarket}
          kalshi={brier.kalshi}
        />
      )}

      {/* Calibration Chart — full width hero */}
      {hasCalibration && (
        <CalibrationChart
          polymarket={calibration.polymarket}
          kalshi={calibration.kalshi}
        />
      )}

      {/* Accuracy by Window + Resolution Donut — side by side */}
      <div className="grid gap-6 lg:grid-cols-2">
        <AccuracyWindowChart polymarket={polymarket} kalshi={kalshi} />
        {hasResolution ? (
          <ResolutionDonut
            polymarket={resolution.polymarket}
            kalshi={resolution.kalshi}
          />
        ) : (
          <div className="rounded-xl border border-pm-border-base bg-pm-bg-card p-5">
            <h3 className="text-sm font-medium text-pm-fg-subtle">
              Resolution Distribution
            </h3>
            <div className="flex items-center justify-center py-12 text-xs text-pm-fg-faint">
              Run the pipeline to generate resolution data
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
