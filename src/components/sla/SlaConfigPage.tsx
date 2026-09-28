import React, { useState } from 'react';
import {
  Settings,
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sliders,
  Layers,
  Save,
  HelpCircle,
  FileCheck,
} from 'lucide-react';
import {
  SlaSystemConfig,
  SlaCalculationMode,
  SlaNodeId,
} from '../../types/sla';
import { DEFAULT_SLA_CONFIG } from '../../data/mockSlaData';

interface SlaConfigPageProps {
  currentConfig: SlaSystemConfig;
  onSaveConfig: (newConfig: SlaSystemConfig) => void;
  onBackToDashboard: () => void;
}

export const SlaConfigPage: React.FC<SlaConfigPageProps> = ({
  currentConfig,
  onSaveConfig,
  onBackToDashboard,
}) => {
  const [calculationMode, setCalculationMode] = useState<SlaCalculationMode>(
    currentConfig.calculationMode
  );
  const [targetPassRate, setTargetPassRate] = useState<number>(
    currentConfig.targetPassRate
  );

  // 4 节点阈值状态 (单位: 分钟)
  const [inboundRegisterMin, setInboundRegisterMin] = useState<number>(
    currentConfig.nodes.inbound_register.currentThresholdMinutes
  );
  const [outboundRegisterMin, setOutboundRegisterMin] = useState<number>(
    currentConfig.nodes.outbound_register.currentThresholdMinutes
  );
  const [inboundPutawayMin, setInboundPutawayMin] = useState<number>(
    currentConfig.nodes.inbound_putaway.currentThresholdMinutes
  );
  const [outboundPrepareMin, setOutboundPrepareMin] = useState<number>(
    currentConfig.nodes.outbound_prepare.currentThresholdMinutes
  );

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleResetDefaults = () => {
    setCalculationMode(DEFAULT_SLA_CONFIG.calculationMode);
    setTargetPassRate(DEFAULT_SLA_CONFIG.targetPassRate);
    setInboundRegisterMin(DEFAULT_SLA_CONFIG.nodes.inbound_register.defaultThresholdMinutes);
    setOutboundRegisterMin(DEFAULT_SLA_CONFIG.nodes.outbound_register.defaultThresholdMinutes);
    setInboundPutawayMin(DEFAULT_SLA_CONFIG.nodes.inbound_putaway.defaultThresholdMinutes);
    setOutboundPrepareMin(DEFAULT_SLA_CONFIG.nodes.outbound_prepare.defaultThresholdMinutes);
  };

  const handleSave = () => {
    const updatedNodes = {
      ...currentConfig.nodes,
      inbound_register: {
        ...currentConfig.nodes.inbound_register,
        currentThresholdMinutes: inboundRegisterMin,
        thresholdDisplay:
          inboundRegisterMin >= 60
            ? `${(inboundRegisterMin / 60).toFixed(1).replace('.0', '')}小时 (${inboundRegisterMin}m)`
            : `${inboundRegisterMin}分钟`,
      },
      outbound_register: {
        ...currentConfig.nodes.outbound_register,
        currentThresholdMinutes: outboundRegisterMin,
        thresholdDisplay: `${outboundRegisterMin}分钟`,
      },
      inbound_putaway: {
        ...currentConfig.nodes.inbound_putaway,
        currentThresholdMinutes: inboundPutawayMin,
        thresholdDisplay:
          inboundPutawayMin >= 60
            ? `${(inboundPutawayMin / 60).toFixed(1).replace('.0', '')}小时`
            : `${inboundPutawayMin}分钟`,
      },
      outbound_prepare: {
        ...currentConfig.nodes.outbound_prepare,
        currentThresholdMinutes: outboundPrepareMin,
        thresholdDisplay:
          outboundPrepareMin >= 60
            ? `${(outboundPrepareMin / 60).toFixed(1).replace('.0', '')}小时`
            : `${outboundPrepareMin}分钟`,
      },
    };

    const newConfig: SlaSystemConfig = {
      calculationMode,
      targetPassRate,
      nodes: updatedNodes,
      lastUpdated: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };

    onSaveConfig(newConfig);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onBackToDashboard();
    }, 1000);
  };

  return (
    <div className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6 animate-in fade-in duration-200">
      {/* Top Breadcrumb & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToDashboard}
            className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer shadow-xs"
            title="返回时效履约看板"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">
                SLA 时效履约独立配置中心
              </h2>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                系统级生效
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              自定义 4 个核心履约节点起终点时间戳、时效阈值、综合达标率计算公式与达标预警红线
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetDefaults}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>重置为系统默认值</span>
          </button>

          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>{savedSuccess ? '保存成功并返回...' : '保存并全局应用'}</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>配置已成功更新，系统正重新计算并同步至各仓库卡片与透视表...</span>
        </div>
      )}

      {/* 1. 综合达标率计算公式配置 */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Sliders className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-800">
            1. 综合 SLA 达标率计算公式与模式配置
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label
            onClick={() => setCalculationMode('arithmetic_mean')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
              calculationMode === 'arithmetic_mean'
                ? 'bg-blue-50/50 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                : 'bg-white border-slate-200 hover:bg-slate-50'
            }`}
          >
            <input
              type="radio"
              name="calc_mode"
              checked={calculationMode === 'arithmetic_mean'}
              onChange={() => setCalculationMode('arithmetic_mean')}
              className="mt-1 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <div className="font-bold text-slate-900 text-xs sm:text-sm">
                模式 A：4 节点算术平均值 (默认推荐)
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                综合达标率 = (入库注册达标率 + 出库注册达标率 + 入库上架达标率 + 出库准备达标率) ÷ 4。
                各环节权重均等，强化短板环节的时效问责与整改。
              </p>
            </div>
          </label>

          <label
            onClick={() => setCalculationMode('weighted_average')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
              calculationMode === 'weighted_average'
                ? 'bg-blue-50/50 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                : 'bg-white border-slate-200 hover:bg-slate-50'
            }`}
          >
            <input
              type="radio"
              name="calc_mode"
              checked={calculationMode === 'weighted_average'}
              onChange={() => setCalculationMode('weighted_average')}
              className="mt-1 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <div className="font-bold text-slate-900 text-xs sm:text-sm">
                模式 B：订单量加权平均值
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                综合达标率 = 4 节点所有按时完成订单总人次 ÷ 4 节点应完成总人次 × 100%。
                按实际工单量自然加权，符合大吞吐量高频出库场景。
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* 2. 颜色预警基准线配置 */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-800">
            2. 颜色标识与达标率红线阈值配置
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center text-xs">
          <div className="sm:col-span-2 space-y-1.5">
            <label className="font-bold text-slate-800 block">
              综合达标率目标基准线 (%)：
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                step="0.5"
                min="80"
                max="100"
                value={targetPassRate}
                onChange={(e) =>
                  setTargetPassRate(parseFloat(e.target.value) || 95)
                }
                className="w-36 p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800 text-sm focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-slate-500 text-xs">
                (系统默认 95.0%，保留 1 位小数)
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              * 规则：综合达标率 ≥ {targetPassRate}% 显示绿色达成状态；&lt; {targetPassRate}% 自动标红预警。
            </p>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2 text-xs">
            <div className="font-bold text-slate-700">实时配色预览:</div>
            <div className="flex items-center justify-between">
              <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                ≥ {targetPassRate}% 绿色达标
              </span>
              <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                &lt; {targetPassRate}% 红色超时
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. 4 个核心履约节点 & 业务起终点阈值设置 */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-800">
              3. 4 个履约环节起终点时间戳与 SLA 阈值配置
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            单节点达标率 = 该节点按时完成订单数 ÷ 该节点应完成订单总数 × 100%
          </span>
        </div>

        <div className="space-y-4">
          {/* Node 1: 入库注册 */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/40 space-y-3 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center font-mono font-black">
                  01
                </span>
                <span className="font-bold text-slate-900 text-sm">
                  入库注册 (Inbound Register)
                </span>
                <span className="px-1.5 py-0.2 bg-sky-50 text-sky-700 rounded border border-sky-200 font-bold text-[10px]">
                  入库首节点
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">SLA 考核阈值:</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="10"
                    max="360"
                    value={inboundRegisterMin}
                    onChange={(e) =>
                      setInboundRegisterMin(parseInt(e.target.value) || 60)
                    }
                    className="w-20 p-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-800 text-center"
                  />
                  <span className="text-slate-500">分钟</span>
                </div>
                <span className="text-slate-400 text-[11px]">
                  (当前: {(inboundRegisterMin / 60).toFixed(1)}h)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/80 text-[11px]">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-400 block">起点业务时间戳:</span>
                <span className="font-bold text-slate-800 mt-0.5 block">
                  ozon 下发入库单时间
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-400 block">终点业务时间戳:</span>
                <span className="font-bold text-slate-800 mt-0.5 block">
                  待确认订单状态变更确认时间
                </span>
              </div>
            </div>
          </div>

          {/* Node 2: 出库注册 */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/40 space-y-3 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center font-mono font-black">
                  02
                </span>
                <span className="font-bold text-slate-900 text-sm">
                  出库注册 (Outbound Register)
                </span>
                <span className="px-1.5 py-0.2 bg-indigo-50 text-indigo-700 rounded border border-indigo-200 font-bold text-[10px]">
                  出库接单
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">SLA 考核阈值:</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="3"
                    max="120"
                    value={outboundRegisterMin}
                    onChange={(e) =>
                      setOutboundRegisterMin(parseInt(e.target.value) || 10)
                    }
                    className="w-20 p-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-800 text-center"
                  />
                  <span className="text-slate-500">分钟</span>
                </div>
                <span className="text-slate-400 text-[11px]">(默认 10min)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/80 text-[11px]">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-400 block">起点业务时间戳:</span>
                <span className="font-bold text-slate-800 mt-0.5 block">
                  订单下单状态由否变是
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-400 block">终点业务时间戳:</span>
                <span className="font-bold text-slate-800 mt-0.5 block">
                  全部订单添加时间
                </span>
              </div>
            </div>
          </div>

          {/* Node 3: 入库上架 */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/40 space-y-3 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-mono font-black">
                  03
                </span>
                <span className="font-bold text-slate-900 text-sm">
                  入库上架 (Inbound Putaway)
                </span>
                <span className="px-1.5 py-0.2 bg-teal-50 text-teal-700 rounded border border-teal-200 font-bold text-[10px]">
                  库内作业
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">SLA 考核阈值:</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="60"
                    max="2880"
                    step="60"
                    value={inboundPutawayMin}
                    onChange={(e) =>
                      setInboundPutawayMin(parseInt(e.target.value) || 1440)
                    }
                    className="w-24 p-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-800 text-center"
                  />
                  <span className="text-slate-500">分钟</span>
                </div>
                <span className="text-slate-400 text-[11px]">
                  ({(inboundPutawayMin / 60).toFixed(1)}小时)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/80 text-[11px]">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-400 block">起点业务时间戳:</span>
                <span className="font-bold text-slate-800 mt-0.5 block">
                  签收 80 节点时间
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-400 block">终点业务时间戳:</span>
                <span className="font-bold text-slate-800 mt-0.5 block">
                  上架 90 节点时间
                </span>
              </div>
            </div>
          </div>

          {/* Node 4: 出库准备 */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/40 space-y-3 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-mono font-black">
                  04
                </span>
                <span className="font-bold text-slate-900 text-sm">
                  出库准备 (Outbound Prepare)
                </span>
                <span className="px-1.5 py-0.2 bg-amber-50 text-amber-700 rounded border border-amber-200 font-bold text-[10px]">
                  拣复核出库
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">SLA 考核阈值:</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="60"
                    max="2880"
                    step="60"
                    value={outboundPrepareMin}
                    onChange={(e) =>
                      setOutboundPrepareMin(parseInt(e.target.value) || 1440)
                    }
                    className="w-24 p-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-800 text-center"
                  />
                  <span className="text-slate-500">分钟</span>
                </div>
                <span className="text-slate-400 text-[11px]">
                  ({(outboundPrepareMin / 60).toFixed(1)}小时)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/80 text-[11px]">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-400 block">起点业务时间戳:</span>
                <span className="font-bold text-slate-800 mt-0.5 block">
                  订单添加生成节点时间
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-400 block">终点业务时间戳:</span>
                <span className="font-bold text-slate-800 mt-0.5 block">
                  华磊收货 106 节点时间
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-end gap-3 pt-2 pb-6">
        <button
          onClick={onBackToDashboard}
          className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
        >
          取消返回
        </button>
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>确认保存并应用配置</span>
        </button>
      </div>
    </div>
  );
};
