import React, { useState } from 'react';
import {
  X,
  Settings2,
  Clock,
  AlertTriangle,
  RefreshCw,
  Target,
  CheckCircle2,
} from 'lucide-react';
import {
  MonitoringConfig,
  StockoutCalculationMethod,
} from '../../types/monitoring';

interface MonitoringConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: MonitoringConfig;
  onSaveConfig: (updated: MonitoringConfig) => void;
}

export const MonitoringConfigModal: React.FC<MonitoringConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [timelinessPresetHours, setTimelinessPresetHours] = useState(
    config.timelinessPresetHours
  );
  const [stockoutMethod, setStockoutMethod] = useState<StockoutCalculationMethod>(
    config.stockoutMethod
  );
  const [refreshIntervalSeconds, setRefreshIntervalSeconds] = useState(
    config.refreshIntervalSeconds
  );
  const [targetTimelinessRate, setTargetTimelinessRate] = useState(
    config.targetTimelinessRate
  );
  const [targetEfficiencyPiecesPerHour, setTargetEfficiencyPiecesPerHour] =
    useState(config.targetEfficiencyPiecesPerHour);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveConfig({
      ...config,
      timelinessPresetHours,
      stockoutMethod,
      refreshIntervalSeconds,
      targetTimelinessRate,
      targetEfficiencyPiecesPerHour,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 text-xs">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                监控看板指标口径与预设阈值设置
              </h3>
              <p className="text-[11px] text-slate-400">
                支持自定义各核心考核指标计算口径、基准线与自动刷新频率
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. 补货及时率预设时长 */}
        <div className="space-y-2">
          <label className="font-bold text-slate-800 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>补货及时率预设考核时长 (默认 2 小时):</span>
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((hours) => (
              <button
                key={hours}
                type="button"
                onClick={() => setTimelinessPresetHours(hours)}
                className={`py-2 rounded-xl border text-center font-mono font-bold transition-all cursor-pointer ${
                  timelinessPresetHours === hours
                    ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {hours} 小时
              </button>
            ))}
          </div>
          <p className="text-[11px] text-slate-500">
            公式：{timelinessPresetHours} 小时内完成补货任务数 ÷ 应完成补货任务总数 × 100%
          </p>
        </div>

        {/* 2. 缺货率计算口径配置 */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <label className="font-bold text-slate-800 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>缺货率生效口径配置:</span>
          </label>
          <div className="space-y-2">
            <label
              onClick={() => setStockoutMethod('picking_point_reports')}
              className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                stockoutMethod === 'picking_point_reports'
                  ? 'bg-amber-50 border-amber-500 ring-1 ring-amber-500'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="stockout_method"
                checked={stockoutMethod === 'picking_point_reports'}
                onChange={() => setStockoutMethod('picking_point_reports')}
                className="mt-0.5 text-amber-600 focus:ring-amber-500"
              />
              <div>
                <div className="font-bold text-slate-800">
                  口径 ①：拣货点缺货上报次数 ÷ 拣货总次数 × 100% (默认)
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  反映拣货员现场每次下架作业遭遇拣位空仓的频次概率，紧密联动拣货现场实况。
                </p>
              </div>
            </label>

            <label
              onClick={() => setStockoutMethod('sku_ratio')}
              className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                stockoutMethod === 'sku_ratio'
                  ? 'bg-amber-50 border-amber-500 ring-1 ring-amber-500'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="stockout_method"
                checked={stockoutMethod === 'sku_ratio'}
                onChange={() => setStockoutMethod('sku_ratio')}
                className="mt-0.5 text-amber-600 focus:ring-amber-500"
              />
              <div>
                <div className="font-bold text-slate-800">
                  口径 ②：缺货 SKU 数 ÷ 波次 SKU 总数 × 100%
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  反映当前波次所依赖的物料品类中受缺料影响的品类宽度与波次交付受损面。
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* 3. 自动刷新频率 */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <label className="font-bold text-slate-800 flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
            <span>看板数据自动刷新间隔 (默认 5 分钟):</span>
          </label>
          <div className="grid grid-cols-5 gap-1.5">
            {[
              { label: '1 分钟', val: 60 },
              { label: '3 分钟', val: 180 },
              { label: '5 分钟', val: 300 },
              { label: '10 分钟', val: 600 },
              { label: '关闭', val: 0 },
            ].map((item) => (
              <button
                key={item.val}
                type="button"
                onClick={() => setRefreshIntervalSeconds(item.val)}
                className={`py-1.5 rounded-xl border text-center font-bold text-[11px] transition-all cursor-pointer ${
                  refreshIntervalSeconds === item.val
                    ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Target Benchmarks */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label className="text-slate-600 font-medium block">
              及时率考核基准线 (%):
            </label>
            <input
              type="number"
              step="0.5"
              min="80"
              max="100"
              value={targetTimelinessRate}
              onChange={(e) =>
                setTargetTimelinessRate(parseFloat(e.target.value) || 95)
              }
              className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-800"
            />
          </div>
          <div>
            <label className="text-slate-600 font-medium block">
              补货人效基准线 (件/小时):
            </label>
            <input
              type="number"
              step="5"
              min="50"
              max="300"
              value={targetEfficiencyPiecesPerHour}
              onChange={(e) =>
                setTargetEfficiencyPiecesPerHour(
                  parseInt(e.target.value) || 120
                )
              }
              className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-800"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-slate-500 hover:bg-slate-100 rounded-lg font-medium cursor-pointer"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>保存配置并生效</span>
          </button>
        </div>
      </div>
    </div>
  );
};
