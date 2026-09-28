import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Download,
  Filter,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import {
  SlaOrderRecord,
  SlaDelayFilter,
  SlaSystemConfig,
} from '../../types/sla';

interface SlaOrderTableProps {
  orders: SlaOrderRecord[];
  delayFilter: SlaDelayFilter;
  selectedWarehouseId: string | null;
  config: SlaSystemConfig;
  onOpenOrderDetail?: (order: SlaOrderRecord) => void;
}

export const SlaOrderTable: React.FC<SlaOrderTableProps> = ({
  orders,
  delayFilter,
  selectedWarehouseId,
  config,
  onOpenOrderDetail,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filtering
  const filteredOrders = orders.filter((o) => {
    // Warehouse
    if (selectedWarehouseId && o.warehouseId !== selectedWarehouseId) {
      return false;
    }
    // Delay filter
    if (delayFilter === 'DELAYED' && !o.isDelayed) return false;
    if (delayFilter === 'ON_TIME' && o.isDelayed) return false;

    // Search
    if (searchTerm) {
      const match =
        o.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.warehouseName.includes(searchTerm);
      if (!match) return false;
    }

    return true;
  });

  const downloadCsv = () => {
    const headers = [
      '订单号',
      '订单类型',
      '所属仓库',
      'SKU种数',
      '总件数',
      '下单建单时间',
      '终点交付时间',
      '入库注册耗时(分)',
      '入库注册是否按时',
      '出库注册耗时(分)',
      '出库注册是否按时',
      '入库上架耗时(分)',
      '入库上架是否按时',
      '出库准备耗时(分)',
      '出库准备是否按时',
      '整单时效结果',
      '超时节点数',
    ];

    const rows = filteredOrders.map((o) => {
      const inReg = o.nodeExecutions.find((n) => n.nodeId === 'inbound_register');
      const outReg = o.nodeExecutions.find((n) => n.nodeId === 'outbound_register');
      const inPut = o.nodeExecutions.find((n) => n.nodeId === 'inbound_putaway');
      const outPrep = o.nodeExecutions.find((n) => n.nodeId === 'outbound_prepare');

      return [
        o.orderId,
        o.orderType === 'INBOUND' ? '入库单' : '出库单',
        o.warehouseName,
        o.skuCount,
        o.totalPieces,
        o.createdAt,
        o.completedAt,
        inReg?.durationMinutes ?? '',
        inReg?.isOnTime ? '按时' : `超时(+${inReg?.overdueMinutes}m)`,
        outReg?.durationMinutes ?? '',
        outReg?.isOnTime ? '按时' : `超时(+${outReg?.overdueMinutes}m)`,
        inPut?.durationMinutes ?? '',
        inPut?.isOnTime ? '按时' : `超时(+${inPut?.overdueMinutes}m)`,
        outPrep?.durationMinutes ?? '',
        outPrep?.isOnTime ? '按时' : `超时(+${outPrep?.overdueMinutes}m)`,
        o.isDelayed ? '已延迟' : '全部按时',
        o.delayedNodeCount,
      ];
    });

    const csvContent =
      '\uFEFF' +
      [
        headers.join(','),
        ...rows.map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        ),
      ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `SLA履约订单明细_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderNodeCell = (order: SlaOrderRecord, nodeId: string) => {
    const exec = order.nodeExecutions.find((n) => n.nodeId === nodeId);
    if (!exec) return <span className="text-slate-300">--</span>;

    const threshold = exec.thresholdMinutes;
    const isOverdue = !exec.isOnTime;

    let displayTime = `${exec.durationMinutes}m`;
    if (exec.durationMinutes >= 60) {
      displayTime = `${(exec.durationMinutes / 60).toFixed(1)}h`;
    }

    return (
      <div className="flex items-center gap-1.5 font-mono">
        <span
          className={`font-bold ${
            isOverdue ? 'text-rose-600' : 'text-slate-800'
          }`}
        >
          {displayTime}
        </span>
        {isOverdue ? (
          <span className="text-[10px] bg-rose-50 text-rose-700 px-1 py-0.2 rounded border border-rose-200 font-bold">
            +{exec.overdueMinutes}m
          </span>
        ) : (
          <span className="text-[10px] text-emerald-600 font-bold">✓</span>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-800">
                订单 SLA 4 节点履约执行明细透视表
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">
                共 {filteredOrders.length} 笔订单
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              单订单若存在任一环节实测耗时大于 SLA 阈值，即被归入「已延迟」订单池
            </p>
          </div>
        </div>

        {/* Search & Export */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="搜索订单号 / 仓库..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-blue-500 w-48 text-slate-700 font-medium"
            />
          </div>

          <button
            onClick={downloadCsv}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>导出报表</span>
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-y border-slate-200/80">
            <tr>
              <th className="py-2.5 px-3">订单号 / 类型</th>
              <th className="py-2.5 px-3">所属仓库</th>
              <th className="py-2.5 px-3">入库注册 (≤1h)</th>
              <th className="py-2.5 px-3">出库注册 (≤10m)</th>
              <th className="py-2.5 px-3">入库上架 (≤24h)</th>
              <th className="py-2.5 px-3">出库准备 (≤24h)</th>
              <th className="py-2.5 px-3">物料规模</th>
              <th className="py-2.5 px-3 text-right">整单履约结果</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400">
                  当前筛选条件下暂无订单记录
                </td>
              </tr>
            ) : (
              filteredOrders.map((o) => (
                <tr
                  key={o.orderId}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    o.isDelayed ? 'bg-rose-50/30' : ''
                  }`}
                >
                  {/* Order Id & Type */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-slate-900">
                        {o.orderId}
                      </span>
                      <span
                        className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                          o.orderType === 'INBOUND'
                            ? 'bg-sky-50 text-sky-700 border border-sky-200'
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        }`}
                      >
                        {o.orderType === 'INBOUND' ? '入库' : '出库'}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {o.createdAt}
                    </div>
                  </td>

                  {/* Warehouse Name */}
                  <td className="py-3 px-3">
                    <div className="font-medium text-slate-800">
                      {o.warehouseName}
                    </div>
                  </td>

                  {/* Node 1: Inbound Register */}
                  <td className="py-3 px-3">
                    {renderNodeCell(o, 'inbound_register')}
                  </td>

                  {/* Node 2: Outbound Register */}
                  <td className="py-3 px-3">
                    {renderNodeCell(o, 'outbound_register')}
                  </td>

                  {/* Node 3: Inbound Putaway */}
                  <td className="py-3 px-3">
                    {renderNodeCell(o, 'inbound_putaway')}
                  </td>

                  {/* Node 4: Outbound Prepare */}
                  <td className="py-3 px-3">
                    {renderNodeCell(o, 'outbound_prepare')}
                  </td>

                  {/* SKU & Pieces */}
                  <td className="py-3 px-3 font-mono text-slate-600">
                    {o.skuCount} 款 / {o.totalPieces} 件
                  </td>

                  {/* Overall Status */}
                  <td className="py-3 px-3 text-right">
                    {o.isDelayed ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        <span>已延迟 ({o.delayedNodeCount}节点超时)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>全部节点按时</span>
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
