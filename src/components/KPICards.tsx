import React from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  Clock,
  CheckCircle2,
  TrendingUp,
  Boxes,
  Compass,
} from 'lucide-react';
import { ReplenishSummaryMetrics } from '../types/replenishment';

interface KPICardsProps {
  metrics: ReplenishSummaryMetrics;
  selectedPriority: string;
  onSelectPriority: (priority: string) => void;
}

export const KPICards: React.FC<KPICardsProps> = ({
  metrics,
  selectedPriority,
  onSelectPriority,
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {/* 1. 待补货触发 SKU */}
      <div
        onClick={() => onSelectPriority('ALL')}
        className={`bg-white rounded-xl border p-3.5 shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden ${
          selectedPriority === 'ALL'
            ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50/20'
            : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-semibold">触发补货SKU</span>
          <Boxes className="w-4 h-4 text-blue-600" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-slate-900 font-mono">
            {metrics.triggeredCount}
          </span>
          <span className="text-xs text-slate-400">/ {metrics.totalSkus}</span>
        </div>
        <div className="mt-1 flex items-center text-[11px] text-slate-500">
          <span className="text-blue-600 font-medium">可用库存 &lt; 7日均销</span>
        </div>
      </div>

      {/* 2. P0 紧急断货 (实时缺货/订单池联动) */}
      <div
        onClick={() => onSelectPriority('P0')}
        className={`bg-white rounded-xl border p-3.5 shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden ${
          selectedPriority === 'P0'
            ? 'ring-2 ring-red-500 border-red-500 bg-red-50/30'
            : 'border-slate-200 hover:border-red-200'
        }`}
      >
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-semibold text-red-600 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
            P0 紧急断货
          </span>
          <AlertOctagon className="w-4 h-4 text-red-600" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-red-600 font-mono">
            {metrics.p0Count}
          </span>
          <span className="text-xs text-red-400">项</span>
        </div>
        <div className="mt-1 text-[11px] text-red-600/90 font-medium truncate">
          剩余≤0天 · 订单挂起
        </div>
      </div>

      {/* 3. P1 紧缺警戒 (<1天) */}
      <div
        onClick={() => onSelectPriority('P1')}
        className={`bg-white rounded-xl border p-3.5 shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden ${
          selectedPriority === 'P1'
            ? 'ring-2 ring-amber-500 border-amber-500 bg-amber-50/30'
            : 'border-slate-200 hover:border-amber-200'
        }`}
      >
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-semibold text-amber-700">P1 紧缺警戒</span>
          <AlertTriangle className="w-4 h-4 text-amber-600" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-amber-600 font-mono">
            {metrics.p1Count}
          </span>
          <span className="text-xs text-amber-400">项</span>
        </div>
        <div className="mt-1 text-[11px] text-amber-700 font-medium truncate">
          可用天数 &lt; 1 天 (今日必补)
        </div>
      </div>

      {/* 4. P2 预警备货 (<2天) */}
      <div
        onClick={() => onSelectPriority('P2')}
        className={`bg-white rounded-xl border p-3.5 shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden ${
          selectedPriority === 'P2'
            ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50/20'
            : 'border-slate-200 hover:border-blue-200'
        }`}
      >
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-semibold text-indigo-700">P2 预警备货</span>
          <Clock className="w-4 h-4 text-indigo-500" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-indigo-600 font-mono">
            {metrics.p2Count}
          </span>
          <span className="text-xs text-indigo-400">项</span>
        </div>
        <div className="mt-1 text-[11px] text-slate-500 truncate">
          可用天数 &lt; 2 天 (预防调拨)
        </div>
      </div>

      {/* 5. 同架垂直补货命中率 */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-semibold text-emerald-800">同架垂直命中率</span>
          <Compass className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-emerald-600 font-mono">
            {metrics.sameRackHitRate}%
          </span>
        </div>
        <div className="mt-1 text-[11px] text-emerald-700 font-medium truncate">
          🎯 二层同位理货高效达标
        </div>
      </div>

      {/* 6. 今日补货完成进度 */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-semibold text-slate-700">今日完成/总量</span>
          <CheckCircle2 className="w-4 h-4 text-teal-600" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-slate-900 font-mono">
            {metrics.completedTodayCount}
          </span>
          <span className="text-xs text-slate-400">单 ({metrics.totalReplenishedQtyToday}件)</span>
        </div>
        <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
          <TrendingUp className="w-3 h-3 text-emerald-500" />
          <span>执行中: {metrics.inProgressTaskCount} 任务</span>
        </div>
      </div>
    </div>
  );
};
