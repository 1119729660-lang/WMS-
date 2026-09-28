import React, { useState } from 'react';
import {
  TrendingUp,
  Layers,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { SlaTrendPoint, SlaSystemConfig, SlaNodeId } from '../../types/sla';

interface SlaTrendChartProps {
  trendData: SlaTrendPoint[];
  config: SlaSystemConfig;
  selectedWarehouseName?: string;
}

type MetricViewMode = 'all_composite' | 'inbound' | 'outbound';

export const SlaTrendChart: React.FC<SlaTrendChartProps> = ({
  trendData,
  config,
  selectedWarehouseName,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<MetricViewMode>('all_composite');

  if (!trendData || trendData.length === 0) return null;

  const targetRate = config.targetPassRate;

  // Chart coordinate space
  const svgWidth = 800;
  const svgHeight = 220;
  const padding = { top: 25, right: 30, bottom: 35, left: 45 };

  const innerWidth = svgWidth - padding.left - padding.right;
  const innerHeight = svgHeight - padding.top - padding.bottom;

  const yMin = 88;
  const yMax = 100;

  const getX = (index: number) => {
    return padding.left + (index / Math.max(1, trendData.length - 1)) * innerWidth;
  };

  const getY = (val: number) => {
    const clamped = Math.max(yMin, Math.min(yMax, val));
    const ratio = (clamped - yMin) / (yMax - yMin);
    return padding.top + innerHeight - ratio * innerHeight;
  };

  const yTargetLine = getY(targetRate);

  // Line paths
  const ptsOverall = trendData.map((d, i) => `${getX(i)},${getY(d.overallRate)}`);
  const ptsInReg = trendData.map((d, i) => `${getX(i)},${getY(d.nodeRates.inbound_register)}`);
  const ptsOutReg = trendData.map((d, i) => `${getX(i)},${getY(d.nodeRates.outbound_register)}`);
  const ptsInPut = trendData.map((d, i) => `${getX(i)},${getY(d.nodeRates.inbound_putaway)}`);
  const ptsOutPrep = trendData.map((d, i) => `${getX(i)},${getY(d.nodeRates.outbound_prepare)}`);

  const hoveredItem = hoverIndex !== null ? trendData[hoverIndex] : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
      {/* Header & Metric View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-800">
                SLA 履约时效趋势走势图
              </h3>
              {selectedWarehouseName && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">
                  {selectedWarehouseName}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              时序折线反映各节点与全仓综合达标率变化轨迹，带 {targetRate}% 基准考核红线
            </p>
          </div>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setViewMode('all_composite')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              viewMode === 'all_composite'
                ? 'bg-white text-blue-700 shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            综合达标率
          </button>
          <button
            onClick={() => setViewMode('inbound')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              viewMode === 'inbound'
                ? 'bg-white text-blue-700 shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            入库两节点
          </button>
          <button
            onClick={() => setViewMode('outbound')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              viewMode === 'outbound'
                ? 'bg-white text-blue-700 shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            出库两节点
          </button>
        </div>
      </div>

      {/* SVG Interactive Chart Container */}
      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-52 select-none"
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id="slaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padding.top + innerHeight * (1 - ratio);
            const val = yMin + ratio * (yMax - yMin);
            return (
              <g key={ratio}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={svgWidth - padding.right}
                  y2={y}
                  stroke="#f1f5f9"
                  strokeDasharray="3 3"
                />
                <text
                  x={padding.left - 6}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="10"
                  fill="#94a3b8"
                  fontFamily="monospace"
                >
                  {val.toFixed(0)}%
                </text>
              </g>
            );
          })}

          {/* Target Pass Rate Line (Red dashed) */}
          <line
            x1={padding.left}
            y1={yTargetLine}
            x2={svgWidth - padding.right}
            y2={yTargetLine}
            stroke="#ef4444"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          <text
            x={svgWidth - padding.right}
            y={yTargetLine - 5}
            textAnchor="end"
            fontSize="9"
            fill="#ef4444"
            fontWeight="bold"
          >
            考核基准线 ({targetRate}%)
          </text>

          {/* Polylines based on mode */}
          {viewMode === 'all_composite' && (
            <>
              {/* Area fill */}
              <polygon
                points={`${getX(0)},${padding.top + innerHeight} ${ptsOverall.join(
                  ' '
                )} ${getX(trendData.length - 1)},${padding.top + innerHeight}`}
                fill="url(#slaGradient)"
              />
              <polyline
                fill="none"
                stroke="#2563eb"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={ptsOverall.join(' ')}
              />
            </>
          )}

          {viewMode === 'inbound' && (
            <>
              {/* Inbound Register */}
              <polyline
                fill="none"
                stroke="#0284c7"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={ptsInReg.join(' ')}
              />
              {/* Inbound Putaway */}
              <polyline
                fill="none"
                stroke="#0d9488"
                strokeWidth="2"
                strokeDasharray="3 2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={ptsInPut.join(' ')}
              />
            </>
          )}

          {viewMode === 'outbound' && (
            <>
              {/* Outbound Register */}
              <polyline
                fill="none"
                stroke="#8b5cf6"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={ptsOutReg.join(' ')}
              />
              {/* Outbound Prepare */}
              <polyline
                fill="none"
                stroke="#d97706"
                strokeWidth="2"
                strokeDasharray="3 2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={ptsOutPrep.join(' ')}
              />
            </>
          )}

          {/* Hit columns & hover indicators */}
          {trendData.map((d, i) => {
            const x = getX(i);
            const isHovered = hoverIndex === i;

            return (
              <g
                key={d.dateStr}
                className="cursor-pointer"
                onMouseEnter={() => setHoverIndex(i)}
              >
                {/* Hit Box */}
                <rect
                  x={x - innerWidth / (trendData.length * 2)}
                  y={padding.top}
                  width={innerWidth / trendData.length}
                  height={innerHeight}
                  fill="transparent"
                />

                {/* X labels */}
                <text
                  x={x}
                  y={svgHeight - 10}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#64748b"
                  fontFamily="monospace"
                >
                  {d.periodLabel}
                </text>

                {/* Hover vertical bar */}
                {isHovered && (
                  <line
                    x1={x}
                    y1={padding.top}
                    x2={x}
                    y2={padding.top + innerHeight}
                    stroke="#cbd5e1"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                  />
                )}

                {/* Dot */}
                {isHovered && (
                  <circle
                    cx={x}
                    cy={getY(d.overallRate)}
                    r="5"
                    fill="#2563eb"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Tooltip */}
        {hoveredItem && (
          <div className="absolute top-2 right-4 bg-slate-900/90 backdrop-blur-xs text-white p-3 rounded-xl text-xs font-mono shadow-xl border border-slate-700 pointer-events-none space-y-1.5 min-w-56">
            <div className="font-bold text-slate-300 flex items-center justify-between text-[11px] pb-1 border-b border-slate-700">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-blue-400" />
                <span>{hoveredItem.periodLabel}</span>
              </span>
              <span className="text-slate-400">
                订单: {hoveredItem.totalOrders} 单 (延:{hoveredItem.delayedOrders})
              </span>
            </div>

            <div className="space-y-1 text-[11px]">
              <div className="flex items-center justify-between text-blue-300 font-bold">
                <span>综合 SLA 达标率:</span>
                <span>{hoveredItem.overallRate}%</span>
              </div>
              <div className="flex items-center justify-between text-sky-300">
                <span>1. 入库注册 (≤1h):</span>
                <span>{hoveredItem.nodeRates.inbound_register}%</span>
              </div>
              <div className="flex items-center justify-between text-teal-300">
                <span>2. 入库上架 (≤24h):</span>
                <span>{hoveredItem.nodeRates.inbound_putaway}%</span>
              </div>
              <div className="flex items-center justify-between text-purple-300">
                <span>3. 出库注册 (≤10m):</span>
                <span>{hoveredItem.nodeRates.outbound_register}%</span>
              </div>
              <div className="flex items-center justify-between text-amber-300">
                <span>4. 出库准备 (≤24h):</span>
                <span>{hoveredItem.nodeRates.outbound_prepare}%</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
        <div className="flex flex-wrap items-center gap-4">
          {viewMode === 'all_composite' && (
            <>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1 bg-blue-600 rounded"></span>
                <span>综合 SLA 达标率曲线</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 border-b border-rose-500 border-dashed"></span>
                <span className="text-rose-600 font-medium">
                  {targetRate}% 达标基准线
                </span>
              </div>
            </>
          )}

          {viewMode === 'inbound' && (
            <>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1 bg-sky-600 rounded"></span>
                <span>入库注册 (≤1h)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 border-b border-teal-600 border-dashed"></span>
                <span>入库上架 (≤24h)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 border-b border-rose-500 border-dashed"></span>
                <span className="text-rose-600 font-medium">{targetRate}% 基准线</span>
              </div>
            </>
          )}

          {viewMode === 'outbound' && (
            <>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1 bg-purple-600 rounded"></span>
                <span>出库注册 (≤10min)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 border-b border-amber-600 border-dashed"></span>
                <span>出库准备 (≤24h)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 border-b border-rose-500 border-dashed"></span>
                <span className="text-rose-600 font-medium">{targetRate}% 基准线</span>
              </div>
            </>
          )}
        </div>

        <span className="text-[11px] text-slate-400">
          * 鼠标悬浮折线可查看具体时序详细节点达标率
        </span>
      </div>
    </div>
  );
};
