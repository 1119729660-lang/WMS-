import React, { useState, useMemo } from 'react';
import {
  Layers,
  ArrowRightLeft,
  Search,
  Building2,
  Edit3,
  X,
  History,
} from 'lucide-react';
import {
  ManagedLocation,
  LocationAuditLog,
  LocationType,
  LogicalRoleTag,
} from '../../types/locationManager';
import {
  MOCK_MANAGED_WAREHOUSES,
  INITIAL_MANAGED_LOCATIONS,
  INITIAL_AUDIT_LOGS,
} from '../../data/mockLocationManagerData';
import {
  parseLocationCode,
} from '../../utils/locationCodeHelper';

export const LocationManagerPage: React.FC = () => {
  // 分仓独立选择
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('WH-03'); // 默认黑河仓 (HH)
  const [activeSubTab, setActiveSubTab] = useState<'LIST' | 'LOGS'>('LIST');

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
      {/* 2. 临时切换留痕与操作流水 (TAB: LOGS) */}
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
