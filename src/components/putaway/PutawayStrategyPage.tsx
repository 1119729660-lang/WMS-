import React, { useState } from 'react';
import {
  SlidersHorizontal,
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

      {/* Strategy Engine Navigation Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveTab('SIMULATION')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'SIMULATION'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>自动上架策略引擎 (计算 & 推导)</span>
          </button>

          <button
            onClick={() => setActiveTab('CONFIG')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'CONFIG'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>上架类型规则配置 (新品/爆品/老品/滞销品)</span>
          </button>

          <button
            onClick={() => setActiveTab('LOCATIONS')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'LOCATIONS'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>库位动态标签管理</span>
          </button>

          <button
            onClick={() => setActiveTab('PDA')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'PDA'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>PDA 终端作业模拟</span>
          </button>
        </div>

        <div className="text-xs text-slate-400 px-2 font-mono hidden md:block">
          当前仓库: {warehouseName || '华东一号中心仓'}
        </div>
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
            onOpenConfig={() => setActiveTab('CONFIG')}
          />
        )}

        {activeTab === 'CONFIG' && (
          <PutawayRuleConfigTab
            config={config}
            locations={locations}
            candidates={candidates}
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
