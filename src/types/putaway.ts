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
  // 1. 判定优先级 (支持自定义顺序: 新品、爆品、滞销品、老品)
  prioritySequence: ('NEW' | 'HOT' | 'REGULAR' | 'SLOW')[];

  // 2. 新品判定规则
  newProductRule: {
    enabled: boolean;
    determinationMode: 'NO_HISTORY_INBOUND' | 'FIRST_INBOUND_WITHIN_DAYS' | 'TOTAL_INBOUND_COUNT';
    newProductDaysLimit: number;       // 首次入库在 N 天以内算新品，默认 30 天
    maxInboundCount: number;           // 累计入库次数 <= N 次算新品，默认 1 次
    targetLocationType: 'PICK_LEVEL_1' | 'FLOOR_PALLET_ZONE' | 'RESERVE_LEVEL_2_3'; // 推荐上架目标
    skipPickStockCheck: boolean;       // 免验拣货区库存 (直决机制)
    maxInitialPickQuantity: number;    // 首批铺货建议上限
    directPutawayToLevel1?: boolean;   // 兼容旧字段
    minInitialStockLimit?: number;     // 兼容旧字段
  };

  // 3. 爆品判定规则
  hotProductRule: {
    enabled: boolean;
    matchLogic: 'OR' | 'AND';          // 动销天数与出库排名逻辑：满足任一 OR vs 同时满足 AND
    minActiveDays30d: number;          // 近30天动销天数 >= N 天，默认 20 天
    topSalesPercent: number;           // 出库量 TOP N%，默认 20%
    minDailySales: number;             // 近30天日均销量阈值 (>= N件，0为不限制)
    targetLocationStrategy: 'FLOOR_PALLET_THEN_PICK' | 'PICK_LEVEL_1_ONLY' | 'FLOOR_PALLET_ONLY';
    palletThresholdQty: number;        // 整托/大件地堆判定起算件数，默认 100 件
    skipPickStockCheck: boolean;       // 免验拣货区库存
    enableFloorPalletStaging: boolean; // 启用绿色地堆托盘囤货
    directPutawayToFloorOrPick?: boolean; // 兼容旧字段
  };

  // 4. 滞销品判定规则
  slowProductRule: {
    enabled: boolean;
    matchLogic: 'OR' | 'AND';          // 动销天数与出库排名逻辑：满足任一 OR vs 同时满足 AND
    maxActiveDays30d: number;          // 近30天动销天数 < N 天，默认 5 天
    bottomSalesPercent: number;        // 出库量后 N%，默认 20%
    maxTotalSales30d: number;          // 近30天总出库量 <= N 件，默认 30 件
    targetLocationType: 'SLOW_MOVING_HIGH_BAY' | 'RESERVE_LEVEL_2_3'; // 推荐目标储位
    skipPickStockCheck: boolean;       // 免验拣货库存
    forbidLevel1Pick: boolean;         // 严格禁止上一层黄金拣选位
    directPutawayToHighBay?: boolean;  // 兼容旧字段
  };

  // 5. 老品上架规则 (排除前置品类后，根据均销与当前库存计算)
  regularProductRule: {
    enabled: boolean;
    baselineSalesPeriod: '30D_AVG' | '7D_AVG' | 'WEIGHTED_7_30'; // 均销核算基准
    defaultSafetyStockCoeff: number;   // 默认品类安全库存系数 (如 1.0x)
    checkPickAreaStock: boolean;       // 严格校验一层拣货区库存
    shortageTargetLocation: 'PICK_LEVEL_1' | 'FLOOR_PALLET_ZONE'; // 缺货时推荐储位
    sufficientTargetLocation: 'RESERVE_LEVEL_2_3' | 'SAME_RACK_VERTICAL'; // 充足时推荐储位
    enforceMaxCapacity: boolean;       // 是否受限一层最大货位容量
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

  // 实体物理属性与价值 (用于判定高价值品、大件超重、滞销等)
  price?: number;             // 单价 (元)
  weightKg?: number;          // 单件毛重 (kg)
  volumeM3?: number;          // 单件体积 (m³)
  lengthCm?: number;          // 最大单边长 (cm)
  deadStockDays?: number;     // 连续零动销天数
}

// 9 大可选条件键值定义
export type InboundRuleConditionKey =
  | 'IS_FIRST_INBOUND'                          // 是否首次入库
  | 'IS_PICK_PLUS_BATCH_GTE_30D_SALES'          // 是否拣货区数量 + 当批来货数量≥近 30 天销量
  | 'IS_ACTIVE_DAYS_GT_20'                      // 是否近 30 天动销天数大于 20
  | 'IS_PICK_STOCK_GT_30D_SALES'                // 是否拣货区数量大于近 30 天销量
  | 'IS_BELOW_SAFETY_AND_SALES_GTE_THRESHOLD'   // 是否低于安全库存 & 日均销量≥阈值
  | 'IS_HIGH_VALUE'                             // 是否高价值品
  | 'IS_BULK_OR_OVERWEIGHT'                     // 是否大件 / 超重
  | 'IS_DEAD_STOCK_90D'                         // 是否滞销 90 天零动销
  | 'IS_HOT_TOP_N_PERCENT';                     // 是否热销 TOP 前 N%

export const CONDITION_LABEL_MAP: Record<InboundRuleConditionKey, string> = {
  IS_FIRST_INBOUND: '是否首次入库',
  IS_PICK_PLUS_BATCH_GTE_30D_SALES: '是否拣货区数量 + 当批来货数量≥近 30 天销量',
  IS_ACTIVE_DAYS_GT_20: '是否近 30 天动销天数大于 20',
  IS_PICK_STOCK_GT_30D_SALES: '是否拣货区数量大于近 30 天销量',
  IS_BELOW_SAFETY_AND_SALES_GTE_THRESHOLD: '是否低于安全库存 & 日均销量≥阈值',
  IS_HIGH_VALUE: '是否高价值品',
  IS_BULK_OR_OVERWEIGHT: '是否大件 / 超重',
  IS_DEAD_STOCK_90D: '是否滞销 90 天零动销',
  IS_HOT_TOP_N_PERCENT: '是否热销 TOP 前 N%',
};

export type RecommendedZoneOption = '拣货层' | '备货层' | '地堆区' | '高价值专区' | '滞销存放区';
export type RecommendedStrategyOption = '同位优先' | '就近空位' | '指定货架范围';

// 来货类型规则 - 12项执行机制与推荐策略高级参数
export interface InboundExecutionPolicy {
  // 1. 推荐上架去向 (例如: 推荐上架【一层拣货位】)
  recommendedTargetDirection: string;
  // 2. 直执机制（免除拣货库存）：是否开启 —— 开启后直接锁定货位，跳过拣货货架校验
  skipPickStockCheck: boolean;
  // 3. 首批建议铺货上限：80 件（自定义填写）
  initialMaxStockLimit: number;
  // 4. 分流向策略：大件 / 整托去地堆托盘区
  routingStrategy: string;
  // 5. 免除拣货库存直决：已开启 —— 不拆分高层备货区，源头减少补货
  directNoSplitReserve: boolean;
  // 6. 推荐存储去向：高层三层 / 滞销专区（长尾订单需补）
  storageDirection: string;
  // 7. 严禁上架一层拣选区：是否开启 —— 防止低动销占用黄金通道
  prohibitPickLayer1: boolean;
  // 8. 直决免除拣货库存：是否开启 —— 即使一层为 0 也直接上高层
  forceDirectHighBay: boolean;
  // 9. 一层库存不足时推荐储位：推荐上架【一层黄金拣货位】补足拣货 [推荐]
  shortageRecommendation: string;
  // 10. 一层库存充足时推荐储位：推荐上架【同架 / 邻架二三层备货位】[推荐]
  sufficientRecommendation: string;
  // 11. 默认品类安全系数：1 × 均销
  safetyStockCoeff: number;
  // 12. 货位容量超限保护：是否开启 —— 一层满仓时强制转二三层
  capacityOverflowProtection: boolean;
}

export const DEFAULT_INBOUND_EXECUTION_POLICY: InboundExecutionPolicy = {
  recommendedTargetDirection: '推荐上架【一层拣货位】',
  skipPickStockCheck: true,
  initialMaxStockLimit: 80,
  routingStrategy: '大件 / 整托去地堆托盘区',
  directNoSplitReserve: true,
  storageDirection: '高层三层 / 滞销专区（长尾订单需补）',
  prohibitPickLayer1: false,
  forceDirectHighBay: false,
  shortageRecommendation: '推荐上架【一层黄金拣货位】补足拣货',
  sufficientRecommendation: '推荐上架【同架 / 邻架二三层备货位】',
  safetyStockCoeff: 1.0,
  capacityOverflowProtection: true,
};

export interface InboundTypeRule {
  id: string;                                   // 规则 ID (系统自动生成只读)
  name: string;                                 // 类型名称 (1~50字符，同仓库下唯一)
  priority: number;                             // 优先级 (正整数 >= 1，数字越小优先级越高)
  conditionMode: 'AND' | 'OR';                  // 条件组合模式: 全部满足 (AND) / 满足任一 (OR)
  conditions: InboundRuleConditionKey[];        // 已选条件清单
  recommendedZone: RecommendedZoneOption;       // 推荐货区
  recommendedStrategy: RecommendedStrategyOption; // 推荐货架策略
  specifiedRacks?: string[];                    // 指定货架范围编码列表
  status: 'ENABLED' | 'DISABLED';               // 规则状态: 启用 / 禁用
  notes?: string;                               // 备注 (最多200字符)
  executionPolicy?: InboundExecutionPolicy;     // 12项执行与去向策略配置
  createdAt?: string;
  updatedAt?: string;
}

export interface GlobalRuleParameters {
  activeDays30dThreshold: number;       // 近 30 天动销天数阈值，默认 20
  dailySalesThreshold: number;          // 日均销量阈值，默认 0
  highValuePriceThreshold: number;      // 高价值品 - 单价阈值，默认 0
  highValueSkuWhitelist: string[];      // 高价值品 - SKU 白名单
  bulkWeightThresholdKg: number;        // 大件 / 超重 - 重量阈值 (kg)，默认 0
  bulkVolumeThresholdM3: number;        // 大件 / 超重 - 体积阈值 (m³)，默认 0
  bulkLengthThresholdCm: number;        // 大件 / 超重 - 单边长度阈值 (cm)，默认 0
  deadStockDaysThreshold: number;       // 滞销统计天数阈值，默认 90
  hotSalesTopPercent: number;           // 热销 TOP 百分比 N (%)，默认 20
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
