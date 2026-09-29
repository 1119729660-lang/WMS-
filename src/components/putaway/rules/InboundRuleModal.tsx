import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Eye,
  CheckCircle2,
  AlertCircle,
  Layers,
  Info,
  Sliders,
  ShieldAlert,
  ArrowRightLeft,
  Box,
} from 'lucide-react';
import {
  InboundTypeRule,
  InboundRuleConditionKey,
  CONDITION_LABEL_MAP,
  RecommendedZoneOption,
  RecommendedStrategyOption,
  WarehouseLocation,
  InboundExecutionPolicy,
  DEFAULT_INBOUND_EXECUTION_POLICY,
} from '../../../types/putaway';
import { RackSelectorModal } from './RackSelectorModal';

interface InboundRuleModalProps {
  isOpen: boolean;
  mode: 'CREATE' | 'EDIT';
  initialRule?: InboundTypeRule | null;
  existingRules: InboundTypeRule[];
  locations: WarehouseLocation[];
  onClose: () => void;
  onSave: (rule: InboundTypeRule, andAddNew?: boolean) => void;
  onPreviewMatch: (rule: InboundTypeRule) => void;
}

const CONDITION_KEYS: InboundRuleConditionKey[] = [
  'IS_FIRST_INBOUND',
  'IS_PICK_PLUS_BATCH_GTE_30D_SALES',
  'IS_ACTIVE_DAYS_GT_20',
  'IS_PICK_STOCK_GT_30D_SALES',
  'IS_BELOW_SAFETY_AND_SALES_GTE_THRESHOLD',
  'IS_HIGH_VALUE',
  'IS_BULK_OR_OVERWEIGHT',
  'IS_DEAD_STOCK_90D',
  'IS_HOT_TOP_N_PERCENT',
];

const ZONE_OPTIONS: RecommendedZoneOption[] = [
  '拣货层',
  '备货层',
  '地堆区',
  '高价值专区',
  '滞销存放区',
];

const STRATEGY_OPTIONS: RecommendedStrategyOption[] = [
  '同位优先',
  '就近空位',
  '指定货架范围',
];

export const InboundRuleModal: React.FC<InboundRuleModalProps> = ({
  isOpen,
  mode,
  initialRule,
  existingRules,
  locations,
  onClose,
  onSave,
  onPreviewMatch,
}) => {
  // Form fields
  const [ruleId, setRuleId] = useState('');
  const [name, setName] = useState('');
  const [priority, setPriority] = useState<number>(10);
  const [status, setStatus] = useState<'ENABLED' | 'DISABLED'>('ENABLED');

  const [conditionMode, setConditionMode] = useState<'AND' | 'OR'>('AND');
  const [conditions, setConditions] = useState<InboundRuleConditionKey[]>([]);

  const [recommendedZone, setRecommendedZone] = useState<RecommendedZoneOption | ''>('');
  const [recommendedStrategy, setRecommendedStrategy] = useState<RecommendedStrategyOption | ''>('');
  const [specifiedRacks, setSpecifiedRacks] = useState<string[]>([]);

  // 12项执行与去向推荐策略高级参数
  const [recommendedTargetDirection, setRecommendedTargetDirection] = useState(
    DEFAULT_INBOUND_EXECUTION_POLICY.recommendedTargetDirection
  );
  const [skipPickStockCheck, setSkipPickStockCheck] = useState<boolean>(
    DEFAULT_INBOUND_EXECUTION_POLICY.skipPickStockCheck
  );
  const [initialMaxStockLimit, setInitialMaxStockLimit] = useState<number>(
    DEFAULT_INBOUND_EXECUTION_POLICY.initialMaxStockLimit
  );
  const [routingStrategy, setRoutingStrategy] = useState<string>(
    DEFAULT_INBOUND_EXECUTION_POLICY.routingStrategy
  );
  const [directNoSplitReserve, setDirectNoSplitReserve] = useState<boolean>(
    DEFAULT_INBOUND_EXECUTION_POLICY.directNoSplitReserve
  );
  const [storageDirection, setStorageDirection] = useState<string>(
    DEFAULT_INBOUND_EXECUTION_POLICY.storageDirection
  );
  const [prohibitPickLayer1, setProhibitPickLayer1] = useState<boolean>(
    DEFAULT_INBOUND_EXECUTION_POLICY.prohibitPickLayer1
  );
  const [forceDirectHighBay, setForceDirectHighBay] = useState<boolean>(
    DEFAULT_INBOUND_EXECUTION_POLICY.forceDirectHighBay
  );
  const [shortageRecommendation, setShortageRecommendation] = useState<string>(
    DEFAULT_INBOUND_EXECUTION_POLICY.shortageRecommendation
  );
  const [sufficientRecommendation, setSufficientRecommendation] = useState<string>(
    DEFAULT_INBOUND_EXECUTION_POLICY.sufficientRecommendation
  );
  const [safetyStockCoeff, setSafetyStockCoeff] = useState<number>(
    DEFAULT_INBOUND_EXECUTION_POLICY.safetyStockCoeff
  );
  const [capacityOverflowProtection, setCapacityOverflowProtection] = useState<boolean>(
    DEFAULT_INBOUND_EXECUTION_POLICY.capacityOverflowProtection
  );

  const [notes, setNotes] = useState('');

  // UI state
  const [isRackSelectorOpen, setIsRackSelectorOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize or reset form
  useEffect(() => {
    if (!isOpen) return;

    if (mode === 'EDIT' && initialRule) {
      setRuleId(initialRule.id);
      setName(initialRule.name);
      setPriority(initialRule.priority);
      setStatus(initialRule.status);
      setConditionMode(initialRule.conditionMode);
      setConditions(initialRule.conditions);
      setRecommendedZone(initialRule.recommendedZone);
      setRecommendedStrategy(initialRule.recommendedStrategy);
      setSpecifiedRacks(initialRule.specifiedRacks || []);
      setNotes(initialRule.notes || '');

      // Load 12 execution policy fields
      const p = initialRule.executionPolicy || DEFAULT_INBOUND_EXECUTION_POLICY;
      setRecommendedTargetDirection(p.recommendedTargetDirection);
      setSkipPickStockCheck(p.skipPickStockCheck);
      setInitialMaxStockLimit(p.initialMaxStockLimit);
      setRoutingStrategy(p.routingStrategy);
      setDirectNoSplitReserve(p.directNoSplitReserve);
      setStorageDirection(p.storageDirection);
      setProhibitPickLayer1(p.prohibitPickLayer1);
      setForceDirectHighBay(p.forceDirectHighBay);
      setShortageRecommendation(p.shortageRecommendation);
      setSufficientRecommendation(p.sufficientRecommendation);
      setSafetyStockCoeff(p.safetyStockCoeff);
      setCapacityOverflowProtection(p.capacityOverflowProtection);
    } else {
      // Create new: generate next rule ID
      const nextNum = existingRules.length + 1;
      const genId = `RULE-2026-${String(nextNum).padStart(3, '0')}`;
      setRuleId(genId);
      setName('');
      setPriority(10);
      setStatus('ENABLED');
      setConditionMode('AND');
      setConditions([]);
      setRecommendedZone('');
      setRecommendedStrategy('');
      setSpecifiedRacks([]);
      setNotes('');

      // Default execution policy
      setRecommendedTargetDirection(DEFAULT_INBOUND_EXECUTION_POLICY.recommendedTargetDirection);
      setSkipPickStockCheck(DEFAULT_INBOUND_EXECUTION_POLICY.skipPickStockCheck);
      setInitialMaxStockLimit(DEFAULT_INBOUND_EXECUTION_POLICY.initialMaxStockLimit);
      setRoutingStrategy(DEFAULT_INBOUND_EXECUTION_POLICY.routingStrategy);
      setDirectNoSplitReserve(DEFAULT_INBOUND_EXECUTION_POLICY.directNoSplitReserve);
      setStorageDirection(DEFAULT_INBOUND_EXECUTION_POLICY.storageDirection);
      setProhibitPickLayer1(DEFAULT_INBOUND_EXECUTION_POLICY.prohibitPickLayer1);
      setForceDirectHighBay(DEFAULT_INBOUND_EXECUTION_POLICY.forceDirectHighBay);
      setShortageRecommendation(DEFAULT_INBOUND_EXECUTION_POLICY.shortageRecommendation);
      setSufficientRecommendation(DEFAULT_INBOUND_EXECUTION_POLICY.sufficientRecommendation);
      setSafetyStockCoeff(DEFAULT_INBOUND_EXECUTION_POLICY.safetyStockCoeff);
      setCapacityOverflowProtection(DEFAULT_INBOUND_EXECUTION_POLICY.capacityOverflowProtection);
    }
    setErrorMsg(null);
  }, [isOpen, mode, initialRule, existingRules]);

  if (!isOpen) return null;

  const toggleCondition = (key: InboundRuleConditionKey) => {
    setConditions((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSelectAllConditions = (selectAll: boolean) => {
    setConditions(selectAll ? [...CONDITION_KEYS] : []);
  };

  const validateForm = (): boolean => {
    // 1. 类型名称
    if (!name.trim()) {
      setErrorMsg('请填写类型名称');
      return false;
    }
    if (name.trim().length > 50) {
      setErrorMsg('类型名称最多支持 50 个字符');
      return false;
    }

    // Check duplicate name in same warehouse
    const isDuplicate = existingRules.some(
      (r) => r.name.trim().toLowerCase() === name.trim().toLowerCase() && r.id !== ruleId
    );
    if (isDuplicate) {
      setErrorMsg(`类型名称「${name.trim()}」已存在，同仓库下规则名称不可重复`);
      return false;
    }

    // 2. 优先级
    if (!priority || priority < 1 || !Number.isInteger(Number(priority))) {
      setErrorMsg('优先级必须为大于等于 1 的正整数');
      return false;
    }

    // 3. 可选条件列表 (至少勾选 1 项)
    if (conditions.length === 0) {
      setErrorMsg('请至少选择一条判定条件');
      return false;
    }

    // 4. 推荐货区
    if (!recommendedZone) {
      setErrorMsg('请选择推荐货区');
      return false;
    }

    // 5. 推荐货架策略
    if (!recommendedStrategy) {
      setErrorMsg('请选择推荐货架策略');
      return false;
    }

    // 6. 指定货架范围
    if (recommendedStrategy === '指定货架范围' && specifiedRacks.length === 0) {
      setErrorMsg('推荐货架策略为指定货架范围时，必须指定至少一个货架编码');
      return false;
    }

    // 7. 首批建议铺货上限
    if (initialMaxStockLimit < 0) {
      setErrorMsg('首批建议铺货上限不能小于 0');
      return false;
    }

    setErrorMsg(null);
    return true;
  };

  const buildExecutionPolicy = (): InboundExecutionPolicy => {
    return {
      recommendedTargetDirection: recommendedTargetDirection.trim() || '推荐上架【一层拣货位】',
      skipPickStockCheck,
      initialMaxStockLimit: Number(initialMaxStockLimit) || 80,
      routingStrategy: routingStrategy.trim() || '大件 / 整托去地堆托盘区',
      directNoSplitReserve,
      storageDirection: storageDirection.trim() || '高层三层 / 滞销专区（长尾订单需补）',
      prohibitPickLayer1,
      forceDirectHighBay,
      shortageRecommendation: shortageRecommendation.trim() || '推荐上架【一层黄金拣货位】补足拣货',
      sufficientRecommendation: sufficientRecommendation.trim() || '推荐上架【同架 / 邻架二三层备货位】',
      safetyStockCoeff: Number(safetyStockCoeff) || 1.0,
      capacityOverflowProtection,
    };
  };

  const buildRuleObject = (): InboundTypeRule => {
    return {
      id: ruleId,
      name: name.trim(),
      priority: Number(priority),
      status,
      conditionMode,
      conditions,
      recommendedZone: recommendedZone as RecommendedZoneOption,
      recommendedStrategy: recommendedStrategy as RecommendedStrategyOption,
      specifiedRacks: recommendedStrategy === '指定货架范围' ? specifiedRacks : undefined,
      notes: notes.trim(),
      executionPolicy: buildExecutionPolicy(),
      updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
    };
  };

  const handleSave = (andAddNew: boolean = false) => {
    if (!validateForm()) return;
    const ruleObj = buildRuleObject();
    onSave(ruleObj, andAddNew);

    if (andAddNew) {
      // 保留基础信息内容，清空条件和上架推荐配置
      const nextNum = existingRules.length + 2;
      setRuleId(`RULE-2026-${String(nextNum).padStart(3, '0')}`);
      setConditions([]);
      setRecommendedZone('');
      setRecommendedStrategy('');
      setSpecifiedRacks([]);
      setNotes('');
      setErrorMsg(null);
    }
  };

  const handlePreview = () => {
    // 预览命中允许直接构建未保存对象传递给测试弹窗
    const tempRule: InboundTypeRule = {
      id: ruleId || 'RULE-PREVIEW',
      name: name.trim() || '未命名临时规则',
      priority: Number(priority) || 10,
      status,
      conditionMode,
      conditions: conditions.length > 0 ? conditions : ['IS_FIRST_INBOUND'],
      recommendedZone: (recommendedZone || '拣货层') as RecommendedZoneOption,
      recommendedStrategy: (recommendedStrategy || '同位优先') as RecommendedStrategyOption,
      specifiedRacks,
      notes,
      executionPolicy: buildExecutionPolicy(),
    };
    onPreviewMatch(tempRule);
  };

  const isSaveDisabled = conditions.length === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh] my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>{mode === 'CREATE' ? '新增来货类型规则' : '编辑来货类型规则'}</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-bold">
                {ruleId}
              </span>
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body - 5 Sections */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* ========================================================= */}
          {/* 区域 1 ｜ 基础信息区 */}
          {/* ========================================================= */}
          <div className="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-200">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[11px]">
                1
              </span>
              <h3 className="font-bold text-slate-900 text-xs sm:text-sm">区域 1 ｜ 基础信息区</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              {/* 类型名称 */}
              <div className="sm:col-span-6 space-y-1.5">
                <label className="font-bold text-slate-700 flex items-center gap-1">
                  <span>类型名称</span>
                  <span className="text-red-500">*</span>
                  <span className="text-[11px] text-slate-400 font-normal">(1~50字符)</span>
                </label>
                <input
                  type="text"
                  placeholder="例如: 首次入库新品直入拣选层..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={50}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* 优先级 */}
              <div className="sm:col-span-3 space-y-1.5">
                <label className="font-bold text-slate-700 flex items-center gap-1">
                  <span>优先级</span>
                  <span className="text-red-500">*</span>
                  <span className="text-[11px] text-slate-400 font-normal">(越小越优先)</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={priority}
                  onChange={(e) => setPriority(parseInt(e.target.value) || 1)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* 规则状态 */}
              <div className="sm:col-span-3 space-y-1.5">
                <label className="font-bold text-slate-700 flex items-center gap-1">
                  <span>规则状态</span>
                  <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2 pt-1">
                  <label
                    onClick={() => setStatus('ENABLED')}
                    className={`flex-1 py-1.5 px-3 rounded-xl border text-center font-bold text-xs cursor-pointer transition-all ${
                      status === 'ENABLED'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-2 ring-emerald-500/20'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    启用
                  </label>
                  <label
                    onClick={() => setStatus('DISABLED')}
                    className={`flex-1 py-1.5 px-3 rounded-xl border text-center font-bold text-xs cursor-pointer transition-all ${
                      status === 'DISABLED'
                        ? 'bg-slate-200 border-slate-400 text-slate-800 ring-2 ring-slate-400/20'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    禁用
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 区域 2 ｜ 条件组合设置区 */}
          {/* ========================================================= */}
          <div className="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2.5 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[11px]">
                  2
                </span>
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm">区域 2 ｜ 条件组合设置区</h3>
                <span className="text-red-500">* (至少勾选 1 项)</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectAllConditions(true)}
                  className="px-2 py-0.5 text-[11px] rounded bg-white border border-slate-200 text-blue-600 hover:bg-blue-50 font-semibold cursor-pointer"
                >
                  全选条件
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectAllConditions(false)}
                  className="px-2 py-0.5 text-[11px] rounded bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  清空条件
                </button>
              </div>
            </div>

            {/* 条件组合逻辑 */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white p-3 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-800 shrink-0">条件组合逻辑:</span>
              <select
                value={conditionMode}
                onChange={(e) => setConditionMode(e.target.value as 'AND' | 'OR')}
                className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 font-bold text-xs text-slate-800 focus:bg-white"
              >
                <option value="AND">全部满足 (AND) - 勾选的所有条件必须全部成立才命中规则</option>
                <option value="OR">满足任一 (OR) - 勾选条件中任意一条成立即可命中规则</option>
              </select>
              <span className="text-[11px] text-slate-400">
                {conditionMode === 'AND'
                  ? '需满足全部已勾选条件'
                  : '只需满足其中任一勾选条件'}
              </span>
            </div>

            {/* 可选条件清单 (多选框组) */}
            <div className="space-y-2">
              <label className="font-bold text-slate-700 block">
                可选条件清单 <span className="text-slate-400 font-normal">（已勾选 {conditions.length} 项）</span>:
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {CONDITION_KEYS.map((key) => {
                  const isChecked = conditions.includes(key);
                  const label = CONDITION_LABEL_MAP[key];

                  return (
                    <div
                      key={key}
                      onClick={() => toggleCondition(key)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                        isChecked
                          ? 'bg-blue-50/70 border-blue-400 text-blue-950 ring-1 ring-blue-400/30'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="rounded text-blue-600 focus:ring-blue-500 mt-0.5 pointer-events-none"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-xs leading-snug">{label}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {conditions.length === 0 && (
                <p className="text-amber-600 text-[11px] font-semibold mt-1">
                  ⚠️ 请至少选择一条判定条件，否则无法保存生效。
                </p>
              )}
            </div>
          </div>

          {/* ========================================================= */}
          {/* 区域 3 ｜ 上架推荐目标配置区 */}
          {/* ========================================================= */}
          <div className="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-200">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[11px]">
                3
              </span>
              <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                区域 3 ｜ 上架推荐目标配置区
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 推荐货区 */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 flex items-center gap-1">
                  <span>推荐货区</span>
                  <span className="text-red-500">*</span>
                </label>
                <select
                  value={recommendedZone}
                  onChange={(e) => setRecommendedZone(e.target.value as RecommendedZoneOption)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="">-- 请选择推荐货区 --</option>
                  {ZONE_OPTIONS.map((z) => (
                    <option key={z} value={z}>
                      {z}
                    </option>
                  ))}
                </select>
              </div>

              {/* 推荐货架策略 */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 flex items-center gap-1">
                  <span>推荐货架策略</span>
                  <span className="text-red-500">*</span>
                </label>
                <select
                  value={recommendedStrategy}
                  onChange={(e) =>
                    setRecommendedStrategy(e.target.value as RecommendedStrategyOption)
                  }
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="">-- 请选择推荐货架策略 --</option>
                  {STRATEGY_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 指定货架范围控件 (当推荐货架策略选中【指定货架范围】时渲染展示，其他隐藏 DOM) */}
            {recommendedStrategy === '指定货架范围' && (
              <div className="p-4 bg-white rounded-xl border border-blue-200 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 flex items-center gap-1">
                    <span>指定货架范围</span>
                    <span className="text-red-500">*</span>
                    <span className="text-slate-400 font-normal">(支持多选货架或货架组)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsRackSelectorOpen(true)}
                    className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>选择货架</span>
                  </button>
                </div>

                {specifiedRacks.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 p-3 rounded-lg border border-slate-200 min-h-[44px]">
                    {specifiedRacks.map((rackCode) => (
                      <span
                        key={rackCode}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-blue-200 text-blue-800 font-mono font-bold text-xs shadow-2xs"
                      >
                        <span>{rackCode}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setSpecifiedRacks((prev) => prev.filter((r) => r !== rackCode))
                          }
                          className="text-slate-400 hover:text-red-600 cursor-pointer ml-0.5"
                          title="移除该货架"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div
                    onClick={() => setIsRackSelectorOpen(true)}
                    className="p-4 text-center border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-xl cursor-pointer text-slate-400 text-xs bg-slate-50/50"
                  >
                    点击在此选择指定范围货架编码（必填）
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* 区域 4 ｜ 执行机制与去向策略高级配置 (新增 12 项配置) */}
          {/* ========================================================= */}
          <div className="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[11px]">
                  4
                </span>
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                  区域 4 ｜ 执行机制与去向策略高级配置
                </h3>
              </div>
            </div>

            {/* 4组策略卡片式排布 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 卡片 A: 上架去向与直执机制 */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3.5 shadow-2xs">
                <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5 pb-1 border-b border-slate-100">
                  <Box className="w-4 h-4 text-blue-600" />
                  <span>1. 上架去向与直执机制</span>
                </div>

                {/* 1. 推荐上架去向 */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 flex items-center justify-between">
                    <span>推荐上架去向</span>
                    <span className="text-[10px] text-slate-400 font-normal">支持直接填写或选建议</span>
                  </label>
                  <input
                    type="text"
                    value={recommendedTargetDirection}
                    onChange={(e) => setRecommendedTargetDirection(e.target.value)}
                    placeholder="例如: 推荐上架【一层拣货位】"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-semibold focus:bg-white"
                  />
                  <div className="flex flex-wrap gap-1 pt-1">
                    {[
                      '推荐上架【一层拣货位】',
                      '推荐上架【绿色地堆托盘区】',
                      '推荐上架【高层三层 / 滞销专区】',
                      '推荐上架【高价值专柜防盗区】',
                    ].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setRecommendedTargetDirection(preset)}
                        className="text-[10px] bg-slate-100 hover:bg-blue-50 hover:text-blue-700 px-2 py-0.5 rounded border border-slate-200 text-slate-600 transition-colors"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. 直执机制（免除拣货库存） */}
                <div className="flex items-center justify-between pt-1">
                  <div className="pr-2">
                    <div className="font-bold text-slate-800">直执机制（免除拣货库存）</div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      开启后直接锁定货位，跳过拣货货架校验
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSkipPickStockCheck(!skipPickStockCheck)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      skipPickStockCheck ? 'bg-blue-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        skipPickStockCheck ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* 3. 首批建议铺货上限 */}
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <div className="font-bold text-slate-800">首批建议铺货上限</div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      限制单次铺货进一层拣选的最大容量
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <input
                      type="number"
                      min="1"
                      max="9999"
                      value={initialMaxStockLimit}
                      onChange={(e) => setInitialMaxStockLimit(parseInt(e.target.value) || 0)}
                      className="w-20 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-center font-bold font-mono text-xs focus:bg-white"
                    />
                    <span className="text-slate-600 font-medium">件</span>
                  </div>
                </div>
              </div>

              {/* 卡片 B: 分流向与多区存储去向 */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3.5 shadow-2xs">
                <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5 pb-1 border-b border-slate-100">
                  <ArrowRightLeft className="w-4 h-4 text-purple-600" />
                  <span>2. 分流向与多区存储去向</span>
                </div>

                {/* 4. 分流向策略 */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">分流向策略</label>
                  <input
                    type="text"
                    value={routingStrategy}
                    onChange={(e) => setRoutingStrategy(e.target.value)}
                    placeholder="大件 / 整托去地堆托盘区"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-semibold focus:bg-white"
                  />
                  <div className="flex flex-wrap gap-1 pt-1">
                    {[
                      '大件 / 整托去地堆托盘区',
                      '先补拣货层，余量入备货层',
                      '标准件优先入一层拣货区',
                    ].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setRoutingStrategy(p)}
                        className="text-[10px] bg-slate-100 hover:bg-purple-50 hover:text-purple-700 px-2 py-0.5 rounded border border-slate-200 text-slate-600 transition-colors"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. 免除拣货库存直决 */}
                <div className="flex items-center justify-between pt-1">
                  <div className="pr-2">
                    <div className="font-bold text-slate-800">免除拣货库存直决</div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      不拆分高层备货区，源头减少后续补货
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDirectNoSplitReserve(!directNoSplitReserve)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      directNoSplitReserve ? 'bg-purple-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        directNoSplitReserve ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* 6. 推荐存储去向 */}
                <div className="space-y-1 pt-1">
                  <label className="font-bold text-slate-700">推荐存储去向</label>
                  <input
                    type="text"
                    value={storageDirection}
                    onChange={(e) => setStorageDirection(e.target.value)}
                    placeholder="高层三层 / 滞销专区（长尾订单需补）"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-semibold focus:bg-white"
                  />
                </div>
              </div>

              {/* 卡片 C: 拣选层管控与防错机制 */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3.5 shadow-2xs">
                <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5 pb-1 border-b border-slate-100">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <span>3. 拣选层管控与防错机制</span>
                </div>

                {/* 7. 严禁上架一层拣选区 */}
                <div className="flex items-center justify-between">
                  <div className="pr-2">
                    <div className="font-bold text-slate-800">严禁上架一层拣选区</div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      防止低动销/滞销品占用一层黄金通道
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setProhibitPickLayer1(!prohibitPickLayer1)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      prohibitPickLayer1 ? 'bg-amber-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        prohibitPickLayer1 ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* 8. 直决免除拣货库存 */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="pr-2">
                    <div className="font-bold text-slate-800">直决免除拣货库存</div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      即使一层库存为 0 也直接上高层
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForceDirectHighBay(!forceDirectHighBay)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      forceDirectHighBay ? 'bg-amber-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        forceDirectHighBay ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* 卡片 D: 动态储位推荐与容量保护 */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3.5 shadow-2xs">
                <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5 pb-1 border-b border-slate-100">
                  <Sliders className="w-4 h-4 text-emerald-600" />
                  <span>4. 动态储位推荐与容量保护</span>
                </div>

                {/* 9. 一层库存不足时推荐储位 */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">一层库存不足时推荐储位</label>
                  <input
                    type="text"
                    value={shortageRecommendation}
                    onChange={(e) => setShortageRecommendation(e.target.value)}
                    placeholder="推荐上架【一层黄金拣货位】补足拣货"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-semibold focus:bg-white"
                  />
                </div>

                {/* 10. 一层库存充足时推荐储位 */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">一层库存充足时推荐储位</label>
                  <input
                    type="text"
                    value={sufficientRecommendation}
                    onChange={(e) => setSufficientRecommendation(e.target.value)}
                    placeholder="推荐上架【同架 / 邻架二三层备货位】"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-semibold focus:bg-white"
                  />
                </div>

                {/* 11. 默认品类安全系数 & 12. 货位容量超限保护 */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-800">默认品类安全系数</div>
                    <p className="text-[10px] text-slate-400">核算库存安全天数</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <input
                      type="number"
                      min="0.1"
                      max="5.0"
                      step="0.1"
                      value={safetyStockCoeff}
                      onChange={(e) => setSafetyStockCoeff(parseFloat(e.target.value) || 1.0)}
                      className="w-16 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-center font-bold font-mono text-xs focus:bg-white"
                    />
                    <span className="text-slate-600 font-medium">× 均销</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="pr-2">
                    <div className="font-bold text-slate-800">货位容量超限保护</div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      一层满仓时强制转二三层
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCapacityOverflowProtection(!capacityOverflowProtection)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      capacityOverflowProtection ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        capacityOverflowProtection ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 区域 5 ｜ 备注 */}
          {/* ========================================================= */}
          <div className="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[11px]">
                  5
                </span>
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm">区域 5 ｜ 备注</h3>
                <span className="text-slate-400 font-normal">(非必填)</span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">{notes.length}/200</span>
            </div>

            <textarea
              placeholder="请输入规则业务说明或配置依据 (最多200字符，仅在配置页面展示，WMS作业端不会展示)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, 200))}
              rows={3}
              maxLength={200}
              className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Modal Footer - Exactly: 预览命中、保存并新增、保存、取消 */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/90 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {/* 预览命中 */}
            <button
              type="button"
              onClick={handlePreview}
              className="px-4 py-2 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="自动带入当前表单填写的全部配置，不需要保存规则即可模拟测试"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>预览命中</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            {/* 保存并新增 */}
            {mode === 'CREATE' && (
              <button
                type="button"
                onClick={() => handleSave(true)}
                disabled={isSaveDisabled}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  isSaveDisabled
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 shadow-2xs'
                }`}
                title="提交成功后不关闭弹窗，保留基础信息内容，清空条件和上架推荐配置，继续新增下一条规则"
              >
                保存并新增
              </button>
            )}

            {/* 保存 */}
            <button
              type="button"
              onClick={() => handleSave(false)}
              disabled={isSaveDisabled}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                isSaveDisabled
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>保存</span>
            </button>

            {/* 取消 */}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              取消
            </button>
          </div>
        </div>
      </div>

      {/* Sub-modal: Rack Selector */}
      <RackSelectorModal
        isOpen={isRackSelectorOpen}
        onClose={() => setIsRackSelectorOpen(false)}
        locations={locations}
        selectedRacks={specifiedRacks}
        onConfirm={(racks) => setSpecifiedRacks(racks)}
      />
    </div>
  );
};
