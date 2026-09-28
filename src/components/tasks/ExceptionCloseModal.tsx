import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  FileCheck,
} from 'lucide-react';
import { ReplenishTaskRecord } from '../../types/taskManagement';

interface ExceptionCloseModalProps {
  task: ReplenishTaskRecord | null;
  onClose: () => void;
  onConfirmClose: (
    taskId: string,
    exceptionCategory: string,
    reviewNote: string
  ) => void;
}

export const ExceptionCloseModal: React.FC<ExceptionCloseModalProps> = ({
  task,
  onClose,
  onConfirmClose,
}) => {
  const [category, setCategory] = useState('源库位空库/实物短少');
  const [reviewNote, setReviewNote] = useState('');

  if (!task) return null;

  const handleSubmit = () => {
    if (!reviewNote.trim()) {
      alert('请填写库管员 PC 端核实意见与后续处置方案！');
      return;
    }
    onConfirmClose(task.id, category, reviewNote);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 text-xs">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-rose-100 text-rose-700">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">
                库管员 PC 端核实 & 执行异常关闭
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                任务 ID: {task.id} | SKU: {task.sku}
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

        {/* Worker reported exception recap */}
        <div className="bg-rose-50 p-3 rounded-xl border border-rose-200 space-y-1.5">
          <div className="font-bold text-rose-800 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>现场 PDA 上报内容</span>
          </div>
          <div className="text-[11px] text-rose-700 pl-5 space-y-0.5">
            <p><strong>异常分类:</strong> {task.exceptionType || '现场作业受阻'}</p>
            <p><strong>异常说明:</strong> {task.exceptionReason || '无详细描述'}</p>
            <p className="text-rose-500">
              上报人: {task.exceptionReportedBy} ({task.exceptionReportedAt})
            </p>
          </div>
        </div>

        {/* Category selector */}
        <div className="space-y-1">
          <label className="font-bold text-slate-700 block">
            核实异常原因归类:
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer"
          >
            <option value="源库位空库/实物短少">源库位空库 / 实物短少</option>
            <option value="实物严重破损/包装污损">实物严重破损 / 包装污损</option>
            <option value="货架机械故障/通道封闭">货架机械故障 / 通道维护封闭</option>
            <option value="批次信息不符/盘点锁定">批次信息不符 / 库位盘点锁定</option>
            <option value="目标拣货位物理容量不足">目标拣货位物理容量已满</option>
            <option value="其他现场异常">其他现场异常</option>
          </select>
        </div>

        {/* Review Note */}
        <div className="space-y-1">
          <label className="font-bold text-slate-700 block">
            库管员 PC 端核实意见与闭环说明 (必填):
          </label>
          <textarea
            rows={3}
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
            placeholder="例如：已现场复核属实，源库位剩余料件已转退残质检，本次任务异常关闭，解除目标库位锁定。"
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500"
          ></textarea>
        </div>

        {/* Notice */}
        <p className="text-[11px] text-slate-400">
          * 确认异常关闭后，任务状态将置为「异常关闭 (exception_closed)」，并解锁该目标拣货位，允许重新下发新的补货任务。
        </p>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-slate-500 hover:bg-slate-100 rounded-lg font-medium cursor-pointer"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>确认核实并异常关闭</span>
          </button>
        </div>
      </div>
    </div>
  );
};
