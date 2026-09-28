import React from 'react';
import {
  Layers,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  SlaNodeId,
  SlaSystemConfig,
  SlaWarehouseMetric,
} from '../../types/sla';

interface SlaNodePivotTableProps {
  config: SlaSystemConfig;
  warehouseMetrics: SlaWarehouseMetric[];
  selectedWarehouseId: string | null;
  onFilterNode?: (nodeId: SlaNodeId) => void;
}

export const SlaNodePivotTable: React.FC<SlaNodePivotTableProps> = ({
  config,
  warehouseMetrics,
  selectedWarehouseId,
  onFilterNode,
}) => {
  const targetRate = config.targetPassRate;

  // Aggregate stats across the selected warehouses
  const relevantWarehouses = selectedWarehouseId
    ? warehouseMetrics.filter((w) => w.warehouseId === selectedWarehouseId)
    : warehouseMetrics;

  const nodeOrder: SlaNodeId[] = [
    'inbound_register',
    'outbound_register',
    'inbound_putaway',
    'outbound_prepare',
  ];

  const aggregatedNodes = nodeOrder.map((nId) => {
    const nodeConf = config.nodes[nId];
    let totalOrders = 0;
    let onTimeCount = 0;
    let delayedCount = 0;
    let totalMinutes = 0;

    relevantWarehouses.forEach((w) => {
      const metric = w.nodeMetrics[nId];
      if (metric) {
        totalOrders += metric.totalOrders;
        onTimeCount += metric.onTimeCount;
        delayedCount += metric.delayedCount;
        totalMinutes += metric.avgDurationMinutes * metric.totalOrders;
      }
    });

    const passRate =
      totalOrders > 0 ? +((onTimeCount / totalOrders) * 100).toFixed(1) : 100.0;
    const avgDurationMinutes =
      totalOrders > 0 ? Math.round(totalMinutes / totalOrders) : 0;

    return {
      nodeId: nId,
      name: nodeConf.name,
      category: nodeConf.category,
      startPoint: nodeConf.startPointDescription,
      endPoint: nodeConf.endPointDescription,
      thresholdDisplay: nodeConf.thresholdDisplay,
      thresholdMinutes: nodeConf.currentThresholdMinutes,
      totalOrders,
      onTimeCount,
      delayedCount,
      passRate,
      avgDurationMinutes,
    };
  });

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} 分钟`;
    const hours = (minutes / 60).toFixed(1);
    return `${hours} 小时 (${minutes}m)`;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-800">
                4 核心履约节点 SLA 时效透视表
              </h3>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
                {selectedWarehouseId
                  ? `已聚焦仓库: ${
                      relevantWarehouses[0]?.warehouseName || selectedWarehouseId
                    }`
                  : '全部仓库汇总'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              单节点达标率 = 该节点按时完成订单数 ÷ 该节点应完成订单总数 × 100%
              | 基准考核线: {targetRate}%
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-400 text-[11px]">
            颜色规则: ≥{targetRate}% 绿色达标 | &lt;{targetRate}% 红色超时
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-y border-slate-200/80">
            <tr>
              <th className="py-2.5 px-3">履约环节</th>
              <th className="py-2.5 px-3">起点业务时间戳</th>
              <th className="py-2.5 px-3">终点业务时间戳</th>
              <th className="py-2.5 px-3">SLA 考核阈值</th>
              <th className="py-2.5 px-3 text-right">应完成订单</th>
              <th className="py-2.5 px-3 text-right">按时完成数</th>
              <th className="py-2.5 px-3 text-right">超时延迟数</th>
              <th className="py-2.5 px-3 text-right">平均实测耗时</th>
              <th className="py-2.5 px-3 text-right">单节点达标率</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {aggregatedNodes.map((node, index) => {
              const isPass = node.passRate >= targetRate;
              return (
                <tr
                  key={node.nodeId}
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  {/* Node Name & Category badge */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-mono font-bold text-xs">
                        0{index + 1}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{node.name}</span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                              node.category === 'inbound'
                                ? 'bg-sky-50 text-sky-700 border border-sky-200'
                                : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            }`}
                          >
                            {node.category === 'inbound' ? '入库' : '出库'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Start Point */}
                  <td className="py-3 px-3">
                    <div className="text-slate-700 font-medium max-w-xs truncate" title={node.startPoint}>
                      {node.startPoint}
                    </div>
                  </td>

                  {/* End Point */}
                  <td className="py-3 px-3">
                    <div className="text-slate-700 font-medium max-w-xs truncate" title={node.endPoint}>
                      {node.endPoint}
                    </div>
                  </td>

                  {/* Threshold */}
                  <td className="py-3 px-3">
                    <span className="font-mono font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                      ≤ {node.thresholdDisplay}
                    </span>
                  </td>

                  {/* Total Orders */}
                  <td className="py-3 px-3 text-right font-mono text-slate-800 font-bold">
                    {node.totalOrders.toLocaleString()} 单
                  </td>

                  {/* On-Time Count */}
                  <td className="py-3 px-3 text-right font-mono text-emerald-700 font-bold">
                    {node.onTimeCount.toLocaleString()} 单
                  </td>

                  {/* Delayed Count */}
                  <td className="py-3 px-3 text-right font-mono font-bold">
                    {node.delayedCount > 0 ? (
                      <span className="text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                        {node.delayedCount} 单
                      </span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>

                  {/* Average Duration */}
                  <td className="py-3 px-3 text-right font-mono text-slate-700">
                    {formatDuration(node.avgDurationMinutes)}
                  </td>

                  {/* Pass Rate */}
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span
                        className={`text-sm font-black font-mono ${
                          isPass ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {node.passRate.toFixed(1)}%
                      </span>
                      {isPass ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Info Callout */}
      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-[11px] text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-blue-600" />
          <span>
            提示：入库注册（1h）、出库注册（10min）、入库上架（24h）、出库准备（24h）为全流程履约监控锚点。
          </span>
        </div>
        <div className="font-mono text-slate-600">
          综合判定口径: 单订单若任何 1 个节点出现超时即标记为延迟订单
        </div>
      </div>
    </div>
  );
};
