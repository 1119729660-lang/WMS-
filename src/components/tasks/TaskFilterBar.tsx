import React from 'react';
import {
  Search,
  Filter,
  Download,
  PlusCircle,
  Clock,
  Sliders,
  Smartphone,
  AlertOctagon,
} from 'lucide-react';
import { TaskFilterOptions, ReplenishmentWorker } from '../../types/taskManagement';

interface TaskFilterBarProps {
  filter: TaskFilterOptions;
  onChangeFilter: (updater: Partial<TaskFilterOptions>) => void;
  workers: ReplenishmentWorker[];
  totalCount: number;
  filteredCount: number;
  warningCount: number;
  escalatedCount: number;
  onOpenCreateModal: () => void;
  onOpenConfigModal: () => void;
  onOpenPdaSimModal: () => void;
  onExportCsv: () => void;
}

export const TaskFilterBar: React.FC<TaskFilterBarProps> = ({
  filter,
  onChangeFilter,
  workers,
  totalCount,
  filteredCount,
  warningCount,
  escalatedCount,
  onOpenCreateModal,
  onOpenConfigModal,
  onOpenPdaSimModal,
  onExportCsv,
}) => {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
      {/* Top row: Multi-dimension filters & Search */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Select */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 font-medium">状态:</span>
            <select
              value={filter.status}
              onChange={(e) => onChangeFilter({ status: e.target.value })}
              className="bg-transparent text-slate-800 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL">全部状态 ({totalCount})</option>
              <option value="pending_dispatch">待派单</option>
              <option value="dispatched">已派单</option>
              <option value="claimed">已领取</option>
              <option value="in_progress">进行中</option>
              <option value="completed">已完成</option>
              <option value="exception_review">⚠️ 异常待核实</option>
              <option value="exception_closed">异常关闭</option>
            </select>
          </div>

          {/* Priority Select */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5">
            <span className="text-slate-500 font-medium">优先级:</span>
            <select
              value={filter.priority}
              onChange={(e) => onChangeFilter({ priority: e.target.value })}
              className="bg-transparent text-slate-800 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL">全部优先级</option>
              <option value="P0">🔴 P0 紧急</option>
              <option value="P1">🟠 P1 紧缺</option>
              <option value="P2">🟡 P2 预警</option>
            </select>
          </div>

          {/* Worker Select */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5">
            <span className="text-slate-500 font-medium">补货员:</span>
            <select
              value={filter.worker}
              onChange={(e) => onChangeFilter({ worker: e.target.value })}
              className="bg-transparent text-slate-800 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL">全部作业员</option>
              {workers.map((w) => (
                <option key={w.id} value={w.name}>
                  {w.name} ({w.assignedZone})
                </option>
              ))}
            </select>
          </div>

          {/* Overdue filter toggle */}
          <button
            onClick={() => onChangeFilter({ onlyOverdue: !filter.onlyOverdue })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-semibold transition-colors cursor-pointer ${
              filter.onlyOverdue
                ? 'bg-red-50 text-red-700 border-red-300'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-red-500" />
            <span>仅看超时预警</span>
            {(warningCount > 0 || escalatedCount > 0) && (
              <span className="bg-red-500 text-white font-mono text-[10px] px-1.5 py-0.2 rounded-full">
                {warningCount + escalatedCount}
              </span>
            )}
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="搜索任务ID / SKU / 库位 / 品名..."
            value={filter.searchKeyword}
            onChange={(e) => onChangeFilter({ searchKeyword: e.target.value })}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Bottom row: Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-2 text-slate-500">
          <span>共找到 <strong className="text-slate-800 font-mono">{filteredCount}</strong> 条任务记录</span>
          {escalatedCount > 0 && (
            <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200 font-bold">
              <AlertOctagon className="w-3 h-3" />
              {escalatedCount} 条已超4小时升级主管
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-xs transition-colors cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>人工圈选新建任务</span>
          </button>

          <button
            onClick={onOpenPdaSimModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>补货员PDA作业/异常上报沙盘</span>
          </button>

          <button
            onClick={onOpenConfigModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg font-semibold transition-colors cursor-pointer"
            title="配置仓库派单模式与超时预警阈值"
          >
            <Sliders className="w-3.5 h-3.5 text-blue-600" />
            <span>派单与超时策略</span>
          </button>

          <button
            onClick={onExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>导出任务列表</span>
          </button>
        </div>
      </div>
    </div>
  );
};
