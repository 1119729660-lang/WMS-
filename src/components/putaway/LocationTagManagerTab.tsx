import React, { useState } from 'react';
import {
  Layers,
  Boxes,
  Tag,
  ArrowRightLeft,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  SlidersHorizontal,
  Info,
  Link2,
  Wrench,
  Flame,
} from 'lucide-react';
import { WarehouseLocation, LocationRoleTag } from '../../types/putaway';

interface LocationTagManagerTabProps {
  locations: WarehouseLocation[];
  onUpdateLocations: (locations: WarehouseLocation[]) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'warning') => void;
}

export const LocationTagManagerTab: React.FC<LocationTagManagerTabProps> = ({
  locations,
  onUpdateLocations,
  onShowToast,
}) => {
  const [selectedZone, setSelectedZone] = useState<'ALL' | 'RACK' | 'FLOOR'>('ALL');
  const [editingLocationCode, setEditingLocationCode] = useState<string | null>(null);

  // 临时切换库位标签 (拣货层 <-> 临时拣货层 / 备货层)
  const handleToggleRoleTag = (locationCode: string) => {
    const updated = locations.map((loc) => {
      if (loc.locationCode !== locationCode) return loc;

      if (loc.isTemporarySwitched) {
        // 切回原始标签
        return {
          ...loc,
          currentRoleTag: loc.originalRoleTag,
          isTemporarySwitched: false,
          switchReason: undefined,
        };
      } else {
        // 临时切换为拣货层 (如大促或检修)
        const newTag: LocationRoleTag =
          loc.currentRoleTag === 'RESERVE_LAYER' ? 'TEMP_PICKING' : 'RESERVE_LAYER';
        return {
          ...loc,
          currentRoleTag: newTag,
          isTemporarySwitched: true,
          switchReason: '大促期间临时扩充为黄金拣选位 / 1层检修切换',
        };
      }
    });

    onUpdateLocations(updated);
    const target = updated.find((l) => l.locationCode === locationCode);
    if (target?.isTemporarySwitched) {
      onShowToast(
        `库位 [${locationCode}] 已临时切换为【临时拣货层】，即刻生效并参与上架直接拣选！`,
        'success'
      );
    } else {
      onShowToast(`库位 [${locationCode}] 已切回原始【备货层】角色属性`, 'info');
    }
  };

  // 批量模拟大促开启：将所有 A-01 货架 2 层备货位临时切为拣选层
  const handleBatchSwitchForPromo = () => {
    const updated = locations.map((loc) => {
      if (!loc.isFloorPallet && loc.level === 2 && loc.currentRoleTag === 'RESERVE_LAYER') {
        return {
          ...loc,
          currentRoleTag: 'TEMP_PICKING' as LocationRoleTag,
          isTemporarySwitched: true,
          switchReason: '99/双11大促爆发：2层立体备货位批量临时扩充为拣货位',
        };
      }
      return loc;
    });
    onUpdateLocations(updated);
    onShowToast('⚡ 大促场景已生效：已将高位货架二层备货位批量临时升级为【拣货层】！', 'warning');
  };

  // 业务结束后一键全部切回
  const handleRestoreAll = () => {
    const updated = locations.map((loc) => ({
      ...loc,
      currentRoleTag: loc.originalRoleTag,
      isTemporarySwitched: false,
      switchReason: undefined,
    }));
    onUpdateLocations(updated);
    onShowToast('已将所有临时切换的库位角色一键切回原始状态！', 'info');
  };

  // 过滤展示
  const filteredLocations = locations.filter((loc) => {
    if (selectedZone === 'RACK') return !loc.isFloorPallet;
    if (selectedZone === 'FLOOR') return loc.isFloorPallet;
    return true;
  });

  const temporaryCount = locations.filter((l) => l.isTemporarySwitched).length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-indigo-50 text-indigo-700 font-mono text-[11px] font-bold px-2 py-0.5 rounded">
              LOCATION ROLE TAGS & ZONING
            </span>
            {temporaryCount > 0 && (
              <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2 py-0.5 rounded flex items-center gap-1 animate-pulse">
                <Flame className="w-3.5 h-3.5 text-amber-600" />
                <span>{temporaryCount} 个库位处于临时大促/检修切换中</span>
              </span>
            )}
          </div>
          <h3 className="text-base font-bold text-slate-900 mt-1">
            动态库位标签与货架/地堆分区配置管理
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl leading-relaxed">
            拣货层 / 备货层为 WMS <strong>动态库位标签属性，绝非硬编码</strong>。在大促前夕或货架检修时，可随时将二层备货位临时提升为拣选位，大促结束后一键复原。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleBatchSwitchForPromo}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors shadow-sm cursor-pointer"
            title="将二层备货位临时切换为拣货位以备战大促"
          >
            <Flame className="w-4 h-4" />
            <span>大促备战：2层批量切拣货位</span>
          </button>

          <button
            onClick={handleRestoreAll}
            disabled={temporaryCount === 0}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl border transition-colors ${
              temporaryCount > 0
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300 cursor-pointer'
                : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
            }`}
            title="业务结束后切回原始配置"
          >
            <RotateCcw className="w-4 h-4" />
            <span>业务结束：一键切回</span>
          </button>
        </div>
      </div>

      {/* Rack vs Floor Pallet Zone Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 高位货架区 */}
        <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              <span>高位立体货架区 (High-bay Racks)</span>
            </span>
            <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded font-mono">
              分层推荐规则生效
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            标准三层货位：<strong>1层为拣货黄金层</strong>，<strong>2/3层为高位备货层</strong>。
            自动执行<strong>同 SKU 同架垂直绑定</strong>，实现补货时 0 巷道水平位移直降。
          </p>
        </div>

        {/* 绿色地堆托盘区 */}
        <div className="bg-emerald-950 text-emerald-100 rounded-2xl p-5 border border-emerald-900 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm flex items-center gap-2 text-white">
              <Boxes className="w-4 h-4 text-emerald-400" />
              <span>绿色地堆托盘区 (Floor Pallet Staging)</span>
            </span>
            <span className="text-[10px] bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-mono">
              整托/大件/爆品囤货
            </span>
          </div>
          <p className="text-xs text-emerald-200/90 leading-relaxed">
            <strong>不启用层位拆分策略</strong>。专供 A 类爆品、原箱饮料、整托大件直接落地存放。
            PDA 强制提示「整托上架」，严禁搬运至高层立体货架拆包。
          </p>
        </div>
      </div>

      {/* Zone Switch Filter Bar */}
      <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-600">筛选显示:</span>
          <button
            onClick={() => setSelectedZone('ALL')}
            className={`px-3 py-1 rounded-lg font-medium cursor-pointer ${
              selectedZone === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            全部库位 ({locations.length})
          </button>
          <button
            onClick={() => setSelectedZone('RACK')}
            className={`px-3 py-1 rounded-lg font-medium cursor-pointer ${
              selectedZone === 'RACK'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            高位立体货架 ({locations.filter((l) => !l.isFloorPallet).length})
          </button>
          <button
            onClick={() => setSelectedZone('FLOOR')}
            className={`px-3 py-1 rounded-lg font-medium cursor-pointer ${
              selectedZone === 'FLOOR'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            绿色地堆托盘区 ({locations.filter((l) => l.isFloorPallet).length})
          </button>
        </div>

        <div className="text-[11px] text-slate-400">
          点击库位上的「切换标签」按钮，可演示大促/检修临时角色变更
        </div>
      </div>

      {/* Locations Interactive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLocations.map((loc) => {
          const isTemp = loc.isTemporarySwitched;
          const isL1 = loc.level === 1 || loc.currentRoleTag === 'PICKING_LAYER' || loc.currentRoleTag === 'TEMP_PICKING';

          return (
            <div
              key={loc.locationCode}
              className={`p-4 rounded-2xl border transition-all relative overflow-hidden ${
                loc.isFloorPallet
                  ? 'bg-emerald-50/50 border-emerald-300'
                  : isTemp
                  ? 'bg-amber-50/60 border-amber-400 ring-2 ring-amber-300'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
              }`}
            >
              {/* Top Row: Location Code & Role Tag */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-sm text-slate-900">
                    {loc.locationCode}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {loc.isFloorPallet ? '地堆区' : `${loc.level}层`}
                  </span>
                </div>

                {/* Role Tag Badge */}
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                    loc.currentRoleTag === 'PICKING_LAYER'
                      ? 'bg-blue-100 text-blue-800'
                      : loc.currentRoleTag === 'TEMP_PICKING'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : loc.currentRoleTag === 'FLOOR_PALLET'
                      ? 'bg-emerald-100 text-emerald-800'
                      : loc.currentRoleTag === 'SLOW_ZONE'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {loc.currentRoleTag === 'PICKING_LAYER'
                    ? '1层·拣货层'
                    : loc.currentRoleTag === 'TEMP_PICKING'
                    ? '🔥 临时拣货层 (大促)'
                    : loc.currentRoleTag === 'FLOOR_PALLET'
                    ? '地堆整托位'
                    : loc.currentRoleTag === 'SLOW_ZONE'
                    ? '高层滞销区'
                    : `${loc.level}层·备货层`}
                </span>
              </div>

              {/* Bound SKU Info */}
              <div className="text-xs space-y-1 my-3 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between text-slate-500 text-[10px]">
                  <span>同架绑定 SKU:</span>
                  <span className="font-mono font-bold text-slate-700">
                    {loc.boundSkuCode || '待绑定'}
                  </span>
                </div>
                <div className="font-medium text-slate-800 text-[11px] line-clamp-1">
                  {loc.boundSkuName || '空闲可用货位'}
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">当前存放:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {loc.currentStock} / {loc.maxCapacity} {loc.isFloorPallet ? '托' : '件'}
                  </span>
                </div>
              </div>

              {/* Temporary Switch Note if Active */}
              {isTemp && loc.switchReason && (
                <div className="text-[10px] text-amber-800 bg-amber-100/70 p-2 rounded-lg mb-3 flex items-start gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>{loc.switchReason}</span>
                </div>
              )}

              {/* Switch Role Button */}
              {!loc.isFloorPallet && (
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-400">
                    {isTemp ? '大促临时模式' : '常规配置'}
                  </span>
                  <button
                    onClick={() => handleToggleRoleTag(loc.locationCode)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      isTemp
                        ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                        : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                    }`}
                  >
                    <ArrowRightLeft className="w-3 h-3" />
                    <span>{isTemp ? '切回备货层' : '临时转拣货层'}</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
