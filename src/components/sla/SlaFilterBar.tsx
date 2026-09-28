import React, { useState } from 'react';
import {
  Calendar,
  Warehouse,
  AlertCircle,
  CheckCircle2,
  Filter,
  SlidersHorizontal,
  RefreshCw,
  Clock,
  Settings,
  ChevronDown,
  X,
} from 'lucide-react';
import {
  SlaTimeDimension,
  SlaDelayFilter,
} from '../../types/sla';
import { MOCK_SLA_WAREHOUSES } from '../../data/mockSlaData';

interface SlaFilterBarProps {
  timeDimension: SlaTimeDimension;
  onChangeTimeDimension: (dim: SlaTimeDimension) => void;
  selectedDate: string; // e.g. '2026-09-23'
  onChangeSelectedDate: (date: string) => void;
  selectedWeek: string; // e.g. '第39周'
  onChangeSelectedWeek: (week: string) => void;
  selectedMonth: string; // e.g. '2026-09'
  onChangeSelectedMonth: (month: string) => void;
  selectedWarehouseIds: string[]; // 多选数组，若为空数组或包含所有则代表全部仓库
  onChangeWarehouseIds: (ids: string[]) => void;
  delayFilter: SlaDelayFilter;
  onChangeDelayFilter: (filter: SlaDelayFilter) => void;
  onRefresh: () => void;
  onOpenConfigPage: () => void;
}

export const SlaFilterBar: React.FC<SlaFilterBarProps> = ({
  timeDimension,
  onChangeTimeDimension,
  selectedDate,
  onChangeSelectedDate,
  selectedWeek,
  onChangeSelectedWeek,
  selectedMonth,
  onChangeSelectedMonth,
  selectedWarehouseIds,
  onChangeWarehouseIds,
  delayFilter,
  onChangeDelayFilter,
  onRefresh,
  onOpenConfigPage,
}) => {
  const [isWarehouseDropdownOpen, setIsWarehouseDropdownOpen] = useState(false);

  // Available weeks in 2026
  const availableWeeks = [
    { value: '第34周', label: '2026 年第 34 周' },
    { value: '第35周', label: '2026 年第 35 周' },
    { value: '第36周', label: '2026 年第 36 周' },
    { value: '第37周', label: '2026 年第 37 周' },
    { value: '第38周', label: '2026 年第 38 周' },
    { value: '第39周', label: '2026 年第 39 周 (本周)' },
  ];

  // Available months
  const availableMonths = [
    { value: '2026-04', label: '2026-04' },
    { value: '2026-05', label: '2026-05' },
    { value: '2026-06', label: '2026-06' },
    { value: '2026-07', label: '2026-07' },
    { value: '2026-08', label: '2026-08' },
    { value: '2026-09', label: '2026-09 (当月)' },
  ];

  const handleWarehouseToggle = (whId: string) => {
    if (selectedWarehouseIds.includes(whId)) {
      onChangeWarehouseIds(selectedWarehouseIds.filter((id) => id !== whId));
    } else {
      onChangeWarehouseIds([...selectedWarehouseIds, whId]);
    }
  };

  const handleSelectAllWarehouses = () => {
    onChangeWarehouseIds(MOCK_SLA_WAREHOUSES.map((w) => w.id));
  };

  const handleClearAllWarehouses = () => {
    onChangeWarehouseIds([]);
  };

  const isAllWarehousesSelected =
    selectedWarehouseIds.length === 0 ||
    selectedWarehouseIds.length === MOCK_SLA_WAREHOUSES.length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3.5 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: 1. 时间维度切换 + 动态时间选择器 */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Dimension Switcher (日 / 周 / 月) */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl font-bold">
            <button
              onClick={() => onChangeTimeDimension('day')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                timeDimension === 'day'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              日 (按天)
            </button>
            <button
              onClick={() => onChangeTimeDimension('week')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                timeDimension === 'week'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              周 (自然周)
            </button>
            <button
              onClick={() => onChangeTimeDimension('month')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                timeDimension === 'month'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              月 (自然月)
            </button>
          </div>

          {/* Time Picker Context according to dimension */}
          {timeDimension === 'day' && (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => onChangeSelectedDate(e.target.value)}
                className="bg-transparent font-mono font-bold text-slate-700 text-xs focus:outline-hidden"
              />
              <span className="text-[10px] text-slate-400 font-normal">
                (00:00~23:59应完成)
              </span>
            </div>
          )}

          {timeDimension === 'week' && (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              <select
                value={selectedWeek}
                onChange={(e) => onChangeSelectedWeek(e.target.value)}
                className="bg-transparent font-bold text-slate-700 text-xs focus:outline-hidden cursor-pointer"
              >
                {availableWeeks.map((w) => (
                  <option key={w.value} value={w.value}>
                    {w.label}
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-slate-400 font-normal">
                (周一00:00~周日23:59)
              </span>
            </div>
          )}

          {timeDimension === 'month' && (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl">
              <Calendar className="w-3.5 h-3.5 text-emerald-500" />
              <select
                value={selectedMonth}
                onChange={(e) => onChangeSelectedMonth(e.target.value)}
                className="bg-transparent font-bold text-slate-700 text-xs focus:outline-hidden cursor-pointer"
              >
                {availableMonths.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-slate-400 font-normal">
                (1日至月末应完成)
              </span>
            </div>
          )}
        </div>

        {/* Right: 快捷动作按钮 */}
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer flex items-center gap-1 font-bold"
            title="刷新看板时效数据"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">刷新</span>
          </button>

          <button
            onClick={onOpenConfigPage}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all cursor-pointer flex items-center gap-1.5 font-bold shadow-xs"
          >
            <Settings className="w-3.5 h-3.5 text-blue-400" />
            <span>SLA 阈值与规则配置</span>
          </button>
        </div>
      </div>

      {/* Row 2: 2. 仓库多选下拉筛选 + 3. 延迟状态筛选 */}
      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Warehouse Multi-select Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsWarehouseDropdownOpen(!isWarehouseDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold transition-colors cursor-pointer"
            >
              <Warehouse className="w-3.5 h-3.5 text-blue-600" />
              <span>
                仓库范围:{' '}
                {isAllWarehousesSelected
                  ? '全部仓库 (默认)'
                  : `已选 ${selectedWarehouseIds.length} 个仓库`}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Dropdown Menu */}
            {isWarehouseDropdownOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-30 space-y-2 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="font-bold text-slate-800 text-xs">
                    多选仓库范围
                  </span>
                  <div className="flex items-center gap-2 text-[11px]">
                    <button
                      onClick={handleSelectAllWarehouses}
                      className="text-blue-600 hover:underline cursor-pointer"
                    >
                      全选
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      onClick={handleClearAllWarehouses}
                      className="text-slate-500 hover:underline cursor-pointer"
                    >
                      清空
                    </button>
                  </div>
                </div>

                <div className="space-y-1 max-h-56 overflow-y-auto">
                  {MOCK_SLA_WAREHOUSES.map((wh) => {
                    const isChecked = selectedWarehouseIds.includes(wh.id);
                    return (
                      <label
                        key={wh.id}
                        className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleWarehouseToggle(wh.id)}
                          className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                        />
                        <span className="font-mono text-slate-500 font-bold text-[11px]">
                          {wh.code}
                        </span>
                        <span className="text-slate-800 text-xs truncate">
                          {wh.name}
                        </span>
                      </label>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => setIsWarehouseDropdownOpen(false)}
                    className="px-3 py-1 bg-blue-600 text-white rounded-lg font-bold text-xs hover:bg-blue-500 cursor-pointer"
                  >
                    确定
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Delay Status Filter: 全部 / 已延迟 / 未延迟 */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <span className="text-slate-400 text-[11px] px-2 font-medium">
              延迟状态:
            </span>
            <button
              onClick={() => onChangeDelayFilter('ALL')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                delayFilter === 'ALL'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              全部
            </button>
            <button
              onClick={() => onChangeDelayFilter('DELAYED')}
              className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer ${
                delayFilter === 'DELAYED'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-rose-600 hover:bg-rose-50'
              }`}
            >
              <AlertCircle className="w-3 h-3" />
              <span>已延迟 (至少1节点超时)</span>
            </button>
            <button
              onClick={() => onChangeDelayFilter('ON_TIME')}
              className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer ${
                delayFilter === 'ON_TIME'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>未延迟 (全部按时)</span>
            </button>
          </div>
        </div>

        {/* Info hint */}
        <div className="text-[11px] text-slate-400">
          * 筛选参数已联动上方仓库卡片、4节点透视表与时效折线图
        </div>
      </div>
    </div>
  );
};
