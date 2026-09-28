import React from 'react';
import {
  X,
  Clock,
  User,
  MapPin,
  Package,
  Layers,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Calendar,
  Phone,
} from 'lucide-react';
import { ReplenishTaskRecord } from '../../types/taskManagement';

interface TaskDetailModalProps {
  task: ReplenishTaskRecord | null;
  onClose: () => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  onClose,
}) => {
  if (!task) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150 text-xs">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-slate-800 text-sm sm:text-base font-mono">
                  {task.id}
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-100 text-red-700 border border-red-200">
                  {task.priority} 优先级
                </span>
              </div>
              <p className="text-slate-500 text-[11px]">
                {task.warehouseName} | 补货任务全链路流转记录
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* SKU & Location Grid */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-400 block text-[11px]">商品信息</span>
              <div className="font-bold text-slate-800 text-sm mt-0.5">
                {task.productName}
              </div>
              <div className="font-mono text-blue-700 font-semibold mt-0.5">
                {task.sku}
              </div>
              <div className="text-slate-500 text-[11px] mt-0.5">
                规格: {task.specification} | 类别: {task.category}
              </div>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">库位与货量</span>
              <div className="flex items-center gap-2 font-mono mt-1">
                <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold">
                  {task.sourceLocation} ({task.sourceLevel}层)
                </span>
                <span className="text-slate-400">→</span>
                <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                  {task.targetLocation} (1层)
                </span>
              </div>
              <div className="mt-1.5 text-slate-700 font-mono">
                补货量: <strong className="text-slate-900">{task.requestedQty}</strong> {task.unit} |
                已移库: <strong className="text-blue-600 font-bold">{task.actualQty}</strong> {task.unit}
              </div>
              <div className="text-slate-400 text-[10px] mt-0.5">
                派单人: {task.dispatcher} | 领取人: {task.claimedBy || '待认领'} {task.workerPhone && `(${task.workerPhone})`}
              </div>
            </div>
          </div>

          {/* Exception Banner if applicable */}
          {(task.status === 'exception_review' || task.status === 'exception_closed') && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 space-y-1 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-rose-800">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>现场异常上报记录 [{task.exceptionType || '其他异常'}]</span>
              </div>
              <div className="text-rose-700 pl-5">
                <p><strong>异常说明:</strong> {task.exceptionReason || '现场上报作业异常'}</p>
                <p className="text-[11px] text-rose-500 mt-0.5">
                  上报人: {task.exceptionReportedBy} ({task.exceptionReportedAt})
                </p>
                {task.exceptionReviewNote && (
                  <p className="mt-1 text-slate-700 bg-white/80 p-2 rounded border border-rose-200">
                    <strong>库管员 PC 核实意见:</strong> {task.exceptionReviewNote}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Audit Trail: Status Change Log (Operator + Timestamp) */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>状态变更流水日志 (操作人 + 操作时间戳)</span>
            </h4>

            <div className="relative pl-6 border-l-2 border-slate-200 space-y-3.5 mt-2">
              {task.history.map((log) => (
                <div key={log.id} className="relative">
                  {/* Timeline dot */}
                  <div className="absolute -left-[31px] top-0.5 w-3.5 h-3.5 rounded-full bg-white border-2 border-blue-600"></div>

                  <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 text-xs">
                          {log.action}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-blue-100 text-blue-800">
                          {log.toStatus}
                        </span>
                      </div>
                      <span className="font-mono text-slate-400 text-[11px]">
                        {log.timestamp}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      <span>操作人: <strong className="text-slate-700">{log.operator}</strong></span>
                    </div>

                    {log.note && (
                      <div className="text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-200 mt-1 font-mono">
                        {log.note}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};
