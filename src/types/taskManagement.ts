export type TaskManagementStatus =
  | 'pending_dispatch'   // 待派单
  | 'dispatched'         // 已派单
  | 'claimed'            // 已领取
  | 'in_progress'        // 进行中
  | 'completed'          // 已完成
  | 'exception_review'   // 异常待核实 (补货员PDA已上报)
  | 'exception_closed';  // 异常关闭 (库管员PC核实并关闭)

export type TaskPriority = 'P0' | 'P1' | 'P2';

export type DispatchMode =
  | 'manual_assign'     // 手动指定补货员
  | 'nearby_auto'      // 按补货员区域就近自动派单
  | 'worker_grab';      // 补货员人工抢单

export interface ReplenishmentWorker {
  id: string;
  name: string;
  phone: string;
  assignedZone: string; // 负责库区 e.g. "A区", "B区", "全区"
  currentActiveTasks: number; // 当前进行中任务量
  status: 'online' | 'busy' | 'offline';
}

export interface TaskHistoryLog {
  id: string;
  timestamp: string;
  operator: string;
  action: string;
  fromStatus?: TaskManagementStatus;
  toStatus: TaskManagementStatus;
  note?: string;
}

export interface ReplenishTaskRecord {
  id: string;                    // e.g. "TASK-20260924-001"
  warehouseId: string;           // 仓库编码
  warehouseName: string;         // 仓库名称
  sku: string;                   // SKU
  productName: string;           // 产品名称
  category: string;              // 类别
  specification: string;         // 规格型号
  unit: string;                  // 单位 (件/箱)
  sourceLocation: string;        // 源库位 (二层/三层备货位)
  sourceLevel: number;           // 2 或 3
  targetLocation: string;        // 目标拣货库位 (一层拣货位)
  targetLevel: number;           // 1
  requestedQty: number;          // 申请补货量
  actualQty: number;             // 已补/实际移库量
  priority: TaskPriority;        // P0 / P1 / P2
  status: TaskManagementStatus;  // 状态流转
  dispatcher: string;            // 派单人 (操作员或系统)
  claimedBy?: string;            // 领取人/补货员
  workerPhone?: string;          // 补货员电话
  createdAt: string;             // 生成时间
  createdTimestamp: number;      // 生成时间戳 (毫秒)
  dispatchedAt?: string;         // 派单时间
  claimedAt?: string;            // 领取时间
  completedAt?: string;          // 完成时间
  elapsedMinutes: number;        // 已历时分钟 (系统动态更新)
  isWarning: boolean;            // 是否达到一级超时预警 (默认 >= 2h)
  isEscalated: boolean;          // 是否升级组长通知 (默认 >= 4h)
  exceptionType?: string;        // 异常原因分类 (空库/货损/通道堵塞/货位不符)
  exceptionReason?: string;      // 异常详细说明
  exceptionReportedBy?: string;  // 异常上报人 (补货员)
  exceptionReportedAt?: string;  // 异常上报时间
  exceptionReviewNote?: string;  // 库管员PC核实说明
  history: TaskHistoryLog[];     // 状态变更记录：操作人 + 操作时间戳
}

export interface TaskWarehouseConfig {
  warehouseId: string;
  warehouseName: string;
  dispatchMode: DispatchMode;
  warningThresholdHours: number;   // 默认 2 小时预警
  escalateThresholdHours: number;  // 默认 4 小时升级
  supervisorName: string;
  supervisorPhone: string;
  autoAssignMaxLoad: number;       // 自动派单单人上限任务数
}

export interface TaskFilterOptions {
  warehouseId: string;
  status: string;                  // 'ALL' | TaskManagementStatus
  priority: string;                // 'ALL' | 'P0' | 'P1' | 'P2'
  worker: string;                  // 'ALL' | worker name
  searchKeyword: string;           // 任务ID / SKU / 品名 / 库位
  onlyOverdue: boolean;            // 仅看超时
}
