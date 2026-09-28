import React, { useState } from 'react';
import {
  Package,
  Layers,
  Warehouse,
  Boxes,
  Users,
  TrendingUp,
} from 'lucide-react';
import { VolumeDimensionSummary } from '../../types/monitoring';

interface VolumeSummaryTableProps {
  byWarehouse: VolumeDimensionSummary[];
  bySku: VolumeDimensionSummary[];
  byWorker: VolumeDimensionSummary[];
}

type DimensionType = 'warehouse' | 'sku' | 'worker';

export const VolumeSummaryTable: React.FC<VolumeSummaryTableProps> = ({
  byWarehouse,
  bySku,
  byWorker,
}) => {
  const [dimension, setDimension] = useState<DimensionType>('warehouse');

  const data =
    dimension === 'warehouse'
      ? byWarehouse
      : dimension === 'sku'
      ? bySku
      : byWorker;

  const totalPiecesSum = data.reduce((acc, cur) => acc + cur.totalPieces, 0);
  const totalTasksSum = data.reduce((acc, cur) => acc + cur.totalTasks, 0);
  const avgOverall =
    totalTasksSum > 0 ? Math.round(totalPiecesSum / totalTasksSum) : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              补货吞吐量多维透视表
            </h3>
            <p className="text-[11px] text-slate-400">
              日 / 周 / 月汇总补货总件数、工单任务数及单均负荷
            </p>
          </div>
        </div>

        {/* Dimension toggle */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setDimension('warehouse')}
            className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              dimension === 'warehouse'
                ? 'bg-white text-emerald-700 shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Warehouse className="w-3.5 h-3.5" />
            <span>按仓库汇总</span>
          </button>
          <button
            onClick={() => setDimension('sku')}
            className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              dimension === 'sku'
                ? 'bg-white text-emerald-700 shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>按 SKU 汇总</span>
          </button>
          <button
            onClick={() => setDimension('worker')}
            className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              dimension === 'worker'
                ? 'bg-white text-emerald-700 shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>按补货员汇总</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-y border-slate-200/80">
            <tr>
              <th className="py-2.5 px-3">
                {dimension === 'warehouse'
                  ? '仓库主体 / 枢纽定位'
                  : dimension === 'sku'
                  ? '商品 SKU / 规格与默认拣位'
                  : '补货员姓名 / 责任片区'}
              </th>
              <th className="py-2.5 px-3 text-right">补货总件数 (PCS)</th>
              <th className="py-2.5 px-3 text-right">总任务数 (单)</th>
              <th className="py-2.5 px-3 text-right">平均每单补货量</th>
              <th className="py-2.5 px-3 text-right">及时完成件数</th>
              <th className="py-2.5 px-3 text-right">及时率</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((item) => (
              <tr key={item.dimensionKey} className="hover:bg-slate-50/80">
                <td className="py-3 px-3">
                  <div className="font-bold text-slate-800">
                    {item.dimensionName}
                  </div>
                  {item.subLabel && (
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {item.subLabel}
                    </div>
                  )}
                </td>
                <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 text-sm">
                  {item.totalPieces.toLocaleString()}
                </td>
                <td className="py-3 px-3 text-right font-mono text-slate-700">
                  {item.totalTasks} 单
                </td>
                <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                  {item.avgPiecesPerTask} 件/单
                </td>
                <td className="py-3 px-3 text-right font-mono text-slate-600">
                  {item.completedOnTimePieces.toLocaleString()}
                </td>
                <td className="py-3 px-3 text-right font-mono">
                  <span
                    className={`font-bold ${
                      item.timelinessRate >= 95
                        ? 'text-emerald-600'
                        : 'text-amber-600'
                    }`}
                  >
                    {item.timelinessRate}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-50/80 font-bold border-t border-slate-200 text-slate-800">
            <tr>
              <td className="py-2.5 px-3">当前汇总总计</td>
              <td className="py-2.5 px-3 text-right font-mono text-emerald-700 text-sm">
                {totalPiecesSum.toLocaleString()} 件
              </td>
              <td className="py-2.5 px-3 text-right font-mono">
                {totalTasksSum} 单
              </td>
              <td className="py-2.5 px-3 text-right font-mono text-emerald-700">
                {avgOverall} 件/单
              </td>
              <td className="py-2.5 px-3 text-right font-mono">--</td>
              <td className="py-2.5 px-3 text-right font-mono text-emerald-600">
                95.3%
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
