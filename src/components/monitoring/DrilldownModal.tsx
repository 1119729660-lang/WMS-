import React, { useState } from 'react';
import {
  X,
  Layers,
  Warehouse,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import {
  WarehouseDrilldownTimeliness,
  WorkerDrilldownTimeliness,
} from '../../types/monitoring';

interface DrilldownModalProps {
  isOpen: boolean;
  onClose: () => void;
  presetHours: number;
  warehouseData: WarehouseDrilldownTimeliness[];
  workerData: WorkerDrilldownTimeliness[];
}

export const DrilldownModal: React.FC<DrilldownModalProps> = ({
  isOpen,
  onClose,
  presetHours,
  warehouseData,
  workerData,
}) => {
  const [tab, setTab] = useState<'warehouse' | 'worker'>('warehouse');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 text-xs">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                补货及时率下钻多维分析
              </h3>
              <p className="text-[11px] text-slate-400">
                统计口径：任务生成至完成 ≤ {presetHours} 小时 | 支持分仓与补货员下钻
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

        {/* Dimension Switcher */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab('warehouse')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              tab === 'warehouse'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Warehouse className="w-3.5 h-3.5" />
            <span>按仓库下钻 ({warehouseData.length})</span>
          </button>

          <button
            onClick={() => setTab('worker')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              tab === 'worker'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>按补货员下钻 ({workerData.length})</span>
          </button>
        </div>

        {/* Content Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          {tab === 'warehouse' ? (
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">仓库名称</th>
                  <th className="py-2.5 px-3 text-right">按时完工数</th>
                  <th className="py-2.5 px-3 text-right">应完成总工单</th>
                  <th className="py-2.5 px-3 text-right">平均耗时</th>
                  <th className="py-2.5 px-3 text-right">及时率 (目标95%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {warehouseData.map((wh) => (
                  <tr key={wh.warehouseId} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-sans font-bold text-slate-800">
                      {wh.warehouseName}
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-700 font-bold">
                      {wh.completedOnTime} 单
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-700">
                      {wh.totalDue} 单
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-500">
                      {wh.avgDurationMinutes} 分钟
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span
                        className={`font-black ${
                          wh.timelinessRate >= 95
                            ? 'text-emerald-600'
                            : 'text-amber-600'
                        }`}
                      >
                        {wh.timelinessRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">补货员 / 责任网格</th>
                  <th className="py-2.5 px-3 text-right">按时完工数</th>
                  <th className="py-2.5 px-3 text-right">应完成任务</th>
                  <th className="py-2.5 px-3 text-right">当前滞留单</th>
                  <th className="py-2.5 px-3 text-right">及时率</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {workerData.map((w) => (
                  <tr key={w.workerId} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-sans font-bold text-slate-800">
                      {w.workerName} ({w.assignedZone})
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-700 font-bold">
                      {w.completedOnTime} 单
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-700">
                      {w.totalDue} 单
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {w.stuckCount > 0 ? (
                        <span className="text-rose-600 font-bold">
                          {w.stuckCount} 单
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span
                        className={`font-black ${
                          w.timelinessRate >= 95
                            ? 'text-emerald-600'
                            : 'text-amber-600'
                        }`}
                      >
                        {w.timelinessRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors cursor-pointer"
          >
            关闭返回
          </button>
        </div>
      </div>
    </div>
  );
};
