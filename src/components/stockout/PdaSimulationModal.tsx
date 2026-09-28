import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Scan,
  AlertOctagon,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Package,
  Layers,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { StockoutAlertItem, StockoutOrder } from '../../types/stockoutAlert';

interface PdaSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: StockoutAlertItem[];
  orderPool: StockoutOrder[];
  onReportPdaStockout: (sku: string, location: string, reportedWave: string) => void;
  onInterceptPackOrder: (orderNo: string) => { intercepted: boolean; order?: StockoutOrder };
}

export const PdaSimulationModal: React.FC<PdaSimulationModalProps> = ({
  isOpen,
  onClose,
  alerts,
  orderPool,
  onReportPdaStockout,
  onInterceptPackOrder,
}) => {
  const [activeTab, setActiveTab] = useState<'pda_report' | 'pack_intercept'>('pda_report');

  // PDA Report Form State
  const [selectedSku, setSelectedSku] = useState(alerts[0]?.sku || 'SKU-10029');
  const [locationCode, setLocationCode] = useState('HH1A01A1');
  const [waveId, setWaveId] = useState('WAVE-20260923-08');
  const [reportSuccessMessage, setReportSuccessMessage] = useState<string | null>(null);

  // Packing Intercept Scan State
  const [scanOrderInput, setScanOrderInput] = useState('');
  const [scanResult, setScanResult] = useState<{
    intercepted: boolean;
    order?: StockoutOrder;
    timestamp?: string;
  } | null>(null);

  if (!isOpen) return null;

  const handlePdaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onReportPdaStockout(selectedSku, locationCode, waveId);
    setReportSuccessMessage(
      `PDA 上报成功！已锁定 SKU [${selectedSku}]。系统已自动将波次 [${waveId}] 中涉及该 SKU 的受阻订单剥离并转入「缺货订单池」，波次解除卡死；同时已自动生成 P0 级加急补货任务！`
    );
    setTimeout(() => {
      setReportSuccessMessage(null);
    }, 6000);
  };

  const handleScanPack = (orderNoToScan: string) => {
    const res = onInterceptPackOrder(orderNoToScan);
    setScanResult({
      ...res,
      timestamp: new Date().toLocaleTimeString(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-in fade-in duration-150 my-8">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">现场作业联动模拟沙盘</h3>
              <p className="text-xs text-slate-400">
                拣货 PDA 一键缺货上报（波次解卡）与 打包扫码防错拦截
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="bg-slate-100 p-1.5 border-b border-slate-200 flex">
          <button
            onClick={() => {
              setActiveTab('pda_report');
              setScanResult(null);
            }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'pda_report'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>拣货 PDA 一键上报 P0 缺货</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('pack_intercept');
              setReportSuccessMessage(null);
            }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'pack_intercept'
                ? 'bg-white text-red-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Scan className="w-4 h-4" />
            <span>打包扫码拦截防错工作台</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 text-xs text-slate-700">
          {activeTab === 'pda_report' && (
            <div className="space-y-4">
              {/* PDA Mechanism explanation */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 flex items-start gap-3">
                <div className="p-1.5 rounded bg-blue-100 text-blue-700 mt-0.5">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-blue-900 text-xs">波次防卡死联动逻辑说明</h4>
                  <p className="text-slate-600 leading-relaxed text-[11px] mt-0.5">
                    拣货员发现拣货位无实物且备货不足时，在 PDA 一键点选「上报缺货」。
                    系统自动将该波次内包含该 SKU 的订单移出当前波次，进入<strong>「缺货订单池」</strong>，使剩余正常订单不受阻塞继续流转；同时自动生成最高优先级 <strong>P0 补货任务</strong>。
                  </p>
                </div>
              </div>

              {reportSuccessMessage && (
                <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-3.5 rounded-xl flex items-start gap-2.5 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-xs leading-relaxed">{reportSuccessMessage}</p>
                </div>
              )}

              {/* Simulation Form */}
              <form onSubmit={handlePdaSubmit} className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">
                      选择上报缺货 SKU
                    </label>
                    <select
                      value={selectedSku}
                      onChange={(e) => setSelectedSku(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                    >
                      {alerts.map((a) => (
                        <option key={a.id} value={a.sku}>
                          {a.sku} - {a.productName.slice(0, 16)}...
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">
                      拣货位编码 (一层)
                    </label>
                    <input
                      type="text"
                      value={locationCode}
                      onChange={(e) => setLocationCode(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="HH1A01A1"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    受阻来源波次编号
                  </label>
                  <input
                    type="text"
                    value={waveId}
                    onChange={(e) => setWaveId(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="WAVE-20260923-08"
                    required
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <AlertOctagon className="w-4 h-4 text-white" />
                    <span>模拟 PDA 一键上报 P0 缺货（解卡波次并转入订单池）</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'pack_intercept' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-3">
                <div className="p-1.5 rounded bg-amber-100 text-amber-700 mt-0.5">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-amber-900 text-xs">打包防错校验机制说明</h4>
                  <p className="text-slate-600 leading-relaxed text-[11px] mt-0.5">
                    打包工作台扫码枪扫描订单条码时，实时校验该订单是否命中「缺货订单池」。若命中则强弹窗告警阻断打包，提醒作业人员送至暂存区，杜绝错装、漏装与无效翻找。
                  </p>
                </div>
              </div>

              {/* Scan Simulator Input */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                <label className="block text-slate-700 font-semibold">
                  模拟打包台扫码枪输入（输入或点选测试订单号）：
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Scan className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={scanOrderInput}
                      onChange={(e) => setScanOrderInput(e.target.value)}
                      placeholder="扫描订单号，如 SO-20260923-8821"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    onClick={() => handleScanPack(scanOrderInput)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs cursor-pointer transition-colors"
                  >
                    扫码校验
                  </button>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                  <span className="text-slate-400">快速测试订单:</span>
                  {orderPool.slice(0, 3).map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => {
                        setScanOrderInput(o.orderNo);
                        handleScanPack(o.orderNo);
                      }}
                      className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded hover:bg-red-100 font-mono cursor-pointer"
                    >
                      {o.orderNo} (池中缺货)
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const normalOrder = 'SO-20260923-9999';
                      setScanOrderInput(normalOrder);
                      handleScanPack(normalOrder);
                    }}
                    className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded hover:bg-emerald-100 font-mono cursor-pointer"
                  >
                    SO-20260923-9999 (正常订单)
                  </button>
                </div>
              </div>

              {/* Scan Intercept Pop-up / Result Banner */}
              {scanResult && (
                <div className="animate-in fade-in">
                  {scanResult.intercepted && scanResult.order ? (
                    <div className="bg-red-50 border-2 border-red-500 text-red-900 rounded-xl p-4 shadow-md space-y-2">
                      <div className="flex items-center gap-2 text-red-700 font-bold text-sm">
                        <AlertOctagon className="w-5 h-5 text-red-600 animate-pulse" />
                        <span>⚠️ 强行拦截：该订单处于「缺货订单池」，已暂缓打包！</span>
                      </div>
                      <div className="bg-white/80 rounded-lg p-3 border border-red-200 text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-500">命中订单:</span>
                          <span className="font-mono font-bold text-red-700">{scanResult.order.orderNo}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">缺货 SKU:</span>
                          <span className="font-mono font-bold text-slate-800">{scanResult.order.sku}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">商品名称:</span>
                          <span className="text-slate-700">{scanResult.order.productName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">缺口件数:</span>
                          <span className="font-bold text-red-600">{scanResult.order.gapQty} 件</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">原来源波次:</span>
                          <span className="font-mono text-slate-700">{scanResult.order.sourceWaveId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">建议存放区:</span>
                          <span className="font-bold text-amber-700">{scanResult.order.stagingLocation}</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-red-600 font-medium">
                        🛡️ 作业指令：请将已拣出的其它商品连同本周转箱移至【暂存异常格口】，待 P0 补货完成由系统通知重新打包！
                      </p>
                    </div>
                  ) : (
                    <div className="bg-emerald-50 border-2 border-emerald-500 text-emerald-900 rounded-xl p-4 shadow-sm space-y-1">
                      <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span>✅ 校验通过：未在缺货订单池，商品齐全可正常装箱发货！</span>
                      </div>
                      <p className="text-[11px] text-emerald-600">
                        订单号：{scanOrderInput} 校验完成（{scanResult.timestamp}），请复核重量并打印面单封箱。
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer"
          >
            完成测试
          </button>
        </div>
      </div>
    </div>
  );
};
