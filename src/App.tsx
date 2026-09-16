import { useState, useMemo } from 'react';
import { RAW_ACCESS_CSV } from './data/rawCsv';
import {
  parseAccessCsv,
  filterRecords,
  computeKpiMetrics,
  computeAccountStats,
  computeDepartmentStats,
  computeFeatureStats,
  computePlatformStats,
  computeOsStats,
  computeHourlyStats,
  computeDailyStats,
} from './utils/csvParser';
import { FilterState } from './types';
import { Header } from './components/Header';
import { KpiCards } from './components/KpiCards';
import { FilterBar } from './components/FilterBar';
import { InsightsBanner } from './components/InsightsBanner';
import { TimeTrendChart } from './components/charts/TimeTrendChart';
import { AccountRankingChart } from './components/charts/AccountRankingChart';
import { PlatformFeatureChart } from './components/charts/PlatformFeatureChart';
import { HeatmapView } from './components/HeatmapView';
import { DataTable } from './components/DataTable';
import { AccountDetailModal } from './components/AccountDetailModal';
import { ImportLinkModal } from './components/ImportLinkModal';
import { LayoutDashboard, TableProperties, Award, Flame, Activity } from 'lucide-react';

const INITIAL_FILTERS: FilterState = {
  search: '',
  date: 'ALL',
  department: 'ALL',
  platform: 'ALL',
  feature: 'ALL',
  os: 'ALL',
  account: 'ALL',
  hourRange: [0, 23],
};

const STORAGE_KEY_CSV = 'access_dashboard_custom_csv';
const STORAGE_KEY_NAME = 'access_dashboard_custom_name';

export default function App() {
  // Active dataset
  const [csvText, setCsvText] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CSV);
      return saved || RAW_ACCESS_CSV;
    } catch {
      return RAW_ACCESS_CSV;
    }
  });
  const [activeFileName, setActiveFileName] = useState<string>(() => {
    try {
      const savedName = localStorage.getItem(STORAGE_KEY_NAME);
      return savedName || 'Lich_su_truy_cap_487_records.csv';
    } catch {
      return 'Lich_su_truy_cap_487_records.csv';
    }
  });

  // Filters
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);

  // Active Main View Tab: 'overview' | 'table' | 'ranking' | 'heatmap'
  const [activeTab, setActiveTab] = useState<'overview' | 'table' | 'ranking' | 'heatmap'>('overview');

  // Account Modal
  const [modalAccount, setModalAccount] = useState<string | null>(null);

  // Link Import Modal
  const [isLinkModalOpen, setIsLinkModalOpen] = useState<boolean>(false);

  // Parse all records
  const allRecords = useMemo(() => {
    return parseAccessCsv(csvText);
  }, [csvText]);

  // Available filter options extracted from dataset
  const { availableDates, availableDepartments, availableFeatures } = useMemo(() => {
    const dates = new Set<string>();
    const depts = new Set<string>();
    const features = new Set<string>();

    allRecords.forEach((r) => {
      if (r.date && r.date !== 'N/A') dates.add(r.date);
      if (r.department) depts.add(r.department);
      if (r.feature) features.add(r.feature);
    });

    return {
      availableDates: Array.from(dates),
      availableDepartments: Array.from(depts).sort(),
      availableFeatures: Array.from(features).sort(),
    };
  }, [allRecords]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return filterRecords(allRecords, filters);
  }, [allRecords, filters]);

  // Computed metrics and aggregates
  const kpiMetrics = useMemo(() => computeKpiMetrics(filteredRecords), [filteredRecords]);
  const accountStats = useMemo(() => computeAccountStats(filteredRecords), [filteredRecords]);
  const departmentStats = useMemo(() => computeDepartmentStats(filteredRecords), [filteredRecords]);
  const featureStats = useMemo(() => computeFeatureStats(filteredRecords), [filteredRecords]);
  const platformStats = useMemo(() => computePlatformStats(filteredRecords), [filteredRecords]);
  const osStats = useMemo(() => computeOsStats(filteredRecords), [filteredRecords]);
  const hourlyData = useMemo(() => computeHourlyStats(filteredRecords), [filteredRecords]);
  const dailyData = useMemo(() => computeDailyStats(filteredRecords), [filteredRecords]);

  // Modal data for specific account
  const modalAccountStat = useMemo(() => {
    if (!modalAccount) return undefined;
    return accountStats.find((a) => a.account === modalAccount);
  }, [modalAccount, accountStats]);

  const modalUserRecords = useMemo(() => {
    if (!modalAccount) return [];
    return allRecords.filter((r) => r.account === modalAccount);
  }, [modalAccount, allRecords]);

  // Handlers
  const handleFileUpload = (newCsv: string, fileName: string) => {
    setCsvText(newCsv);
    setActiveFileName(fileName);
    setFilters(INITIAL_FILTERS);
    try {
      localStorage.setItem(STORAGE_KEY_CSV, newCsv);
      localStorage.setItem(STORAGE_KEY_NAME, fileName);
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  };

  const handleResetData = () => {
    setCsvText(RAW_ACCESS_CSV);
    setActiveFileName('Lich_su_truy_cap_487_records.csv');
    setFilters(INITIAL_FILTERS);
    try {
      localStorage.removeItem(STORAGE_KEY_CSV);
      localStorage.removeItem(STORAGE_KEY_NAME);
    } catch (e) {
      console.error('Failed to remove from localStorage', e);
    }
  };

  const handleSelectAccount = (account: string) => {
    setModalAccount(account);
  };

  const handleFilterByAccount = (account: string) => {
    setFilters((prev) => ({ ...prev, account, search: '' }));
  };

  const handleSelectDepartment = (dept: string) => {
    setFilters((prev) => ({ ...prev, department: dept }));
  };

  const handleSelectDate = (date: string) => {
    setFilters((prev) => ({ ...prev, date: prev.date === date ? 'ALL' : date }));
  };

  const handleSelectFeature = (feature: string) => {
    setFilters((prev) => ({ ...prev, feature: prev.feature === feature ? 'ALL' : feature }));
  };

  const handleSelectPlatform = (platform: string) => {
    setFilters((prev) => ({ ...prev, platform: prev.platform === platform ? 'ALL' : platform }));
  };

  const isFiltered =
    Boolean(filters.search.trim()) ||
    filters.date !== 'ALL' ||
    filters.department !== 'ALL' ||
    filters.platform !== 'ALL' ||
    filters.feature !== 'ALL' ||
    filters.account !== 'ALL' ||
    filters.hourRange[0] !== 0 ||
    filters.hourRange[1] !== 23;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top App Header */}
      <Header
        recordsCount={allRecords.length}
        filteredCount={filteredRecords.length}
        isFiltered={isFiltered}
        onFileUpload={handleFileUpload}
        onResetData={handleResetData}
        onOpenLinkModal={() => setIsLinkModalOpen(true)}
        filteredRecords={filteredRecords}
        activeFileName={activeFileName}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* KPI Metrics Summary */}
        <KpiCards
          metrics={kpiMetrics}
          onSelectAccount={handleSelectAccount}
          onSelectDepartment={handleSelectDepartment}
        />

        {/* Analytical Insights Highlights */}
        <InsightsBanner
          metrics={kpiMetrics}
          topAccounts={accountStats}
          departmentStats={departmentStats}
          onSelectAccount={handleSelectAccount}
          onSelectDept={handleSelectDepartment}
        />

        {/* Global Filter Bar */}
        <FilterBar
          filters={filters}
          onFilterChange={setFilters}
          availableDates={availableDates}
          availableDepartments={availableDepartments}
          availableFeatures={availableFeatures}
          totalCount={allRecords.length}
          filteredCount={filteredRecords.length}
        />

        {/* Navigation Tabs */}
        <div className="border-b border-slate-200 flex items-center justify-between gap-4 overflow-x-auto">
          <nav className="flex space-x-2 sm:space-x-4">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2.5 px-3.5 border-b-2 font-semibold text-xs sm:text-sm flex items-center gap-2 cursor-pointer transition-colors ${
                activeTab === 'overview'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Tổng Quan & Biểu Đồ</span>
            </button>

            <button
              onClick={() => setActiveTab('ranking')}
              className={`py-2.5 px-3.5 border-b-2 font-semibold text-xs sm:text-sm flex items-center gap-2 cursor-pointer transition-colors ${
                activeTab === 'ranking'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Xếp Hạng & Ban Biên Tập</span>
            </button>

            <button
              onClick={() => setActiveTab('heatmap')}
              className={`py-2.5 px-3.5 border-b-2 font-semibold text-xs sm:text-sm flex items-center gap-2 cursor-pointer transition-colors ${
                activeTab === 'heatmap'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <Flame className="w-4 h-4" />
              <span>Ma Trận Nhiệt (Heatmap)</span>
            </button>

            <button
              onClick={() => setActiveTab('table')}
              className={`py-2.5 px-3.5 border-b-2 font-semibold text-xs sm:text-sm flex items-center gap-2 cursor-pointer transition-colors ${
                activeTab === 'table'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <TableProperties className="w-4 h-4" />
              <span>Bảng Dữ Liệu Chi Tiết ({filteredRecords.length})</span>
            </button>
          </nav>
        </div>

        {/* Tab 1: Overview Dashboard */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Timeline Trends */}
              <TimeTrendChart
                dailyData={dailyData}
                hourlyData={hourlyData}
                onSelectDate={handleSelectDate}
              />

              {/* Account & Department Ranking */}
              <AccountRankingChart
                accountStats={accountStats}
                departmentStats={departmentStats}
                onSelectAccount={handleSelectAccount}
                onSelectDepartment={handleSelectDepartment}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Platform & Feature Distribution */}
              <PlatformFeatureChart
                featureStats={featureStats}
                platformStats={platformStats}
                osStats={osStats}
                onSelectFeature={handleSelectFeature}
                onSelectPlatform={handleSelectPlatform}
              />

              {/* Heatmap Matrix Overview */}
              <HeatmapView records={filteredRecords} />
            </div>

            {/* Quick preview of data table */}
            <DataTable
              records={filteredRecords}
              onSelectAccount={handleSelectAccount}
              onSelectDepartment={handleSelectDepartment}
            />
          </div>
        )}

        {/* Tab 2: Ranking & Departments */}
        {activeTab === 'ranking' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AccountRankingChart
                accountStats={accountStats}
                departmentStats={departmentStats}
                onSelectAccount={handleSelectAccount}
                onSelectDepartment={handleSelectDepartment}
              />
              <PlatformFeatureChart
                featureStats={featureStats}
                platformStats={platformStats}
                osStats={osStats}
                onSelectFeature={handleSelectFeature}
                onSelectPlatform={handleSelectPlatform}
              />
            </div>

            {/* Leaderboard Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
              <h3 className="text-base font-bold text-slate-900 mb-1">
                Bảng Tổng Hợp Tần Suất Theo Từng Tài Khoản ({accountStats.length} tài khoản)
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Chi tiết tỷ trọng sử dụng, nền tảng yêu thích và ban chuyên môn tương ứng
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="py-2.5 px-3">Hạng</th>
                      <th className="py-2.5 px-3">Tài Khoản</th>
                      <th className="py-2.5 px-3">Số Lượt Truy Cập</th>
                      <th className="py-2.5 px-3">Tỷ Trọng (%)</th>
                      <th className="py-2.5 px-3">Ban Phụ Trách</th>
                      <th className="py-2.5 px-3">Nền Tảng / HĐH</th>
                      <th className="py-2.5 px-3">Số Ngày Hoạt Động</th>
                      <th className="py-2.5 px-3 text-right">Chi Tiết</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {accountStats.map((acc, index) => (
                      <tr key={acc.account} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-slate-500">
                          {index === 0 && '🥇'}
                          {index === 1 && '🥈'}
                          {index === 2 && '🥉'}
                          {index > 2 && `#${index + 1}`}
                        </td>
                        <td className="py-2.5 px-3">
                          <button
                            onClick={() => handleSelectAccount(acc.account)}
                            className="font-bold text-blue-600 hover:underline cursor-pointer"
                          >
                            @{acc.account}
                          </button>
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          {acc.count} lượt
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-blue-600 h-1.5 rounded-full"
                                style={{ width: `${Math.min(acc.percentage * 4, 100)}%` }}
                              />
                            </div>
                            <span className="text-slate-600 font-medium">{acc.percentage}%</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">
                          {acc.departments.join(', ')}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          <span className="font-medium text-slate-800">{acc.primaryPlatform}</span> ({acc.primaryOs})
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {acc.daysActive.length} ngày
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => handleSelectAccount(acc.account)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                          >
                            Xem hồ sơ
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Heatmap Matrix */}
        {activeTab === 'heatmap' && (
          <div className="space-y-6">
            <HeatmapView records={filteredRecords} />
            <TimeTrendChart
              dailyData={dailyData}
              hourlyData={hourlyData}
              onSelectDate={handleSelectDate}
            />
          </div>
        )}

        {/* Tab 4: Detailed Data Table */}
        {activeTab === 'table' && (
          <div className="space-y-6">
            <DataTable
              records={filteredRecords}
              onSelectAccount={handleSelectAccount}
              onSelectDepartment={handleSelectDepartment}
            />
          </div>
        )}
      </main>

      {/* Account Details Modal */}
      <AccountDetailModal
        accountName={modalAccount}
        accountStat={modalAccountStat}
        userRecords={modalUserRecords}
        onClose={() => setModalAccount(null)}
        onFilterByAccount={handleFilterByAccount}
      />

      {/* Import Link / Sheet Modal */}
      <ImportLinkModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        onApplyData={handleFileUpload}
      />
    </div>
  );
}
