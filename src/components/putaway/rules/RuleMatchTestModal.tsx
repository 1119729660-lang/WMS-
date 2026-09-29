import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Package,
  Layers,
} from 'lucide-react';
import {
  InboundTypeRule,
  PutawaySKUCandidate,
  GlobalRuleParameters,
  CONDITION_LABEL_MAP,
  InboundRuleConditionKey,
  WarehouseLocation,
} from '../../../types/putaway';

interface RuleMatchTestModalProps {
  isOpen: boolean;
  rule: InboundTypeRule | null;
  candidates: PutawaySKUCandidate[];
  locations: WarehouseLocation[];
  globalParams: GlobalRuleParameters;
  onClose: () => void;
}

export const RuleMatchTestModal: React.FC<RuleMatchTestModalProps> = ({
  isOpen,
  rule,
  candidates,
  locations,
  globalParams,
  onClose,
}) => {
  const [selectedSkuId, setSelectedSkuId] = useState<string>(candidates[0]?.id || '');
  const [searchSku, setSearchSku] = useState('');

  const currentSku = useMemo(() => {
    return candidates.find((c) => c.id === selectedSkuId) || candidates[0];
  }, [candidates, selectedSkuId]);

  const filteredCandidates = useMemo(() => {
    if (!searchSku.trim()) return candidates;
    const q = searchSku.toLowerCase();
    return candidates.filter(
      (c) =>
        c.skuCode.toLowerCase().includes(q) ||
        c.skuName.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
    );
  }, [candidates, searchSku]);

  // Evaluate each condition
  const evaluationResults = useMemo(() => {
    if (!rule || !currentSku) return [];

    return rule.conditions.map((key) => {
      let isMatch = false;
      let detail = '';

      switch (key) {
        case 'IS_FIRST_INBOUND': {
          isMatch = !currentSku.hasHistoryInbound;
          detail = isMatch
            ? '系统无历史入库记录 (首入新SKU)'
            : `已有历史记录 (首入: ${currentSku.firstInboundDate || '正常在售'})`;
          break;
        }
        case 'IS_PICK_PLUS_BATCH_GTE_30D_SALES': {
          const sum = currentSku.currentPickStock + currentSku.inboundQty;
          isMatch = sum >= currentSku.total30dOutboundQty;
          detail = `(拣货存量 ${currentSku.currentPickStock} + 本批来货 ${currentSku.inboundQty} = ${sum}) ${
            isMatch ? '≥' : '<'
          } 30天出库 ${currentSku.total30dOutboundQty}`;
          break;
        }
        case 'IS_ACTIVE_DAYS_GT_20': {
          isMatch = currentSku.activeDays30d > globalParams.activeDays30dThreshold;
          detail = `30天动销天数 ${currentSku.activeDays30d} 天 ${isMatch ? '>' : '≤'} 阈值 ${globalParams.activeDays30dThreshold} 天`;
          break;
        }
        case 'IS_PICK_STOCK_GT_30D_SALES': {
          isMatch = currentSku.currentPickStock > currentSku.total30dOutboundQty;
          detail = `拣货存量 ${currentSku.currentPickStock} ${isMatch ? '>' : '≤'} 30天销量 ${currentSku.total30dOutboundQty}`;
          break;
        }
        case 'IS_BELOW_SAFETY_AND_SALES_GTE_THRESHOLD': {
          const avgDaily = Math.round((currentSku.total30dOutboundQty / 30) * 10) / 10;
          const isBelowSafety = currentSku.currentPickStock < avgDaily;
          const isGteSales = avgDaily >= globalParams.dailySalesThreshold;
          isMatch = isBelowSafety && isGteSales;
          detail = `拣货存量 ${currentSku.currentPickStock} ${isBelowSafety ? '<' : '≥'} 均销 ${avgDaily}件/日 (阈值 ≥ ${globalParams.dailySalesThreshold})`;
          break;
        }
        case 'IS_HIGH_VALUE': {
          const isPriceGte = (currentSku.price || 0) >= globalParams.highValuePriceThreshold && globalParams.highValuePriceThreshold > 0;
          const isWhitelisted = globalParams.highValueSkuWhitelist.includes(currentSku.skuCode);
          isMatch = isPriceGte || isWhitelisted;
          detail = `单价 ¥${currentSku.price || 0} ${isPriceGte ? '≥' : '<'} 门槛 ¥${globalParams.highValuePriceThreshold} ${
            isWhitelisted ? '(已在白名单内)' : ''
          }`;
          break;
        }
        case 'IS_BULK_OR_OVERWEIGHT': {
          const isWeight = (currentSku.weightKg || 0) >= globalParams.bulkWeightThresholdKg && globalParams.bulkWeightThresholdKg > 0;
          const isVol = (currentSku.volumeM3 || 0) >= globalParams.bulkVolumeThresholdM3 && globalParams.bulkVolumeThresholdM3 > 0;
          const isLen = (currentSku.lengthCm || 0) >= globalParams.bulkLengthThresholdCm && globalParams.bulkLengthThresholdCm > 0;
          const isPallet = currentSku.isFullPallet;
          isMatch = isWeight || isVol || isLen || isPallet;
          detail = `重量: ${currentSku.weightKg || 0}kg (门槛 ${globalParams.bulkWeightThresholdKg}kg), 边长: ${currentSku.lengthCm || 0}cm, 整托: ${isPallet ? '是' : '否'}`;
          break;
        }
        case 'IS_DEAD_STOCK_90D': {
          const isZeroSales = currentSku.activeDays30d === 0;
          const isDeadDays = (currentSku.deadStockDays || 0) >= globalParams.deadStockDaysThreshold;
          isMatch = isZeroSales || isDeadDays;
          detail = `零动销天数 ${currentSku.deadStockDays || 0} 天 ${isMatch ? '≥' : '<'} 滞销门槛 ${globalParams.deadStockDaysThreshold} 天`;
          break;
        }
        case 'IS_HOT_TOP_N_PERCENT': {
          const threshold = globalParams.hotSalesTopPercent / 100;
          isMatch = currentSku.salesRankPercent <= threshold;
          detail = `出库排名分位: 前 ${(currentSku.salesRankPercent * 100).toFixed(1)}% ${
            isMatch ? '≤' : '>'
          } TOP ${globalParams.hotSalesTopPercent}% 门槛`;
          break;
        }
      }

      return {
        key,
        label: CONDITION_LABEL_MAP[key],
        isMatch,
        detail,
      };
    });
  }, [rule, currentSku, globalParams]);

  // Overall match result
  const isRuleHit = useMemo(() => {
    if (!rule || evaluationResults.length === 0) return false;
    if (rule.conditionMode === 'AND') {
      return evaluationResults.every((r) => r.isMatch);
    } else {
      return evaluationResults.some((r) => r.isMatch);
    }
  }, [rule, evaluationResults]);

  if (!isOpen || !rule) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>规则命中测试</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold">
                  {rule.id}
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                模拟到货 SKU 检验判定条件匹配情况与推荐储位去向
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {/* Rule Information Banner */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm">{rule.name}</span>
                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                  优先级 #{rule.priority}
                </span>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  rule.conditionMode === 'AND'
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-purple-100 text-purple-800 border border-purple-200'
                }`}
              >
                组合模式: {rule.conditionMode === 'AND' ? '全部满足 (AND)' : '满足任一 (OR)'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-slate-600 pt-1 border-t border-slate-200">
              <div>
                推荐货区: <strong className="text-slate-800">{rule.recommendedZone}</strong>
              </div>
              <div>
                推荐货架策略: <strong className="text-slate-800">{rule.recommendedStrategy}</strong>
              </div>
              {rule.specifiedRacks && rule.specifiedRacks.length > 0 && (
                <div className="flex items-center gap-1 font-mono">
                  <span>指定货架:</span>
                  <span className="text-blue-700 font-bold">{rule.specifiedRacks.join(', ')}</span>
                </div>
              )}
            </div>

            {/* 执行策略与去向参数展示 */}
            {rule.executionPolicy && (
              <div className="pt-2 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div className="bg-white p-2 rounded-lg border border-slate-200 space-y-1">
                  <div className="text-slate-500 font-medium">推荐去向与直执机制:</div>
                  <div className="font-bold text-slate-800">
                    {rule.executionPolicy.recommendedTargetDirection}
                  </div>
                  <div className="flex flex-wrap gap-1 text-[10px]">
                    <span className={`px-1.5 py-0.2 rounded font-bold ${rule.executionPolicy.skipPickStockCheck ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-slate-100 text-slate-600'}`}>
                      {rule.executionPolicy.skipPickStockCheck ? '直执锁定(免拣货校验)' : '需校验一层'}
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-mono">
                      首批上限: {rule.executionPolicy.initialMaxStockLimit}件
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 font-semibold">
                      {rule.executionPolicy.routingStrategy}
                    </span>
                  </div>
                </div>

                <div className="bg-white p-2 rounded-lg border border-slate-200 space-y-1">
                  <div className="text-slate-500 font-medium">去向管控与超限保护:</div>
                  <div className="font-bold text-slate-800 truncate" title={rule.executionPolicy.storageDirection}>
                    {rule.executionPolicy.storageDirection}
                  </div>
                  <div className="flex flex-wrap gap-1 text-[10px]">
                    {rule.executionPolicy.prohibitPickLayer1 && (
                      <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 font-bold border border-amber-200">
                        严禁上架一层
                      </span>
                    )}
                    {rule.executionPolicy.capacityOverflowProtection && (
                      <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                        满仓强制转二三层
                      </span>
                    )}
                    <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-mono">
                      安全系数: {rule.executionPolicy.safetyStockCoeff}x 均销
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Test SKU Selector */}
          <div className="space-y-2">
            <label className="font-bold text-slate-800 flex items-center justify-between">
              <span>选择用于测试的到货 SKU:</span>
              <span className="text-slate-400 font-normal">共 {candidates.length} 项可选</span>
            </label>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="搜索 SKU 编码或名称..."
                  value={searchSku}
                  onChange={(e) => setSearchSku(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <select
                value={selectedSkuId}
                onChange={(e) => setSelectedSkuId(e.target.value)}
                className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 font-bold text-xs text-slate-800 max-w-[260px] truncate"
              >
                {filteredCandidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    [{c.skuCode}] {c.skuName}
                  </option>
                ))}
              </select>
            </div>

            {/* Current SKU Details Pill */}
            {currentSku && (
              <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-100 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-slate-900">{currentSku.skuName}</span>
                  <span className="font-mono text-slate-500">({currentSku.skuCode})</span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-600 font-mono">
                  <span>到货: <strong className="text-slate-900">{currentSku.inboundQty}</strong>{currentSku.unit}</span>
                  <span>拣货存量: <strong className="text-slate-900">{currentSku.currentPickStock}</strong></span>
                  <span>30天销量: <strong className="text-slate-900">{currentSku.total30dOutboundQty}</strong></span>
                  <span>动销天数: <strong className="text-slate-900">{currentSku.activeDays30d}天</strong></span>
                </div>
              </div>
            )}
          </div>

          {/* Condition Evaluation Breakdown Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between font-bold text-slate-800">
              <span>已选条件逐项校验清单 ({rule.conditions.length} 项):</span>
              <span className="text-[11px] text-slate-500 font-normal">
                {rule.conditionMode === 'AND' ? '需全部通过' : '任一通过即命中'}
              </span>
            </div>

            <div className="space-y-2">
              {evaluationResults.map((item, idx) => (
                <div
                  key={item.key}
                  className={`p-3 rounded-xl border flex items-start gap-3 transition-colors ${
                    item.isMatch
                      ? 'bg-emerald-50/60 border-emerald-300 text-emerald-950'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="mt-0.5">
                    {item.isMatch ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">{item.label}</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
                          item.isMatch
                            ? 'bg-emerald-200/60 text-emerald-800'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {item.isMatch ? '✓ 满足条件' : '✗ 未达成'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 font-mono">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Overall Match Result Banner */}
          <div
            className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs ${
              isRuleHit
                ? 'bg-emerald-600 text-white border-emerald-500'
                : 'bg-amber-50 text-amber-950 border-amber-300'
            }`}
          >
            <div>
              <div className="font-bold text-sm flex items-center gap-2">
                {isRuleHit ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-white" />
                    <span>判定结果：成功命中该上架类型规则！</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-amber-600" />
                    <span>判定结果：未命中该规则</span>
                  </>
                )}
              </div>
              <p className={`text-xs mt-1 ${isRuleHit ? 'text-emerald-100' : 'text-amber-800'}`}>
                {isRuleHit
                  ? `SKU [${currentSku.skuCode}] 符合规则设定，推荐上架目标货区【${rule.recommendedZone}】，执行货架策略【${rule.recommendedStrategy}】。`
                  : `条件组合模式为【${rule.conditionMode === 'AND' ? '全部满足' : '满足任一'}】，当前条件未达成。`}
              </p>
            </div>

            {isRuleHit && (
              <div className="bg-white/10 px-3.5 py-2 rounded-xl border border-white/20 text-right shrink-0">
                <div className="text-[10px] text-emerald-200">推荐目标去向</div>
                <div className="font-bold text-xs text-white">
                  {rule.recommendedZone} · {rule.recommendedStrategy}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            关闭测试
          </button>
        </div>
      </div>
    </div>
  );
};
