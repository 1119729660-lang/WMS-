import React, { useState } from 'react';
import {
  X,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Package,
  Layers,
  Search,
  ShieldCheck,
} from 'lucide-react';
import {
  CANDIDATE_SKUS,
  CandidateSkuForTask,
} from '../../data/initialTaskData';
import { ReplenishTaskRecord } from '../../types/taskManagement';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTasks: ReplenishTaskRecord[];
  onCreateTasks: (
    items: {
      candidate: CandidateSkuForTask;
      qty: number;
      priority: 'P0' | 'P1' | 'P2';
    }[]
  ) => void;
  warehouseName: string;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  activeTasks,
  onCreateTasks,
  warehouseName,
}) => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedSkus, setSelectedSkus] = useState<Record<string, boolean>>({});
  const [customQtys, setCustomQtys] = useState<Record<string, number>>({});
  const [customPriorities, setCustomPriorities] = useState<
    Record<string, 'P0' | 'P1' | 'P2'>
  >({});

  if (!isOpen) return null;

  // Check anti-duplicate: Same SKU + Same Target Location in active non-finished status
  const checkDuplicate = (sku: string, targetLocation: string) => {
    const existing = activeTasks.find(
      (t) =>
        t.sku === sku &&
        t.targetLocation === targetLocation &&
        t.status !== 'completed' &&
        t.status !== 'exception_closed'
    );
    return existing;
  };

  const filteredCandidates = CANDIDATE_SKUS.filter((c) => {
    if (!searchKeyword) return true;
    const kw = searchKeyword.toLowerCase();
    return (
      c.sku.toLowerCase().includes(kw) ||
      c.productName.toLowerCase().includes(kw) ||
      c.targetLocation.toLowerCase().includes(kw) ||
      c.sourceLocation.toLowerCase().includes(kw)
    );
  });

  const handleToggle = (candidate: CandidateSkuForTask) => {
    const duplicate = checkDuplicate(candidate.sku, candidate.targetLocation);
    if (duplicate) return; // prevent selecting duplicates

    setSelectedSkus((prev) => ({
      ...prev,
      [candidate.sku]: !prev[candidate.sku],
    }));

    if (!customQtys[candidate.sku]) {
      setCustomQtys((prev) => ({
        ...prev,
        [candidate.sku]: candidate.suggestedQty,
      }));
    }
    if (!customPriorities[candidate.sku]) {
      setCustomPriorities((prev) => ({
        ...prev,
        [candidate.sku]: candidate.priority,
      }));
    }
  };

  const handleQtyChange = (sku: string, val: number) => {
    setCustomQtys((prev) => ({
      ...prev,
      [sku]: Math.max(1, val),
    }));
  };

  const handlePriorityChange = (sku: string, p: 'P0' | 'P1' | 'P2') => {
    setCustomPriorities((prev) => ({
      ...prev,
      [sku]: p,
    }));
  };

  const selectedList = filteredCandidates.filter((c) => selectedSkus[c.sku]);

  const handleSubmit = () => {
    if (selectedList.length === 0) return;

    const payload = selectedList.map((c) => ({
      candidate: c,
      qty: customQtys[c.sku] || c.suggestedQty,
      priority: customPriorities[c.sku] || c.priority,
    }));

    onCreateTasks(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-base">
                人工圈选 SKU 手动下发补货任务
              </h2>
              <p className="text-xs text-slate-500">
                所属仓库: {warehouseName} | 系统强制执行防重拦截校验
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

        {/* Notice banner: Anti-duplicate rule */}
        <div className="px-6 py-2.5 bg-blue-50/80 border-b border-blue-100 text-xs text-blue-800 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            <strong>防重管控原则：</strong>同一 SKU 针对同一目标拣货位，若存在「待派单 / 已派单 / 已领取 / 进行中 / 异常待核实」未完工任务，系统将严禁重复新建，防止现场重复搬仓。
          </span>
        </div>

        {/* Search bar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3 text-xs">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="快速搜索 SKU / 商品名称 / 库位..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="text-slate-500">
            已勾选 <strong className="text-blue-600 font-bold">{selectedList.length}</strong> 个补货任务
          </div>
        </div>

        {/* Candidate List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 text-xs">
          {filteredCandidates.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              暂无可圈选的补货 SKU
            </div>
          ) : (
            filteredCandidates.map((cand) => {
              const activeExistingTask = checkDuplicate(
                cand.sku,
                cand.targetLocation
              );
              const isSelected = !!selectedSkus[cand.sku];
              const isBlocked = !!activeExistingTask;

              return (
                <div
                  key={cand.sku}
                  className={`p-3 rounded-xl border transition-all ${
                    isBlocked
                      ? 'bg-slate-50/80 border-slate-200 opacity-70'
                      : isSelected
                      ? 'bg-blue-50/60 border-blue-400 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        disabled={isBlocked}
                        checked={isSelected}
                        onChange={() => handleToggle(cand)}
                        className={`w-4 h-4 rounded text-blue-600 focus:ring-blue-500 ${
                          isBlocked ? 'cursor-not-allowed text-slate-300' : 'cursor-pointer'
                        }`}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-800">
                            {cand.sku}
                          </span>
                          <span className="text-slate-500 font-medium">
                            {cand.productName}
                          </span>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                            {cand.specification}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-500 mt-1 font-mono text-[11px]">
                          <span>
                            推荐源库位: <strong className="text-slate-700">{cand.sourceLocation}</strong> (可用:{cand.sourceAvailQty})
                          </span>
                          <span>→</span>
                          <span>
                            目标拣货位: <strong className="text-emerald-700">{cand.targetLocation}</strong> (现存:{cand.currentPickStock})
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right side: Duplicate alert or Custom inputs */}
                    {isBlocked ? (
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-800 rounded-lg text-xs font-bold border border-red-200">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                        <span>已有活跃任务 [{activeExistingTask?.id}]，禁止重复新建！</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <span className="text-slate-500">优先级:</span>
                          <select
                            disabled={!isSelected}
                            value={customPriorities[cand.sku] || cand.priority}
                            onChange={(e) =>
                              handlePriorityChange(
                                cand.sku,
                                e.target.value as 'P0' | 'P1' | 'P2'
                              )
                            }
                            className={`px-2 py-1 rounded border text-xs font-bold ${
                              !isSelected
                                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                : 'bg-white text-slate-800 border-slate-300 cursor-pointer'
                            }`}
                          >
                            <option value="P0">P0 紧急</option>
                            <option value="P1">P1 紧缺</option>
                            <option value="P2">P2 预警</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="text-slate-500">下发量:</span>
                          <input
                            type="number"
                            disabled={!isSelected}
                            value={customQtys[cand.sku] || cand.suggestedQty}
                            onChange={(e) =>
                              handleQtyChange(cand.sku, parseInt(e.target.value) || 1)
                            }
                            className={`w-20 px-2 py-1 rounded border text-center font-mono font-bold text-xs ${
                              !isSelected
                                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                : 'bg-white text-slate-800 border-slate-300'
                            }`}
                          />
                          <span className="text-slate-400">{cand.unit}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            新建后任务状态将进入 <strong className="text-slate-800 font-mono">待派单 (pending_dispatch)</strong> 队列
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              取消
            </button>
            <button
              disabled={selectedList.length === 0}
              onClick={handleSubmit}
              className={`px-5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-sm ${
                selectedList.length === 0
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              确认圈选并下发 ({selectedList.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
