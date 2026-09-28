import {
  PutawayStrategyConfig,
  PutawaySKUCandidate,
  WarehouseLocation,
} from '../types/putaway';

export const DEFAULT_PUTAWAY_CONFIG: PutawayStrategyConfig = {
  // 1. 判定优先级：新品 → 爆品 → 老品 → 滞销品
  prioritySequence: ['NEW', 'HOT', 'REGULAR', 'SLOW'],

  // 2. 新品判定规则
  newProductRule: {
    enabled: true,
    directPutawayToLevel1: true, // 直决上一层拣货区，不校验拣货区当前库存
    minInitialStockLimit: 50,
  },

  // 3. 爆品判定规则
  hotProductRule: {
    enabled: true,
    minActiveDays30d: 20,       // 近30天动销天数 >= 20天
    topSalesPercent: 20,        // 出库量 TOP 20%
    directPutawayToFloorOrPick: true, // 直决：足量铺一层拣货位，相邻地堆整托囤货，不拆分高层备货
    enableFloorPalletStaging: true,
  },

  // 4. 滞销品判定规则
  slowProductRule: {
    enabled: true,
    maxActiveDays30d: 5,        // 近30天动销天数 < 5天
    bottomSalesPercent: 20,     // 出库量后 20%
    directPutawayToHighBay: true, // 直决：直接上架高层/滞销区，订单需要时再补
  },

  // 5. 老品上架逻辑 (仅老品才校验拣货区库存)
  regularProductRule: {
    checkPickAreaStock: true,   // 一层可用库存 < 30天均销*系数 -> 推荐一层，否则推荐同架/邻架二三层
  },

  // 6. 30天均销与异常大促日剔除
  salesCalculationDays: 30,
  promoAnomalies: [
    {
      id: 'PROMO-01',
      date: '2026-09-09',
      name: '99 聚划算秋季大促开门红',
      multiplier: 4.8,
      excluded: true,
    },
    {
      id: 'PROMO-02',
      date: '2026-09-22',
      name: '超级品牌日限量秒杀专场',
      multiplier: 6.2,
      excluded: true,
    },
    {
      id: 'PROMO-03',
      date: '2026-09-15',
      name: '头部主播达人带货专场',
      multiplier: 3.5,
      excluded: false, // 可配置切换
    },
  ],

  // 7. 品类阈值系数 (范围 0.8 ~ 1.5)
  categoryConfigs: {
    '美妆个护': {
      category: '美妆个护',
      thresholdCoeff: 1.2,
      maxPickCapacity: 200,
    },
    '食品饮料': {
      category: '食品饮料',
      thresholdCoeff: 1.0,
      maxPickCapacity: 350,
    },
    '3C数码': {
      category: '3C数码',
      thresholdCoeff: 0.9,
      maxPickCapacity: 150,
    },
    '家居日化': {
      category: '家居日化',
      thresholdCoeff: 1.1,
      maxPickCapacity: 260,
    },
    '母婴玩具': {
      category: '母婴玩具',
      thresholdCoeff: 1.0,
      maxPickCapacity: 220,
    },
  },

  // 8. 同 SKU 同位绑定
  sameSkuRackBinding: {
    enabled: true,
    strictSameRackFirst: true,
    maxHorizontalDistanceRacks: 1,
  },

  // 9. 货架区 vs 地堆区分区规则
  zoneRoutingRules: {
    highBayRackEnabled: true,
    floorPalletZoneEnabled: true,
    pdaEnforceScanning: true,
  },
};

// 预置高位货架库位与绿色地堆托盘位
export const MOCK_WAREHOUSE_LOCATIONS: WarehouseLocation[] = [
  // 货架 A-01-01
  {
    locationCode: 'A-01-01-01',
    zone: 'A区 (高位货架区)',
    isFloorPallet: false,
    rackCode: 'A-01-01',
    level: 1,
    currentRoleTag: 'PICKING_LAYER',
    originalRoleTag: 'PICKING_LAYER',
    isTemporarySwitched: false,
    maxCapacity: 180,
    currentStock: 0,
    boundSkuCode: 'SKU-NEW-01',
    boundSkuName: '珀莱雅 2026早C晚A水乳套装(新品)',
    isAvailable: true,
  },
  {
    locationCode: 'A-01-01-02',
    zone: 'A区 (高位货架区)',
    isFloorPallet: false,
    rackCode: 'A-01-01',
    level: 2,
    currentRoleTag: 'RESERVE_LAYER',
    originalRoleTag: 'RESERVE_LAYER',
    isTemporarySwitched: false,
    maxCapacity: 300,
    currentStock: 0,
    boundSkuCode: 'SKU-NEW-01',
    boundSkuName: '珀莱雅 2026早C晚A水乳套装(新品)',
    isAvailable: true,
  },
  {
    locationCode: 'A-01-01-03',
    zone: 'A区 (高位货架区)',
    isFloorPallet: false,
    rackCode: 'A-01-01',
    level: 3,
    currentRoleTag: 'RESERVE_LAYER',
    originalRoleTag: 'RESERVE_LAYER',
    isTemporarySwitched: false,
    maxCapacity: 450,
    currentStock: 0,
    isAvailable: true,
  },

  // 货架 A-01-02 (爆品专架)
  {
    locationCode: 'A-01-02-01',
    zone: 'A区 (高位货架区)',
    isFloorPallet: false,
    rackCode: 'A-01-02',
    level: 1,
    currentRoleTag: 'PICKING_LAYER',
    originalRoleTag: 'PICKING_LAYER',
    isTemporarySwitched: false,
    maxCapacity: 300,
    currentStock: 180,
    boundSkuCode: 'SKU-HOT-02',
    boundSkuName: 'SK-II 护肤精华露 230ml (神仙水)',
    isAvailable: true,
  },
  {
    locationCode: 'A-01-02-02',
    zone: 'A区 (高位货架区)',
    isFloorPallet: false,
    rackCode: 'A-01-02',
    level: 2,
    currentRoleTag: 'TEMP_PICKING', // 演示：临时切换为拣货层！
    originalRoleTag: 'RESERVE_LAYER',
    isTemporarySwitched: true,
    switchReason: '大促期间备货量激增，2层临时转为辅助拣货位',
    maxCapacity: 400,
    currentStock: 120,
    boundSkuCode: 'SKU-HOT-02',
    boundSkuName: 'SK-II 护肤精华露 230ml (神仙水)',
    isAvailable: true,
  },
  {
    locationCode: 'A-01-02-03',
    zone: 'A区 (高位货架区)',
    isFloorPallet: false,
    rackCode: 'A-01-02',
    level: 3,
    currentRoleTag: 'RESERVE_LAYER',
    originalRoleTag: 'RESERVE_LAYER',
    isTemporarySwitched: false,
    maxCapacity: 600,
    currentStock: 300,
    isAvailable: true,
  },

  // 货架 A-01-03 (老品货架 - 拣货区缺货)
  {
    locationCode: 'A-01-03-01',
    zone: 'A区 (高位货架区)',
    isFloorPallet: false,
    rackCode: 'A-01-03',
    level: 1,
    currentRoleTag: 'PICKING_LAYER',
    originalRoleTag: 'PICKING_LAYER',
    isTemporarySwitched: false,
    maxCapacity: 260,
    currentStock: 12, // 存量12，均销36*1.1=39.6 => 缺货需上架1层
    boundSkuCode: 'SKU-REG-01',
    boundSkuName: '蓝月亮 亮白增艳薰衣草洗衣液 3kg',
    isAvailable: true,
  },
  {
    locationCode: 'A-01-03-02',
    zone: 'A区 (高位货架区)',
    isFloorPallet: false,
    rackCode: 'A-01-03',
    level: 2,
    currentRoleTag: 'RESERVE_LAYER',
    originalRoleTag: 'RESERVE_LAYER',
    isTemporarySwitched: false,
    maxCapacity: 350,
    currentStock: 150,
    boundSkuCode: 'SKU-REG-01',
    boundSkuName: '蓝月亮 亮白增艳薰衣草洗衣液 3kg',
    isAvailable: true,
  },
  {
    locationCode: 'A-01-03-03',
    zone: 'A区 (高位货架区)',
    isFloorPallet: false,
    rackCode: 'A-01-03',
    level: 3,
    currentRoleTag: 'RESERVE_LAYER',
    originalRoleTag: 'RESERVE_LAYER',
    isTemporarySwitched: false,
    maxCapacity: 500,
    currentStock: 200,
    isAvailable: true,
  },

  // 货架 A-01-04 (老品货架 - 拣货区库存充足)
  {
    locationCode: 'A-01-04-01',
    zone: 'A区 (高位货架区)',
    isFloorPallet: false,
    rackCode: 'A-01-04',
    level: 1,
    currentRoleTag: 'PICKING_LAYER',
    originalRoleTag: 'PICKING_LAYER',
    isTemporarySwitched: false,
    maxCapacity: 150,
    currentStock: 85, // 存量85 > 28*0.9=25.2 => 推荐上架同架二层备货位！
    boundSkuCode: 'SKU-REG-02',
    boundSkuName: '罗技 M330 无线静音鼠标 (商务黑)',
    isAvailable: false, // 拣货区已满/充足
  },
  {
    locationCode: 'A-01-04-02',
    zone: 'A区 (高位货架区)',
    isFloorPallet: false,
    rackCode: 'A-01-04',
    level: 2,
    currentRoleTag: 'RESERVE_LAYER',
    originalRoleTag: 'RESERVE_LAYER',
    isTemporarySwitched: false,
    maxCapacity: 300,
    currentStock: 60,
    boundSkuCode: 'SKU-REG-02',
    boundSkuName: '罗技 M330 无线静音鼠标 (商务黑)',
    isAvailable: true, // 推荐上此位
  },
  {
    locationCode: 'A-01-04-03',
    zone: 'A区 (高位货架区)',
    isFloorPallet: false,
    rackCode: 'A-01-04',
    level: 3,
    currentRoleTag: 'RESERVE_LAYER',
    originalRoleTag: 'RESERVE_LAYER',
    isTemporarySwitched: false,
    maxCapacity: 450,
    currentStock: 120,
    isAvailable: true,
  },

  // 货架 A-01-08 (高层/滞销品专区货架)
  {
    locationCode: 'A-01-08-01',
    zone: 'A区 (高位货架区)',
    isFloorPallet: false,
    rackCode: 'A-01-08',
    level: 1,
    currentRoleTag: 'PICKING_LAYER',
    originalRoleTag: 'PICKING_LAYER',
    isTemporarySwitched: false,
    maxCapacity: 120,
    currentStock: 2,
    boundSkuCode: 'SKU-SLOW-01',
    boundSkuName: '欧式复古雕花骨瓷咖啡杯套盒',
    isAvailable: false,
  },
  {
    locationCode: 'A-01-08-02',
    zone: 'A区 (高位货架区)',
    isFloorPallet: false,
    rackCode: 'A-01-08',
    level: 2,
    currentRoleTag: 'RESERVE_LAYER',
    originalRoleTag: 'RESERVE_LAYER',
    isTemporarySwitched: false,
    maxCapacity: 200,
    currentStock: 10,
    isAvailable: true,
  },
  {
    locationCode: 'A-01-08-03',
    zone: 'A区 (高位货架区)',
    isFloorPallet: false,
    rackCode: 'A-01-08',
    level: 3,
    currentRoleTag: 'SLOW_ZONE', // 高层滞销区标签
    originalRoleTag: 'SLOW_ZONE',
    isTemporarySwitched: false,
    maxCapacity: 400,
    currentStock: 35,
    boundSkuCode: 'SKU-SLOW-01',
    boundSkuName: '欧式复古雕花骨瓷咖啡杯套盒',
    isAvailable: true, // 推荐上架此位
  },

  // 绿色地堆托盘区 (Floor Pallet Zone: 整托、大件、爆品囤货)
  {
    locationCode: 'FP-A-01',
    zone: '绿色地堆托盘区 (A通道旁)',
    isFloorPallet: true,
    rackCode: 'FP-A',
    level: 0,
    currentRoleTag: 'FLOOR_PALLET',
    originalRoleTag: 'FLOOR_PALLET',
    isTemporarySwitched: false,
    maxCapacity: 800,
    currentStock: 0,
    boundSkuCode: 'SKU-HOT-01',
    boundSkuName: '农夫山泉 东方树叶无糖乌龙茶 500ml*15整箱',
    isAvailable: true, // 推荐整托囤货位
  },
  {
    locationCode: 'FP-A-02',
    zone: '绿色地堆托盘区 (A通道旁)',
    isFloorPallet: true,
    rackCode: 'FP-A',
    level: 0,
    currentRoleTag: 'FLOOR_PALLET',
    originalRoleTag: 'FLOOR_PALLET',
    isTemporarySwitched: false,
    maxCapacity: 800,
    currentStock: 640,
    boundSkuCode: 'SKU-HOT-02',
    boundSkuName: 'SK-II 护肤精华露 230ml (神仙水)',
    isAvailable: true,
  },
  {
    locationCode: 'FP-B-01',
    zone: '绿色地堆托盘区 (B通道旁)',
    isFloorPallet: true,
    rackCode: 'FP-B',
    level: 0,
    currentRoleTag: 'FLOOR_PALLET',
    originalRoleTag: 'FLOOR_PALLET',
    isTemporarySwitched: false,
    maxCapacity: 1000,
    currentStock: 0,
    isAvailable: true,
  },
  {
    locationCode: 'FP-B-02',
    zone: '绿色地堆托盘区 (B通道旁)',
    isFloorPallet: true,
    rackCode: 'FP-B',
    level: 0,
    currentRoleTag: 'FLOOR_PALLET',
    originalRoleTag: 'FLOOR_PALLET',
    isTemporarySwitched: false,
    maxCapacity: 1000,
    currentStock: 500,
    isAvailable: true,
  },
];

// 辅助函数：生成 30 天日常出库模拟数据
function generate30dHistory(
  baseAvg: number,
  activeDaysCount: number,
  promoDaysMap: Record<string, { qty: number; note: string }> = {}
) {
  const list: Array<{ date: string; quantity: number; isPromoSpike?: boolean; promoNote?: string }> = [];
  
  // 模拟从 2026-08-25 至 2026-09-23 共 30 天
  for (let i = 29; i >= 0; i--) {
    const d = new Date(2026, 8, 23); // 2026-09-23
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);

    if (promoDaysMap[dateStr]) {
      list.push({
        date: dateStr,
        quantity: promoDaysMap[dateStr].qty,
        isPromoSpike: true,
        promoNote: promoDaysMap[dateStr].note,
      });
      continue;
    }

    // 根据 activeDaysCount 决定是否有出库
    const shouldHaveSales = (i % Math.ceil(30 / Math.max(1, activeDaysCount))) === 0 || Math.random() < (activeDaysCount / 30);
    const qty = shouldHaveSales ? Math.max(1, Math.round(baseAvg * (0.8 + Math.random() * 0.4))) : 0;

    list.push({
      date: dateStr,
      quantity: qty,
    });
  }
  return list;
}

// 模拟待上架 SKU 选品池 (覆盖 新品、爆品、老品、滞销品)
export const MOCK_PUTAWAY_SKUS: PutawaySKUCandidate[] = [
  // 1. 【新品】无历史入库记录 -> 直决上架一层拣货区，不校验拣货区库存
  {
    id: 'SKU-CAND-01',
    skuCode: 'SKU-NEW-01',
    skuName: '珀莱雅 2026早C晚A水乳套装 (秋季修护升级版)',
    category: '美妆个护',
    specification: '水150ml+乳120ml 全新专柜首发',
    unit: '套',
    barcode: '6909876543210',
    inboundBatchNo: 'INB-20260924-001',
    inboundQty: 80,
    isFullPallet: false,
    hasHistoryInbound: false, // 无历史记录！命中新品
    activeDays30d: 0,
    total30dOutboundQty: 0,
    salesRankPercent: 1.0,
    currentPickLocation: 'A-01-01-01',
    currentPickStock: 0,
    boundRackCode: 'A-01-01',
    daily30dHistory: generate30dHistory(0, 0),
  },

  // 2. 【爆品 / A类】动销天数 28 天 >= 20天，出库 TOP 2% -> 直决：足量铺一层拣货位，相邻地堆整托囤货，不拆分高层备货
  {
    id: 'SKU-CAND-02',
    skuCode: 'SKU-HOT-01',
    skuName: '农夫山泉 东方树叶无糖乌龙茶 500ml*15整箱',
    category: '食品饮料',
    specification: '500ml*15瓶 原箱包装',
    unit: '箱',
    barcode: '6901234000001',
    inboundBatchNo: 'INB-20260924-002',
    inboundQty: 240, // 4个托盘整托
    isFullPallet: true, // 整托大件
    hasHistoryInbound: true,
    firstInboundDate: '2025-06-10',
    activeDays30d: 28, // 动销天数 28 天 (>=20)
    total30dOutboundQty: 3200,
    salesRankPercent: 0.02, // TOP 2% A类爆品
    currentPickLocation: 'A-01-02-01',
    currentPickStock: 160,
    boundRackCode: 'A-01-02',
    daily30dHistory: generate30dHistory(100, 28, {
      '2026-09-09': { qty: 480, note: '99大促爆单 (4.8倍)' },
      '2026-09-22': { qty: 620, note: '超品日整箱秒杀 (6.2倍)' },
    }),
  },

  // 3. 【爆品 / A类】动销天数 25 天 >= 20天，出库 TOP 5%
  {
    id: 'SKU-CAND-03',
    skuCode: 'SKU-HOT-02',
    skuName: 'SK-II 护肤精华露 230ml (神仙水)',
    category: '美妆个护',
    specification: '230ml/瓶 专柜正品',
    unit: '瓶',
    barcode: '6901234567891',
    inboundBatchNo: 'INB-20260924-003',
    inboundQty: 100,
    isFullPallet: false,
    hasHistoryInbound: true,
    firstInboundDate: '2024-03-15',
    activeDays30d: 25, // >= 20天
    total30dOutboundQty: 1250,
    salesRankPercent: 0.05, // TOP 5% A类爆品
    currentPickLocation: 'A-01-02-01',
    currentPickStock: 25,
    boundRackCode: 'A-01-02',
    daily30dHistory: generate30dHistory(40, 25, {
      '2026-09-09': { qty: 210, note: '99大促满减 (5.2倍)' },
      '2026-09-22': { qty: 280, note: '超品日限时秒杀 (7.0倍)' },
    }),
  },

  // 4. 【老品 - 拣货区缺货】动销天数 16 天，非新品/爆品/滞销品。一层库存 12 < 30天均销 36 * 1.1 = 39.6 -> 推荐一层拣货位
  {
    id: 'SKU-CAND-04',
    skuCode: 'SKU-REG-01',
    skuName: '蓝月亮 亮白增艳薰衣草洗衣液 3kg',
    category: '家居日化',
    specification: '3kg/瓶 大容量家庭装',
    unit: '瓶',
    barcode: '6903333333333',
    inboundBatchNo: 'INB-20260924-004',
    inboundQty: 60,
    isFullPallet: false,
    hasHistoryInbound: true,
    firstInboundDate: '2024-11-20',
    activeDays30d: 16, // 常规老品
    total30dOutboundQty: 1080,
    salesRankPercent: 0.35, // 排名 35%
    currentPickLocation: 'A-01-03-01',
    currentPickStock: 12, // 当前可用库存 12 瓶（低于阈值 39.6）
    boundRackCode: 'A-01-03',
    daily30dHistory: generate30dHistory(36, 16, {
      '2026-09-09': { qty: 150, note: '99大促囤货日' },
    }),
  },

  // 5. 【老品 - 拣货区库存充足】动销天数 14 天。一层库存 85 > 30天均销 28 * 0.9 = 25.2 -> 推荐同架二层备货位 A-01-04-02
  {
    id: 'SKU-CAND-05',
    skuCode: 'SKU-REG-02',
    skuName: '罗技 M330 无线静音鼠标 (商务黑)',
    category: '3C数码',
    specification: 'USB无线接收器 节能降噪',
    unit: '只',
    barcode: '6905555555555',
    inboundBatchNo: 'INB-20260924-005',
    inboundQty: 50,
    isFullPallet: false,
    hasHistoryInbound: true,
    firstInboundDate: '2025-01-10',
    activeDays30d: 14, // 常规老品
    total30dOutboundQty: 840,
    salesRankPercent: 0.42,
    currentPickLocation: 'A-01-04-01',
    currentPickStock: 85, // 当前库存充足！(> 25.2)
    boundRackCode: 'A-01-04',
    daily30dHistory: generate30dHistory(28, 14, {
      '2026-09-09': { qty: 110, note: '开学季大促' },
    }),
  },

  // 6. 【滞销品 / C类】动销天数 2 天 (<5天)，出库量后 4% -> 直决：直接上架高层/滞销区 A-01-08-03，不占一层黄金位
  {
    id: 'SKU-CAND-06',
    skuCode: 'SKU-SLOW-01',
    skuName: '欧式复古雕花骨瓷咖啡杯 6件套礼盒',
    category: '家居日化',
    specification: '高白骨瓷 礼盒包装 易碎品',
    unit: '套',
    barcode: '6907777777777',
    inboundBatchNo: 'INB-20260924-006',
    inboundQty: 20,
    isFullPallet: false,
    hasHistoryInbound: true,
    firstInboundDate: '2025-03-01',
    activeDays30d: 2, // 近30天仅2天有出库 (<5天)！
    total30dOutboundQty: 18,
    salesRankPercent: 0.96, // 倒数 4% (后20%)
    currentPickLocation: 'A-01-08-01',
    currentPickStock: 2,
    boundRackCode: 'A-01-08',
    daily30dHistory: generate30dHistory(1, 2),
  },

  // 7. 【滞销品 / C类】动销天数 3 天 (<5天)，出库量后 10%
  {
    id: 'SKU-CAND-07',
    skuCode: 'SKU-SLOW-02',
    skuName: '2025款限量版定制商务保温杯 500ml',
    category: '家居日化',
    specification: '316医用级不锈钢 过季清仓',
    unit: '个',
    barcode: '6908888888888',
    inboundBatchNo: 'INB-20260924-007',
    inboundQty: 30,
    isFullPallet: false,
    hasHistoryInbound: true,
    firstInboundDate: '2024-12-01',
    activeDays30d: 3, // < 5天
    total30dOutboundQty: 24,
    salesRankPercent: 0.90, // 后 10%
    currentPickLocation: 'A-01-08-01',
    currentPickStock: 1,
    boundRackCode: 'A-01-08',
    daily30dHistory: generate30dHistory(1, 3),
  },
];
