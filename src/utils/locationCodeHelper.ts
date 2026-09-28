import {
  LocationCodeBreakdown,
  LocationType,
  LogicalRoleTag,
  ManagedLocation,
  CapacityOverflowTestResult,
} from '../types/locationManager';

/**
 * 校验与解析推荐规则库位编码
 * 规则：仓库码 (2 位) + 楼层 (1 位) + 通道 (2 位) + 列 (2 位) + 层 (1 位)
 * 长度严格 8 位大写字母或数字
 * 示例：HH1A01B1 (HH=黑河仓, 1=1层楼, A0=A0通道或A通道0, 01=01列, B=B层或1层)
 */
export function parseLocationCode(code: string): LocationCodeBreakdown {
  const cleanCode = code.trim().toUpperCase();
  if (cleanCode.length !== 8) {
    return {
      warehouseCode: '',
      floor: '',
      aisle: '',
      col: '',
      shelfLevel: '',
      isValid: false,
      error: `编码长度需严格为 8 位，当前为 ${cleanCode.length} 位 (示例: HH1A01B1)`,
    };
  }

  const warehouseCode = cleanCode.substring(0, 2);
  const floor = cleanCode.substring(2, 3);
  const aisle = cleanCode.substring(3, 5);
  const col = cleanCode.substring(5, 7);
  const shelfLevel = cleanCode.substring(7, 8);

  // 基础字符校验
  const isAlphaNum = /^[A-Z0-9]+$/.test(cleanCode);
  const isFloorNum = /^[1-9]$/.test(floor);

  if (!isAlphaNum) {
    return {
      warehouseCode,
      floor,
      aisle,
      col,
      shelfLevel,
      isValid: false,
      error: '库位编码仅允许大写英文字母与数字组合',
    };
  }

  if (!isFloorNum) {
    return {
      warehouseCode,
      floor,
      aisle,
      col,
      shelfLevel,
      isValid: false,
      error: '第 3 位楼层需为有效正整数 (1-9)',
    };
  }

  return {
    warehouseCode,
    floor,
    aisle,
    col,
    shelfLevel,
    isValid: true,
  };
}

/**
 * 生成推荐编码
 */
export function generateLocationCode(
  whCode: string,
  floor: number,
  aisle: string,
  col: number,
  level: number | string
): string {
  const pWh = (whCode.substring(0, 2) || 'WH').toUpperCase();
  const pFloor = String(floor).substring(0, 1);
  const pAisle = aisle.padEnd(2, '0').substring(0, 2).toUpperCase();
  const pCol = String(col).padStart(2, '0').substring(0, 2);
  const pLevel = String(level).substring(0, 1).toUpperCase();

  return `${pWh}${pFloor}${pAisle}${pCol}${pLevel}`;
}

/**
 * 物理层与逻辑层解耦业务口径：
 * - 第 1 层默认为「拣货位 / 拣货层」
 * - 第 2 层及以上默认为「备货位 / 备货层」
 * - 地堆托盘库位标记为「地堆」，不参与拣货/备货层配置
 */
export function getDefaultRoleByLevel(
  level: number,
  isFloorStack = false
): { type: LocationType; logicalRole: LogicalRoleTag } {
  if (isFloorStack) {
    return {
      type: 'FLOOR_STACK',
      logicalRole: 'NONE',
    };
  }
  if (level === 1) {
    return {
      type: 'PICKING',
      logicalRole: 'PICKING_LAYER',
    };
  }
  return {
    type: 'RESERVE',
    logicalRole: 'RESERVE_LAYER',
  };
}

/**
 * 库位容量管控与溢出补货任务计算核心逻辑：
 * 拣货位配置最大件数容量；
 * 补货时目标库剩余容量 < 待补数量，按剩余容量补货，剩余数量生成溢出任务。
 */
export function calculateCapacityOverflow(
  location: ManagedLocation,
  replenishQty: number
): CapacityOverflowTestResult {
  const remainingCapacity = Math.max(0, location.maxCapacity - location.currentStock);

  if (replenishQty <= remainingCapacity) {
    return {
      locationCode: location.locationCode,
      maxCapacity: location.maxCapacity,
      currentStock: location.currentStock,
      remainingCapacity,
      incomingReplenishQty: replenishQty,
      actualAcceptedQty: replenishQty,
      overflowQty: 0,
      isOverflowTriggered: false,
      logMessage: `库位容量充足：剩余容量 ${remainingCapacity} ${location.unit}，可全额接纳补货量 ${replenishQty} ${location.unit}。无需溢出拆单。`,
    };
  }

  // 触发容量超限管控：按剩余容量补货，剩余生成溢出任务
  const actualAcceptedQty = remainingCapacity;
  const overflowQty = replenishQty - remainingCapacity;
  const randomTaskId = `OVR-TASK-${Date.now().toString().slice(-6)}`;
  const bufferLocation = `BF-${location.warehouseCode}-${location.aisle}-01`;

  return {
    locationCode: location.locationCode,
    maxCapacity: location.maxCapacity,
    currentStock: location.currentStock,
    remainingCapacity,
    incomingReplenishQty: replenishQty,
    actualAcceptedQty,
    overflowQty,
    isOverflowTriggered: true,
    overflowTaskId: randomTaskId,
    overflowBufferLocationCode: bufferLocation,
    logMessage: `⚠️ 触发容量管控：拣货位上限 ${location.maxCapacity}，在库 ${location.currentStock}，剩余可用 ${remainingCapacity} ${location.unit}＜待补量 ${replenishQty} ${location.unit}。系统已执行容量保护：目标位仅补入 ${actualAcceptedQty} ${location.unit}，剩余溢出 ${overflowQty} ${location.unit} 已自动派生独立溢出暂存任务 [${randomTaskId}]，暂存指引库位: [${bufferLocation}]！`,
  };
}
