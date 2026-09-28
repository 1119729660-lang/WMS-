import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  AlertOctagon,
  AlertTriangle,
  Package,
  Layers,
  ChevronRight,
  SlidersHorizontal,
  Info,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import {
  MonitoringConfig,
  StockoutCalculationMethod,
  StuckTaskRecord,
} from '../../types/monitoring';

interface MetricCardsProps {
  config: MonitoringConfig;
  onChangeConfig: (updater: Partial<MonitoringConfig>) => void;
  timelinessRate: number;
  completedOnTimeTasks: number;
  totalDueTasks: number;
  stuckTasks: StuckTaskRecord[];
  // Stockout Method 1
  pickingReports: number;
  totalPickingOps: number;
  stockoutRatePicking: number;
  // Stockout Method 2
  stockoutSkus: number;
  totalWaveSkus: number;
  stockoutRateSku: number;
  // Volumes
  totalPieces: number;
  totalTasks: number;
  avgPiecesPerTask: number;
  onOpenDrilldown: () => void;
  onScrollToStuckTasks: () => void;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  config,
  onChangeConfig,
  timelinessRate,
  completedOnTimeTasks,
  totalDueTasks,
  stuckTasks,
  pickingReports,
  totalPickingOps,
  stockoutRatePicking,
  stockoutSkus,
  totalWaveSkus,
  stockoutRateSku,
  totalPieces,
  totalTasks,
  avgPiecesPerTask,
  onOpenDrilldown,
  onScrollToStuckTasks,
}) => {
  // Stuck tier breakdown
  const tier24Count = stuckTasks.filter((t) => t.tier === '2_4h').length;
  const tier48Count = stuckTasks.filter((t) => t.tier === '4_8h').length;
  const tier8PlusCount = stuckTasks.filter((t) => t.tier === '8h_plus').length;

  const isTimelinessAchieved = timelinessRate >= config.targetTimelinessRate;

  // Active stockout rate based on method
  const currentStockoutRate =
    config.stockoutMethod === 'picking_point_reports'
      ? stockoutRatePicking
      : stockoutRateSku;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {/* 1. 补货及时率卡片 */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>补货及时率 (≤{config.timelinessPresetHours}h 完工)</span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black font-mono text-slate-900 tracking-tight">
                {timelinessRate}%
              </span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${
                  isTimelinessAchieved
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {isTimelinessAchieved ? (
                  <>
                    <CheckCircle2 className="w-3 h-3" />
                    达标 (≥{config.targetTimelinessRate}%)
                  </>
                ) : (
                  <>
                    <XCircle className="w-3 h-3" />
                    未达标 (目标 {config.targetTimelinessRate}%)
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Config preset hours dropdown */}
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 text-[11px] font-bold">
            {[1, 2, 3, 4].map((h) => (
              <button
                key={h}
                onClick={() => onChangeConfig({ timelinessPresetHours: h })}
                className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                  config.timelinessPresetHours === h
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
                title={`按 ${h} 小时内完工计算及时率`}
              >
                {h}h
              </button>
            ))}
          </div>
        </div>

        {/* Formula breakdown */}
        <div className="mt-3 pt-3 border-t border-slate-100">
          <div className="text-[11px] text-slate-500 flex items-center justify-between font-mono">
            <span>
              已完成: <strong className="text-slate-800">{completedOnTimeTasks}</strong> 单
            </span>
            <span className="text-slate-300">/</span>
            <span>
              应完成: <strong className="text-slate-800">{totalDueTasks}</strong> 单
            </span>
          </div>

          <button
            onClick={onOpenDrilldown}
            className="w-full mt-2.5 py-1.5 px-2.5 bg-blue-50/80 hover:bg-blue-100/80 text-blue-700 text-xs font-bold rounded-xl flex items-center justify-between transition-colors cursor-pointer"
          >
            <span>下钻下辖仓库与人员明细</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. 缺货率卡片 (双口径支持) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span>现场缺货率</span>
            </span>

            {/* Method switch */}
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5 text-[10px] font-bold">
              <button
                onClick={() =>
                  onChangeConfig({ stockoutMethod: 'picking_point_reports' })
                }
                className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                  config.stockoutMethod === 'picking_point_reports'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
                title="口径①：拣货点缺货上报次数 ÷ 拣货总次数"
              >
                口径① 拣点
              </button>
              <button
                onClick={() => onChangeConfig({ stockoutMethod: 'sku_ratio' })}
                className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                  config.stockoutMethod === 'sku_ratio'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
                title="口径②：缺货 SKU 数 ÷ 波次 SKU 总数"
              >
                口径② SKU
              </button>
            </div>
          </div>

          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black font-mono text-slate-900 tracking-tight">
              {currentStockoutRate}%
            </span>
            <span className="text-[11px] text-emerald-600 font-bold flex items-center">
              <TrendingDown className="w-3 h-3 mr-0.5" />
              -0.35% (环比)
            </span>
          </div>

          <div className="text-[11px] text-slate-400 mt-1">
            {config.stockoutMethod === 'picking_point_reports'
              ? '口径①：拣货点缺货上报次数 ÷ 拣货总次数'
              : '口径②：缺货 SKU 种数 ÷ 波次 SKU 总数'}
          </div>
        </div>

        {/* Calculation Details */}
        <div className="mt-3 pt-3 border-t border-slate-100 font-mono text-[11px] space-y-1">
          {config.stockoutMethod === 'picking_point_reports' ? (
            <div className="flex justify-between text-slate-600">
              <span>缺货上报: <strong className="text-rose-600">{pickingReports}</strong> 次</span>
              <span>拣货总频次: <strong className="text-slate-800">{totalPickingOps.toLocaleString()}</strong> 次</span>
            </div>
          ) : (
            <div className="flex justify-between text-slate-600">
              <span>缺货 SKU: <strong className="text-rose-600">{stockoutSkus}</strong> 个</span>
              <span>波次 SKU 宗数: <strong className="text-slate-800">{totalWaveSkus}</strong> 个</span>
            </div>
          )}
          <div className="flex justify-between text-[10px] text-slate-400 pt-0.5">
            <span>
              备用口径参考: {config.stockoutMethod === 'picking_point_reports' ? `${stockoutRateSku}% (SKU口径)` : `${stockoutRatePicking}% (拣点口径)`}
            </span>
            <span className="text-slate-500 font-medium">预警线 ≤ 3.0%</span>
          </div>
        </div>
      </div>

      {/* 3. 卡住任务数 (分档统计) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
              <span>卡住任务数 (超时未完工)</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              已领/作业中 &gt;{config.stuckThresholdHours}h
            </span>
          </div>

          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black font-mono text-rose-600 tracking-tight">
              {stuckTasks.length}
            </span>
            <span className="text-xs text-slate-500 font-bold">单正在停滞</span>
          </div>
        </div>

        {/* 3 Tiers breakdown */}
        <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
          <div className="grid grid-cols-3 gap-1.5">
            <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-1.5 text-center">
              <div className="text-[10px] text-amber-800 font-semibold">2~4h</div>
              <div className="text-xs font-bold font-mono text-amber-900">
                {tier24Count} 单
              </div>
            </div>
            <div className="bg-orange-50/70 border border-orange-200 rounded-lg p-1.5 text-center">
              <div className="text-[10px] text-orange-800 font-semibold">4~8h</div>
              <div className="text-xs font-bold font-mono text-orange-900">
                {tier48Count} 单
              </div>
            </div>
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-1.5 text-center">
              <div className="text-[10px] text-rose-800 font-semibold">8h+ (急)</div>
              <div className="text-xs font-bold font-mono text-rose-900">
                {tier8PlusCount} 单
              </div>
            </div>
          </div>

          <button
            onClick={onScrollToStuckTasks}
            className="w-full py-1 text-center text-xs text-rose-600 hover:text-rose-700 font-bold hover:underline cursor-pointer flex items-center justify-center gap-1"
          >
            <span>查看卡住工单明细与催办</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 4. 今日/当期补货量统计 */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-indigo-600" />
              <span>补货吞吐总量</span>
            </span>
            <span className="text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded font-mono font-bold">
              实时累计
            </span>
          </div>

          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black font-mono text-slate-900 tracking-tight">
              {totalPieces.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-slate-500">件 (PCS)</span>
          </div>
        </div>

        {/* Volume Sub-stats */}
        <div className="mt-3 pt-3 border-t border-slate-100 font-mono text-[11px] space-y-1">
          <div className="flex justify-between text-slate-600">
            <span>总补货任务: <strong className="text-slate-800">{totalTasks}</strong> 单</span>
            <span>单均补货量: <strong className="text-blue-600">{avgPiecesPerTask}</strong> 件/单</span>
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 pt-0.5">
            <span>按时入位率: 95.7%</span>
            <span className="text-emerald-600 font-bold flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" />
              +8.4% 环比昨日
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
