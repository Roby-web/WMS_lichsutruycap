import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Cell,
  ReferenceLine,
} from 'recharts';
import { Clock, CalendarDays, TrendingUp, Sparkles, UserCheck, Flame } from 'lucide-react';
import { HourlyAverageStat, WeekdayAverageStat } from '../../types';

interface AverageTrendChartsProps {
  hourlyAvgData: HourlyAverageStat[];
  weekdayAvgData: WeekdayAverageStat[];
  totalDays: number;
}

export const AverageTrendCharts: React.FC<AverageTrendChartsProps> = ({
  hourlyAvgData,
  weekdayAvgData,
  totalDays,
}) => {
  const [hourMetric, setHourMetric] = useState<'avg' | 'total'>('avg');
  const [weekdayMetric, setWeekdayMetric] = useState<'avg' | 'total'>('avg');

  // Find peak hour
  const peakHour = [...hourlyAvgData].sort((a, b) => b.avgCount - a.avgCount)[0];
  // Calculate average of hourly averages
  const overallAvgPerHour = (
    hourlyAvgData.reduce((acc, h) => acc + h.avgCount, 0) / (hourlyAvgData.length || 1)
  ).toFixed(1);

  // Find peak weekday
  const peakWeekday = [...weekdayAvgData].sort((a, b) => b.avgCount - a.avgCount)[0];
  // Total weekday count
  const weekdayTotalLogs = weekdayAvgData.reduce((acc, w) => acc + w.totalCount, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Biểu đồ Trung bình trong ngày (Từng giờ trong ngày) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Trung Bình Trong Ngày (Từng Giờ)
                </h3>
                <p className="text-xs text-slate-500">
                  Tần suất truy cập trung bình/ngày qua 24 khung giờ ({totalDays} ngày ghi nhận)
                </p>
              </div>
            </div>

            {/* Toggle metric */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setHourMetric('avg')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  hourMetric === 'avg'
                    ? 'bg-white text-blue-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                TB Lượt / Ngày
              </button>
              <button
                type="button"
                onClick={() => setHourMetric('total')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  hourMetric === 'total'
                    ? 'bg-white text-blue-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tổng Lượt Tích Lũy
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-2 mb-4 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-center text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Cao điểm nhất</span>
              <span className="font-bold text-blue-700 flex items-center justify-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                {peakHour ? `${peakHour.label} (${peakHour.avgCount} lượt/ngày)` : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">TB mỗi giờ</span>
              <span className="font-bold text-slate-800">{overallAvgPerHour} lượt/h</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Khung giờ làm việc</span>
              <span className="font-bold text-emerald-700">08:00 - 17:00</span>
            </div>
          </div>

          {/* Chart */}
          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyAvgData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickLine={false}
                  interval={2}
                />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as HourlyAverageStat;
                      return (
                        <div className="bg-slate-900 text-white p-2.5 rounded-lg shadow-lg text-xs space-y-1 z-50">
                          <div className="font-bold text-blue-300 flex items-center justify-between gap-4 border-b border-slate-700 pb-1">
                            <span>Khung giờ: {data.label} - {String(data.hour + 1).padStart(2, '0')}:00</span>
                            <span className="text-[11px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">
                              {data.percentage}%
                            </span>
                          </div>
                          <div className="pt-1 flex justify-between gap-4">
                            <span className="text-slate-300">Trung bình / ngày:</span>
                            <span className="font-bold text-amber-400">{data.avgCount} lượt/ngày</span>
                          </div>
                          <div className="flex justify-between gap-4 text-slate-300">
                            <span>Tổng tích lũy:</span>
                            <span className="font-medium text-white">{data.totalCount} lượt</span>
                          </div>
                          <div className="flex justify-between gap-4 text-[11px] text-slate-400">
                            <span>Phân bổ nền tảng:</span>
                            <span>💻 Web: {data.web} | 📱 App: {data.app}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey={hourMetric === 'avg' ? 'avgCount' : 'totalCount'}
                  name={hourMetric === 'avg' ? 'TB Lượt/Ngày' : 'Tổng Lượt'}
                  radius={[4, 4, 0, 0]}
                >
                  {hourlyAvgData.map((entry) => {
                    const isPeak = peakHour && entry.hour === peakHour.hour;
                    const isWorkHour = entry.hour >= 8 && entry.hour <= 17;
                    return (
                      <Cell
                        key={`cell-hour-${entry.hour}`}
                        fill={isPeak ? '#2563eb' : isWorkHour ? '#3b82f6' : '#94a3b8'}
                      />
                    );
                  })}
                </Bar>
                <ReferenceLine
                  y={Number(overallAvgPerHour)}
                  stroke="#ef4444"
                  strokeDasharray="3 3"
                  label={{
                    value: `TB: ${overallAvgPerHour}`,
                    fill: '#ef4444',
                    fontSize: 10,
                    position: 'right',
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-3 border-t border-slate-100 mt-2">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-blue-600 inline-block" /> Cao điểm
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-blue-400 inline-block" /> Giờ hành chính
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-slate-400 inline-block" /> Ngoài giờ
            </span>
          </div>
          <span className="text-slate-400">Đơn vị: lượt truy cập</span>
        </div>
      </div>

      {/* 2. Biểu đồ Trung bình trong tuần (Từng ngày trong tuần) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                <CalendarDays className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Trung Bình Trong Tuần (Từng Thứ)
                </h3>
                <p className="text-xs text-slate-500">
                  Phân bố tần suất theo chu kỳ Thứ Hai đến Chủ Nhật
                </p>
              </div>
            </div>

            {/* Toggle metric */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setWeekdayMetric('avg')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  weekdayMetric === 'avg'
                    ? 'bg-white text-indigo-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                TB Lượt / Ngày
              </button>
              <button
                type="button"
                onClick={() => setWeekdayMetric('total')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  weekdayMetric === 'total'
                    ? 'bg-white text-indigo-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tổng Lượt Tích Lũy
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-2 mb-4 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-center text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Sôi nổi nhất</span>
              <span className="font-bold text-indigo-700 flex items-center justify-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                {peakWeekday ? `${peakWeekday.dayName} (${peakWeekday.avgCount} lượt)` : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Tổng lượt trong tuần</span>
              <span className="font-bold text-slate-800">{weekdayTotalLogs.toLocaleString()} lượt</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Người dùng tích cực</span>
              <span className="font-bold text-indigo-700 flex items-center justify-center gap-1">
                <UserCheck className="w-3.5 h-3.5" />
                {peakWeekday ? `${peakWeekday.uniqueUsers} người` : 'N/A'}
              </span>
            </div>
          </div>

          {/* Chart */}
          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekdayAvgData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="dayName"
                  tick={{ fontSize: 11, fill: '#475569' }}
                  tickLine={false}
                />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as WeekdayAverageStat;
                      return (
                        <div className="bg-slate-900 text-white p-2.5 rounded-lg shadow-lg text-xs space-y-1 z-50">
                          <div className="font-bold text-indigo-300 flex items-center justify-between gap-4 border-b border-slate-700 pb-1">
                            <span>{data.dayName}</span>
                            <span className="text-[11px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                              {data.percentage}%
                            </span>
                          </div>
                          <div className="pt-1 flex justify-between gap-4">
                            <span className="text-slate-300">Trung bình / ngày:</span>
                            <span className="font-bold text-amber-400">{data.avgCount} lượt/ngày</span>
                          </div>
                          <div className="flex justify-between gap-4 text-slate-300">
                            <span>Tổng tích lũy:</span>
                            <span className="font-medium text-white">{data.totalCount} lượt ({data.distinctDays} ngày ghi nhận)</span>
                          </div>
                          <div className="flex justify-between gap-4 text-slate-300">
                            <span>Số người truy cập:</span>
                            <span className="font-semibold text-emerald-400">{data.uniqueUsers} người</span>
                          </div>
                          <div className="flex justify-between gap-4 text-[11px] text-slate-400">
                            <span>Phân bổ:</span>
                            <span>💻 Web: {data.web} | 📱 App: {data.app}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey={weekdayMetric === 'avg' ? 'avgCount' : 'totalCount'}
                  name={weekdayMetric === 'avg' ? 'TB Lượt/Ngày' : 'Tổng Lượt'}
                  radius={[4, 4, 0, 0]}
                >
                  {weekdayAvgData.map((entry) => {
                    const isPeak = peakWeekday && entry.dayIndex === peakWeekday.dayIndex;
                    const isWeekend = entry.dayIndex >= 6;
                    return (
                      <Cell
                        key={`cell-weekday-${entry.dayIndex}`}
                        fill={isPeak ? '#4f46e5' : isWeekend ? '#a5b4fc' : '#6366f1'}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-3 border-t border-slate-100 mt-2">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-indigo-600 inline-block" /> Ngày sôi nổi nhất
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-indigo-500 inline-block" /> Ngày trong tuần (T2-T6)
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-indigo-300 inline-block" /> Cuối tuần (T7-CN)
            </span>
          </div>
          <span className="text-slate-400">Tần suất theo ngày trong tuần</span>
        </div>
      </div>
    </div>
  );
};
