import { Users, Globe, Smartphone, Clock, Flame, Building2, TrendingUp, Layers } from 'lucide-react';
import { KpiMetrics } from '../types';

interface KpiCardsProps {
  metrics: KpiMetrics;
  onSelectAccount?: (account: string) => void;
  onSelectDepartment?: (dept: string) => void;
}

export function KpiCards({ metrics, onSelectAccount, onSelectDepartment }: KpiCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Tổng lượt truy cập */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Tổng Lượt Truy Cập</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {metrics.totalLogs.toLocaleString()}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="inline-flex items-center gap-1.5 text-slate-600">
            <Globe className="w-3.5 h-3.5 text-blue-500" />
            Web: <strong>{metrics.webCount}</strong> ({metrics.webPercent}%)
          </span>
          <span className="inline-flex items-center gap-1.5 text-slate-600">
            <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
            App: <strong>{metrics.appCount}</strong> ({metrics.appPercent}%)
          </span>
        </div>
      </div>

      {/* 2. Tài khoản hoạt động */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Tài Khoản Hoạt Động</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline justify-between gap-1">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {metrics.uniqueAccounts}
              </span>
              <span className="text-sm font-semibold text-slate-400">
                /{metrics.totalSystemUsers || 268}
              </span>
              <span className="text-xs font-normal text-slate-400">users</span>
            </div>
            <span className="inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
              {metrics.userParticipationRate}%
            </span>
          </div>

          {/* Thanh tiến trình tỉ lệ người dùng hoạt động */}
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2.5 overflow-hidden" title={`Tỉ lệ hoạt động: ${metrics.userParticipationRate}% (${metrics.uniqueAccounts}/${metrics.totalSystemUsers || 268} users)`}>
            <div
              className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(metrics.userParticipationRate, 100)}%` }}
            />
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <span className="text-slate-500">Tần suất cao nhất:</span>
          {metrics.topAccount.name !== '-' ? (
            <button
              onClick={() => onSelectAccount?.(metrics.topAccount.name)}
              className="font-semibold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer truncate max-w-[150px]"
              title={`Xem chi tiết ${metrics.topAccount.name}`}
            >
              @{metrics.topAccount.name} ({metrics.topAccount.count} lượt)
            </button>
          ) : (
            <span className="text-slate-400">-</span>
          )}
        </div>
      </div>

      {/* 3. Ban Chuyên Môn */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Ban Chuyên Môn</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline justify-between gap-1">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {metrics.uniqueDepartments}
              </span>
              <span className="text-sm font-semibold text-slate-400">
                /{metrics.totalSystemDepartments || 24}
              </span>
              <span className="text-xs font-normal text-slate-400">ban</span>
            </div>
            <span className="inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
              {metrics.departmentParticipationRate}%
            </span>
          </div>

          {/* Thanh tiến trình độ phủ ban chuyên môn */}
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2.5 overflow-hidden" title={`Độ phủ ban chuyên môn: ${metrics.departmentParticipationRate}% (${metrics.uniqueDepartments}/${metrics.totalSystemDepartments || 24} ban)`}>
            <div
              className="bg-amber-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(metrics.departmentParticipationRate, 100)}%` }}
            />
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <span className="text-slate-500">Ban sôi nổi nhất:</span>
          {metrics.topDepartment.name !== '-' ? (
            <button
              onClick={() => onSelectDepartment?.(metrics.topDepartment.name)}
              className="font-semibold text-amber-700 hover:underline cursor-pointer truncate max-w-[150px]"
              title={`Lọc theo ban ${metrics.topDepartment.name}`}
            >
              {metrics.topDepartment.name} ({metrics.topDepartment.count} lượt)
            </button>
          ) : (
            <span className="text-slate-400">-</span>
          )}
        </div>
      </div>

      {/* 4. Khung Giờ Cao Điểm */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Thời Điểm Cao Điểm</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {String(metrics.peakHour.hour).padStart(2, '0')}:00 - {String(metrics.peakHour.hour + 1).padStart(2, '0')}:00
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <span className="text-slate-500">Ngày cao nhất:</span>
          <span className="font-semibold text-slate-800">
            {metrics.peakDay.date} ({metrics.peakDay.count} lượt)
          </span>
        </div>
      </div>
    </div>
  );
}
