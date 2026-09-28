import React, { useState } from 'react';
import {
  Sparkles,
  Search,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  Boxes,
  Send,
  Tag,
  Flame,
  Archive,
  PackagePlus,
  Compass,
  Check,
} from 'lucide-react';
import {
  PutawaySKUCandidate,
  PutawayStrategyConfig,
  PutawayDecisionResult,
  WarehouseLocation,
} from '../../types/putaway';
import { evaluatePutawayStrategy } from '../../utils/putawayEngine';

interface PutawaySimulationTabProps {
  candidates: PutawaySKUCandidate[];
  config: PutawayStrategyConfig;
  locations: WarehouseLocation[];
  onSelectSkuForPda: (sku: PutawaySKUCandidate, result: PutawayDecisionResult) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'warning') => void;
}

export const PutawaySimulationTab: React.FC<PutawaySimulationTabProps> = ({
  candidates,
  config,
  locations,
  onSelectSkuForPda,
  onShowToast,
}) => {
  const [selectedSkuId, setSelectedSkuId] = useState<string>(candidates[0]?.id || '');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  // 预先为所有候选 SKU 试算
  const allResults = React.useMemo(() => {
    return candidates.map((item) => ({
      item,
      result: evaluatePutawayStrategy(item, config, locations),
    }));
  }, [candidates, config, locations]);

  // 过滤后的候选列表
  const filteredResults = React.useMemo(() => {
    return allResults.filter(({ item, result }) => {
      if (filterType !== 'ALL' && result.skuType !== filterType) {
        return false;
      }
      if (searchKeyword.trim()) {
        const q = searchKeyword.toLowerCase();
        return (
          item.skuName.toLowerCase().includes(q) ||
          item.skuCode.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allResults, filterType, searchKeyword]);

  // 当前选中的 SKU 及其决策结果
  const activePair =
    allResults.find((p) => p.item.id === selectedSkuId) || allResults[0];

  return (
    <div className="space-y-6">
      {/* Top Action & Stat Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <span>自动上架策略引擎：计算 & 业务规则</span>
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (activePair) {
                onSelectSkuForPda(activePair.item, activePair.result);
                onShowToast(`已将 [${activePair.item.skuName}] 上架任务推送至 PDA 模拟器！`, 'info');
              }
            }}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors shadow-sm cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>推送到 PDA 终端作业</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Candidate SKU Selector & Filter */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-800">到货待上架 SKU 选品池</span>
              <span className="text-[11px] font-mono text-slate-400">
                共 {filteredResults.length} / {allResults.length} 项
              </span>
            </div>

            {/* Quick Filter Buttons */}
            <div className="flex flex-wrap gap-1.5 text-[11px]">
              <button
                onClick={() => setFilterType('ALL')}
                className={`px-2 py-1 rounded-md font-semibold cursor-pointer ${
                  filterType === 'ALL'
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                全部
              </button>
              <button
                onClick={() => setFilterType('NEW')}
                className={`px-2 py-1 rounded-md font-semibold cursor-pointer ${
                  filterType === 'NEW'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                新品 (免验)
              </button>
              <button
                onClick={() => setFilterType('HOT')}
                className={`px-2 py-1 rounded-md font-semibold cursor-pointer ${
                  filterType === 'HOT'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                }`}
              >
                爆品 (免验)
              </button>
              <button
                onClick={() => setFilterType('REGULAR')}
                className={`px-2 py-1 rounded-md font-semibold cursor-pointer ${
                  filterType === 'REGULAR'
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
              >
                老品 (验库存)
              </button>
              <button
                onClick={() => setFilterType('SLOW')}
                className={`px-2 py-1 rounded-md font-semibold cursor-pointer ${
                  filterType === 'SLOW'
                    ? 'bg-purple-600 text-white'
                    : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                }`}
              >
                滞销品 (免验)
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="搜索 SKU、名称或品类..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* SKU Candidate List */}
            <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
              {filteredResults.map(({ item, result }) => {
                const isSelected = item.id === selectedSkuId;

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedSkuId(item.id)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-500 shadow-xs ring-1 ring-blue-400'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
                          result.skuType === 'NEW'
                            ? 'bg-emerald-100 text-emerald-800'
                            : result.skuType === 'HOT'
                            ? 'bg-amber-100 text-amber-800'
                            : result.skuType === 'SLOW'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {result.skuType === 'NEW'
                          ? '🌟 新品直决'
                          : result.skuType === 'HOT'
                          ? '🔥 爆品直决'
                          : result.skuType === 'SLOW'
                          ? '💤 滞销直决'
                          : '📦 老品校验'}
                      </span>
                    </div>

                    <div className="font-semibold text-slate-800 line-clamp-1">
                      {item.skuName}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center justify-between">
                      <span>{item.skuCode}</span>
                      <span className="text-slate-500 font-bold">
                        推储: {result.recommendedLocationCode}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Decision Trace & Location Recommendation */}
        <div className="lg:col-span-8 space-y-5">
          {activePair && (
            <>
              {/* Top Banner of Selected SKU */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded font-mono ${
                          activePair.result.skuType === 'NEW'
                            ? 'bg-emerald-600 text-white'
                            : activePair.result.skuType === 'HOT'
                            ? 'bg-amber-600 text-white'
                            : activePair.result.skuType === 'SLOW'
                            ? 'bg-purple-600 text-white'
                            : 'bg-blue-600 text-white'
                        }`}
                      >
                        {activePair.result.skuType === 'NEW'
                          ? '新品 (NEW)'
                          : activePair.result.skuType === 'HOT'
                          ? '爆品 / A类 (HOT)'
                          : activePair.result.skuType === 'SLOW'
                          ? '滞销品 / C类 (SLOW)'
                          : '老品 (REGULAR)'}
                      </span>
                      <h4 className="font-bold text-base text-slate-900">
                        {activePair.item.skuName}
                      </h4>
                    </div>
                    <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-3">
                      <span>编码: <strong className="font-mono text-slate-700">{activePair.item.skuCode}</strong></span>
                      <span>品类: <strong className="text-slate-700">{activePair.item.category}</strong></span>
                      <span>规格: <strong className="text-slate-700">{activePair.item.specification}</strong></span>
                      {activePair.item.isFullPallet && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                          整托大件
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 推荐储位决策卡 */}
                <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-xl font-black font-mono tracking-tight text-white flex items-center gap-2">
                      <span>{activePair.result.recommendedLocationCode}</span>
                      {activePair.result.isSameRackVertical && (
                        <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-normal flex items-center gap-1">
                          <span>🎯 同架垂直绑定</span>
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-300">
                      {activePair.result.recommendedZoneName} ·{' '}
                      {activePair.result.recommendedTargetType === 'PICK_LEVEL_1'
                        ? '一层拣货黄金位'
                        : activePair.result.recommendedTargetType === 'FLOOR_PALLET_ZONE'
                        ? '绿色地堆托盘位 (整托囤货)'
                        : activePair.result.recommendedTargetType === 'SLOW_MOVING_HIGH_BAY'
                        ? '高层滞销区 (3层及以上)'
                        : '同架二/三层备货位'}
                    </div>
                  </div>

                  <div className="text-xs sm:text-right bg-white/10 p-3 rounded-xl border border-white/10">
                    <div className="font-semibold text-slate-100">
                      {activePair.result.strategySummary}
                    </div>
                  </div>
                </div>

                {/* 30天均销与库存指标计算板 */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-400 text-[10px] block">30天动销天数</span>
                    <div className="font-mono font-bold text-slate-800 text-sm mt-0.5">
                      {activePair.item.activeDays30d} 天
                    </div>
                    <span className="text-[10px] text-slate-500">
                      排名: 前 {(activePair.item.salesRankPercent * 100).toFixed(0)}%
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-400 text-[10px] block">30天日常均销</span>
                    <div className="font-mono font-bold text-blue-700 text-sm mt-0.5">
                      {activePair.result.adjusted30dAvgDailySales} 件/日
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {activePair.result.promoExcludedDaysCount > 0
                        ? `已剔除 ${activePair.result.promoExcludedDaysCount} 个大促日`
                        : '无大促剔除'}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-400 text-[10px] block">拣货区库存阈值</span>
                    <div className="font-mono font-bold text-slate-800 text-sm mt-0.5">
                      {activePair.result.pickStockThreshold} 件
                    </div>
                    <span className="text-[10px] text-slate-500">
                      系数: {activePair.result.categoryThresholdCoeff}x ({activePair.item.category})
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-400 text-[10px] block">一层拣货位当前库存</span>
                    <div className="font-mono font-bold text-sm mt-0.5">
                      <span
                        className={
                          activePair.item.currentPickStock < activePair.result.pickStockThreshold
                            ? 'text-red-600'
                            : 'text-emerald-700'
                        }
                      >
                        {activePair.item.currentPickStock} 件
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {activePair.result.checkedPickStock
                        ? activePair.item.currentPickStock < activePair.result.pickStockThreshold
                          ? '低于阈值(需补)'
                          : '存量充裕(放高层)'
                        : '免验直决(忽略)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 决策推导全过程流水线日志 (Decision Trace Steps) */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-blue-600" />
                    <h4 className="font-bold text-sm text-slate-900">
                      上架决策推导全过程分析 (Decision Trace)
                    </h4>
                  </div>
                </div>

                <div className="space-y-3">
                  {activePair.result.decisionTraceSteps.map((step, idx) => (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-xl border transition-all ${
                        step.result
                          ? 'bg-slate-50 border-slate-300 ring-1 ring-slate-300'
                          : 'bg-white border-slate-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2 font-bold text-xs text-slate-800">
                          <span
                            className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] text-white ${
                              step.badgeColor === 'emerald'
                                ? 'bg-emerald-600'
                                : step.badgeColor === 'amber'
                                ? 'bg-amber-600'
                                : step.badgeColor === 'purple'
                                ? 'bg-purple-600'
                                : step.badgeColor === 'blue'
                                ? 'bg-blue-600'
                                : 'bg-slate-400'
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <span>{step.stepName}</span>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                            step.result
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {step.result ? '✅ 命中该阶段' : '⏭️ 未命中/跳过'}
                        </span>
                      </div>

                      <div className="text-[11px] font-mono text-slate-500 bg-white p-2 rounded border border-slate-200 mb-1">
                        判断规则: {step.condition}
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
