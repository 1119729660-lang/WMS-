import {
  DailySales,
  PriorityLevel,
  ReplenishItem,
  ReserveLocationStock,
  SKUReplenishConfig,
} from '../types/replenishment';

/**
 * 7日平均销量计算
 * 规则：近7天出库总件数 ÷ 7（SKU维度计算，剔除促销异常日）
 */
export function calculate7DaySales(dailySalesHistory: DailySales[]): {
  total7DaySales: number;
  validSalesDays: number;
  avgDailySales: number;
} {
  if (!dailySalesHistory || dailySalesHistory.length === 0) {
    return { total7DaySales: 0, validSalesDays: 0, avgDailySales: 0 };
  }

  // 剔除促销异常日
  const normalDays = dailySalesHistory.filter((d) => !d.isPromoAnomaly);
  const totalSales = normalDays.reduce((sum, d) => sum + d.quantity, 0);
  const validDays = normalDays.length > 0 ? normalDays.length : 7;

  // 根据业务规则：剔除异常日后，均值 = 正常日出库件数 ÷ 正常有效天数 (以真实反映日均动销)
  const avg = validDays > 0 ? Math.round((totalSales / validDays) * 10) / 10 : 0;

  return {
    total7DaySales: totalSales,
    validSalesDays: validDays,
    avgDailySales: avg,
  };
}

/**
 * 剩余可用天数计算
 * 剩余可用天数 = 一层拣货位可用库存 ÷ 近 7 日平均销量
 */
export function calculateDaysOfSupply(
  currentPickStock: number,
  avgDailySales: number
): number {
  if (currentPickStock <= 0) return 0;
  if (avgDailySales <= 0) return 999; // 无动销，可用天数极长
  const days = currentPickStock / avgDailySales;
  return Math.round(days * 10) / 10;
}

/**
 * 优先级判定与分级
 * P0：缺货订单池联动、拣货点实时缺货（剩余天数≤0，已断货）
 * P1：剩余可用天数＜1 天（拣货位库存低于 7 日均值）
 * P2：剩余可用天数＜2 天预警
 * NORMAL: 剩余可用天数 >= 2
 */
export function evaluatePriority(
  daysOfSupply: number,
  currentPickStock: number,
  isPickStationStockout: boolean,
  pendingBackorderCount: number
): { priority: PriorityLevel; priorityReason: string } {
  // P0 紧急判定
  if (currentPickStock <= 0 || isPickStationStockout || pendingBackorderCount > 0) {
    if (pendingBackorderCount > 0) {
      return {
        priority: 'P0',
        priorityReason: `缺货订单池挂起 ${pendingBackorderCount} 单，拣货位已断货！`,
      };
    }
    return {
      priority: 'P0',
      priorityReason: '拣货点实时断货（当前库存为0），拣选作业受阻',
    };
  }

  // P1 紧缺判定 (可用天数 < 1天，即库存已低于7日均销)
  if (daysOfSupply < 1.0) {
    return {
      priority: 'P1',
      priorityReason: `剩余可用天数 ${daysOfSupply} 天（< 1天），低于7日均销阈值`,
    };
  }

  // P2 预警判定 (1天 <= 可用天数 < 2天)
  if (daysOfSupply < 2.0) {
    return {
      priority: 'P2',
      priorityReason: `剩余可用天数 ${daysOfSupply} 天（< 2天），进入预防性补货预警期`,
    };
  }

  return {
    priority: 'NORMAL',
    priorityReason: `库存充足（剩余可支撑 ${daysOfSupply} 天）`,
  };
}

/**
 * 补货量计算
 * 补货量 = 近 7 日平均销量 × 补货系数（默认 1.0，可配置），向上取整
 * 目标补足一层拣货位可支撑 7~14 天拣货量，补货上下限支持 SKU 维度配置
 */
export function calculateReplenishQuantity(
  avgDailySales: number,
  currentPickStock: number,
  config: SKUReplenishConfig
): {
  calculatedQty: number;
  suggestedQty: number;
} {
  const coeff = config.replenishCoefficient || 1.0;
  // 基础计算：日均销量 * 补货系数，向上取整 (支撑约7-14天基础调拨)
  // 如果日均销是0，则无建议量
  if (avgDailySales <= 0) {
    return { calculatedQty: 0, suggestedQty: 0 };
  }

  // 基础批次：近7日均销 * 补货系数 (例如周转周期标准件数)
  // 目标补足一层支撑 7~14 天，一般补足系数为 7 * coeff 或 avgDailySales * 7
  // 根据业务公式：“补货量 = 近 7 日平均销量 × 补货系数（默认 1.0，可配置），向上取整；目标补足一层拣货位可支撑 7~14 天拣货量”
  // 当系数为 7 时代表补满7天，若日常配置系数(如7.0 或 1.0倍标准周转)，系统支持配置
  const rawCalculated = Math.ceil(avgDailySales * coeff);

  // 结合一层剩余货位最大物理容量和最小起调量
  const availableShelfCapacity = Math.max(0, config.maxPickShelfCapacity - currentPickStock);
  
  // 建议量先满足最小补货限制
  let finalQty = Math.max(rawCalculated, config.minReplenishQty);
  
  // 限制不超过一层货位剩余最大容量
  if (finalQty > availableShelfCapacity && availableShelfCapacity > 0) {
    finalQty = availableShelfCapacity;
  }

  return {
    calculatedQty: rawCalculated,
    suggestedQty: finalQty,
  };
}

/**
 * 补货来源优先级推荐
 * 规则：
 * 1. 优先同架垂直补货（同架二层备货区 > 同架三层备货区）
 * 2. 二层库存不足再取三层备货区
 * 3. 同架无库存时，就近调拨跨架备货区（邻架二层 > 邻架三层）
 */
export function recommendSourceLocation(
  reserveLocations: ReserveLocationStock[],
  neededQty: number
): {
  recommended: ReserveLocationStock | null;
  recommendationNote: string;
} {
  if (!reserveLocations || reserveLocations.length === 0) {
    return {
      recommended: null,
      recommendationNote: '⚠️ 备货区无有效可用库存，需入库收货上架',
    };
  }

  // 仅考虑有可用库存的库位
  const availableReserves = reserveLocations.filter((loc) => loc.availableStock > 0);
  if (availableReserves.length === 0) {
    return {
      recommended: null,
      recommendationNote: '⚠️ 二层/三层备货位库存均为0，需发起采购/移库',
    };
  }

  // 1. 同架二层 (Level 2, isSameRack = true)
  const sameRackL2 = availableReserves.find((l) => l.isSameRack && l.level === 2);
  if (sameRackL2) {
    const isSufficient = sameRackL2.availableStock >= neededQty;
    return {
      recommended: sameRackL2,
      recommendationNote: isSufficient
        ? `🎯 同架垂直直取（二层备货位 ${sameRackL2.locationCode}，库存 ${sameRackL2.availableStock} 件，效率最高）`
        : `⚠️ 同架二层备货位 ${sameRackL2.locationCode} 部分足额（可用 ${sameRackL2.availableStock} 件，需三层组合）`,
    };
  }

  // 2. 同架三层 (Level 3, isSameRack = true)
  const sameRackL3 = availableReserves.find((l) => l.isSameRack && l.level === 3);
  if (sameRackL3) {
    return {
      recommended: sameRackL3,
      recommendationNote: `📦 二层同架无余量，调度同架三层备货位 ${sameRackL3.locationCode}（库存 ${sameRackL3.availableStock} 件）`,
    };
  }

  // 3. 跨架/邻近二层备货区 (按距离排序)
  const otherL2 = availableReserves
    .filter((l) => !l.isSameRack && l.level === 2)
    .sort((a, b) => a.distanceScore - b.distanceScore);
  if (otherL2.length > 0) {
    return {
      recommended: otherL2[0],
      recommendationNote: `🚚 同架无备货，就近调用相邻货架二层 ${otherL2[0].locationCode}（库存 ${otherL2[0].availableStock} 件）`,
    };
  }

  // 4. 跨架三层备货区
  const otherL3 = availableReserves
    .filter((l) => !l.isSameRack && l.level === 3)
    .sort((a, b) => a.distanceScore - b.distanceScore);
  if (otherL3.length > 0) {
    return {
      recommended: otherL3[0],
      recommendationNote: `🔄 同架及二层均无余量，跨架调用三层 ${otherL3[0].locationCode}（库存 ${otherL3[0].availableStock} 件）`,
    };
  }

  return {
    recommended: availableReserves[0],
    recommendationNote: `备货位 ${availableReserves[0].locationCode}（可用 ${availableReserves[0].availableStock} 件）`,
  };
}

/**
 * 完整补货项数据补全与计算
 */
export function enrichReplenishItem(item: ReplenishItem): ReplenishItem {
  // 1. 7日销量计算
  const { total7DaySales, validSalesDays, avgDailySales } = calculate7DaySales(
    item.dailySalesHistory
  );

  // 2. 剩余可用天数
  const daysOfSupply = calculateDaysOfSupply(item.currentPickStock, avgDailySales);

  // 3. 触发条件：拣货区 SKU 当前可用库存 < 近 7 日平均销量
  const isTriggered = item.currentPickStock < avgDailySales;

  // 4. 优先级判定
  const { priority, priorityReason } = evaluatePriority(
    daysOfSupply,
    item.currentPickStock,
    item.isPickStationStockout,
    item.pendingBackorderCount
  );

  // 5. 补货量计算
  const { calculatedQty, suggestedQty } = calculateReplenishQuantity(
    avgDailySales,
    item.currentPickStock,
    item.config
  );

  // 6. 源库位推荐
  const { recommended, recommendationNote } = recommendSourceLocation(
    item.reserveLocations,
    suggestedQty
  );

  return {
    ...item,
    total7DaySales,
    validSalesDays,
    avgDailySales,
    daysOfSupply,
    isTriggered,
    calculatedReplenishQty: calculatedQty,
    suggestedReplenishQty: suggestedQty,
    priority,
    priorityReason,
    recommendedSourceLocation: recommended,
    recommendationNote,
  };
}

/**
 * 同级排序规则：
 * 优先级由高到低：P0 > P1 > P2 > NORMAL
 * 同级排序：剩余可用天数升序（越少越紧迫），7日平均销量降序（动销越快越优先）
 */
export function sortReplenishItems(items: ReplenishItem[]): ReplenishItem[] {
  const priorityWeight: Record<PriorityLevel, number> = {
    P0: 4,
    P1: 3,
    P2: 2,
    NORMAL: 1,
  };

  return [...items].sort((a, b) => {
    // 1. 优先级高先排
    const weightDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
    if (weightDiff !== 0) return weightDiff;

    // 2. 剩余可用天数升序 (越小越急)
    if (a.daysOfSupply !== b.daysOfSupply) {
      return a.daysOfSupply - b.daysOfSupply;
    }

    // 3. 7日平均销量降序 (同天数时动销越大越急)
    return b.avgDailySales - a.avgDailySales;
  });
}
