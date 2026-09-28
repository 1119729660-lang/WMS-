import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Scan,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Play,
  Package,
  Layers,
  ArrowRight,
} from 'lucide-react';
import {
  ReplenishTaskRecord,
  ReplenishmentWorker,
} from '../../types/taskManagement';

interface WorkerPdaSimModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: ReplenishTaskRecord[];
  workers: ReplenishmentWorker[];
  onClaimTask: (taskId: string, workerName: string) => void;
  onStartTask: (taskId: string, workerName: string) => void;
  onCompleteTask: (taskId: string, workerName: string, actualQty: number) => void;
  onReportException: (
    taskId: string,
    workerName: string,
    exceptionType: string,
    reason: string
  ) => void;
}

export const WorkerPdaSimModal: React.FC<WorkerPdaSimModalProps> = ({
  isOpen,
  onClose,
  tasks,
  workers,
  onClaimTask,
  onStartTask,
  onCompleteTask,
  onReportException,
}) => {
  const [selectedWorkerId, setSelectedWorkerId] = useState(workers[0]?.id || '');
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [isReportingException, setIsReportingException] = useState(false);
  const [exceptionType, setExceptionType] = useState('源库位空库/实物短少');
  const [exceptionReason, setExceptionReason] = useState('');
  const [completeQty, setCompleteQty] = useState<number>(0);

  if (!isOpen) return null;

  const currentWorker = workers.find((w) => w.id === selectedWorkerId) || workers[0];

  // Eligible tasks for PDA: dispatched (for this worker or unassigned grab), claimed, in_progress
  const activeTasks = tasks.filter(
    (t) =>
      t.status === 'dispatched' ||
      t.status === 'claimed' ||
      t.status === 'in_progress'
  );

  const currentTask =
    tasks.find((t) => t.id === selectedTaskId) || activeTasks[0] || null;

  const handleClaim = () => {
    if (!currentTask) return;
    onClaimTask(currentTask.id, currentWorker.name);
  };

  const handleStart = () => {
    if (!currentTask) return;
    onStartTask(currentTask.id, currentWorker.name);
  };

  const handleComplete = () => {
    if (!currentTask) return;
    const qty = completeQty > 0 ? completeQty : currentTask.requestedQty;
    onCompleteTask(currentTask.id, currentWorker.name, qty);
  };

  const handleExceptionSubmit = () => {
    if (!currentTask) return;
    if (!exceptionReason.trim()) {
      alert('请填写现场异常实况说明！');
      return;
    }
    onReportException(
      currentTask.id,
      currentWorker.name,
      exceptionType,
      exceptionReason
    );
    setIsReportingException(false);
    setExceptionReason('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150 text-xs">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-slate-800 text-sm">
                补货员手持 PDA 模拟沙盘
              </div>
              <div className="text-[11px] text-slate-400">
                现场扫码接单 / 开始作业 / 完工确认 / 异常上报
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Worker Switcher */}
        <div className="bg-slate-100 p-2 rounded-xl flex items-center justify-between gap-2">
          <span className="text-slate-500 font-medium shrink-0">登录补货员:</span>
          <select
            value={selectedWorkerId}
            onChange={(e) => setSelectedWorkerId(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-800 font-bold focus:outline-none cursor-pointer flex-1"
          >
            {workers.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} ({w.assignedZone}) - 电话: {w.phone}
              </option>
            ))}
          </select>
        </div>

        {/* Task Select for PDA */}
        <div className="space-y-1">
          <label className="text-slate-600 font-medium block">
            选择 PDA 当前正在操作的任务:
          </label>
          {activeTasks.length === 0 ? (
            <div className="p-4 bg-slate-50 rounded-xl text-center text-slate-400 border border-slate-200">
              当前无进行中或已派单任务，请先通过人工圈选下发或派单！
            </div>
          ) : (
            <select
              value={currentTask?.id || ''}
              onChange={(e) => {
                setSelectedTaskId(e.target.value);
                const t = tasks.find((item) => item.id === e.target.value);
                if (t) setCompleteQty(t.requestedQty);
              }}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 font-bold focus:outline-none cursor-pointer"
            >
              {activeTasks.map((t) => (
                <option key={t.id} value={t.id}>
                  [{t.priority}] {t.id} - {t.productName} ({t.status})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Task Info Card on PDA Screen */}
        {currentTask && (
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4 rounded-2xl space-y-2.5 shadow-md">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2">
              <span className="font-mono text-xs font-bold text-amber-400">
                {currentTask.id}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                状态: {currentTask.status}
              </span>
            </div>

            <div>
              <div className="font-bold text-sm text-slate-100">
                {currentTask.productName}
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                {currentTask.sku} | 规格: {currentTask.specification}
              </div>
            </div>

            <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700 font-mono text-[11px] space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">取货 (备货层):</span>
                <span className="font-bold text-amber-300">
                  {currentTask.sourceLocation} ({currentTask.sourceLevel}层)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">落位 (拣货层):</span>
                <span className="font-bold text-emerald-400">
                  {currentTask.targetLocation} (1层)
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-700/60">
                <span className="text-slate-400">需补数量:</span>
                <span className="font-bold text-white text-xs">
                  {currentTask.requestedQty} {currentTask.unit}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Interactive PDA Actions depending on current task status */}
        {currentTask && (
          <div className="space-y-2 pt-1">
            {!isReportingException ? (
              <>
                {/* 1. If Dispatched -> Claim */}
                {currentTask.status === 'dispatched' && (
                  <button
                    onClick={handleClaim}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>① PDA 扫码确认认领 (接单)</span>
                  </button>
                )}

                {/* 2. If Claimed -> Start */}
                {currentTask.status === 'claimed' && (
                  <button
                    onClick={handleStart}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                  >
                    <Play className="w-4 h-4" />
                    <span>② 到达源库位扫描，开始叉运 (进行中)</span>
                  </button>
                )}

                {/* 3. If In Progress -> Complete with quantity */}
                {currentTask.status === 'in_progress' && (
                  <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-medium text-slate-700">实际移库入位数量:</span>
                      <div className="flex items-center gap-1 font-mono">
                        <input
                          type="number"
                          value={completeQty || currentTask.requestedQty}
                          onChange={(e) => setCompleteQty(parseInt(e.target.value) || 0)}
                          className="w-16 p-1 text-center bg-white border border-slate-300 rounded font-bold"
                        />
                        <span className="text-slate-500">{currentTask.unit}</span>
                      </div>
                    </div>
                    <button
                      onClick={handleComplete}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>③ 扫目标库位条码，确认补货完工</span>
                    </button>
                  </div>
                )}

                {/* 4. Report Exception Button */}
                <button
                  onClick={() => setIsReportingException(true)}
                  className="w-full py-2 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 border border-slate-200 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                  <span>遇到阻碍？现场上报异常移交 PC 库管员</span>
                </button>
              </>
            ) : (
              /* Exception Report Sub-form */
              <div className="bg-rose-50 p-3.5 rounded-2xl border border-rose-200 space-y-2 animate-in fade-in duration-100">
                <div className="font-bold text-rose-800 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    现场上报异常
                  </span>
                  <button
                    onClick={() => setIsReportingException(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs"
                  >
                    返回
                  </button>
                </div>

                <div>
                  <label className="text-[11px] text-slate-600 font-medium block">
                    异常原因分类:
                  </label>
                  <select
                    value={exceptionType}
                    onChange={(e) => setExceptionType(e.target.value)}
                    className="w-full mt-1 p-1.5 bg-white border border-slate-200 rounded-lg font-medium"
                  >
                    <option value="源库位空库/实物短少">源库位空库 / 实物短少</option>
                    <option value="实物破损严重无法供拣">实物破损严重无法供拣</option>
                    <option value="通道封闭/升降叉车故障">通道封闭 / 升降叉车故障</option>
                    <option value="目标拣货位库容已满">目标拣货位库容已满</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-600 font-medium block">
                    现场实况详情 (必填):
                  </label>
                  <textarea
                    rows={2}
                    value={exceptionReason}
                    onChange={(e) => setExceptionReason(e.target.value)}
                    placeholder="现场看到什么情况？例如：A-01-03-02 现场仅剩 5 箱，且外箱破损..."
                    className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-lg text-xs"
                  ></textarea>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => setIsReportingException(false)}
                    className="flex-1 py-1.5 text-slate-500 bg-white border border-slate-200 rounded-lg font-medium"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleExceptionSubmit}
                    className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold"
                  >
                    确认上报
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
