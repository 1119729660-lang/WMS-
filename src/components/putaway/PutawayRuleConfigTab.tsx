import React, { useState } from 'react';
import {
  Sparkles,
  Zap,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  Info,
  PackagePlus,
  Flame,
  Clock,
  Archive,
  HelpCircle,
} from 'lucide-react';
import { PutawayStrategyConfig, PromoDayAnomaly } from '../../types/putaway';

interface PutawayRuleConfigTabProps {
  config: PutawayStrategyConfig;
  onUpdateConfig: (newConfig: PutawayStrategyConfig) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'warning') => void;
}

export const PutawayRuleConfigTab: React.FC<PutawayRuleConfigTabProps> = ({
  config,
  onUpdateConfig,
  onShowToast,
}) => {
  const [localConfig, setLocalConfig] = useState<PutawayStrategyConfig>(config);
  const [newPromoDate, setNewPromoDate] = useState('');
  const [newPromoName, setNewPromoName] = useState('');
  const [newPromoMultiplier, setNewPromoMultiplier] = useState(3.0);

  const handleSave = () => {
    onUpdateConfig(localConfig);
    onShowToast('上架策略配置已成功保存并即时生效至 WMS 引擎！', 'success');
  };

  const handleReset = () => {
    // Reset to default
    onShowToast('已重置为系统默认上架策略参数', 'info');
  };

  const handleTogglePromoExcluded = (id: string) => {
    setLocalConfig((prev) => ({
      ...prev,
      promoAnomalies: prev.promoAnomalies.map((p) =>
        p.id === id ? { ...p, excluded: !p.excluded } : p
      ),
    }));
  };

  const handleAddPromoAnomaly = () => {
    if (!newPromoDate || !newPromoName) {
      alert('请填写大促异常日期与活动名称');
      return;
    }
    const newAnomaly: PromoDayAnomaly = {
      id: `PROMO-${Date.now().toString().slice(-4)}`,
      date: newPromoDate,
      name: newPromoName,
      multiplier: newPromoMultiplier,
      excluded: true,
    };
    setLocalConfig((prev) => ({
      ...prev,
      promoAnomalies: [...prev.promoAnomalies, newAnomaly],
    }));
    setNewPromoDate('');
    setNewPromoName('');
    onShowToast(`已添加异常大促日 [${newAnomaly.name}]，已默认设为剔除！`, 'success');
  };

  const handleDeletePromoAnomaly = (id: string) => {
    setLocalConfig((prev) => ({
      ...prev,
      promoAnomalies: prev.promoAnomalies.filter((p) => p.id !== id),
    }));
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Flow Architecture */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-6 text-white border border-slate-700 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[11px] font-mono font-bold px-2 py-0.5 rounded">
                STRATEGY RULES ENGINE
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-mono px-2 py-0.5 rounded">
                直决机制优先 · 仅老品校验库存
              </span>
            </div>
            <h2 className="text-xl font-bold mt-2 text-slate-100 flex items-center gap-2">
              <span>WMS 智能上架策略引擎配置中心</span>
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
              根据 SKU 动销生命周期与出库强度，严格按照<strong>【新品 → 爆品 → 老品 → 滞销品】</strong>执行流水线判定。
              新品、爆品、滞销品命中后<strong>直接决定上架位置，不校验拣货区当前库存</strong>；只有未命中前置规则的<strong>老品才启动拣货区库存阈值校验</strong>。
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>保存策略并全库生效</span>
            </button>
          </div>
        </div>

        {/* 判定优先级全景可视化流水线 */}
        <div className="mt-6 pt-5 border-t border-slate-700/80">
          <div className="text-xs font-bold text-slate-300 mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>核心判定优先级流水线 (严格串行判定)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            {/* 1. 新品 */}
            <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-3.5 relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono font-bold text-emerald-300 text-xs flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-[11px]">1</span>
                  新品 (NEW)
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 px-1.5 py-0.5 rounded font-bold">
                  ⚡ 免验直决
                </span>
              </div>
              <div className="text-slate-200 font-semibold text-[11px]">无历史入库记录</div>
              <p className="text-slate-400 text-[10px] mt-1">
                首次入库 SKU 直通<strong>一层拣货区</strong>，确保快速上架并即时可售。
              </p>
            </div>

            {/* 2. 爆品 */}
            <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-3.5 relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono font-bold text-amber-300 text-xs flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-black text-[11px]">2</span>
                  爆品 (HOT)
                </span>
                <span className="text-[10px] bg-amber-500/20 text-amber-200 border border-amber-500/30 px-1.5 py-0.5 rounded font-bold">
                  ⚡ 免验直决
                </span>
              </div>
              <div className="text-slate-200 font-semibold text-[11px]">动销≥20天 或 TOP 20%</div>
              <p className="text-slate-400 text-[10px] mt-1">
                足量铺一层拣货位，相邻地堆整托囤货，<strong>不拆分高层备货</strong>，源头减少补货！
              </p>
            </div>

            {/* 3. 滞销品 */}
            <div className="bg-purple-950/40 border border-purple-500/40 rounded-xl p-3.5 relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono font-bold text-purple-300 text-xs flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-purple-500 text-slate-950 flex items-center justify-center font-black text-[11px]">3</span>
                  滞销品 (SLOW)
                </span>
                <span className="text-[10px] bg-purple-500/20 text-purple-200 border border-purple-500/30 px-1.5 py-0.5 rounded font-bold">
                  ⚡ 免验直决
                </span>
              </div>
              <div className="text-slate-200 font-semibold text-[11px]">动销&lt;5天 或 后 20%</div>
              <p className="text-slate-400 text-[10px] mt-1">
                直接上架<strong>高层备货/滞销区</strong>，严禁挤占一层黄金拣货位，订单需要时再补。
              </p>
            </div>

            {/* 4. 老品 */}
            <div className="bg-blue-950/40 border border-blue-500/40 rounded-xl p-3.5 relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono font-bold text-blue-300 text-xs flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-blue-500 text-slate-950 flex items-center justify-center font-black text-[11px]">4</span>
                  老品 (REGULAR)
                </span>
                <span className="text-[10px] bg-blue-500/20 text-blue-200 border border-blue-500/30 px-1.5 py-0.5 rounded font-bold">
                  🔍 校验库存
                </span>
              </div>
              <div className="text-slate-200 font-semibold text-[11px]">常规在售排除前三者</div>
              <p className="text-slate-400 text-[10px] mt-1">
                <strong>仅老品校验一层库存</strong>：库存&lt;30天均销*系数则上架一层，否则同架二三层备货位。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Four Concrete Strategy Configuration Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: 新品与爆品判定规则 */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <PackagePlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  新品判定与直决规则 (优先级 #1)
                </h3>
                <p className="text-[11px] text-slate-500">
                  首次入库商品免验拣货区库存，快速上架可售
                </p>
              </div>
            </div>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-mono px-2 py-0.5 rounded font-semibold">
              直通一层拣选位
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <span className="font-semibold text-slate-800">新品判定条件:</span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  WMS 系统内无任何历史入库收货记录 (首次入库 SKU)
                </p>
              </div>
              <span className="font-bold text-emerald-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                系统历史记录 = 0
              </span>
            </div>

            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <span className="font-semibold text-slate-800">上架目标与直决机制:</span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  不校验一层当前库存（通常为0），推荐直上一层黄金拣货区
                </p>
              </div>
              <span className="font-bold text-blue-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                一层拣货位 (免验)
              </span>
            </div>
          </div>

          {/* 爆品判定 */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    爆品判定与囤货规则 (优先级 #2)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    A 类高频出库品，从源头杜绝频繁高低位补货
                  </p>
                </div>
              </div>
              <span className="text-xs bg-amber-100 text-amber-800 font-mono px-2 py-0.5 rounded font-semibold">
                地堆整托 + 一层足量
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <label className="text-slate-500 block mb-1">近 30 天动销天数阈值:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="10"
                    max="30"
                    value={localConfig.hotProductRule.minActiveDays30d}
                    onChange={(e) =>
                      setLocalConfig((prev) => ({
                        ...prev,
                        hotProductRule: {
                          ...prev.hotProductRule,
                          minActiveDays30d: parseInt(e.target.value) || 20,
                        },
                      }))
                    }
                    className="w-16 bg-white border border-slate-300 rounded px-2 py-1 font-bold text-center text-xs"
                  />
                  <span className="text-slate-700 font-semibold">天及以上 (默认20天)</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <label className="text-slate-500 block mb-1">出库量 TOP 占比判定:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="5"
                    max="40"
                    value={localConfig.hotProductRule.topSalesPercent}
                    onChange={(e) =>
                      setLocalConfig((prev) => ({
                        ...prev,
                        hotProductRule: {
                          ...prev.hotProductRule,
                          topSalesPercent: parseInt(e.target.value) || 20,
                        },
                      }))
                    }
                    className="w-16 bg-white border border-slate-300 rounded px-2 py-1 font-bold text-center text-xs"
                  />
                  <span className="text-slate-700 font-semibold">% 头部爆品 (默认20%)</span>
                </div>
              </div>
            </div>

            <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200 text-xs text-amber-950 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                <span>爆品上架核心策略：</span>
              </div>
              <p className="text-[11px] text-amber-900 leading-relaxed">
                足量铺满一层拣货位；相邻绿色地堆区可整托囤货，<strong>不拆分至高层备货位</strong>，从源头消除叉车频繁往返补货。
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: 滞销品与老品上架逻辑 */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                <Archive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  滞销品判定与直决规则 (优先级 #3)
                </h3>
                <p className="text-[11px] text-slate-500">
                  C 类长尾低动销商品，直接上架高层或滞销专区
                </p>
              </div>
            </div>
            <span className="text-xs bg-purple-100 text-purple-800 font-mono px-2 py-0.5 rounded font-semibold">
              直通高层/滞销区
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <label className="text-slate-500 block mb-1">近 30 天动销天数小于:</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={localConfig.slowProductRule.maxActiveDays30d}
                  onChange={(e) =>
                    setLocalConfig((prev) => ({
                      ...prev,
                      slowProductRule: {
                        ...prev.slowProductRule,
                        maxActiveDays30d: parseInt(e.target.value) || 5,
                      },
                    }))
                  }
                  className="w-16 bg-white border border-slate-300 rounded px-2 py-1 font-bold text-center text-xs"
                />
                <span className="text-slate-700 font-semibold">天 (默认 &lt; 5天)</span>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <label className="text-slate-500 block mb-1">出库量后百分比:</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="5"
                  max="40"
                  value={localConfig.slowProductRule.bottomSalesPercent}
                  onChange={(e) =>
                    setLocalConfig((prev) => ({
                      ...prev,
                      slowProductRule: {
                        ...prev.slowProductRule,
                        bottomSalesPercent: parseInt(e.target.value) || 20,
                      },
                    }))
                  }
                  className="w-16 bg-white border border-slate-300 rounded px-2 py-1 font-bold text-center text-xs"
                />
                <span className="text-slate-700 font-semibold">% 倒数低动销 (默认20%)</span>
              </div>
            </div>
          </div>

          {/* 老品上架逻辑 (仅老品校验库存) */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    老品上架逻辑 (优先级 #4 · 仅老品校验库存)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    排除新品/爆品/滞销品后，严格校验一层拣货区库存
                  </p>
                </div>
              </div>
              <span className="text-xs bg-blue-100 text-blue-800 font-mono px-2 py-0.5 rounded font-semibold">
                库存阈值比对
              </span>
            </div>

            <div className="bg-blue-50/50 p-3.5 rounded-xl border border-blue-200 text-xs text-blue-950 space-y-2">
              <div className="font-bold flex items-center justify-between">
                <span>老品库存决策公式：</span>
                <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded font-mono">
                  严格判定式
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-blue-200 font-mono text-[11px] space-y-1 text-slate-800">
                <div>
                  <strong>IF</strong> 一层拣货位可用库存 &lt; 近 30 天平均销量 × 品类调整系数:
                </div>
                <div className="text-blue-700 pl-4 font-bold">
                  &rarr; 推荐上架【一层拣货位】(补足拣选存量)
                </div>
                <div>
                  <strong>ELSE:</strong>
                </div>
                <div className="text-emerald-700 pl-4 font-bold">
                  &rarr; 推荐上架【同架 / 邻架二三层备货位】(高位立体存储)
                </div>
              </div>
              <p className="text-[10px] text-blue-800">
                * 30 天平均销量 = 近 30 天出库总件数 ÷ 30，剔除已标记的大促异常波动日。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. 30天均销与大促异常波动日标记剔除 */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                30 天平均销量计算与大促异常波动日剔除管理
              </h3>
              <p className="text-[11px] text-slate-500">
                出库总件数 ÷ 30 天，标记剔除极端峰值大促日，避免常规日均销被严重虚高
              </p>
            </div>
          </div>
          <div className="text-xs text-slate-500">
            已配置异常日: <strong className="text-slate-800 font-mono">{localConfig.promoAnomalies.length}</strong> 个
            (剔除中: <strong className="text-indigo-600 font-mono">{localConfig.promoAnomalies.filter(p => p.excluded).length}</strong> 个)
          </div>
        </div>

        {/* Promo Days Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                <th className="p-2.5">大促异常日期</th>
                <th className="p-2.5">活动 / 波动事件说明</th>
                <th className="p-2.5">销量暴涨倍数</th>
                <th className="p-2.5 text-center">当前状态</th>
                <th className="p-2.5 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {localConfig.promoAnomalies.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="p-2.5 font-mono font-bold text-slate-800">
                    {item.date}
                  </td>
                  <td className="p-2.5 font-semibold text-slate-700">
                    {item.name}
                  </td>
                  <td className="p-2.5 font-mono text-amber-600 font-bold">
                    +{item.multiplier}x 异常峰值
                  </td>
                  <td className="p-2.5 text-center">
                    <button
                      onClick={() => handleTogglePromoExcluded(item.id)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                        item.excluded
                          ? 'bg-red-100 text-red-700 border border-red-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {item.excluded ? '已剔除计销' : '计入常态'}
                    </button>
                  </td>
                  <td className="p-2.5 text-center">
                    <button
                      onClick={() => handleDeletePromoAnomaly(item.id)}
                      className="text-slate-400 hover:text-red-600 cursor-pointer"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add Promo Day Bar */}
        <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
          <span className="font-semibold text-slate-700">新增大促异常日:</span>
          <input
            type="date"
            value={newPromoDate}
            onChange={(e) => setNewPromoDate(e.target.value)}
            className="bg-white border border-slate-300 rounded px-2.5 py-1 text-xs"
          />
          <input
            type="text"
            placeholder="活动说明 (例如: 双11开门红)"
            value={newPromoName}
            onChange={(e) => setNewPromoName(e.target.value)}
            className="bg-white border border-slate-300 rounded px-2.5 py-1 text-xs flex-1 min-w-[160px]"
          />
          <div className="flex items-center gap-1">
            <span className="text-slate-400">暴涨倍数:</span>
            <input
              type="number"
              step="0.5"
              min="1.5"
              max="20"
              value={newPromoMultiplier}
              onChange={(e) => setNewPromoMultiplier(parseFloat(e.target.value) || 3.0)}
              className="w-16 bg-white border border-slate-300 rounded px-2 py-1 text-center font-bold text-xs"
            />
          </div>
          <button
            onClick={handleAddPromoAnomaly}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1 rounded text-xs cursor-pointer shadow-sm"
          >
            添加并剔除
          </button>
        </div>
      </div>
    </div>
  );
};
