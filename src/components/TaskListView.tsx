import React, { useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  Clock,
  ArrowDown,
  Info,
  Layers,
  Send,
  CheckCircle,
  Eye,
  Download,
  Printer,
  ChevronRight,
  TrendingDown,
  FileSpreadsheet,
} from 'lucide-react';
import { PriorityLevel, ReplenishItem, ReplenishTask } from '../types/replenishment';

interface TaskListViewProps {
  items: ReplenishItem[];
  tasks: ReplenishTask[];
  systemPhase: 'phase1' | 'phase2';
  selectedItemIds: string[];
  onToggleSelectItem: (id: string) => void;
  onSelectAll: (select: boolean) => void;
  onSelectAllByPriority: (priority: PriorityLevel) => void;
  onManualDispatch: (itemIds: string[]) => void;
  onOpenItemDetail: (item: ReplenishItem) => void;
  onCompleteTask: (taskId: string) => void;
  onUpdateQty: (itemId: string, newQty: number) => void;
  onOpenPhase1Export: () => void;
}

export const TaskListView: React.FC<TaskListViewProps> = ({
  items,
  tasks,
  systemPhase,
  selectedItemIds,
  onToggleSelectItem,
  onSelectAll,
  onSelectAllByPriority,
  onManualDispatch,
  onOpenItemDetail,
  onCompleteTask,
  onUpdateQty,
  onOpenPhase1Export,
}) => {
  const [hoveredSalesSku, setHoveredSalesSku] = useState<string | null>(null);

  const isAllSelected = items.length > 0 && selectedItemIds.length === items.length;
  const selectedItems = items.filter((i) => selectedItemIds.includes(i.id));
  const totalSelectedQty = selectedItems.reduce(
    (sum, i) => sum + i.suggestedReplenishQty,
    0
  );

  const getPriorityBadge = (priority: PriorityLevel, days: number, backorders: number) => {
    switch (priority) {
      case 'P0':
        return (
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-red-100 text-red-700 border border-red-200 font-semibold text-xs animate-pulse">
            <AlertOctagon className="w-3.5 h-3.5 text-red-600" />
            <span>P0 紧急断货</span>
          </div>
        );
      case 'P1':
        return (
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200 font-semibold text-xs">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>P1 紧缺 (&lt;1天)</span>
          </div>
        );
      case 'P2':
        return (
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 border border-blue-200 font-medium text-xs">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>P2 预警 (&lt;2天)</span>
          </div>
        );
      default:
        return (
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 text-xs">
            <span>正常</span>
          </div>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Pilot Phase 1 Quick Selection & Batch Action Toolbar */}
      {selectedItemIds.length > 0 && (
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-inner">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-blue-800/80 px-2.5 py-1 rounded-md text-xs font-semibold">
              <span>已圈选:</span>
              <span className="text-yellow-300 font-mono text-sm">
                {selectedItemIds.length}
              </span>
              <span>项</span>
            </div>
            <div className="text-xs text-blue-200">
              总建议补货件数: <strong className="text-white font-mono text-sm">{totalSelectedQty}</strong> 件
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Phase 1 manual dispatch button */}
            <button
              onClick={() => onManualDispatch(selectedItemIds)}
              className="flex items-center gap-1.5 bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-bold text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-sm"
              title="一期试点：人工圈选SKU批量手动下发补货任务到现场"
            >
              <Send className="w-3.5 h-3.5 text-slate-900" />
              <span>批量手动下发任务</span>
            </button>

            {/* Export Selected to Phase 1 Modal */}
            <button
              onClick={onOpenPhase1Export}
              className="flex items-center gap-1.5 bg-blue-700 hover:bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>打印/导出清单</span>
            </button>

            <button
              onClick={() => onSelectAll(false)}
              className="text-xs text-blue-300 hover:text-white px-2 py-1 cursor-pointer"
            >
              取消圈选
            </button>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100/90 text-slate-700 border-b border-slate-200 font-semibold uppercase tracking-wider text-[11px]">
              <th className="p-3 w-10 text-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </th>
              <th className="p-3 w-28">优先级判定</th>
              <th className="p-3 min-w-[200px]">SKU 信息</th>
              <th className="p-3 w-32">一层拣货位 / 库存</th>
              <th className="p-3 w-28">7日平均销量</th>
              <th className="p-3 w-28">剩余可用天数</th>
              <th className="p-3 min-w-[150px]">推荐源库位</th>
              <th className="p-3 w-28">建议补货量</th>
              <th className="p-3 w-24">当前状态</th>
              <th className="p-3 w-24 text-center">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => {
              const isSelected = selectedItemIds.includes(item.id);
              const activeTask = tasks.find(
                (t) => t.itemId === item.id && t.status !== 'cancelled'
              );

              return (
                <tr
                  key={item.id}
                  className={`hover:bg-blue-50/40 transition-colors ${
                    isSelected ? 'bg-blue-50/60' : ''
                  } ${item.priority === 'P0' ? 'bg-red-50/20' : ''}`}
                >
                  {/* Selection Checkbox */}
                  <td className="p-3 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelectItem(item.id)}
                      className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </td>

                  {/* Priority */}
                  <td className="p-3">
                    {getPriorityBadge(
                      item.priority,
                      item.daysOfSupply,
                      item.pendingBackorderCount
                    )}
                    {item.pendingBackorderCount > 0 && (
                      <div className="text-[10px] text-red-600 font-medium mt-0.5">
                        挂起 {item.pendingBackorderCount} 单
                      </div>
                    )}
                  </td>

                  {/* SKU Details */}
                  <td className="p-3">
                    <div className="font-semibold text-slate-800 hover:text-blue-600 cursor-pointer"
                         onClick={() => onOpenItemDetail(item)}>
                      {item.skuName}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                      <span>{item.skuCode}</span>
                      <span className="text-slate-300">|</span>
                      <span>{item.specification}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {item.zone} · 货架: <span className="font-mono text-slate-600">{item.rackCode}</span>
                    </div>
                  </td>

                  {/* Pick Location & Current Available Stock */}
                  <td className="p-3">
                    <div className="font-mono font-bold text-slate-800 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                      {item.pickLocationCode}
                    </div>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-slate-400 text-[11px]">可用:</span>
                      <span
                        className={`font-mono font-bold text-sm ${
                          item.currentPickStock === 0
                            ? 'text-red-600'
                            : item.currentPickStock < item.avgDailySales
                            ? 'text-amber-600'
                            : 'text-emerald-700'
                        }`}
                      >
                        {item.currentPickStock}
                      </span>
                      <span className="text-slate-400 text-[10px]">{item.unit}</span>
                    </div>
                    {item.currentPickStock < item.avgDailySales && (
                      <div className="text-[10px] text-amber-700 flex items-center gap-0.5">
                        <TrendingDown className="w-3 h-3" />
                        <span>低于7日均销</span>
                      </div>
                    )}
                  </td>

                  {/* 7-Day Average Sales & Popover trigger */}
                  <td className="p-3 relative">
                    <div
                      className="cursor-help inline-block group"
                      onMouseEnter={() => setHoveredSalesSku(item.id)}
                      onMouseLeave={() => setHoveredSalesSku(null)}
                    >
                      <div className="flex items-center gap-1">
                        <span className="font-mono font-bold text-slate-900 text-sm">
                          {item.avgDailySales}
                        </span>
                        <span className="text-[10px] text-slate-400">{item.unit}/日</span>
                        <Info className="w-3 h-3 text-slate-400 group-hover:text-blue-600" />
                      </div>
                      <div className="text-[10px] text-slate-400">
                        有效天数: {item.validSalesDays}天
                      </div>

                      {/* Tooltip with 7 days breakdown */}
                      {hoveredSalesSku === item.id && (
                        <div className="absolute z-20 left-0 top-full mt-1 w-64 bg-slate-900 text-white rounded-lg p-3 shadow-xl text-xs">
                          <div className="font-bold border-b border-slate-700 pb-1 mb-1.5 flex justify-between">
                            <span>近 7 日出库明细</span>
                            <span className="text-amber-300 text-[10px]">剔除促销日</span>
                          </div>
                          <div className="space-y-1">
                            {item.dailySalesHistory.map((d) => (
                              <div
                                key={d.date}
                                className={`flex justify-between items-center text-[11px] ${
                                  d.isPromoAnomaly
                                    ? 'text-red-400 line-through'
                                    : 'text-slate-200'
                                }`}
                              >
                                <span>{d.date.slice(5)} ({d.dayLabel}):</span>
                                <span className="font-mono">
                                  {d.quantity} {item.unit}
                                  {d.isPromoAnomaly && ' (大促已剔除)'}
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="mt-2 pt-1.5 border-t border-slate-700 text-[10px] text-slate-300">
                            公式: 有效出库 {item.total7DaySales} ÷ {item.validSalesDays}天 = {item.avgDailySales}
                          </div>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Days of Supply (剩余可用天数) */}
                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`font-mono font-bold text-sm ${
                          item.daysOfSupply <= 0
                            ? 'text-red-600'
                            : item.daysOfSupply < 1
                            ? 'text-amber-600'
                            : item.daysOfSupply < 2
                            ? 'text-blue-600'
                            : 'text-slate-700'
                        }`}
                      >
                        {item.daysOfSupply}
                      </span>
                      <span className="text-[11px] text-slate-400">天</span>
                    </div>

                    {/* Progress bar visual meter */}
                    <div className="w-16 h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          item.daysOfSupply <= 0
                            ? 'bg-red-500 w-full'
                            : item.daysOfSupply < 1
                            ? 'bg-amber-500'
                            : item.daysOfSupply < 2
                            ? 'bg-blue-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{
                          width: `${Math.min(100, Math.max(10, item.daysOfSupply * 25))}%`,
                        }}
                      ></div>
                    </div>
                  </td>

                  {/* Recommended Source Location (Priority: Same rack 2nd floor > 3rd floor > other) */}
                  <td className="p-3">
                    {item.recommendedSourceLocation ? (
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-800">
                            {item.recommendedSourceLocation.locationCode}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {item.recommendedSourceLocation.level === 2 ? '二层' : '三层'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          备货余量:{' '}
                          <strong className="text-slate-700 font-mono">
                            {item.recommendedSourceLocation.availableStock}
                          </strong>{' '}
                          {item.unit}
                          <span className="text-slate-300 mx-1">|</span>
                          <span className="font-mono text-[10px] text-slate-400">
                            {item.recommendedSourceLocation.batchNo}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-red-500 text-xs">⚠️ 备货区无库存</span>
                    )}
                  </td>

                  {/* Suggested Replenish Quantity */}
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="1"
                        value={item.suggestedReplenishQty}
                        onChange={(e) =>
                          onUpdateQty(item.id, parseInt(e.target.value) || 0)
                        }
                        className="w-14 px-1.5 py-0.5 text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-center"
                      />
                      <span className="text-[11px] text-slate-400">{item.unit}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      系数: {item.config.replenishCoefficient}x (
                      {Math.ceil(item.avgDailySales * item.config.replenishCoefficient)})
                    </div>
                  </td>

                  {/* Current Status */}
                  <td className="p-3">
                    {activeTask ? (
                      activeTask.status === 'in_progress' ? (
                        <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded text-[11px] font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></span>
                          移库搬运中
                        </span>
                      ) : activeTask.status === 'completed' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px] font-medium">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          已上架
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">待下发</span>
                      )
                    ) : (
                      <span className="text-slate-300 text-xs">—</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {activeTask?.status === 'in_progress' ? (
                        <button
                          onClick={() => onCompleteTask(activeTask.taskId)}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
                          title="模拟现场叉车工上架完成，自动增加一层拣货库存"
                        >
                          <CheckCircle className="w-3 h-3" />
                          <span>完成上架</span>
                        </button>
                      ) : activeTask?.status === 'completed' ? (
                        <span className="text-xs text-slate-400">已处理</span>
                      ) : null}

                      {/* Detail drill-down */}
                      <button
                        onClick={() => onOpenItemDetail(item)}
                        className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                        title="查看7日动销与货架图"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {items.length === 0 && (
        <div className="p-12 text-center text-slate-400">
          <Layers className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="text-sm">暂无符合当前筛选条件的补货项</p>
          <p className="text-xs text-slate-400 mt-1">
            请尝试调整库区、优先级筛选或清空搜索关键词
          </p>
        </div>
      )}
    </div>
  );
};
