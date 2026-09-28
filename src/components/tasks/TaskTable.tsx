import React from 'react';
import {
  Clock,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  XCircle,
  Eye,
  Send,
  UserCheck,
  Package,
  Layers,
  ShieldAlert,
} from 'lucide-react';
import {
  ReplenishTaskRecord,
  TaskManagementStatus,
  TaskPriority,
} from '../../types/taskManagement';

interface TaskTableProps {
  tasks: ReplenishTaskRecord[];
  onOpenDetail: (task: ReplenishTaskRecord) => void;
  onOpenDispatch: (task: ReplenishTaskRecord) => void;
  onOpenExceptionReview: (task: ReplenishTaskRecord) => void;
  warningHours: number;
  escalateHours: number;
}

export const TaskTable: React.FC<TaskTableProps> = ({
  tasks,
  onOpenDetail,
  onOpenDispatch,
  onOpenExceptionReview,
  warningHours,
  escalateHours,
}) => {
  const getStatusBadge = (status: TaskManagementStatus) => {
    switch (status) {
      case 'pending_dispatch':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            待派单
          </span>
        );
      case 'dispatched':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            已派单 (待认领)
          </span>
        );
      case 'claimed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <UserCheck className="w-3 h-3 text-indigo-600" />
            已领取
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-cyan-50 text-cyan-800 border border-cyan-200">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping"></span>
            进行中
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            已完成
          </span>
        );
      case 'exception_review':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            异常待核实
          </span>
        );
      case 'exception_closed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
            <XCircle className="w-3.5 h-3.5 text-slate-400" />
            异常关闭
          </span>
        );
    }
  };

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'P0':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-black bg-red-600 text-white shadow-xs">
            P0 紧急
          </span>
        );
      case 'P1':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500 text-white shadow-xs">
            P1 紧缺
          </span>
        );
      case 'P2':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500 text-white shadow-xs">
            P2 预警
          </span>
        );
    }
  };

  const formatTimeoutCell = (task: ReplenishTaskRecord) => {
    if (task.status === 'completed' || task.status === 'exception_closed') {
      return (
        <span className="text-slate-400 text-[11px] font-mono">
          正常完工 ({Math.round(task.elapsedMinutes)}分)
        </span>
      );
    }

    const elapsedHours = task.elapsedMinutes / 60;

    if (task.isEscalated || elapsedHours >= escalateHours) {
      return (
        <div className="flex flex-col items-center">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-black bg-red-600 text-white border border-red-700 animate-pulse">
            <AlertOctagon className="w-3 h-3" />
            已超 {elapsedHours.toFixed(1)}h
          </span>
          <span className="text-[10px] text-red-600 font-bold mt-0.5">
            已升级组长督办
          </span>
        </div>
      );
    }

    if (task.isWarning || elapsedHours >= warningHours) {
      return (
        <div className="flex flex-col items-center">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-red-700 border border-red-300">
            <Clock className="w-3 h-3 text-red-600" />
            超时 {elapsedHours.toFixed(1)}h
          </span>
          <span className="text-[10px] text-amber-700 font-medium mt-0.5">
            限时 {warningHours}h 标红预警
          </span>
        </div>
      );
    }

    return (
      <span className="text-slate-500 font-mono text-[11px]">
        已耗时 {Math.round(task.elapsedMinutes)}分
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
              <th className="py-3 px-3.5">任务 ID / 仓库</th>
              <th className="py-3 px-3 text-center">优先级</th>
              <th className="py-3 px-4">SKU / 产品名称</th>
              <th className="py-3 px-3 text-center">源库位 → 目标库位</th>
              <th className="py-3 px-3 text-center">补货量 / 已补量</th>
              <th className="py-3 px-3 text-center">状态</th>
              <th className="py-3 px-3">补货员</th>
              <th className="py-3 px-3">生成时间 / 完成时间</th>
              <th className="py-3 px-3 text-center">超时时长与预警</th>
              <th className="py-3 px-3 text-center">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-slate-400">
                  <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  当前无符合条件的补货任务记录
                </td>
              </tr>
            ) : (
              tasks.map((task) => {
                const isOverdue =
                  task.status !== 'completed' &&
                  task.status !== 'exception_closed' &&
                  (task.isWarning || task.isEscalated);

                return (
                  <tr
                    key={task.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      task.isEscalated
                        ? 'bg-red-50/40'
                        : task.status === 'exception_review'
                        ? 'bg-rose-50/30'
                        : ''
                    }`}
                  >
                    {/* 任务 ID / 仓库 */}
                    <td className="py-3 px-3.5">
                      <div className="font-mono font-bold text-slate-800 flex items-center gap-1">
                        {task.id}
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium">
                        {task.warehouseName}
                      </div>
                    </td>

                    {/* 优先级 */}
                    <td className="py-3 px-3 text-center">
                      {getPriorityBadge(task.priority)}
                    </td>

                    {/* SKU / 产品名称 */}
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-mono font-bold text-blue-700">{task.sku}</div>
                      <div
                        className="text-slate-700 truncate font-medium text-[11px]"
                        title={task.productName}
                      >
                        {task.productName}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {task.specification}
                      </span>
                    </td>

                    {/* 源库位 -> 目标库位 */}
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5 font-mono text-[11px]">
                        <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                          {task.sourceLocation} ({task.sourceLevel}层)
                        </span>
                        <span className="text-slate-400">→</span>
                        <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200 font-bold">
                          {task.targetLocation} (1层)
                        </span>
                      </div>
                    </td>

                    {/* 补货量 / 已补量 */}
                    <td className="py-3 px-3 text-center font-mono">
                      <div className="font-bold text-slate-800">
                        <span className="text-blue-600">{task.actualQty}</span>
                        <span className="text-slate-400"> / </span>
                        <span>{task.requestedQty}</span>
                        <span className="text-[10px] text-slate-500 font-normal ml-0.5">
                          {task.unit}
                        </span>
                      </div>
                      {task.requestedQty > 0 && (
                        <div className="w-16 bg-slate-100 rounded-full h-1.5 mx-auto mt-1 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full ${
                              task.actualQty >= task.requestedQty
                                ? 'bg-emerald-500'
                                : 'bg-blue-500'
                            }`}
                            style={{
                              width: `${Math.min(
                                100,
                                Math.round((task.actualQty / task.requestedQty) * 100)
                              )}%`,
                            }}
                          ></div>
                        </div>
                      )}
                    </td>

                    {/* 状态 */}
                    <td className="py-3 px-3 text-center">
                      {getStatusBadge(task.status)}
                    </td>

                    {/* 补货员 */}
                    <td className="py-3 px-3 text-[11px]">
                      {task.claimedBy ? (
                        <span className="font-medium text-slate-800">
                          {task.claimedBy}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">待认领</span>
                      )}
                    </td>

                    {/* 生成时间 / 完成时间 */}
                    <td className="py-3 px-3 text-[11px] font-mono">
                      <div className="text-slate-600">生: {task.createdAt.slice(11)}</div>
                      <div className="text-slate-400">
                        完: {task.completedAt ? task.completedAt.slice(11) : '--'}
                      </div>
                    </td>

                    {/* 超时时长 */}
                    <td className="py-3 px-3 text-center">
                      {formatTimeoutCell(task)}
                    </td>

                    {/* 操作 */}
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onOpenDetail(task)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title="查看完整流转历史与时间戳"
                        >
                          <Eye className="w-3 h-3 text-slate-500" />
                          <span>详情</span>
                        </button>

                        {task.status === 'pending_dispatch' && (
                          <button
                            onClick={() => onOpenDispatch(task)}
                            className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                          >
                            <Send className="w-3 h-3" />
                            <span>派单</span>
                          </button>
                        )}

                        {task.status === 'exception_review' && (
                          <button
                            onClick={() => onOpenExceptionReview(task)}
                            className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                            title="库管员PC核实并执行异常关闭"
                          >
                            <ShieldAlert className="w-3 h-3" />
                            <span>核实关闭</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
