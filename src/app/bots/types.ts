export interface ClassificationRow {
  class: string;
  count: number;
  volume: number;
  pnl: number;
  avgPnl: number;
  profitablePercent: number;
}

export interface PnLWaterfallRow {
  class: string;
  pnl: number;
}

export interface HourlyActivityRow {
  hours: string;
  highFreqPct: number;
  lowFreqPct: number;
}

export interface TradeSizeBucket {
  bucket: string;
  pctTrades: number;
  pctVolume: number;
}

export interface CategoryBotRow {
  category: string;
  botPct: number;
  humanPct: number;
}

export interface TradeMatrix {
  labels: string[];
  data: number[][];
}

export interface FeeRow {
  class: string;
  feesCollected: number;
  pctTotal: number;
  feeOverVolume: number;
}

export interface Strategy {
  name: string;
  description: string;
  example: string;
  profitRange: string;
  status: string;
}

export interface TopWallet {
  address: string;
  pnl: number;
  volume: number;
  trades: number;
  winRate: number;
  botClass: string;
  label: string;
}

export interface HeroStats {
  botVolumePercent: number;
  humanNetPnl: number;
  activeBots: number;
  humanHumanTradePct: number;
}

export interface BotVolumeWeek {
  week: string;
  highFreqVolume: number;
  totalVolume: number;
  highFreqPct: number;
  highFreqWallets: number;
  totalWallets: number;
}

export interface CTFNegRiskDay {
  date: string;
  ctfDAW: number;
  negRiskDAW: number;
  totalDAW: number;
}

export interface SameBlockStats {
  multiBlocks: number;
  maxTradesInBlock: number;
  walletsWithMulti: number;
  totalMultiTrades: number;
}

export interface BotAnalysisData {
  generated_at: string;
  wallet_count: number;
  heroStats: HeroStats;
  classificationSummary: ClassificationRow[];
  pnlWaterfall: PnLWaterfallRow[];
  hourlyActivity: HourlyActivityRow[];
  tradeSizeDistribution: TradeSizeBucket[];
  categoryBotConcentration: CategoryBotRow[];
  tradeMatrix: TradeMatrix;
  feeExtraction: FeeRow[];
  botVolumeTimeline: BotVolumeWeek[];
  ctfVsNegRisk: CTFNegRiskDay[];
  sameBlockStats: SameBlockStats | null;
  strategies: Strategy[];
  topBots: TopWallet[];
  topHumans: TopWallet[];
}
