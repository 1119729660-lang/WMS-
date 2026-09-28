import React from 'react';
import { X, Printer, CheckCircle, Package } from 'lucide-react';
import { ReplenishItem } from '../types/replenishment';

interface PrintSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: ReplenishItem[];
  warehouseName: string;
}

export const PrintSheetModal: React.FC<PrintSheetModalProps> = ({
  isOpen,
  onClose,
  items,
  warehouseName,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const todayStr = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Top Control Bar (Hidden when printing via CSS) */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-blue-400" />
            <span className="font-bold text-sm">
              纸质作业流转单预览 (一期现场人工补货单据)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>调用打印机打印</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Paper Container - Formatted for standard A4 printing */}
        <div className="flex-1 overflow-y-auto p-8 bg-white print:p-0 text-slate-900 font-sans">
          {/* Document Header */}
          <div className="border-b-2 border-slate-900 pb-4 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-xl font-black tracking-tight uppercase">
                  仓储作业指令单 · 拣货位垂直补货流转单
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  WMS REPLENISHMENT WORK ORDER · 一期人工试点下发
                </p>
              </div>
              <div className="text-right text-xs">
                <div className="font-mono font-bold text-sm">单号: REP-{Date.now().toString().slice(-8)}</div>
                <div className="text-slate-500">生成日期: {todayStr}</div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 mt-4 text-xs bg-slate-50 p-2.5 rounded border border-slate-200">
              <div>
                <span className="text-slate-400">所属仓库:</span>{' '}
                <span className="font-bold">{warehouseName}</span>
              </div>
              <div>
                <span className="text-slate-400">作业班组:</span>{' '}
                <span className="font-bold">高位叉车组 / 拣货补货班</span>
              </div>
              <div>
                <span className="text-slate-400">补货总项数:</span>{' '}
                <span className="font-bold font-mono">{items.length} 项</span>
              </div>
              <div>
                <span className="text-slate-400">计划总件数:</span>{' '}
                <span className="font-bold font-mono">
                  {items.reduce((sum, i) => sum + i.suggestedReplenishQty, 0)} 件
                </span>
              </div>
            </div>
          </div>

          {/* Printable Items Table */}
          <table className="w-full text-left text-xs border border-slate-400 border-collapse mb-6">
            <thead>
              <tr className="bg-slate-200 text-slate-900 font-bold border-b border-slate-400">
                <th className="p-2 border-r border-slate-300 w-10 text-center">序</th>
                <th className="p-2 border-r border-slate-300 w-16 text-center">优先级</th>
                <th className="p-2 border-r border-slate-300 min-w-[140px]">商品名称 / 规格</th>
                <th className="p-2 border-r border-slate-300 w-24">SKU 编码</th>
                <th className="p-2 border-r border-slate-300 w-28 bg-emerald-50">
                  源位 (二/三层备货)
                </th>
                <th className="p-2 border-r border-slate-300 w-28 bg-blue-50">
                  目标 (一层拣选位)
                </th>
                <th className="p-2 border-r border-slate-300 w-16 text-center">计划数</th>
                <th className="p-2 border-r border-slate-300 w-16 text-center">实移数</th>
                <th className="p-2 w-20 text-center">作业人签字</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item.id} className="border-b border-slate-300">
                  <td className="p-2 border-r border-slate-300 text-center font-mono">
                    {idx + 1}
                  </td>
                  <td className="p-2 border-r border-slate-300 text-center font-bold">
                    <span
                      className={
                        item.priority === 'P0'
                          ? 'text-red-700 underline font-black'
                          : item.priority === 'P1'
                          ? 'text-amber-700 font-bold'
                          : ''
                      }
                    >
                      {item.priority}
                    </span>
                  </td>
                  <td className="p-2 border-r border-slate-300">
                    <div className="font-bold text-slate-900">{item.skuName}</div>
                    <div className="text-[10px] text-slate-500">{item.specification}</div>
                  </td>
                  <td className="p-2 border-r border-slate-300 font-mono text-[11px]">
                    {item.skuCode}
                  </td>
                  <td className="p-2 border-r border-slate-300 font-mono font-bold bg-emerald-50/50">
                    <div>{item.recommendedSourceLocation?.locationCode || '备货不足'}</div>
                    <div className="text-[10px] text-slate-500 font-normal">
                      批次: {item.recommendedSourceLocation?.batchNo}
                      {item.recommendedSourceLocation?.isSameRack && ' (同架)'}
                    </div>
                  </td>
                  <td className="p-2 border-r border-slate-300 font-mono font-bold text-blue-900 bg-blue-50/50">
                    {item.pickLocationCode}
                  </td>
                  <td className="p-2 border-r border-slate-300 text-center font-mono font-bold text-sm">
                    {item.suggestedReplenishQty}
                  </td>
                  <td className="p-2 border-r border-slate-300 text-center">
                    <div className="w-10 h-5 border border-dashed border-slate-400 mx-auto rounded"></div>
                  </td>
                  <td className="p-2 text-center">
                    <div className="w-14 h-5 border-b border-slate-400 mx-auto"></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* SOP Signatures */}
          <div className="grid grid-cols-3 gap-6 text-xs pt-4 border-t border-slate-300">
            <div>
              <span className="text-slate-500">库管审核员: __________________</span>
            </div>
            <div>
              <span className="text-slate-500">高位叉车司机: __________________</span>
            </div>
            <div>
              <span className="text-slate-500">拣货位复核员: __________________</span>
            </div>
          </div>

          <div className="mt-4 text-[11px] text-slate-400 text-center">
            * 作业规范：优先落实同架垂直调拨，由二层下架至一层，完成后需在PDA或PC端录入实移数量完成闭环。
          </div>
        </div>
      </div>
    </div>
  );
};
