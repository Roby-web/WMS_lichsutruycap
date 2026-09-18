import React from 'react';
import {
  Search,
  Filter,
  X,
  UserCheck,
  Building2,
  Users,
  Calendar,
  Smartphone,
  Zap,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Clock,
} from 'lucide-react';
import { FilterState, TimePreset } from '../types';
import { PresetPeriods, formatToIso } from '../utils/dateRanges';

interface AvailableAccountItem {
  account: string;
  department: string;
  role: string;
  count: number;
}

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  availableDates: string[];
  availableDepartments: string[];
  availableRoles: string[];
  availableAccounts: AvailableAccountItem[];
  availableFeatures: string[];
  totalCount: number;
  filteredCount: number;
  excludedTestCount?: number;
  anchorDate?: Date;
  presetPeriods?: PresetPeriods;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  availableDates,
  availableDepartments,
  availableRoles,
  availableAccounts,
  availableFeatures,
  totalCount,
  filteredCount,
  excludedTestCount = 0,
  anchorDate,
  presetPeriods,
}) => {
  const isFiltered =
    Boolean(filters.search.trim()) ||
    filters.timePreset !== 'today' ||
    filters.date !== 'ALL' ||
    filters.department !== 'ALL' ||
    filters.platform !== 'ALL' ||
    filters.role !== 'ALL' ||
    filters.account !== 'ALL' ||
    filters.feature !== 'ALL' ||
    filters.hourRange[0] !== 0 ||
    filters.hourRange[1] !== 23;

  // Handle cascading role change
  const handleRoleChange = (newRole: string) => {
    onFilterChange({
      ...filters,
      role: newRole,
      // If role changes, we reset department and account if they don't match downstream
      department: 'ALL',
      account: 'ALL',
    });
  };

  // Handle cascading department change
  const handleDepartmentChange = (newDept: string) => {
    onFilterChange({
      ...filters,
      department: newDept,
      // If department changes, reset account
      account: 'ALL',
    });
  };

  // Handle person change
  const handleAccountChange = (newAccount: string) => {
    onFilterChange({
      ...filters,
      account: newAccount,
    });
  };

  const handleReset = () => {
    onFilterChange({
      search: '',
      timePreset: 'today', // Mặc định hôm nay active
      customRange: {
        startDate: '',
        endDate: '',
      },
      date: 'ALL',
      department: 'ALL',
      platform: 'ALL',
      role: 'ALL',
      feature: 'ALL',
      os: 'ALL',
      account: 'ALL',
      hourRange: [0, 23],
      excludeTestAccounts: filters.excludeTestAccounts ?? true,
    });
  };

  return (
    <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
      {/* 0. Mặc Định Hệ Thống: Loại bỏ tài khoản test & ban test */}
      <div className="bg-amber-50/80 border border-amber-200/90 rounded-xl p-3 sm:p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex items-start sm:items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5 sm:mt-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
              <span className="bg-amber-200/80 text-amber-950 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                Mặc Định
              </span>
              <span>Đã loại bỏ các tài khoản test:</span>
              <span className="font-mono text-amber-900 font-semibold bg-white px-1.5 py-0.5 rounded border border-amber-200">wms_bbt</span>
              <span className="font-mono text-amber-900 font-semibold bg-white px-1.5 py-0.5 rounded border border-amber-200">wms_truongban</span>
              <span className="font-mono text-amber-900 font-semibold bg-white px-1.5 py-0.5 rounded border border-amber-200">wms_phongvien</span>
              <span className="text-slate-400">|</span>
              <span>Loại bỏ ban:</span>
              <span className="font-mono text-amber-900 font-semibold bg-white px-1.5 py-0.5 rounded border border-amber-200">Tech</span>
              <span className="font-mono text-amber-900 font-semibold bg-white px-1.5 py-0.5 rounded border border-amber-200">Test WMS</span>
            </div>
            <div className="text-[11px] text-slate-600 mt-1">
              {filters.excludeTestAccounts ? (
                <span>
                  {excludedTestCount > 0 ? (
                    <strong className="text-amber-800 font-semibold">
                      Đang ẩn {excludedTestCount} bản ghi thử nghiệm
                    </strong>
                  ) : (
                    <span className="text-emerald-700 font-semibold">Đã lọc sạch toàn bộ dữ liệu</span>
                  )}
                  {' '}— cấu hình này được lưu và áp dụng mặc định cho tất cả các lần sau.
                </span>
              ) : (
                <span className="text-rose-600 font-semibold">
                  ⚠️ Đang bao gồm dữ liệu kiểm thử (acc wms_* và ban Tech / Test WMS).
                </span>
              )}
            </div>
          </div>
        </div>

        <label className="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-amber-300 shadow-xs cursor-pointer hover:bg-amber-50/60 transition-colors select-none">
          <input
            type="checkbox"
            checked={Boolean(filters.excludeTestAccounts)}
            onChange={(e) => onFilterChange({ ...filters, excludeTestAccounts: e.target.checked })}
            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
          />
          <span className="text-xs font-bold text-slate-800">
            Loại bỏ acc &amp; ban test
          </span>
        </label>
      </div>

      {/* 1. Mốc Thời Gian Phân Tích (Hôm nay: mặc định, Hôm qua, Tuần này, Tuần trước, Tháng này, Tháng trước, Khoảng thời gian) */}
      <div className="bg-slate-50/90 rounded-xl p-3 sm:p-4 border border-slate-200/90 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Mốc Thời Gian Phân Tích
            </span>
          </div>

          {presetPeriods && (
            <div className="text-[11px] text-slate-600 bg-white px-2.5 py-1 rounded-md border border-slate-200 flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-400">Đang xem:</span>
              <strong className="text-blue-700 font-semibold">{presetPeriods.current.label}</strong>
              <span className="text-slate-300">|</span>
              <span className="text-slate-400">Cùng kỳ so sánh:</span>
              <span className="text-slate-700 font-medium">{presetPeriods.previous.label}</span>
            </div>
          )}
        </div>

        {/* Danh sách các nút mốc thời gian */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {[
            { id: 'today', label: 'Hôm nay', badge: 'Mặc định' },
            { id: 'yesterday', label: 'Hôm qua' },
            { id: 'this_week', label: 'Tuần này' },
            { id: 'last_week', label: 'Tuần trước' },
            { id: 'this_month', label: 'Tháng này' },
            { id: 'last_month', label: 'Tháng trước' },
            { id: 'custom', label: 'Khoảng thời gian (tùy chọn)' },
            { id: 'all', label: 'Tất cả' },
          ].map((preset) => {
            const isActive = filters.timePreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  onFilterChange({
                    ...filters,
                    timePreset: preset.id as TimePreset,
                    date: 'ALL',
                  });
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-500/20 font-bold'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <span>{preset.label}</span>
                {preset.badge && !isActive && (
                  <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    {preset.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Khoảng thời gian: chọn từ ngày tới ngày */}
        {filters.timePreset === 'custom' && (
          <div className="bg-white rounded-lg p-3 border border-blue-200 shadow-2xs flex flex-wrap items-center gap-3 text-xs">
            <span className="font-semibold text-slate-700">Chọn khoảng ngày:</span>
            <div className="flex items-center gap-2">
              <label className="text-slate-500 text-[11px]">Từ ngày:</label>
              <input
                type="date"
                value={filters.customRange.startDate || (anchorDate ? formatToIso(anchorDate) : '')}
                onChange={(e) => {
                  const newStart = e.target.value;
                  const newEnd =
                    filters.customRange.endDate && filters.customRange.endDate >= newStart
                      ? filters.customRange.endDate
                      : newStart;
                  onFilterChange({
                    ...filters,
                    customRange: {
                      startDate: newStart,
                      endDate: newEnd,
                    },
                  });
                }}
                className="px-2.5 py-1.5 rounded border border-slate-300 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-slate-500 text-[11px]">Đến ngày:</label>
              <input
                type="date"
                value={filters.customRange.endDate || (anchorDate ? formatToIso(anchorDate) : '')}
                min={filters.customRange.startDate}
                onChange={(e) => {
                  onFilterChange({
                    ...filters,
                    customRange: {
                      startDate: filters.customRange.startDate || e.target.value,
                      endDate: e.target.value,
                    },
                  });
                }}
                className="px-2.5 py-1.5 rounded border border-slate-300 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Quick shortcuts for custom range */}
            <div className="flex items-center gap-1.5 ml-auto text-[11px]">
              <span className="text-slate-400">Gợi ý nhanh:</span>
              <button
                type="button"
                onClick={() => {
                  if (!anchorDate) return;
                  const endIso = formatToIso(anchorDate);
                  const startD = new Date(anchorDate);
                  startD.setDate(startD.getDate() - 2);
                  onFilterChange({
                    ...filters,
                    customRange: { startDate: formatToIso(startD), endDate: endIso },
                  });
                }}
                className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 font-medium cursor-pointer"
              >
                3 ngày gần nhất
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!anchorDate) return;
                  const endIso = formatToIso(anchorDate);
                  const startD = new Date(anchorDate);
                  startD.setDate(startD.getDate() - 6);
                  onFilterChange({
                    ...filters,
                    customRange: { startDate: formatToIso(startD), endDate: endIso },
                  });
                }}
                className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 font-medium cursor-pointer"
              >
                7 ngày gần nhất
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. Phân cấp lọc 3 cấp: Vai trò ➔ Ban ➔ Người */}
      <div className="bg-slate-50/80 rounded-xl p-3 sm:p-4 border border-slate-200/80">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Filter className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Lọc Phân Cấp Nhân Sự (3 Cấp Liên Tiếp)
            </span>
          </div>

          {/* Quick Active Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-white px-2.5 py-1 rounded-md border border-slate-200">
            <span className="text-slate-400">Đang lọc:</span>
            <span className={`font-semibold ${filters.role !== 'ALL' ? 'text-blue-600' : 'text-slate-600'}`}>
              {filters.role === 'ALL' ? 'Mọi vai trò' : filters.role}
            </span>
            <ArrowRight className="w-3 h-3 text-slate-400" />
            <span className={`font-semibold ${filters.department !== 'ALL' ? 'text-blue-600' : 'text-slate-600'}`}>
              {filters.department === 'ALL' ? 'Mọi ban' : filters.department}
            </span>
            <ArrowRight className="w-3 h-3 text-slate-400" />
            <span className={`font-semibold ${filters.account !== 'ALL' ? 'text-emerald-600' : 'text-slate-600'}`}>
              {filters.account === 'ALL' ? 'Tất cả người' : `@${filters.account}`}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Cấp 1: Vai trò */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>1. Vai Trò</span>
            </label>
            <div className="relative">
              <select
                value={filters.role}
                onChange={(e) => handleRoleChange(e.target.value)}
                className={`w-full py-2 pl-3 pr-8 text-xs font-semibold rounded-lg border cursor-pointer transition-all ${
                  filters.role !== 'ALL'
                    ? 'bg-blue-50/70 border-blue-300 text-blue-900 ring-2 ring-blue-500/10'
                    : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300'
                }`}
              >
                <option value="ALL">👤 Tất cả Vai trò ({availableRoles.length})</option>
                {availableRoles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Cấp 2: Ban (phụ thuộc vào Vai trò) */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              <span>2. Ban Chuyên Môn</span>
              {filters.role !== 'ALL' && (
                <span className="text-[10px] text-blue-600 font-normal lowercase">
                  (theo {filters.role})
                </span>
              )}
            </label>
            <div className="relative">
              <select
                value={filters.department}
                onChange={(e) => handleDepartmentChange(e.target.value)}
                className={`w-full py-2 pl-3 pr-8 text-xs font-semibold rounded-lg border cursor-pointer transition-all ${
                  filters.department !== 'ALL'
                    ? 'bg-blue-50/70 border-blue-300 text-blue-900 ring-2 ring-blue-500/10'
                    : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300'
                }`}
              >
                <option value="ALL">🏢 Tất cả Ban ({availableDepartments.length})</option>
                {availableDepartments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Cấp 3: Người (phụ thuộc vào Vai trò và Ban) */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>3. Từng Người (Tài Khoản)</span>
              <span className="text-[10px] text-slate-400 font-normal">
                ({availableAccounts.length} người)
              </span>
            </label>
            <div className="relative">
              <select
                value={filters.account}
                onChange={(e) => handleAccountChange(e.target.value)}
                className={`w-full py-2 pl-3 pr-8 text-xs font-semibold rounded-lg border cursor-pointer transition-all ${
                  filters.account !== 'ALL'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900 ring-2 ring-emerald-500/10'
                    : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300'
                }`}
              >
                <option value="ALL">👥 Tất cả người ({availableAccounts.length})</option>
                {availableAccounts.map((acc) => (
                  <option key={acc.account} value={acc.account}>
                    {acc.account} ({acc.count} lượt {acc.department ? `- ${acc.department}` : ''})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Selected Account Highlight Badge */}
        {filters.account !== 'ALL' && (
          <div className="mt-2.5 flex items-center justify-between bg-emerald-100/60 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs">
            <div className="flex items-center gap-2 text-emerald-900">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                Đang tập trung phân tích riêng cho tài khoản: <strong className="font-bold">@{filters.account}</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleAccountChange('ALL')}
              className="text-emerald-700 hover:text-emerald-900 font-semibold inline-flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Xem lại tất cả người</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Hàng bộ lọc bổ sung: Tìm kiếm, Ngày, Nền tảng, Chức năng */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 pt-1">
        {/* Search input */}
        <div className="relative lg:col-span-4">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            placeholder="Tìm kiếm tài khoản, ban, IP, chức năng..."
            className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400"
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
        <div className="relative lg:col-span-3">
          <select
            value={filters.date}
            onChange={(e) => onFilterChange({ ...filters, date: e.target.value })}
            className="w-full py-2 pl-3 pr-8 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
          >
            <option value="ALL">📅 Tất cả ngày ({availableDates.length} ngày)</option>
            {availableDates.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Platform Filter */}
        <div className="relative lg:col-span-3">
          <select
            value={filters.platform}
            onChange={(e) => onFilterChange({ ...filters, platform: e.target.value })}
            className="w-full py-2 pl-3 pr-8 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
          >
            <option value="ALL">🌐 Nền tảng: Tất cả</option>
            <option value="WEB">💻 Chỉ WEB</option>
            <option value="APP">📱 Chỉ APP</option>
          </select>
        </div>

        {/* Reset button */}
        <div className="lg:col-span-2 flex items-center justify-end">
          {isFiltered ? (
            <button
              type="button"
              onClick={handleReset}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Xóa bộ lọc ({filteredCount}/{totalCount})</span>
            </button>
          ) : (
            <div className="w-full text-right text-xs text-slate-400 py-2">
              Hiển thị: <strong>{totalCount}</strong> lượt
            </div>
          )}
        </div>
      </div>

      {/* 3. Quick presets: Chức năng & Khung giờ */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
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
                filters.hourRange[0] === p.range[0] && filters.hourRange[1] === p.range[1];
              return (
                <button
                  key={p.label}
                  onClick={() => onFilterChange({ ...filters, hourRange: p.range })}
                  className={`px-2 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="text-slate-500 text-xs">
          Kết quả lọc: <strong className="text-blue-600 font-semibold">{filteredCount.toLocaleString()}</strong> / {totalCount.toLocaleString()} lượt
        </div>
      </div>
    </div>
  );
};
