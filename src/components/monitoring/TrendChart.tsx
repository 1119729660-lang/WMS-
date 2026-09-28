import React, { useState } from 'react';
import {
  TrendingUp,
  Clock,
  AlertTriangle,
  Package,
  Layers,
  Calendar,
} from 'lucide-react';
import { TrendDataPoint, StockoutCalculationMethod } from '../../types/monitoring';

interface TrendChartProps {
  trendData: TrendDataPoint[];
  stockoutMethod: StockoutCalculationMethod;
}

type ChartMetric = 'timeliness' | 'stockout' | 'volume';

export const TrendChart: React.FC<TrendChartProps> = ({
  trendData,
  stockoutMethod,
}) => {
  const [activeMetric, setActiveMetric] = useState<ChartMetric>('timeliness');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!trendData || trendData.length === 0) return null;

  // Chart dimensions
  const svgWidth = 800;
  const svgHeight = 220;
  const padding = { top: 25, right: 30, bottom: 35, left: 50 };

  const innerWidth = svgWidth - padding.left - padding.right;
  const innerHeight = svgHeight - padding.top - padding.bottom;

  // Values calculation based on metric
  let yMin = 0;
  let yMax = 100;
  let yUnit = '%';

  if (activeMetric === 'timeliness') {
    yMin = 85;
    yMax = 100;
    yUnit = '%';
  } else if (activeMetric === 'stockout') {
    yMin = 0;
    yMax = 6;
    yUnit = '%';
  } else {
    // volume
    const maxPieces = Math.max(...trendData.map((d) => d.totalPieces));
    yMin = 15000;
    yMax = Math.ceil(maxPieces / 5000) * 5000;
    yUnit = '件';
  }

  // Coordinate mapper
  const getX = (index: number) => {
    return padding.left + (index / (trendData.length - 1)) * innerWidth;
  };

  const getY = (val: number) => {
    const clamped = Math.max(yMin, Math.min(yMax, val));
    const ratio = (clamped - yMin) / (yMax - yMin);
    return padding.top + innerHeight - ratio * innerHeight;
  };

  // Build path
  const pointsTimeliness = trendData.map((d, i) => `${getX(i)},${getY(d.timelinessRate)}`);
  const pointsStockout1 = trendData.map((d, i) => `${getX(i)},${getY(d.stockoutRatePicking)}`);
  const pointsStockout2 = trendData.map((d, i) => `${getX(i)},${getY(d.stockoutRateSku)}`);
  const pointsVolume = trendData.map((d, i) => `${getX(i)},${getY(d.totalPieces)}`);

  // Target 95% line for timeliness
  const yTarget95 = getY(95);

  const hoveredData = hoverIndex !== null ? trendData[hoverIndex] : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
      {/* Header & Metric Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              运营趋势监测走势图 ({trendData.length}天时序)
            </h3>
            <p className="text-[11px] text-slate-400">
              数据每日按批次汇总，支持各指标基准线与多口径对比
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveMetric('timeliness')}
            className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeMetric === 'timeliness'
                ? 'bg-white text-blue-700 shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>补货及时率</span>
          </button>

          <button
            onClick={() => setActiveMetric('stockout')}
            className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeMetric === 'stockout'
                ? 'bg-white text-blue-700 shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>缺货率双口径</span>
          </button>

          <button
            onClick={() => setActiveMetric('volume')}
            className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeMetric === 'volume'
                ? 'bg-white text-blue-700 shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>补货吞吐量</span>
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
            {/* Gradient for volume area */}
            <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
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
                  stroke="#e2e8f0"
                  strokeDasharray="3 3"
                />
                <text
                  x={padding.left - 8}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="10"
                  fill="#94a3b8"
                  fontFamily="monospace"
                >
                  {val.toFixed(activeMetric === 'stockout' ? 1 : 0)}
                  {yUnit}
                </text>
              </g>
            );
          })}

          {/* Benchmark 95% line for Timeliness */}
          {activeMetric === 'timeliness' && (
            <g>
              <line
                x1={padding.left}
                y1={yTarget95}
                x2={svgWidth - padding.right}
                y2={yTarget95}
                stroke="#ef4444"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              <text
                x={svgWidth - padding.right}
                y={yTarget95 - 4}
                textAnchor="end"
                fontSize="9"
                fill="#ef4444"
                fontWeight="bold"
              >
                目标考核基准线 (95.0%)
              </text>
            </g>
          )}

          {/* Lines & Areas according to metric */}
          {activeMetric === 'timeliness' && (
            <>
              {/* Area fill */}
              <polygon
                points={`${getX(0)},${padding.top + innerHeight} ${pointsTimeliness.join(
                  ' '
                )} ${getX(trendData.length - 1)},${padding.top + innerHeight}`}
                fill="url(#blueGradient)"
              />
              {/* Main Line */}
              <polyline
                fill="none"
                stroke="#2563eb"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={pointsTimeliness.join(' ')}
              />
            </>
          )}

          {activeMetric === 'stockout' && (
            <>
              {/* Line 1: Picking point reports */}
              <polyline
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={pointsStockout1.join(' ')}
              />
              {/* Line 2: SKU ratio */}
              <polyline
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
                strokeDasharray="4 3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={pointsStockout2.join(' ')}
              />
            </>
          )}

          {activeMetric === 'volume' && (
            <>
              <polygon
                points={`${getX(0)},${padding.top + innerHeight} ${pointsVolume.join(
                  ' '
                )} ${getX(trendData.length - 1)},${padding.top + innerHeight}`}
                fill="url(#emeraldGradient)"
              />
              <polyline
                fill="none"
                stroke="#059669"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={pointsVolume.join(' ')}
              />
            </>
          )}

          {/* Interactive touch targets along X axis */}
          {trendData.map((d, i) => {
            const x = getX(i);
            const isHovered = hoverIndex === i;
            // Only draw label every 3-5 days to avoid crowding
            const showLabel =
              trendData.length <= 10
                ? true
                : i % Math.ceil(trendData.length / 8) === 0 || i === trendData.length - 1;

            return (
              <g
                key={d.date}
                className="cursor-pointer"
                onMouseEnter={() => setHoverIndex(i)}
              >
                {/* Invisible hit column */}
                <rect
                  x={x - innerWidth / (trendData.length * 2)}
                  y={padding.top}
                  width={innerWidth / trendData.length}
                  height={innerHeight}
                  fill="transparent"
                />

                {/* Date labels at bottom */}
                {showLabel && (
                  <text
                    x={x}
                    y={svgHeight - 10}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#64748b"
                    fontFamily="monospace"
                  >
                    {d.dateLabel}
                  </text>
                )}

                {/* Hover vertical bar */}
                {isHovered && (
                  <line
                    x1={x}
                    y1={padding.top}
                    x2={x}
                    y2={padding.top + innerHeight}
                    stroke="#94a3b8"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                )}

                {/* Highlight Circle on hover */}
                {isHovered && activeMetric === 'timeliness' && (
                  <circle
                    cx={x}
                    cy={getY(d.timelinessRate)}
                    r="5"
                    fill="#2563eb"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                )}
                {isHovered && activeMetric === 'stockout' && (
                  <>
                    <circle
                      cx={x}
                      cy={getY(d.stockoutRatePicking)}
                      r="4"
                      fill="#f59e0b"
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                    <circle
                      cx={x}
                      cy={getY(d.stockoutRateSku)}
                      r="4"
                      fill="#ef4444"
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                  </>
                )}
                {isHovered && activeMetric === 'volume' && (
                  <circle
                    cx={x}
                    cy={getY(d.totalPieces)}
                    r="5"
                    fill="#059669"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip info */}
        {hoveredData && (
          <div className="absolute top-2 right-4 bg-slate-900/90 backdrop-blur-xs text-white p-2.5 rounded-xl text-xs font-mono shadow-xl border border-slate-700 pointer-events-none space-y-1">
            <div className="font-bold text-slate-300 flex items-center gap-1.5 text-[11px]">
              <Calendar className="w-3 h-3 text-blue-400" />
              <span>{hoveredData.date}</span>
            </div>

            {activeMetric === 'timeliness' && (
              <div className="space-y-0.5">
                <div className="text-blue-300 font-bold">
                  补货及时率: {hoveredData.timelinessRate}%
                </div>
                <div className="text-[10px] text-slate-400">
                  目标考核基准: 95.0% (
                  {hoveredData.timelinessRate >= 95 ? '达标' : '未达标'})
                </div>
              </div>
            )}

            {activeMetric === 'stockout' && (
              <div className="space-y-0.5">
                <div className="text-amber-400 font-bold">
                  口径① 拣点缺货率: {hoveredData.stockoutRatePicking}% (
                  {hoveredData.pickingReports} / {hoveredData.totalPickingOps})
                </div>
                <div className="text-rose-400 font-bold">
                  口径② SKU 缺货率: {hoveredData.stockoutRateSku}% (
                  {hoveredData.stockoutSkus} / {hoveredData.totalWaveSkus})
                </div>
              </div>
            )}

            {activeMetric === 'volume' && (
              <div className="space-y-0.5">
                <div className="text-emerald-300 font-bold">
                  补货总件数: {hoveredData.totalPieces.toLocaleString()} 件
                </div>
                <div className="text-[10px] text-slate-300">
                  任务总工单数: {hoveredData.totalTasks} 单 | 停滞任务: {hoveredData.stuckCount} 单
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legend & explanations */}
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-4">
          {activeMetric === 'timeliness' && (
            <>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1 bg-blue-600 rounded"></span>
                <span>实绩及时率曲线</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 border-b border-rose-500 border-dashed"></span>
                <span className="text-rose-600 font-medium">95% 目标红线</span>
              </div>
            </>
          )}

          {activeMetric === 'stockout' && (
            <>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1 bg-amber-500 rounded"></span>
                <span className="text-amber-700 font-medium">口径① 拣货点缺货率 (上报频次 ÷ 拣货总频次)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 border-b border-rose-500 border-dashed"></span>
                <span className="text-rose-700 font-medium">口径② 波次缺货率 (缺货SKU ÷ 波次SKU)</span>
              </div>
            </>
          )}

          {activeMetric === 'volume' && (
            <>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1 bg-emerald-600 rounded"></span>
                <span className="text-emerald-700 font-medium">每日补货总件数 (PCS)</span>
              </div>
            </>
          )}
        </div>

        <span className="text-[11px] text-slate-400">
          * 鼠标悬浮折线可查看当日详细实绩
        </span>
      </div>
    </div>
  );
};
