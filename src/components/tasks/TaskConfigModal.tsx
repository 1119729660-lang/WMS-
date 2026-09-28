import React, { useState } from 'react';
import {
  X,
  Sliders,
  Clock,
  Send,
  Zap,
  UserCheck,
  Flame,
  CheckCircle2,
  Bell,
  Shield,
} from 'lucide-react';
import { TaskWarehouseConfig, DispatchMode } from '../../types/taskManagement';

interface TaskConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: TaskWarehouseConfig;
  onSaveConfig: (updated: TaskWarehouseConfig) => void;
}

export const TaskConfigModal: React.FC<TaskConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [dispatchMode, setDispatchMode] = useState<DispatchMode>(config.dispatchMode);
  const [warningHours, setWarningHours] = useState<number>(config.warningThresholdHours);
  const [escalateHours, setEscalateHours] = useState<number>(config.escalateThresholdHours);
  const [supervisorName, setSupervisorName] = useState<string>(config.supervisorName);
  const [supervisorPhone, setSupervisorPhone] = useState<string>(config.supervisorPhone);
  const [autoAssignMaxLoad, setAutoAssignMaxLoad] = useState<number>(
    config.autoAssignMaxLoad
  );

  if (!isOpen) return null;

  const handleSave = () => {
    if (escalateHours <= warningHours) {
      alert('二级超时升级阈值必须大于一级预警阈值！');
      return;
    }
    onSaveConfig({
      ...config,
      dispatchMode,
      warningThresholdHours: warningHours,
      escalateThresholdHours: escalateHours,
      supervisorName,
      supervisorPhone,
      autoAssignMaxLoad,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 text-xs">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                补货派单模式与超时预警策略
              </h3>
              <p className="text-[11px] text-slate-400">
                仓库独立配置: {config.warehouseName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section 1: Dispatch Mode */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <Send className="w-3.5 h-3.5 text-blue-600" />
            <span>默认派单模式 (仓库级配置)</span>
          </div>

          <div className="space-y-1.5">
            <label
              onClick={() => setDispatchMode('nearby_auto')}
              className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                dispatchMode === 'nearby_auto'
                  ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="config_mode"
                checked={dispatchMode === 'nearby_auto'}
                onChange={() => setDispatchMode('nearby_auto')}
                className="mt-0.5 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <div className="font-bold text-slate-800 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-blue-600" />
                  <span>按补货员区域就近自动派单 (推荐)</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  系统解析目标拣货位库区（如A区），自动匹配该网格责任补货员中当前负荷最低者自动派单。
                </p>
              </div>
            </label>

            <label
              onClick={() => setDispatchMode('manual_assign')}
              className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                dispatchMode === 'manual_assign'
                  ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="config_mode"
                checked={dispatchMode === 'manual_assign'}
                onChange={() => setDispatchMode('manual_assign')}
                className="mt-0.5 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <div className="font-bold text-slate-800 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                  <span>手动指定补货员</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  任务生成后停留在「待派单」队列，由现场调度员人工核定指定具体作业员。
                </p>
              </div>
            </label>

            <label
              onClick={() => setDispatchMode('worker_grab')}
              className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                dispatchMode === 'worker_grab'
                  ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="config_mode"
                checked={dispatchMode === 'worker_grab'}
                onChange={() => setDispatchMode('worker_grab')}
                className="mt-0.5 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <div className="font-bold text-slate-800 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  <span>补货员人工抢单池</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  任务进入公共任务池，补货员根据自身位置及叉车排班自由认领抢单。
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Section 2: Timeout Warning Thresholds */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <Clock className="w-3.5 h-3.5 text-red-600" />
            <span>超时预警与升级机制</span>
          </div>

          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <label className="text-slate-600 font-medium block">
                一级超时标红预警阈值:
              </label>
              <div className="flex items-center gap-1.5 mt-1">
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="12"
                  value={warningHours}
                  onChange={(e) => setWarningHours(parseFloat(e.target.value) || 1)}
                  className="w-20 p-1.5 bg-white border border-slate-200 rounded font-mono font-bold text-center text-xs"
                />
                <span className="text-slate-600 font-medium">小时 (默认 2h)</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                任务超过此时间未完成，看板整行标红警示。
              </p>
            </div>

            <div>
              <label className="text-slate-600 font-medium block">
                二级升级通知组长阈值:
              </label>
              <div className="flex items-center gap-1.5 mt-1">
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="24"
                  value={escalateHours}
                  onChange={(e) => setEscalateHours(parseFloat(e.target.value) || 2)}
                  className="w-20 p-1.5 bg-white border border-slate-200 rounded font-mono font-bold text-center text-xs text-red-600"
                />
                <span className="text-slate-600 font-medium">小时 (默认 4h)</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                超过此时间将触发强督办消息与短信升级。
              </p>
            </div>
          </div>

          {/* Supervisor info */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <label className="text-slate-500 font-medium block">
                接收升级督办的组长姓名:
              </label>
              <input
                type="text"
                value={supervisorName}
                onChange={(e) => setSupervisorName(e.target.value)}
                className="w-full mt-1 p-1.5 bg-slate-50 border border-slate-200 rounded text-xs"
              />
            </div>
            <div>
              <label className="text-slate-500 font-medium block">
                督办通知手机号 / 企微:
              </label>
              <input
                type="text"
                value={supervisorPhone}
                onChange={(e) => setSupervisorPhone(e.target.value)}
                className="w-full mt-1 p-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-mono"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-slate-500 hover:bg-slate-100 rounded-lg font-medium cursor-pointer"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>保存策略配置</span>
          </button>
        </div>
      </div>
    </div>
  );
};
