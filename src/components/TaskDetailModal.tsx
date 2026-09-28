import React from 'react';
import {
  X,
  TrendingDown,
  Layers,
  Send,
  AlertCircle,
  Calendar,
  CheckCircle,
  HelpCircle,
  Compass,
} from 'lucide-react';
import { ReplenishItem } from '../types/replenishment';

interface TaskDetailModalProps {
  item: ReplenishItem | null;
  onClose: () => void;
  onTogglePromoAnomaly: (itemId: string, date: string) => void;
  onManualDispatch: (itemIds: string[]) => void;
  onUpdateCoeff: (itemId: string, coeff: number) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  item,
  onClose,
  onTogglePromoAnomaly,
  onManualDispatch,
  onUpdateCoeff,
}) => {
  if (!item) return null;

  const maxDailyQty = Math.max(
    ...item.dailySalesHistory.map((d) => d.quantity),
    50
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                  item.priority === 'P0'
                    ? 'bg-red-500 text-white'
                    : item.priority === 'P1'
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-blue-500 text-white'
                }`}
              >
                {item.priority} 级任务
              </span>
              <h3 className="font-bold text-base text-slate-100">{item.skuName}</h3>
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-3">
              <span>SKU: {item.skuCode}</span>
              <span>库区: {item.zone}</span>
              <span>拣货位: {item.pickLocationCode}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* 1. 7-Day Sales Breakdown & Promo Anomaly Toggles */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-600" />
                <h4 className="font-bold text-slate-800 text-xs sm:text-sm">
                  近 7 日每日出库监控与促销异常日剔除
                </h4>
              </div>
              <div className="text-[11px] text-slate-500">
                点击异常日标签可切换剔除状态，实时重算均销
              </div>
            </div>

            {/* Visual Bar Chart */}
            <div className="grid grid-cols-7 gap-2 pt-4 pb-2 items-end h-40 border-b border-slate-200">
              {item.dailySalesHistory.map((day) => {
                const heightPercent = Math.min(
                  100,
                  Math.max(10, (day.quantity / maxDailyQty) * 100)
                );

                return (
                  <div
                    key={day.date}
                    className="flex flex-col items-center justify-end h-full group"
                  >
                    <span className="text-[10px] font-mono text-slate-500 mb-1 group-hover:font-bold">
                      {day.quantity}
                    </span>

                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full max-w-[28px] rounded-t-md transition-all cursor-pointer ${
                        day.isPromoAnomaly
                          ? 'bg-red-400/80 hover:bg-red-500'
                          : 'bg-blue-600 hover:bg-blue-500'
                      }`}
                      onClick={() => onTogglePromoAnomaly(item.id, day.date)}
                      title={`点击切换剔除/计入该日出库`}
                    ></div>

                    <div className="mt-2 text-center">
                      <div className="text-[11px] font-semibold text-slate-700">
                        {day.dayLabel}
                      </div>
                      <div className="text-[9px] text-slate-400">{day.date.slice(5)}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Promo day toggle buttons list */}
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              {item.dailySalesHistory.map((day) => (
                <button
                  key={day.date}
                  onClick={() => onTogglePromoAnomaly(item.id, day.date)}
                  className={`px-2 py-1 rounded border text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                    day.isPromoAnomaly
                      ? 'bg-red-50 text-red-700 border-red-300'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span>{day.dayLabel}: {day.quantity}件</span>
                  {day.isPromoAnomaly ? (
                    <span className="font-bold text-red-600 text-[10px]">[已剔除]</span>
                  ) : (
                    <span className="text-slate-400 text-[10px]">[计入]</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Replenishment Mathematical Formula Breakdown */}
          <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-200 space-y-3">
            <h4 className="font-bold text-blue-900 text-xs sm:text-sm flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-blue-600" />
              <span>业务逻辑推导与计算过程剖析</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-white p-3 rounded-lg border border-blue-100">
                <span className="text-slate-400 text-[11px] block mb-1">
                  1. 7日平均销量推导
                </span>
                <div className="font-mono font-bold text-slate-800 text-sm">
                  {item.total7DaySales} 件 ÷ {item.validSalesDays} 天 = {item.avgDailySales} 件/日
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  剔除促销异常日后，真实有效天数出库加总均分。
                </p>
              </div>

              <div className="bg-white p-3 rounded-lg border border-blue-100">
                <span className="text-slate-400 text-[11px] block mb-1">
                  2. 剩余可用天数计算
                </span>
                <div className="font-mono font-bold text-slate-800 text-sm">
                  {item.currentPickStock} 件 ÷ {item.avgDailySales} = {item.daysOfSupply} 天
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  一层可用库存 ÷ 7日均销，数值越小优先级越高。
                </p>
              </div>

              <div className="bg-white p-3 rounded-lg border border-blue-100">
                <span className="text-slate-400 text-[11px] block mb-1">
                  3. 优先级匹配结果
                </span>
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-mono ${
                      item.priority === 'P0'
                        ? 'bg-red-100 text-red-700'
                        : item.priority === 'P1'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {item.priority}
                  </span>
                  <span className="text-xs">{item.priorityReason}</span>
                </div>
              </div>

              <div className="bg-white p-3 rounded-lg border border-blue-100">
                <span className="text-slate-400 text-[11px] block mb-1">
                  4. 建议补货量确定
                </span>
                <div className="font-mono font-bold text-blue-700 text-sm">
                  ceil({item.avgDailySales} × {item.config.replenishCoefficient}) ={' '}
                  {item.suggestedReplenishQty} {item.unit}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  目标补足7~14天拣选量，受一层最大容量 {item.config.maxPickShelfCapacity} 保护。
                </p>
              </div>
            </div>
          </div>

          {/* 3. Multi-tier Reserve Locations Status (同架垂直备货溯源) */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <h4 className="font-bold text-slate-800 text-xs sm:text-sm mb-3 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>备货位梯次匹配明细 (优先二层备货调拨，不足再取三层)</span>
            </h4>

            <div className="space-y-2 text-xs">
              {item.reserveLocations.map((res) => {
                const isSelectedSource =
                  item.recommendedSourceLocation?.locationCode === res.locationCode;

                return (
                  <div
                    key={res.locationCode}
                    className={`p-3 rounded-lg border flex items-center justify-between transition-all ${
                      isSelectedSource
                        ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-400'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                        {res.level}F
                      </div>
                      <div>
                        <div className="flex items-center gap-2 font-mono font-bold text-slate-800">
                          <span>{res.locationCode}</span>
                          {res.isSameRack ? (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-normal">
                              🎯 同架垂直
                            </span>
                          ) : (
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-normal">
                              跨架位
                            </span>
                          )}
                          {isSelectedSource && (
                            <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded font-bold">
                              首选源位
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          批次: <span className="font-mono">{res.batchNo}</span> · 生产日:{' '}
                          {res.productionDate}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] text-slate-400">可用库存</div>
                      <div className="font-mono font-bold text-base text-slate-800">
                        {res.availableStock} {item.unit}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-medium cursor-pointer"
          >
            关闭
          </button>
          <button
            onClick={() => {
              onManualDispatch([item.id]);
              onClose();
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
            <span>立即下发此补货任务</span>
          </button>
        </div>
      </div>
    </div>
  );
};
