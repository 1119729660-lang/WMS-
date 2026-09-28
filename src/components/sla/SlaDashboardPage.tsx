import React, { useState, useMemo } from 'react';
import {
  Layers,
  Activity,
  CheckCircle2,
  AlertCircle,
  Settings,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  SlaTimeDimension,
  SlaDelayFilter,
  SlaSystemConfig,
  SlaOrderRecord,
} from '../../types/sla';
import {
  DEFAULT_SLA_CONFIG,
  MOCK_SLA_WAREHOUSES,
  RAW_SLA_ORDERS,
  calculateWarehouseSlaMetrics,
  generateSlaTrendData,
  evaluateOrdersWithConfig,
} from '../../data/mockSlaData';
import { WarehouseSlaCards } from './WarehouseSlaCards';
import { SlaFilterBar } from './SlaFilterBar';
import { SlaNodePivotTable } from './SlaNodePivotTable';
import { SlaTrendChart } from './SlaTrendChart';
import { SlaOrderTable } from './SlaOrderTable';
import { SlaConfigPage } from './SlaConfigPage';

export const SlaDashboardPage: React.FC = () => {
  // Config state
  const [config, setConfig] = useState<SlaSystemConfig>(DEFAULT_SLA_CONFIG);

  // Sub-view mode: 'dashboard' or 'config_page'
  const [viewMode, setViewMode] = useState<'dashboard' | 'config_page'>(
    'dashboard'
  );

  // Filters
  const [timeDimension, setTimeDimension] = useState<SlaTimeDimension>('day');
  const [selectedDate, setSelectedDate] = useState<string>('2026-09-23');
  const [selectedWeek, setSelectedWeek] = useState<string>('第39周');
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-09');

  // Warehouse Multi-select: default empty (meaning all)
  const [selectedWarehouseIds, setSelectedWarehouseIds] = useState<string[]>([]);

  // Warehouse Card Single Selected/Focused: default first warehouse WH-01
  const [cardSelectedWarehouseId, setCardSelectedWarehouseId] = useState<
    string | null
  >(MOCK_SLA_WAREHOUSES[0].id);

  // Delay filter: 'ALL' | 'DELAYED' | 'ON_TIME'
  const [delayFilter, setDelayFilter] = useState<SlaDelayFilter>('ALL');

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Recompute evaluated orders based on current config
  const allEvaluatedOrders = useMemo(() => {
    return evaluateOrdersWithConfig(RAW_SLA_ORDERS, config);
  }, [config]);

  // 2. Filter orders by multi-select warehouses if active
  const ordersAfterWarehouseFilter = useMemo(() => {
    if (selectedWarehouseIds.length === 0) return allEvaluatedOrders;
    return allEvaluatedOrders.filter((o) =>
      selectedWarehouseIds.includes(o.warehouseId)
    );
  }, [allEvaluatedOrders, selectedWarehouseIds]);

  // 3. Compute Warehouse Metrics
  const warehouseMetrics = useMemo(() => {
    return calculateWarehouseSlaMetrics(ordersAfterWarehouseFilter, config);
  }, [ordersAfterWarehouseFilter, config]);

  // 4. Effective Focused Warehouse (cardSelectedWarehouseId takes precedence if chosen)
  const effectiveWarehouseId = cardSelectedWarehouseId;

  // Toggle selection on warehouse card: click to select, click again to unselect
  const handleToggleCardSelectWarehouse = (whId: string) => {
    if (cardSelectedWarehouseId === whId) {
      setCardSelectedWarehouseId(null);
      showToast('已取消仓库聚焦，恢复展示全仓综合时效数据');
    } else {
      setCardSelectedWarehouseId(whId);
      const wh = MOCK_SLA_WAREHOUSES.find((w) => w.id === whId);
      showToast(`已聚焦并筛选仓库：[${wh?.name || whId}]`);
    }
  };

  // Generate trend points for current time dimension
  const trendData = useMemo(() => {
    return generateSlaTrendData(timeDimension);
  }, [timeDimension]);

  const focusedWarehouseName = MOCK_SLA_WAREHOUSES.find(
    (w) => w.id === effectiveWarehouseId
  )?.name;

  // If in config page mode, render SlaConfigPage
  if (viewMode === 'config_page') {
    return (
      <SlaConfigPage
        currentConfig={config}
        onSaveConfig={(newConfig) => {
          setConfig(newConfig);
          showToast('SLA 阈值与计算模式已全局保存并生效！');
        }}
        onBackToDashboard={() => setViewMode('dashboard')}
      />
    );
  }

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-18 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-2.5 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                SLA 时效履约看板
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                4 核心节点闭环监测
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              全流程端到端时效管控：入库注册 (≤1h) → 出库注册 (≤10min) → 入库上架 (≤24h) → 出库准备 (≤24h)
            </p>
          </div>
        </div>

        {/* Top actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('config_page')}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Settings className="w-4 h-4 text-blue-600" />
            <span>独立配置中心</span>
          </button>
        </div>
      </div>

      {/* 1. Filter Area (时间维度、仓库多选、延迟状态筛选) */}
      <SlaFilterBar
        timeDimension={timeDimension}
        onChangeTimeDimension={setTimeDimension}
        selectedDate={selectedDate}
        onChangeSelectedDate={setSelectedDate}
        selectedWeek={selectedWeek}
        onChangeSelectedWeek={setSelectedWeek}
        selectedMonth={selectedMonth}
        onChangeSelectedMonth={setSelectedMonth}
        selectedWarehouseIds={selectedWarehouseIds}
        onChangeWarehouseIds={setSelectedWarehouseIds}
        delayFilter={delayFilter}
        onChangeDelayFilter={setDelayFilter}
        onRefresh={() => showToast('SLA 看板运营数据已同步刷新！')}
        onOpenConfigPage={() => setViewMode('config_page')}
      />

      {/* 2. Warehouse Cards Bar (按仓库编码排序，默认选中第一个仓库，展示综合SLA达标率、延迟订单数、4节点数、颜色规则) */}
      <WarehouseSlaCards
        warehouseMetrics={warehouseMetrics}
        selectedWarehouseId={effectiveWarehouseId}
        onToggleSelectWarehouse={handleToggleCardSelectWarehouse}
        config={config}
      />

      {/* 3. Four Core Nodes SLA Pivot Table (4 履约节点 & 业务起终点 & 阈值 & 达标率) */}
      <SlaNodePivotTable
        config={config}
        warehouseMetrics={warehouseMetrics}
        selectedWarehouseId={effectiveWarehouseId}
      />

      {/* 4. SLA Trend Line Chart (折线趋势走势图，包含 95% 达标红虚线) */}
      <SlaTrendChart
        trendData={trendData}
        config={config}
        selectedWarehouseName={focusedWarehouseName}
      />

      {/* 5. Orders Drilldown Pivot Table (支持已延迟/未延迟筛选、整单时效明细、导出报表) */}
      <SlaOrderTable
        orders={ordersAfterWarehouseFilter}
        delayFilter={delayFilter}
        selectedWarehouseId={effectiveWarehouseId}
        config={config}
      />
    </div>
  );
};
