import { Search, Filter, X, Calendar, Building, Smartphone, Zap } from 'lucide-react';
import { FilterState } from '../types';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  availableDates: string[];
  availableDepartments: string[];
  availableFeatures: string[];
  totalCount: number;
  filteredCount: number;
}

export function FilterBar({
  filters,
  onFilterChange,
  availableDates,
  availableDepartments,
  availableFeatures,
  totalCount,
  filteredCount,
}: FilterBarProps) {
  const isFiltered =
    Boolean(filters.search.trim()) ||
    filters.date !== 'ALL' ||
    filters.department !== 'ALL' ||
    filters.platform !== 'ALL' ||
    filters.feature !== 'ALL' ||
    filters.account !== 'ALL' ||
    filters.hourRange[0] !== 0 ||
    filters.hourRange[1] !== 23;

  const handleReset = () => {
    onFilterChange({
      search: '',
      date: 'ALL',
      department: 'ALL',
      platform: 'ALL',
      feature: 'ALL',
      os: 'ALL',
      account: 'ALL',
      hourRange: [0, 23],
    });
  };

  return (
    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-3">
      {/* Top row: search + main selects */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Search input */}
        <div className="relative lg:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            placeholder="Tìm tài khoản, ban, IP, chức năng..."
            className="w-full pl-9 pr-8 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400"
          />
          {filters.search && (
            <button
              onClick={() => onFilterChange({ ...filters, search: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Date Filter */}
        <div className="relative">
          <select
            value={filters.date}
            onChange={(e) => onFilterChange({ ...filters, date: e.target.value })}
            className="w-full py-2 pl-3 pr-8 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
          >
            <option value="ALL">📅 Tất cả ngày</option>
            {availableDates.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Department Filter */}
        <div className="relative">
          <select
            value={filters.department}
            onChange={(e) => onFilterChange({ ...filters, department: e.target.value })}
            className="w-full py-2 pl-3 pr-8 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
          >
            <option value="ALL">🏢 Tất cả Ban ({availableDepartments.length})</option>
            {availableDepartments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        {/* Platform Filter */}
        <div className="relative">
          <select
            value={filters.platform}
            onChange={(e) => onFilterChange({ ...filters, platform: e.target.value })}
            className="w-full py-2 pl-3 pr-8 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
          >
            <option value="ALL">🌐 Nền tảng: Tất cả</option>
            <option value="WEB">💻 Chỉ WEB</option>
            <option value="APP">📱 Chỉ APP</option>
          </select>
        </div>
      </div>

      {/* Second row: Feature + Time Presets + Reset */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
        {/* Quick presets for hour and feature */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-400 font-medium flex items-center gap-1">
            <Zap className="w-3.5 h-3.5" /> Chức năng:
          </span>
          <div className="flex items-center gap-1 flex-wrap">
            <button
              onClick={() => onFilterChange({ ...filters, feature: 'ALL' })}
              className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                filters.feature === 'ALL'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tất cả
            </button>
            {availableFeatures.map((f) => (
              <button
                key={f}
                onClick={() => onFilterChange({ ...filters, feature: filters.feature === f ? 'ALL' : f })}
                className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                  filters.feature === f
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <span className="text-slate-300 mx-1">|</span>

          {/* Hour presets */}
          <span className="text-slate-400 font-medium">Khung giờ:</span>
          <div className="flex items-center gap-1">
            {[
              { label: '24h', range: [0, 23] as [number, number] },
              { label: 'Sáng (06h - 12h)', range: [6, 11] as [number, number] },
              { label: 'Chiều (12h - 18h)', range: [12, 17] as [number, number] },
              { label: 'Tối & Đêm', range: [18, 5] as [number, number] },
            ].map((p) => {
              const isActive =
                p.range[0] === 18
                  ? filters.hourRange[0] === 18 && filters.hourRange[1] === 23
                  : filters.hourRange[0] === p.range[0] && filters.hourRange[1] === p.range[1];

              return (
                <button
                  key={p.label}
                  onClick={() => {
                    if (p.range[0] === 18) {
                      onFilterChange({ ...filters, hourRange: [18, 23] });
                    } else {
                      onFilterChange({ ...filters, hourRange: p.range });
                    }
                  }}
                  className={`px-2 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Status & Reset button */}
        <div className="flex items-center gap-2">
          {filters.account !== 'ALL' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
              User: @{filters.account}
              <button
                onClick={() => onFilterChange({ ...filters, account: 'ALL' })}
                className="hover:text-indigo-900 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {isFiltered && (
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Xóa bộ lọc</span>
            </button>
          )}

          <span className="text-slate-500 font-medium">
            Khớp: <strong className="text-slate-800">{filteredCount}</strong> / {totalCount}
          </span>
        </div>
      </div>
    </div>
  );
}
