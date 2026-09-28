import React, { useState } from 'react';
import {
  X,
  Bell,
  Mail,
  Building2,
  Clock,
  ShieldCheck,
  Save,
  Check,
  Users,
} from 'lucide-react';
import { NotificationSettings } from '../../types/stockoutAlert';

interface NotificationConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: NotificationSettings;
  onSaveSettings: (newSettings: NotificationSettings) => void;
}

export const NotificationConfigModal: React.FC<NotificationConfigModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [formData, setFormData] = useState<NotificationSettings>(settings);
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-in fade-in duration-150 my-8">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">缺货预警通知与自动升级策略配置</h3>
              <p className="text-xs text-slate-400">
                默认通知客户与头程跟进人 · 支持分仓/品类路由 · 24h超时升级机制
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs text-slate-700">
            {/* 1. Default Notification Recipients & Channels */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
              <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                <Users className="w-4 h-4 text-blue-600" />
                默认通知对象与通道开关
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center gap-2.5 bg-white p-3 rounded-lg border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.defaultNoticeMerchant}
                    onChange={(e) =>
                      setFormData({ ...formData, defaultNoticeMerchant: e.target.checked })
                    }
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <div>
                    <span className="font-semibold text-slate-800 block">默认通知客户</span>
                    <span className="text-[11px] text-slate-400">缺货触发时同步推送客户协同中心</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 bg-white p-3 rounded-lg border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.defaultNoticeFirstLeg}
                    onChange={(e) =>
                      setFormData({ ...formData, defaultNoticeFirstLeg: e.target.checked })
                    }
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <div>
                    <span className="font-semibold text-slate-800 block">默认通知头程跟进人</span>
                    <span className="text-[11px] text-slate-400">触发头程急调或加急干线补货</span>
                  </div>
                </label>
              </div>

              {/* Notification Channels */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <label className="flex items-center gap-2.5 bg-white p-3 rounded-lg border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.enableSystemNotice}
                    onChange={(e) =>
                      setFormData({ ...formData, enableSystemNotice: e.target.checked })
                    }
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <div>
                    <span className="font-semibold text-slate-800 flex items-center gap-1">
                      <Bell className="w-3.5 h-3.5 text-blue-600" />
                      系统消息工作台通知
                    </span>
                    <span className="text-[11px] text-slate-400">顶部消息角标与弹窗提醒</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 bg-white p-3 rounded-lg border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.enableEmailNotice}
                    onChange={(e) =>
                      setFormData({ ...formData, enableEmailNotice: e.target.checked })
                    }
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <div>
                    <span className="font-semibold text-slate-800 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-emerald-600" />
                      邮件通知 (可开关)
                    </span>
                    <span className="text-[11px] text-slate-400">发送缺口明细表至指定跟进人邮箱</span>
                  </div>
                </label>
              </div>
            </div>

            {/* 2. Timeout & Escalation Strategy */}
            <div className="border border-red-200 bg-red-50/60 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-red-900 flex items-center gap-1.5 text-xs">
                  <Clock className="w-4 h-4 text-red-600" />
                  超时未处理自动升级通知上级
                </h4>
                <span className="text-[11px] bg-red-100 text-red-700 px-2 py-0.5 rounded font-mono font-bold">
                  默认 24 小时
                </span>
              </div>
              <p className="text-[11px] text-red-700/80">
                当预警状态处于「待处理」且超过设定时限时，系统自动打上【超时升级】标识，并自动抄送直属上级或运营总监督办。
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3 rounded-lg border border-red-200">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    自动升级时限 (小时)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={72}
                      value={formData.escalationTimeoutHours}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          escalationTimeoutHours: Number(e.target.value) || 24,
                        })
                      }
                      className="w-24 p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                    <span className="text-slate-500 font-medium">小时 (当前为 24h)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    升级抄送上级负责人
                  </label>
                  <input
                    type="text"
                    value={formData.escalationSupervisor}
                    onChange={(e) =>
                      setFormData({ ...formData, escalationSupervisor: e.target.value })
                    }
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>
              </div>
            </div>

            {/* 3. Warehouse Dimension Recipient Routing */}
            <div className="border border-slate-200 rounded-xl p-4 space-y-3">
              <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                <Building2 className="w-4 h-4 text-blue-600" />
                分仓独立通知对象配置
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 text-[11px]">
                      <th className="p-2 rounded-l">仓库名称</th>
                      <th className="p-2">头程跟进责任人</th>
                      <th className="p-2 rounded-r">通知接收邮箱</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {formData.warehouseRules.map((w, idx) => (
                      <tr key={w.warehouseId}>
                        <td className="p-2 font-medium text-slate-800">{w.warehouseName}</td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={w.firstLegLeader}
                            onChange={(e) => {
                              const updated = [...formData.warehouseRules];
                              updated[idx].firstLegLeader = e.target.value;
                              setFormData({ ...formData, warehouseRules: updated });
                            }}
                            className="w-full p-1 bg-slate-50 border border-slate-200 rounded text-xs"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="email"
                            value={w.contactEmail}
                            onChange={(e) => {
                              const updated = [...formData.warehouseRules];
                              updated[idx].contactEmail = e.target.value;
                              setFormData({ ...formData, warehouseRules: updated });
                            }}
                            className="w-full p-1 bg-slate-50 border border-slate-200 rounded text-xs font-mono"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex items-center justify-between">
            {isSaved ? (
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                <Check className="w-4 h-4" />
                通知策略配置已成功保存！
              </span>
            ) : (
              <span className="text-[11px] text-slate-400">
                修改后将立即在下一次触发缺货预警时生效
              </span>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs rounded-lg cursor-pointer"
              >
                取消
              </button>
              <button
                type="submit"
                className="flex items-center gap-1 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                保存策略
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
