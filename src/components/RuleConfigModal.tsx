import React, { useState } from 'react';
import {
  X,
  SlidersHorizontal,
  Check,
  RotateCcw,
  Sparkles,
  Info,
  ShieldCheck,
  Layers,
} from 'lucide-react';

interface RuleConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCoeff: number;
  onSaveDefaultCoeff: (coeff: number) => void;
  autoDeduplicationEnabled: boolean;
  onToggleAutoDeduplication: (enabled: boolean) => void;
}

export const RuleConfigModal: React.FC<RuleConfigModalProps> = ({
  isOpen,
  onClose,
  defaultCoeff,
  onSaveDefaultCoeff,
  autoDeduplicationEnabled,
  onToggleAutoDeduplication,
}) => {
  if (!isOpen) return null;

  const [coeff, setCoeff] = useState<number>(defaultCoeff);
  const [targetMinDays, setTargetMinDays] = useState<number>(7);
  const [targetMaxDays, setTargetMaxDays] = useState<number>(14);
  const [dedup, setDedup] = useState<boolean>(autoDeduplicationEnabled);
  const [promoThresholdMultiplier, setPromoThresholdMultiplier] = useState<number>(2.5);
  const [sameRackStrict, setSameRackStrict] = useState<boolean>(true);

  const handleSave = () => {
    onSaveDefaultCoeff(coeff);
    onToggleAutoDeduplication(dedup);
    onClose();
  };

  const handleReset = () => {
    setCoeff(1.0);
    setTargetMinDays(7);
    setTargetMaxDays(14);
    setDedup(true);
    setPromoThresholdMultiplier(2.5);
    setSameRackStrict(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                WMS 拣选补货策略与算法参数配置
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                实时生效 · 动态调优平衡补货频次与拣货位积压
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5 text-xs">
          {/* 1. 补货系数 */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <span>全局默认补货系数 (Coefficient)</span>
                <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-mono">
                  当前: {coeff}x
                </span>
              </label>
              <span className="text-[11px] text-slate-500 font-mono">默认 1.0</span>
            </div>
            <p className="text-slate-500 text-[11px]">
              补货量 = 近 7 日平均销量 × 补货系数，向上取整。建议取值 0.8 ~ 1.5。
            </p>
            <div className="flex items-center gap-3 pt-1">
              <input
                type="range"
                min="0.5"
                max="2.5"
                step="0.1"
                value={coeff}
                onChange={(e) => setCoeff(parseFloat(e.target.value))}
                className="flex-1 accent-blue-600 cursor-pointer"
              />
              <span className="font-mono font-bold text-sm text-slate-800 w-12 text-center bg-slate-100 py-1 rounded">
                {coeff}x
              </span>
            </div>
          </div>

          {/* 2. 目标支撑拣选天数区间 */}
          <div className="space-y-1.5 pt-3 border-t border-slate-100">
            <label className="font-bold text-slate-800 block">
              目标补足一层拣货位支撑天数区间
            </label>
            <p className="text-slate-500 text-[11px]">
              业务目标：补足一层拣货位可支撑 7~14 天拣货量，避免超容或频发断货。
            </p>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                <span className="text-slate-500">最低支撑天数:</span>
                <input
                  type="number"
                  value={targetMinDays}
                  onChange={(e) => setTargetMinDays(parseInt(e.target.value) || 7)}
                  className="w-14 bg-white border border-slate-300 rounded px-2 py-0.5 font-bold text-center text-xs"
                />
                <span className="text-slate-400">天</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                <span className="text-slate-500">最高上限天数:</span>
                <input
                  type="number"
                  value={targetMaxDays}
                  onChange={(e) => setTargetMaxDays(parseInt(e.target.value) || 14)}
                  className="w-14 bg-white border border-slate-300 rounded px-2 py-0.5 font-bold text-center text-xs"
                />
                <span className="text-slate-400">天</span>
              </div>
            </div>
          </div>

          {/* 3. 源库位推荐优先级 */}
          <div className="space-y-2 pt-3 border-t border-slate-100">
            <label className="font-bold text-slate-800 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>源库位优先级推荐策略</span>
            </label>
            <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-200 space-y-1.5 text-[11px] text-emerald-950">
              <div className="flex items-center gap-2">
                <span className="font-bold bg-emerald-200/80 px-1.5 py-0.5 rounded font-mono">1</span>
                <span>优先同架二层备货区垂直调拨（Zero-Horizontal 路径）</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold bg-emerald-200/80 px-1.5 py-0.5 rounded font-mono">2</span>
                <span>二层库存不足时，自动调度同架三层高位备货区补足</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold bg-emerald-200/80 px-1.5 py-0.5 rounded font-mono">3</span>
                <span>同架均无可用库存时，推荐同通道相邻货架二层备货区</span>
              </div>
            </div>
          </div>

          {/* 4. 二期自动化任务去重保护 */}
          <div className="space-y-2 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <label className="font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>二期引擎：任务自动去重保护</span>
                </label>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  当同一 SKU 已有「搬运移库中」或「待下发」任务时，自动拦截重复触发。
                </p>
              </div>
              <button
                onClick={() => setDedup(!dedup)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                  dedup ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    dedup ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="flex items-center gap-1 text-slate-500 hover:text-slate-800 text-xs cursor-pointer px-2 py-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>恢复默认设置</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-medium cursor-pointer"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Check className="w-3.5 h-3.5" />
              <span>保存策略并生效</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
