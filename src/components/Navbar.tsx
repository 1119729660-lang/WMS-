import React from 'react';
import {
  Layers,
  SlidersHorizontal,
  Zap,
  Boxes,
  AlertTriangle,
  ClipboardList,
  Activity,
  Timer,
} from 'lucide-react';
import { WarehouseOption } from '../types/replenishment';

interface NavbarProps {
  warehouses: WarehouseOption[];
  selectedWarehouseId: string;
  onSelectWarehouse: (id: string) => void;
  systemPhase: 'phase1' | 'phase2';
  onTogglePhase: (phase: 'phase1' | 'phase2') => void;
  onOpenPhase1Export: () => void;
  onOpenRuleConfig: () => void;
  onRefreshData: () => void;
  onTriggerSimulateStockout: () => void;
  p0Count: number;
  currentMenu:
    | 'replenishment'
    | 'monitoring'
    | 'sla'
    | 'task_management'
    | 'putaway'
    | 'location'
    | 'stockout';
  onSelectMenu: (
    menu:
      | 'replenishment'
      | 'monitoring'
      | 'sla'
      | 'task_management'
      | 'putaway'
      | 'location'
      | 'stockout'
  ) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  warehouses,
  selectedWarehouseId,
  onSelectWarehouse,
  systemPhase,
  onTogglePhase,
  onOpenPhase1Export,
  onOpenRuleConfig,
  onRefreshData,
  onTriggerSimulateStockout,
  p0Count,
  currentMenu,
  onSelectMenu,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & Brand & Main Menu Nav */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-bold border border-blue-400/30">
              <Layers className="w-5 h-5 text-blue-100" />
            </div>
            <div>
              <h1 className="font-bold text-base sm:text-lg tracking-tight text-slate-100">
                WMS 仓储调度中心
              </h1>
            </div>
          </div>

          {/* Top-Level Navigation Menu Tabs */}
          <nav className="hidden md:flex items-center gap-1.5 bg-slate-800/90 p-1 rounded-xl border border-slate-700/80">
            <button
              onClick={() => onSelectMenu('replenishment')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                currentMenu === 'replenishment'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>拣货补货看板</span>
              {p0Count > 0 && (
                <span className="w-2 h-2 rounded-full bg-red-500 inline-block animate-ping"></span>
              )}
            </button>

            <button
              onClick={() => onSelectMenu('monitoring')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                currentMenu === 'monitoring'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/60'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>补货监控看板</span>
            </button>

            <button
              onClick={() => onSelectMenu('sla')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                currentMenu === 'sla'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/60'
              }`}
            >
              <Timer className="w-3.5 h-3.5 text-emerald-400" />
              <span>SLA 时效履约</span>
            </button>

            <button
              onClick={() => onSelectMenu('task_management')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                currentMenu === 'task_management'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/60'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5 text-indigo-400" />
              <span>补货任务管理</span>
            </button>

            <button
              onClick={() => onSelectMenu('location')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                currentMenu === 'location'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/60'
              }`}
            >
              <Boxes className="w-3.5 h-3.5 text-emerald-400" />
              <span>库位管理</span>
            </button>

            <button
              onClick={() => onSelectMenu('stockout')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                currentMenu === 'stockout'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/60'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>缺货预警</span>
              <span className="w-2 h-2 rounded-full bg-red-400 inline-block animate-pulse"></span>
            </button>

            <button
              onClick={() => onSelectMenu('putaway')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                currentMenu === 'putaway'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/60'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>上架策略配置</span>
            </button>
          </nav>
        </div>

        {/* Middle / Right: Contextual Actions */}
        <div className="flex items-center gap-2.5">
          {/* Replenishment specific controls */}
          {currentMenu === 'replenishment' && (
            <>
              {/* Config */}
              <button
                onClick={onOpenRuleConfig}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                title="补货规则与参数设置"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Quick Tab Switcher for mobile */}
          <div className="md:hidden flex items-center bg-slate-800 p-1 rounded-lg border border-slate-700">
            <button
              onClick={() => onSelectMenu('replenishment')}
              className={`p-1 rounded ${
                currentMenu === 'replenishment' ? 'bg-blue-600 text-white' : 'text-slate-400'
              }`}
            >
              <Layers className="w-4 h-4" />
            </button>
            <button
              onClick={() => onSelectMenu('monitoring')}
              className={`p-1 rounded ${
                currentMenu === 'monitoring' ? 'bg-blue-600 text-white' : 'text-slate-400'
              }`}
            >
              <Activity className="w-4 h-4 text-cyan-400" />
            </button>
            <button
              onClick={() => onSelectMenu('sla')}
              className={`p-1 rounded ${
                currentMenu === 'sla' ? 'bg-blue-600 text-white' : 'text-slate-400'
              }`}
            >
              <Timer className="w-4 h-4 text-emerald-400" />
            </button>
            <button
              onClick={() => onSelectMenu('task_management')}
              className={`p-1 rounded ${
                currentMenu === 'task_management' ? 'bg-blue-600 text-white' : 'text-slate-400'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
            </button>
            <button
              onClick={() => onSelectMenu('location')}
              className={`p-1 rounded ${
                currentMenu === 'location' ? 'bg-blue-600 text-white' : 'text-slate-400'
              }`}
            >
              <Boxes className="w-4 h-4" />
            </button>
            <button
              onClick={() => onSelectMenu('stockout')}
              className={`p-1 rounded ${
                currentMenu === 'stockout' ? 'bg-red-600 text-white' : 'text-slate-400'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </button>
            <button
              onClick={() => onSelectMenu('putaway')}
              className={`p-1 rounded ${
                currentMenu === 'putaway' ? 'bg-blue-600 text-white' : 'text-slate-400'
              }`}
            >
              <Zap className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
