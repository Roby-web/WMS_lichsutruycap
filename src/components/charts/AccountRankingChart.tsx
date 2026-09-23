import { useState, useMemo } from 'react';
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
import { Award, Building2, User, ExternalLink, Filter, X, Sparkles } from 'lucide-react';

interface AccountRankingChartProps {
  accountStats: AccountStat[];
  departmentStats: DepartmentStat[];
  selectedAccount?: string;
  selectedDepartment?: string;
  onSelectAccount: (account: string) => void;
  onSelectDepartment: (dept: string) => void;
  onOpenAccountModal?: (account: string) => void;
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
  selectedAccount,
  selectedDepartment,
  onSelectAccount,
  onSelectDepartment,
  onOpenAccountModal,
}: AccountRankingChartProps) {
  const [activeTab, setActiveTab] = useState<'accounts' | 'departments'>('accounts');
  const [topLimit, setTopLimit] = useState<number>(10);

  const isAccountFiltered = Boolean(selectedAccount && selectedAccount !== 'ALL');
  const isDeptFiltered = Boolean(selectedDepartment && selectedDepartment !== 'ALL');

  // Đảm bảo tài khoản đang chọn luôn xuất hiện trong danh sách hiển thị
  const displayedAccounts = useMemo(() => {
    const list = accountStats.slice(0, topLimit);
    if (isAccountFiltered && selectedAccount) {
      const exists = list.some((a) => a.account === selectedAccount);
      if (!exists) {
        const found = accountStats.find((a) => a.account === selectedAccount);
        if (found) {
          return [...list.slice(0, Math.max(topLimit - 1, 1)), found];
        }
      }
    }
    return list;
  }, [accountStats, topLimit, isAccountFiltered, selectedAccount]);

  const displayedDepts = useMemo(() => {
    const list = departmentStats.slice(0, topLimit);
    if (isDeptFiltered && selectedDepartment) {
      const exists = list.some((d) => d.department === selectedDepartment);
      if (!exists) {
        const found = departmentStats.find((d) => d.department === selectedDepartment);
        if (found) {
          return [...list.slice(0, Math.max(topLimit - 1, 1)), found];
        }
      }
    }
    return list;
  }, [departmentStats, topLimit, isDeptFiltered, selectedDepartment]);

  // Dynamic chart height based on item count so labels never collide or get dropped
  const chartHeight = useMemo(() => {
    const count = activeTab === 'accounts' ? displayedAccounts.length : displayedDepts.length;
    return Math.max(340, count * 36);
  }, [activeTab, displayedAccounts.length, displayedDepts.length]);

  // Clickable custom Y-axis tick for Accounts - guarantees every single account is displayed
  const renderAccountTick = (props: any) => {
    const { x, y, payload } = props;
    if (!payload || payload.value === undefined) return null;
    const acc = String(payload.value);
    const isSelected = selectedAccount === acc;
    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={-8}
          y={4}
          textAnchor="end"
          fill={isSelected ? '#1d4ed8' : '#1e293b'}
          fontWeight={isSelected ? 800 : 600}
          fontSize={12}
          style={{ cursor: 'pointer' }}
          onClick={(e) => {
            e.stopPropagation();
            onSelectAccount(acc);
          }}
          className="transition-colors hover:fill-blue-600 hover:font-bold"
        >
          {isSelected ? `▶ @${acc}` : acc}
        </text>
      </g>
    );
  };

  // Clickable custom Y-axis tick for Departments - guarantees every single department is displayed
  const renderDeptTick = (props: any) => {
    const { x, y, payload } = props;
    if (!payload || payload.value === undefined) return null;
    const dept = String(payload.value);
    const isSelected = selectedDepartment === dept;
    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={-8}
          y={4}
          textAnchor="end"
          fill={isSelected ? '#059669' : '#1e293b'}
          fontWeight={isSelected ? 800 : 600}
          fontSize={12}
          style={{ cursor: 'pointer' }}
          onClick={(e) => {
            e.stopPropagation();
            onSelectDepartment(dept);
          }}
          className="transition-colors hover:fill-emerald-600 hover:font-bold"
        >
          {isSelected ? `▶ ${dept}` : dept}
        </text>
      </g>
    );
  };

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
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
              ? 'Click vào bất kỳ dòng tài khoản để lọc toàn bộ dashboard theo người đó'
              : 'Click vào bất kỳ dòng ban để lọc toàn bộ dashboard theo ban'}
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

      {/* Active Filter Banner */}
      {activeTab === 'accounts' && isAccountFiltered && selectedAccount && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-between text-xs text-blue-900 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600" />
            </span>
            <span>
              Đang lọc toàn bộ dữ liệu theo: <strong className="font-bold text-blue-700">@{selectedAccount}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            {onOpenAccountModal && (
              <button
                type="button"
                onClick={() => onOpenAccountModal(selectedAccount)}
                className="text-xs font-semibold text-blue-700 hover:text-blue-900 underline cursor-pointer"
              >
                Xem hồ sơ
              </button>
            )}
            <button
              type="button"
              onClick={() => onSelectAccount(selectedAccount)}
              className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-white hover:bg-blue-600 bg-white border border-blue-200 px-2 py-0.5 rounded transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Bỏ lọc</span>
            </button>
          </div>
        </div>
      )}

      {activeTab === 'departments' && isDeptFiltered && selectedDepartment && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-900 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
            </span>
            <span>
              Đang lọc theo ban: <strong className="font-bold text-emerald-700">{selectedDepartment}</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={() => onSelectDepartment(selectedDepartment)}
            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-white hover:bg-emerald-600 bg-white border border-emerald-200 px-2 py-0.5 rounded transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Bỏ lọc</span>
          </button>
        </div>
      )}

      {/* Chart */}
      <div className="w-full transition-all duration-300" style={{ height: `${chartHeight}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          {activeTab === 'accounts' ? (
            <BarChart
              data={displayedAccounts}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
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
                interval={0}
                tick={renderAccountTick}
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
                  const acc = item.payload as AccountStat;
                  const isSelected = selectedAccount === acc.account;
                  return [
                    `${value} lượt (${acc.percentage}%) - Ban: ${acc.departments.join(', ')} ${isSelected ? '• [Đang lọc]' : '• (Click để lọc)'}`,
                    'Tần suất',
                  ];
                }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} cursor="pointer">
                {displayedAccounts.map((item, index) => {
                  const isSelected = selectedAccount === item.account;
                  return (
                    <Cell
                      key={`cell-${item.account}-${index}`}
                      fill={isSelected ? '#2563eb' : ACCOUNT_COLORS[index % ACCOUNT_COLORS.length]}
                      opacity={isAccountFiltered ? (isSelected ? 1 : 0.35) : 1}
                      stroke={isSelected ? '#1e40af' : 'none'}
                      strokeWidth={isSelected ? 2 : 0}
                      className="transition-all duration-200 hover:opacity-100 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectAccount(item.account);
                      }}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          ) : (
            <BarChart
              data={displayedDepts}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 15, bottom: 5 }}
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
                interval={0}
                tick={renderDeptTick}
                axisLine={{ stroke: '#e2e8f0' }}
                width={130}
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
                  const isSelected = selectedDepartment === dept.department;
                  return [
                    `${value} lượt (${dept.percentage}%) - ${dept.userCount} thành viên hoạt động ${isSelected ? '• [Đang lọc]' : '• (Click để lọc)'}`,
                    'Tần suất',
                  ];
                }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} cursor="pointer">
                {displayedDepts.map((item, index) => {
                  const isSelected = selectedDepartment === item.department;
                  return (
                    <Cell
                      key={`cell-dept-${item.department}-${index}`}
                      fill={isSelected ? '#059669' : DEPT_COLORS[index % DEPT_COLORS.length]}
                      opacity={isDeptFiltered ? (isSelected ? 1 : 0.35) : 1}
                      stroke={isSelected ? '#047857' : 'none'}
                      strokeWidth={isSelected ? 2 : 0}
                      className="transition-all duration-200 hover:opacity-100 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectDepartment(item.department);
                      }}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Footer Notes */}
      <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <span className="text-amber-500">💡</span>
          <span>
            {activeTab === 'accounts'
              ? 'Click vào bất kỳ dòng tài khoản nào để lọc toàn bộ dashboard theo người đó (click lại để bỏ lọc)'
              : 'Click vào bất kỳ dòng ban nào để lọc dữ liệu theo ban đó (click lại để bỏ lọc)'}
          </span>
        </span>
        <span className="font-semibold text-slate-700">
          {activeTab === 'accounts'
            ? isAccountFiltered
              ? `Đang lọc: @${selectedAccount}`
              : `Top 1: @${displayedAccounts[0]?.account || '-'} (${displayedAccounts[0]?.count || 0} lượt)`
            : isDeptFiltered
              ? `Đang lọc: ${selectedDepartment}`
              : `Ban đầu bảng: ${displayedDepts[0]?.department || '-'} (${displayedDepts[0]?.count || 0} lượt)`}
        </span>
      </div>
    </div>
  );
}
