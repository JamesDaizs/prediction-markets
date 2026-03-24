/** Shared types for the accuracy page and its chart components. */

export interface CalibrationBucket {
  bucket_low: number;
  bucket_high: number;
  avg_predicted: number;
  actual_rate: number;
  n: number;
}

export interface BrierData {
  overall: number | null;
  n: number;
}

export interface ResolutionData {
  yes: number;
  no: number;
  total: number;
}

export interface CategoryRow {
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

export interface AccuracyData {
  generated_at: string;
  methodology: {
    description: string;
    correct_if: string;
    excluded: string;
    polymarket_source: string;
    kalshi_source: string;
    brier_formula?: string;
    calibration_method?: string;
  };
  polymarket: CategoryRow[];
  kalshi: CategoryRow[];
  calibration?: {
    polymarket: CalibrationBucket[];
    kalshi: CalibrationBucket[];
  };
  brier?: {
    polymarket: BrierData;
    kalshi: BrierData;
  };
  resolution?: {
    polymarket: ResolutionData;
    kalshi: ResolutionData;
  };
}
