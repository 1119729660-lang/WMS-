import React, { useState, useEffect } from 'react';
import { X, Sliders, CheckCircle2, RotateCcw, Info, Plus } from 'lucide-react';
import { GlobalRuleParameters, PutawaySKUCandidate } from '../../../types/putaway';
import { INITIAL_GLOBAL_RULE_PARAMETERS } from '../../../data/mockPutawayData';

interface GlobalRuleParamsModalProps {
  isOpen: boolean;
  params: GlobalRuleParameters;
  candidates: PutawaySKUCandidate[];
  onClose: () => void;
  onSave: (newParams: GlobalRuleParameters) => void;
}

export const GlobalRuleParamsModal: React.FC<GlobalRuleParamsModalProps> = ({
  isOpen,
  params,
  candidates,
  onClose,
  onSave,
}) => {
  const [localParams, setLocalParams] = useState<GlobalRuleParameters>(params);
  const [newWhitelistSku, setNewWhitelistSku] = useState('');

  useEffect(() => {
    if (isOpen) {
      setLocalParams(params);
      setNewWhitelistSku('');
    }
  }, [isOpen, params]);

  if (!isOpen) return null;

  const handleAddWhitelist = () => {
    if (!newWhitelistSku || localParams.highValueSkuWhitelist.includes(newWhitelistSku)) {
      return;
    }
    setLocalParams((prev) => ({
      ...prev,
      highValueSkuWhitelist: [...prev.highValueSkuWhitelist, newWhitelistSku],
    }));
    setNewWhitelistSku('');
  };

  const handleRemoveWhitelist = (skuCode: string) => {
    setLocalParams((prev) => ({
      ...prev,
      highValueSkuWhitelist: prev.highValueSkuWhitelist.filter((s) => s !== skuCode),
    }));
  };

  const handleReset = () => {
    setLocalParams(INITIAL_GLOBAL_RULE_PARAMETERS);
  };

  const handleSave = () => {
    onSave(localParams);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">规则判定全局参数配置</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                设置判定条件中所涉及的各项动销天数、高价值门槛、大件重量及滞销天数参数
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of parameters (列表式排布各项参数，全部为输入控件) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs divide-y divide-slate-100">
          {/* 1. 近 30 天动销天数阈值 */}
          <div className="pt-3 first:pt-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-0.5">
              <div className="font-bold text-slate-800 text-xs">近 30 天动销天数阈值</div>
              <p className="text-[11px] text-slate-400">
                对应条件：【是否近 30 天动销天数大于 20】（默认值 20 天）
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <input
                type="number"
                min="0"
                max="30"
                value={localParams.activeDays30dThreshold}
                onChange={(e) =>
                  setLocalParams((prev) => ({
                    ...prev,
                    activeDays30dThreshold: parseInt(e.target.value) || 0,
                  }))
                }
                className="w-24 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 font-bold font-mono text-center text-xs focus:bg-white"
              />
              <span className="text-slate-500 font-medium">天</span>
            </div>
          </div>

          {/* 2. 日均销量阈值 */}
          <div className="pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-0.5">
              <div className="font-bold text-slate-800 text-xs">日均销量阈值</div>
              <p className="text-[11px] text-slate-400">
                对应条件：【是否低于安全库存 & 日均销量≥阈值】（默认值 0 件/日）
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <input
                type="number"
                min="0"
                max="9999"
                value={localParams.dailySalesThreshold}
                onChange={(e) =>
                  setLocalParams((prev) => ({
                    ...prev,
                    dailySalesThreshold: parseInt(e.target.value) || 0,
                  }))
                }
                className="w-24 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 font-bold font-mono text-center text-xs focus:bg-white"
              />
              <span className="text-slate-500 font-medium">件/日</span>
            </div>
          </div>

          {/* 3. 高价值品 - 单价阈值 */}
          <div className="pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-0.5">
              <div className="font-bold text-slate-800 text-xs">高价值品 - 单价阈值</div>
              <p className="text-[11px] text-slate-400">
                用于判定【是否高价值品】，商品单价高于该值即算高价值品（默认值 0 元）
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <input
                type="number"
                min="0"
                step="10"
                value={localParams.highValuePriceThreshold}
                onChange={(e) =>
                  setLocalParams((prev) => ({
                    ...prev,
                    highValuePriceThreshold: parseFloat(e.target.value) || 0,
                  }))
                }
                className="w-24 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 font-bold font-mono text-center text-xs focus:bg-white"
              />
              <span className="text-slate-500 font-medium">元</span>
            </div>
          </div>

          {/* 4. 高价值品 - SKU 白名单 */}
          <div className="pt-3 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="space-y-0.5">
                <div className="font-bold text-slate-800 text-xs">高价值品 - SKU 白名单</div>
                <p className="text-[11px] text-slate-400">
                  指定无论价格高低均强制作为高价值品判定的 SKU 白名单
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <select
                  value={newWhitelistSku}
                  onChange={(e) => setNewWhitelistSku(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-700 max-w-[200px]"
                >
                  <option value="">-- 选择添加到白名单 --</option>
                  {candidates
                    .filter((c) => !localParams.highValueSkuWhitelist.includes(c.skuCode))
                    .map((c) => (
                      <option key={c.skuCode} value={c.skuCode}>
                        [{c.skuCode}] {c.skuName}
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddWhitelist}
                  disabled={!newWhitelistSku}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
                >
                  添加
                </button>
              </div>
            </div>

            {localParams.highValueSkuWhitelist.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                {localParams.highValueSkuWhitelist.map((skuCode) => (
                  <span
                    key={skuCode}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-800 text-[11px] font-mono font-bold"
                  >
                    <span>{skuCode}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveWhitelist(skuCode)}
                      className="text-slate-400 hover:text-red-500 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-[11px] text-slate-400 italic">暂无白名单 SKU</div>
            )}
          </div>

          {/* 5. 大件 / 超重 - 重量阈值 (kg) */}
          <div className="pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-0.5">
              <div className="font-bold text-slate-800 text-xs">大件 / 超重 - 重量阈值 (kg)</div>
              <p className="text-[11px] text-slate-400">
                用于判定【是否大件 / 超重】，单件毛重大于等于该值（默认值 0 kg）
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <input
                type="number"
                min="0"
                step="0.5"
                value={localParams.bulkWeightThresholdKg}
                onChange={(e) =>
                  setLocalParams((prev) => ({
                    ...prev,
                    bulkWeightThresholdKg: parseFloat(e.target.value) || 0,
                  }))
                }
                className="w-24 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 font-bold font-mono text-center text-xs focus:bg-white"
              />
              <span className="text-slate-500 font-medium">kg</span>
            </div>
          </div>

          {/* 6. 大件 / 超重 - 体积阈值 (m³) */}
          <div className="pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-0.5">
              <div className="font-bold text-slate-800 text-xs">大件 / 超重 - 体积阈值 (m³)</div>
              <p className="text-[11px] text-slate-400">
                用于判定【是否大件 / 超重】，单件体积大于等于该值（默认值 0 m³）
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <input
                type="number"
                min="0"
                step="0.01"
                value={localParams.bulkVolumeThresholdM3}
                onChange={(e) =>
                  setLocalParams((prev) => ({
                    ...prev,
                    bulkVolumeThresholdM3: parseFloat(e.target.value) || 0,
                  }))
                }
                className="w-24 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 font-bold font-mono text-center text-xs focus:bg-white"
              />
              <span className="text-slate-500 font-medium">m³</span>
            </div>
          </div>

          {/* 7. 大件 / 超重 - 单边长度阈值 (cm) */}
          <div className="pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-0.5">
              <div className="font-bold text-slate-800 text-xs">大件 / 超重 - 单边长度阈值 (cm)</div>
              <p className="text-[11px] text-slate-400">
                用于判定【是否大件 / 超重】，最长边大于等于该值（默认值 0 cm）
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <input
                type="number"
                min="0"
                step="1"
                value={localParams.bulkLengthThresholdCm}
                onChange={(e) =>
                  setLocalParams((prev) => ({
                    ...prev,
                    bulkLengthThresholdCm: parseFloat(e.target.value) || 0,
                  }))
                }
                className="w-24 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 font-bold font-mono text-center text-xs focus:bg-white"
              />
              <span className="text-slate-500 font-medium">cm</span>
            </div>
          </div>

          {/* 8. 滞销统计天数阈值 */}
          <div className="pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-0.5">
              <div className="font-bold text-slate-800 text-xs">滞销统计天数阈值</div>
              <p className="text-[11px] text-slate-400">
                对应条件：【是否滞销 90 天零动销】（默认值 90 天）
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <input
                type="number"
                min="30"
                max="365"
                value={localParams.deadStockDaysThreshold}
                onChange={(e) =>
                  setLocalParams((prev) => ({
                    ...prev,
                    deadStockDaysThreshold: parseInt(e.target.value) || 90,
                  }))
                }
                className="w-24 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 font-bold font-mono text-center text-xs focus:bg-white"
              />
              <span className="text-slate-500 font-medium">天</span>
            </div>
          </div>

          {/* 9. 热销 TOP 百分比 N (%) */}
          <div className="pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-0.5">
              <div className="font-bold text-slate-800 text-xs">热销 TOP 百分比 N (%)</div>
              <p className="text-[11px] text-slate-400">
                对应条件：【是否热销 TOP 前 N%】（默认值 20%）
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <input
                type="number"
                min="1"
                max="50"
                value={localParams.hotSalesTopPercent}
                onChange={(e) =>
                  setLocalParams((prev) => ({
                    ...prev,
                    hotSalesTopPercent: parseInt(e.target.value) || 20,
                  }))
                }
                className="w-24 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 font-bold font-mono text-center text-xs focus:bg-white"
              />
              <span className="text-slate-500 font-medium">%</span>
            </div>
          </div>
        </div>

        {/* Footer: 保存、取消 */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>重置为默认值</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
            >
              保存参数
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
