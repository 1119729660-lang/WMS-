/**
 * WMS Replenishment System Data Types & Interfaces
 */

export type PriorityLevel = 'P0' | 'P1' | 'P2' | 'NORMAL';

export type TaskStatus = 'pending_dispatch' | 'in_progress' | 'completed' | 'cancelled';

export type DispatchMode = 'manual_selection' | 'auto_engine';

export type ShelfLevel = 1 | 2 | 3;

export interface DailySales {
  date: string;          // YYYY-MM-DD
  dayLabel: string;      // e.g. "周一", "09-17"
  quantity: number;      // 实际出库件数
  isPromoAnomaly: boolean; // 是否标记为促销异常日（大促/爆单）
  promoTag?: string;     // 如 "秒杀大促", "达人直播"
}

export interface ReserveLocationStock {
  locationCode: string;   // e.g. "A-01-03-02"
  rackId: string;         // e.g. "A-01-03" (同架识别码: 库区-巷道-架位)
  level: ShelfLevel;      // 2 or 3
  availableStock: number; // 当前可用件数
  batchNo: string;        // 批次号
  productionDate: string; // 生产日期
  isSameRack: boolean;    // 是否与拣选位同架
  distanceScore: number;  // 移库距离评分（同架为0，相邻为1，同巷道其他为2，跨巷道为3）
}

export interface SKUReplenishConfig {
  replenishCoefficient: number; // 补货系数，默认 1.0
  minReplenishQty: number;      // 最小补货量，默认 10
  maxPickShelfCapacity: number; // 一层拣货位最大物理容量，默认 300
  targetDaysMin: number;        // 目标支撑最小天数 (7天)
  targetDaysMax: number;        // 目标支撑最大天数 (14天)
}

export interface ReplenishItem {
  id: string;
  skuCode: string;
  skuName: string;
  category: string;
  specification: string;
  unit: string;
  barcode: string;
  warehouseId: string;
  warehouseName: string;
  zone: string;                 // A区, B区, C区, D区
  rackCode: string;             // A-01-03
  pickLocationCode: string;     // 一层拣货位 e.g. A-01-03-01
  currentPickStock: number;     // 一层拣货位当前可用库存
  
  // 7日出库数据
  dailySalesHistory: DailySales[];
  
  // 备货区库存 (二层 & 三层)
  reserveLocations: ReserveLocationStock[];
  
  // SKU级别配置
  config: SKUReplenishConfig;
  
  // 缺货订单池联动指标
  pendingBackorderCount: number; // 缺货订单挂起商品数 (用于触发P0缺货联动)
  isPickStationStockout: boolean; // 拣货点是否实时断货
  
  // 动态计算属性 (由计算引擎填充)
  total7DaySales: number;       // 近7天出库总件数 (已剔除促销异常日)
  validSalesDays: number;       // 有效计销天数
  avgDailySales: number;        // 近7日平均销量 (总件数 ÷ 7 或有效天数)
  daysOfSupply: number;         // 剩余可用天数 = 一层可用库存 ÷ 7日均销
  isTriggered: boolean;         // 是否满足触发条件：一层可用库存 < 7日均销
  calculatedReplenishQty: number; // 理论计算补货量 = ceil(avgDailySales * coefficient)
  suggestedReplenishQty: number;  // 最终建议补货量 (经过上下限与一层容量保护)
  priority: PriorityLevel;      // P0 / P1 / P2 / NORMAL
  priorityReason: string;       // 优先级判定原因说明
  recommendedSourceLocation: ReserveLocationStock | null; // 推荐的源库位
  recommendationNote: string;   // 推荐理由 (如同架垂直直取)
  
  // 任务状态 (如有已生成任务)
  activeTaskId?: string;
  activeTaskStatus?: TaskStatus;
}

export interface ReplenishTask {
  taskId: string;               // e.g. "REP-20260924-001"
  itemId: string;
  skuCode: string;
  skuName: string;
  category: string;
  specification: string;
  unit: string;
  warehouseId: string;
  zone: string;
  sourceLocationCode: string;   // 源库位 (二层/三层)
  sourceLevel: ShelfLevel;
  isSameRack: boolean;          // 是否同架垂直移库
  targetLocationCode: string;   // 目标库位 (一层拣货位)
  requestedQty: number;         // 申请补货量
  actualQty?: number;           // 实际移库完成量
  priority: PriorityLevel;
  daysOfSupply: number;
  avgDailySales: number;
  status: TaskStatus;
  dispatchMode: DispatchMode;   // 一期人工圈选 vs 二期自动引擎
  dispatchedAt: string;         // 下发时间
  completedAt?: string;         // 完成时间
  operator?: string;            // 执行人/叉车工
  notes?: string;               // 备注
}

export interface WarehouseOption {
  id: string;
  name: string;
  zones: string[];
}

export interface ReplenishFilterState {
  warehouseId: string;
  zone: string;                 // 'ALL' or specific zone
  priority: string;             // 'ALL' | 'P0' | 'P1' | 'P2'
  status: string;               // 'ALL' | 'triggered_unassigned' | 'pending_dispatch' | 'in_progress' | 'completed'
  sameRackOnly: boolean;        // 仅看同架可补
  searchKeyword: string;        // SKU / 品名 / 库位
  systemPhase: 'phase1' | 'phase2'; // 一期方案 (人工圈选下发) vs 二期方案 (自动引擎)
  viewMode: 'table' | 'kanban' | 'rack_map'; // 视图模式
}

export interface ReplenishSummaryMetrics {
  totalSkus: number;
  triggeredCount: number;       // 触发补货的SKU数
  p0Count: number;              // P0 紧急断货
  p1Count: number;              // P1 紧缺 (<1天)
  p2Count: number;              // P2 预警 (<2天)
  normalCount: number;
  inProgressTaskCount: number;  // 进行中补货任务
  completedTodayCount: number;  // 今日已完成
  totalReplenishedQtyToday: number; // 今日补货总量
  sameRackHitRate: number;      // 同架垂直补货命中率 %
  avgFulfillmentHours: number;  // 平均补货时效 (小时)
}
