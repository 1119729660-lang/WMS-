// Types for Replenishment Monitoring Dashboard (补货监控看板)

export type StockoutCalculationMethod = 'picking_point_reports' | 'sku_ratio';

export type MonitoringTimeRange = 'today' | 'week' | 'month' | 'last7days' | 'last30days';

export type StuckTaskTier = '2_4h' | '4_8h' | '8h_plus';

export interface StuckTaskRecord {
  id: string;
  warehouseId: string;
  warehouseName: string;
  sku: string;
  productName: string;
  category: string;
  sourceLocation: string;
  targetLocation: string;
  requestedQty: number;
  unit: string;
  priority: 'P0' | 'P1' | 'P2';
  status: 'claimed' | 'in_progress';
  claimedBy: string;
  workerPhone: string;
  assignedZone: string;
  startedAt: string;
  startTimestamp: number;
  elapsedHours: number;
  tier: StuckTaskTier;
  delayReason?: string;
  urgedCount: number;
}

export interface WorkerProductivity {
  workerId: string;
  workerName: string;
  phone: string;
  assignedZone: string;
  completedPieces: number;
  completedTasks: number;
  workingHours: number;
  piecesPerHour: number;
  rank: number;
  targetAchieved: boolean; // Benchmark: 120 pcs/h
  timelinessRate: number; // e.g. 96.5%
  trend: 'up' | 'down' | 'flat';
}

export interface VolumeDimensionSummary {
  dimensionKey: string;
  dimensionName: string;
  subLabel?: string;
  totalPieces: number;
  totalTasks: number;
  avgPiecesPerTask: number;
  completedOnTimePieces: number;
  timelinessRate: number;
}

export interface TrendDataPoint {
  date: string;
  dateLabel: string;
  timelinessRate: number; // percentage, e.g. 94.2
  targetRate: number; // constant 95
  // Stockout method 1: 拣货点缺货上报次数 / 拣货总次数
  pickingReports: number;
  totalPickingOps: number;
  stockoutRatePicking: number;
  // Stockout method 2: 缺货SKU数 / 波次SKU总数
  stockoutSkus: number;
  totalWaveSkus: number;
  stockoutRateSku: number;
  // Volumes
  totalPieces: number;
  totalTasks: number;
  stuckCount: number;
}

export interface MonitoringConfig {
  timelinessPresetHours: number; // default 2h, configurable to 1, 2, 3, 4h
  stockoutMethod: StockoutCalculationMethod; // picking_point_reports or sku_ratio
  refreshIntervalSeconds: number; // default 300s (5min), 0 = off, 60, 180, 300, 600
  stuckThresholdHours: number; // default 2h
  targetTimelinessRate: number; // default 95%
  targetEfficiencyPiecesPerHour: number; // default 120 pcs/h
}

export interface WarehouseDrilldownTimeliness {
  warehouseId: string;
  warehouseName: string;
  completedOnTime: number;
  totalDue: number;
  timelinessRate: number;
  avgDurationMinutes: number;
}

export interface WorkerDrilldownTimeliness {
  workerId: string;
  workerName: string;
  assignedZone: string;
  completedOnTime: number;
  totalDue: number;
  timelinessRate: number;
  stuckCount: number;
}
