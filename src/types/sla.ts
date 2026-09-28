// SLA 时效履约看板类型定义

export type SlaTimeDimension = 'day' | 'week' | 'month';

export type SlaDelayFilter = 'ALL' | 'DELAYED' | 'ON_TIME';

export type SlaCalculationMode = 'arithmetic_mean' | 'weighted_average';

export type SlaNodeId = 'inbound_register' | 'outbound_register' | 'inbound_putaway' | 'outbound_prepare';

export interface SlaNodeConfig {
  id: SlaNodeId;
  name: string;
  category: 'inbound' | 'outbound';
  startPointDescription: string;
  endPointDescription: string;
  defaultThresholdMinutes: number;
  currentThresholdMinutes: number;
  thresholdDisplay: string;
  description: string;
}

export interface SlaSystemConfig {
  calculationMode: SlaCalculationMode; // 4节点算术平均值 或 订单量加权平均值
  targetPassRate: number; // 默认 95% (≥95% 绿色，<95% 红色)
  nodes: Record<SlaNodeId, SlaNodeConfig>;
  lastUpdated: string;
}

export interface SlaNodeExecutionRecord {
  nodeId: SlaNodeId;
  nodeName: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  thresholdMinutes: number;
  isOnTime: boolean;
  overdueMinutes: number;
}

export interface SlaOrderRecord {
  orderId: string;
  orderType: 'INBOUND' | 'OUTBOUND';
  warehouseId: string;
  warehouseName: string;
  skuCount: number;
  totalPieces: number;
  createdAt: string;
  completedAt: string;
  isDelayed: boolean; // 至少一个节点超时
  delayedNodeCount: number;
  nodeExecutions: SlaNodeExecutionRecord[];
}

export interface SlaWarehouseMetric {
  warehouseId: string;
  warehouseCode: string;
  warehouseName: string;
  totalOrders: number;
  delayedOrdersCount: number;
  onTimeOrdersCount: number;
  nodeMetrics: Record<
    SlaNodeId,
    {
      totalOrders: number;
      onTimeCount: number;
      delayedCount: number;
      passRate: number; // 0-100
      avgDurationMinutes: number;
    }
  >;
  arithmeticPassRate: number; // 4节点算术平均值，保留1位小数
  weightedPassRate: number;   // 订单量加权平均值，保留1位小数
  compositePassRate: number;  // 根据系统配置模式得出
  monitoredNodeCount: number; // 固定 = 4
}

export interface SlaTrendPoint {
  periodLabel: string;
  dateStr: string;
  overallRate: number;
  nodeRates: Record<SlaNodeId, number>;
  totalOrders: number;
  delayedOrders: number;
}
