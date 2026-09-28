import React from 'react';
import {
  Activity,
  Warehouse,
  Calendar,
  RefreshCw,
  Download,
  Clock,
  Settings2,
} from 'lucide-react';
import { MonitoringTimeRange, MonitoringConfig } from '../../types/monitoring';

interface MonitoringHeaderProps {
  selectedWarehouseId: string;
  onSelectWarehouse: (id: string) => void;
  timeRange: MonitoringTimeRange;
  onChangeTimeRange: (tr: MonitoringTimeRange) => void;
  config: MonitoringConfig;
  onChangeConfig: (updater: Partial<MonitoringConfig>) => void;
  countdownSeconds: number;
  onManualRefresh: () => void;
  isRefreshing: boolean;
  onOpenExportModal: () => void;
  onOpenConfigModal: () => void;
}

export const MonitoringHeader: React.FC<MonitoringHeaderProps> = ({
  selectedWarehouseId,
  onSelectWarehouse,
  timeRange,
  onChangeTimeRange,
  config,
  onChangeConfig,
  countdownSeconds,
  onManualRefresh,
  isRefreshing,
  onOpenExportModal,
  onOpenConfigModal,
}) => {
  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      {/* Title & Brand */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-md shadow-blue-500/20">
          <Activity className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              补货监控看板
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              实时流转中
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            及时率达标监测 · 缺货双口径核算 · 人效工效排名 · 卡住任务催办
          </p>
        </div>
      </div>

      {/* Control Toolbar */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Warehouse Selector */}
        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700">
          <Warehouse className="w-3.5 h-3.5 text-slate-400 mr-1.5 shrink-0" />
          <select
            value={selectedWarehouseId}
            onChange={(e) => onSelectWarehouse(e.target.value)}
            className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer pr-1"
          >
            <option value="ALL">全部仓储节点 (集团全景)</option>
            <option value="WH-HEIHE-01">黑河保税1号仓 (口岸主仓)</option>
            <option value="WH-HUNCHUN-02">珲春陆港保税2号仓</option>
            <option value="WH-SUFENHE-03">绥芬河跨境集散仓</option>
          </select>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
          <button
            onClick={() => onChangeTimeRange('today')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              timeRange === 'today'
                ? 'bg-white text-blue-700 shadow-xs font-bold'
                : 'hover:text-slate-900'
            }`}
          >
            今日(日)
          </button>
          <button
            onClick={() => onChangeTimeRange('week')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              timeRange === 'week'
                ? 'bg-white text-blue-700 shadow-xs font-bold'
                : 'hover:text-slate-900'
            }`}
          >
            本周
          </button>
          <button
            onClick={() => onChangeTimeRange('month')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              timeRange === 'month'
                ? 'bg-white text-blue-700 shadow-xs font-bold'
                : 'hover:text-slate-900'
            }`}
          >
            本月
          </button>
          <button
            onClick={() => onChangeTimeRange('last7days')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              timeRange === 'last7days'
                ? 'bg-white text-blue-700 shadow-xs font-bold'
                : 'hover:text-slate-900'
            }`}
          >
            近7天
          </button>
          <button
            onClick={() => onChangeTimeRange('last30days')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              timeRange === 'last30days'
                ? 'bg-white text-blue-700 shadow-xs font-bold'
                : 'hover:text-slate-900'
            }`}
          >
            近30天
          </button>
        </div>

        {/* Auto Refresh Setting & Countdown */}
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-600">
          <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <select
            value={config.refreshIntervalSeconds}
            onChange={(e) =>
              onChangeConfig({ refreshIntervalSeconds: Number(e.target.value) })
            }
            className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer text-[11px]"
            title="自动刷新间隔设置"
          >
            <option value={60}>每 1 分钟刷新</option>
            <option value={180}>每 3 分钟刷新</option>
            <option value={300}>每 5 分钟刷新 (默认)</option>
            <option value={600}>每 10 分钟刷新</option>
            <option value={0}>关闭自动刷新</option>
          </select>
          {config.refreshIntervalSeconds > 0 && (
            <span className="font-mono text-[10px] text-blue-600 bg-blue-50 px-1 py-0.2 rounded border border-blue-100">
              {formatCountdown(countdownSeconds)}
            </span>
          )}
        </div>

        {/* Manual Refresh Button */}
        <button
          onClick={onManualRefresh}
          disabled={isRefreshing}
          className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          title="手动刷新看板数据"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`}
          />
        </button>

        {/* Config button */}
        <button
          onClick={onOpenConfigModal}
          className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl transition-colors cursor-pointer"
          title="指标口径与预设阈值设置"
        >
          <Settings2 className="w-3.5 h-3.5" />
        </button>

        {/* Export Excel Button */}
        <button
          onClick={onOpenExportModal}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>导出监控报表</span>
        </button>
      </div>
    </div>
  );
};
