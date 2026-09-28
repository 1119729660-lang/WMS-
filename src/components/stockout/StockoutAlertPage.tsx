import React, { useState } from 'react';
import {
  AlertTriangle,
  AlertOctagon,
  Clock,
  CheckCircle,
  Smartphone,
  Layers,
  Bell,
  Users,
  Scan,
  TrendingDown,
  FileSpreadsheet,
  Package,
} from 'lucide-react';
import {
  StockoutAlertItem,
  StockoutOrder,
  NotificationSettings,
} from '../../types/stockoutAlert';
import {
  INITIAL_STOCKOUT_ALERTS,
  INITIAL_STOCKOUT_ORDERS,
  INITIAL_NOTIFICATION_SETTINGS,
} from '../../data/initialStockoutData';
import { AlertListView } from './AlertListView';
import { StockoutOrderPoolView } from './StockoutOrderPoolView';
import { AlertDetailModal } from './AlertDetailModal';
import { PdaSimulationModal } from './PdaSimulationModal';
import { NotificationConfigModal } from './NotificationConfigModal';

interface StockoutAlertPageProps {
  onAddP0ReplenishmentTask?: (sku: string, qty: number, reason: string) => void;
}

export const StockoutAlertPage: React.FC<StockoutAlertPageProps> = ({
  onAddP0ReplenishmentTask,
}) => {
  const [activeTab, setActiveTab] = useState<'alerts' | 'order_pool'>('alerts');

  // Master States
  const [alerts, setAlerts] = useState<StockoutAlertItem[]>(INITIAL_STOCKOUT_ALERTS);
  const [orderPool, setOrderPool] = useState<StockoutOrder[]>(INITIAL_STOCKOUT_ORDERS);
  const [settings, setSettings] = useState<NotificationSettings>(INITIAL_NOTIFICATION_SETTINGS);

  // Modals
  const [activeDetailItem, setActiveDetailItem] = useState<StockoutAlertItem | null>(null);
  const [isPdaModalOpen, setIsPdaModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // KPIs
  const totalAlerts = alerts.length;
  const severeAlerts = alerts.filter((a) => a.severity === 'severe' && a.status !== 'resolved').length;
  const mediumAlerts = alerts.filter((a) => a.severity === 'medium' && a.status !== 'resolved').length;
  const overdueAlerts = alerts.filter((a) => a.isOverdue && a.status !== 'resolved').length;
  const pendingPoolOrders = orderPool.filter((o) => o.status === 'pending_replenish').length;

  // Actions
  const handleFollowUp = (id: string, note: string) => {
    setAlerts((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          return {
            ...a,
            status: 'followed_up',
            history: [
              ...a.history,
              {
                id: `LOG-${Date.now()}`,
                time: new Date().toLocaleString(),
                operator: '当前操作员',
                action: '标记已跟进',
                note,
              },
            ],
          };
        }
        return a;
      })
    );
    showToast(`预警单 [${id}] 已标记为跟进中`);
  };

  const handleResolve = (id: string, note: string) => {
    setAlerts((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          return {
            ...a,
            status: 'resolved',
            isOverdue: false,
            history: [
              ...a.history,
              {
                id: `LOG-${Date.now()}`,
                time: new Date().toLocaleString(),
                operator: '当前操作员',
                action: '标记已解决 (闭环)',
                note,
              },
            ],
          };
        }
        return a;
      })
    );
    // Also resolve associated pool orders if any
    const targetAlert = alerts.find((a) => a.id === id);
    if (targetAlert) {
      setOrderPool((prev) =>
        prev.map((o) =>
          o.sku === targetAlert.sku && o.status === 'pending_replenish'
            ? { ...o, status: 'replenished' }
            : o
        )
      );
    }
    showToast(`预警单 [${id}] 已闭环解决，关联缺货订单已可重新入波！`);
  };

  const handleGenerateP0 = (id: string) => {
    const targetAlert = alerts.find((a) => a.id === id);
    if (!targetAlert) return;

    setAlerts((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              isP0Generated: true,
              history: [
                ...a.history,
                {
                  id: `LOG-${Date.now()}`,
                  time: new Date().toLocaleString(),
                  operator: '调度系统',
                  action: '联动生成P0任务',
                  note: `针对缺货缺口 ${targetAlert.gapQty} 件自动生成紧急 P0 补货任务，已插入看板顶部`,
                },
              ],
            }
          : a
      )
    );

    if (onAddP0ReplenishmentTask) {
      onAddP0ReplenishmentTask(
        targetAlert.sku,
        targetAlert.gapQty,
        `缺货预警单 ${targetAlert.id} 自动联动下发`
      );
    }

    showToast(`已针对 SKU [${targetAlert.sku}] 自动生成最高优先级 P0 级补货任务！`);
  };

  const handleRebatchOrder = (orderId: string) => {
    setOrderPool((prev) => prev.filter((o) => o.id !== orderId));
    showToast(`订单已移出缺货池，成功重新加入新波次流转！`);
  };

  const handleBatchRebatchOrders = (orderIds: string[]) => {
    setOrderPool((prev) => prev.filter((o) => !orderIds.includes(o.id)));
    showToast(`已成功将选中的 ${orderIds.length} 笔订单重新入波！`);
  };

  const handleCancelOrder = (orderId: string) => {
    setOrderPool((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'cancelled' } : o))
    );
    showToast(`订单已标记取消，不再参与缺货等待。`);
  };

  // PDA Report Stockout
  const handleReportPdaStockout = (sku: string, location: string, reportedWave: string) => {
    const newPoolOrder: StockoutOrder = {
      id: `ORD-POOL-${Date.now()}`,
      orderNo: `SO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(
        1000 + Math.random() * 9000
      )}`,
      sku,
      productName: alerts.find((a) => a.sku === sku)?.productName || '缺货商品',
      gapQty: 2,
      sourceWaveId: reportedWave,
      status: 'pending_replenish',
      entryTime: new Date().toLocaleTimeString(),
      entryReason: 'PDA上报P0缺货',
      stagingLocation: 'STG-ERR-03 (暂存异常格口)',
    };

    setOrderPool((prev) => [newPoolOrder, ...prev]);

    // Also link to P0 alert
    const existingAlert = alerts.find((a) => a.sku === sku);
    if (existingAlert) {
      handleGenerateP0(existingAlert.id);
    }
  };

  // Packing Intercept Scan
  const handleInterceptPackOrder = (orderNo: string) => {
    const matched = orderPool.find(
      (o) =>
        o.orderNo.toLowerCase().trim() === orderNo.toLowerCase().trim() &&
        o.status === 'pending_replenish'
    );
    return {
      intercepted: !!matched,
      order: matched,
    };
  };

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-18 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-xl border border-slate-700 flex items-center gap-2.5 animate-in slide-in-from-top-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner & KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">缺货预警总数</span>
            <AlertTriangle className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-800 mt-1">{totalAlerts}</div>
          <span className="text-[11px] text-slate-400">备货区库存 &lt; 补货量</span>
        </div>

        <div className="bg-red-50/70 p-3.5 rounded-xl border border-red-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-red-700 font-semibold">🔴 重度缺货 (&gt;60%)</span>
            <AlertOctagon className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-xl font-bold font-mono text-red-700 mt-1">{severeAlerts}</div>
          <span className="text-[11px] text-red-600/80">缺口极大，需头程急调</span>
        </div>

        <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-800 font-semibold">🟠 中度缺货 (30~60%)</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-800 mt-1">{mediumAlerts}</div>
          <span className="text-[11px] text-amber-700/80">已预警排查在途批次</span>
        </div>

        <div className="bg-purple-50/70 p-3.5 rounded-xl border border-purple-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-purple-800 font-semibold">缺货订单池挂起</span>
            <Layers className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl font-bold font-mono text-purple-800 mt-1">
            {pendingPoolOrders} <span className="text-xs font-normal">单</span>
          </div>
          <span className="text-[11px] text-purple-700/80">已移出原波次防卡死</span>
        </div>

        <div className="bg-rose-50/70 p-3.5 rounded-xl border border-rose-200 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-rose-800 font-semibold">超时未处理升级</span>
            <Clock className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl font-bold font-mono text-rose-700 mt-1">{overdueAlerts}</div>
          <span className="text-[11px] text-rose-700/80">默认超24h已通知上级</span>
        </div>
      </div>

      {/* Main Module Tabs & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('alerts')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'alerts'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>缺货预警列表与闭环处置</span>
            {severeAlerts > 0 && (
              <span className="bg-red-500 text-white font-mono text-[10px] px-1.5 py-0.2 rounded-full">
                {severeAlerts}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('order_pool')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'order_pool'
                ? 'bg-white text-purple-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>缺货订单池 (波次解卡与重入波)</span>
            <span className="bg-amber-400 text-slate-950 font-mono text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {pendingPoolOrders}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPdaModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>PDA上报 & 打包拦截沙盘</span>
          </button>

          <button
            onClick={() => setIsConfigModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span>通知对象与24h升级配置</span>
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === 'alerts' && (
        <AlertListView
          alerts={alerts}
          onOpenDetail={(a) => setActiveDetailItem(a)}
          onFollowUp={handleFollowUp}
          onResolve={handleResolve}
          onGenerateP0={handleGenerateP0}
          onOpenNotificationConfig={() => setIsConfigModalOpen(true)}
        />
      )}

      {activeTab === 'order_pool' && (
        <StockoutOrderPoolView
          orders={orderPool}
          onRebatchOrder={handleRebatchOrder}
          onBatchRebatchOrders={handleBatchRebatchOrders}
          onCancelOrder={handleCancelOrder}
          onOpenPdaModal={() => setIsPdaModalOpen(true)}
        />
      )}

      {/* Modals */}
      <AlertDetailModal
        item={activeDetailItem}
        onClose={() => setActiveDetailItem(null)}
        onFollowUp={handleFollowUp}
        onResolve={handleResolve}
        onGenerateP0={handleGenerateP0}
      />

      <PdaSimulationModal
        isOpen={isPdaModalOpen}
        onClose={() => setIsPdaModalOpen(false)}
        alerts={alerts}
        orderPool={orderPool}
        onReportPdaStockout={handleReportPdaStockout}
        onInterceptPackOrder={handleInterceptPackOrder}
      />

      <NotificationConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        settings={settings}
        onSaveSettings={(newSettings) => {
          setSettings(newSettings);
          showToast('缺货预警通知与自动升级策略已更新！');
        }}
      />
    </div>
  );
};
