import React, { useState, useMemo } from 'react';
import {
  Plus,
  Sliders,
  Search,
  CheckCircle2,
  Trash2,
  Edit3,
  Sparkles,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  Play,
  RotateCcw,
  Check,
  X,
  Layers,
  Filter,
  ChevronDown,
  ChevronUp,
  Box,
  ShieldAlert,
} from 'lucide-react';
import {
  InboundTypeRule,
  PutawayStrategyConfig,
  PutawaySKUCandidate,
  WarehouseLocation,
  CONDITION_LABEL_MAP,
  GlobalRuleParameters,
} from '../../types/putaway';
import {
  INITIAL_INBOUND_TYPE_RULES,
  INITIAL_GLOBAL_RULE_PARAMETERS,
  DEFAULT_PUTAWAY_CONFIG,
} from '../../data/mockPutawayData';
import { InboundRuleModal } from './rules/InboundRuleModal';
import { RuleMatchTestModal } from './rules/RuleMatchTestModal';
import { GlobalRuleParamsModal } from './rules/GlobalRuleParamsModal';

interface PutawayRuleConfigTabProps {
  config: PutawayStrategyConfig;
  locations?: WarehouseLocation[];
  candidates?: PutawaySKUCandidate[];
  onUpdateConfig: (newConfig: PutawayStrategyConfig) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'warning') => void;
}

export const PutawayRuleConfigTab: React.FC<PutawayRuleConfigTabProps> = ({
  config,
  locations = [],
  candidates = [],
  onUpdateConfig,
  onShowToast,
}) => {
  // Rules List State
  const [rules, setRules] = useState<InboundTypeRule[]>(INITIAL_INBOUND_TYPE_RULES);
  const [globalParams, setGlobalParams] = useState<GlobalRuleParameters>(
    INITIAL_GLOBAL_RULE_PARAMETERS
  );

  // Selected Row IDs for Table Selection
  const [selectedRuleIds, setSelectedRuleIds] = useState<string[]>([]);

  // Expanded Rule Detail ID
  const [expandedRuleId, setExpandedRuleId] = useState<string | null>(null);

  // Search & Filter
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ENABLED' | 'DISABLED'>('ALL');

  // Sorting: 'name' | 'priority'
  const [sortField, setSortField] = useState<'name' | 'priority'>('priority');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Modals state
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [ruleModalMode, setRuleModalMode] = useState<'CREATE' | 'EDIT'>('CREATE');
  const [editingRule, setEditingRule] = useState<InboundTypeRule | null>(null);

  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testingRule, setTestingRule] = useState<InboundTypeRule | null>(null);

  const [isParamsModalOpen, setIsParamsModalOpen] = useState(false);

  // Secondary Delete Confirm Modal
  const [deleteTargetRule, setDeleteTargetRule] = useState<InboundTypeRule | null>(null);

  // Filter & Sort Rules
  const filteredAndSortedRules = useMemo(() => {
    let result = rules.filter((r) => {
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
      if (searchKeyword.trim()) {
        const q = searchKeyword.toLowerCase();
        return (
          r.name.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q) ||
          r.recommendedZone.toLowerCase().includes(q) ||
          r.recommendedStrategy.toLowerCase().includes(q)
        );
      }
      return true;
    });

    result.sort((a, b) => {
      if (sortField === 'priority') {
        return sortDirection === 'asc' ? a.priority - b.priority : b.priority - a.priority;
      } else {
        return sortDirection === 'asc'
          ? a.name.localeCompare(b.name, 'zh-CN')
          : b.name.localeCompare(a.name, 'zh-CN');
      }
    });

    return result;
  }, [rules, statusFilter, searchKeyword, sortField, sortDirection]);

  // Table selection handlers
  const isAllSelected =
    filteredAndSortedRules.length > 0 &&
    filteredAndSortedRules.every((r) => selectedRuleIds.includes(r.id));

  const handleSelectAll = (select: boolean) => {
    if (select) {
      setSelectedRuleIds(filteredAndSortedRules.map((r) => r.id));
    } else {
      setSelectedRuleIds([]);
    }
  };

  const handleToggleSelectRow = (id: string) => {
    setSelectedRuleIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Sort toggle
  const handleToggleSort = (field: 'name' | 'priority') => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Create & Edit Actions
  const handleOpenCreateModal = () => {
    setRuleModalMode('CREATE');
    setEditingRule(null);
    setIsRuleModalOpen(true);
  };

  const handleOpenEditModal = (rule: InboundTypeRule) => {
    setRuleModalMode('EDIT');
    setEditingRule(rule);
    setIsRuleModalOpen(true);
  };

  const handleSaveRule = (rule: InboundTypeRule, andAddNew: boolean = false) => {
    if (ruleModalMode === 'CREATE') {
      setRules((prev) => [...prev, rule]);
      onShowToast(`已成功新增来货类型规则 [${rule.name}]！`, 'success');
    } else {
      setRules((prev) => prev.map((r) => (r.id === rule.id ? rule : r)));
      onShowToast(`已保存来货类型规则 [${rule.name}] 修改！`, 'success');
    }

    if (!andAddNew) {
      setIsRuleModalOpen(false);
    }
  };

  // Delete Action with Secondary Confirmation
  const handleRequestDelete = (rule: InboundTypeRule) => {
    setDeleteTargetRule(rule);
  };

  const handleConfirmDelete = () => {
    if (!deleteTargetRule) return;
    const targetId = deleteTargetRule.id;
    const targetName = deleteTargetRule.name;
    setRules((prev) => prev.filter((r) => r.id !== targetId));
    setSelectedRuleIds((prev) => prev.filter((id) => id !== targetId));
    setDeleteTargetRule(null);
    onShowToast(`已删除规则 [${targetName}]！`, 'info');
  };

  // Batch actions
  const handleBatchStatus = (newStatus: 'ENABLED' | 'DISABLED') => {
    setRules((prev) =>
      prev.map((r) => (selectedRuleIds.includes(r.id) ? { ...r, status: newStatus } : r))
    );
    onShowToast(`已批量更新 ${selectedRuleIds.length} 条规则状态为 ${newStatus === 'ENABLED' ? '启用' : '禁用'}`, 'success');
  };

  const handleBatchDelete = () => {
    if (
      !window.confirm(
        `确定批量删除选中的 ${selectedRuleIds.length} 条规则？删除后不可恢复。`
      )
    ) {
      return;
    }
    setRules((prev) => prev.filter((r) => !selectedRuleIds.includes(r.id)));
    setSelectedRuleIds([]);
    onShowToast('已成功批量删除所选规则！', 'info');
  };

  // Test match actions
  const handleOpenTestModal = (rule: InboundTypeRule) => {
    setTestingRule(rule);
    setIsTestModalOpen(true);
  };

  return (
    <div className="space-y-5">
      {/* 1. Header Action & Statistics Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-5 text-white border border-slate-700 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[11px] font-mono font-bold px-2 py-0.5 rounded">
              INBOUND TYPE RULES
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-mono px-2 py-0.5 rounded">
              条件组合逻辑 · 目标货区 · 货架策略
            </span>
          </div>
          <h2 className="text-lg font-bold mt-1.5 text-white flex items-center gap-2">
            <span>上架类型规则配置中心</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            支持针对到货 SKU 自定义匹配条件（与/或）、优先级调度、上架推荐货区及货架定位策略
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* 全局参数设置按钮 */}
          <button
            onClick={() => setIsParamsModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-600 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="配置动销天数阈值、日均销量阈值、高价值品门槛等全局参数"
          >
            <Sliders className="w-3.5 h-3.5 text-blue-400" />
            <span>规则参数全局配置</span>
          </button>

          {/* 新增来货类型规则按钮 */}
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>新增来货类型规则</span>
          </button>
        </div>
      </div>

      {/* 2. Filter & Toolbar Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Keyword Search */}
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="搜索规则名称、ID、货区..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              全部 ({rules.length})
            </button>
            <button
              onClick={() => setStatusFilter('ENABLED')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                statusFilter === 'ENABLED'
                  ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              启用 ({rules.filter((r) => r.status === 'ENABLED').length})
            </button>
            <button
              onClick={() => setStatusFilter('DISABLED')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                statusFilter === 'DISABLED'
                  ? 'bg-white text-slate-800 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              禁用 ({rules.filter((r) => r.status === 'DISABLED').length})
            </button>
          </div>
        </div>

        {/* Batch Actions Bar (when rows are selected) */}
        {selectedRuleIds.length > 0 ? (
          <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 animate-fade-in">
            <span className="font-bold text-blue-900">
              已选 {selectedRuleIds.length} 项:
            </span>
            <button
              onClick={() => handleBatchStatus('ENABLED')}
              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
            >
              批量启用
            </button>
            <button
              onClick={() => handleBatchStatus('DISABLED')}
              className="px-2.5 py-1 rounded-lg bg-slate-600 hover:bg-slate-700 text-white font-bold cursor-pointer"
            >
              批量禁用
            </button>
            <button
              onClick={handleBatchDelete}
              className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>批量删除</span>
            </button>
          </div>
        ) : (
          <div className="text-slate-400 font-mono text-[11px]">
            共找到 {filteredAndSortedRules.length} 条生效规则
          </div>
        )}
      </div>

      {/* 3. Main Rules Table */}
      {/* 列表展示字段依次：选择框、规则 ID、类型名称、优先级、条件组合模式、已选条件、推荐货区、推荐货架策略、状态、操作 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-700 font-bold border-b border-slate-200 select-none">
                {/* 1. 选择框 */}
                <th className="p-3.5 text-center w-12">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>

                {/* 2. 规则 ID (只读) */}
                <th className="p-3.5 whitespace-nowrap font-mono text-slate-600">规则 ID</th>

                {/* 3. 类型名称 (支持排序) */}
                <th
                  onClick={() => handleToggleSort('name')}
                  className="p-3.5 whitespace-nowrap cursor-pointer hover:text-blue-600 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>类型名称</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>

                {/* 4. 优先级 (支持排序，数字越小优先级越高) */}
                <th
                  onClick={() => handleToggleSort('priority')}
                  className="p-3.5 whitespace-nowrap text-center cursor-pointer hover:text-blue-600 transition-colors w-24"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>优先级</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>

                {/* 5. 条件组合模式 */}
                <th className="p-3.5 whitespace-nowrap text-center">条件组合模式</th>

                {/* 6. 已选条件 (文字过长折叠处理，鼠标悬浮展示完整内容) */}
                <th className="p-3.5 min-w-[220px]">已选条件</th>

                {/* 7. 推荐货区 */}
                <th className="p-3.5 whitespace-nowrap">推荐货区</th>

                {/* 8. 推荐货架策略 */}
                <th className="p-3.5 whitespace-nowrap">推荐货架策略</th>

                {/* 9. 状态 (启用绿色，禁用灰色) */}
                <th className="p-3.5 whitespace-nowrap text-center">状态</th>

                {/* 10. 操作 (依次为 编辑、删除、测试命中) */}
                <th className="p-3.5 whitespace-nowrap text-center">操作</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredAndSortedRules.map((rule) => {
                const isSelected = selectedRuleIds.includes(rule.id);
                const conditionNames = rule.conditions.map(
                  (key) => CONDITION_LABEL_MAP[key] || key
                );
                const conditionText = conditionNames.join(', ');

                return (
                  <React.Fragment key={rule.id}>
                    <tr
                      className={`hover:bg-blue-50/30 transition-colors ${
                        isSelected ? 'bg-blue-50/50' : ''
                      } ${rule.status === 'DISABLED' ? 'opacity-65 bg-slate-50/30' : ''}`}
                    >
                      {/* 1. 选择框 */}
                      <td className="p-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectRow(rule.id)}
                          className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>

                    {/* 2. 规则 ID (只读不可编辑) */}
                    <td className="p-3.5 whitespace-nowrap font-mono font-bold text-slate-700">
                      {rule.id}
                    </td>

                    {/* 3. 类型名称 */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5">
                        <div
                          className="font-bold text-slate-900 hover:text-blue-600 cursor-pointer"
                          onClick={() => handleOpenEditModal(rule)}
                        >
                          {rule.name}
                        </div>
                        {rule.executionPolicy && (
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedRuleId(expandedRuleId === rule.id ? null : rule.id)
                            }
                            className={`text-[10px] px-1.5 py-0.5 rounded font-semibold flex items-center gap-0.5 transition-colors cursor-pointer shrink-0 ${
                              expandedRuleId === rule.id
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                            }`}
                            title="展开/收起该规则执行机制与去向策略"
                          >
                            <span>策略参数</span>
                            {expandedRuleId === rule.id ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                          </button>
                        )}
                      </div>

                      {/* 12项执行策略核心摘要标签 */}
                      {rule.executionPolicy && (
                        <div className="flex flex-wrap items-center gap-1 mt-1 text-[10px]">
                          <span className="bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.2 rounded font-semibold truncate max-w-[140px]" title={rule.executionPolicy.recommendedTargetDirection}>
                            {rule.executionPolicy.recommendedTargetDirection}
                          </span>
                          <span className={`px-1.5 py-0.2 rounded font-bold ${rule.executionPolicy.skipPickStockCheck ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                            {rule.executionPolicy.skipPickStockCheck ? '免拣货直执' : '需验拣货层'}
                          </span>
                          <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-mono">
                            上限:{rule.executionPolicy.initialMaxStockLimit}件
                          </span>
                          {rule.executionPolicy.prohibitPickLayer1 && (
                            <span className="bg-amber-50 text-amber-800 font-bold px-1.5 py-0.2 rounded">
                              严禁一层
                            </span>
                          )}
                          {rule.executionPolicy.capacityOverflowProtection && (
                            <span className="bg-emerald-50 text-emerald-800 font-semibold px-1 py-0.2 rounded">
                              满仓超限保护
                            </span>
                          )}
                        </div>
                      )}

                      {rule.notes && (
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1 truncate max-w-xs">
                          {rule.notes}
                        </p>
                      )}
                    </td>

                    {/* 4. 优先级 (正整数，数字越小优先级越高) */}
                    <td className="p-3.5 text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 border border-slate-200 font-mono font-bold text-slate-800 text-xs shadow-2xs">
                        {rule.priority}
                      </span>
                    </td>

                    {/* 5. 条件组合模式 (全部满足 (AND) / 满足任一 (OR)) */}
                    <td className="p-3.5 text-center whitespace-nowrap">
                      {rule.conditionMode === 'AND' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          全部满足 (AND)
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          满足任一 (OR)
                        </span>
                      )}
                    </td>

                    {/* 6. 已选条件 (文字过长折叠处理，鼠标悬浮展示完整内容) */}
                    <td className="p-3.5 max-w-[280px]">
                      <div
                        className="truncate text-slate-700 cursor-help group relative inline-block max-w-full"
                        title={conditionText}
                      >
                        <span className="underline decoration-dotted decoration-slate-300">
                          {conditionText}
                        </span>
                      </div>
                    </td>

                    {/* 7. 推荐货区 */}
                    <td className="p-3.5 whitespace-nowrap">
                      <span className="font-semibold text-slate-800">
                        {rule.recommendedZone}
                      </span>
                    </td>

                    {/* 8. 推荐货架策略 */}
                    <td className="p-3.5 whitespace-nowrap">
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <span>{rule.recommendedStrategy}</span>
                        {rule.recommendedStrategy === '指定货架范围' &&
                          rule.specifiedRacks &&
                          rule.specifiedRacks.length > 0 && (
                            <span
                              className="font-mono text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 truncate max-w-[120px]"
                              title={rule.specifiedRacks.join(', ')}
                            >
                              {rule.specifiedRacks.length} 个货架
                            </span>
                          )}
                      </div>
                    </td>

                    {/* 9. 状态 (启用绿色标签，禁用灰色标签) */}
                    <td className="p-3.5 text-center whitespace-nowrap">
                      {rule.status === 'ENABLED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          <span>启用</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                          <span>禁用</span>
                        </span>
                      )}
                    </td>

                    {/* 10. 操作 (依次为 编辑、删除、测试命中) */}
                    <td className="p-3.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        {/* 编辑 */}
                        <button
                          onClick={() => handleOpenEditModal(rule)}
                          className="px-2.5 py-1 text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                          title="编辑该规则"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>编辑</span>
                        </button>

                        {/* 删除 */}
                        <button
                          onClick={() => handleRequestDelete(rule)}
                          className="px-2.5 py-1 text-slate-700 hover:text-red-600 hover:bg-red-50 rounded-lg font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                          title="删除该规则"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>删除</span>
                        </button>

                        {/* 测试命中 */}
                        <button
                          onClick={() => handleOpenTestModal(rule)}
                          className="px-2.5 py-1 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg font-bold transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                          title="测试当前规则与到货SKU的匹配命中情况"
                        >
                          <Play className="w-3 h-3 fill-indigo-600" />
                          <span>测试命中</span>
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* 12项执行机制与推荐策略展开面板 */}
                  {expandedRuleId === rule.id && rule.executionPolicy && (
                    <tr className="bg-indigo-50/40 border-b border-indigo-100 animate-fade-in">
                      <td colSpan={10} className="p-4">
                        <div className="bg-white rounded-xl border border-indigo-200 p-4 space-y-3 shadow-xs">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                              <span className="font-bold text-slate-900 text-xs">
                                【{rule.name}】高级执行机制与去向策略配置详情 (12项参数)
                              </span>
                            </div>
                            <span className="text-[11px] font-mono text-slate-400">
                              规则 ID: {rule.id} · 优先级: #{rule.priority}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                            {/* 块 1 */}
                            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1">
                              <div className="font-bold text-[11px] text-blue-700">
                                1. 上架去向与直执机制
                              </div>
                              <div className="text-slate-600">
                                • 推荐去向: <strong className="text-slate-900">{rule.executionPolicy.recommendedTargetDirection}</strong>
                              </div>
                              <div className="text-slate-600">
                                • 直执机制: <strong className={rule.executionPolicy.skipPickStockCheck ? 'text-emerald-700 font-bold' : 'text-slate-700'}>{rule.executionPolicy.skipPickStockCheck ? '开启 (跳过拣货校验)' : '未开启 (需验库存)'}</strong>
                              </div>
                              <div className="text-slate-600">
                                • 首批建议铺货上限: <strong className="font-mono text-slate-900">{rule.executionPolicy.initialMaxStockLimit} 件</strong>
                              </div>
                            </div>

                            {/* 块 2 */}
                            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1">
                              <div className="font-bold text-[11px] text-purple-700">
                                2. 分流向与多区存储
                              </div>
                              <div className="text-slate-600">
                                • 分流向策略: <strong className="text-slate-900">{rule.executionPolicy.routingStrategy}</strong>
                              </div>
                              <div className="text-slate-600">
                                • 免除拣货库存直决: <strong className={rule.executionPolicy.directNoSplitReserve ? 'text-purple-700 font-bold' : 'text-slate-700'}>{rule.executionPolicy.directNoSplitReserve ? '开启 (不拆分高层备货)' : '未开启'}</strong>
                              </div>
                              <div className="text-slate-600">
                                • 推荐存储去向: <strong className="text-slate-900">{rule.executionPolicy.storageDirection}</strong>
                              </div>
                            </div>

                            {/* 块 3 */}
                            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1">
                              <div className="font-bold text-[11px] text-amber-700">
                                3. 拣选层管控与防错
                              </div>
                              <div className="text-slate-600">
                                • 严禁上架一层: <strong className={rule.executionPolicy.prohibitPickLayer1 ? 'text-amber-800 font-bold' : 'text-slate-700'}>{rule.executionPolicy.prohibitPickLayer1 ? '开启 (防占黄金通道)' : '未开启'}</strong>
                              </div>
                              <div className="text-slate-600">
                                • 直决免除拣货: <strong className={rule.executionPolicy.forceDirectHighBay ? 'text-amber-800 font-bold' : 'text-slate-700'}>{rule.executionPolicy.forceDirectHighBay ? '开启 (一层为0也直入高层)' : '未开启'}</strong>
                              </div>
                            </div>

                            {/* 块 4 */}
                            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1">
                              <div className="font-bold text-[11px] text-emerald-700">
                                4. 动态储位推荐与保护
                              </div>
                              <div className="text-slate-600">
                                • 一层不足储位: <span className="font-bold text-slate-800">{rule.executionPolicy.shortageRecommendation}</span>
                              </div>
                              <div className="text-slate-600">
                                • 一层充足储位: <span className="font-bold text-slate-800">{rule.executionPolicy.sufficientRecommendation}</span>
                              </div>
                              <div className="text-slate-600">
                                • 品类安全系数: <strong className="font-mono text-slate-900">{rule.executionPolicy.safetyStockCoeff} × 均销</strong>
                              </div>
                              <div className="text-slate-600">
                                • 货位超限保护: <strong className={rule.executionPolicy.capacityOverflowProtection ? 'text-emerald-700 font-bold' : 'text-slate-700'}>{rule.executionPolicy.capacityOverflowProtection ? '开启 (一层满仓转二三层)' : '未开启'}</strong>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}

              {filteredAndSortedRules.length === 0 && (
                <tr>
                  <td colSpan={10} className="p-12 text-center text-slate-400 text-xs">
                    <Layers className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">暂无符合条件的来货类型规则</p>
                    <p className="text-slate-400 mt-1">
                      可点击右上角「新增来货类型规则」添加第一条规则
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 弹窗 1：新增 / 编辑来货类型规则弹窗 */}
      {/* ========================================================= */}
      <InboundRuleModal
        isOpen={isRuleModalOpen}
        mode={ruleModalMode}
        initialRule={editingRule}
        existingRules={rules}
        locations={locations}
        onClose={() => setIsRuleModalOpen(false)}
        onSave={handleSaveRule}
        onPreviewMatch={(tempRule) => {
          setTestingRule(tempRule);
          setIsTestModalOpen(true);
        }}
      />

      {/* ========================================================= */}
      {/* 弹窗 2：【规则命中测试】弹窗 */}
      {/* ========================================================= */}
      <RuleMatchTestModal
        isOpen={isTestModalOpen}
        rule={testingRule}
        candidates={candidates}
        locations={locations}
        globalParams={globalParams}
        onClose={() => setIsTestModalOpen(false)}
      />

      {/* ========================================================= */}
      {/* 弹窗 3：【规则全局参数配置】弹窗 */}
      {/* ========================================================= */}
      <GlobalRuleParamsModal
        isOpen={isParamsModalOpen}
        params={globalParams}
        candidates={candidates}
        onClose={() => setIsParamsModalOpen(false)}
        onSave={(newParams) => {
          setGlobalParams(newParams);
          onShowToast('全局判定参数已更新并生效！', 'success');
        }}
      />

      {/* ========================================================= */}
      {/* 弹窗 4：删除二次确认提示 */}
      {/* ========================================================= */}
      {deleteTargetRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 max-w-sm w-full space-y-4 animate-scale-in">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-red-100 text-red-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">删除规则确认</h3>
                <p className="text-xs text-slate-500 font-mono">
                  {deleteTargetRule.id} · {deleteTargetRule.name}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
              确定删除该规则？<strong>删除后不可恢复</strong>，属于该类型的后续到货将不再执行该上架推荐。
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTargetRule(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm cursor-pointer"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
