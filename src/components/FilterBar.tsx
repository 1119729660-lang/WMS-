import React from 'react';
import {
  Search,
  Filter,
  List,
  Kanban,
  Box,
  Layers,
  Printer,
} from 'lucide-react';
import { ReplenishFilterState } from '../types/replenishment';

interface FilterBarProps {
  filter: ReplenishFilterState;
  onFilterChange: (newFilter: Partial<ReplenishFilterState>) => void;
  zones: string[];
  totalFilteredCount: number;
  onOpenPhase1Export?: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filter,
  onFilterChange,
  zones,
  totalFilteredCount,
  onOpenPhase1Export,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm mb-5 space-y-3">
      {/* Top row: Multi-dimensional Selectors and Search */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Filter selectors */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mr-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>多维筛选:</span>
          </div>

          {/* Zone Selector */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs">
            <span className="text-slate-400">库区:</span>
            <select
              value={filter.zone}
              onChange={(e) => onFilterChange({ zone: e.target.value })}
              className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">全部库区</option>
              {zones.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Selector */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs">
            <span className="text-slate-400">优先级:</span>
            <select
              value={filter.priority}
              onChange={(e) => onFilterChange({ priority: e.target.value })}
              className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">全部优先级 (P0~P2)</option>
              <option value="P0">🔴 P0 紧急断货 (≤0天/挂起)</option>
              <option value="P1">🟠 P1 紧缺警戒 (&lt;1天)</option>
              <option value="P2">🔵 P2 预警备货 (&lt;2天)</option>
              <option value="NORMAL">⚪ 正常库存 (&ge;2天)</option>
            </select>
          </div>

          {/* Task Status */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs">
            <span className="text-slate-400">状态:</span>
            <select
              value={filter.status}
              onChange={(e) => onFilterChange({ status: e.target.value })}
              className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">全部状态</option>
              <option value="triggered_unassigned">待下发补货</option>
              <option value="in_progress">搬运补货中</option>
              <option value="completed">今日已上架</option>
            </select>
          </div>

          {/* Same-Rack Toggle */}
          <button
            onClick={() => onFilterChange({ sameRackOnly: !filter.sameRackOnly })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
              filter.sameRackOnly
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
            title="仅筛选同货架二层/三层备货位垂直补货任务"
          >
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            <span>仅看同架垂直源位</span>
            {filter.sameRackOnly && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            )}
          </button>
        </div>

        {/* Right: Search & View Switcher */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="搜索 SKU / 品名 / 库位..."
              value={filter.searchKeyword}
              onChange={(e) => onFilterChange({ searchKeyword: e.target.value })}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          {/* View Mode Buttons */}
          <div className="bg-slate-100 p-1 rounded-lg border border-slate-200 flex items-center shrink-0">
            <button
              onClick={() => onFilterChange({ viewMode: 'table' })}
              className={`p-1.5 rounded text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors ${
                filter.viewMode === 'table'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="表格清单视图"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden md:inline">列表</span>
            </button>
            <button
              onClick={() => onFilterChange({ viewMode: 'kanban' })}
              className={`p-1.5 rounded text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors ${
                filter.viewMode === 'kanban'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="看板流转视图"
            >
              <Kanban className="w-3.5 h-3.5" />
              <span className="hidden md:inline">看板</span>
            </button>
            <button
              onClick={() => onFilterChange({ viewMode: 'rack_map' })}
              className={`p-1.5 rounded text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors ${
                filter.viewMode === 'rack_map'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="货架立体库位分布图"
            >
              <Box className="w-3.5 h-3.5" />
              <span className="hidden md:inline">立体货架</span>
            </button>
          </div>

          {/* Phase 1 Export Button */}
          {onOpenPhase1Export && (
            <button
              onClick={onOpenPhase1Export}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-2 rounded-lg font-semibold transition-colors shadow-xs shrink-0 cursor-pointer"
              title="导出低库存清单与打印补货单"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>低库存清单导出</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
