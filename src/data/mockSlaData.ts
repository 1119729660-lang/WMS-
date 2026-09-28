import {
  SlaSystemConfig,
  SlaOrderRecord,
  SlaTrendPoint,
  SlaWarehouseMetric,
  SlaNodeId,
} from '../types/sla';

// 默认 4 个履约节点与系统配置
export const DEFAULT_SLA_CONFIG: SlaSystemConfig = {
  calculationMode: 'arithmetic_mean', // 默认：4 节点算术平均值
  targetPassRate: 95.0, // 默认 95% (≥95% 绿色，<95% 红色)
  lastUpdated: '2026-09-23 14:30:00',
  nodes: {
    inbound_register: {
      id: 'inbound_register',
      name: '入库注册',
      category: 'inbound',
      startPointDescription: 'ozon 下发入库单时间',
      endPointDescription: '待确认订单状态变更确认时间',
      defaultThresholdMinutes: 60, // 1h
      currentThresholdMinutes: 60,
      thresholdDisplay: '1小时 (60m)',
      description: '从电商平台 ozon 下发入库单至待确认订单状态变更确认并进入排程',
    },
    outbound_register: {
      id: 'outbound_register',
      name: '出库注册',
      category: 'outbound',
      startPointDescription: '订单下单状态由否变是',
      endPointDescription: '全部订单添加时间',
      defaultThresholdMinutes: 10, // 10min
      currentThresholdMinutes: 10,
      thresholdDisplay: '10分钟',
      description: '订单支付并由未下单状态置为下单状态，到全部订单添加建单完成',
    },
    inbound_putaway: {
      id: 'inbound_putaway',
      name: '入库上架',
      category: 'inbound',
      startPointDescription: '签收 80 节点时间',
      endPointDescription: '上架 90 节点时间',
      defaultThresholdMinutes: 1440, // 24h
      currentThresholdMinutes: 1440,
      thresholdDisplay: '24小时',
      description: '自货运现场签收 80 节点扫描至商品完成入库质检验收并执行 90 节点上架',
    },
    outbound_prepare: {
      id: 'outbound_prepare',
      name: '出库准备',
      category: 'outbound',
      startPointDescription: '订单添加生成节点时间',
      endPointDescription: '华磊收货 106 节点时间',
      defaultThresholdMinutes: 1440, // 24h
      currentThresholdMinutes: 1440,
      thresholdDisplay: '24小时',
      description: '自订单波次生成出库节点起，至仓内拣选、复核打包交接至华磊收货 106 节点',
    },
  },
};

export const MOCK_SLA_WAREHOUSES = [
  { id: 'WH-01', code: 'WH-01', name: '华东一号智能供应链中心 (主干仓)' },
  { id: 'WH-02', code: 'WH-02', name: '华南二号区域分拨中心' },
  { id: 'WH-03', code: 'WH-03', name: '华北自贸保税立体仓' },
  { id: 'WH-04', code: 'WH-04', name: '东北边贸口岸集散仓' },
];

// 生成一批模拟订单数据 (涵盖入库与出库单，各订单包含 4 节点完整执行轨迹)
export const RAW_SLA_ORDERS: SlaOrderRecord[] = [
  {
    orderId: 'ORD-20260923-8801',
    orderType: 'OUTBOUND',
    warehouseId: 'WH-01',
    warehouseName: '华东一号智能供应链中心',
    skuCount: 4,
    totalPieces: 120,
    createdAt: '2026-09-23 08:30:00',
    completedAt: '2026-09-23 18:20:00',
    isDelayed: false,
    delayedNodeCount: 0,
    nodeExecutions: [
      {
        nodeId: 'inbound_register',
        nodeName: '入库注册',
        startTime: '2026-09-22 09:00:00',
        endTime: '2026-09-22 09:42:00',
        durationMinutes: 42,
        thresholdMinutes: 60,
        isOnTime: true,
        overdueMinutes: 0,
      },
      {
        nodeId: 'outbound_register',
        nodeName: '出库注册',
        startTime: '2026-09-23 08:30:00',
        endTime: '2026-09-23 08:37:00',
        durationMinutes: 7,
        thresholdMinutes: 10,
        isOnTime: true,
        overdueMinutes: 0,
      },
      {
        nodeId: 'inbound_putaway',
        nodeName: '入库上架',
        startTime: '2026-09-22 10:00:00',
        endTime: '2026-09-23 07:30:00',
        durationMinutes: 1290,
        thresholdMinutes: 1440,
        isOnTime: true,
        overdueMinutes: 0,
      },
      {
        nodeId: 'outbound_prepare',
        nodeName: '出库准备',
        startTime: '2026-09-23 08:37:00',
        endTime: '2026-09-23 18:20:00',
        durationMinutes: 583,
        thresholdMinutes: 1440,
        isOnTime: true,
        overdueMinutes: 0,
      },
    ],
  },
  {
    orderId: 'ORD-20260923-8802',
    orderType: 'OUTBOUND',
    warehouseId: 'WH-01',
    warehouseName: '华东一号智能供应链中心',
    skuCount: 2,
    totalPieces: 45,
    createdAt: '2026-09-23 09:15:00',
    completedAt: '2026-09-23 21:10:00',
    isDelayed: true,
    delayedNodeCount: 1,
    nodeExecutions: [
      {
        nodeId: 'inbound_register',
        nodeName: '入库注册',
        startTime: '2026-09-22 10:00:00',
        endTime: '2026-09-22 10:35:00',
        durationMinutes: 35,
        thresholdMinutes: 60,
        isOnTime: true,
        overdueMinutes: 0,
      },
      {
        nodeId: 'outbound_register',
        nodeName: '出库注册',
        startTime: '2026-09-23 09:15:00',
        endTime: '2026-09-23 09:32:00',
        durationMinutes: 17, // 超时 7min
        thresholdMinutes: 10,
        isOnTime: false,
        overdueMinutes: 7,
      },
      {
        nodeId: 'inbound_putaway',
        nodeName: '入库上架',
        startTime: '2026-09-22 11:00:00',
        endTime: '2026-09-23 08:00:00',
        durationMinutes: 1260,
        thresholdMinutes: 1440,
        isOnTime: true,
        overdueMinutes: 0,
      },
      {
        nodeId: 'outbound_prepare',
        nodeName: '出库准备',
        startTime: '2026-09-23 09:32:00',
        endTime: '2026-09-23 21:10:00',
        durationMinutes: 698,
        thresholdMinutes: 1440,
        isOnTime: true,
        overdueMinutes: 0,
      },
    ],
  },
  {
    orderId: 'ORD-20260923-8803',
    orderType: 'INBOUND',
    warehouseId: 'WH-01',
    warehouseName: '华东一号智能供应链中心',
    skuCount: 8,
    totalPieces: 320,
    createdAt: '2026-09-23 07:00:00',
    completedAt: '2026-09-23 19:40:00',
    isDelayed: false,
    delayedNodeCount: 0,
    nodeExecutions: [
      {
        nodeId: 'inbound_register',
        nodeName: '入库注册',
        startTime: '2026-09-23 07:00:00',
        endTime: '2026-09-23 07:48:00',
        durationMinutes: 48,
        thresholdMinutes: 60,
        isOnTime: true,
        overdueMinutes: 0,
      },
      {
        nodeId: 'outbound_register',
        nodeName: '出库注册',
        startTime: '2026-09-23 08:00:00',
        endTime: '2026-09-23 08:06:00',
        durationMinutes: 6,
        thresholdMinutes: 10,
        isOnTime: true,
        overdueMinutes: 0,
      },
      {
        nodeId: 'inbound_putaway',
        nodeName: '入库上架',
        startTime: '2026-09-23 08:00:00',
        endTime: '2026-09-23 18:00:00',
        durationMinutes: 600,
        thresholdMinutes: 1440,
        isOnTime: true,
        overdueMinutes: 0,
      },
      {
        nodeId: 'outbound_prepare',
        nodeName: '出库准备',
        startTime: '2026-09-23 08:06:00',
        endTime: '2026-09-23 19:40:00',
        durationMinutes: 694,
        thresholdMinutes: 1440,
        isOnTime: true,
        overdueMinutes: 0,
      },
    ],
  },
  {
    orderId: 'ORD-20260923-8804',
    orderType: 'INBOUND',
    warehouseId: 'WH-02',
    warehouseName: '华南二号区域分拨中心',
    skuCount: 5,
    totalPieces: 180,
    createdAt: '2026-09-23 06:30:00',
    completedAt: '2026-09-23 22:15:00',
    isDelayed: true,
    delayedNodeCount: 2,
    nodeExecutions: [
      {
        nodeId: 'inbound_register',
        nodeName: '入库注册',
        startTime: '2026-09-23 06:30:00',
        endTime: '2026-09-23 07:50:00',
        durationMinutes: 80, // 超时 20min
        thresholdMinutes: 60,
        isOnTime: false,
        overdueMinutes: 20,
      },
      {
        nodeId: 'outbound_register',
        nodeName: '出库注册',
        startTime: '2026-09-23 08:00:00',
        endTime: '2026-09-23 08:08:00',
        durationMinutes: 8,
        thresholdMinutes: 10,
        isOnTime: true,
        overdueMinutes: 0,
      },
      {
        nodeId: 'inbound_putaway',
        nodeName: '入库上架',
        startTime: '2026-09-22 18:00:00',
        endTime: '2026-09-23 21:00:00',
        durationMinutes: 1620, // 超时 180min (27h)
        thresholdMinutes: 1440,
        isOnTime: false,
        overdueMinutes: 180,
      },
      {
        nodeId: 'outbound_prepare',
        nodeName: '出库准备',
        startTime: '2026-09-23 08:08:00',
        endTime: '2026-09-23 22:15:00',
        durationMinutes: 847,
        thresholdMinutes: 1440,
        isOnTime: true,
        overdueMinutes: 0,
      },
    ],
  },
  {
    orderId: 'ORD-20260923-8805',
    orderType: 'OUTBOUND',
    warehouseId: 'WH-02',
    warehouseName: '华南二号区域分拨中心',
    skuCount: 3,
    totalPieces: 60,
    createdAt: '2026-09-23 10:00:00',
    completedAt: '2026-09-23 20:30:00',
    isDelayed: false,
    delayedNodeCount: 0,
    nodeExecutions: [
      {
        nodeId: 'inbound_register',
        nodeName: '入库注册',
        startTime: '2026-09-22 14:00:00',
        endTime: '2026-09-22 14:38:00',
        durationMinutes: 38,
        thresholdMinutes: 60,
        isOnTime: true,
        overdueMinutes: 0,
      },
      {
        nodeId: 'outbound_register',
        nodeName: '出库注册',
        startTime: '2026-09-23 10:00:00',
        endTime: '2026-09-23 10:07:00',
        durationMinutes: 7,
        thresholdMinutes: 10,
        isOnTime: true,
        overdueMinutes: 0,
      },
      {
        nodeId: 'inbound_putaway',
        nodeName: '入库上架',
        startTime: '2026-09-22 15:00:00',
        endTime: '2026-09-23 09:00:00',
        durationMinutes: 1080,
        thresholdMinutes: 1440,
        isOnTime: true,
        overdueMinutes: 0,
      },
      {
        nodeId: 'outbound_prepare',
        nodeName: '出库准备',
        startTime: '2026-09-23 10:07:00',
        endTime: '2026-09-23 20:30:00',
        durationMinutes: 623,
        thresholdMinutes: 1440,
        isOnTime: true,
        overdueMinutes: 0,
      },
    ],
  },
  {
    orderId: 'ORD-20260923-8806',
    orderType: 'OUTBOUND',
    warehouseId: 'WH-03',
    warehouseName: '华北自贸保税立体仓',
    skuCount: 1,
    totalPieces: 10,
    createdAt: '2026-09-23 11:20:00',
    completedAt: '2026-09-23 19:10:00',
    isDelayed: false,
    delayedNodeCount: 0,
    nodeExecutions: [
      {
        nodeId: 'inbound_register',
        nodeName: '入库注册',
        startTime: '2026-09-22 16:00:00',
        endTime: '2026-09-22 16:45:00',
        durationMinutes: 45,
        thresholdMinutes: 60,
        isOnTime: true,
        overdueMinutes: 0,
      },
      {
        nodeId: 'outbound_register',
        nodeName: '出库注册',
        startTime: '2026-09-23 11:20:00',
        endTime: '2026-09-23 11:25:00',
        durationMinutes: 5,
        thresholdMinutes: 10,
        isOnTime: true,
        overdueMinutes: 0,
      },
      {
        nodeId: 'inbound_putaway',
        nodeName: '入库上架',
        startTime: '2026-09-22 17:00:00',
        endTime: '2026-09-23 10:00:00',
        durationMinutes: 1020,
        thresholdMinutes: 1440,
        isOnTime: true,
        overdueMinutes: 0,
      },
      {
        nodeId: 'outbound_prepare',
        nodeName: '出库准备',
        startTime: '2026-09-23 11:25:00',
        endTime: '2026-09-23 19:10:00',
        durationMinutes: 465,
        thresholdMinutes: 1440,
        isOnTime: true,
        overdueMinutes: 0,
      },
    ],
  },
  {
    orderId: 'ORD-20260923-8807',
    orderType: 'OUTBOUND',
    warehouseId: 'WH-03',
    warehouseName: '华北自贸保税立体仓',
    skuCount: 6,
    totalPieces: 150,
    createdAt: '2026-09-23 08:10:00',
    completedAt: '2026-09-24 10:45:00',
    isDelayed: true,
    delayedNodeCount: 1,
    nodeExecutions: [
      {
        nodeId: 'inbound_register',
        nodeName: '入库注册',
        startTime: '2026-09-22 13:00:00',
        endTime: '2026-09-22 13:40:00',
        durationMinutes: 40,
        thresholdMinutes: 60,
        isOnTime: true,
        overdueMinutes: 0,
      },
      {
        nodeId: 'outbound_register',
        nodeName: '出库注册',
        startTime: '2026-09-23 08:10:00',
        endTime: '2026-09-23 08:18:00',
        durationMinutes: 8,
        thresholdMinutes: 10,
        isOnTime: true,
        overdueMinutes: 0,
      },
      {
        nodeId: 'inbound_putaway',
        nodeName: '入库上架',
        startTime: '2026-09-22 14:00:00',
        endTime: '2026-09-23 08:00:00',
        durationMinutes: 1080,
        thresholdMinutes: 1440,
        isOnTime: true,
        overdueMinutes: 0,
      },
      {
        nodeId: 'outbound_prepare',
        nodeName: '出库准备',
        startTime: '2026-09-23 08:18:00',
        endTime: '2026-09-24 10:45:00',
        durationMinutes: 1587, // 超时 147min (26.4h)
        thresholdMinutes: 1440,
        isOnTime: false,
        overdueMinutes: 147,
      },
    ],
  },
  {
    orderId: 'ORD-20260923-8808',
    orderType: 'INBOUND',
    warehouseId: 'WH-04',
    warehouseName: '东北边贸口岸集散仓',
    skuCount: 12,
    totalPieces: 500,
    createdAt: '2026-09-23 07:40:00',
    completedAt: '2026-09-23 21:00:00',
    isDelayed: false,
    delayedNodeCount: 0,
    nodeExecutions: [
      {
        nodeId: 'inbound_register',
        nodeName: '入库注册',
        startTime: '2026-09-23 07:40:00',
        endTime: '2026-09-23 08:25:00',
        durationMinutes: 45,
        thresholdMinutes: 60,
        isOnTime: true,
        overdueMinutes: 0,
      },
      {
        nodeId: 'outbound_register',
        nodeName: '出库注册',
        startTime: '2026-09-23 09:00:00',
        endTime: '2026-09-23 09:09:00',
        durationMinutes: 9,
        thresholdMinutes: 10,
        isOnTime: true,
        overdueMinutes: 0,
      },
      {
        nodeId: 'inbound_putaway',
        nodeName: '入库上架',
        startTime: '2026-09-23 08:30:00',
        endTime: '2026-09-23 19:30:00',
        durationMinutes: 660,
        thresholdMinutes: 1440,
        isOnTime: true,
        overdueMinutes: 0,
      },
      {
        nodeId: 'outbound_prepare',
        nodeName: '出库准备',
        startTime: '2026-09-23 09:09:00',
        endTime: '2026-09-23 21:00:00',
        durationMinutes: 711,
        thresholdMinutes: 1440,
        isOnTime: true,
        overdueMinutes: 0,
      },
    ],
  },
  {
    orderId: 'ORD-20260923-8809',
    orderType: 'OUTBOUND',
    warehouseId: 'WH-04',
    warehouseName: '东北边贸口岸集散仓',
    skuCount: 4,
    totalPieces: 90,
    createdAt: '2026-09-23 13:00:00',
    completedAt: '2026-09-23 23:50:00',
    isDelayed: false,
    delayedNodeCount: 0,
    nodeExecutions: [
      {
        nodeId: 'inbound_register',
        nodeName: '入库注册',
        startTime: '2026-09-22 17:00:00',
        endTime: '2026-09-22 17:52:00',
        durationMinutes: 52,
        thresholdMinutes: 60,
        isOnTime: true,
        overdueMinutes: 0,
      },
      {
        nodeId: 'outbound_register',
        nodeName: '出库注册',
        startTime: '2026-09-23 13:00:00',
        endTime: '2026-09-23 13:08:00',
        durationMinutes: 8,
        thresholdMinutes: 10,
        isOnTime: true,
        overdueMinutes: 0,
      },
      {
        nodeId: 'inbound_putaway',
        nodeName: '入库上架',
        startTime: '2026-09-22 18:00:00',
        endTime: '2026-09-23 11:00:00',
        durationMinutes: 1020,
        thresholdMinutes: 1440,
        isOnTime: true,
        overdueMinutes: 0,
      },
      {
        nodeId: 'outbound_prepare',
        nodeName: '出库准备',
        startTime: '2026-09-23 13:08:00',
        endTime: '2026-09-23 23:50:00',
        durationMinutes: 642,
        thresholdMinutes: 1440,
        isOnTime: true,
        overdueMinutes: 0,
      },
    ],
  },
  {
    orderId: 'ORD-20260923-8810',
    orderType: 'OUTBOUND',
    warehouseId: 'WH-02',
    warehouseName: '华南二号区域分拨中心',
    skuCount: 2,
    totalPieces: 30,
    createdAt: '2026-09-23 14:10:00',
    completedAt: '2026-09-24 02:20:00',
    isDelayed: false,
    delayedNodeCount: 0,
    nodeExecutions: [
      {
        nodeId: 'inbound_register',
        nodeName: '入库注册',
        startTime: '2026-09-22 18:00:00',
        endTime: '2026-09-22 18:49:00',
        durationMinutes: 49,
        thresholdMinutes: 60,
        isOnTime: true,
        overdueMinutes: 0,
      },
      {
        nodeId: 'outbound_register',
        nodeName: '出库注册',
        startTime: '2026-09-23 14:10:00',
        endTime: '2026-09-23 14:16:00',
        durationMinutes: 6,
        thresholdMinutes: 10,
        isOnTime: true,
        overdueMinutes: 0,
      },
      {
        nodeId: 'inbound_putaway',
        nodeName: '入库上架',
        startTime: '2026-09-22 19:00:00',
        endTime: '2026-09-23 12:00:00',
        durationMinutes: 1020,
        thresholdMinutes: 1440,
        isOnTime: true,
        overdueMinutes: 0,
      },
      {
        nodeId: 'outbound_prepare',
        nodeName: '出库准备',
        startTime: '2026-09-23 14:16:00',
        endTime: '2026-09-24 02:20:00',
        durationMinutes: 724,
        thresholdMinutes: 1440,
        isOnTime: true,
        overdueMinutes: 0,
      },
    ],
  },
];

// 动态根据系统配置重新评估各订单的单节点是否按时、整单是否延迟
export function evaluateOrdersWithConfig(
  orders: SlaOrderRecord[],
  config: SlaSystemConfig
): SlaOrderRecord[] {
  return orders.map((order) => {
    let delayedCount = 0;
    const evaluatedExecutions = order.nodeExecutions.map((node) => {
      const nodeConfig = config.nodes[node.nodeId];
      const threshold = nodeConfig ? nodeConfig.currentThresholdMinutes : node.thresholdMinutes;
      const isOnTime = node.durationMinutes <= threshold;
      const overdueMinutes = isOnTime ? 0 : node.durationMinutes - threshold;
      if (!isOnTime) {
        delayedCount++;
      }
      return {
        ...node,
        thresholdMinutes: threshold,
        isOnTime,
        overdueMinutes,
      };
    });

    return {
      ...order,
      isDelayed: delayedCount > 0,
      delayedNodeCount: delayedCount,
      nodeExecutions: evaluatedExecutions,
    };
  });
}

// 仓库指标统计计算引擎 (按仓库编码排序，支持 4 节点算术平均值 / 订单量加权平均值)
export function calculateWarehouseSlaMetrics(
  orders: SlaOrderRecord[],
  config: SlaSystemConfig
): SlaWarehouseMetric[] {
  const evaluatedOrders = evaluateOrdersWithConfig(orders, config);

  // 仓库底表
  const warehouseMap = new Map<string, { code: string; name: string; orders: SlaOrderRecord[] }>();
  MOCK_SLA_WAREHOUSES.forEach((w) => {
    warehouseMap.set(w.id, { code: w.code, name: w.name, orders: [] });
  });

  evaluatedOrders.forEach((o) => {
    if (!warehouseMap.has(o.warehouseId)) {
      warehouseMap.set(o.warehouseId, {
        code: o.warehouseId,
        name: o.warehouseName,
        orders: [],
      });
    }
    warehouseMap.get(o.warehouseId)!.orders.push(o);
  });

  const nodeIds: SlaNodeId[] = [
    'inbound_register',
    'outbound_register',
    'inbound_putaway',
    'outbound_prepare',
  ];

  const results: SlaWarehouseMetric[] = [];

  warehouseMap.forEach((val, whId) => {
    const whOrders = val.orders;
    const totalOrders = whOrders.length;
    const delayedOrdersCount = whOrders.filter((o) => o.isDelayed).length;
    const onTimeOrdersCount = totalOrders - delayedOrdersCount;

    const nodeMetrics: Record<
      SlaNodeId,
      {
        totalOrders: number;
        onTimeCount: number;
        delayedCount: number;
        passRate: number;
        avgDurationMinutes: number;
      }
    > = {} as any;

    let nodeRatesSum = 0;
    let totalNodeOrdersSum = 0;
    let totalNodeOnTimeSum = 0;

    nodeIds.forEach((nId) => {
      const allExecs = whOrders
        .map((o) => o.nodeExecutions.find((ne) => ne.nodeId === nId))
        .filter(Boolean);

      const nTotal = allExecs.length || 1;
      const nOnTime = allExecs.filter((e) => e!.isOnTime).length;
      const nDelayed = nTotal - nOnTime;
      const passRate = +((nOnTime / nTotal) * 100).toFixed(1);
      const totalDur = allExecs.reduce((acc, cur) => acc + cur!.durationMinutes, 0);
      const avgDuration = Math.round(totalDur / nTotal);

      nodeMetrics[nId] = {
        totalOrders: nTotal,
        onTimeCount: nOnTime,
        delayedCount: nDelayed,
        passRate,
        avgDurationMinutes: avgDuration,
      };

      nodeRatesSum += passRate;
      totalNodeOrdersSum += nTotal;
      totalNodeOnTimeSum += nOnTime;
    });

    // 1. 4 节点算术平均值 (保留 1 位小数)
    const arithmeticPassRate = +(nodeRatesSum / 4).toFixed(1);

    // 2. 订单量加权平均值 (保留 1 位小数)
    const weightedPassRate =
      totalNodeOrdersSum > 0
        ? +((totalNodeOnTimeSum / totalNodeOrdersSum) * 100).toFixed(1)
        : 100.0;

    // 根据系统配置模式决定最终展示的综合达标率
    const compositePassRate =
      config.calculationMode === 'arithmetic_mean'
        ? arithmeticPassRate
        : weightedPassRate;

    results.push({
      warehouseId: whId,
      warehouseCode: val.code,
      warehouseName: val.name,
      totalOrders,
      delayedOrdersCount,
      onTimeOrdersCount,
      nodeMetrics,
      arithmeticPassRate,
      weightedPassRate,
      compositePassRate,
      monitoredNodeCount: 4, // 固定 = 4
    });
  });

  // 按仓库编码升序排序 (默认第一个被选中)
  results.sort((a, b) => a.warehouseCode.localeCompare(b.warehouseCode));
  return results;
}

// 模拟趋势走势数据 (日、周、月三种时间粒度)
export function generateSlaTrendData(timeDimension: 'day' | 'week' | 'month'): SlaTrendPoint[] {
  if (timeDimension === 'day') {
    // 过去 7 天
    const days = [
      { dateStr: '2026-09-17', periodLabel: '09-17', overall: 96.2, inReg: 97.5, outReg: 98.1, inPut: 94.0, outPrep: 95.2, total: 1420, delayed: 54 },
      { dateStr: '2026-09-18', periodLabel: '09-18', overall: 95.8, inReg: 96.8, outReg: 97.4, inPut: 93.8, outPrep: 95.0, total: 1530, delayed: 64 },
      { dateStr: '2026-09-19', periodLabel: '09-19', overall: 94.1, inReg: 95.2, outReg: 96.0, inPut: 91.5, outPrep: 93.8, total: 1680, delayed: 99 },
      { dateStr: '2026-09-20', periodLabel: '09-20', overall: 94.9, inReg: 96.0, outReg: 96.5, inPut: 92.8, outPrep: 94.2, total: 1610, delayed: 82 },
      { dateStr: '2026-09-21', periodLabel: '09-21', overall: 96.5, inReg: 98.0, outReg: 98.2, inPut: 94.5, outPrep: 95.4, total: 1490, delayed: 52 },
      { dateStr: '2026-09-22', periodLabel: '09-22', overall: 97.1, inReg: 98.4, outReg: 98.8, inPut: 95.2, outPrep: 96.0, total: 1550, delayed: 45 },
      { dateStr: '2026-09-23', periodLabel: '09-23 (今日)', periodLabelShort: '09-23', overall: 96.8, inReg: 98.2, outReg: 98.5, inPut: 94.8, outPrep: 95.8, total: 1620, delayed: 51 },
    ];
    return days.map((d) => ({
      periodLabel: d.periodLabel,
      dateStr: d.dateStr,
      overallRate: d.overall,
      nodeRates: {
        inbound_register: d.inReg,
        outbound_register: d.outReg,
        inbound_putaway: d.inPut,
        outbound_prepare: d.outPrep,
      },
      totalOrders: d.total,
      delayedOrders: d.delayed,
    }));
  } else if (timeDimension === 'week') {
    // 过去 6 周 (展示格式：2026 年第 XX 周)
    const weeks = [
      { weekNum: '第34周', periodLabel: '2026 年第 34 周', overall: 93.8, inReg: 95.0, outReg: 96.2, inPut: 91.0, outPrep: 93.0, total: 9400, delayed: 580 },
      { weekNum: '第35周', periodLabel: '2026 年第 35 周', overall: 94.5, inReg: 95.8, outReg: 96.8, inPut: 92.4, outPrep: 93.2, total: 9800, delayed: 540 },
      { weekNum: '第36周', periodLabel: '2026 年第 36 周', overall: 95.4, inReg: 96.5, outReg: 97.4, inPut: 93.5, outPrep: 94.2, total: 10200, delayed: 470 },
      { weekNum: '第37周', periodLabel: '2026 年第 37 周', overall: 96.2, inReg: 97.2, outReg: 98.0, inPut: 94.6, outPrep: 95.0, total: 10600, delayed: 400 },
      { weekNum: '第38周', periodLabel: '2026 年第 38 周', overall: 95.9, inReg: 96.9, outReg: 97.8, inPut: 94.1, outPrep: 94.8, total: 10900, delayed: 450 },
      { weekNum: '第39周', periodLabel: '2026 年第 39 周 (本周)', overall: 96.8, inReg: 98.2, outReg: 98.5, inPut: 94.8, outPrep: 95.8, total: 5400, delayed: 172 },
    ];
    return weeks.map((w) => ({
      periodLabel: w.periodLabel,
      dateStr: w.weekNum,
      overallRate: w.overall,
      nodeRates: {
        inbound_register: w.inReg,
        outbound_register: w.outReg,
        inbound_putaway: w.inPut,
        outbound_prepare: w.outPrep,
      },
      totalOrders: w.total,
      delayedOrders: w.delayed,
    }));
  } else {
    // 过去 6 个月 (YYYY-MM)
    const months = [
      { dateStr: '2026-04', periodLabel: '2026-04', overall: 93.2, inReg: 94.5, outReg: 95.6, inPut: 90.5, outPrep: 92.2, total: 38000, delayed: 2580 },
      { dateStr: '2026-05', periodLabel: '2026-05', overall: 94.0, inReg: 95.2, outReg: 96.4, inPut: 91.8, outPrep: 92.6, total: 41000, delayed: 2460 },
      { dateStr: '2026-06', periodLabel: '2026-06', overall: 94.8, inReg: 96.0, outReg: 97.0, inPut: 92.8, outPrep: 93.4, total: 43500, delayed: 2260 },
      { dateStr: '2026-07', periodLabel: '2026-07', overall: 95.6, inReg: 96.8, outReg: 97.6, inPut: 93.8, outPrep: 94.2, total: 42000, delayed: 1850 },
      { dateStr: '2026-08', periodLabel: '2026-08', overall: 96.4, inReg: 97.5, outReg: 98.2, inPut: 94.6, outPrep: 95.3, total: 44800, delayed: 1610 },
      { dateStr: '2026-09', periodLabel: '2026-09 (当月)', overall: 96.8, inReg: 98.2, outReg: 98.5, inPut: 94.8, outPrep: 95.8, total: 33400, delayed: 1070 },
    ];
    return months.map((m) => ({
      periodLabel: m.periodLabel,
      dateStr: m.dateStr,
      overallRate: m.overall,
      nodeRates: {
        inbound_register: m.inReg,
        outbound_register: m.outReg,
        inbound_putaway: m.inPut,
        outbound_prepare: m.outPrep,
      },
      totalOrders: m.total,
      delayedOrders: m.delayed,
    }));
  }
}
