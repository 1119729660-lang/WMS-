import React, { useState } from 'react';
import {
  AlertOctagon,
  Clock,
  Phone,
  User,
  Send,
  Bell,
  RefreshCw,
  Filter,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { StuckTaskRecord, StuckTaskTier } from '../../types/monitoring';

interface StuckTasksTableProps {
  stuckTasks: StuckTaskRecord[];
  onUrgeTask: (taskId: string) => void;
  onReassignTask: (task: StuckTaskRecord) => void;
  onViewTaskDetail: (task: StuckTaskRecord) => void;
}

export const StuckTasksTable: React.FC<StuckTasksTableProps> = ({
  stuckTasks,
  onUrgeTask,
  onReassignTask,
  onViewTaskDetail,
}) => {
  const [selectedTier, setSelectedTier] = useState<string>('ALL');

  const filtered = stuckTasks.filter((t) => {
    if (selectedTier !== 'ALL' && t.tier !== selectedTier) return false;
    return true;
  });

  const getTierBadge = (tier: StuckTaskTier) => {
    switch (tier) {
      case '2_4h':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            2~4小时 (一级超时)
          </span>
        );
      case '4_8h':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-200">
            4~8小时 (二级升级)
          </span>
        );
      case '8h_plus':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping"></span>
            8小时以上 (严重阻滞)
          </span>
        );
    }
  };

  return (
    <div
      id="stuck-tasks-section"
      className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4"
    >
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-rose-50 text-rose-700">
            <AlertOctagon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-800">
                卡住任务监控排查台
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">
                {stuckTasks.length} 笔未完工
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              定义口径：状态处于「已领取」或「进行中」，且从接单开始耗时超过预设时长
            </p>
          </div>
        </div>

        {/* Tier filter chips */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setSelectedTier('ALL')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              selectedTier === 'ALL'
                ? 'bg-white text-rose-700 shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            全部 ({stuckTasks.length})
          </button>
          <button
            onClick={() => setSelectedTier('2_4h')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              selectedTier === '2_4h'
                ? 'bg-white text-amber-800 shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            2~4h (
            {stuckTasks.filter((t) => t.tier === '2_4h').length})
          </button>
          <button
            onClick={() => setSelectedTier('4_8h')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              selectedTier === '4_8h'
                ? 'bg-white text-orange-800 shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            4~8h (
            {stuckTasks.filter((t) => t.tier === '4_8h').length})
          </button>
          <button
            onClick={() => setSelectedTier('8h_plus')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              selectedTier === '8h_plus'
                ? 'bg-white text-rose-800 shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            8h+ (
            {stuckTasks.filter((t) => t.tier === '8h_plus').length})
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-y border-slate-200/80">
            <tr>
              <th className="py-2.5 px-3">任务ID / 优先级</th>
              <th className="py-2.5 px-3">补货员 / 所属网格</th>
              <th className="py-2.5 px-3">SKU / 商品信息</th>
              <th className="py-2.5 px-3">移库路径</th>
              <th className="py-2.5 px-3 text-right">补货量</th>
              <th className="py-2.5 px-3">作业状态</th>
              <th className="py-2.5 px-3">已停滞时长</th>
              <th className="py-2.5 px-3">超时分档</th>
              <th className="py-2.5 px-3">现场阻滞原因</th>
              <th className="py-2.5 px-3 text-right">调度操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-8 text-center text-slate-400">
                  当前筛选条件下无卡住任务，全仓作业流转正常！
                </td>
              </tr>
            ) : (
              filtered.map((t) => (
                <tr
                  key={t.id}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    t.tier === '8h_plus' ? 'bg-rose-50/40' : ''
                  }`}
                >
                  {/* ID & Priority */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-slate-900">
                        {t.id}
                      </span>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-black ${
                          t.priority === 'P0'
                            ? 'bg-red-100 text-red-700'
                            : t.priority === 'P1'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {t.priority}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {t.startedAt} 开始
                    </div>
                  </td>

                  {/* Worker & Phone */}
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-800 flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      <span>{t.claimedBy}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-300" />
                      <span>{t.workerPhone}</span>
                    </div>
                  </td>

                  {/* SKU & Product */}
                  <td className="py-3 px-3 max-w-xs">
                    <div className="font-bold text-slate-800 truncate" title={t.productName}>
                      {t.productName}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">
                      {t.sku}
                    </div>
                  </td>

                  {/* Location Path */}
                  <td className="py-3 px-3 font-mono">
                    <div className="flex items-center gap-1 text-[11px]">
                      <span className="bg-slate-100 text-slate-700 px-1 rounded">
                        {t.sourceLocation}
                      </span>
                      <span className="text-slate-400">→</span>
                      <span className="bg-emerald-50 text-emerald-700 font-bold px-1 rounded">
                        {t.targetLocation}
                      </span>
                    </div>
                  </td>

                  {/* Quantity */}
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                    {t.requestedQty} {t.unit}
                  </td>

                  {/* Status */}
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        t.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {t.status === 'in_progress' ? '作业中' : '已领取'}
                    </span>
                  </td>

                  {/* Elapsed Hours */}
                  <td className="py-3 px-3">
                    <div className="font-mono font-black text-rose-600 text-sm">
                      {t.elapsedHours}h
                    </div>
                  </td>

                  {/* Tier */}
                  <td className="py-3 px-3">{getTierBadge(t.tier)}</td>

                  {/* Delay reason */}
                  <td className="py-3 px-3 max-w-xs">
                    <div
                      className="text-[11px] text-slate-600 truncate bg-slate-50 p-1 rounded border border-slate-200"
                      title={t.delayReason}
                    >
                      {t.delayReason || '暂无上报记录'}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onUrgeTask(t.id)}
                        className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded font-bold text-[11px] border border-amber-200 flex items-center gap-1 transition-colors cursor-pointer"
                        title="向补货员 PDA 及企微强力催办"
                      >
                        <Bell className="w-3 h-3 text-amber-600" />
                        <span>催办{t.urgedCount > 0 ? `(${t.urgedCount})` : ''}</span>
                      </button>

                      <button
                        onClick={() => onReassignTask(t)}
                        className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded font-bold text-[11px] border border-blue-200 flex items-center gap-1 transition-colors cursor-pointer"
                        title="取消当前领单，重置回待派单并改派他人"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>改派</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
