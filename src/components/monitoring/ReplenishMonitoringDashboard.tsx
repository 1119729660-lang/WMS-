import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import {
  MonitoringConfig,
  MonitoringTimeRange,
  StuckTaskRecord,
  TrendDataPoint,
} from '../../types/monitoring';
import {
  DEFAULT_MONITORING_CONFIG,
  INITIAL_STUCK_TASKS,
  generateTrendData,
  WORKER_PRODUCTIVITY_DAILY,
  WORKER_PRODUCTIVITY_WEEKLY,
  VOLUME_SUMMARY_BY_WAREHOUSE,
  VOLUME_SUMMARY_BY_SKU,
  VOLUME_SUMMARY_BY_WORKER,
  WAREHOUSE_DRILLDOWN_TIMELINESS,
  WORKER_DRILLDOWN_TIMELINESS,
} from '../../data/mockMonitoringData';
import { MonitoringHeader } from './MonitoringHeader';
import { MetricCards } from './MetricCards';
import { TrendChart } from './TrendChart';
import { WorkerEfficiencyRank } from './WorkerEfficiencyRank';
import { StuckTasksTable } from './StuckTasksTable';
import { VolumeSummaryTable } from './VolumeSummaryTable';
import { DrilldownModal } from './DrilldownModal';
import { ExportReportModal } from './ExportReportModal';
import { MonitoringConfigModal } from './MonitoringConfigModal';

interface ReplenishMonitoringDashboardProps {
  currentWarehouseId?: string;
}

export const ReplenishMonitoringDashboard: React.FC<
  ReplenishMonitoringDashboardProps
> = ({ currentWarehouseId = 'ALL' }) => {
  // Config state
  const [config, setConfig] = useState<MonitoringConfig>(
    DEFAULT_MONITORING_CONFIG
  );

  // Filters
  const [selectedWarehouseId, setSelectedWarehouseId] =
    useState<string>(currentWarehouseId);
  const [timeRange, setTimeRange] = useState<MonitoringTimeRange>('last7days');

  // Stuck Tasks state
  const [stuckTasks, setStuckTasks] =
    useState<StuckTaskRecord[]>(INITIAL_STUCK_TASKS);

  // Historical trend data (sliced based on time range)
  const [allTrendData] = useState<TrendDataPoint[]>(() => generateTrendData());
  const [activeTrendData, setActiveTrendData] = useState<TrendDataPoint[]>([]);

  // Refresh & Countdown
  const [countdownSeconds, setCountdownSeconds] = useState<number>(
    config.refreshIntervalSeconds
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals
  const [isDrilldownOpen, setIsDrilldownOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Slice trend data according to timeRange
  useEffect(() => {
    if (timeRange === 'today') {
      setActiveTrendData(allTrendData.slice(-1));
    } else if (timeRange === 'week' || timeRange === 'last7days') {
      setActiveTrendData(allTrendData.slice(-7));
    } else {
      // month or last30days
      setActiveTrendData(allTrendData.slice(-30));
    }
  }, [timeRange, allTrendData]);

  // Auto-refresh countdown timer
  useEffect(() => {
    if (config.refreshIntervalSeconds <= 0) return;

    const timer = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) {
          triggerRefresh(false);
          return config.refreshIntervalSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [config.refreshIntervalSeconds]);

  const triggerRefresh = (showManualToast = true) => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setCountdownSeconds(config.refreshIntervalSeconds);
      if (showManualToast) {
        showToast('看板运营数据已同步更新完成！');
      }
    }, 600);
  };

  // KPI Calculations
  const latestData =
    activeTrendData[activeTrendData.length - 1] || allTrendData[allTrendData.length - 1];

  // Timeliness rate adjusted by preset hours (if 1h -> slightly lower, if 3h/4h -> slightly higher)
  const hourFactor = (config.timelinessPresetHours - 2) * 1.8;
  const computedTimelinessRate = +(latestData.timelinessRate + hourFactor).toFixed(1);
  const totalDueTasks = latestData.totalTasks;
  const completedOnTimeTasks = Math.round(
    (totalDueTasks * computedTimelinessRate) / 100
  );

  // Filter stuck tasks by warehouse if not 'ALL'
  const filteredStuckTasks =
    selectedWarehouseId === 'ALL'
      ? stuckTasks
      : stuckTasks.filter((t) => t.warehouseId === selectedWarehouseId);

  // Handlers for Stuck Tasks
  const handleUrgeTask = (taskId: string) => {
    setStuckTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, urgedCount: t.urgedCount + 1 } : t
      )
    );
    showToast(`已向工单 [${taskId}] 责任补货员发送强力督办企微与短信！`);
  };

  const handleReassignTask = (task: StuckTaskRecord) => {
    setStuckTasks((prev) => prev.filter((t) => t.id !== task.id));
    showToast(`任务 [${task.id}] 已取消原认领，重置回待派单公池并改派！`);
  };

  const handleScrollToStuckTasks = () => {
    const el = document.getElementById('stuck-tasks-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-18 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-2.5 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* 1. Header Toolbar */}
      <MonitoringHeader
        selectedWarehouseId={selectedWarehouseId}
        onSelectWarehouse={setSelectedWarehouseId}
        timeRange={timeRange}
        onChangeTimeRange={setTimeRange}
        config={config}
        onChangeConfig={(updater) =>
          setConfig((prev) => ({ ...prev, ...updater }))
        }
        countdownSeconds={countdownSeconds}
        onManualRefresh={() => triggerRefresh(true)}
        isRefreshing={isRefreshing}
        onOpenExportModal={() => setIsExportOpen(true)}
        onOpenConfigModal={() => setIsConfigOpen(true)}
      />

      {/* 2. Executive Metric Cards */}
      <MetricCards
        config={config}
        onChangeConfig={(updater) =>
          setConfig((prev) => ({ ...prev, ...updater }))
        }
        timelinessRate={computedTimelinessRate}
        completedOnTimeTasks={completedOnTimeTasks}
        totalDueTasks={totalDueTasks}
        stuckTasks={filteredStuckTasks}
        pickingReports={latestData.pickingReports}
        totalPickingOps={latestData.totalPickingOps}
        stockoutRatePicking={latestData.stockoutRatePicking}
        stockoutSkus={latestData.stockoutSkus}
        totalWaveSkus={latestData.totalWaveSkus}
        stockoutRateSku={latestData.stockoutRateSku}
        totalPieces={latestData.totalPieces}
        totalTasks={latestData.totalTasks}
        avgPiecesPerTask={Math.round(
          latestData.totalPieces / Math.max(1, latestData.totalTasks)
        )}
        onOpenDrilldown={() => setIsDrilldownOpen(true)}
        onScrollToStuckTasks={handleScrollToStuckTasks}
      />

      {/* 3. Trend Line / Area Chart (7 / 30 Days) */}
      <TrendChart
        trendData={activeTrendData}
        stockoutMethod={config.stockoutMethod}
      />

      {/* 4. Two Column Grid: Worker Efficiency & Volume Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Worker Productivity Rank */}
        <WorkerEfficiencyRank
          dailyWorkers={WORKER_PRODUCTIVITY_DAILY}
          weeklyWorkers={WORKER_PRODUCTIVITY_WEEKLY}
          targetPiecesPerHour={config.targetEfficiencyPiecesPerHour}
        />

        {/* Volume Summary by Dimension */}
        <VolumeSummaryTable
          byWarehouse={VOLUME_SUMMARY_BY_WAREHOUSE}
          bySku={VOLUME_SUMMARY_BY_SKU}
          byWorker={VOLUME_SUMMARY_BY_WORKER}
        />
      </div>

      {/* 5. Stuck Tasks Detail Table with Tiers */}
      <StuckTasksTable
        stuckTasks={filteredStuckTasks}
        onUrgeTask={handleUrgeTask}
        onReassignTask={handleReassignTask}
        onViewTaskDetail={(t) =>
          showToast(`已调取工单 [${t.id}] 完整全流程时序记录！`)
        }
      />

      {/* Modals */}
      <DrilldownModal
        isOpen={isDrilldownOpen}
        onClose={() => setIsDrilldownOpen(false)}
        presetHours={config.timelinessPresetHours}
        warehouseData={WAREHOUSE_DRILLDOWN_TIMELINESS}
        workerData={WORKER_DRILLDOWN_TIMELINESS}
      />

      <ExportReportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        stuckTasks={filteredStuckTasks}
        workers={WORKER_PRODUCTIVITY_DAILY}
        trendData={activeTrendData}
        volumeSummaries={VOLUME_SUMMARY_BY_WAREHOUSE}
        config={config}
      />

      <MonitoringConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        config={config}
        onSaveConfig={(updated) => {
          setConfig(updated);
          setCountdownSeconds(updated.refreshIntervalSeconds);
          showToast('监控看板指标口径与预设阈值已保存生效！');
        }}
      />
    </div>
  );
};
