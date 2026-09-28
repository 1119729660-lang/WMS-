import React, { useState, useMemo } from 'react';
import {
  MOCK_WAREHOUSES,
  INITIAL_ITEMS,
  INITIAL_TASKS,
} from './data/mockWarehouseData';
import {
  PriorityLevel,
  ReplenishFilterState,
  ReplenishItem,
  ReplenishSummaryMetrics,
  ReplenishTask,
} from './types/replenishment';
import {
  enrichReplenishItem,
  sortReplenishItems,
} from './utils/replenishmentEngine';
import { Navbar } from './components/Navbar';
import { KPICards } from './components/KPICards';
import { FilterBar } from './components/FilterBar';
import { TaskListView } from './components/TaskListView';
import { KanbanBoardView } from './components/KanbanBoardView';
import { RackLayoutView } from './components/RackLayoutView';
import { Phase1ExportModal } from './components/Phase1ExportModal';
import { TaskDetailModal } from './components/TaskDetailModal';
import { RuleConfigModal } from './components/RuleConfigModal';
import { PrintSheetModal } from './components/PrintSheetModal';
import { PutawayStrategyPage } from './components/putaway/PutawayStrategyPage';
import { LocationManagerPage } from './components/location/LocationManagerPage';
import { StockoutAlertPage } from './components/stockout/StockoutAlertPage';
import { TaskManagementPage } from './components/tasks/TaskManagementPage';
import { ReplenishMonitoringDashboard } from './components/monitoring/ReplenishMonitoringDashboard';
import { SlaDashboardPage } from './components/sla/SlaDashboardPage';
import { CheckCircle2, AlertTriangle, Sparkles, Send } from 'lucide-react';

export default function App() {
  // Navigation Menu: 'replenishment' | 'monitoring' | 'sla' | 'task_management' | 'putaway' | 'location' | 'stockout'
  const [currentMenu, setCurrentMenu] = useState<
    | 'replenishment'
    | 'monitoring'
    | 'sla'
    | 'task_management'
    | 'putaway'
    | 'location'
    | 'stockout'
  >('replenishment');

  // Master State
  const [items, setItems] = useState<ReplenishItem[]>(INITIAL_ITEMS);
  const [tasks, setTasks] = useState<ReplenishTask[]>(INITIAL_TASKS);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'info' | 'warning';
  } | null>(null);

  // System Configuration State
  const [defaultCoeff, setDefaultCoeff] = useState<number>(1.0);
  const [autoDeduplicationEnabled, setAutoDeduplicationEnabled] =
    useState<boolean>(true);

  // Filter State
  const [filter, setFilter] = useState<ReplenishFilterState>({
    warehouseId: 'WH-01',
    zone: 'ALL',
    priority: 'ALL',
    status: 'ALL',
    sameRackOnly: false,
    searchKeyword: '',
    systemPhase: 'phase1', // 一期方案 (人工清单圈选) vs 二期方案 (自动引擎)
    viewMode: 'table',
  });

  // Modals
  const [isPhase1ExportOpen, setIsPhase1ExportOpen] = useState(false);
  const [isRuleConfigOpen, setIsRuleConfigOpen] = useState(false);
  const [isPrintSheetOpen, setIsPrintSheetOpen] = useState(false);
  const [printSheetItems, setPrintSheetItems] = useState<ReplenishItem[]>([]);
  const [activeDetailItem, setActiveDetailItem] = useState<ReplenishItem | null>(
    null
  );

  const showToast = (
    text: string,
    type: 'success' | 'info' | 'warning' = 'success'
  ) => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Current Warehouse Details
  const currentWarehouse = useMemo(() => {
    return (
      MOCK_WAREHOUSES.find((w) => w.id === filter.warehouseId) ||
      MOCK_WAREHOUSES[0]
    );
  }, [filter.warehouseId]);

  // Filter & Sort Items
  const filteredItems = useMemo(() => {
    let result = items.filter((item) => item.warehouseId === filter.warehouseId);

    if (filter.zone !== 'ALL') {
      result = result.filter((item) => item.zone === filter.zone);
    }

    if (filter.priority !== 'ALL') {
      result = result.filter((item) => item.priority === filter.priority);
    }

    if (filter.sameRackOnly) {
      result = result.filter(
        (item) => item.recommendedSourceLocation?.isSameRack === true
      );
    }

    if (filter.status !== 'ALL') {
      if (filter.status === 'triggered_unassigned') {
        result = result.filter(
          (item) =>
            item.isTriggered &&
            !tasks.some(
              (t) =>
                t.itemId === item.id &&
                (t.status === 'in_progress' || t.status === 'completed')
            )
        );
      } else if (filter.status === 'in_progress') {
        result = result.filter((item) =>
          tasks.some((t) => t.itemId === item.id && t.status === 'in_progress')
        );
      } else if (filter.status === 'completed') {
        result = result.filter((item) =>
          tasks.some((t) => t.itemId === item.id && t.status === 'completed')
        );
      }
    }

    if (filter.searchKeyword.trim()) {
      const q = filter.searchKeyword.toLowerCase();
      result = result.filter(
        (item) =>
          item.skuName.toLowerCase().includes(q) ||
          item.skuCode.toLowerCase().includes(q) ||
          item.pickLocationCode.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
      );
    }

    // Sort according to business rule:
    // P0 > P1 > P2 > NORMAL; 同级按剩余可用天数升序，7日平均销量降序
    return sortReplenishItems(result);
  }, [items, tasks, filter]);

  // Overall KPI Metrics for Current Warehouse
  const metrics: ReplenishSummaryMetrics = useMemo(() => {
    const whItems = items.filter((i) => i.warehouseId === filter.warehouseId);
    const whTasks = tasks.filter((t) => t.warehouseId === filter.warehouseId);

    const triggered = whItems.filter((i) => i.isTriggered);
    const p0 = whItems.filter((i) => i.priority === 'P0');
    const p1 = whItems.filter((i) => i.priority === 'P1');
    const p2 = whItems.filter((i) => i.priority === 'P2');
    const normal = whItems.filter((i) => i.priority === 'NORMAL');

    const inProgress = whTasks.filter((t) => t.status === 'in_progress');
    const completed = whTasks.filter((t) => t.status === 'completed');
    const totalReplenishedQty = completed.reduce(
      (sum, t) => sum + (t.actualQty || t.requestedQty),
      0
    );

    // Same-rack hit rate: tasks where isSameRack === true
    const totalDispatched = inProgress.length + completed.length;
    const sameRackCount = [...inProgress, ...completed].filter(
      (t) => t.isSameRack
    ).length;
    const hitRate =
      totalDispatched > 0
        ? Math.round((sameRackCount / totalDispatched) * 1000) / 10
        : 92.4;

    return {
      totalSkus: whItems.length,
      triggeredCount: triggered.length,
      p0Count: p0.length,
      p1Count: p1.length,
      p2Count: p2.length,
      normalCount: normal.length,
      inProgressTaskCount: inProgress.length,
      completedTodayCount: completed.length,
      totalReplenishedQtyToday: totalReplenishedQty,
      sameRackHitRate: hitRate,
      avgFulfillmentHours: 0.6,
    };
  }, [items, tasks, filter.warehouseId]);

  // Handlers
  const handleToggleSelectItem = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (select: boolean) => {
    if (select) {
      setSelectedItemIds(filteredItems.map((i) => i.id));
    } else {
      setSelectedItemIds([]);
    }
  };

  const handleSelectAllByPriority = (priority: PriorityLevel) => {
    const ids = filteredItems
      .filter((i) => i.priority === priority)
      .map((i) => i.id);
    setSelectedItemIds(ids);
    showToast(`已圈选所有 ${priority} 优先级的 ${ids.length} 个 SKU`);
  };

  // Phase 1 Manual Dispatch
  const handleManualDispatch = (itemIds: string[]) => {
    const itemsToDispatch = items.filter((i) => itemIds.includes(i.id));
    if (itemsToDispatch.length === 0) return;

    let createdCount = 0;
    let dedupCount = 0;
    const newTasks: ReplenishTask[] = [];

    const nowStr = new Date()
      .toISOString()
      .replace('T', ' ')
      .slice(0, 19);

    itemsToDispatch.forEach((item) => {
      // Deduplication check
      const existingTask = tasks.find(
        (t) =>
          t.itemId === item.id &&
          (t.status === 'in_progress' || t.status === 'pending_dispatch')
      );

      if (autoDeduplicationEnabled && existingTask) {
        dedupCount++;
        return;
      }

      const sourceLoc =
        item.recommendedSourceLocation || item.reserveLocations[0];
      const sourceCode = sourceLoc?.locationCode || 'A-01-02-02';
      const sourceLevel = sourceLoc?.level || 2;
      const isSame = sourceLoc?.isSameRack ?? true;

      const newTask: ReplenishTask = {
        taskId: `REP-${Date.now().toString().slice(-6)}-${Math.floor(
          Math.random() * 90 + 10
        )}`,
        itemId: item.id,
        skuCode: item.skuCode,
        skuName: item.skuName,
        category: item.category,
        specification: item.specification,
        unit: item.unit,
        warehouseId: item.warehouseId,
        zone: item.zone,
        sourceLocationCode: sourceCode,
        sourceLevel: sourceLevel,
        isSameRack: isSame,
        targetLocationCode: item.pickLocationCode,
        requestedQty: item.suggestedReplenishQty,
        actualQty: 0,
        priority: item.priority,
        daysOfSupply: item.daysOfSupply,
        avgDailySales: item.avgDailySales,
        status: 'in_progress',
        dispatchMode:
          filter.systemPhase === 'phase2' ? 'auto_engine' : 'manual_selection',
        dispatchedAt: nowStr,
        operator: isSame ? '张明 (垂直高位叉车02)' : '李建军 (平面搬运车05)',
        notes:
          filter.systemPhase === 'phase2'
            ? '二期系统自动化阈值触发，同架优先'
            : '一期库管员人工圈选下发',
      };

      newTasks.push(newTask);
      createdCount++;
    });

    setTasks((prev) => [...newTasks, ...prev]);
    setSelectedItemIds([]);

    if (dedupCount > 0) {
      showToast(
        `成功下发 ${createdCount} 个补货任务！(二期防重引擎自动拦截 ${dedupCount} 个重复任务)`,
        'info'
      );
    } else {
      showToast(`成功下发 ${createdCount} 个补货任务！作业员已接单移库`, 'success');
    }
  };

  // Complete Task (Forklift / AGV puts away to pick face)
  const handleCompleteTask = (taskId: string) => {
    const task = tasks.find((t) => t.taskId === taskId);
    if (!task) return;

    const qtyToFill = task.requestedQty;
    const nowStr = new Date()
      .toISOString()
      .replace('T', ' ')
      .slice(0, 19);

    // 1. Update task
    setTasks((prev) =>
      prev.map((t) =>
        t.taskId === taskId
          ? {
              ...t,
              status: 'completed',
              actualQty: qtyToFill,
              completedAt: nowStr,
            }
          : t
      )
    );

    // 2. Increase Level 1 inventory, decrease source location inventory, recalculate
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== task.itemId) return item;

        const updatedPickStock = item.currentPickStock + qtyToFill;
        const updatedReserves = item.reserveLocations.map((res) => {
          if (res.locationCode === task.sourceLocationCode) {
            return {
              ...res,
              availableStock: Math.max(0, res.availableStock - qtyToFill),
            };
          }
          return res;
        });

        const updatedItem: ReplenishItem = {
          ...item,
          currentPickStock: updatedPickStock,
          reserveLocations: updatedReserves,
          pendingBackorderCount: 0, // Clears backorders on fill
          isPickStationStockout: false,
        };

        return enrichReplenishItem(updatedItem);
      })
    );

    showToast(
      `补货任务 ${taskId} 上架完成！一层拣货位 ${task.targetLocationCode} 库存已增加 +${qtyToFill} ${task.unit}`,
      'success'
    );
  };

  // Toggle Phase 1 vs Phase 2
  const handleTogglePhase = (newPhase: 'phase1' | 'phase2') => {
    setFilter((prev) => ({ ...prev, systemPhase: newPhase }));
    if (newPhase === 'phase2') {
      showToast(
        '已切换至二期智能方案：系统自动化阈值触发，任务自动去重，同架优先派单',
        'info'
      );
    } else {
      showToast(
        '已切换至一期方案（试点重点）：支持人工圈选清单与手动下发，稳步过渡',
        'info'
      );
    }
  };

  // Simulate Sudden Stockout (P0 Trigger)
  const handleTriggerSimulateStockout = () => {
    // Pick SKU-004 (东方树叶) and drop stock to 0 with 12 backorders
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === 'SKU-004') {
          const updated: ReplenishItem = {
            ...item,
            currentPickStock: 0,
            pendingBackorderCount: 15,
            isPickStationStockout: true,
          };
          return enrichReplenishItem(updated);
        }
        return item;
      })
    );
    showToast(
      '🚨 模拟成功：SKU-004 (农夫山泉东方树叶) 拣选点断货，订单池联动挂起 15 单，已触发 P0 级紧急补货！',
      'warning'
    );
  };

  // Toggle Promo Anomaly Day
  const handleTogglePromoAnomaly = (itemId: string, date: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;

        const updatedSalesHistory = item.dailySalesHistory.map((d) => {
          if (d.date === date) {
            return {
              ...d,
              isPromoAnomaly: !d.isPromoAnomaly,
              promoTag: !d.isPromoAnomaly ? '大促剔除' : undefined,
            };
          }
          return d;
        });

        const updated = {
          ...item,
          dailySalesHistory: updatedSalesHistory,
        };

        const reCalculated = enrichReplenishItem(updated);
        if (activeDetailItem?.id === itemId) {
          setActiveDetailItem(reCalculated);
        }
        return reCalculated;
      })
    );
    showToast('已切换该促销日剔除状态，7日均销与优先级已实时重算！', 'info');
  };

  // Inline Update Qty
  const handleUpdateQty = (itemId: string, newQty: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, suggestedReplenishQty: Math.max(1, newQty) }
          : item
      )
    );
  };

  // Update SKU Coefficient
  const handleUpdateCoeff = (itemId: string, newCoeff: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const updatedConfig = {
          ...item.config,
          replenishCoefficient: newCoeff,
        };
        const enriched = enrichReplenishItem({
          ...item,
          config: updatedConfig,
        });
        if (activeDetailItem?.id === itemId) {
          setActiveDetailItem(enriched);
        }
        return enriched;
      })
    );
    showToast(`SKU 补货系数已调整为 ${newCoeff}x`, 'info');
  };

  // Open Print Sheet for selected items
  const handleOpenPrintSheet = (itemsToPrint: ReplenishItem[]) => {
    setPrintSheetItems(itemsToPrint);
    setIsPrintSheetOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 animate-in slide-in-from-top-4 fade-in duration-200">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-xs font-semibold border ${
              toastMessage.type === 'success'
                ? 'bg-emerald-900 text-emerald-100 border-emerald-700'
                : toastMessage.type === 'warning'
                ? 'bg-red-950 text-red-100 border-red-700'
                : 'bg-slate-900 text-blue-200 border-slate-700'
            }`}
          >
            {toastMessage.type === 'success' && (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            {toastMessage.type === 'warning' && (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            {toastMessage.type === 'info' && (
              <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        warehouses={MOCK_WAREHOUSES}
        selectedWarehouseId={filter.warehouseId}
        onSelectWarehouse={(id) =>
          setFilter((prev) => ({ ...prev, warehouseId: id, zone: 'ALL' }))
        }
        systemPhase={filter.systemPhase}
        onTogglePhase={handleTogglePhase}
        onOpenPhase1Export={() => setIsPhase1ExportOpen(true)}
        onOpenRuleConfig={() => setIsRuleConfigOpen(true)}
        onRefreshData={() => {
          setItems(
            INITIAL_ITEMS.map((item) => enrichReplenishItem({ ...item }))
          );
          showToast('库存数据与7日销量已从WMS主数据库完成同步！');
        }}
        onTriggerSimulateStockout={handleTriggerSimulateStockout}
        p0Count={metrics.p0Count}
        currentMenu={currentMenu}
        onSelectMenu={(menu) => setCurrentMenu(menu)}
      />

      {/* Main Content Body */}
      {currentMenu === 'sla' ? (
        <SlaDashboardPage />
      ) : currentMenu === 'monitoring' ? (
        <ReplenishMonitoringDashboard currentWarehouseId={currentWarehouse.id} />
      ) : currentMenu === 'location' ? (
        <LocationManagerPage />
      ) : currentMenu === 'task_management' ? (
        <TaskManagementPage currentWarehouseId={currentWarehouse.id} />
      ) : currentMenu === 'putaway' ? (
        <PutawayStrategyPage warehouseName={currentWarehouse.name} />
      ) : currentMenu === 'stockout' ? (
        <StockoutAlertPage
          onAddP0ReplenishmentTask={(sku, qty) => {
            setItems((prev) => {
              const exists = prev.find((i) => i.skuCode === sku);
              if (exists) {
                return prev.map((i) =>
                  i.skuCode === sku
                    ? {
                        ...i,
                        priority: 'P0',
                        daysRemaining: 0,
                        status: 'triggered_unassigned',
                        suggestedReplenishQty: Math.max(i.suggestedReplenishQty, qty),
                      }
                    : i
                );
              }
              return prev;
            });
            showToast(`缺货联动：已将 SKU [${sku}] 自动提级为 P0 级最高优先级补货任务！`);
          }}
        />
      ) : (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Executive KPI Metric Cards */}
          <KPICards
            metrics={metrics}
            selectedPriority={filter.priority}
            onSelectPriority={(p) =>
              setFilter((prev) => ({ ...prev, priority: p }))
            }
          />

          {/* Multi-dimensional Filter Bar */}
          <FilterBar
            filter={filter}
            onFilterChange={(newF) => setFilter((prev) => ({ ...prev, ...newF }))}
            zones={currentWarehouse.zones}
            totalFilteredCount={filteredItems.length}
            onOpenPhase1Export={() => setIsPhase1ExportOpen(true)}
          />

          {/* Dynamic Views: Table / Kanban / Rack 3D */}
          {filter.viewMode === 'table' && (
            <TaskListView
              items={filteredItems}
              tasks={tasks}
              systemPhase={filter.systemPhase}
              selectedItemIds={selectedItemIds}
              onToggleSelectItem={handleToggleSelectItem}
              onSelectAll={handleSelectAll}
              onSelectAllByPriority={handleSelectAllByPriority}
              onManualDispatch={handleManualDispatch}
              onOpenItemDetail={(item) => setActiveDetailItem(item)}
              onCompleteTask={handleCompleteTask}
              onUpdateQty={handleUpdateQty}
              onOpenPhase1Export={() => setIsPhase1ExportOpen(true)}
            />
          )}

          {filter.viewMode === 'kanban' && (
            <KanbanBoardView
              items={filteredItems}
              tasks={tasks}
              onManualDispatch={handleManualDispatch}
              onCompleteTask={handleCompleteTask}
              onOpenItemDetail={(item) => setActiveDetailItem(item)}
            />
          )}

          {filter.viewMode === 'rack_map' && (
            <RackLayoutView
              items={filteredItems}
              onManualDispatch={handleManualDispatch}
              onOpenItemDetail={(item) => setActiveDetailItem(item)}
            />
          )}
        </main>
      )}

      {/* Modals */}
      {/* 1. Phase 1 Low-Stock Export & Manual Dispatch Modal */}
      <Phase1ExportModal
        isOpen={isPhase1ExportOpen}
        onClose={() => setIsPhase1ExportOpen(false)}
        items={filteredItems}
        selectedWarehouseName={currentWarehouse.name}
        onManualDispatch={handleManualDispatch}
        onOpenPrintSheet={handleOpenPrintSheet}
      />

      {/* 2. SKU Drill-down & Formula Breakdown Modal */}
      <TaskDetailModal
        item={activeDetailItem}
        onClose={() => setActiveDetailItem(null)}
        onTogglePromoAnomaly={handleTogglePromoAnomaly}
        onManualDispatch={handleManualDispatch}
        onUpdateCoeff={handleUpdateCoeff}
      />

      {/* 3. Parameter Configuration Modal */}
      <RuleConfigModal
        isOpen={isRuleConfigOpen}
        onClose={() => setIsRuleConfigOpen(false)}
        defaultCoeff={defaultCoeff}
        onSaveDefaultCoeff={(coeff) => {
          setDefaultCoeff(coeff);
          showToast(`全局补货系数已更新为 ${coeff}x`);
        }}
        autoDeduplicationEnabled={autoDeduplicationEnabled}
        onToggleAutoDeduplication={(dedup) => {
          setAutoDeduplicationEnabled(dedup);
          showToast(
            dedup ? '二期防重复下发保护已开启' : '防重保护已关闭 (允许重复生成)'
          );
        }}
      />

      {/* 4. Printable Work Order Modal */}
      <PrintSheetModal
        isOpen={isPrintSheetOpen}
        onClose={() => setIsPrintSheetOpen(false)}
        items={printSheetItems}
        warehouseName={currentWarehouse.name}
      />
    </div>
  );
}
