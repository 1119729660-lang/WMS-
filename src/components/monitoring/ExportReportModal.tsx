import React, { useState } from 'react';
import {
  X,
  Download,
  FileSpreadsheet,
  CheckSquare,
  Square,
  Clock,
  AlertTriangle,
  Award,
  AlertOctagon,
  CheckCircle2,
} from 'lucide-react';
import {
  StuckTaskRecord,
  WorkerProductivity,
  TrendDataPoint,
  VolumeDimensionSummary,
  MonitoringConfig,
} from '../../types/monitoring';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  stuckTasks: StuckTaskRecord[];
  workers: WorkerProductivity[];
  trendData: TrendDataPoint[];
  volumeSummaries: VolumeDimensionSummary[];
  config: MonitoringConfig;
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  isOpen,
  onClose,
  stuckTasks,
  workers,
  trendData,
  volumeSummaries,
  config,
}) => {
  const [exportTimeliness, setExportTimeliness] = useState(true);
  const [exportStockout, setExportStockout] = useState(true);
  const [exportEfficiency, setExportEfficiency] = useState(true);
  const [exportStuckTasks, setExportStuckTasks] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const downloadCsv = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = () => {
    setIsExporting(true);
    const dateStr = new Date().toISOString().slice(0, 10);

    // 1. Timeliness
    if (exportTimeliness) {
      const headers = ['日期', '及时率(%)', '考核目标(%)', '当日补货总件数', '当日任务单数', '停滞工单数'];
      const rows = trendData.map((d) => [
        d.date,
        d.timelinessRate,
        d.targetRate,
        d.totalPieces,
        d.totalTasks,
        d.stuckCount,
      ]);
      downloadCsv(`补货及时率时序报表_${dateStr}.csv`, headers, rows);
    }

    // 2. Stockout
    if (exportStockout) {
      const headers = [
        '日期',
        '拣货点缺货上报次数',
        '拣货总频次',
        '口径①拣货点缺货率(%)',
        '缺货SKU种数',
        '波次SKU总数',
        '口径②波次SKU缺货率(%)',
      ];
      const rows = trendData.map((d) => [
        d.date,
        d.pickingReports,
        d.totalPickingOps,
        d.stockoutRatePicking,
        d.stockoutSkus,
        d.totalWaveSkus,
        d.stockoutRateSku,
      ]);
      downloadCsv(`缺货率双口径监控报表_${dateStr}.csv`, headers, rows);
    }

    // 3. Efficiency
    if (exportEfficiency) {
      const headers = ['排名', '补货员姓名', '联系电话', '责任网格', '完成件数(PCS)', '完成单数', '作业工时(h)', '人效(件/h)', '是否达标', '及时率(%)'];
      const rows = workers.map((w, idx) => [
        idx + 1,
        w.workerName,
        w.phone,
        w.assignedZone,
        w.completedPieces,
        w.completedTasks,
        w.workingHours,
        w.piecesPerHour,
        w.targetAchieved ? '达标' : '未达标',
        w.timelinessRate,
      ]);
      downloadCsv(`补货员人效龙虎榜报表_${dateStr}.csv`, headers, rows);
    }

    // 4. Stuck Tasks
    if (exportStuckTasks) {
      const headers = [
        '任务ID',
        '仓库名称',
        'SKU编码',
        '商品名称',
        '品类',
        '源库位',
        '目标库位',
        '申请件数',
        '单位',
        '优先级',
        '作业状态',
        '补货员',
        '联系电话',
        '开始时间',
        '已停滞时长(小时)',
        '超时分档',
        '现场阻滞原因',
        '累计催办次数',
      ];
      const rows = stuckTasks.map((t) => [
        t.id,
        t.warehouseName,
        t.sku,
        t.productName,
        t.category,
        t.sourceLocation,
        t.targetLocation,
        t.requestedQty,
        t.unit,
        t.priority,
        t.status === 'in_progress' ? '进行中' : '已领取',
        t.claimedBy,
        t.workerPhone,
        t.startedAt,
        t.elapsedHours,
        t.tier === '2_4h' ? '2~4小时' : t.tier === '4_8h' ? '4~8小时' : '8小时以上',
        t.delayReason || '',
        t.urgedCount,
      ]);
      downloadCsv(`卡住任务排查明细报表_${dateStr}.csv`, headers, rows);
    }

    setTimeout(() => {
      setIsExporting(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 text-xs">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                导出监控运营数据报表 (Excel / CSV)
              </h3>
              <p className="text-[11px] text-slate-400">
                支持各模块分拆与汇总导出 · 单次上限 10,000 条
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

        {/* Checkbox Options */}
        <div className="space-y-2.5">
          <label className="text-slate-700 font-bold block">
            选择需要导出的报表模块:
          </label>

          <label
            onClick={() => setExportTimeliness(!exportTimeliness)}
            className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors"
          >
            <div className="mt-0.5 text-blue-600">
              {exportTimeliness ? (
                <CheckSquare className="w-4 h-4" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
            </div>
            <div>
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>补货及时率报表 (时序与达标情况)</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                包含每日补货及时率、95% 基准线比对、总件数与工单数。
              </p>
            </div>
          </label>

          <label
            onClick={() => setExportStockout(!exportStockout)}
            className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors"
          >
            <div className="mt-0.5 text-blue-600">
              {exportStockout ? (
                <CheckSquare className="w-4 h-4" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
            </div>
            <div>
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span>缺货率双口径明细报表</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                包含口径①拣货点缺货上报频次与口径②波次缺货 SKU 双核算。
              </p>
            </div>
          </label>

          <label
            onClick={() => setExportEfficiency(!exportEfficiency)}
            className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors"
          >
            <div className="mt-0.5 text-blue-600">
              {exportEfficiency ? (
                <CheckSquare className="w-4 h-4" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
            </div>
            <div>
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-600" />
                <span>补货员人效排行榜 (件/小时)</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                包含各补货员作业工时、完成补货总件数、人效值及基准达成结论。
              </p>
            </div>
          </label>

          <label
            onClick={() => setExportStuckTasks(!exportStuckTasks)}
            className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors"
          >
            <div className="mt-0.5 text-blue-600">
              {exportStuckTasks ? (
                <CheckSquare className="w-4 h-4" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
            </div>
            <div>
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
                <span>卡住任务排查明细清单 (超时分档)</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                包含 2~4h、4~8h、8h+ 分档明细、补货员电话、现场原因及催办次数。
              </p>
            </div>
          </label>
        </div>

        {/* Export Limit Note */}
        <div className="bg-slate-50 p-2.5 rounded-xl text-[11px] text-slate-500 border border-slate-200 flex items-center justify-between">
          <span>* 单次下载上限: 10,000 条记录</span>
          <span>编码: UTF-8 with BOM (Excel 兼容)</span>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-slate-500 hover:bg-slate-100 rounded-lg font-medium cursor-pointer"
          >
            取消
          </button>
          <button
            onClick={handleExport}
            disabled={
              isExporting ||
              (!exportTimeliness &&
                !exportStockout &&
                !exportEfficiency &&
                !exportStuckTasks)
            }
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? '正在生成导出...' : '确认导出并下载'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
