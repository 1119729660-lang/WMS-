import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  Clock,
  Send,
  CheckCircle,
  Bell,
  Mail,
  Building2,
  Package,
  Layers,
  History,
  AlertOctagon,
} from 'lucide-react';
import { StockoutAlertItem } from '../../types/stockoutAlert';

interface AlertDetailModalProps {
  item: StockoutAlertItem | null;
  onClose: () => void;
  onFollowUp: (id: string, note: string) => void;
  onResolve: (id: string, note: string) => void;
  onGenerateP0: (id: string) => void;
}

export const AlertDetailModal: React.FC<AlertDetailModalProps> = ({
  item,
  onClose,
  onFollowUp,
  onResolve,
  onGenerateP0,
}) => {
  const [note, setNote] = useState('');
  const [actionType, setActionType] = useState<'follow_up' | 'resolve' | null>(null);

  if (!item) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;
    if (actionType === 'follow_up') {
      onFollowUp(item.id, note);
    } else if (actionType === 'resolve') {
      onResolve(item.id, note);
    }
    setNote('');
    setActionType(null);
  };

  const getSeverityBadge = () => {
    if (item.severity === 'severe') {
      return (
        <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-red-100 text-red-700 border border-red-200 flex items-center gap-1.5">
          <AlertOctagon className="w-3.5 h-3.5" />
          重度缺货 (缺口 &gt; 60%)
        </span>
      );
    }
    if (item.severity === 'medium') {
      return (
        <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5" />
          中度缺货 (缺口 30%~60%)
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1.5">
        <Clock className="w-3.5 h-3.5" />
        轻度缺货 (缺口 &lt; 30%)
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-in fade-in duration-150 my-8">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">缺货预警明细与闭环处置</h3>
                <span className="text-xs font-mono text-slate-400">{item.id}</span>
              </div>
              <p className="text-xs text-slate-400">
                触发规则：生成补货任务时备货区可用库存 &lt; 补货量
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

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs text-slate-700">
          {/* Top Key Info Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {item.sku}
                </span>
                <span className="font-medium text-slate-800 text-sm">{item.productName}</span>
              </div>
              {getSeverityBadge()}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3 rounded-lg border border-slate-200/80">
              <div>
                <span className="text-slate-400 block text-[11px]">所属仓库</span>
                <span className="font-semibold text-slate-800">{item.warehouseName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">商品品类</span>
                <span className="font-semibold text-slate-800">{item.category}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">触发时间</span>
                <span className="font-mono text-slate-700">{item.triggerTime}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">超时状态</span>
                {item.isOverdue ? (
                  <span className="text-red-600 font-bold bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                    已超24h已升级
                  </span>
                ) : (
                  <span className="text-emerald-600 font-medium">
                    时限内 (已过 {item.hoursElapsed}h)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Formula Breakdown: 缺口量 = 补货量 - 备货区可用库存 */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4">
            <h4 className="font-bold text-amber-900 mb-2 flex items-center gap-1.5 text-xs">
              <Layers className="w-4 h-4 text-amber-700" />
              缺口量核算模型
            </h4>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-white p-2.5 rounded-lg border border-amber-200">
                <span className="text-slate-500 text-[11px] block">建议补货量</span>
                <span className="text-base font-bold font-mono text-blue-600">
                  {item.suggestedReplenishQty} <span className="text-xs font-normal">件</span>
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-amber-200">
                <span className="text-slate-500 text-[11px] block">备货区可用库存</span>
                <span className="text-base font-bold font-mono text-slate-700">
                  {item.reserveAvailQty} <span className="text-xs font-normal">件</span>
                </span>
              </div>
              <div className="bg-red-50 p-2.5 rounded-lg border border-red-200">
                <span className="text-red-700 text-[11px] block font-semibold">库存缺口量</span>
                <span className="text-base font-bold font-mono text-red-600">
                  {item.gapQty} <span className="text-xs font-normal">件</span>
                </span>
                <span className="block text-[10px] text-red-500 font-mono">
                  占比 {(item.gapRatio * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Notification & Follow-up Contacts */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-3">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-blue-600" />
              已通知联动主体 (默认客户 + 头程跟进人)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <span className="text-[11px] text-slate-400 block">合作客户</span>
                  <span className="font-semibold text-slate-800">{item.merchantName}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <Package className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <span className="text-[11px] text-slate-400 block">头程供应链跟进人</span>
                  <span className="font-semibold text-slate-800">{item.firstLegFollower}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                系统工作台消息已推送
              </span>
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-blue-600" />
                跟进提醒邮件已自动下发
              </span>
            </div>
          </div>

          {/* Action Resolution Trail */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
              <History className="w-4 h-4 text-slate-500" />
              流转与闭环记录
            </h4>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
              {item.history.map((h) => (
                <div key={h.id} className="text-[11px] flex items-start gap-2 border-b border-slate-200/60 pb-2 last:border-none last:pb-0">
                  <span className="font-mono text-slate-400 shrink-0">{h.time}</span>
                  <span className="bg-slate-200 text-slate-700 px-1.5 rounded font-medium shrink-0">
                    {h.operator}
                  </span>
                  <span className="font-semibold text-blue-700 shrink-0">[{h.action}]</span>
                  <span className="text-slate-600 flex-1">{h.note}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Form if Triggered */}
          {actionType && (
            <form onSubmit={handleSubmit} className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-900">
                  {actionType === 'follow_up' ? '填写跟进信息' : '解决并闭环预警'}
                </span>
                <button
                  type="button"
                  onClick={() => setActionType(null)}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  取消
                </button>
              </div>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder={
                  actionType === 'follow_up'
                    ? '例如：已联系客户加急发货，运单号 #SF99812，预计今晚入库...'
                    : '例如：头程到货入库验收完成，备货区库存已补足，缺口已抹平...'
                }
                className="w-full text-xs p-2.5 bg-white border border-blue-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-xs shadow-sm cursor-pointer"
                >
                  确认提交
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {!item.isP0Generated ? (
              <button
                onClick={() => onGenerateP0(item.id)}
                className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1.5 rounded-lg font-bold shadow-sm transition-colors cursor-pointer"
                title="针对缺货SKU生成高优先级P0补货任务"
              >
                <Send className="w-3.5 h-3.5" />
                生成 P0 级加急补货任务
              </button>
            ) : (
              <span className="text-xs text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-md font-bold flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                已联动下发 P0 任务
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {item.status !== 'resolved' && (
              <>
                <button
                  onClick={() => setActionType('follow_up')}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  标记已跟进
                </button>
                <button
                  onClick={() => setActionType('resolve')}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  标记已解决 (闭环)
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-medium rounded-lg cursor-pointer"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
