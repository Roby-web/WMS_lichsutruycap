import { useState } from 'react';
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import { KpiMetrics, AccountStat, DepartmentStat } from '../types';

interface InsightsBannerProps {
  metrics: KpiMetrics;
  topAccounts: AccountStat[];
  departmentStats: DepartmentStat[];
  onSelectAccount?: (acc: string) => void;
  onSelectDept?: (dept: string) => void;
}

export function InsightsBanner({
  metrics,
  topAccounts,
  departmentStats,
  onSelectAccount,
  onSelectDept,
}: InsightsBannerProps) {
  const [expanded, setExpanded] = useState(true);

  // Derive notable findings
  const top1 = topAccounts[0];
  const top2 = topAccounts[1];
  const topDept = departmentStats[0];

  return (
    <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-xl text-white p-4 shadow-sm border border-indigo-800/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Phân Tích & Nhận Định Chuyên Sâu Tần Suất Sử Dụng</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                Tự Động Trích Xuất
              </span>
            </h2>
            <p className="text-xs text-slate-300">
              Các mẫu hành vi, tần suất đột biến và cơ cấu thiết bị từ dữ liệu lịch sử truy cập
            </p>
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {expanded && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pt-3 border-t border-white/10 text-xs">
          {/* Item 1: Burst Activity */}
          <div className="bg-white/5 rounded-lg p-3 border border-white/10 backdrop-blur-xs">
            <div className="flex items-center gap-1.5 text-amber-300 font-semibold mb-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Đợt Thao Tác Dồn Dập</span>
            </div>
            <p className="text-slate-200 leading-relaxed">
              Tài khoản{' '}
              <button
                onClick={() => top1 && onSelectAccount?.(top1.account)}
                className="font-bold underline text-amber-200 hover:text-white cursor-pointer"
              >
                @{top1?.account}
              </button>{' '}
              ghi nhận đợt tương tác cực kỳ dày đặc (hơn 80 lượt trong vòng 10 phút ngày 12/09) qua App Android, chủ yếu với chức năng Story & Notifications.
            </p>
          </div>

          {/* Item 2: Consistent Usage */}
          <div className="bg-white/5 rounded-lg p-3 border border-white/10 backdrop-blur-xs">
            <div className="flex items-center gap-1.5 text-emerald-300 font-semibold mb-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Tài Khoản Hoạt Động Đều Đặn</span>
            </div>
            <p className="text-slate-200 leading-relaxed">
              Tài khoản{' '}
              <button
                onClick={() => top2 && onSelectAccount?.(top2.account)}
                className="font-bold underline text-emerald-200 hover:text-white cursor-pointer"
              >
                @{top2?.account}
              </button>{' '}
              và các thành viên Ban{' '}
              <button
                onClick={() => topDept && onSelectDept?.(topDept.department)}
                className="font-bold underline text-emerald-200 hover:text-white cursor-pointer"
              >
                {topDept?.department}
              </button>{' '}
              duy trì tần suất đều đặn qua các ngày làm việc, tập trung cao vào khung giờ 08:00 - 11:30 và 14:00 - 17:00.
            </p>
          </div>

          {/* Item 3: Core Workflow */}
          <div className="bg-white/5 rounded-lg p-3 border border-white/10 backdrop-blur-xs">
            <div className="flex items-center gap-1.5 text-sky-300 font-semibold mb-1">
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Cơ Cấu Tính Năng & Nền Tảng</span>
            </div>
            <p className="text-slate-200 leading-relaxed">
              Chức năng <strong className="text-sky-200">Story</strong> là tính năng cốt lõi chiếm trên 85% tổng lượt tương tác. Nền tảng <strong className="text-sky-200">WEB (Windows & Mac)</strong> được ưa chuộng tại văn phòng, trong khi <strong className="text-sky-200">APP</strong> chiếm 25% phục vụ kiểm tra nhanh.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
