import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import { DailyStat, HourlyStat } from '../../types';
import {
  Clock,
  Calendar,
  TrendingUp,
  LineChart as LineChartIcon,
  BarChart3,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  CalendarRange,
} from 'lucide-react';

interface TimeTrendChartProps {
  dailyData: DailyStat[];
  hourlyData: HourlyStat[];
  fullDailyData?: DailyStat[]; // Dữ liệu full tất cả các ngày từ khi bắt đầu có dữ liệu
  selectedDate?: string;
  onSelectDate?: (date: string) => void;
}

export function TimeTrendChart({
  dailyData,
  hourlyData,
  fullDailyData,
  selectedDate,
  onSelectDate,
}: TimeTrendChartProps) {
  const [viewMode, setViewMode] = useState<'daily' | 'hourly'>('daily');
  // Mặc định là Dạng Line theo yêu cầu của người dùng
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar'>('line');
  // Mặc định hiển thị full tất cả các ngày từ khi có dữ liệu
  const [useFullHistory, setUseFullHistory] = useState<boolean>(true);
  const [showUniqueUsersLine, setShowUniqueUsersLine] = useState<boolean>(true);

  // Chọn bộ dữ liệu ngày để hiển thị: ưu tiên fullDailyData khi bật chế độ xem toàn bộ
  const activeDailyData = useMemo(() => {
    if (useFullHistory && fullDailyData && fullDailyData.length > 0) {
      return fullDailyData;
    }
    return dailyData;
  }, [useFullHistory, fullDailyData, dailyData]);

  // Tính toán khoảng ngày thực tế và các chỉ số xu hướng thay đổi
  const trendAnalysis = useMemo(() => {
    if (!activeDailyData || activeDailyData.length === 0) {
      return {
        dateRangeLabel: '',
        totalDays: 0,
        totalLogs: 0,
        avgDaily: 0,
        firstDay: null,
        lastDay: null,
        peakDay: null,
        lowestDay: null,
        changeRate: 0,
      };
    }

    const totalDays = activeDailyData.length;
    const totalLogs = activeDailyData.reduce((acc, d) => acc + d.count, 0);
    const avgDaily = totalDays > 0 ? Math.round(totalLogs / totalDays) : 0;

    const firstDay = activeDailyData[0];
    const lastDay = activeDailyData[activeDailyData.length - 1];

    let peakDay = activeDailyData[0];
    let lowestDay = activeDailyData[0];

    activeDailyData.forEach((d) => {
      if (d.count > peakDay.count) peakDay = d;
      if (d.count < lowestDay.count) lowestDay = d;
    });

    // Tính tỷ lệ thay đổi từ ngày đầu tới ngày cuối
    let changeRate = 0;
    if (firstDay && lastDay && firstDay.count > 0) {
      changeRate = Number((((lastDay.count - firstDay.count) / firstDay.count) * 100).toFixed(1));
    }

    const firstDateStr = firstDay?.date || '';
    const lastDateStr = lastDay?.date || '';
    const dateRangeLabel = firstDateStr === lastDateStr ? firstDateStr : `${firstDateStr} – ${lastDateStr}`;

    return {
      dateRangeLabel,
      totalDays,
      totalLogs,
      avgDaily,
      firstDay,
      lastDay,
      peakDay,
      lowestDay,
      changeRate,
    };
  }, [activeDailyData]);

  // Tìm displayDate của selectedDate nếu có
  const selectedDayDisplay = useMemo(() => {
    if (!selectedDate || selectedDate === 'ALL') return null;
    const found = activeDailyData.find((d) => d.date === selectedDate);
    return found ? found.displayDate : null;
  }, [selectedDate, activeDailyData]);

  // Custom Tooltip cho Line Chart
  const CustomDailyTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as DailyStat;
      const total = data.count;
      const webPercent = total > 0 ? Math.round((data.web / total) * 100) : 0;
      const appPercent = total > 0 ? Math.round((data.app / total) * 100) : 0;

      // Tìm ngày trước đó để tính biến động
      const currentIndex = activeDailyData.findIndex((d) => d.date === data.date);
      const prevDay = currentIndex > 0 ? activeDailyData[currentIndex - 1] : null;
      let dayGrowth = 0;
      let hasGrowth = false;
      if (prevDay && prevDay.count > 0) {
        dayGrowth = Math.round(((total - prevDay.count) / prevDay.count) * 100);
        hasGrowth = true;
      }

      return (
        <div className="bg-white/95 backdrop-blur-md p-3 rounded-xl border border-slate-200 shadow-xl text-xs space-y-2 min-w-[210px] animate-in fade-in duration-100">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
            <span className="font-bold text-slate-800">{data.displayDate}</span>
            {hasGrowth && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${
                  dayGrowth >= 0
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {dayGrowth >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                <span>{dayGrowth >= 0 ? `+${dayGrowth}%` : `${dayGrowth}%`}</span>
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-blue-900 font-bold bg-blue-50/70 px-2 py-1 rounded-lg">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                <span>Tổng lượt truy cập:</span>
              </span>
              <span className="text-sm font-extrabold">{total.toLocaleString()} lượt</span>
            </div>

            <div className="flex items-center justify-between text-slate-600 px-1 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                <span>Web:</span>
              </span>
              <span className="font-semibold text-slate-800">
                {data.web.toLocaleString()} lượt ({webPercent}%)
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-600 px-1 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Mobile App:</span>
              </span>
              <span className="font-semibold text-slate-800">
                {data.app.toLocaleString()} lượt ({appPercent}%)
              </span>
            </div>

            <div className="flex items-center justify-between text-purple-700 border-t border-slate-100 pt-1 px-1 text-[11px]">
              <span>Tài khoản hoạt động:</span>
              <span className="font-bold">{data.uniqueUsers} người</span>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 text-center italic pt-0.5">
            Click vào điểm để lọc dữ liệu ngày này
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
      {/* Header controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              {viewMode === 'daily' ? (
                <>
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <span>Xu Hướng Tần Suất Theo Ngày</span>
                </>
              ) : (
                <>
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                  <span>Phân Bố Tần Suất Theo Khung Giờ (00h - 23h)</span>
                </>
              )}
            </h2>

            {viewMode === 'daily' && trendAnalysis.dateRangeLabel && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                <CalendarRange className="w-3 h-3" />
                <span>{trendAnalysis.dateRangeLabel} ({trendAnalysis.totalDays} ngày)</span>
              </span>
            )}
          </div>

          <p className="text-xs text-slate-500 mt-1">
            {viewMode === 'daily'
              ? 'Đường biểu diễn xu hướng tương tác, phân bổ Web/App và sự thay đổi tần suất qua các ngày'
              : 'Thời điểm các ban và tài khoản thao tác sôi nổi nhất trong ngày'}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode: Theo Ngày / Theo Giờ */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-medium shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode('daily')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'daily'
                  ? 'bg-white text-blue-700 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Theo Ngày
            </button>
            <button
              type="button"
              onClick={() => setViewMode('hourly')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'hourly'
                  ? 'bg-white text-indigo-700 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Theo Giờ (0-23h)
            </button>
          </div>

          {/* Chart Type Toggle: Line (mặc định) / Area / Bar */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-medium shadow-2xs">
            <button
              type="button"
              onClick={() => setChartType('line')}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                chartType === 'line'
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Dạng đường biểu diễn xu hướng (Mặc định)"
            >
              <LineChartIcon className="w-3.5 h-3.5" />
              <span>Dạng Line</span>
            </button>

            <button
              type="button"
              onClick={() => setChartType('area')}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                chartType === 'area'
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Dạng miền phân bổ"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Dạng Miền</span>
            </button>

            <button
              type="button"
              onClick={() => setChartType('bar')}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                chartType === 'bar'
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Dạng cột"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Dạng Cột</span>
            </button>
          </div>

          {/* Full history toggle if available */}
          {fullDailyData && fullDailyData.length > dailyData.length && (
            <button
              type="button"
              onClick={() => setUseFullHistory(!useFullHistory)}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
                useFullHistory
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-slate-50 text-slate-600 border-slate-300 hover:bg-slate-100'
              }`}
              title="Chuyển đổi giữa xem toàn bộ các ngày từ đầu hoặc xem theo khung lọc"
            >
              {useFullHistory ? `Full tất cả ngày (${fullDailyData.length})` : `Kỳ lọc (${dailyData.length} ngày)`}
            </button>
          )}
        </div>
      </div>

      {/* Chart container */}
      <div className="h-72 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === 'daily' ? (
            chartType === 'line' ? (
              <LineChart
                data={activeDailyData}
                margin={{ top: 15, right: 20, left: -15, bottom: 5 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload[0]) {
                    const item = e.activePayload[0].payload as DailyStat;
                    onSelectDate?.(item.date);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="displayDate"
                  tick={{ fontSize: 11, fill: '#475569', fontWeight: 500 }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={{ stroke: '#cbd5e1' }}
                />
                <Tooltip content={<CustomDailyTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                  formatter={(value) => {
                    if (value === 'count') return 'Tổng lượt truy cập';
                    if (value === 'web') return 'Truy cập Web';
                    if (value === 'app') return 'Truy cập Mobile App';
                    if (value === 'uniqueUsers') return 'Số tài khoản hoạt động';
                    return value;
                  }}
                />

                {/* Đường đánh dấu ngày đang chọn nếu có */}
                {selectedDayDisplay && (
                  <ReferenceLine
                    x={selectedDayDisplay}
                    stroke="#f59e0b"
                    strokeWidth={2}
                    strokeDasharray="3 3"
                    label={{
                      value: 'Đang xem ngày này',
                      fill: '#b45309',
                      fontSize: 10,
                      position: 'insideTopLeft',
                    }}
                  />
                )}

                {/* Đường Tổng lượt truy cập (chính) */}
                <Line
                  type="monotone"
                  dataKey="count"
                  name="count"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#ffffff', stroke: '#2563eb', strokeWidth: 2 }}
                  activeDot={{ r: 7, fill: '#2563eb', stroke: '#ffffff', strokeWidth: 2, cursor: 'pointer' }}
                />

                {/* Đường Web */}
                <Line
                  type="monotone"
                  dataKey="web"
                  name="web"
                  stroke="#0284c7"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#0284c7' }}
                  activeDot={{ r: 5, fill: '#0284c7', cursor: 'pointer' }}
                />

                {/* Đường Mobile App */}
                <Line
                  type="monotone"
                  dataKey="app"
                  name="app"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#10b981' }}
                  activeDot={{ r: 5, fill: '#10b981', cursor: 'pointer' }}
                />

                {/* Đường số tài khoản hoạt động (nét đứt) */}
                {showUniqueUsersLine && (
                  <Line
                    type="monotone"
                    dataKey="uniqueUsers"
                    name="uniqueUsers"
                    stroke="#8b5cf6"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={{ r: 2.5, fill: '#8b5cf6' }}
                    activeDot={{ r: 5, fill: '#8b5cf6', cursor: 'pointer' }}
                  />
                )}
              </LineChart>
            ) : chartType === 'area' ? (
              <AreaChart
                data={activeDailyData}
                margin={{ top: 15, right: 20, left: -15, bottom: 5 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload[0]) {
                    const item = e.activePayload[0].payload as DailyStat;
                    onSelectDate?.(item.date);
                  }
                }}
              >
                <defs>
                  <linearGradient id="colorDailyTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="colorDailyWeb" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorDailyApp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="displayDate" tick={{ fontSize: 11, fill: '#475569' }} axisLine={{ stroke: '#cbd5e1' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} />
                <Tooltip content={<CustomDailyTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                  formatter={(value) => {
                    if (value === 'count') return 'Tổng lượt';
                    if (value === 'web') return 'Web';
                    if (value === 'app') return 'Mobile App';
                    return value;
                  }}
                />
                <Area type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorDailyTotal)" name="count" />
                <Area type="monotone" dataKey="web" stroke="#0284c7" strokeWidth={1.5} fillOpacity={1} fill="url(#colorDailyWeb)" name="web" />
                <Area type="monotone" dataKey="app" stroke="#10b981" strokeWidth={1.5} fillOpacity={1} fill="url(#colorDailyApp)" name="app" />
              </AreaChart>
            ) : (
              <BarChart
                data={activeDailyData}
                margin={{ top: 15, right: 20, left: -15, bottom: 5 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload[0]) {
                    const item = e.activePayload[0].payload as DailyStat;
                    onSelectDate?.(item.date);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="displayDate" tick={{ fontSize: 11, fill: '#475569' }} axisLine={{ stroke: '#cbd5e1' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} />
                <Tooltip content={<CustomDailyTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                  formatter={(value) => (value === 'web' ? 'Web' : value === 'app' ? 'Mobile App' : value)}
                />
                <Bar dataKey="web" name="web" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} cursor="pointer" />
                <Bar dataKey="app" name="app" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} cursor="pointer" />
              </BarChart>
            )
          ) : chartType === 'line' ? (
            <LineChart data={hourlyData} margin={{ top: 15, right: 20, left: -15, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#475569' }} axisLine={{ stroke: '#cbd5e1' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  fontSize: '12px',
                }}
                formatter={(value: any, name: any) => {
                  const label = name === 'count' ? 'Tổng lượt' : name === 'web' ? 'Web' : name === 'app' ? 'Mobile App' : name;
                  return [value, label];
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Line type="monotone" dataKey="count" stroke="#4f46e5" strokeWidth={2.5} dot={{ r: 3 }} name="count" />
              <Line type="monotone" dataKey="web" stroke="#0284c7" strokeWidth={1.5} dot={{ r: 2 }} name="web" />
              <Line type="monotone" dataKey="app" stroke="#10b981" strokeWidth={1.5} dot={{ r: 2 }} name="app" />
            </LineChart>
          ) : chartType === 'area' ? (
            <AreaChart data={hourlyData} margin={{ top: 15, right: 20, left: -15, bottom: 5 }}>
              <defs>
                <linearGradient id="colorHourCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '12px',
                }}
              />
              <Area type="monotone" dataKey="count" stroke="#6366f1" fillOpacity={1} fill="url(#colorHourCount)" name="Tổng lượt truy cập" />
            </AreaChart>
          ) : (
            <BarChart data={hourlyData} margin={{ top: 15, right: 20, left: -15, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '12px',
                }}
                formatter={(value: any, name: any) => {
                  const label = name === 'web' ? 'Web' : name === 'app' ? 'App' : 'Tổng';
                  return [value, label];
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="web" name="web" stackId="hour" fill="#3b82f6" radius={[0, 0, 0, 0]} />
              <Bar dataKey="app" name="app" stackId="hour" fill="#10b981" radius={[3, 3, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Summary insights bar for evaluating change over full time */}
      <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-500">
            💡 Nhấp vào điểm tròn ngày trên đường biểu đồ để lọc nhanh dữ liệu ngày đó.
          </span>

          {viewMode === 'daily' && (
            <button
              type="button"
              onClick={() => setShowUniqueUsersLine(!showUniqueUsersLine)}
              className="inline-flex items-center gap-1 text-[11px] text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded-md border border-purple-200 transition-colors cursor-pointer"
            >
              <span>{showUniqueUsersLine ? 'Ẩn đường Tài khoản' : 'Hiện đường Tài khoản'}</span>
            </button>
          )}
        </div>

        {viewMode === 'daily' && trendAnalysis.peakDay && (
          <div className="flex items-center gap-3 text-slate-700 shrink-0 flex-wrap">
            <span className="bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
              Trung bình: <strong className="text-slate-900 font-bold">{trendAnalysis.avgDaily.toLocaleString()}</strong> lượt/ngày
            </span>

            <span className="bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-lg border border-emerald-200 font-medium">
              Cao điểm: <strong className="font-bold">{trendAnalysis.peakDay.date}</strong> ({trendAnalysis.peakDay.count.toLocaleString()} lượt)
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
