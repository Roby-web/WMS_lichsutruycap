import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Cell,
  ReferenceLine,
} from 'recharts';
import {
  Users,
  Calendar,
  Award,
  Building2,
  TrendingUp,
  Sparkles,
  Zap,
  Flame,
  UserCheck,
  ChevronRight,
} from 'lucide-react';
import {
  DailyUserFrequencyStat,
  UserDailyAvgStat,
  DepartmentDailyAvgStat,
} from '../../types';

interface UserDailyAverageChartProps {
  dailyUserAvgData: DailyUserFrequencyStat[];
  userDailyRanking: UserDailyAvgStat[];
  departmentDailyAvg: DepartmentDailyAvgStat[];
  onSelectAccount?: (account: string) => void;
  onSelectDepartment?: (dept: string) => void;
}

export const UserDailyAverageChart: React.FC<UserDailyAverageChartProps> = ({
  dailyUserAvgData,
  userDailyRanking,
  departmentDailyAvg,
  onSelectAccount,
  onSelectDepartment,
}) => {
  const [viewMode, setViewMode] = useState<'timeline' | 'ranking' | 'department'>('timeline');

  // Overall average per user per day
  const totalUserSessions = dailyUserAvgData.reduce((acc, d) => acc + d.activeUsers, 0);
  const totalLogsAcrossDays = dailyUserAvgData.reduce((acc, d) => acc + d.totalLogs, 0);
  const overallAvgPerUser = totalUserSessions > 0
    ? Number((totalLogsAcrossDays / totalUserSessions).toFixed(1))
    : 0;

  // Peak day
  const peakDay = useMemo(() => {
    if (!dailyUserAvgData.length) return null;
    return [...dailyUserAvgData].sort((a, b) => b.avgPerUser - a.avgPerUser)[0];
  }, [dailyUserAvgData]);

  // Average active users per day
  const avgActiveUsersPerDay = dailyUserAvgData.length > 0
    ? Math.round(totalUserSessions / dailyUserAvgData.length)
    : 0;

  // Top active user by avg frequency
  const topActiveUser = userDailyRanking[0] || null;

  // Top department by avg frequency
  const topDept = departmentDailyAvg[0] || null;

  // Slice top 10 users for ranking chart
  const topUsersData = useMemo(() => {
    return userDailyRanking.slice(0, 10);
  }, [userDailyRanking]);

  // Slice top 10 departments
  const topDeptsData = useMemo(() => {
    return departmentDailyAvg.slice(0, 10);
  }, [departmentDailyAvg]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-xs">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">
                Tần Suất Trung Bình / Người / Ngày
              </h3>
              <span className="bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded text-[11px] border border-emerald-200">
                Chỉ số hiệu suất (KPI)
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Số lượt thao tác truy cập trung bình mà một nhân sự thực hiện mỗi ngày làm việc
            </p>
          </div>
        </div>

        {/* View switcher tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-semibold">
          <button
            type="button"
            onClick={() => setViewMode('timeline')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'timeline'
                ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Theo Từng Ngày</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('ranking')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'ranking'
                ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Top Nhân Sự</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('department')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'department'
                ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Theo Ban Chuyên Môn</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Highlight Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-emerald-50/60 rounded-xl p-3 border border-emerald-200/70">
          <span className="text-slate-500 text-[11px] block">Tần suất TB toàn kỳ</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl sm:text-2xl font-black text-emerald-700">
              {overallAvgPerUser}
            </span>
            <span className="text-xs text-emerald-800 font-medium">lượt / người / ngày</span>
          </div>
          <span className="text-[11px] text-emerald-600 mt-0.5 block">
            Dựa trên {totalUserSessions} lượt nhân sự theo ngày
          </span>
        </div>

        <div className="bg-blue-50/60 rounded-xl p-3 border border-blue-200/70">
          <span className="text-slate-500 text-[11px] block">Ngày có tần suất cao nhất</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-lg sm:text-xl font-bold text-blue-700">
              {peakDay ? `${peakDay.avgPerUser} lượt` : 'N/A'}
            </span>
            <span className="text-xs text-blue-600">/ người</span>
          </div>
          <span className="text-[11px] text-blue-700 font-medium mt-0.5 block truncate">
            {peakDay ? `${peakDay.date} (${peakDay.dayOfWeek})` : 'N/A'}
          </span>
        </div>

        <div className="bg-purple-50/60 rounded-xl p-3 border border-purple-200/70">
          <span className="text-slate-500 text-[11px] block">Nhân sự năng động nhất</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-base sm:text-lg font-bold text-purple-700 truncate max-w-[140px]">
              {topActiveUser ? `@${topActiveUser.account}` : 'N/A'}
            </span>
            <span className="text-xs font-semibold text-purple-900">
              {topActiveUser ? `${topActiveUser.avgPerDay} lượt/ngày` : ''}
            </span>
          </div>
          <span className="text-[11px] text-purple-600 mt-0.5 block truncate">
            {topActiveUser ? `${topActiveUser.department} (${topActiveUser.activeDaysCount} ngày online)` : 'N/A'}
          </span>
        </div>

        <div className="bg-amber-50/60 rounded-xl p-3 border border-amber-200/70">
          <span className="text-slate-500 text-[11px] block">Quy mô nhân sự online</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl sm:text-2xl font-black text-amber-700">
              {avgActiveUsersPerDay}
            </span>
            <span className="text-xs text-amber-800 font-medium">người / ngày (TB)</span>
          </div>
          <span className="text-[11px] text-amber-700 mt-0.5 block truncate">
            {topDept ? `Ban cao nhất: ${topDept.department}` : 'Toàn tòa soạn'}
          </span>
        </div>
      </div>

      {/* Chart Section */}
      <div className="h-72 sm:h-80 w-full pt-2">
        {viewMode === 'timeline' && (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={dailyUserAvgData}
              margin={{ top: 15, right: 20, left: -10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="displayDate"
                tick={{ fontSize: 11, fill: '#475569' }}
                tickLine={false}
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 10, fill: '#059669' }}
                tickLine={false}
                axisLine={false}
                unit=" lượt"
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 10, fill: '#3b82f6' }}
                tickLine={false}
                axisLine={false}
                unit=" ng"
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as DailyUserFrequencyStat;
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 z-50 min-w-[200px]">
                        <div className="font-bold text-emerald-400 flex items-center justify-between gap-3 border-b border-slate-700 pb-1.5">
                          <span>{data.displayDate}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                            {data.date}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4 pt-1">
                          <span className="text-slate-300">Tần suất TB / người:</span>
                          <span className="font-black text-emerald-300 text-sm">
                            {data.avgPerUser} lượt/người/ngày
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-slate-300">
                          <span>Số người online:</span>
                          <span className="font-bold text-blue-400">{data.activeUsers} nhân sự</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-slate-300">
                          <span>Tổng số lượt truy cập:</span>
                          <span className="font-medium text-white">{data.totalLogs} lượt</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-[11px] text-slate-400 border-t border-slate-800 pt-1">
                          <span>Nền tảng:</span>
                          <span>💻 Web: {data.web} | 📱 App: {data.app}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }}
              />

              {/* Reference line for overall average */}
              {overallAvgPerUser > 0 && (
                <ReferenceLine
                  yAxisId="left"
                  y={overallAvgPerUser}
                  stroke="#10b981"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: `Mức TB chung: ${overallAvgPerUser} lượt/người`,
                    fill: '#047857',
                    fontSize: 10,
                    position: 'insideTopLeft',
                  }}
                />
              )}

              {/* Bar: Tần suất TB / người / ngày */}
              <Bar
                yAxisId="left"
                dataKey="avgPerUser"
                name="Tần suất TB (Lượt/Người/Ngày)"
                radius={[6, 6, 0, 0]}
                barSize={32}
              >
                {dailyUserAvgData.map((entry, idx) => {
                  const isPeak = peakDay && entry.date === peakDay.date;
                  return (
                    <Cell
                      key={`daily-cell-${entry.date || idx}`}
                      fill={isPeak ? '#059669' : '#10b981'}
                    />
                  );
                })}
              </Bar>

              {/* Line: Số nhân sự online */}
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="activeUsers"
                name="Số nhân sự online (Người)"
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#ffffff' }}
                activeDot={{ r: 6 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}

        {viewMode === 'ranking' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={topUsersData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: '#64748b' }}
                tickLine={false}
                axisLine={false}
                unit=" lượt/ngày"
              />
              <YAxis
                type="category"
                dataKey="account"
                tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }}
                tickLine={false}
                axisLine={false}
                width={85}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as UserDailyAvgStat;
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 z-50">
                        <div className="font-bold text-purple-300 flex items-center justify-between gap-4 border-b border-slate-700 pb-1">
                          <span>@{data.account}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
                            {data.department}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4 pt-1">
                          <span className="text-slate-300">Tần suất TB / ngày:</span>
                          <span className="font-black text-amber-300 text-sm">
                            {data.avgPerDay} lượt / ngày
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-slate-300">
                          <span>Số ngày có hoạt động:</span>
                          <span className="font-bold text-white">{data.activeDaysCount} ngày</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-slate-300">
                          <span>Tổng số lượt truy cập:</span>
                          <span className="font-medium text-emerald-400">{data.totalLogs} lượt</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-[11px] text-slate-400 border-t border-slate-800 pt-1">
                          <span>Phân bố:</span>
                          <span>💻 Web: {data.webCount} | 📱 App: {data.appCount}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                dataKey="avgPerDay"
                name="Tần suất TB (Lượt/Ngày)"
                radius={[0, 4, 4, 0]}
                onClick={(item) => {
                  if (onSelectAccount && item?.account) {
                    onSelectAccount(item.account);
                  }
                }}
                className="cursor-pointer"
              >
                {topUsersData.map((entry, idx) => (
                  <Cell
                    key={`user-bar-${entry.account || idx}`}
                    fill={idx === 0 ? '#7c3aed' : idx < 3 ? '#8b5cf6' : '#a78bfa'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        {viewMode === 'department' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={topDeptsData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: '#64748b' }}
                tickLine={false}
                axisLine={false}
                unit=" lượt/ng/ngày"
              />
              <YAxis
                type="category"
                dataKey="department"
                tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }}
                tickLine={false}
                axisLine={false}
                width={120}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as DepartmentDailyAvgStat;
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 z-50">
                        <div className="font-bold text-amber-300 border-b border-slate-700 pb-1">
                          {data.department}
                        </div>
                        <div className="flex items-center justify-between gap-4 pt-1">
                          <span className="text-slate-300">Tần suất TB / người / ngày:</span>
                          <span className="font-black text-amber-300 text-sm">
                            {data.avgPerUserPerDay} lượt/người/ngày
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-slate-300">
                          <span>Quy mô nhân sự:</span>
                          <span className="font-bold text-white">{data.userCount} người</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-slate-300">
                          <span>Tổng số lượt truy cập:</span>
                          <span className="font-medium text-emerald-400">{data.totalLogs} lượt</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                dataKey="avgPerUserPerDay"
                name="Tần suất TB (Lượt/Người/Ngày)"
                radius={[0, 4, 4, 0]}
                onClick={(item) => {
                  if (onSelectDepartment && item?.department) {
                    onSelectDepartment(item.department);
                  }
                }}
                className="cursor-pointer"
              >
                {topDeptsData.map((entry, idx) => (
                  <Cell
                    key={`dept-bar-${entry.department || idx}`}
                    fill={idx === 0 ? '#d97706' : idx < 3 ? '#f59e0b' : '#fbbf24'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Footer explanations */}
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            Công thức: Tổng số lượt truy cập trong ngày ÷ Số nhân sự hoạt động trong ngày
          </span>
        </div>

        {viewMode === 'ranking' && (
          <span className="text-slate-400 text-[11px]">
            * Click vào thanh nhân sự để lọc dữ liệu của người đó
          </span>
        )}
        {viewMode === 'department' && (
          <span className="text-slate-400 text-[11px]">
            * Click vào thanh ban để lọc dữ liệu của ban đó
          </span>
        )}
      </div>
    </div>
  );
};
