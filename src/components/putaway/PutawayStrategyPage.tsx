import React, { useState } from 'react';
import {
  SlidersHorizontal,
  Compass,
  Boxes,
  Smartphone,
  Sparkles,
  Flame,
  PackagePlus,
  ShieldCheck,
  Archive,
  Info,
} from 'lucide-react';
import {
  DEFAULT_PUTAWAY_CONFIG,
  MOCK_WAREHOUSE_LOCATIONS,
  MOCK_PUTAWAY_SKUS,
} from '../../data/mockPutawayData';
import {
  PutawayStrategyConfig,
  WarehouseLocation,
  PutawaySKUCandidate,
  PutawayDecisionResult,
} from '../../types/putaway';
import { evaluatePutawayStrategy } from '../../utils/putawayEngine';
import { PutawayRuleConfigTab } from './PutawayRuleConfigTab';
import { PutawaySimulationTab } from './PutawaySimulationTab';
import { LocationTagManagerTab } from './LocationTagManagerTab';
import { PdaPutawaySimulatorTab } from './PdaPutawaySimulatorTab';

interface PutawayStrategyPageProps {
  warehouseName: string;
}

export const PutawayStrategyPage: React.FC<PutawayStrategyPageProps> = ({
  warehouseName,
}) => {
  const [activeTab, setActiveTab] = useState<'CONFIG' | 'SIMULATION' | 'LOCATIONS' | 'PDA'>('SIMULATION');
  const [config, setConfig] = useState<PutawayStrategyConfig>(DEFAULT_PUTAWAY_CONFIG);
  const [locations, setLocations] = useState<WarehouseLocation[]>(MOCK_WAREHOUSE_LOCATIONS);
  const [candidates, setCandidates] = useState<PutawaySKUCandidate[]>(MOCK_PUTAWAY_SKUS);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'warning' } | null>(null);

  // Selected SKU for PDA testing
  const [pdaSku, setPdaSku] = useState<PutawaySKUCandidate>(MOCK_PUTAWAY_SKUS[0]);
  const [pdaDecision, setPdaDecision] = useState<PutawayDecisionResult>(() =>
    evaluatePutawayStrategy(MOCK_PUTAWAY_SKUS[0], DEFAULT_PUTAWAY_CONFIG, MOCK_WAREHOUSE_LOCATIONS)
  );

  const showToast = (text: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3800);
  };

  const handleSelectSkuForPda = (sku: PutawaySKUCandidate, result: PutawayDecisionResult) => {
    setPdaSku(sku);
    setPdaDecision(result);
    setActiveTab('PDA');
  };

  const handleCompletePutaway = (locationCode: string, qty: number) => {
    setLocations((prev) =>
      prev.map((loc) => {
        if (loc.locationCode === locationCode) {
          return {
            ...loc,
            currentStock: loc.currentStock + qty,
          };
        }
        return loc;
      })
    );
  };

  // 统计概览
  const candidateMetrics = React.useMemo(() => {
    let newCount = 0;
    let hotCount = 0;
    let regularCount = 0;
    let slowCount = 0;

    candidates.forEach((c) => {
      const res = evaluatePutawayStrategy(c, config, locations);
      if (res.skuType === 'NEW') newCount++;
      else if (res.skuType === 'HOT') hotCount++;
      else if (res.skuType === 'REGULAR') regularCount++;
      else if (res.skuType === 'SLOW') slowCount++;
    });

    return {
      total: candidates.length,
      newCount,
      hotCount,
      regularCount,
      slowCount,
    };
  }, [candidates, config, locations]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border text-xs font-semibold flex items-center gap-2 animate-fade-in ${
            toastMessage.type === 'success'
              ? 'bg-emerald-900 text-white border-emerald-700'
              : toastMessage.type === 'warning'
              ? 'bg-amber-900 text-white border-amber-700'
              : 'bg-slate-900 text-white border-slate-700'
          }`}
        >
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>仓储中台</span>
            <span>&gt;</span>
            <span>上架管理</span>
            <span>&gt;</span>
            <span className="text-slate-800 font-bold">上架策略配置</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              上架管理 · 上架策略配置中心
            </h1>
            <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-full font-mono font-bold">
              {warehouseName}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            基于 SKU 动销特性实施<strong>【新品 &rarr; 爆品 &rarr; 老品 &rarr; 滞销品】</strong>串行判定。新品/爆品/滞销品直决推荐储位，免验拣货区库存；仅老品才根据30天均销校验拣选存量。
          </p>
        </div>

        {/* Top 4 KPI mini cards */}
        <div className="grid grid-cols-4 gap-2 text-xs">
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs text-center">
            <span className="text-[10px] text-slate-400 block">新品直决</span>
            <span className="font-mono font-bold text-emerald-600 text-base">
              {candidateMetrics.newCount}
            </span>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs text-center">
            <span className="text-[10px] text-slate-400 block">爆品直决</span>
            <span className="font-mono font-bold text-amber-600 text-base">
              {candidateMetrics.hotCount}
            </span>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs text-center">
            <span className="text-[10px] text-slate-400 block">老品校验</span>
            <span className="font-mono font-bold text-blue-600 text-base">
              {candidateMetrics.regularCount}
            </span>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs text-center">
            <span className="text-[10px] text-slate-400 block">滞销直决</span>
            <span className="font-mono font-bold text-purple-600 text-base">
              {candidateMetrics.slowCount}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab('SIMULATION')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'SIMULATION'
              ? 'bg-blue-600 text-white shadow-sm font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>🧪 入库上架智能推荐试算台</span>
        </button>

        <button
          onClick={() => setActiveTab('CONFIG')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'CONFIG'
              ? 'bg-blue-600 text-white shadow-sm font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>⚙️ 上架策略与规则配置</span>
        </button>

        <button
          onClick={() => setActiveTab('LOCATIONS')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'LOCATIONS'
              ? 'bg-blue-600 text-white shadow-sm font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>🏷️ 库位标签与货架/地堆分区</span>
        </button>

        <button
          onClick={() => setActiveTab('PDA')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'PDA'
              ? 'bg-blue-600 text-white shadow-sm font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>📱 PDA 终端作业指导与防错演示</span>
        </button>
      </div>

      {/* Main Tab Views */}
      <div>
        {activeTab === 'SIMULATION' && (
          <PutawaySimulationTab
            candidates={candidates}
            config={config}
            locations={locations}
            onSelectSkuForPda={handleSelectSkuForPda}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'CONFIG' && (
          <PutawayRuleConfigTab
            config={config}
            onUpdateConfig={(newCfg) => setConfig(newCfg)}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'LOCATIONS' && (
          <LocationTagManagerTab
            locations={locations}
            onUpdateLocations={(newLocs) => setLocations(newLocs)}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'PDA' && (
          <PdaPutawaySimulatorTab
            sku={pdaSku}
            decisionResult={pdaDecision}
            locations={locations}
            onCompletePutaway={handleCompletePutaway}
            onShowToast={showToast}
          />
        )}
      </div>
    </div>
  );
};
