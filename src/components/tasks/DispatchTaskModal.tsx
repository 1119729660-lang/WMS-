import React, { useState } from 'react';
import {
  X,
  Send,
  UserCheck,
  Zap,
  Flame,
  CheckCircle2,
  Phone,
  Layers,
} from 'lucide-react';
import {
  ReplenishTaskRecord,
  ReplenishmentWorker,
  DispatchMode,
} from '../../types/taskManagement';

interface DispatchTaskModalProps {
  task: ReplenishTaskRecord | null;
  onClose: () => void;
  workers: ReplenishmentWorker[];
  defaultDispatchMode: DispatchMode;
  onConfirmDispatch: (
    taskId: string,
    mode: DispatchMode,
    workerName?: string,
    workerPhone?: string
  ) => void;
}

export const DispatchTaskModal: React.FC<DispatchTaskModalProps> = ({
  task,
  onClose,
  workers,
  defaultDispatchMode,
  onConfirmDispatch,
}) => {
  const [selectedMode, setSelectedMode] = useState<DispatchMode>(defaultDispatchMode);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>(
    workers[0]?.id || ''
  );

  if (!task) return null;

  // Derive target zone from targetLocation (e.g. "A-01-03-01" -> "A区")
  const targetZone = task.targetLocation.split('-')[0] + '区';

  // Find nearest worker for auto mode
  const nearestWorker =
    workers.find((w) => w.assignedZone.includes(targetZone.charAt(0))) ||
    workers[0];

  const handleDispatch = () => {
    if (selectedMode === 'manual_assign') {
      const worker = workers.find((w) => w.id === selectedWorkerId);
      if (worker) {
        onConfirmDispatch(task.id, 'manual_assign', worker.name, worker.phone);
      }
    } else if (selectedMode === 'nearby_auto') {
      onConfirmDispatch(
        task.id,
        'nearby_auto',
        nearestWorker?.name,
        nearestWorker?.phone
      );
    } else {
      // worker_grab
      onConfirmDispatch(task.id, 'worker_grab');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 text-xs">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">任务派单调度</h3>
              <p className="text-[11px] text-slate-400 font-mono">
                {task.id} | {task.sku}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Task Summary Brief */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5 font-mono text-[11px]">
          <div className="flex justify-between">
            <span className="text-slate-500">商品名称:</span>
            <span className="font-bold text-slate-800">{task.productName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">移库路径:</span>
            <span className="text-slate-800">
              {task.sourceLocation} ({task.sourceLevel}层) →{' '}
              <strong className="text-emerald-600 font-bold">
                {task.targetLocation} (1层)
              </strong>
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">目标库区:</span>
            <span className="text-blue-600 font-bold">{targetZone}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">申请补货量:</span>
            <span className="font-bold text-red-600">
              {task.requestedQty} {task.unit} (优先级: {task.priority})
            </span>
          </div>
        </div>

        {/* Dispatch Mode Selector */}
        <div className="space-y-2">
          <label className="font-bold text-slate-700 block">选择派单模式:</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setSelectedMode('nearby_auto')}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                selectedMode === 'nearby_auto'
                  ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-1.5 text-blue-700 font-bold">
                <Zap className="w-3.5 h-3.5" />
                <span>就近自动派单</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                根据库位所属区域自动匹配空闲补货员
              </p>
            </button>

            <button
              onClick={() => setSelectedMode('manual_assign')}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                selectedMode === 'manual_assign'
                  ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-1.5 text-blue-700 font-bold">
                <UserCheck className="w-3.5 h-3.5" />
                <span>手动指定人员</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                调度员指定具体补货员负责搬运
              </p>
            </button>

            <button
              onClick={() => setSelectedMode('worker_grab')}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                selectedMode === 'worker_grab'
                  ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-1.5 text-blue-700 font-bold">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>补货员抢单</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                下发至公共抢单池，补货员PDA自由认领
              </p>
            </button>
          </div>
        </div>

        {/* Dynamic Mode Details */}
        {selectedMode === 'nearby_auto' && (
          <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200 flex items-center justify-between">
            <div>
              <div className="font-bold text-emerald-800">
                推荐匹配人选: {nearestWorker.name} ({nearestWorker.assignedZone})
              </div>
              <div className="text-[11px] text-emerald-700 mt-0.5">
                当前活跃任务数: {nearestWorker.currentActiveTasks} 笔 | 电话: {nearestWorker.phone}
              </div>
            </div>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
        )}

        {selectedMode === 'manual_assign' && (
          <div className="space-y-1.5">
            <label className="text-slate-600 font-medium">选择指定补货员:</label>
            <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
              {workers.map((w) => (
                <label
                  key={w.id}
                  className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer ${
                    selectedWorkerId === w.id
                      ? 'bg-blue-50 border-blue-300'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="worker_assign"
                      checked={selectedWorkerId === w.id}
                      onChange={() => setSelectedWorkerId(w.id)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="font-bold text-slate-800">{w.name}</span>
                      <span className="text-slate-400 ml-1.5">({w.assignedZone})</span>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2">
                    <span>当前负荷: {w.currentActiveTasks} 单</span>
                    <span className="text-slate-400">{w.phone}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {selectedMode === 'worker_grab' && (
          <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-amber-800">
            <strong>公共抢单池规则：</strong>
            任务将同步推送至全仓所有在线补货员 PDA 抢单中心，先抢先得。
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-slate-500 hover:bg-slate-100 rounded-lg font-medium cursor-pointer"
          >
            取消
          </button>
          <button
            onClick={handleDispatch}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1"
          >
            <Send className="w-3.5 h-3.5" />
            <span>确认下发派单</span>
          </button>
        </div>
      </div>
    </div>
  );
};
