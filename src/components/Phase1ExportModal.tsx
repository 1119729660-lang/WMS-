import React, { useState } from 'react';
import {
  X,
  Download,
  Printer,
  Send,
  CheckCircle2,
  FileSpreadsheet,
  AlertTriangle,
  Layers,
  Sparkles,
  Sliders,
} from 'lucide-react';
import { PriorityLevel, ReplenishItem } from '../types/replenishment';

interface Phase1ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: ReplenishItem[];
  selectedWarehouseName: string;
  onManualDispatch: (itemIds: string[]) => void;
  onOpenPrintSheet: (itemsToPrint: ReplenishItem[]) => void;
}

export const Phase1ExportModal: React.FC<Phase1ExportModalProps> = ({
  isOpen,
  onClose,
  items,
  selectedWarehouseName,
  onManualDispatch,
  onOpenPrintSheet,
}) => {
  if (!isOpen) return null;

  // Filter candidate items (usually triggered or <= 2 days)
  const candidateItems = items.filter((i) => i.isTriggered || i.priority !== 'NORMAL');

  const [selectedIds, setSelectedIds] = useState<string[]>(
    candidateItems.map((i) => i.id)
  );
  const [globalCoeff, setGlobalCoeff] = useState<number>(1.0);
  const [operatorName, setOperatorName] = useState<string>('库管班组A');

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectPreset = (type: 'p0' | 'p0p1' | 'all' | 'none') => {
    if (type === 'p0') {
      setSelectedIds(candidateItems.filter((i) => i.priority === 'P0').map((i) => i.id));
    } else if (type === 'p0p1') {
      setSelectedIds(
        candidateItems
          .filter((i) => i.priority === 'P0' || i.priority === 'P1')
          .map((i) => i.id)
      );
    } else if (type === 'all') {
      setSelectedIds(candidateItems.map((i) => i.id));
    } else {
      setSelectedIds([]);
    }
  };

  const selectedItems = candidateItems.filter((i) => selectedIds.includes(i.id));
  const totalSuggestedQty = selectedItems.reduce(
    (sum, i) => sum + Math.ceil(i.suggestedReplenishQty * globalCoeff),
    0
  );

  // Real CSV export trigger
  const exportCsv = () => {
    if (selectedItems.length === 0) {
      alert('请先勾选需要导出的低库存 SKU！');
      return;
    }

    const headers = [
      '优先级',
      'SKU编码',
      '商品名称',
      '规格',
      '库区',
      '一层拣货位',
      '一层可用库存',
      '近7日均销',
      '有效出库天数',
      '剩余可用天数',
      '建议补货量',
      '推荐源库位',
      '源库位类型',
      '是否同架垂直',
      '源库位批次',
      '源库位可用存量',
    ];

    const rows = selectedItems.map((item) => [
      item.priority,
      item.skuCode,
      `"${item.skuName.replace(/"/g, '""')}"`,
      `"${item.specification}"`,
      item.zone,
      item.pickLocationCode,
      item.currentPickStock,
      item.avgDailySales,
      item.validSalesDays,
      item.daysOfSupply,
      Math.ceil(item.suggestedReplenishQty * globalCoeff),
      item.recommendedSourceLocation?.locationCode || '无备货',
      item.recommendedSourceLocation
        ? item.recommendedSourceLocation.level === 2
          ? '二层备货位'
          : '三层备货位'
        : '-',
      item.recommendedSourceLocation?.isSameRack ? '是 (同架)' : '否 (跨架)',
      item.recommendedSourceLocation?.batchNo || '-',
      item.recommendedSourceLocation?.availableStock || 0,
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `低库存补货清单_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle batch dispatch from this modal
  const handleBatchDispatch = () => {
    if (selectedIds.length === 0) {
      alert('请勾选至少一个补货 SKU');
      return;
    }
    onManualDispatch(selectedIds);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <span>一期试点重点：低库存清单导出与人工圈选下发中心</span>
                  <span className="text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-mono">
                    试点过渡模式
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  仓库: {selectedWarehouseName} · 库管员手工圈选核验，无需等待自动化引擎，即刻保障现场拣选作业不中断
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Controls & Preset Selection */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-600">快捷圈选:</span>
            <button
              onClick={() => selectPreset('p0')}
              className="px-2.5 py-1 rounded-md bg-red-100 text-red-800 hover:bg-red-200 font-medium cursor-pointer"
            >
              仅圈选 P0 断货 ({candidateItems.filter((i) => i.priority === 'P0').length})
            </button>
            <button
              onClick={() => selectPreset('p0p1')}
              className="px-2.5 py-1 rounded-md bg-amber-100 text-amber-800 hover:bg-amber-200 font-medium cursor-pointer"
            >
              圈选 P0 + P1 紧缺 ({candidateItems.filter((i) => i.priority === 'P0' || i.priority === 'P1').length})
            </button>
            <button
              onClick={() => selectPreset('all')}
              className="px-2.5 py-1 rounded-md bg-blue-100 text-blue-800 hover:bg-blue-200 font-medium cursor-pointer"
            >
              圈选全部候选 ({candidateItems.length})
            </button>
            <button
              onClick={() => selectPreset('none')}
              className="px-2 py-1 rounded-md text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              清空
            </button>
          </div>

          {/* Quick Coefficient Adjust */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500">试点补货系数:</span>
            <select
              value={globalCoeff}
              onChange={(e) => setGlobalCoeff(parseFloat(e.target.value))}
              className="font-bold text-blue-600 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="0.8">0.8x (轻度调拨)</option>
              <option value="1.0">1.0x (标准均销)</option>
              <option value="1.2">1.2x (冗余备足)</option>
              <option value="1.5">1.5x (大促预防)</option>
            </select>
          </div>
        </div>

        {/* Candidate SKU Table */}
        <div className="flex-1 overflow-y-auto p-4">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                <th className="p-2.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      selectedIds.length > 0 &&
                      selectedIds.length === candidateItems.length
                    }
                    onChange={(e) => selectPreset(e.target.checked ? 'all' : 'none')}
                    className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="p-2.5 w-20">优先级</th>
                <th className="p-2.5 min-w-[180px]">商品名称 / SKU</th>
                <th className="p-2.5 w-28">一层拣货位</th>
                <th className="p-2.5 w-20">可用库存</th>
                <th className="p-2.5 w-20">7日均销</th>
                <th className="p-2.5 w-20">可用天数</th>
                <th className="p-2.5 min-w-[160px]">推荐备货源 (同架)</th>
                <th className="p-2.5 w-24">建议补货量</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {candidateItems.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                const calcQty = Math.ceil(item.suggestedReplenishQty * globalCoeff);

                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-50 transition-colors ${
                      isSelected ? 'bg-blue-50/40' : ''
                    }`}
                  >
                    <td className="p-2.5 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(item.id)}
                        className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                    <td className="p-2.5">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          item.priority === 'P0'
                            ? 'bg-red-100 text-red-700'
                            : item.priority === 'P1'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {item.priority}
                      </span>
                    </td>
                    <td className="p-2.5">
                      <div className="font-semibold text-slate-800">{item.skuName}</div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {item.skuCode}
                      </div>
                    </td>
                    <td className="p-2.5 font-mono font-bold text-slate-700">
                      {item.pickLocationCode}
                    </td>
                    <td className="p-2.5 font-mono font-bold text-slate-800">
                      <span
                        className={
                          item.currentPickStock === 0
                            ? 'text-red-600'
                            : item.currentPickStock < item.avgDailySales
                            ? 'text-amber-600'
                            : ''
                        }
                      >
                        {item.currentPickStock}
                      </span>
                    </td>
                    <td className="p-2.5 font-mono text-slate-600">
                      {item.avgDailySales}
                    </td>
                    <td className="p-2.5 font-mono font-bold">
                      <span
                        className={
                          item.daysOfSupply <= 0
                            ? 'text-red-600'
                            : item.daysOfSupply < 1
                            ? 'text-amber-600'
                            : 'text-blue-600'
                        }
                      >
                        {item.daysOfSupply} 天
                      </span>
                    </td>
                    <td className="p-2.5">
                      <div className="font-mono font-bold text-slate-800 flex items-center gap-1">
                        <span>{item.recommendedSourceLocation?.locationCode || '无'}</span>
                        {item.recommendedSourceLocation?.isSameRack && (
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1 rounded font-normal">
                            同架
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        备货存量: {item.recommendedSourceLocation?.availableStock || 0}{' '}
                        {item.unit}
                      </div>
                    </td>
                    <td className="p-2.5 font-mono font-bold text-blue-700 text-sm">
                      {calcQty} <span className="text-xs text-slate-400 font-normal">{item.unit}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Summary & Action Buttons */}
        <div className="bg-slate-100 p-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4 text-xs text-slate-600">
            <div>
              已圈选: <strong className="text-slate-900 font-mono text-sm">{selectedItems.length}</strong> / {candidateItems.length} 个 SKU
            </div>
            <div>
              计划总补货量: <strong className="text-blue-700 font-mono text-base">{totalSuggestedQty}</strong> 件
            </div>
            <div className="hidden sm:block text-slate-400">
              预估需调度高位叉车: <strong className="text-slate-700">{Math.ceil(selectedItems.length / 3)}</strong> 趟次
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Export CSV */}
            <button
              onClick={exportCsv}
              className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-3.5 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
              title="导出包含所有计算列的 CSV 文件"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>导出清单 (CSV)</span>
            </button>

            {/* Print Sheet */}
            <button
              onClick={() => onOpenPrintSheet(selectedItems)}
              className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-3.5 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
              title="生成纸质/PDF作业流转单"
            >
              <Printer className="w-3.5 h-3.5 text-blue-600" />
              <span>打印现场补货单</span>
            </button>

            {/* Batch Manual Dispatch */}
            <button
              onClick={handleBatchDispatch}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-sm"
              title="一期试点：下发选中任务到作业池"
            >
              <Send className="w-3.5 h-3.5" />
              <span>批量手动下发补货任务</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
