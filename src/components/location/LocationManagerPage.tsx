import React, { useState, useMemo } from 'react';
import {
  Layers,
  Boxes,
  Tag,
  ArrowRightLeft,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  SlidersHorizontal,
  Plus,
  Search,
  Building2,
  Calendar,
  User,
  ShieldCheck,
  AlertCircle,
  FileText,
  Download,
  Upload,
  Zap,
  Info,
  Edit3,
  X,
  Gauge,
  Workflow,
  History,
} from 'lucide-react';
import {
  ManagedLocation,
  LocationAuditLog,
  LocationType,
  LogicalRoleTag,
  CapacityOverflowTestResult,
} from '../../types/locationManager';
import {
  MOCK_MANAGED_WAREHOUSES,
  INITIAL_MANAGED_LOCATIONS,
  INITIAL_AUDIT_LOGS,
} from '../../data/mockLocationManagerData';
import {
  parseLocationCode,
  generateLocationCode,
  getDefaultRoleByLevel,
  calculateCapacityOverflow,
} from '../../utils/locationCodeHelper';

export const LocationManagerPage: React.FC = () => {
  // 分仓独立选择
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('WH-03'); // 默认黑河仓 (HH)
  const [activeSubTab, setActiveSubTab] = useState<'LIST' | 'BATCH' | 'IMPORT' | 'OVERFLOW' | 'LOGS'>('LIST');

  // 状态数据
  const [locations, setLocations] = useState<ManagedLocation[]>(INITIAL_MANAGED_LOCATIONS);
  const [auditLogs, setAuditLogs] = useState<LocationAuditLog[]>(INITIAL_AUDIT_LOGS);

  // Toast 提示
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'warning' } | null>(null);
  const showToast = (text: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3800);
  };

  // 当前仓库对象
  const currentWarehouse = useMemo(() => {
    return MOCK_MANAGED_WAREHOUSES.find((w) => w.id === selectedWarehouseId) || MOCK_MANAGED_WAREHOUSES[0];
  }, [selectedWarehouseId]);

  // 列表筛选状态
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | LocationType>('ALL');
  const [temporaryFilter, setTemporaryFilter] = useState<'ALL' | 'TEMP_ONLY'>('ALL');

  // 当前仓库下的所有库位
  const warehouseLocations = useMemo(() => {
    return locations.filter((loc) => loc.warehouseId === selectedWarehouseId);
  }, [locations, selectedWarehouseId]);

  // 筛选后的库位列表
  const filteredLocations = useMemo(() => {
    return warehouseLocations.filter((loc) => {
      if (typeFilter !== 'ALL' && loc.type !== typeFilter) return false;
      if (temporaryFilter === 'TEMP_ONLY' && !loc.isTemporarySwitched) return false;
      if (searchKeyword.trim()) {
        const kw = searchKeyword.toLowerCase();
        return (
          loc.locationCode.toLowerCase().includes(kw) ||
          loc.rackCode.toLowerCase().includes(kw) ||
          (loc.boundSkuCode && loc.boundSkuCode.toLowerCase().includes(kw)) ||
          (loc.boundSkuName && loc.boundSkuName.toLowerCase().includes(kw))
        );
      }
      return true;
    });
  }, [warehouseLocations, typeFilter, temporaryFilter, searchKeyword]);

  // 统计指标
  const metrics = useMemo(() => {
    const total = warehouseLocations.length;
    const picking = warehouseLocations.filter((l) => l.type === 'PICKING').length;
    const reserve = warehouseLocations.filter((l) => l.type === 'RESERVE').length;
    const floor = warehouseLocations.filter((l) => l.type === 'FLOOR_STACK').length;
    const tempSwitched = warehouseLocations.filter((l) => l.isTemporarySwitched).length;
    const totalStock = warehouseLocations.reduce((sum, l) => sum + l.currentStock, 0);
    const totalCap = warehouseLocations.reduce((sum, l) => sum + l.maxCapacity, 0);
    const saturation = totalCap > 0 ? Math.round((totalStock / totalCap) * 100) : 0;

    return { total, picking, reserve, floor, tempSwitched, saturation };
  }, [warehouseLocations]);

  // ----------------------------------------------------
  // 1. 临时切换模态框 (大促/检修留痕)
  // ----------------------------------------------------
  const [switchModalLoc, setSwitchModalLoc] = useState<ManagedLocation | null>(null);
  const [switchReasonInput, setSwitchReasonInput] = useState<string>('大促爆发期拣选位紧张，临时将二层备货位扩充为拣货位');
  const [operatorInput, setOperatorInput] = useState<string>('李明 / 库管组长');

  const handleOpenSwitchModal = (loc: ManagedLocation) => {
    setSwitchModalLoc(loc);
    if (loc.isTemporarySwitched) {
      setSwitchReasonInput('大促/检修结束，切回复原为备货位');
    } else {
      setSwitchReasonInput('大促爆发期拣选位紧张，临时将备货位扩充为拣货位');
    }
  };

  const handleConfirmSwitch = () => {
    if (!switchModalLoc) return;
    const targetCode = switchModalLoc.locationCode;

    if (switchModalLoc.isTemporarySwitched) {
      // 业务结束切回
      const updated = locations.map((loc) => {
        if (loc.locationCode !== targetCode) return loc;
        return {
          ...loc,
          type: loc.originalType || 'RESERVE',
          logicalRole: loc.originalLogicalRole || 'RESERVE_LAYER',
          isTemporarySwitched: false,
          temporaryReason: undefined,
          switchedAt: undefined,
          switchedBy: undefined,
        };
      });
      setLocations(updated);

      // 记录留痕审计流水
      const newLog: LocationAuditLog = {
        id: `LOG-${Date.now()}`,
        locationCode: targetCode,
        warehouseId: currentWarehouse.id,
        warehouseName: currentWarehouse.name,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        operator: operatorInput || '系统调度员',
        actionType: 'RESTORE_TO_RESERVE',
        fromRole: '临时拣货位 (PICKING_LAYER)',
        toRole: '备货位 (RESERVE_LAYER)',
        reason: switchReasonInput || '大促结束复原',
      };
      setAuditLogs([newLog, ...auditLogs]);
      showToast(`已将库位 [${targetCode}] 切回复原为备货层，操作留痕已入库！`, 'info');
    } else {
      // 临时切换为拣选位
      const updated = locations.map((loc) => {
        if (loc.locationCode !== targetCode) return loc;
        return {
          ...loc,
          originalType: loc.type,
          originalLogicalRole: loc.logicalRole,
          type: 'PICKING' as LocationType,
          logicalRole: 'PICKING_LAYER' as LogicalRoleTag,
          isTemporarySwitched: true,
          temporaryReason: switchReasonInput,
          switchedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
          switchedBy: operatorInput,
        };
      });
      setLocations(updated);

      // 记录留痕审计流水
      const newLog: LocationAuditLog = {
        id: `LOG-${Date.now()}`,
        locationCode: targetCode,
        warehouseId: currentWarehouse.id,
        warehouseName: currentWarehouse.name,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        operator: operatorInput || '系统调度员',
        actionType: 'SWITCH_TO_PICKING',
        fromRole: `${switchModalLoc.physicalLevel}层备货位 (RESERVE_LAYER)`,
        toRole: '临时拣货位 (PICKING_LAYER)',
        reason: switchReasonInput,
      };
      setAuditLogs([newLog, ...auditLogs]);
      showToast(`库位 [${targetCode}] 已成功临时切换为【拣货位】，操作日志已永久留痕！`, 'success');
    }

    setSwitchModalLoc(null);
  };

  // ----------------------------------------------------
  // 2. 单库位手动调整模态框
  // ----------------------------------------------------
  const [editingLoc, setEditingLoc] = useState<ManagedLocation | null>(null);
  const [editType, setEditType] = useState<LocationType>('PICKING');
  const [editLogicalRole, setEditLogicalRole] = useState<LogicalRoleTag>('PICKING_LAYER');
  const [editMaxCapacity, setEditMaxCapacity] = useState<number>(500);

  const handleOpenEditModal = (loc: ManagedLocation) => {
    setEditingLoc(loc);
    setEditType(loc.type);
    setEditLogicalRole(loc.logicalRole);
    setEditMaxCapacity(loc.maxCapacity);
  };

  const handleSaveEditLocation = () => {
    if (!editingLoc) return;

    // 地堆类型特殊约束：地堆托盘库位标记为地堆类型，不参与拣货/备货层配置
    let finalLogicalRole = editLogicalRole;
    if (editType === 'FLOOR_STACK') {
      finalLogicalRole = 'NONE';
    }

    const updated = locations.map((loc) => {
      if (loc.id !== editingLoc.id) return loc;
      return {
        ...loc,
        type: editType,
        logicalRole: finalLogicalRole,
        maxCapacity: editMaxCapacity,
      };
    });
    setLocations(updated);

    const newLog: LocationAuditLog = {
      id: `LOG-${Date.now()}`,
      locationCode: editingLoc.locationCode,
      warehouseId: currentWarehouse.id,
      warehouseName: currentWarehouse.name,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      operator: '管理员 (手动调整)',
      actionType: 'MANUAL_EDIT',
      fromRole: `${editingLoc.type} | 容量 ${editingLoc.maxCapacity}`,
      toRole: `${editType} | 容量 ${editMaxCapacity}`,
      reason: '单库位手动维护属性与容量上限',
    };
    setAuditLogs([newLog, ...auditLogs]);

    showToast(`库位 [${editingLoc.locationCode}] 配置已更新！`, 'success');
    setEditingLoc(null);
  };

  // ----------------------------------------------------
  // 3. 货架批量配置
  // ----------------------------------------------------
  const availableRacks = useMemo(() => {
    const set = new Set<string>();
    warehouseLocations.forEach((l) => {
      if (l.rackCode && !l.rackCode.includes('FP')) {
        set.add(l.rackCode);
      }
    });
    return Array.from(set);
  }, [warehouseLocations]);

  const [selectedBatchRack, setSelectedBatchRack] = useState<string>(availableRacks[0] || 'HH-1-A01');

  const handleApplyRackBatchConfig = () => {
    if (!selectedBatchRack) return;

    const updated = locations.map((loc) => {
      if (loc.warehouseId !== selectedWarehouseId || loc.rackCode !== selectedBatchRack) {
        return loc;
      }
      // 业务口径：第 1 层 = 拣货位，二层及以上 = 备货位
      const role = getDefaultRoleByLevel(loc.physicalLevel, false);
      return {
        ...loc,
        type: role.type,
        logicalRole: role.logicalRole,
        isTemporarySwitched: false,
      };
    });

    setLocations(updated);

    const newLog: LocationAuditLog = {
      id: `LOG-${Date.now()}`,
      locationCode: `${selectedBatchRack} 全架`,
      warehouseId: currentWarehouse.id,
      warehouseName: currentWarehouse.name,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      operator: '货架批量标定',
      actionType: 'BATCH_CONFIG',
      fromRole: '常规分布',
      toRole: '一层拣货位，二三层备货位',
      reason: `按货架批量执行「一层拣货位，二三层备货位」标准标定`,
    };
    setAuditLogs([newLog, ...auditLogs]);

    showToast(`货架 [${selectedBatchRack}] 已批量标定为【一层拣货位，二三层备货位】！`, 'success');
  };

  // ----------------------------------------------------
  // 4. Excel 批量导入模拟
  // ----------------------------------------------------
  const sampleImportRawData = `HH1A0301,拣货位,500,SKU-006,百事无糖可乐
HH1A0302,备货位,1200,SKU-006,百事无糖可乐
HH1A0303,备货位,1200,SKU-006,百事无糖可乐
HH1FP003,地堆,25,SKU-006,百事无糖可乐(整托)
HH1A01B1,拣货位,600,SKU-001,重复编码测试行
BAD_CODE_99,非法位,300,,非法编码测试行`;

  const [importText, setImportText] = useState<string>(sampleImportRawData);
  const [importAuditRows, setImportAuditRows] = useState<
    Array<{
      code: string;
      type: string;
      capacity: number;
      sku: string;
      skuName: string;
      status: 'VALID' | 'DUPLICATE' | 'INVALID_CODE' | 'INVALID_TYPE';
      errorMsg?: string;
    }>
  >([]);

  const handleValidateImport = () => {
    const lines = importText.trim().split('\n');
    const existingCodes = new Set(warehouseLocations.map((l) => l.locationCode));
    const currentBatchCodes = new Set<string>();

    const audited = lines.map((line) => {
      const parts = line.split(',').map((p) => p.trim());
      const code = parts[0] || '';
      const typeStr = parts[1] || '';
      const capacity = parseInt(parts[2]) || 500;
      const sku = parts[3] || '';
      const skuName = parts[4] || '';

      const codeCheck = parseLocationCode(code);
      if (!codeCheck.isValid) {
        return {
          code,
          type: typeStr,
          capacity,
          sku,
          skuName,
          status: 'INVALID_CODE' as const,
          errorMsg: codeCheck.error || '编码不符合规范 (需8位大写)',
        };
      }

      if (!['拣货位', '备货位', '地堆'].includes(typeStr)) {
        return {
          code,
          type: typeStr,
          capacity,
          sku,
          skuName,
          status: 'INVALID_TYPE' as const,
          errorMsg: `非法库位类型 [${typeStr}]，仅支持「拣货位」「备货位」「地堆」`,
        };
      }

      if (existingCodes.has(code) || currentBatchCodes.has(code)) {
        return {
          code,
          type: typeStr,
          capacity,
          sku,
          skuName,
          status: 'DUPLICATE' as const,
          errorMsg: `编码唯一性校验失败：库位编码 [${code}] 已存在于本仓`,
        };
      }

      currentBatchCodes.add(code);
      return {
        code,
        type: typeStr,
        capacity,
        sku,
        skuName,
        status: 'VALID' as const,
      };
    });

    setImportAuditRows(audited);
  };

  const handleConfirmExecuteImport = () => {
    const validRows = importAuditRows.filter((r) => r.status === 'VALID');
    if (validRows.length === 0) {
      showToast('未检测到可导入的合法行，请先校验并修正错误行！', 'warning');
      return;
    }

    const newLocs: ManagedLocation[] = validRows.map((r, idx) => {
      const breakdown = parseLocationCode(r.code);
      const isFloor = r.type === '地堆';
      const levelNum = isFloor ? 0 : parseInt(breakdown.shelfLevel) || 1;
      const roleInfo = getDefaultRoleByLevel(levelNum, isFloor);

      return {
        id: `LOC-IMP-${Date.now()}-${idx}`,
        warehouseId: selectedWarehouseId,
        warehouseCode: currentWarehouse.code,
        locationCode: r.code,
        floor: parseInt(breakdown.floor) || 1,
        aisle: breakdown.aisle,
        col: breakdown.col,
        shelfLevel: breakdown.shelfLevel,
        physicalLevel: levelNum,
        type: isFloor ? 'FLOOR_STACK' : r.type === '拣货位' ? 'PICKING' : 'RESERVE',
        logicalRole: roleInfo.logicalRole,
        isTemporarySwitched: false,
        maxCapacity: r.capacity,
        currentStock: 0,
        unit: isFloor ? '托' : '件',
        boundSkuCode: r.sku,
        boundSkuName: r.skuName,
        rackCode: `${currentWarehouse.code}-${breakdown.floor}-${breakdown.aisle}`,
        status: 'EMPTY',
      };
    });

    setLocations([...locations, ...newLocs]);
    showToast(`成功批量导入 ${validRows.length} 个新库位至 [${currentWarehouse.name}]！`, 'success');
    setImportAuditRows([]);
    setActiveSubTab('LIST');
  };

  // ----------------------------------------------------
  // 5. 库位容量超限与溢出补货试算
  // ----------------------------------------------------
  const [testLocCode, setTestLocCode] = useState<string>(
    warehouseLocations.find((l) => l.type === 'PICKING')?.locationCode || 'HH1A01B1'
  );
  const [testReplenishQty, setTestReplenishQty] = useState<number>(300);
  const [overflowResult, setOverflowResult] = useState<CapacityOverflowTestResult | null>(null);

  const handleRunOverflowTest = () => {
    const loc = warehouseLocations.find((l) => l.locationCode === testLocCode);
    if (!loc) {
      showToast('未找到指定测试库位！', 'warning');
      return;
    }
    const res = calculateCapacityOverflow(loc, testReplenishQty);
    setOverflowResult(res);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Toast Notice */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border text-xs font-semibold flex items-center gap-2 animate-fade-in ${
            toastMessage.type === 'success'
              ? 'bg-emerald-900 text-white border-emerald-700'
              : toastMessage.type === 'warning'
              ? 'bg-amber-900 text-white border-amber-700'
              : 'bg-slate-900 text-white border-slate-700'
          }`}
        >
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Header & Warehouse Isolation Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>仓储中台</span>
            <span>&gt;</span>
            <span className="text-slate-800 font-bold">库位管理中心</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              库位管理与容量管控调度中心
            </h1>
            <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-full font-mono font-bold">
              分仓独立权限
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            支持「拣货位」「备货位」「地堆」三类标识；物理层与逻辑层解耦（1层默认拣货层，二三层备货层）；支持大促检修临时切换留痕与容量超限溢出派单。
          </p>
        </div>

        {/* 仓库选择器 (分仓独立) */}
        <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs">
          <Building2 className="w-4 h-4 text-blue-600 shrink-0 ml-1" />
          <span className="text-xs font-bold text-slate-700">当前仓库:</span>
          <select
            value={selectedWarehouseId}
            onChange={(e) => setSelectedWarehouseId(e.target.value)}
            className="text-xs font-bold text-slate-800 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 focus:outline-none cursor-pointer"
          >
            {MOCK_MANAGED_WAREHOUSES.map((wh) => (
              <option key={wh.id} value={wh.id}>
                {wh.name} ({wh.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Stats Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-400 font-semibold block">全部库位总数</span>
          <span className="text-xl font-black font-mono text-slate-900 mt-1 block">
            {metrics.total}
          </span>
          <span className="text-[10px] text-slate-500">{currentWarehouse.code}仓实盘储位</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-blue-200/80 shadow-2xs">
          <span className="text-[11px] text-blue-600 font-semibold block flex items-center justify-between">
            <span>拣货位 (1层)</span>
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          </span>
          <span className="text-xl font-black font-mono text-blue-700 mt-1 block">
            {metrics.picking}
          </span>
          <span className="text-[10px] text-slate-500">件数容量严控</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-semibold block flex items-center justify-between">
            <span>备货位 (2/3层)</span>
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
          </span>
          <span className="text-xl font-black font-mono text-slate-800 mt-1 block">
            {metrics.reserve}
          </span>
          <span className="text-[10px] text-slate-500">高位立体备库</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-emerald-200/80 shadow-2xs">
          <span className="text-[11px] text-emerald-600 font-semibold block flex items-center justify-between">
            <span>地堆托盘位</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </span>
          <span className="text-xl font-black font-mono text-emerald-700 mt-1 block">
            {metrics.floor}
          </span>
          <span className="text-[10px] text-emerald-600">整托·不参与拣备</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-amber-200/80 shadow-2xs">
          <span className="text-[11px] text-amber-700 font-semibold block flex items-center justify-between">
            <span>临时切换中</span>
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          </span>
          <span className="text-xl font-black font-mono text-amber-600 mt-1 block">
            {metrics.tempSwitched}
          </span>
          <span className="text-[10px] text-amber-700">大促留痕备货转拣选</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-400 font-semibold block">容量综合饱和度</span>
          <span className="text-xl font-black font-mono text-slate-900 mt-1 block">
            {metrics.saturation}%
          </span>
          <div className="w-full bg-slate-100 h-1 rounded-full mt-1 overflow-hidden">
            <div
              className={`h-full ${
                metrics.saturation > 85 ? 'bg-red-500' : metrics.saturation > 65 ? 'bg-amber-500' : 'bg-blue-600'
              }`}
              style={{ width: `${Math.min(100, metrics.saturation)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveSubTab('LIST')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'LIST'
              ? 'bg-blue-600 text-white shadow-sm font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>库位总览与容量监控 ({filteredLocations.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('BATCH')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'BATCH'
              ? 'bg-blue-600 text-white shadow-sm font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Workflow className="w-4 h-4" />
          <span>货架批量配置 (1层拣选/23层备货)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('OVERFLOW')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'OVERFLOW'
              ? 'bg-blue-600 text-white shadow-sm font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Gauge className="w-4 h-4" />
          <span>库位容量超限与溢出任务试算</span>
        </button>

        <button
          onClick={() => setActiveSubTab('IMPORT')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'IMPORT'
              ? 'bg-blue-600 text-white shadow-sm font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Excel 批量导入与唯一性核验</span>
        </button>

        <button
          onClick={() => setActiveSubTab('LOGS')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'LOGS'
              ? 'bg-blue-600 text-white shadow-sm font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <History className="w-4 h-4" />
          <span>临时切换留痕与操作流水 ({auditLogs.length})</span>
        </button>
      </div>

      {/* ============================================================ */}
      {/* 1. 库位列表与容量监控 (TAB: LIST) */}
      {/* ============================================================ */}
      {activeSubTab === 'LIST' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-slate-600">库位类型:</span>
              <button
                onClick={() => setTypeFilter('ALL')}
                className={`px-3 py-1 rounded-lg cursor-pointer font-medium ${
                  typeFilter === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                全部 ({warehouseLocations.length})
              </button>
              <button
                onClick={() => setTypeFilter('PICKING')}
                className={`px-3 py-1 rounded-lg cursor-pointer font-medium ${
                  typeFilter === 'PICKING' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
              >
                拣货位 ({warehouseLocations.filter((l) => l.type === 'PICKING').length})
              </button>
              <button
                onClick={() => setTypeFilter('RESERVE')}
                className={`px-3 py-1 rounded-lg cursor-pointer font-medium ${
                  typeFilter === 'RESERVE' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                备货位 ({warehouseLocations.filter((l) => l.type === 'RESERVE').length})
              </button>
              <button
                onClick={() => setTypeFilter('FLOOR_STACK')}
                className={`px-3 py-1 rounded-lg cursor-pointer font-medium ${
                  typeFilter === 'FLOOR_STACK'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                地堆 ({warehouseLocations.filter((l) => l.type === 'FLOOR_STACK').length})
              </button>

              <span className="text-slate-300">|</span>

              <button
                onClick={() => setTemporaryFilter((prev) => (prev === 'ALL' ? 'TEMP_ONLY' : 'ALL'))}
                className={`px-3 py-1 rounded-lg cursor-pointer font-medium flex items-center gap-1 ${
                  temporaryFilter === 'TEMP_ONLY'
                    ? 'bg-amber-500 text-white'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                <span>🔥 临时大促/检修切换中</span>
                {metrics.tempSwitched > 0 && (
                  <span className="bg-amber-600 text-white text-[10px] px-1 rounded-full font-mono">
                    {metrics.tempSwitched}
                  </span>
                )}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="搜索库位编码 (如 HH1A01B1) / SKU..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs w-64 focus:outline-none focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Location Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 text-slate-600 font-semibold border-b border-slate-200">
                    <th className="p-3">库位编码 (推荐规范)</th>
                    <th className="p-3">库位类型</th>
                    <th className="p-3">物理层 vs 业务逻辑层</th>
                    <th className="p-3">容量管控 (件/托)</th>
                    <th className="p-3">同架绑定 SKU</th>
                    <th className="p-3">所属货架</th>
                    <th className="p-3 text-center">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLocations.map((loc) => {
                    const breakdown = parseLocationCode(loc.locationCode);
                    const usagePercent =
                      loc.maxCapacity > 0 ? Math.round((loc.currentStock / loc.maxCapacity) * 100) : 0;
                    const isNearFull = usagePercent >= 90;

                    return (
                      <tr key={loc.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* 库位编码 */}
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-sm text-slate-900 tracking-tight">
                              {loc.locationCode}
                            </span>
                            {loc.isTemporarySwitched && (
                              <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded animate-pulse">
                                临时切换
                              </span>
                            )}
                          </div>
                          {breakdown.isValid && (
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {breakdown.warehouseCode}仓 · {breakdown.floor}楼 · {breakdown.aisle}通道 · {breakdown.col}列 · {breakdown.shelfLevel}层
                            </div>
                          )}
                        </td>

                        {/* 库位类型 */}
                        <td className="p-3">
                          <span
                            className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full ${
                              loc.type === 'PICKING'
                                ? 'bg-blue-100 text-blue-800'
                                : loc.type === 'RESERVE'
                                ? 'bg-slate-100 text-slate-700'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {loc.type === 'PICKING' ? '拣货位' : loc.type === 'RESERVE' ? '备货位' : '地堆'}
                          </span>
                        </td>

                        {/* 物理层 vs 业务逻辑层 */}
                        <td className="p-3">
                          <div className="space-y-0.5">
                            <div className="text-[11px] font-bold text-slate-800">
                              {loc.type === 'FLOOR_STACK' ? (
                                <span className="text-emerald-700 font-mono">地堆托盘位 (不参与分层)</span>
                              ) : (
                                <span>
                                  {loc.logicalRole === 'PICKING_LAYER' ? '1层·拣货层' : `${loc.physicalLevel}层·备货层`}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              物理层数: {loc.type === 'FLOOR_STACK' ? '平铺' : `${loc.physicalLevel}层`}
                            </div>
                          </div>
                        </td>

                        {/* 容量管控 */}
                        <td className="p-3">
                          <div className="w-36 space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-mono font-bold text-slate-800">
                                {loc.currentStock} / {loc.maxCapacity} {loc.unit}
                              </span>
                              <span
                                className={`text-[10px] font-mono font-bold ${
                                  isNearFull ? 'text-red-600' : 'text-slate-500'
                                }`}
                              >
                                {usagePercent}%
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${
                                  isNearFull ? 'bg-red-500' : usagePercent > 70 ? 'bg-amber-500' : 'bg-blue-600'
                                }`}
                                style={{ width: `${Math.min(100, usagePercent)}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>

                        {/* 同架绑定 SKU */}
                        <td className="p-3">
                          {loc.boundSkuCode ? (
                            <div>
                              <span className="font-mono font-bold text-slate-800 text-[11px]">
                                {loc.boundSkuCode}
                              </span>
                              <p className="text-[11px] text-slate-500 line-clamp-1 max-w-[160px]">
                                {loc.boundSkuName}
                              </p>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px]">未绑定 (空闲)</span>
                          )}
                        </td>

                        {/* 所属货架 */}
                        <td className="p-3 font-mono text-slate-600 text-[11px]">
                          {loc.rackCode}
                        </td>

                        {/* 操作 */}
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* 单库位编辑 */}
                            <button
                              onClick={() => handleOpenEditModal(loc)}
                              className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                              title="手动调整库位类型/逻辑层/容量"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* 临时切换 / 切回按钮 (非地堆) */}
                            {loc.type !== 'FLOOR_STACK' && (
                              <button
                                onClick={() => handleOpenSwitchModal(loc)}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                                  loc.isTemporarySwitched
                                    ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                                    : 'bg-amber-100 hover:bg-amber-200 text-amber-800'
                                }`}
                                title={
                                  loc.isTemporarySwitched
                                    ? '业务结束切回备货层'
                                    : '大促/检修临时切换为拣货层(带日志留痕)'
                                }
                              >
                                <ArrowRightLeft className="w-3 h-3" />
                                <span>{loc.isTemporarySwitched ? '切回复原' : '临时转拣货'}</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. 货架批量配置 (TAB: BATCH) */}
      {/* ============================================================ */}
      {activeSubTab === 'BATCH' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Workflow className="w-5 h-5 text-blue-600" />
                <span>货架批量标定策略：一层拣货位，二三层备货位</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                支持按整架一键标定「第 1 层 = 拣货位，二层及以上 = 备货位」业务口径，解耦物理层数，同时支持逐个库位自主微调。
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-700">目标货架:</span>
              <select
                value={selectedBatchRack}
                onChange={(e) => setSelectedBatchRack(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold font-mono focus:outline-none cursor-pointer"
              >
                {availableRacks.map((rack) => (
                  <option key={rack} value={rack}>
                    {rack} 货架组
                  </option>
                ))}
              </select>
              <button
                onClick={handleApplyRackBatchConfig}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>一键应用批量标定</span>
              </button>
            </div>
          </div>

          {/* Current Shelf Breakdown Visualizer */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700">
              当前 [{selectedBatchRack}] 货架各层库位预览与实时属性：
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {warehouseLocations
                .filter((l) => l.rackCode === selectedBatchRack)
                .map((loc) => (
                  <div
                    key={loc.id}
                    className={`p-4 rounded-xl border transition-all ${
                      loc.type === 'PICKING'
                        ? 'bg-blue-50/60 border-blue-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-bold text-sm text-slate-900">
                        {loc.locationCode}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          loc.type === 'PICKING'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {loc.type === 'PICKING' ? '拣货位 (1层)' : `${loc.physicalLevel}层·备货位`}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 space-y-1">
                      <div>业务口径: {loc.logicalRole}</div>
                      <div>件数容量上限: {loc.maxCapacity} {loc.unit}</div>
                      <div>绑定SKU: {loc.boundSkuCode || '无'}</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. 库位容量超限与溢出补货试算 (TAB: OVERFLOW) */}
      {/* ============================================================ */}
      {activeSubTab === 'OVERFLOW' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div>
              <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded font-mono">
                CAPACITY CONTROL & OVERFLOW ENGINE
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-1">
                库位容量超限与溢出补货试算台
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                拣货位配置最大件数容量；补货时目标库<strong>剩余容量＜待补数量</strong>，按剩余容量补货，剩余数量自动生成独立溢出任务。
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-slate-600 font-bold block mb-1">测试目标拣货位:</label>
                <select
                  value={testLocCode}
                  onChange={(e) => setTestLocCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800"
                >
                  {warehouseLocations
                    .filter((l) => l.type === 'PICKING')
                    .map((l) => (
                      <option key={l.id} value={l.locationCode}>
                        {l.locationCode} (上限: {l.maxCapacity}件 | 现有: {l.currentStock}件 | 剩余: {l.maxCapacity - l.currentStock}件)
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-slate-600 font-bold block mb-1">待补数量 (件):</label>
                <input
                  type="number"
                  min="10"
                  max="2000"
                  step="10"
                  value={testReplenishQty}
                  onChange={(e) => setTestReplenishQty(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800"
                />
              </div>

              <button
                onClick={handleRunOverflowTest}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl shadow-sm cursor-pointer transition-colors flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4 text-amber-300" />
                <span>执行容量校验与溢出试算</span>
              </button>
            </div>
          </div>

          {/* Test Results Output */}
          <div className="lg:col-span-7 space-y-4">
            {overflowResult ? (
              <div
                className={`p-6 rounded-2xl border transition-all ${
                  overflowResult.isOverflowTriggered
                    ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-200'
                    : 'bg-emerald-50/70 border-emerald-300'
                }`}
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <span className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    {overflowResult.isOverflowTriggered ? (
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    )}
                    <span>
                      {overflowResult.isOverflowTriggered ? '触发容量截流与溢出派单' : '库位容量充足·全额补入'}
                    </span>
                  </span>
                  <span
                    className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full ${
                      overflowResult.isOverflowTriggered
                        ? 'bg-amber-200 text-amber-900'
                        : 'bg-emerald-200 text-emerald-900'
                    }`}
                  >
                    {overflowResult.isOverflowTriggered ? 'OVERFLOW_SPLIT' : 'DIRECT_ACCEPT'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 my-4 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-400 block">目标位剩余容量</span>
                    <span className="font-mono font-black text-slate-800 text-lg">
                      {overflowResult.remainingCapacity} 件
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-blue-200 text-center">
                    <span className="text-[10px] text-blue-600 block">实际补入目标位</span>
                    <span className="font-mono font-black text-blue-700 text-lg">
                      {overflowResult.actualAcceptedQty} 件
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-red-200 text-center">
                    <span className="text-[10px] text-red-600 block">溢出剥离任务量</span>
                    <span className="font-mono font-black text-red-600 text-lg">
                      {overflowResult.overflowQty} 件
                    </span>
                  </div>
                </div>

                {/* Log & Task Detail */}
                <div className="text-xs space-y-2 bg-white p-4 rounded-xl border border-slate-200">
                  <div className="font-bold text-slate-800">系统调度决策日志：</div>
                  <p className="text-[11px] text-slate-600 leading-relaxed font-mono">
                    {overflowResult.logMessage}
                  </p>

                  {overflowResult.isOverflowTriggered && (
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] font-mono">
                      <span>
                        溢出任务单号: <strong className="text-indigo-600">{overflowResult.overflowTaskId}</strong>
                      </span>
                      <span>
                        溢出暂存库位: <strong className="text-slate-800">{overflowResult.overflowBufferLocationCode}</strong>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
                <Gauge className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <span>请在左侧选择测试库位并输入待补数量，点击执行容量试算。</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. Excel 批量导入 (TAB: IMPORT) */}
      {/* ============================================================ */}
      {activeSubTab === 'IMPORT' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <span>Excel 模板批量导入与唯一性合法性校验</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                支持批量导入标准编码库位；系统自动校验<strong>编码唯一性 (防重)</strong> 与 <strong>库位类型合法性</strong>。
              </p>
            </div>

            <button
              onClick={() => {
                const csvContent =
                  'data:text/csv;charset=utf-8,库位编码,库位类型,最大容量件数,绑定SKU,品名\nHH1A0301,拣货位,500,SKU-006,百事可乐\nHH1A0302,备货位,1200,SKU-006,百事可乐\nHH1FP003,地堆,25,SKU-006,百事可乐整托\n';
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement('a');
                link.setAttribute('href', encodedUri);
                link.setAttribute('download', `WMS库位导入标准模板_${currentWarehouse.code}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                showToast('已下载标准 Excel / CSV 导入模板！', 'success');
              }}
              className="flex items-center gap-1.5 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-300 font-semibold cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>下载 Excel 模板</span>
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <label className="font-bold text-slate-700 block">
              粘贴或编辑待导入数据 (格式: 库位编码, 库位类型, 最大容量件数, 绑定SKU, 商品名称):
            </label>
            <textarea
              rows={6}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 font-mono text-xs focus:outline-none focus:bg-white"
            />
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                推荐编码格式：{currentWarehouse.code}1A01B1 (8位大写) · 类型仅支持「拣货位」「备货位」「地堆」
              </span>
              <button
                onClick={handleValidateImport}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-1.5 rounded-xl cursor-pointer text-xs flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>运行合规性与唯一性校验</span>
              </button>
            </div>
          </div>

          {/* Audit Verification Table */}
          {importAuditRows.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-800">
                  导入预检核验报告 (有效: {importAuditRows.filter((r) => r.status === 'VALID').length} / 总计: {importAuditRows.length})
                </span>
                <button
                  onClick={handleConfirmExecuteImport}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-1.5 rounded-xl cursor-pointer text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <Upload className="w-4 h-4" />
                  <span>确认写入有效库位</span>
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-600 font-semibold">
                    <tr>
                      <th className="p-2.5">库位编码</th>
                      <th className="p-2.5">类型</th>
                      <th className="p-2.5">容量件数</th>
                      <th className="p-2.5">绑定SKU</th>
                      <th className="p-2.5">校验结果</th>
                      <th className="p-2.5">详情说明</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {importAuditRows.map((r, i) => (
                      <tr key={i} className={r.status === 'VALID' ? 'bg-emerald-50/40' : 'bg-red-50/50'}>
                        <td className="p-2.5 font-mono font-bold text-slate-800">{r.code}</td>
                        <td className="p-2.5">{r.type}</td>
                        <td className="p-2.5 font-mono">{r.capacity}</td>
                        <td className="p-2.5 font-mono">{r.sku || '-'}</td>
                        <td className="p-2.5">
                          {r.status === 'VALID' ? (
                            <span className="text-emerald-700 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>校验通过</span>
                            </span>
                          ) : (
                            <span className="text-red-700 font-bold flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>校验拦截</span>
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 text-slate-600 text-[11px]">{r.errorMsg || '合规'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* 5. 临时切换留痕与操作流水 (TAB: LOGS) */}
      {/* ============================================================ */}
      {activeSubTab === 'LOGS' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600" />
                <span>大促检修临时切换与配置变更审计追溯流水 (操作留痕)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                记录备货层临时转拣货层、业务结束切回复原、容量阈值变更与货架批量标定的全量操作留痕日志。
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="p-3">时间戳</th>
                  <th className="p-3">目标库位 / 货架</th>
                  <th className="p-3">所属仓库</th>
                  <th className="p-3">操作动作</th>
                  <th className="p-3">变更前 &rarr; 变更后</th>
                  <th className="p-3">操作人员</th>
                  <th className="p-3">业务背景与留痕原因</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                      {log.timestamp}
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-900">{log.locationCode}</td>
                    <td className="p-3 font-medium text-slate-700">{log.warehouseName}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                          log.actionType === 'SWITCH_TO_PICKING'
                            ? 'bg-amber-100 text-amber-800'
                            : log.actionType === 'RESTORE_TO_RESERVE'
                            ? 'bg-blue-100 text-blue-800'
                            : log.actionType === 'BATCH_CONFIG'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {log.actionType}
                      </span>
                    </td>
                    <td className="p-3 text-[11px]">
                      <span className="text-slate-400">{log.fromRole}</span>
                      <span className="mx-1 text-slate-400">&rarr;</span>
                      <span className="font-bold text-slate-800">{log.toRole}</span>
                    </td>
                    <td className="p-3 font-semibold text-slate-700">{log.operator}</td>
                    <td className="p-3 text-slate-600 text-[11px]">{log.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 模态框 1: 临时切换留痕确认 */}
      {/* ============================================================ */}
      {switchModalLoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-fade-in border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 font-bold text-base text-slate-900">
                <ArrowRightLeft className="w-5 h-5 text-amber-600" />
                <span>
                  {switchModalLoc.isTemporarySwitched ? '业务结束：切回复原为备货位' : '大促/检修：临时切换为拣货位'}
                </span>
              </div>
              <button
                onClick={() => setSwitchModalLoc(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
              <div>
                目标库位: <strong className="font-mono text-slate-900">{switchModalLoc.locationCode}</strong>
              </div>
              <div>
                当前属性:{' '}
                <span className="font-bold text-slate-700">
                  {switchModalLoc.type === 'PICKING' ? '拣货位' : '备货位'} ({switchModalLoc.physicalLevel}层)
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">操作人 / 岗位:</label>
                <input
                  type="text"
                  value={operatorInput}
                  onChange={(e) => setOperatorInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">切换原因 (审计留痕备案):</label>
                <textarea
                  rows={3}
                  value={switchReasonInput}
                  onChange={(e) => setSwitchReasonInput(e.target.value)}
                  placeholder="请输入临时调整原因，例如：双11大促爆单期备货激增扩充拣货区 / 1层升降机故障检修..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setSwitchModalLoc(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleConfirmSwitch}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-5 py-2 rounded-xl cursor-pointer shadow-sm"
              >
                确认执行并留痕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 模态框 2: 单库位属性手动调整 */}
      {/* ============================================================ */}
      {editingLoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fade-in border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-600" />
                <span>编辑库位属性: {editingLoc.locationCode}</span>
              </div>
              <button
                onClick={() => setEditingLoc(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">库位类型:</label>
                <select
                  value={editType}
                  onChange={(e) => setEditType(e.target.value as LocationType)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                >
                  <option value="PICKING">拣货位 (PICKING)</option>
                  <option value="RESERVE">备货位 (RESERVE)</option>
                  <option value="FLOOR_STACK">地堆 (FLOOR_STACK - 不参与拣/备)</option>
                </select>
              </div>

              {editType !== 'FLOOR_STACK' && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">逻辑层可选标签:</label>
                  <select
                    value={editLogicalRole}
                    onChange={(e) => setEditLogicalRole(e.target.value as LogicalRoleTag)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  >
                    <option value="PICKING_LAYER">拣货层 (PICKING_LAYER)</option>
                    <option value="RESERVE_LAYER">备货层 (RESERVE_LAYER)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  最大容量 ({editType === 'FLOOR_STACK' ? '托' : '件'}):
                </label>
                <input
                  type="number"
                  value={editMaxCapacity}
                  onChange={(e) => setEditMaxCapacity(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setEditingLoc(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleSaveEditLocation}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2 rounded-xl cursor-pointer shadow-sm"
              >
                保存修改
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
