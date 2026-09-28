import React, { useState } from 'react';
import {
  Layers,
  Clock,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  XCircle,
  Users,
  Send,
  Download,
  Filter,
  PlusCircle,
  Smartphone,
  Sliders,
} from 'lucide-react';
import {
  ReplenishTaskRecord,
  ReplenishmentWorker,
  TaskWarehouseConfig,
  TaskFilterOptions,
  TaskManagementStatus,
  DispatchMode,
} from '../../types/taskManagement';
import {
  INITIAL_TASK_RECORDS,
  INITIAL_WORKERS,
  INITIAL_WAREHOUSE_CONFIGS,
  CandidateSkuForTask,
} from '../../data/initialTaskData';
import { TaskFilterBar } from './TaskFilterBar';
import { TaskTable } from './TaskTable';
import { CreateTaskModal } from './CreateTaskModal';
import { DispatchTaskModal } from './DispatchTaskModal';
import { TaskDetailModal } from './TaskDetailModal';
import { ExceptionCloseModal } from './ExceptionCloseModal';
import { TaskConfigModal } from './TaskConfigModal';
import { WorkerPdaSimModal } from './WorkerPdaSimModal';

interface TaskManagementPageProps {
  currentWarehouseId?: string;
  onSyncWithPickBoard?: (sku: string) => void;
}

export const TaskManagementPage: React.FC<TaskManagementPageProps> = ({
  currentWarehouseId = 'WH-HEIHE-01',
}) => {
  // Master State
  const [tasks, setTasks] = useState<ReplenishTaskRecord[]>(INITIAL_TASK_RECORDS);
  const [workers, setWorkers] = useState<ReplenishmentWorker[]>(INITIAL_WORKERS);
  const [warehouseConfigs, setWarehouseConfigs] = useState<
    Record<string, TaskWarehouseConfig>
  >(INITIAL_WAREHOUSE_CONFIGS);

  // Filter State
  const [filter, setFilter] = useState<TaskFilterOptions>({
    warehouseId: currentWarehouseId,
    status: 'ALL',
    priority: 'ALL',
    worker: 'ALL',
    searchKeyword: '',
    onlyOverdue: false,
  });

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isPdaSimModalOpen, setIsPdaSimModalOpen] = useState(false);
  const [detailTask, setDetailTask] = useState<ReplenishTaskRecord | null>(null);
  const [dispatchTask, setDispatchTask] = useState<ReplenishTaskRecord | null>(null);
  const [exceptionTask, setExceptionTask] = useState<ReplenishTaskRecord | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const currentConfig =
    warehouseConfigs[currentWarehouseId] ||
    INITIAL_WAREHOUSE_CONFIGS['WH-HEIHE-01'];

  // Calculate dynamic warning / escalation flags
  const now = Date.now();
  const enrichedTasks = tasks.map((task) => {
    if (task.status === 'completed' || task.status === 'exception_closed') {
      return task;
    }
    const elapsedMinutes = Math.max(
      task.elapsedMinutes,
      Math.round((now - task.createdTimestamp) / 60000)
    );
    const elapsedHours = elapsedMinutes / 60;
    const isWarning = elapsedHours >= currentConfig.warningThresholdHours;
    const isEscalated = elapsedHours >= currentConfig.escalateThresholdHours;

    return {
      ...task,
      elapsedMinutes,
      isWarning,
      isEscalated,
    };
  });

  // Filter logic
  const filteredTasks = enrichedTasks.filter((task) => {
    if (filter.status !== 'ALL' && task.status !== filter.status) return false;
    if (filter.priority !== 'ALL' && task.priority !== filter.priority) return false;
    if (filter.worker !== 'ALL' && task.claimedBy !== filter.worker) return false;
    if (filter.onlyOverdue && !task.isWarning && !task.isEscalated) return false;
    if (filter.searchKeyword) {
      const kw = filter.searchKeyword.toLowerCase();
      const matchId = task.id.toLowerCase().includes(kw);
      const matchSku = task.sku.toLowerCase().includes(kw);
      const matchProduct = task.productName.toLowerCase().includes(kw);
      const matchLoc =
        task.sourceLocation.toLowerCase().includes(kw) ||
        task.targetLocation.toLowerCase().includes(kw);
      if (!matchId && !matchSku && !matchProduct && !matchLoc) return false;
    }
    return true;
  });

  // KPI Metrics
  const totalCount = enrichedTasks.length;
  const pendingDispatchCount = enrichedTasks.filter(
    (t) => t.status === 'pending_dispatch'
  ).length;
  const inProgressCount = enrichedTasks.filter(
    (t) => t.status === 'in_progress' || t.status === 'claimed'
  ).length;
  const warningCount = enrichedTasks.filter(
    (t) =>
      t.isWarning &&
      !t.isEscalated &&
      t.status !== 'completed' &&
      t.status !== 'exception_closed'
  ).length;
  const escalatedCount = enrichedTasks.filter(
    (t) =>
      t.isEscalated &&
      t.status !== 'completed' &&
      t.status !== 'exception_closed'
  ).length;
  const exceptionCount = enrichedTasks.filter(
    (t) => t.status === 'exception_review'
  ).length;
  const completedCount = enrichedTasks.filter(
    (t) => t.status === 'completed'
  ).length;

  // Actions: 1. Create Tasks with anti-duplicate validation
  const handleCreateTasks = (
    items: {
      candidate: CandidateSkuForTask;
      qty: number;
      priority: 'P0' | 'P1' | 'P2';
    }[]
  ) => {
    const timestampStr = new Date().toLocaleString();
    const createdList: ReplenishTaskRecord[] = [];
    const blockedList: string[] = [];

    items.forEach((item, index) => {
      // Anti-duplicate check
      const duplicate = tasks.find(
        (t) =>
          t.sku === item.candidate.sku &&
          t.targetLocation === item.candidate.targetLocation &&
          t.status !== 'completed' &&
          t.status !== 'exception_closed'
      );

      if (duplicate) {
        blockedList.push(
          `${item.candidate.sku} (目标位 ${item.candidate.targetLocation} 已有任务 ${duplicate.id})`
        );
        return;
      }

      const newId = `TASK-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(
        100 + Math.random() * 900
      )}`;

      const newTask: ReplenishTaskRecord = {
        id: newId,
        warehouseId: currentConfig.warehouseId,
        warehouseName: currentConfig.warehouseName,
        sku: item.candidate.sku,
        productName: item.candidate.productName,
        category: item.candidate.category,
        specification: item.candidate.specification,
        unit: item.candidate.unit,
        sourceLocation: item.candidate.sourceLocation,
        sourceLevel: item.candidate.sourceLevel,
        targetLocation: item.candidate.targetLocation,
        targetLevel: item.candidate.targetLevel,
        requestedQty: item.qty,
        actualQty: 0,
        priority: item.priority,
        status: 'pending_dispatch',
        dispatcher: '人工圈选下发',
        createdAt: timestampStr,
        createdTimestamp: Date.now(),
        elapsedMinutes: 0,
        isWarning: false,
        isEscalated: false,
        history: [
          {
            id: `LOG-${Date.now()}-${index}`,
            timestamp: timestampStr,
            operator: '调度员 (人工圈选)',
            action: '新建补货任务',
            toStatus: 'pending_dispatch',
            note: `手动圈选下发补货申请，补货量: ${item.qty} ${item.candidate.unit}`,
          },
        ],
      };

      createdList.push(newTask);
    });

    if (createdList.length > 0) {
      setTasks((prev) => [...createdList, ...prev]);
      showToast(`成功创建 ${createdList.length} 笔补货任务，已进入待派单队列！`);
    }

    if (blockedList.length > 0) {
      alert(
        `防重拦截：以下 SKU 目标库位存在未完成任务，已阻止重复新建：\n${blockedList.join(
          '\n'
        )}`
      );
    }
  };

  // Actions: 2. Dispatch Task
  const handleConfirmDispatch = (
    taskId: string,
    mode: DispatchMode,
    workerName?: string,
    workerPhone?: string
  ) => {
    const timestampStr = new Date().toLocaleString();
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const isGrab = mode === 'worker_grab';
          const newStatus: TaskManagementStatus = 'dispatched';
          return {
            ...t,
            status: newStatus,
            dispatcher:
              mode === 'nearby_auto'
                ? '就近自动调度引擎'
                : mode === 'worker_grab'
                ? '公共抢单大厅'
                : '调度员手动指定',
            claimedBy: isGrab ? undefined : workerName,
            workerPhone: isGrab ? undefined : workerPhone,
            dispatchedAt: timestampStr,
            history: [
              ...t.history,
              {
                id: `LOG-${Date.now()}`,
                timestamp: timestampStr,
                operator: '调度工作台',
                action:
                  mode === 'nearby_auto'
                    ? '区域就近派单'
                    : mode === 'worker_grab'
                    ? '发布到抢单池'
                    : '指定人员派单',
                fromStatus: t.status,
                toStatus: newStatus,
                note: isGrab
                  ? '已下发至全仓补货员公共抢单池'
                  : `已派发给补货员: ${workerName} (${workerPhone || ''})`,
              },
            ],
          };
        }
        return t;
      })
    );

    // If worker assigned, increment worker load
    if (workerName) {
      setWorkers((prev) =>
        prev.map((w) =>
          w.name === workerName
            ? { ...w, currentActiveTasks: w.currentActiveTasks + 1 }
            : w
        )
      );
    }

    showToast(`任务 [${taskId}] 派单成功！`);
  };

  // Actions: 3. Worker PDA claim, start, complete
  const handleClaimTask = (taskId: string, workerName: string) => {
    const timestampStr = new Date().toLocaleString();
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            status: 'claimed',
            claimedBy: workerName,
            claimedAt: timestampStr,
            history: [
              ...t.history,
              {
                id: `LOG-${Date.now()}`,
                timestamp: timestampStr,
                operator: `${workerName} (补货员PDA)`,
                action: 'PDA扫码认领任务',
                fromStatus: t.status,
                toStatus: 'claimed',
                note: `补货员 ${workerName} 扫码确认接单`,
              },
            ],
          };
        }
        return t;
      })
    );
    showToast(`补货员 ${workerName} 已成功认领任务 [${taskId}]！`);
  };

  const handleStartTask = (taskId: string, workerName: string) => {
    const timestampStr = new Date().toLocaleString();
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            status: 'in_progress',
            history: [
              ...t.history,
              {
                id: `LOG-${Date.now()}`,
                timestamp: timestampStr,
                operator: `${workerName} (补货员PDA)`,
                action: '到达源库位，开始作业',
                fromStatus: t.status,
                toStatus: 'in_progress',
                note: `扫描源库位 ${t.sourceLocation} 条码，叉运作业中`,
              },
            ],
          };
        }
        return t;
      })
    );
    showToast(`任务 [${taskId}] 已开始叉运作业！`);
  };

  const handleCompleteTask = (
    taskId: string,
    workerName: string,
    actualQty: number
  ) => {
    const timestampStr = new Date().toLocaleString();
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            status: 'completed',
            actualQty,
            completedAt: timestampStr,
            isWarning: false,
            isEscalated: false,
            history: [
              ...t.history,
              {
                id: `LOG-${Date.now()}`,
                timestamp: timestampStr,
                operator: `${workerName} (补货员PDA)`,
                action: '扫码确认补货完成',
                fromStatus: t.status,
                toStatus: 'completed',
                note: `实际移库入位 ${actualQty} ${t.unit}，已落位至 ${t.targetLocation}`,
              },
            ],
          };
        }
        return t;
      })
    );

    // Decrement worker load
    setWorkers((prev) =>
      prev.map((w) =>
        w.name === workerName
          ? { ...w, currentActiveTasks: Math.max(0, w.currentActiveTasks - 1) }
          : w
      )
    );

    showToast(`恭喜！任务 [${taskId}] 已圆满完成补货上架！`);
  };

  // Actions: 4. Worker report exception
  const handleReportException = (
    taskId: string,
    workerName: string,
    type: string,
    reason: string
  ) => {
    const timestampStr = new Date().toLocaleString();
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            status: 'exception_review',
            exceptionType: type,
            exceptionReason: reason,
            exceptionReportedBy: workerName,
            exceptionReportedAt: timestampStr,
            history: [
              ...t.history,
              {
                id: `LOG-${Date.now()}`,
                timestamp: timestampStr,
                operator: `${workerName} (补货员PDA)`,
                action: '上报现场异常',
                fromStatus: t.status,
                toStatus: 'exception_review',
                note: `[${type}] ${reason}`,
              },
            ],
          };
        }
        return t;
      })
    );
    showToast(`现场异常已提交！已转入 PC 库管员核实队列。`);
  };

  // Actions: 5. Manager confirm exception close
  const handleConfirmExceptionClose = (
    taskId: string,
    category: string,
    reviewNote: string
  ) => {
    const timestampStr = new Date().toLocaleString();
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            status: 'exception_closed',
            exceptionType: category,
            exceptionReviewNote: reviewNote,
            completedAt: timestampStr,
            isWarning: false,
            isEscalated: false,
            history: [
              ...t.history,
              {
                id: `LOG-${Date.now()}`,
                timestamp: timestampStr,
                operator: '库管员 (PC端核实)',
                action: '核实并执行异常关闭',
                fromStatus: t.status,
                toStatus: 'exception_closed',
                note: `核实原因分类: ${category} | 处置说明: ${reviewNote}`,
              },
            ],
          };
        }
        return t;
      })
    );
    showToast(`任务 [${taskId}] 已执行异常关闭，目标库位锁定已解除！`);
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = [
      '任务ID',
      '仓库名称',
      'SKU',
      '商品名称',
      '规格',
      '源库位',
      '目标库位',
      '申请补货量',
      '实际完成量',
      '单位',
      '优先级',
      '任务状态',
      '派单人',
      '领取人',
      '生成时间',
      '完成时间',
      '已耗时(分钟)',
      '是否超时预警',
      '是否升级组长',
    ];

    const rows = filteredTasks.map((t) => [
      t.id,
      t.warehouseName,
      t.sku,
      `"${t.productName.replace(/"/g, '""')}"`,
      t.specification,
      t.sourceLocation,
      t.targetLocation,
      t.requestedQty,
      t.actualQty,
      t.unit,
      t.priority,
      t.status,
      t.dispatcher,
      t.claimedBy || '待认领',
      t.createdAt,
      t.completedAt || '--',
      Math.round(t.elapsedMinutes),
      t.isWarning ? '是' : '否',
      t.isEscalated ? '是' : '否',
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `补货任务管理报表_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('任务列表 CSV 导出成功！');
  };

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-18 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-xl border border-slate-700 flex items-center gap-2.5 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Stat KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-slate-500 text-xs font-medium">任务总量</div>
          <div className="text-xl font-bold font-mono text-slate-800 mt-1">
            {totalCount}
          </div>
          <span className="text-[11px] text-slate-400">今日流转工单</span>
        </div>

        <div className="bg-amber-50/80 p-3.5 rounded-xl border border-amber-200 shadow-xs">
          <div className="text-amber-800 text-xs font-semibold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            待派单
          </div>
          <div className="text-xl font-bold font-mono text-amber-800 mt-1">
            {pendingDispatchCount}
          </div>
          <span className="text-[11px] text-amber-700">待调度指定人员</span>
        </div>

        <div className="bg-blue-50/80 p-3.5 rounded-xl border border-blue-200 shadow-xs">
          <div className="text-blue-800 text-xs font-semibold">进行中 / 已认领</div>
          <div className="text-xl font-bold font-mono text-blue-800 mt-1">
            {inProgressCount}
          </div>
          <span className="text-[11px] text-blue-700">叉车与补货员作业中</span>
        </div>

        <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200 shadow-xs">
          <div className="text-amber-900 text-xs font-semibold flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            超时标红预警
          </div>
          <div className="text-xl font-bold font-mono text-amber-900 mt-1">
            {warningCount}
          </div>
          <span className="text-[11px] text-amber-700">
            超 {currentConfig.warningThresholdHours}h 未完工
          </span>
        </div>

        <div className="bg-red-50/90 p-3.5 rounded-xl border border-red-200 shadow-xs">
          <div className="text-red-700 text-xs font-bold flex items-center gap-1">
            <AlertOctagon className="w-3.5 h-3.5 text-red-600" />
            超时升级组长
          </div>
          <div className="text-xl font-bold font-mono text-red-700 mt-1">
            {escalatedCount}
          </div>
          <span className="text-[11px] text-red-600">
            超 {currentConfig.escalateThresholdHours}h 强力督办
          </span>
        </div>

        <div className="bg-rose-50/80 p-3.5 rounded-xl border border-rose-200 shadow-xs col-span-2 sm:col-span-1">
          <div className="text-rose-800 text-xs font-semibold flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            异常待核实
          </div>
          <div className="text-xl font-bold font-mono text-rose-800 mt-1">
            {exceptionCount}
          </div>
          <span className="text-[11px] text-rose-700">待PC端关闭</span>
        </div>
      </div>

      {/* Filter & Action Toolbar */}
      <TaskFilterBar
        filter={filter}
        onChangeFilter={(updater) => setFilter((prev) => ({ ...prev, ...updater }))}
        workers={workers}
        totalCount={totalCount}
        filteredCount={filteredTasks.length}
        warningCount={warningCount}
        escalatedCount={escalatedCount}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onOpenConfigModal={() => setIsConfigModalOpen(true)}
        onOpenPdaSimModal={() => setIsPdaSimModalOpen(true)}
        onExportCsv={handleExportCsv}
      />

      {/* Main Task Records Table */}
      <TaskTable
        tasks={filteredTasks}
        onOpenDetail={(task) => setDetailTask(task)}
        onOpenDispatch={(task) => setDispatchTask(task)}
        onOpenExceptionReview={(task) => setExceptionTask(task)}
        warningHours={currentConfig.warningThresholdHours}
        escalateHours={currentConfig.escalateThresholdHours}
      />

      {/* Modals */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        activeTasks={tasks}
        onCreateTasks={handleCreateTasks}
        warehouseName={currentConfig.warehouseName}
      />

      <DispatchTaskModal
        task={dispatchTask}
        onClose={() => setDispatchTask(null)}
        workers={workers}
        defaultDispatchMode={currentConfig.dispatchMode}
        onConfirmDispatch={handleConfirmDispatch}
      />

      <TaskDetailModal
        task={detailTask}
        onClose={() => setDetailTask(null)}
      />

      <ExceptionCloseModal
        task={exceptionTask}
        onClose={() => setExceptionTask(null)}
        onConfirmClose={handleConfirmExceptionClose}
      />

      <TaskConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        config={currentConfig}
        onSaveConfig={(updated) => {
          setWarehouseConfigs((prev) => ({
            ...prev,
            [updated.warehouseId]: updated,
          }));
          showToast('补货派单模式与超时预警策略已保存！');
        }}
      />

      <WorkerPdaSimModal
        isOpen={isPdaSimModalOpen}
        onClose={() => setIsPdaSimModalOpen(false)}
        tasks={tasks}
        workers={workers}
        onClaimTask={handleClaimTask}
        onStartTask={handleStartTask}
        onCompleteTask={handleCompleteTask}
        onReportException={handleReportException}
      />
    </div>
  );
};
