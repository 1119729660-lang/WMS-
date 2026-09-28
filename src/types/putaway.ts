/**
 * WMS Putaway Management & Strategy Configuration Types
 */

export type PutawaySKUType = 'NEW' | 'HOT' | 'REGULAR' | 'SLOW';

export type PutawayTargetType = 
  | 'PICK_LEVEL_1'           // 一层拣货区 (快速可售/补足拣选)
  | 'FLOOR_PALLET_ZONE'       // 绿色地堆托盘区 (整托囤货/爆品大件)
  | 'RESERVE_LEVEL_2_3'       // 同架/邻架二三层备货位 (常规高位立体存储)
  | 'SLOW_MOVING_HIGH_BAY';   // 高层/滞销区 (长尾低频，订单需要时再补)

export interface PromoDayAnomaly {
  id: string;
  date: string;          // YYYY-MM-DD
  name: string;          // 例如: "99大促狂欢", "头部主播大促"
  multiplier: number;    // 销量暴涨倍数
  excluded: boolean;     // 是否剔除该日以校准常规动销
}

export interface CategoryStockConfig {
  category: string;
  thresholdCoeff: number; // 0.8 ~ 1.5, 默认 1.0 (拣货区库存阈值 = 近30天平均销量 * 系数)
  maxPickCapacity: number; // 一层最大货位容量
}

export interface PutawayStrategyConfig {
  // 1. 判定优先级 (严格固定: 新品 → 爆品 → 老品 → 滞销品)
  prioritySequence: ('NEW' | 'HOT' | 'REGULAR' | 'SLOW')[];

  // 2. 新品判定规则 (系统无历史入库记录)
  newProductRule: {
    enabled: boolean;
    directPutawayToLevel1: boolean; // 直决上架一层拣货位，不校验拣货区库存
    minInitialStockLimit: number;   // 首次入库建议铺货量
  };

  // 3. 爆品判定规则 (动销天数>=20天 或 出库量 TOP 20%)
  hotProductRule: {
    enabled: boolean;
    minActiveDays30d: number;      // 默认 20 天
    topSalesPercent: number;       // 默认 20% (TOP 20%)
    directPutawayToFloorOrPick: boolean; // 直决上架：足量铺一层，相邻地堆整托囤货，不拆分高层备货
    enableFloorPalletStaging: boolean;   // 启用绿色地堆托盘囤货
  };

  // 4. 滞销品判定规则 (长尾低动销，动销天数<5天 或 出库量后20%)
  slowProductRule: {
    enabled: boolean;
    maxActiveDays30d: number;      // 默认 5 天 (<5天)
    bottomSalesPercent: number;    // 默认 20% (后20%)
    directPutawayToHighBay: boolean; // 直决上架：直接上架高层/滞销区，不占一层黄金位，订单需要时再补
  };

  // 5. 老品上架规则 (排除新品/爆品/滞销品后，必须校验拣货区库存)
  regularProductRule: {
    checkPickAreaStock: boolean;   // 恒为 true：仅老品才校验拣货区库存
    // 条件：一层拣货位可用库存 < 近30天平均销量 × 品类阈值系数 => 推荐一层拣货位，否则推荐同架/邻架二三层
  };

  // 6. 30天均销与大促剔除
  salesCalculationDays: number;    // 30 天
  promoAnomalies: PromoDayAnomaly[]; // 标记异常波动日

  // 7. 品类阈值系数 (0.8 ~ 1.5)
  categoryConfigs: Record<string, CategoryStockConfig>;

  // 8. 同 SKU 同位绑定规则
  sameSkuRackBinding: {
    enabled: boolean;              // 开启同 SKU 同位绑定
    strictSameRackFirst: boolean;  // 优先同一货架，其次相邻货架
    maxHorizontalDistanceRacks: number; // 允许最大相邻货架跨距 (例如 1 代表仅紧挨着的货架)
  };

  // 9. 货架区 vs 地堆区规则
  zoneRoutingRules: {
    highBayRackEnabled: boolean;   // 高位货架区走分层推荐 (1层拣选 / 2-3层备货)
    floorPalletZoneEnabled: boolean; // 绿色地堆托盘区整托上架，不启用层位拆分
    pdaEnforceScanning: boolean;   // PDA 扫码防错强制校验
  };
}

// 库位标签角色类型 (动态标签，非写死)
export type LocationRoleTag = 
  | 'PICKING_LAYER'    // 拣货层 (通常为 1 层)
  | 'RESERVE_LAYER'    // 备货层 (通常为 2, 3 层)
  | 'TEMP_PICKING'     // 大促/检修临时切为拣货层
  | 'FLOOR_PALLET'     // 地堆整托位
  | 'SLOW_ZONE';       // 高层滞销品专区

export interface WarehouseLocation {
  locationCode: string;       // e.g. "A-01-02-01", "FP-A-01"
  zone: string;               // "A区 (高位货架)" 或 "FP区 (绿色地堆托盘区)"
  isFloorPallet: boolean;     // 是否地堆区
  rackCode: string;           // "A-01-02" 或 "FP-A"
  level: number;              // 1, 2, 3 (地堆区为 0 或 1)
  currentRoleTag: LocationRoleTag; // 动态库位标签
  originalRoleTag: LocationRoleTag; // 原始标签 (用于大促/检修结束后一键切回)
  isTemporarySwitched: boolean;    // 是否处于临时切换状态
  switchReason?: string;           // 切换原因 (如: "618大促临时扩充拣选位", "1层轨道检修临时由2层出货")
  maxCapacity: number;        // 最大容量 (件/托)
  currentStock: number;       // 当前存放件数
  boundSkuCode?: string;      // 已绑定的同 SKU 编码
  boundSkuName?: string;
  isAvailable: boolean;
}

export interface PutawaySKUCandidate {
  id: string;
  skuCode: string;
  skuName: string;
  category: string;
  specification: string;
  unit: string;
  barcode: string;
  inboundBatchNo: string;     // 本次入库批次
  inboundQty: number;         // 本次到货入库件数
  isFullPallet: boolean;      // 是否整托大件入库
  
  // 历史入库记录判定
  hasHistoryInbound: boolean; // 是否有历史入库记录 (false 即为新品)
  firstInboundDate?: string;  // 首次入库日期

  // 近 30 天动销与出库
  activeDays30d: number;      // 近 30 天动销天数 (有实际出库的天数)
  total30dOutboundQty: number; // 近 30 天出库总件数 (原始)
  salesRankPercent: number;   // 30 天出库量在全库分位 (0.05 代表前 5%, 0.95 代表后 5%)
  
  // 当前货位现状
  currentPickLocation?: string; // 现绑定的 1 层拣货位
  currentPickStock: number;     // 1 层拣货位当前可用库存
  boundRackCode?: string;       // 绑定的货架号 (如 A-01-02)
  
  // 30 日销量明细 (含大促异常日)
  daily30dHistory: Array<{
    date: string;
    quantity: number;
    isPromoSpike?: boolean;
    promoNote?: string;
  }>;
}

// 判定结果与推导链 (Audit Trace)
export interface PutawayDecisionResult {
  sku: PutawaySKUCandidate;
  skuType: PutawaySKUType;          // 判定类型: NEW / HOT / REGULAR / SLOW
  priorityStep: string;             // 命中阶段
  isDirectDecision: boolean;        // 是否直决 (新品/爆品/滞销品直决，老品不直决)
  checkedPickStock: boolean;        // 是否校验了拣货区库存 (仅老品为 true)
  
  // 30 天日均销推导
  raw30dAvgDailySales: number;      // 原始 30 日日均销
  adjusted30dAvgDailySales: number; // 剔除大促异常日后日均销
  promoExcludedDaysCount: number;   // 剔除的大促天数
  categoryThresholdCoeff: number;   // 品类系数
  pickStockThreshold: number;       // 拣货区库存阈值 = 日均销 × 品类系数

  // 推荐上架目标
  recommendedTargetType: PutawayTargetType;
  recommendedLocationCode: string;
  recommendedZoneName: string;
  recommendedLevel: number;
  isSameRackVertical: boolean;      // 是否命中同 SKU 同架垂直
  palletStrategy: 'FLOOR_PALLET_STAGE' | 'HIGH_BAY_SPLIT' | 'DIRECT_PICK' | 'SLOW_HIGH_BAY';
  
  // 决策推导全过程日志 (用于界面清晰展示为什么这么判)
  decisionTraceSteps: Array<{
    stepName: string;
    condition: string;
    result: boolean;
    description: string;
    badgeColor: 'blue' | 'emerald' | 'amber' | 'purple' | 'slate';
  }>;
  
  strategySummary: string; // 一句话上架指令
  pdaAlertMessage: string; // PDA 屏幕重点防错提示文案
}
