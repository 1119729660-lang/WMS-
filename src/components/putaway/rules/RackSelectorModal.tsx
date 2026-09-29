import React, { useState, useMemo } from 'react';
import { X, Search, Check, Layers, Warehouse } from 'lucide-react';
import { WarehouseLocation } from '../../../types/putaway';

interface RackSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  locations: WarehouseLocation[];
  selectedRacks: string[];
  onConfirm: (racks: string[]) => void;
}

export const RackSelectorModal: React.FC<RackSelectorModalProps> = ({
  isOpen,
  onClose,
  locations,
  selectedRacks,
  onConfirm,
}) => {
  const [tempSelected, setTempSelected] = useState<string[]>(selectedRacks);
  const [search, setSearch] = useState('');
  const [selectedZone, setSelectedZone] = useState('ALL');

  // Extract distinct rack codes and their zones
  const rackList = useMemo(() => {
    const map = new Map<string, { rackCode: string; zone: string; locationCount: number }>();
    locations.forEach((loc) => {
      const existing = map.get(loc.rackCode);
      if (existing) {
        existing.locationCount += 1;
      } else {
        map.set(loc.rackCode, {
          rackCode: loc.rackCode,
          zone: loc.zone,
          locationCount: 1,
        });
      }
    });
    return Array.from(map.values());
  }, [locations]);

  const distinctZones = useMemo(() => {
    return Array.from(new Set(rackList.map((r) => r.zone)));
  }, [rackList]);

  const filteredRacks = useMemo(() => {
    return rackList.filter((r) => {
      if (selectedZone !== 'ALL' && r.zone !== selectedZone) return false;
      if (search.trim() && !r.rackCode.toLowerCase().includes(search.toLowerCase()) && !r.zone.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [rackList, selectedZone, search]);

  if (!isOpen) return null;

  const toggleRack = (code: string) => {
    setTempSelected((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleSelectAll = (select: boolean) => {
    if (select) {
      const toAdd = filteredRacks.map((r) => r.rackCode);
      setTempSelected((prev) => Array.from(new Set([...prev, ...toAdd])));
    } else {
      const toRemove = new Set(filteredRacks.map((r) => r.rackCode));
      setTempSelected((prev) => prev.filter((c) => !toRemove.has(c)));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">选择指定货架范围</h3>
              <p className="text-xs text-slate-500">选择该规则生效的指定立体货架或地堆托盘通道</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter bar */}
        <div className="p-4 border-b border-slate-100 bg-white flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="搜索货架编码 (如 A-01-01, FP-A)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700"
          >
            <option value="ALL">全部库区</option>
            {distinctZones.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={() => handleSelectAll(true)}
              className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold cursor-pointer"
            >
              全选当前
            </button>
            <button
              onClick={() => handleSelectAll(false)}
              className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 font-semibold cursor-pointer"
            >
              反选/清空
            </button>
          </div>
        </div>

        {/* Selected pill summary */}
        {tempSelected.length > 0 && (
          <div className="px-5 py-2.5 bg-blue-50/50 border-b border-blue-100 flex flex-wrap items-center gap-1.5 max-h-24 overflow-y-auto">
            <span className="text-xs font-bold text-blue-900 mr-1">
              已选 ({tempSelected.length}):
            </span>
            {tempSelected.map((code) => (
              <span
                key={code}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-blue-200 text-blue-800 text-[11px] font-mono font-bold shadow-2xs"
              >
                <span>{code}</span>
                <button
                  type="button"
                  onClick={() => toggleRack(code)}
                  className="text-slate-400 hover:text-red-500 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Rack checklist */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {filteredRacks.map((rack) => {
            const isChecked = tempSelected.includes(rack.rackCode);
            return (
              <div
                key={rack.rackCode}
                onClick={() => toggleRack(rack.rackCode)}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                  isChecked
                    ? 'bg-blue-50/70 border-blue-400 ring-1 ring-blue-400/30'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => {}}
                  className="rounded text-blue-600 focus:ring-blue-500 mt-0.5 pointer-events-none cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-mono font-bold text-xs text-slate-900 truncate">
                    {rack.rackCode}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate mt-0.5">
                    {rack.zone}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    包含 {rack.locationCount} 个立体储位
                  </div>
                </div>
              </div>
            );
          })}

          {filteredRacks.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400 text-xs">
              无匹配的货架编码
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            已勾选 <strong className="text-blue-600 font-mono">{tempSelected.length}</strong> 个货架
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              取消
            </button>
            <button
              onClick={() => {
                onConfirm(tempSelected);
                onClose();
              }}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
            >
              确认选中
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
