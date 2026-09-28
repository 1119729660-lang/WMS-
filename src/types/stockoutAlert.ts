export type AlertSeverity = 'light' | 'medium' | 'severe';
export type AlertStatus = 'pending' | 'followed_up' | 'resolved' | 'escalated';

export interface AlertResolutionLog {
  id: string;
  time: string;
  operator: string;
  action: string;
  note: string;
}

export interface StockoutAlertItem {
  id: string;
  sku: string;
  productName: string;
  category: string;
  warehouseId: string;
  warehouseName: string;
  suggestedReplenishQty: number; // 补货量
  reserveAvailQty: number;        // 备货区可用库存
  gapQty: number;                 // 缺口量 = 补货量 - 备货区可用库存
  gapRatio: number;               // 缺口占比: gapQty / suggestedReplenishQty
  severity: AlertSeverity;        // 轻度 (<30%) | 中度 (30%~60%) | 重度 (>60%)
  status: AlertStatus;            // 待处理 | 已跟进 | 已解决 | 超时已升级
  triggerTime: string;            // 触发时间
  timeoutHours: number;           // 默认 24h 未处理自动升级
  hoursElapsed: number;           // 已触发流逝小时
  isOverdue: boolean;             // 是否已超时
  merchantName: string;           // 客户
  firstLegFollower: string;       // 头程跟进人
  emailSent: boolean;             // 邮件已通知
  systemNoticeSent: boolean;      // 系统消息已发送
  isP0Generated: boolean;         // 是否已生成联动 P0 级加急补货任务
  history: AlertResolutionLog[];  // 闭环操作日志
}

export type OrderPoolStatus = 'pending_replenish' | 'replenished' | 'cancelled';

export interface StockoutOrder {
  id: string;
  orderNo: string;
  sku: string;
  productName: string;
  gapQty: number;
  sourceWaveId: string;
  status: OrderPoolStatus;
  entryTime: string;
  entryReason: 'PDA上报P0缺货' | '备货区库存不足触发' | '拣货缺货拦截';
  stagingLocation: string; // 缺货订单暂存托位
}

export interface NotificationSettings {
  defaultNoticeMerchant: boolean;
  defaultNoticeFirstLeg: boolean;
  enableSystemNotice: boolean;
  enableEmailNotice: boolean;
  escalationTimeoutHours: number; // 默认 24
  escalationSupervisor: string;
  escalationEmail: string;
  warehouseRules: {
    warehouseId: string;
    warehouseName: string;
    firstLegLeader: string;
    contactEmail: string;
  }[];
  categoryRules: {
    category: string;
    planner: string;
    phone: string;
  }[];
}
