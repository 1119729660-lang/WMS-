import React, { useState } from 'react';
import {
  Award,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  Clock,
  Package,
  Calendar,
} from 'lucide-react';
import { WorkerProductivity } from '../../types/monitoring';

interface WorkerEfficiencyRankProps {
  dailyWorkers: WorkerProductivity[];
  weeklyWorkers: WorkerProductivity[];
  targetPiecesPerHour: number;
}

export const WorkerEfficiencyRank: React.FC<WorkerEfficiencyRankProps> = ({
  dailyWorkers,
  weeklyWorkers,
  targetPiecesPerHour,
}) => {
  const [period, setPeriod] = useState<'day' | 'week'>('day');

  const workers = period === 'day' ? dailyWorkers : weeklyWorkers;
  const sortedWorkers = [...workers].sort(
    (a, b) => b.piecesPerHour - a.piecesPerHour
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              补货员人效龙虎榜 (件 / 小时)
            </h3>
            <p className="text-[11px] text-slate-400">
              公式：完成补货总件数 ÷ 作业时长 | 基准目标: {targetPiecesPerHour} 件/h
            </p>
          </div>
        </div>

        {/* Day / Week Switch */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setPeriod('day')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              period === 'day'
                ? 'bg-white text-blue-700 shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            本日人效
          </button>
          <button
            onClick={() => setPeriod('week')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              period === 'week'
                ? 'bg-white text-blue-700 shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            本周人效
          </button>
        </div>
      </div>

      {/* Workers List / Table */}
      <div className="space-y-2.5">
        {sortedWorkers.map((worker, index) => {
          const rank = index + 1;
          const ratio = Math.min(100, Math.round((worker.piecesPerHour / 180) * 100));
          const isTargetMet = worker.piecesPerHour >= targetPiecesPerHour;

          return (
            <div
              key={worker.workerId}
              className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              {/* Left: Rank & Name */}
              <div className="flex items-center gap-3 min-w-48">
                {/* Rank badge */}
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center font-mono font-black text-xs shrink-0 ${
                    rank === 1
                      ? 'bg-amber-400 text-amber-950 shadow-xs ring-2 ring-amber-200'
                      : rank === 2
                      ? 'bg-slate-300 text-slate-800 ring-2 ring-slate-200'
                      : rank === 3
                      ? 'bg-amber-700 text-amber-50'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {rank}
                </div>

                <div>
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <span>{worker.workerName}</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      ({worker.assignedZone.split(' ')[0]})
                    </span>
                    {isTargetMet ? (
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded font-bold border border-emerald-200">
                        达标
                      </span>
                    ) : (
                      <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.2 rounded font-bold border border-amber-200">
                        待提升
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    完成: {worker.completedPieces.toLocaleString()} 件 / {worker.completedTasks} 单 | 工时: {worker.workingHours}h
                  </div>
                </div>
              </div>

              {/* Middle: Progress Bar vs Target Benchmark */}
              <div className="flex-1 max-w-xs space-y-1">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400">达标进度</span>
                  <span className="text-slate-700 font-bold">
                    {worker.piecesPerHour} / {targetPiecesPerHour} 件/h
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden relative">
                  <div
                    className={`h-full rounded-full ${
                      isTargetMet ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${ratio}%` }}
                  ></div>
                  {/* Benchmark 120 line */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-slate-700 z-10"
                    style={{
                      left: `${Math.round((targetPiecesPerHour / 180) * 100)}%`,
                    }}
                    title="120件/h 考核基准线"
                  ></div>
                </div>
              </div>

              {/* Right: Metrics & Trend */}
              <div className="flex items-center justify-end gap-4 min-w-36 text-right">
                <div>
                  <div className="text-sm font-black font-mono text-slate-900">
                    {worker.piecesPerHour}{' '}
                    <span className="text-[10px] font-normal text-slate-500">件/h</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    及时率: {worker.timelinessRate}%
                  </div>
                </div>

                <div className="shrink-0">
                  {worker.trend === 'up' && (
                    <span className="p-1 rounded bg-emerald-50 text-emerald-600 block" title="人效环比上升">
                      <TrendingUp className="w-4 h-4" />
                    </span>
                  )}
                  {worker.trend === 'down' && (
                    <span className="p-1 rounded bg-rose-50 text-rose-600 block" title="人效环比下降">
                      <TrendingDown className="w-4 h-4" />
                    </span>
                  )}
                  {worker.trend === 'flat' && (
                    <span className="p-1 rounded bg-slate-100 text-slate-400 block" title="人效环比持平">
                      <Minus className="w-4 h-4" />
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
