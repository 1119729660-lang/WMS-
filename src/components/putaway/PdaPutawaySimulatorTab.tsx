import React, { useState } from 'react';
import {
  Smartphone,
  Scan,
  CheckCircle2,
  AlertOctagon,
  AlertTriangle,
  RotateCcw,
  Boxes,
  Layers,
  ArrowRight,
  ShieldAlert,
  Zap,
  Check,
} from 'lucide-react';
import {
  PutawaySKUCandidate,
  PutawayDecisionResult,
  WarehouseLocation,
} from '../../types/putaway';
import { validatePdaPutawayScan } from '../../utils/putawayEngine';

interface PdaPutawaySimulatorTabProps {
  sku: PutawaySKUCandidate;
  decisionResult: PutawayDecisionResult;
  locations: WarehouseLocation[];
  onCompletePutaway: (locationCode: string, qty: number) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'warning') => void;
}

export const PdaPutawaySimulatorTab: React.FC<PdaPutawaySimulatorTabProps> = ({
  sku,
  decisionResult,
  locations,
  onCompletePutaway,
  onShowToast,
}) => {
  const [scannedCode, setScannedCode] = useState<string>('');
  const [scanAudit, setScanAudit] = useState<{
    isValid: boolean;
    alertType: 'SUCCESS' | 'WARNING' | 'ERROR';
    title: string;
    message: string;
  } | null>(null);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  const handleSimulateScan = (locationCode: string) => {
    setScannedCode(locationCode);
    const audit = validatePdaPutawayScan(locationCode, decisionResult, locations);
    setScanAudit(audit);

    if (audit.alertType === 'ERROR') {
      onShowToast(`🚨 PDA 防错警报: ${audit.title}`, 'warning');
    } else if (audit.alertType === 'SUCCESS') {
      onShowToast(`✅ 库位核验通过: ${locationCode}`, 'success');
    }
  };

  const handleConfirmPutaway = () => {
    if (!scanAudit || !scanAudit.isValid) {
      alert('请先扫描合规的储位条码后再确认上架！');
      return;
    }
    setIsCompleted(true);
    onCompletePutaway(scannedCode, sku.inboundQty);
    onShowToast(`🎉 上架任务成功执行！已将 ${sku.inboundQty} ${sku.unit} 存入库位 [${scannedCode}]`, 'success');
  };

  const handleResetOrder = () => {
    setScannedCode('');
    setScanAudit(null);
    setIsCompleted(false);
  };

  const isFloor = decisionResult.recommendedTargetType === 'FLOOR_PALLET_ZONE';

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <span className="bg-slate-900 text-white font-mono text-[11px] font-bold px-2 py-0.5 rounded">
            PDA RUNTIME SIMULATOR
          </span>
          <h3 className="text-base font-bold text-slate-900 mt-1">
            WMS 手持 PDA 终端上架指导与防错拦截演示
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            现场作业员通过扫描枪上架，终端根据分区策略强制提示「货架区分层推荐」或「地堆区整托上架」，实时拦截错放
          </p>
        </div>

        <button
          onClick={handleResetOrder}
          className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-300 font-semibold cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>重置扫码状态</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Interactive Test Trigger Bench */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Scan className="w-4 h-4 text-blue-600" />
              <span>现场扫码防错交互测试用例 (点击模拟扫描枪扫码)</span>
            </h4>
            <p className="text-xs text-slate-500">
              测试不同扫码场景，验证 PDA 系统的防错规则拦截机制：
            </p>

            <div className="space-y-2.5">
              {/* Test 1: 正确扫描推荐库位 */}
              <button
                onClick={() => handleSimulateScan(decisionResult.recommendedLocationCode)}
                className="w-full p-3.5 rounded-xl border border-emerald-300 bg-emerald-50/60 hover:bg-emerald-100/70 text-left transition-all cursor-pointer flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-xs text-emerald-950 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>场景 1: 扫描算法推荐的最佳储位 ({decisionResult.recommendedLocationCode})</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    精准命中同架垂直推荐或地堆专位，预期提示【核验通过，允许上架】。
                  </p>
                </div>
                <span className="text-[10px] font-mono bg-emerald-600 text-white px-2 py-0.5 rounded font-bold">
                  正常通行
                </span>
              </button>

              {/* Test 2: 误将地堆整托大件扫入高位货架 */}
              <button
                onClick={() => handleSimulateScan('A-01-01-03')}
                className="w-full p-3.5 rounded-xl border border-red-300 bg-red-50/60 hover:bg-red-100/70 text-left transition-all cursor-pointer flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-xs text-red-950 flex items-center gap-1.5">
                    <AlertOctagon className="w-4 h-4 text-red-600" />
                    <span>场景 2: 模拟误扫高位立体货架 (A-01-01-03)</span>
                  </div>
                  <p className="text-[11px] text-red-800 mt-0.5">
                    若当前为地堆整托大件，系统将触发红色警报并强行拦截，防止违规上架。
                  </p>
                </div>
                <span className="text-[10px] font-mono bg-red-600 text-white px-2 py-0.5 rounded font-bold">
                  防错拦截测试
                </span>
              </button>

              {/* Test 3: 模拟误将滞销品扫入 1 层拣选位 */}
              <button
                onClick={() => handleSimulateScan('A-01-03-01')}
                className="w-full p-3.5 rounded-xl border border-purple-300 bg-purple-50/60 hover:bg-purple-100/70 text-left transition-all cursor-pointer flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-xs text-purple-950 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-purple-600" />
                    <span>场景 3: 模拟误将滞销商品扫入 1 层拣选位 (A-01-03-01)</span>
                  </div>
                  <p className="text-[11px] text-purple-800 mt-0.5">
                    滞销品严禁挤占一层黄金拣货位，系统会即刻弹出违规阻断提醒。
                  </p>
                </div>
                <span className="text-[10px] font-mono bg-purple-600 text-white px-2 py-0.5 rounded font-bold">
                  黄金位保护测试
                </span>
              </button>

              {/* Test 4: 扫描相邻货架合规备货位 */}
              <button
                onClick={() => handleSimulateScan('A-01-04-02')}
                className="w-full p-3.5 rounded-xl border border-amber-300 bg-amber-50/60 hover:bg-amber-100/70 text-left transition-all cursor-pointer flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-xs text-amber-950 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-600" />
                    <span>场景 4: 模拟扫描相邻货架替代库位 (A-01-04-02)</span>
                  </div>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    层位符合业务逻辑，但非首选同架，系统给予黄色提示并允许作业。
                  </p>
                </div>
                <span className="text-[10px] font-mono bg-amber-600 text-white px-2 py-0.5 rounded font-bold">
                  替代放行测试
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Realistic Industrial PDA Mockup */}
        <div className="lg:col-span-6 flex justify-center">
          <div className="w-full max-w-[380px] bg-slate-900 p-4 rounded-[40px] shadow-2xl border-4 border-slate-700 text-slate-100 relative">
            {/* PDA Top Speaker & Scanner Window */}
            <div className="w-24 h-4 bg-slate-800 rounded-full mx-auto mb-3 flex items-center justify-center">
              <div className="w-8 h-1 bg-slate-600 rounded-full"></div>
            </div>

            {/* PDA Screen */}
            <div className="bg-slate-100 text-slate-900 rounded-[28px] p-4 min-h-[580px] flex flex-col justify-between overflow-hidden shadow-inner">
              {/* PDA Top Bar */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-[10px] font-mono font-bold text-slate-500">
                <span>WMS-PDA-901</span>
                <span>📶 5G · 🔋 98%</span>
              </div>

              {/* Task Header */}
              <div className="py-2 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded font-mono">
                    入库上架单 #{sku.inboundBatchNo.slice(-7)}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">
                    状态: {isCompleted ? '已完成' : '待上架'}
                  </span>
                </div>

                <div className="font-bold text-xs text-slate-900 line-clamp-1">
                  {sku.skuName}
                </div>
                <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between">
                  <span>{sku.skuCode}</span>
                  <span className="text-slate-800 font-bold">
                    到货: {sku.inboundQty} {sku.unit}
                  </span>
                </div>
              </div>

              {/* 🚨 PDA 分区提示核心横幅 (货架区 vs 地堆区) */}
              <div
                className={`p-3 rounded-xl border text-xs space-y-1 ${
                  isFloor
                    ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm'
                    : 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                }`}
              >
                <div className="flex items-center gap-1.5 font-black text-xs">
                  {isFloor ? (
                    <Boxes className="w-4 h-4 text-emerald-100" />
                  ) : (
                    <Layers className="w-4 h-4 text-indigo-100" />
                  )}
                  <span>
                    {isFloor ? '【地堆区整托上架提示】' : '【货架区分层推荐提示】'}
                  </span>
                </div>
                <p className="text-[11px] leading-tight opacity-95">
                  {decisionResult.pdaAlertMessage}
                </p>
              </div>

              {/* Target Location Box */}
              <div className="my-2 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">
                  目标储位 / TARGET LOCATION
                </span>
                <div className="text-2xl font-black font-mono text-blue-700 tracking-tight">
                  {decisionResult.recommendedLocationCode}
                </div>
                <div className="text-[10px] text-slate-500">
                  {decisionResult.recommendedZoneName} · {decisionResult.recommendedLevel}层
                  {decisionResult.isSameRackVertical && ' (🎯同架垂直绑定)'}
                </div>
              </div>

              {/* Scan Input & Current Scanned Display */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 bg-white p-2 rounded-xl border border-slate-300 text-xs">
                  <Scan className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-400 text-[11px]">扫描库位:</span>
                  <input
                    type="text"
                    placeholder="请对准库位条码扫码..."
                    value={scannedCode}
                    onChange={(e) => handleSimulateScan(e.target.value.toUpperCase())}
                    className="flex-1 font-mono font-bold text-xs bg-transparent focus:outline-none uppercase"
                  />
                </div>

                {/* Scan Result Audit Feedback */}
                {scanAudit && (
                  <div
                    className={`p-2.5 rounded-xl border text-[11px] space-y-1 ${
                      scanAudit.alertType === 'ERROR'
                        ? 'bg-red-50 text-red-900 border-red-300 animate-bounce'
                        : scanAudit.alertType === 'WARNING'
                        ? 'bg-amber-50 text-amber-900 border-amber-300'
                        : 'bg-emerald-50 text-emerald-900 border-emerald-300'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1">
                      {scanAudit.alertType === 'ERROR' ? (
                        <AlertOctagon className="w-3.5 h-3.5 text-red-600" />
                      ) : scanAudit.alertType === 'WARNING' ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      )}
                      <span>{scanAudit.title}</span>
                    </div>
                    <p className="text-[10px] leading-tight">
                      {scanAudit.message}
                    </p>
                  </div>
                )}
              </div>

              {/* PDA Bottom Action Button */}
              <div className="pt-2">
                {isCompleted ? (
                  <div className="bg-emerald-600 text-white text-xs font-bold py-2.5 rounded-xl text-center flex items-center justify-center gap-1.5 shadow-md">
                    <Check className="w-4 h-4" />
                    <span>上架完成已归档</span>
                  </div>
                ) : (
                  <button
                    onClick={handleConfirmPutaway}
                    disabled={!scanAudit?.isValid}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 ${
                      scanAudit?.isValid
                        ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                        : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <span>确认上架存入</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
