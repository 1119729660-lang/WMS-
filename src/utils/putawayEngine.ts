import {
  PutawaySKUCandidate,
  PutawaySKUType,
  PutawayStrategyConfig,
  PutawayDecisionResult,
  PutawayTargetType,
  WarehouseLocation,
} from '../types/putaway';

/**
 * 计算近 30 天 SKU 平均日销量 (支持大促/异常波动日标记与剔除)
 */
export function calculate30dDailySales(
  sku: PutawaySKUCandidate,
  config: PutawayStrategyConfig
): {
  rawAvg: number;
  adjustedAvg: number;
  excludedCount: number;
  excludedSalesTotal: number;
} {
  const totalDays = config.salesCalculationDays || 30;
  const rawSum = sku.daily30dHistory.reduce((sum, d) => sum + d.quantity, 0);
  const rawAvg = Math.round((rawSum / totalDays) * 10) / 10;

  // 检查已配置且开启剔除的大促异常日
  const excludedDateSet = new Set(
    config.promoAnomalies
      .filter((p) => p.excluded)
      .map((p) => p.date)
  );

  let excludedSalesTotal = 0;
  let excludedCount = 0;

  sku.daily30dHistory.forEach((d) => {
    if (excludedDateSet.has(d.date) || (d.isPromoSpike && config.promoAnomalies.some(p => p.date === d.date && p.excluded))) {
      excludedSalesTotal += d.quantity;
      excludedCount++;
    }
  });

  const validDays = Math.max(1, totalDays - excludedCount);
  const validSalesSum = Math.max(0, rawSum - excludedSalesTotal);
  const adjustedAvg = Math.round((validSalesSum / validDays) * 10) / 10;

  return {
    rawAvg,
    adjustedAvg,
    excludedCount,
    excludedSalesTotal,
  };
}

/**
 * 寻找最佳推荐储位 (同 SKU 同架垂直优先推荐)
 */
export function findRecommendedLocation(
  sku: PutawaySKUCandidate,
  targetType: PutawayTargetType,
  locations: WarehouseLocation[],
  config: PutawayStrategyConfig
): {
  location: WarehouseLocation;
  isSameRack: boolean;
  notes: string;
} {
  const rackCode = sku.boundRackCode || 'A-01-01';

  // 1. 如果是绿色地堆托盘区 (整托囤货)
  if (targetType === 'FLOOR_PALLET_ZONE') {
    const floorLoc =
      locations.find(
        (l) =>
          l.isFloorPallet &&
          (l.boundSkuCode === sku.skuCode || l.currentStock === 0)
      ) ||
      locations.find((l) => l.isFloorPallet) ||
      locations[0];

    return {
      location: floorLoc,
      isSameRack: false,
      notes: '绿色地堆托盘区 (整托大件囤货，不拆分高层备货，减少源头补货)',
    };
  }

  // 2. 如果是一层拣货区 (快速可售 / 补足拣货位)
  if (targetType === 'PICK_LEVEL_1') {
    // 优先同架 1 层
    const sameRackPick = locations.find(
      (l) =>
        !l.isFloorPallet &&
        l.rackCode === rackCode &&
        (l.currentRoleTag === 'PICKING_LAYER' || l.currentRoleTag === 'TEMP_PICKING') &&
        (l.boundSkuCode === sku.skuCode || l.currentStock < l.maxCapacity)
    );

    if (sameRackPick) {
      return {
        location: sameRackPick,
        isSameRack: true,
        notes: '同架 1 层黄金拣货位 (锁定同 SKU 拣货动线，快速上架可售)',
      };
    }

    // 邻架 1 层
    const otherPick = locations.find(
      (l) =>
        !l.isFloorPallet &&
        (l.currentRoleTag === 'PICKING_LAYER' || l.currentRoleTag === 'TEMP_PICKING') &&
        l.isAvailable
    );

    return {
      location: otherPick || locations[0],
      isSameRack: false,
      notes: '相邻货架 1 层拣货位',
    };
  }

  // 3. 如果是高层 / 滞销品专区 (3 层及以上)
  if (targetType === 'SLOW_MOVING_HIGH_BAY') {
    const slowLoc =
      locations.find(
        (l) =>
          !l.isFloorPallet &&
          (l.currentRoleTag === 'SLOW_ZONE' || l.level === 3) &&
          (l.boundSkuCode === sku.skuCode || l.currentStock === 0 || l.isAvailable)
      ) ||
      locations.find((l) => l.level === 3) ||
      locations[0];

    return {
      location: slowLoc,
      isSameRack: slowLoc.rackCode === rackCode,
      notes: '高层/滞销品专区 (长尾低动销，腾出一层黄金位，订单需要时再补)',
    };
  }

  // 4. 常规二三层备货位 (同架垂直绑定)
  const sameRackReserveL2 = locations.find(
    (l) =>
      !l.isFloorPallet &&
      l.rackCode === rackCode &&
      l.level === 2 &&
      l.currentRoleTag === 'RESERVE_LAYER'
  );

  if (sameRackReserveL2) {
    return {
      location: sameRackReserveL2,
      isSameRack: true,
      notes: '同架 2 层备货位 (🎯同 SKU 垂直同架绑定，补货时 0 巷道平移直降)',
    };
  }

  const sameRackReserveL3 = locations.find(
    (l) =>
      !l.isFloorPallet &&
      l.rackCode === rackCode &&
      l.level === 3 &&
      l.currentRoleTag === 'RESERVE_LAYER'
  );

  if (sameRackReserveL3) {
    return {
      location: sameRackReserveL3,
      isSameRack: true,
      notes: '同架 3 层高位备货位 (🎯同架垂直同位绑定)',
    };
  }

  const anyReserve =
    locations.find(
      (l) =>
        !l.isFloorPallet &&
        (l.currentRoleTag === 'RESERVE_LAYER' || l.level >= 2) &&
        l.isAvailable
    ) || locations[0];

  return {
    location: anyReserve,
    isSameRack: false,
    notes: '邻架备货位 (同通道相邻货架备货区)',
  };
}

/**
 * 核心上架判定引擎：
 * 判定优先级：新品 → 爆品 → 老品 → 滞销品
 * 新品 / 爆品 / 滞销品判定后直接决定上架位置，不校验拣货区当前库存；
 * 仅老品才校验拣货区库存！
 */
export function evaluatePutawayStrategy(
  sku: PutawaySKUCandidate,
  config: PutawayStrategyConfig,
  locations: WarehouseLocation[]
): PutawayDecisionResult {
  const trace: PutawayDecisionResult['decisionTraceSteps'] = [];

  // 计算 30 天均销与品类阈值
  const salesResult = calculate30dDailySales(sku, config);
  const catConfig = config.categoryConfigs[sku.category] || {
    category: sku.category,
    thresholdCoeff: 1.0,
    maxPickCapacity: 200,
  };
  const categoryThresholdCoeff = catConfig.thresholdCoeff;
  const pickStockThreshold = Math.round(salesResult.adjustedAvg * categoryThresholdCoeff * 10) / 10;

  let determinedType: PutawaySKUType | null = null;
  let isDirectDecision = false;
  let checkedPickStock = false;
  let priorityStep = '';
  let targetType: PutawayTargetType = 'RESERVE_LEVEL_2_3';
  let palletStrategy: PutawayDecisionResult['palletStrategy'] = 'HIGH_BAY_SPLIT';
  let strategySummary = '';
  let pdaAlertMessage = '';

  // ==========================================
  // 第一步判定：【新品判定】
  // 系统无历史入库记录的 SKU -> 直决一层拣货区，保证快速可售
  // 不校验拣货区库存！
  // ==========================================
  const isNewProduct = !sku.hasHistoryInbound;
  trace.push({
    stepName: '优先级1: 新品判定 (NEW)',
    condition: '系统无历史入库记录 (hasHistoryInbound === false)',
    result: isNewProduct,
    description: isNewProduct
      ? `检测到该 SKU [${sku.skuCode}] 首次入库，无历史收货/出库记录，命中新品直决规则！`
      : `已有历史入库记录 (首次入库: ${sku.firstInboundDate || '正常在售'})，非新品，进入下一步。`,
    badgeColor: isNewProduct ? 'emerald' : 'slate',
  });

  if (isNewProduct && config.newProductRule.enabled) {
    determinedType = 'NEW';
    isDirectDecision = true;
    checkedPickStock = false; // 不校验库存
    priorityStep = 'STEP_1_NEW_PRODUCT';
    targetType = 'PICK_LEVEL_1';
    palletStrategy = 'DIRECT_PICK';
    strategySummary = '【新品直决】直上 1 层拣货区，免验拣货库存，保障快速上架即时可售！';
    pdaAlertMessage = '【PDA上架提示 - 新品直通】新品首次入库，请直接上架一层拣货位，无需校验拣货区存量！';
  }

  // ==========================================
  // 第二步判定：【爆品判定】
  // 近 30 天动销天数 >= 20天，或出库量 TOP 约 20% A类爆品
  // 直决：足量铺一层拣货位，相邻地堆整托囤货，不拆分至高层备货，源头减少补货！
  // 不校验拣货区库存！
  // ==========================================
  if (!determinedType) {
    const isHotByDays = sku.activeDays30d >= config.hotProductRule.minActiveDays30d;
    const isHotBySales = sku.salesRankPercent <= config.hotProductRule.topSalesPercent / 100;
    const isHotProduct = isHotByDays || isHotBySales;

    trace.push({
      stepName: '优先级2: 爆品判定 (HOT)',
      condition: `近 30 天动销天数 ≥ ${config.hotProductRule.minActiveDays30d}天 (当前: ${sku.activeDays30d}天) 或 出库量 TOP ${config.hotProductRule.topSalesPercent}% (当前分位: 前 ${(sku.salesRankPercent * 100).toFixed(1)}%)`,
      result: isHotProduct,
      description: isHotProduct
        ? `命中爆品条件！(动销天数: ${sku.activeDays30d}天, 30天总出库: ${sku.total30dOutboundQty}件, TOP ${(sku.salesRankPercent * 100).toFixed(1)}%)。直决：一层足量铺货 + 地堆整托囤货，不拆分高层！`
        : `未达到爆品阈值 (动销天数 ${sku.activeDays30d} < ${config.hotProductRule.minActiveDays30d}天 且 非TOP ${config.hotProductRule.topSalesPercent}%)，进入下一步。`,
      badgeColor: isHotProduct ? 'amber' : 'slate',
    });

    if (isHotProduct && config.hotProductRule.enabled) {
      determinedType = 'HOT';
      isDirectDecision = true;
      checkedPickStock = false; // 不校验库存
      priorityStep = 'STEP_2_HOT_PRODUCT';

      if (sku.isFullPallet || sku.inboundQty >= 100) {
        targetType = 'FLOOR_PALLET_ZONE';
        palletStrategy = 'FLOOR_PALLET_STAGE';
        strategySummary = '【爆品直决】整托大件上架绿色地堆托盘区，相邻就近囤货，从源头减少补货往返！';
        pdaAlertMessage = '【PDA上架提示 - 地堆整托】A类高频爆品！推荐上架绿色地堆托盘区整托囤货，严禁拆托混入高层货架！';
      } else {
        targetType = 'PICK_LEVEL_1';
        palletStrategy = 'DIRECT_PICK';
        strategySummary = '【爆品直决】足量铺一层拣货位，高频出库零搬运，源头减少高低位补货！';
        pdaAlertMessage = '【PDA上架提示 - 爆品直铺】A类爆品直铺一层拣货位，请核对拣货位容量！';
      }
    }
  }

  // ==========================================
  // 第三步判定：【滞销品判定】
  // C 类长尾低动销 SKU，近 30 天动销天数 < 5天，或出库量后 20%
  // 直决：直接上架高层 / 滞销区，订单需要时再补货
  // 不校验拣货区库存！
  // ==========================================
  let isSlowCandidate = false;
  if (!determinedType) {
    const isSlowByDays = sku.activeDays30d < config.slowProductRule.maxActiveDays30d;
    const isSlowBySales = sku.salesRankPercent >= (1 - config.slowProductRule.bottomSalesPercent / 100);
    isSlowCandidate = isSlowByDays || isSlowBySales;

    trace.push({
      stepName: '优先级3: 滞销品预检 (SLOW)',
      condition: `近 30 天动销天数 < ${config.slowProductRule.maxActiveDays30d}天 (当前: ${sku.activeDays30d}天) 或 出库量后 ${config.slowProductRule.bottomSalesPercent}% (当前分位: ${(sku.salesRankPercent * 100).toFixed(1)}%)`,
      result: isSlowCandidate,
      description: isSlowCandidate
        ? `命中长尾滞销品条件！(动销天数仅 ${sku.activeDays30d} 天，后 ${(sku.salesRankPercent * 100).toFixed(1)}%)。直决：直接上架高层/滞销区，严禁挤占一层黄金位！`
        : `动销天数 ${sku.activeDays30d} 天正常，排除滞销品。`,
      badgeColor: isSlowCandidate ? 'purple' : 'slate',
    });

    if (isSlowCandidate && config.slowProductRule.enabled) {
      determinedType = 'SLOW';
      isDirectDecision = true;
      checkedPickStock = false; // 不校验库存
      priorityStep = 'STEP_3_SLOW_PRODUCT';
      targetType = 'SLOW_MOVING_HIGH_BAY';
      palletStrategy = 'SLOW_HIGH_BAY';
      strategySummary = '【滞销品直决】直接上架高层/滞销专区，不占用一层黄金拣选位，订单需要时按需补货！';
      pdaAlertMessage = '【PDA上架提示 - 高层滞销区】长尾低动销商品，请直接上架三层或高位滞销区，严禁上架一层拣选区！';
    }
  }

  // ==========================================
  // 第四步判定：【老品上架逻辑】
  // 排除新品 / 爆品 / 滞销品后，成为老品
  // 🚨 仅老品才校验拣货区库存！
  // 一层拣货位可用库存 < SKU 近 30 天平均销量 × 品类阈值系数 → 推荐一层拣货位；
  // 否则推荐同架 / 邻架二三层备货位
  // ==========================================
  if (!determinedType) {
    determinedType = 'REGULAR';
    isDirectDecision = false;
    checkedPickStock = true; // 仅老品校验库存！
    priorityStep = 'STEP_4_REGULAR_PRODUCT';

    const isPickShortage = sku.currentPickStock < pickStockThreshold;

    trace.push({
      stepName: '优先级4: 老品库存校验 (REGULAR - 仅老品校验)',
      condition: `一层拣货位可用库存 (${sku.currentPickStock} ${sku.unit}) < 阈值 (${pickStockThreshold} = 30天均销 ${salesResult.adjustedAvg} × 品类系数 ${categoryThresholdCoeff})`,
      result: isPickShortage,
      description: isPickShortage
        ? `一层拣货位库存 (${sku.currentPickStock}) 低于库存阈值 (${pickStockThreshold})，拣货面偏紧，推荐上架【一层拣货位】补足拣选！`
        : `一层拣货位库存 (${sku.currentPickStock}) 充足 (≥ 阈值 ${pickStockThreshold})，推荐上架【同架/邻架二三层备货位】高位立体存储！`,
      badgeColor: 'blue',
    });

    if (isPickShortage) {
      targetType = 'PICK_LEVEL_1';
      palletStrategy = 'DIRECT_PICK';
      strategySummary = `【老品上架】一层拣货位库存紧缺 (${sku.currentPickStock} < 阈值 ${pickStockThreshold})，推荐直接上架一层拣货位补足！`;
      pdaAlertMessage = '【PDA上架提示 - 老品补拣选】该老品拣货区库存低于30天均销，请优先上架一层拣货位！';
    } else {
      targetType = 'RESERVE_LEVEL_2_3';
      palletStrategy = 'HIGH_BAY_SPLIT';
      strategySummary = `【老品上架】一层拣货位存量充裕 (${sku.currentPickStock} ≥ 阈值 ${pickStockThreshold})，推荐上架同架二/三层备货位！`;
      pdaAlertMessage = '【PDA上架提示 - 高位备货】一层拣货区库存充足，请按同架垂直推荐上架二/三层备货位！';
    }
  }

  // 推荐具体储位
  const recommended = findRecommendedLocation(sku, targetType, locations, config);

  return {
    sku,
    skuType: determinedType,
    priorityStep,
    isDirectDecision,
    checkedPickStock,
    raw30dAvgDailySales: salesResult.rawAvg,
    adjusted30dAvgDailySales: salesResult.adjustedAvg,
    promoExcludedDaysCount: salesResult.excludedCount,
    categoryThresholdCoeff,
    pickStockThreshold,
    recommendedTargetType: targetType,
    recommendedLocationCode: recommended.location.locationCode,
    recommendedZoneName: recommended.location.zone,
    recommendedLevel: recommended.location.level,
    isSameRackVertical: recommended.isSameRack,
    palletStrategy,
    decisionTraceSteps: trace,
    strategySummary,
    pdaAlertMessage,
  };
}

/**
 * PDA 扫码防错校验器
 */
export function validatePdaPutawayScan(
  scannedLocationCode: string,
  recommendedResult: PutawayDecisionResult,
  locations: WarehouseLocation[]
): {
  isValid: boolean;
  alertType: 'SUCCESS' | 'WARNING' | 'ERROR';
  title: string;
  message: string;
} {
  const targetLoc = locations.find((l) => l.locationCode === scannedLocationCode);
  if (!targetLoc) {
    return {
      isValid: false,
      alertType: 'ERROR',
      title: '无效库位编码',
      message: `系统中未找到库位 [${scannedLocationCode}]，请重新扫描！`,
    };
  }

  // 防错规则 1: 爆品/地堆大件严禁错扫入高位货架
  if (recommendedResult.recommendedTargetType === 'FLOOR_PALLET_ZONE' && !targetLoc.isFloorPallet) {
    return {
      isValid: false,
      alertType: 'ERROR',
      title: '防错拦截：地堆整托禁入高位货架',
      message: `当前 SKU [${recommendedResult.sku.skuCode}] 为爆品整托大件，推荐在绿色地堆区整托存放，严禁搬上高位立体货架！`,
    };
  }

  // 防错规则 2: 滞销品严禁扫入一层拣货区黄金位
  if (recommendedResult.skuType === 'SLOW' && (targetLoc.currentRoleTag === 'PICKING_LAYER' || targetLoc.level === 1)) {
    return {
      isValid: false,
      alertType: 'ERROR',
      title: '防错拦截：滞销品严禁占用一层拣货位',
      message: `当前 SKU [${recommendedResult.sku.skuCode}] 为近30天动销低于5天的滞销长尾品，禁止占用一层黄金拣选位！请上架三层或滞销专区。`,
    };
  }

  // 防错规则 3: 完美命中推荐库位
  if (scannedLocationCode === recommendedResult.recommendedLocationCode) {
    return {
      isValid: true,
      alertType: 'SUCCESS',
      title: '核验通过：精准命中推荐储位',
      message: `库位 [${scannedLocationCode}] 与 WMS 算法推荐完全一致 (${recommendedResult.isSameRackVertical ? '同架垂直最短动线' : '匹配目标库位'})，允许确认上架！`,
    };
  }

  // 防错规则 4: 虽非推荐库位，但同属于合规层位
  if (
    (recommendedResult.recommendedTargetType === 'PICK_LEVEL_1' && targetLoc.level === 1) ||
    (recommendedResult.recommendedTargetType === 'RESERVE_LEVEL_2_3' && targetLoc.level >= 2) ||
    (recommendedResult.recommendedTargetType === 'FLOOR_PALLET_ZONE' && targetLoc.isFloorPallet)
  ) {
    return {
      isValid: true,
      alertType: 'WARNING',
      title: '合规替代库位 (跨架注意)',
      message: `扫描库位 [${scannedLocationCode}] 虽非首选同架推荐 [${recommendedResult.recommendedLocationCode}]，但分区层级合规，允许确认上架。`,
    };
  }

  return {
    isValid: false,
    alertType: 'ERROR',
    title: '库位层级不匹配',
    message: `推荐上架目标为 ${recommendedResult.recommendedTargetType}，而扫描库位为 ${targetLoc.currentRoleTag} (层位: ${targetLoc.level})，存在作业错放风险！`,
  };
}
