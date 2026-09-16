import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { DailyStat, HourlyStat } from '../../types';
import { Clock, Calendar, BarChart3, TrendingUp } from 'lucide-react';

interface TimeTrendChartProps {
  dailyData: DailyStat[];
  hourlyData: HourlyStat[];
  onSelectDate?: (date: string) => void;
}

export function TimeTrendChart({ dailyData, hourlyData, onSelectDate }: TimeTrendChartProps) {
  const [viewMode, setViewMode] = useState<'daily' | 'hourly'>('daily');
  const [chartType, setChartType] = useState<'bar' | 'area'>('bar');

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            {viewMode === 'daily' ? (
              <>
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>Xu Hướng Tần Suất Theo Ngày (12/09 - 16/09)</span>
              </>
            ) : (
              <>
                <Clock className="w-4 h-4 text-indigo-600" />
                <span>Phân Bố Tần Suất Theo Khung Giờ (00h - 23h)</span>
              </>
            )}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {viewMode === 'daily'
              ? 'Số lượt tương tác hệ thống qua từng ngày và phân bổ Web/App'
              : 'Thời điểm các ban và tài khoản thao tác sôi nổi nhất trong ngày'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Switch Daily / Hourly */}
          <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-xs font-medium">
            <button
              onClick={() => setViewMode('daily')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                viewMode === 'daily' ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Theo Ngày
            </button>
            <button
              onClick={() => setViewMode('hourly')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                viewMode === 'hourly' ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Theo Giờ (0-23h)
            </button>
          </div>

          {/* Switch Bar / Area */}
          <button
            onClick={() => setChartType(chartType === 'bar' ? 'area' : 'bar')}
            className="px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
            title="Đổi kiểu biểu đồ"
          >
            {chartType === 'bar' ? 'Dạng Miền' : 'Dạng Cột'}
          </button>
        </div>
      </div>

      {/* Chart container */}
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === 'daily' ? (
            chartType === 'bar' ? (
              <BarChart
                data={dailyData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload[0]) {
                    const item = e.activePayload[0].payload as DailyStat;
                    onSelectDate?.(item.date);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="displayDate" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                  formatter={(value: any, name: any) => {
                    const label = name === 'web' ? 'Truy cập WEB' : name === 'app' ? 'Truy cập APP' : 'Tổng lượt';
                    return [value, label];
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                  formatter={(value) => (value === 'web' ? 'Web' : value === 'app' ? 'Mobile App' : value)}
                />
                <Bar dataKey="web" name="web" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} cursor="pointer" />
                <Bar dataKey="app" name="app" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} cursor="pointer" />
              </BarChart>
            ) : (
              <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDailyWeb" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorDailyApp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="displayDate" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="web" stroke="#3b82f6" fillOpacity={1} fill="url(#colorDailyWeb)" name="Web" />
                <Area type="monotone" dataKey="app" stroke="#10b981" fillOpacity={1} fill="url(#colorDailyApp)" name="App" />
              </AreaChart>
            )
          ) : chartType === 'bar' ? (
            <BarChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
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
          ) : (
            <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorHourCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
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
          )}
        </ResponsiveContainer>
      </div>

      {/* Footer context notes */}
      <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
        <span>
          💡 Click vào cột ngày để lọc nhanh dữ liệu của ngày đó
        </span>
        <span className="font-medium text-slate-700">
          Cao điểm nhất: {dailyData.reduce((max, d) => (d.count > max.count ? d : max), { count: 0, displayDate: '-' }).displayDate}
        </span>
      </div>
    </div>
  );
}
