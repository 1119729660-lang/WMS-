import React, { useState } from 'react';
import {
  Layers,
  ArrowDown,
  Info,
  CheckCircle2,
  AlertTriangle,
  Send,
  Boxes,
} from 'lucide-react';
import { ReplenishItem } from '../types/replenishment';

interface RackLayoutViewProps {
  items: ReplenishItem[];
  onManualDispatch: (itemIds: string[]) => void;
  onOpenItemDetail: (item: ReplenishItem) => void;
}

export const RackLayoutView: React.FC<RackLayoutViewProps> = ({
  items,
  onManualDispatch,
  onOpenItemDetail,
}) => {
  const [selectedRackCode, setSelectedRackCode] = useState<string>(
    items[0]?.rackCode || 'A-01-02'
  );

  // Group items by rackCode
  const rackMap = new Map<string, ReplenishItem[]>();
  items.forEach((item) => {
    if (!rackMap.has(item.rackCode)) {
      rackMap.set(item.rackCode, []);
    }
    rackMap.get(item.rackCode)!.push(item);
  });

  const selectedRackItems = rackMap.get(selectedRackCode) || [];
  const activeSelectedItem = selectedRackItems[0] || items[0];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-base">
              货架同架垂直空间分布拓扑图
            </h3>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded border border-emerald-200">
              同架垂直补货就绪
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            前置依赖验证：筹备期已完成一层拣选位与二/三层备货位同位理货，提升叉车垂直调拨效率，消除巷道长距离平移。
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-red-500"></span>
            <span className="text-slate-600">P0 断货/挂起</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-500"></span>
            <span className="text-slate-600">P1 紧缺 (&lt;1天)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-blue-500"></span>
            <span className="text-slate-600">P2 预警 (&lt;2天)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500"></span>
            <span className="text-slate-600">正常库存</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Rack Selector Grid (巷道与架位矩阵) */}
        <div className="lg:col-span-4 bg-slate-50 rounded-xl p-4 border border-slate-200">
          <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-3 flex items-center justify-between">
            <span>货架排架列表 (点击钻取)</span>
            <span className="font-mono text-slate-400 text-[11px]">
              {Array.from(rackMap.keys()).length} 个架位
            </span>
          </h4>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {Array.from(rackMap.entries()).map(([rackCode, rackItems]) => {
              const primaryItem = rackItems[0];
              const isSelected = selectedRackCode === rackCode;

              // Highest priority in this rack
              const hasP0 = rackItems.some((i) => i.priority === 'P0');
              const hasP1 = rackItems.some((i) => i.priority === 'P1');
              const hasP2 = rackItems.some((i) => i.priority === 'P2');

              return (
                <div
                  key={rackCode}
                  onClick={() => setSelectedRackCode(rackCode)}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-50/80 border-blue-500 shadow-sm ring-1 ring-blue-400'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {rackCode}
                    </span>
                    <div className="flex items-center gap-1">
                      {hasP0 && (
                        <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-bold">
                          P0
                        </span>
                      )}
                      {hasP1 && !hasP0 && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                          P1
                        </span>
                      )}
                      {hasP2 && !hasP0 && !hasP1 && (
                        <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">
                          P2
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="font-medium text-slate-700 truncate">
                    {primaryItem.skuName}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-1.5 border-t border-slate-100">
                    <span>一层拣货: {primaryItem.currentPickStock} 件</span>
                    <span
                      className={`font-mono font-bold ${
                        primaryItem.daysOfSupply <= 0
                          ? 'text-red-600'
                          : primaryItem.daysOfSupply < 1
                          ? 'text-amber-600'
                          : 'text-slate-600'
                      }`}
                    >
                      余 {primaryItem.daysOfSupply} 天
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: 3-Tier Vertical Rack Cross-Section (立面剖面图) */}
        <div className="lg:col-span-8 bg-slate-900 rounded-xl p-5 text-white flex flex-col justify-between shadow-md">
          {activeSelectedItem ? (
            <div>
              {/* Selected SKU Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-blue-500/20 text-blue-300 font-mono px-2 py-0.5 rounded border border-blue-500/30">
                      架位: {activeSelectedItem.rackCode}
                    </span>
                    <h4 className="font-bold text-slate-100 text-sm sm:text-base">
                      {activeSelectedItem.skuName}
                    </h4>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {activeSelectedItem.zone} · 规格: {activeSelectedItem.specification} · 7日均销: <span className="text-amber-300 font-mono font-bold">{activeSelectedItem.avgDailySales}</span> 件/日
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onOpenItemDetail(activeSelectedItem)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-lg border border-slate-700 cursor-pointer"
                  >
                    查看动销透视
                  </button>
                  <button
                    onClick={() => onManualDispatch([activeSelectedItem.id])}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg cursor-pointer shadow-sm flex items-center gap-1"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>立即下发垂直补货</span>
                  </button>
                </div>
              </div>

              {/* Visual 3-Level Rack Steel Structure */}
              <div className="my-6 max-w-xl mx-auto space-y-4">
                {/* Level 3: 三层高位备货位 (Reserve Level 3) */}
                {(() => {
                  const l3 = activeSelectedItem.reserveLocations.find(
                    (l) => l.level === 3
                  );
                  return (
                    <div
                      className={`rounded-xl border p-4 transition-all ${
                        l3 && l3.availableStock > 0
                          ? 'bg-slate-800/90 border-slate-700'
                          : 'bg-slate-800/40 border-slate-800/80 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-2">
                        <div className="flex items-center gap-2">
                          <span className="bg-slate-700 text-slate-200 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                            第 3 层 · 高位备货区
                          </span>
                          <span className="font-mono text-slate-300 font-bold">
                            {l3 ? l3.locationCode : '未规划'}
                          </span>
                          {l3?.isSameRack && (
                            <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/60">
                              同架
                            </span>
                          )}
                        </div>
                        <span className="text-slate-400 text-xs">
                          {l3 ? `批次: ${l3.batchNo}` : '-'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-xs text-slate-400">
                          可用存量 (备货):
                        </div>
                        <div className="font-mono font-bold text-xl text-slate-200">
                          {l3 ? l3.availableStock : 0}{' '}
                          <span className="text-xs font-normal text-slate-400">
                            {activeSelectedItem.unit}
                          </span>
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        优先级说明：当二层备货位库存消耗完毕时，系统调度三层备货位向下补足。
                      </div>
                    </div>
                  );
                })()}

                {/* Vertical Downward Transfer Indicator 2 */}
                <div className="flex items-center justify-center -my-2 text-slate-500">
                  <div className="h-6 w-0.5 bg-slate-700"></div>
                </div>

                {/* Level 2: 二层中位备货位 (Reserve Level 2 - 优先调拨源) */}
                {(() => {
                  const l2 = activeSelectedItem.reserveLocations.find(
                    (l) => l.level === 2
                  );
                  const isPrimarySource =
                    activeSelectedItem.recommendedSourceLocation?.locationCode ===
                    l2?.locationCode;

                  return (
                    <div
                      className={`rounded-xl border p-4 transition-all ${
                        isPrimarySource
                          ? 'bg-gradient-to-r from-emerald-950/40 to-slate-800 border-emerald-500/80 shadow-lg shadow-emerald-950/30'
                          : 'bg-slate-800/90 border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-2">
                        <div className="flex items-center gap-2">
                          <span className="bg-emerald-800 text-emerald-100 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                            第 2 层 · 优先备货源位
                          </span>
                          <span className="font-mono text-emerald-300 font-bold">
                            {l2 ? l2.locationCode : '无同架二层'}
                          </span>
                          {l2?.isSameRack && (
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30 font-bold">
                              🎯 同架垂直直取
                            </span>
                          )}
                        </div>
                        <span className="text-slate-400 text-xs">
                          {l2 ? `批次: ${l2.batchNo}` : '-'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-xs text-slate-300">
                          可用存量 (优先调拨):
                        </div>
                        <div className="font-mono font-bold text-xl text-emerald-400">
                          {l2 ? l2.availableStock : 0}{' '}
                          <span className="text-xs font-normal text-slate-400">
                            {activeSelectedItem.unit}
                          </span>
                        </div>
                      </div>

                      {isPrimarySource && (
                        <div className="mt-2 pt-2 border-t border-emerald-800/40 text-[11px] text-emerald-300 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>
                            当前系统推荐首选源库位！垂直提升机/叉车直接下架，无需巷道往返。
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Animated Vertical Drop Arrow to Level 1 */}
                <div className="flex flex-col items-center justify-center -my-2 text-emerald-400">
                  <div className="h-6 w-0.5 bg-gradient-to-b from-emerald-500 to-blue-500 animate-pulse"></div>
                  <div className="bg-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-mono text-emerald-300 border border-emerald-500/40 my-0.5">
                    垂直补货路径 (零平面位移)
                  </div>
                  <ArrowDown className="w-4 h-4 text-blue-400 animate-bounce" />
                </div>

                {/* Level 1: 一层地平面拣选位 (Pick Face) */}
                <div
                  className={`rounded-xl border p-4 transition-all ${
                    activeSelectedItem.priority === 'P0'
                      ? 'bg-red-950/40 border-red-600 shadow-lg shadow-red-950/40'
                      : activeSelectedItem.priority === 'P1'
                      ? 'bg-amber-950/40 border-amber-600 shadow-lg shadow-amber-950/40'
                      : 'bg-slate-800/90 border-blue-500/70'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-blue-600 text-white text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                        第 1 层 · 拣货作业位 (Pick Face)
                      </span>
                      <span className="font-mono text-blue-300 font-bold">
                        {activeSelectedItem.pickLocationCode}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          activeSelectedItem.priority === 'P0'
                            ? 'bg-red-600 text-white'
                            : activeSelectedItem.priority === 'P1'
                            ? 'bg-amber-500 text-slate-900'
                            : 'bg-blue-500 text-white'
                        }`}
                      >
                        {activeSelectedItem.priority} 优先级
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 my-2 text-center bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    <div>
                      <div className="text-[10px] text-slate-400">拣选位现存</div>
                      <div
                        className={`font-mono font-bold text-lg ${
                          activeSelectedItem.currentPickStock === 0
                            ? 'text-red-400'
                            : 'text-white'
                        }`}
                      >
                        {activeSelectedItem.currentPickStock}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">剩余可用天数</div>
                      <div
                        className={`font-mono font-bold text-lg ${
                          activeSelectedItem.daysOfSupply <= 0
                            ? 'text-red-400'
                            : activeSelectedItem.daysOfSupply < 1
                            ? 'text-amber-400'
                            : 'text-blue-400'
                        }`}
                      >
                        {activeSelectedItem.daysOfSupply} 天
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">建议补入</div>
                      <div className="font-mono font-bold text-lg text-emerald-400">
                        +{activeSelectedItem.suggestedReplenishQty}
                      </div>
                    </div>
                  </div>

                  {activeSelectedItem.priorityReason && (
                    <div className="text-[11px] text-slate-300 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{activeSelectedItem.priorityReason}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-slate-500">
              请从左侧选择货架查看垂直空间拓扑
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
