import { X, User, Globe, Smartphone, Monitor, Shield, Calendar, Clock, Filter, Activity, Zap } from 'lucide-react';
import { AccountStat, AccessRecord } from '../types';

interface AccountDetailModalProps {
  accountName: string | null;
  accountStat?: AccountStat;
  userRecords: AccessRecord[];
  onClose: () => void;
  onFilterByAccount: (account: string) => void;
}

export function AccountDetailModal({
  accountName,
  accountStat,
  userRecords,
  onClose,
  onFilterByAccount,
}: AccountDetailModalProps) {
  if (!accountName || !accountStat) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xl font-bold shadow-md shadow-blue-500/20">
              {accountName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">@{accountName}</h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800">
                  {accountStat.role || 'Trưởng/Phó ban'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Ban: <strong className="text-slate-700">{accountStat.departments.join(', ')}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-slate-600">
          {/* Metrics summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-400 text-[11px] uppercase font-semibold">Tổng lượt truy cập</span>
              <div className="text-2xl font-extrabold text-blue-600 mt-0.5">{accountStat.count}</div>
              <span className="text-[10px] text-slate-500">Chiếm {accountStat.percentage}% hệ thống</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-400 text-[11px] uppercase font-semibold">Nền tảng chính</span>
              <div className="text-lg font-bold text-slate-800 mt-1 flex items-center gap-1">
                {accountStat.primaryPlatform === 'WEB' ? (
                  <Globe className="w-4 h-4 text-blue-500" />
                ) : (
                  <Smartphone className="w-4 h-4 text-emerald-500" />
                )}
                {accountStat.primaryPlatform}
              </div>
              <span className="text-[10px] text-slate-500">HĐH: {accountStat.primaryOs}</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-400 text-[11px] uppercase font-semibold">Số ngày hoạt động</span>
              <div className="text-2xl font-extrabold text-indigo-600 mt-0.5">{accountStat.daysActive.length}</div>
              <span className="text-[10px] text-slate-500">ngày ghi nhận</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-400 text-[11px] uppercase font-semibold">Lần truy cập cuối</span>
              <div className="text-xs font-bold text-slate-800 mt-1 leading-snug truncate" title={accountStat.latestAccess}>
                {accountStat.latestAccess}
              </div>
              <span className="text-[10px] text-slate-500">Gần nhất</span>
            </div>
          </div>

          {/* Features breakdown */}
          <div>
            <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5 text-xs">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              Tần Suất Sử Dụng Từng Chức Năng
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(accountStat.featuresUsed).map(([feat, count]) => {
                const percent = Math.round((count / accountStat.count) * 100);
                return (
                  <div key={feat} className="p-2.5 rounded-lg border border-slate-200 bg-white">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800">{feat}</span>
                      <span className="font-bold text-blue-600">{count} lượt</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                      <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${percent}%` }} />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block text-right">{percent}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* IP Addresses used */}
          <div>
            <h4 className="font-bold text-slate-900 mb-1.5 text-xs">Địa Chỉ IP Từng Kết Nối ({accountStat.ips.length})</h4>
            <div className="flex flex-wrap gap-1.5">
              {accountStat.ips.map((ip) => (
                <span key={ip} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px] border border-slate-200">
                  {ip}
                </span>
              ))}
            </div>
          </div>

          {/* Recent logs preview */}
          <div>
            <h4 className="font-bold text-slate-900 mb-2 flex items-center justify-between text-xs">
              <span>5 Thao Tác Gần Nhất</span>
              <span className="text-[11px] text-slate-400 font-normal">Tổng {userRecords.length} sự kiện</span>
            </h4>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {userRecords.slice(0, 5).map((rec) => (
                <div
                  key={rec.stt}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-slate-700"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span className="font-semibold text-slate-900">{rec.feature}</span>
                    <span className="text-slate-400">({rec.platform} - {rec.os})</span>
                  </div>
                  <div className="font-mono text-[11px] text-slate-500">
                    {rec.time} {rec.date}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <button
            onClick={() => {
              onFilterByAccount(accountName);
              onClose();
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Lọc Toàn Bộ Dashboard Theo @{accountName}</span>
          </button>

          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/50 rounded-lg transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
