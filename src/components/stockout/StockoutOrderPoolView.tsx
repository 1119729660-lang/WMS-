import React, { useState } from 'react';
import {
  Layers,
  ArrowRight,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  Filter,
  AlertOctagon,
  Scan,
  Package,
} from 'lucide-react';
import { StockoutOrder, OrderPoolStatus } from '../../types/stockoutAlert';

interface StockoutOrderPoolViewProps {
  orders: StockoutOrder[];
  onRebatchOrder: (id: string) => void;
  onBatchRebatchOrders: (ids: string[]) => void;
  onCancelOrder: (id: string) => void;
  onOpenPdaModal: () => void;
}

export const StockoutOrderPoolView: React.FC<StockoutOrderPoolViewProps> = ({
  orders,
  onRebatchOrder,
  onBatchRebatchOrders,
  onCancelOrder,
  onOpenPdaModal,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== 'ALL' && o.status !== statusFilter) return false;
    if (searchKeyword) {
      const kw = searchKeyword.toLowerCase();
      const matchOrder = o.orderNo.toLowerCase().includes(kw);
      const matchSku = o.sku.toLowerCase().includes(kw);
      const matchProduct = o.productName.toLowerCase().includes(kw);
      const matchWave = o.sourceWaveId.toLowerCase().includes(kw);
      if (!matchOrder && !matchSku && !matchProduct && !matchWave) return false;
    }
    return true;
  });

  const pendingCount = orders.filter((o) => o.status === 'pending_replenish').length;
  const replenishedCount = orders.filter((o) => o.status === 'replenished').length;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredOrders.map((o) => o.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const getStatusBadge = (status: OrderPoolStatus) => {
    switch (status) {
      case 'pending_replenish':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            待补货 (挂起中)
          </span>
        );
      case 'replenished':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            已补货 (可重新入波)
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
            <XCircle className="w-3.5 h-3.5 text-slate-400" />
            已取消
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner / Explanation */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-red-500/20 text-red-300 border border-red-500/30">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm sm:text-base">缺货订单池 (波次解卡与防错中心)</h3>
              <span className="bg-amber-400 text-slate-950 font-bold font-mono text-[11px] px-2 py-0.5 rounded-full">
                待补挂起: {pendingCount} 单
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              拣货上报或备货不足时，订单自动剥离出原波次防止卡死；补货到位后可一键重新分配波次流转。
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenPdaModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-sm"
          >
            <Scan className="w-3.5 h-3.5" />
            <span>现场模拟：PDA上报 / 打包拦截</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1 text-slate-500 font-medium">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>订单池状态:</span>
          </div>
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            {[
              { key: 'ALL', label: `全部 (${orders.length})` },
              { key: 'pending_replenish', label: `待补货 (${pendingCount})` },
              { key: 'replenished', label: `已补货 (${replenishedCount})` },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  statusFilter === tab.key
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="搜索订单号 / SKU / 波次..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {selectedIds.length > 0 && (
            <button
              onClick={() => {
                onBatchRebatchOrders(selectedIds);
                setSelectedIds([]);
              }}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>批量重新入波 ({selectedIds.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <th className="py-3 px-3 text-center w-10">
                  <input
                    type="checkbox"
                    checked={
                      filteredOrders.length > 0 &&
                      selectedIds.length === filteredOrders.length
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4">缺货订单号</th>
                <th className="py-3 px-4">缺货 SKU & 商品名称</th>
                <th className="py-3 px-3 text-center">缺口量</th>
                <th className="py-3 px-4">来源波次</th>
                <th className="py-3 px-4">入池原因与时间</th>
                <th className="py-3 px-4">暂存格口</th>
                <th className="py-3 px-4 text-center">订单池状态</th>
                <th className="py-3 px-4 text-center">闭环操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    缺货订单池暂无记录，当前所有订单流转正常！
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      selectedIds.includes(order.id) ? 'bg-blue-50/40' : ''
                    }`}
                  >
                    <td className="py-3 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(order.id)}
                        onChange={() => handleToggleSelect(order.id)}
                        className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-slate-800">{order.orderNo}</div>
                      <span className="text-[10px] text-slate-400 font-mono">{order.id}</span>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-mono font-semibold text-blue-700">{order.sku}</div>
                      <div className="text-slate-600 truncate text-[11px]" title={order.productName}>
                        {order.productName}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-mono font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                        {order.gapQty} 件
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-700">
                      <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {order.sourceWaveId}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[11px]">
                      <div className="font-medium text-slate-800">{order.entryReason}</div>
                      <div className="text-slate-400 font-mono">{order.entryTime}</div>
                    </td>
                    <td className="py-3 px-4 text-[11px] font-medium text-amber-700">
                      {order.stagingLocation}
                    </td>
                    <td className="py-3 px-4 text-center">{getStatusBadge(order.status)}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {order.status === 'replenished' && (
                          <button
                            onClick={() => onRebatchOrder(order.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                            title="补货已到位，将订单重新打入新波次发货"
                          >
                            <RefreshCw className="w-3 h-3" />
                            重新入波
                          </button>
                        )}
                        {order.status === 'pending_replenish' && (
                          <span
                            className="text-[11px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-medium"
                            title="等待 P0 补货任务完成入库"
                          >
                            待货入库
                          </span>
                        )}
                        {order.status !== 'cancelled' && (
                          <button
                            onClick={() => onCancelOrder(order.id)}
                            className="px-2 py-1 text-slate-400 hover:text-red-600 text-xs transition-colors cursor-pointer"
                            title="取消此订单"
                          >
                            取消订单
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
