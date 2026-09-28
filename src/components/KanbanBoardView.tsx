import React from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  Clock,
  Send,
  CheckCircle,
  Truck,
  ArrowRight,
  Boxes,
  Eye,
} from 'lucide-react';
import { PriorityLevel, ReplenishItem, ReplenishTask } from '../types/replenishment';

interface KanbanBoardViewProps {
  items: ReplenishItem[];
  tasks: ReplenishTask[];
  onManualDispatch: (itemIds: string[]) => void;
  onCompleteTask: (taskId: string) => void;
  onOpenItemDetail: (item: ReplenishItem) => void;
}

export const KanbanBoardView: React.FC<KanbanBoardViewProps> = ({
  items,
  tasks,
  onManualDispatch,
  onCompleteTask,
  onOpenItemDetail,
}) => {
  // 1. Pending dispatch items (triggered items without in_progress or completed active tasks)
  const pendingItems = items.filter((item) => {
    const active = tasks.find(
      (t) => t.itemId === item.id && (t.status === 'in_progress' || t.status === 'completed')
    );
    return !active && item.isTriggered;
  });

  // 2. In progress tasks
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress');

  // 3. Completed tasks
  const completedTasks = tasks.filter((t) => t.status === 'completed');

  // Priority color helper
  const getPriorityBorder = (p: PriorityLevel) => {
    if (p === 'P0') return 'border-l-4 border-l-red-500 bg-red-50/20';
    if (p === 'P1') return 'border-l-4 border-l-amber-500 bg-amber-50/20';
    if (p === 'P2') return 'border-l-4 border-l-blue-500 bg-blue-50/20';
    return 'border-l-4 border-l-slate-300';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {/* Column 1: 待下发候选池 (一期人工圈选 / 二期待调度) */}
      <div className="bg-slate-100/70 rounded-xl p-4 border border-slate-200 flex flex-col h-[750px]">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <h3 className="font-bold text-slate-800 text-sm">待下发补货候选池</h3>
          </div>
          <span className="bg-amber-100 text-amber-800 text-xs font-mono font-bold px-2 py-0.5 rounded-full">
            {pendingItems.length} 项
          </span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {pendingItems.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-lg p-3.5 shadow-xs border border-slate-200 hover:shadow-md transition-shadow ${getPriorityBorder(
                item.priority
              )}`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    item.priority === 'P0'
                      ? 'bg-red-100 text-red-700'
                      : item.priority === 'P1'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {item.priority}
                  {item.priority === 'P0' && ' · 断货挂起'}
                  {item.priority === 'P1' && ' · 紧缺'}
                  {item.priority === 'P2' && ' · 预警'}
                </span>

                <span className="text-[11px] font-mono text-slate-500">
                  {item.zone.slice(0, 2)}
                </span>
              </div>

              <h4
                className="font-bold text-slate-800 text-xs hover:text-blue-600 cursor-pointer"
                onClick={() => onOpenItemDetail(item)}
              >
                {item.skuName}
              </h4>
              <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                {item.skuCode}
              </p>

              {/* Location Route */}
              <div className="bg-slate-50 rounded p-2 my-2.5 text-[11px] border border-slate-100 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">一层拣货位:</span>
                  <span className="font-mono font-bold text-slate-700">
                    {item.pickLocationCode} (库存 {item.currentPickStock})
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">推荐备货源:</span>
                  <span className="font-mono font-bold text-emerald-700 flex items-center gap-1">
                    {item.recommendedSourceLocation?.locationCode || '无'}
                    {item.recommendedSourceLocation?.isSameRack && (
                      <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1 rounded">
                        同架垂直
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* Metrics bar */}
              <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 border-t border-slate-100">
                <div>
                  均销: <strong className="font-mono">{item.avgDailySales}</strong> /日
                </div>
                <div>
                  可用: <strong className="font-mono text-amber-600">{item.daysOfSupply}</strong> 天
                </div>
                <div>
                  建议补: <strong className="font-mono text-blue-600">{item.suggestedReplenishQty}</strong> {item.unit}
                </div>
              </div>

              {/* Action */}
              <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  onClick={() => onOpenItemDetail(item)}
                  className="text-xs text-slate-400 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3 h-3" />
                  <span>详情</span>
                </button>
                <button
                  onClick={() => onManualDispatch([item.id])}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                >
                  <Send className="w-3 h-3" />
                  <span>下发补货任务</span>
                </button>
              </div>
            </div>
          ))}

          {pendingItems.length === 0 && (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
              <Boxes className="w-8 h-8 text-slate-300 mb-1" />
              <span>当前无待下发项</span>
            </div>
          )}
        </div>
      </div>

      {/* Column 2: 搬运移库中 (In Progress) */}
      <div className="bg-slate-100/70 rounded-xl p-4 border border-slate-200 flex flex-col h-[750px]">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
            <h3 className="font-bold text-slate-800 text-sm">搬运移库中 (作业执行)</h3>
          </div>
          <span className="bg-blue-100 text-blue-800 text-xs font-mono font-bold px-2 py-0.5 rounded-full">
            {inProgressTasks.length} 单
          </span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {inProgressTasks.map((task) => (
            <div
              key={task.taskId}
              className="bg-white rounded-lg p-3.5 shadow-xs border border-blue-200 hover:shadow-md transition-shadow relative overflow-hidden"
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="text-[10px] font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-bold">
                  {task.taskId}
                </span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    task.priority === 'P0'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {task.priority}
                </span>
              </div>

              <h4 className="font-bold text-slate-800 text-xs">{task.skuName}</h4>
              <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                {task.skuCode}
              </p>

              {/* Movement Route Box */}
              <div className="bg-blue-50/50 rounded-lg p-2.5 my-2.5 border border-blue-100 text-xs">
                <div className="flex items-center justify-between font-mono font-bold">
                  <div className="text-slate-700">
                    <span className="text-[10px] text-slate-400 block font-normal">
                      源位 ({task.sourceLevel === 2 ? '二层备货' : '三层备货'}):
                    </span>
                    {task.sourceLocationCode}
                  </div>
                  <ArrowRight className="w-4 h-4 text-blue-500 mx-2" />
                  <div className="text-slate-900 text-right">
                    <span className="text-[10px] text-slate-400 block font-normal">
                      目标 (一层拣选):
                    </span>
                    {task.targetLocationCode}
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-blue-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">移库件数:</span>
                  <span className="font-bold text-blue-700 font-mono text-sm">
                    {task.requestedQty} {task.unit}
                  </span>
                </div>
              </div>

              {/* Operator info */}
              <div className="text-[11px] text-slate-500 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-slate-400" />
                  <span>{task.operator || '待接单作业员'}</span>
                </div>
                <span className="text-[10px] text-slate-400">{task.dispatchedAt.slice(11)}</span>
              </div>

              {/* Complete button */}
              <button
                onClick={() => onCompleteTask(task.taskId)}
                className="w-full mt-3 bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 rounded text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-xs"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>确认上架完成 (增加一层库存)</span>
              </button>
            </div>
          ))}

          {inProgressTasks.length === 0 && (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
              <Truck className="w-8 h-8 text-slate-300 mb-1" />
              <span>暂无正在搬运的补货任务</span>
            </div>
          )}
        </div>
      </div>

      {/* Column 3: 今日已完成上架 (Completed) */}
      <div className="bg-slate-100/70 rounded-xl p-4 border border-slate-200 flex flex-col h-[750px]">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <h3 className="font-bold text-slate-800 text-sm">今日已完成上架</h3>
          </div>
          <span className="bg-emerald-100 text-emerald-800 text-xs font-mono font-bold px-2 py-0.5 rounded-full">
            {completedTasks.length} 单
          </span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {completedTasks.map((task) => (
            <div
              key={task.taskId}
              className="bg-white rounded-lg p-3.5 shadow-xs border border-emerald-100 hover:shadow-md transition-shadow opacity-90"
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="text-[10px] font-mono text-slate-500">
                  {task.taskId}
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-semibold flex items-center gap-0.5">
                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                  已上架
                </span>
              </div>

              <h4 className="font-bold text-slate-800 text-xs">{task.skuName}</h4>
              <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                {task.skuCode}
              </p>

              <div className="bg-slate-50 rounded p-2 my-2 text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">已补入拣货位:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {task.targetLocationCode}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">实际补货量:</span>
                  <span className="font-mono font-bold text-emerald-700">
                    +{task.actualQty || task.requestedQty} {task.unit}
                  </span>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100">
                <span>作业人: {task.operator}</span>
                <span>{task.completedAt?.slice(11)}</span>
              </div>
            </div>
          ))}

          {completedTasks.length === 0 && (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
              <CheckCircle className="w-8 h-8 text-slate-300 mb-1" />
              <span>今日尚未有完成记录</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
