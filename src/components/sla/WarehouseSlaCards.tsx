import React from 'react';
import {
  Warehouse,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ChevronRight,
  Layers,
  ArrowUpRight,
  Activity,
} from 'lucide-react';
import { SlaWarehouseMetric, SlaSystemConfig } from '../../types/sla';

interface WarehouseSlaCardsProps {
  warehouseMetrics: SlaWarehouseMetric[];
  selectedWarehouseId: string | null; // null 表示全仓，非空表示单仓选中
  onToggleSelectWarehouse: (warehouseId: string) => void;
  config: SlaSystemConfig;
}

export const WarehouseSlaCards: React.FC<WarehouseSlaCardsProps> = ({
  warehouseMetrics,
  selectedWarehouseId,
  onToggleSelectWarehouse,
  config,
}) => {
  const targetRate = config.targetPassRate;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Warehouse className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs font-bold text-slate-800 tracking-wide uppercase">
            仓库 SLA 履约看板卡片 (点击卡片可聚焦钻取单仓或取消恢复全仓)
          </h3>
          <span className="text-[11px] text-slate-400">
            [算法模式:{' '}
            {config.calculationMode === 'arithmetic_mean'
              ? '4节点算术平均'
              : '订单量加权平均'}
            ]
          </span>
        </div>
        <div className="text-[11px] text-slate-500 flex items-center gap-2">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            <span>达标 (≥{targetRate}%)</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
            <span>未达标 (&lt;{targetRate}%)</span>
          </span>
        </div>
      </div>

      {/* Grid of Warehouse Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {warehouseMetrics.map((wh) => {
          const isSelected = selectedWarehouseId === wh.warehouseId;
          const isPass = wh.compositePassRate >= targetRate;

          return (
            <div
              key={wh.warehouseId}
              onClick={() => onToggleSelectWarehouse(wh.warehouseId)}
              className={`relative rounded-2xl p-4 transition-all duration-200 cursor-pointer select-none border ${
                isSelected
                  ? 'bg-blue-50/40 border-blue-500 ring-2 ring-blue-500 shadow-md transform -translate-y-0.5'
                  : 'bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-xs'
              }`}
            >
              {/* Selected Badge */}
              {isSelected && (
                <div className="absolute top-2.5 right-3 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                  <span>聚焦中</span>
                </div>
              )}

              {/* Top Row: Warehouse Code & Name */}
              <div className="pr-12">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-xs px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                    {wh.warehouseCode}
                  </span>
                  <span className="text-xs font-bold text-slate-800 truncate" title={wh.warehouseName}>
                    {wh.warehouseName}
                  </span>
                </div>
              </div>

              {/* Main Metric: Composite SLA Pass Rate */}
              <div className="mt-3.5 flex items-baseline justify-between">
                <div>
                  <div className="text-[11px] text-slate-400 font-medium">
                    综合 SLA 达标率
                  </div>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span
                      className={`text-2xl font-black font-mono tracking-tight ${
                        isPass ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {wh.compositePassRate.toFixed(1)}
                    </span>
                    <span
                      className={`text-xs font-bold font-mono ${
                        isPass ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      %
                    </span>
                  </div>
                </div>

                {/* Status Pill */}
                <div className="text-right">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isPass
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {isPass ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-3 h-3 text-rose-600" />
                    )}
                    <span>{isPass ? '达成目标' : '时效未达标'}</span>
                  </span>
                  <div className="text-[10px] text-slate-400 font-mono mt-1">
                    基准: {targetRate}%
                  </div>
                </div>
              </div>

              {/* Secondary Metrics: Delayed Orders & 4 Monitored Nodes */}
              <div className="mt-3.5 pt-3 border-t border-slate-100/90 grid grid-cols-2 gap-2 text-xs">
                {/* Delayed Orders Count */}
                <div className="bg-slate-50/80 rounded-xl p-2 border border-slate-100">
                  <div className="text-[10px] text-slate-400">延迟订单数</div>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span
                      className={`font-mono font-black text-sm ${
                        wh.delayedOrdersCount > 0
                          ? 'text-rose-600 font-bold'
                          : 'text-slate-700'
                      }`}
                    >
                      {wh.delayedOrdersCount}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      / {wh.totalOrders} 单
                    </span>
                  </div>
                  <div className="text-[9px] text-slate-400 mt-0.5">
                    至少一节点超时
                  </div>
                </div>

                {/* Monitored Nodes Count */}
                <div className="bg-slate-50/80 rounded-xl p-2 border border-slate-100">
                  <div className="text-[10px] text-slate-400">监控节点数</div>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="font-mono font-black text-sm text-blue-600">
                      {wh.monitoredNodeCount}
                    </span>
                    <span className="text-[10px] text-slate-400">个核心环节</span>
                  </div>
                  <div className="text-[9px] text-slate-400 mt-0.5 truncate" title="入库注册/出库注册/入库上架/出库准备">
                    固定4节点覆盖
                  </div>
                </div>
              </div>

              {/* Bottom hint */}
              <div className="mt-2.5 text-[10px] text-slate-400 flex items-center justify-between">
                <span>
                  {config.calculationMode === 'arithmetic_mean'
                    ? '4节点算术均值'
                    : '订单量加权均值'}
                </span>
                <span className="text-blue-600 font-medium">
                  {isSelected ? '点击取消聚焦' : '点击聚焦钻取 →'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
