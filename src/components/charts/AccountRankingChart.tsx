import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { AccountStat, DepartmentStat } from '../../types';
import { Award, Building2, User, ExternalLink } from 'lucide-react';

interface AccountRankingChartProps {
  accountStats: AccountStat[];
  departmentStats: DepartmentStat[];
  onSelectAccount: (account: string) => void;
  onSelectDepartment: (dept: string) => void;
}

const ACCOUNT_COLORS = [
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#f43f5e',
  '#f97316',
  '#eab308',
  '#10b981',
  '#06b6d4',
  '#64748b',
];

const DEPT_COLORS = [
  '#0284c7',
  '#0d9488',
  '#16a34a',
  '#ca8a04',
  '#ea580c',
  '#e11d48',
  '#9333ea',
  '#4f46e5',
  '#475569',
  '#6b7280',
];

export function AccountRankingChart({
  accountStats,
  departmentStats,
  onSelectAccount,
  onSelectDepartment,
}: AccountRankingChartProps) {
  const [activeTab, setActiveTab] = useState<'accounts' | 'departments'>('accounts');
  const [topLimit, setTopLimit] = useState<number>(10);

  const displayedAccounts = accountStats.slice(0, topLimit);
  const displayedDepts = departmentStats.slice(0, topLimit);

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            {activeTab === 'accounts' ? (
              <>
                <Award className="w-4 h-4 text-indigo-600" />
                <span>Xếp Hạng Tài Khoản Theo Tần Suất</span>
              </>
            ) : (
              <>
                <Building2 className="w-4 h-4 text-emerald-600" />
                <span>Tần Suất Theo Ban Chuyên Môn</span>
              </>
            )}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {activeTab === 'accounts'
              ? 'Top các tài khoản có số lượt sử dụng nhiều nhất trên hệ thống'
              : 'Phân bổ lượt truy cập tập trung theo từng ban biên tập / chuyên môn'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tab Switch */}
          <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-xs font-medium">
            <button
              onClick={() => setActiveTab('accounts')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                activeTab === 'accounts' ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Theo Tài Khoản
            </button>
            <button
              onClick={() => setActiveTab('departments')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                activeTab === 'departments' ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Theo Ban
            </button>
          </div>

          {/* Top Limit Selector */}
          <select
            value={topLimit}
            onChange={(e) => setTopLimit(Number(e.target.value))}
            className="text-xs bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-medium focus:outline-hidden cursor-pointer"
          >
            <option value={8}>Top 8</option>
            <option value={10}>Top 10</option>
            <option value={15}>Top 15</option>
            <option value={20}>Top 20</option>
          </select>
        </div>
      </div>

      {/* Chart */}
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {activeTab === 'accounts' ? (
            <BarChart
              data={displayedAccounts}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              onClick={(e: any) => {
                if (e && e.activePayload && e.activePayload[0]) {
                  const item = e.activePayload[0].payload as AccountStat;
                  onSelectAccount(item.account);
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
              <YAxis
                dataKey="account"
                type="category"
                tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }}
                axisLine={{ stroke: '#e2e8f0' }}
                width={85}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '12px',
                }}
                formatter={(value: any, _: any, item: any) => {
                  const acc = item.payload as AccountStat;
                  return [
                    `${value} lượt (${acc.percentage}%) - Ban: ${acc.departments.join(', ')}`,
                    'Tần suất',
                  ];
                }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} cursor="pointer">
                {displayedAccounts.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={ACCOUNT_COLORS[index % ACCOUNT_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <BarChart
              data={displayedDepts}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 35, bottom: 5 }}
              onClick={(e: any) => {
                if (e && e.activePayload && e.activePayload[0]) {
                  const item = e.activePayload[0].payload as DepartmentStat;
                  onSelectDepartment(item.department);
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
              <YAxis
                dataKey="department"
                type="category"
                tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }}
                axisLine={{ stroke: '#e2e8f0' }}
                width={110}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '12px',
                }}
                formatter={(value: any, _: any, item: any) => {
                  const dept = item.payload as DepartmentStat;
                  return [
                    `${value} lượt (${dept.percentage}%) - ${dept.userCount} thành viên hoạt động`,
                    'Tần suất',
                  ];
                }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} cursor="pointer">
                {displayedDepts.map((_, index) => (
                  <Cell key={`cell-dept-${index}`} fill={DEPT_COLORS[index % DEPT_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Footer Notes */}
      <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
        <span>
          💡 Click vào bất kỳ thanh tài khoản/ban để xem chi tiết hoặc lọc
        </span>
        <span className="font-semibold text-slate-700">
          {activeTab === 'accounts'
            ? `Top 1: @${displayedAccounts[0]?.account || '-'} (${displayedAccounts[0]?.count || 0} lượt)`
            : `Ban đầu bảng: ${displayedDepts[0]?.department || '-'} (${displayedDepts[0]?.count || 0} lượt)`}
        </span>
      </div>
    </div>
  );
}
