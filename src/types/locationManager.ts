export type LocationType = 'PICKING' | 'RESERVE' | 'FLOOR_STACK';

export type LogicalRoleTag = 'PICKING_LAYER' | 'RESERVE_LAYER' | 'NONE';

export interface LocationAuditLog {
  id: string;
  locationCode: string;
  warehouseId: string;
  warehouseName: string;
  timestamp: string;
  operator: string;
  actionType: 'SWITCH_TO_PICKING' | 'RESTORE_TO_RESERVE' | 'CAPACITY_UPDATE' | 'BATCH_CONFIG' | 'MANUAL_EDIT';
  fromRole: string;
  toRole: string;
  reason: string;
}

export interface ManagedLocation {
  id: string;
  warehouseId: string; // 分仓独立
  warehouseCode: string; // 2位仓库码, 如 HH, SH, BJ
  locationCode: string; // 推荐规则编码: HH1A01B1
  floor: number; // 楼层 1位
  aisle: string; // 通道 2位 如 A1, 01, AA
  col: string; // 列 2位 如 01, 02
  shelfLevel: string; // 物理层 1位 如 1, 2, 3, B, C
  physicalLevel: number; // 物理层数 (1, 2, 3...)
  
  // 业务类型与逻辑层 (物理层与逻辑层解耦)
  type: LocationType; // 拣货位 | 备货位 | 地堆
  logicalRole: LogicalRoleTag; // 业务口径: 拣货层 / 备货层 / 无 (地堆不参与)
  
  // 标签与临时切换
  isTemporarySwitched: boolean; // 是否处于大促/检修临时切换
  originalType?: LocationType;
  originalLogicalRole?: LogicalRoleTag;
  temporaryReason?: string;
  switchedAt?: string;
  switchedBy?: string;

  // 容量管控 (拣货位件数容量)
  maxCapacity: number; // 最大件数容量 (拣货位通常500-1000件, 地堆为托)
  currentStock: number; // 当前在库件数
  unit: string; // 件 / 箱 / 托
  boundSkuCode?: string;
  boundSkuName?: string;
  
  // 货架所属
  rackCode: string; // 如 HH-1-A01
  status: 'NORMAL' | 'NEAR_FULL' | 'EMPTY' | 'MAINTENANCE';
}

export interface LocationCodeBreakdown {
  warehouseCode: string;
  floor: string;
  aisle: string;
  col: string;
  shelfLevel: string;
  isValid: boolean;
  error?: string;
}

export interface CapacityOverflowTestResult {
  locationCode: string;
  maxCapacity: number;
  currentStock: number;
  remainingCapacity: number;
  incomingReplenishQty: number;
  actualAcceptedQty: number;
  overflowQty: number;
  isOverflowTriggered: boolean;
  overflowTaskId?: string;
  overflowBufferLocationCode?: string;
  logMessage: string;
}
