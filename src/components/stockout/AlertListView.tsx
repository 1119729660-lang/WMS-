import React, { useState } from 'react';
import {
  AlertTriangle,
  AlertOctagon,
  Clock,
  CheckCircle,
  ChevronRight,
  Send,
  Building2,
  Filter,
  Search,
  ArrowUpDown,
  Users,
} from 'lucide-react';
import { StockoutAlertItem, AlertSeverity, AlertStatus } from '../../types/stockoutAlert';

interface AlertListViewProps {
  alerts: StockoutAlertItem[];
  onOpenDetail: (alert: StockoutAlertItem) => void;
  onFollowUp: (id: string, note: string) => void;
  onResolve: (id: string, note: string) => void;
  onGenerateP0: (id: string) => void;
  onOpenNotificationConfig: () => void;
}

export const AlertListView: React.FC<AlertListViewProps> = ({
  alerts,
  onOpenDetail,
  onFollowUp,
  onResolve,
  onGenerateP0,
  onOpenNotificationConfig,
}) => {
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchKeyword, setSearchKeyword] = useState('');

  const filteredAlerts = alerts.filter((a) => {
    if (severityFilter !== 'ALL' && a.severity !== severityFilter) return false;
    if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
    if (searchKeyword) {
      const kw = searchKeyword.toLowerCase();
      const matchSku = a.sku.toLowerCase().includes(kw);
      const matchName = a.productName.toLowerCase().includes(kw);
      const matchWh = a.warehouseName.toLowerCase().includes(kw);
      const matchMerchant = a.merchantName.toLowerCase().includes(kw);
      if (!matchSku && !matchName && !matchWh && !matchMerchant) return false;
    }
    return true;
  });

  const getSeverityBadge = (severity: AlertSeverity, ratio: number) => {
    switch (severity) {
      case 'severe':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 border border-red-200">
            <AlertOctagon className="w-3.5 h-3.5 text-red-600" />
            重度缺货 ({(ratio * 100).toFixed(0)}% &gt; 60%)
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            中度缺货 ({(ratio * 100).toFixed(0)}%)
          </span>
        );
      case 'light':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            轻度缺货 ({(ratio * 100).toFixed(0)}% &lt; 30%)
          </span>
        );
    }
  };

  const getStatusBadge = (status: AlertStatus, isOverdue: boolean) => {
    if (isOverdue && status !== 'resolved') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 border border-red-300 animate-pulse">
          <Clock className="w-3 h-3 text-red-600" />
          超时未处置 (已自动升级上级)
        </span>
      );
    }
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            待处理
          </span>
        );
      case 'followed_up':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">
            已跟进
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            已解决 (已闭环)
          </span>
        );
      case 'escalated':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 border border-red-200">
            已升级
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1 text-slate-500 font-medium">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>预警等级:</span>
          </div>
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            {[
              { key: 'ALL', label: '全部等级' },
              { key: 'severe', label: '🔴 重度 (>60%)' },
              { key: 'medium', label: '🟠 中度 (30%~60%)' },
              { key: 'light', label: '🔵 轻度 (<30%)' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSeverityFilter(tab.key)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  severityFilter === tab.key
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 ml-2 text-slate-500 font-medium">
            <span>处理状态:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 cursor-pointer focus:outline-none"
          >
            <option value="ALL">全部状态</option>
            <option value="pending">待处理</option>
            <option value="followed_up">已跟进</option>
            <option value="resolved">已解决 (闭环)</option>
          </select>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="搜索 SKU / 品名 / 客户..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={onOpenNotificationConfig}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="配置默认通知客户/头程跟进人及24h超时升级策略"
          >
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span>通知与升级配置</span>
          </button>
        </div>
      </div>

      {/* Main Alert List Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <th className="py-3 px-4">预警单号 / 仓库</th>
                <th className="py-3 px-4">SKU / 产品名称</th>
                <th className="py-3 px-3 text-center">建议补货量</th>
                <th className="py-3 px-3 text-center">备货区可用</th>
                <th className="py-3 px-3 text-center">缺口数量 (占比)</th>
                <th className="py-3 px-4">预警分级</th>
                <th className="py-3 px-4">客户</th>
                <th className="py-3 px-4">触发时间 / 24h时限</th>
                <th className="py-3 px-4 text-center">处理状态</th>
                <th className="py-3 px-4 text-center">闭环操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                    当前无符合筛选条件的缺货预警单，备货库存充足！
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((alert) => (
                  <tr
                    key={alert.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      alert.isOverdue && alert.status !== 'resolved' ? 'bg-red-50/30' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-slate-800">{alert.id}</div>
                      <div className="text-[11px] text-slate-400">{alert.warehouseName}</div>
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-mono font-bold text-blue-700">{alert.sku}</div>
                      <div className="text-slate-700 truncate font-medium text-[11px]" title={alert.productName}>
                        {alert.productName}
                      </div>
                      <span className="text-[10px] bg-slate-100 px-1.5 py-0.2 rounded text-slate-500">
                        {alert.category}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center font-mono font-semibold text-slate-700">
                      {alert.suggestedReplenishQty}
                    </td>

                    <td className="py-3 px-3 text-center font-mono font-semibold text-slate-700">
                      {alert.reserveAvailQty}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <div className="font-mono font-bold text-red-600 text-sm">
                        {alert.gapQty} 件
                      </div>
                      <div className="text-[10px] text-red-500 font-mono">
                        占 {(alert.gapRatio * 100).toFixed(1)}%
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {getSeverityBadge(alert.severity, alert.gapRatio)}
                    </td>

                    <td className="py-3 px-4 text-[11px]">
                      <div className="font-medium text-slate-800">
                        {alert.merchantName}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-[11px]">
                      <div className="font-mono text-slate-700">{alert.triggerTime}</div>
                      {alert.isOverdue && alert.status !== 'resolved' ? (
                        <div className="text-red-600 font-bold mt-0.5">
                          已超 24h (超时已升级)
                        </div>
                      ) : (
                        <div className="text-slate-400 text-[10px] mt-0.5">
                          已过 {alert.hoursElapsed}h / 限 24h
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      {getStatusBadge(alert.status, alert.isOverdue)}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onOpenDetail(alert)}
                          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                          title="查看详情并处理"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        {!alert.isP0Generated && (
                          <button
                            onClick={() => onGenerateP0(alert.id)}
                            className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors cursor-pointer"
                            title="一键生成P0加急补货任务"
                          >
                            <Send className="w-3.5 h-3.5" />
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
