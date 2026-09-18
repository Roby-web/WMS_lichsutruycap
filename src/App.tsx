import { useState, useMemo, useEffect } from 'react';
import { RAW_ACCESS_CSV } from './data/rawCsv';
import {
  parseAccessCsv,
  filterRecords,
  isDefaultExcludedRecord,
  computeKpiMetrics,
  computeAccountStats,
  computeDepartmentStats,
  computeFeatureStats,
  computePlatformStats,
  computeOsStats,
  computeHourlyStats,
  computeDailyStats,
  computeHourlyAverageStats,
  computeWeekdayAverageStats,
  computeDailyUserFrequencyStats,
  computeUserDailyAvgRanking,
  computeDepartmentDailyAvgStats,
} from './utils/csvParser';
import { FilterState } from './types';
import { Header } from './components/Header';
import { KpiCards } from './components/KpiCards';
import { FilterBar } from './components/FilterBar';
import { InsightsBanner } from './components/InsightsBanner';
import { TimeTrendChart } from './components/charts/TimeTrendChart';
import { AccountRankingChart } from './components/charts/AccountRankingChart';
import { PlatformFeatureChart } from './components/charts/PlatformFeatureChart';
import { AverageTrendCharts } from './components/charts/AverageTrendCharts';
import { UserDailyAverageChart } from './components/charts/UserDailyAverageChart';
import { HeatmapView } from './components/HeatmapView';
import { DataTable } from './components/DataTable';
import { AccountDetailModal } from './components/AccountDetailModal';
import { ImportLinkModal } from './components/ImportLinkModal';
import { QuickSyncBar } from './components/QuickSyncBar';
import { LayoutDashboard, TableProperties, Flame, Activity } from 'lucide-react';

const STORAGE_KEY_CSV = 'access_dashboard_custom_csv_v2';
const STORAGE_KEY_NAME = 'access_dashboard_custom_name_v2';
const STORAGE_KEY_EXCLUDE_TEST = 'wms_exclude_test_records_v1';

const getInitialExcludeTest = (): boolean => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_EXCLUDE_TEST);
    return saved !== null ? saved === 'true' : true; // Mặc định là true cho mọi lần sau
  } catch {
    return true;
  }
};

const INITIAL_FILTERS: FilterState = {
  search: '',
  date: 'ALL',
  department: 'ALL',
  platform: 'ALL',
  role: 'ALL',
  feature: 'ALL',
  os: 'ALL',
  account: 'ALL',
  hourRange: [0, 23],
  excludeTestAccounts: getInitialExcludeTest(),
};

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

  // Lưu cấu hình loại bỏ test vào localStorage để áp dụng mặc định cho các lần sau
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_EXCLUDE_TEST, String(filters.excludeTestAccounts));
    } catch {
      // ignore
    }
  }, [filters.excludeTestAccounts]);

  // Active Main View Tab: 'overview' | 'table' | 'heatmap' (bỏ tab ranking theo yêu cầu)
  const [activeTab, setActiveTab] = useState<'overview' | 'table' | 'heatmap'>('overview');

  // Account Modal
  const [modalAccount, setModalAccount] = useState<string | null>(null);

  // Link Import Modal
  const [isLinkModalOpen, setIsLinkModalOpen] = useState<boolean>(false);

  // Parse all records
  const allRecords = useMemo(() => {
    return parseAccessCsv(csvText);
  }, [csvText]);

  // Tập dữ liệu cơ sở: Khi excludeTestAccounts = true (mặc định), tự động loại bỏ các tài khoản & ban test
  const baseRecords = useMemo(() => {
    if (!filters.excludeTestAccounts) return allRecords;
    return allRecords.filter((r) => !isDefaultExcludedRecord(r));
  }, [allRecords, filters.excludeTestAccounts]);

  const excludedTestCount = useMemo(() => {
    return allRecords.length - baseRecords.length;
  }, [allRecords, baseRecords]);

  // Cấp 1: Danh sách tất cả Vai trò
  const availableRoles = useMemo(() => {
    const roles = new Set<string>();
    baseRecords.forEach((r) => {
      if (r.role) roles.add(r.role);
    });
    return Array.from(roles).sort();
  }, [baseRecords]);

  // Cấp 2: Danh sách Ban phụ thuộc vào Vai trò đang chọn
  const availableDepartments = useMemo(() => {
    const depts = new Set<string>();
    baseRecords.forEach((r) => {
      const roleMatch = filters.role === 'ALL' || r.role === filters.role;
      if (roleMatch && r.department) {
        depts.add(r.department);
      }
    });
    return Array.from(depts).sort();
  }, [baseRecords, filters.role]);

  // Cấp 3: Danh sách Từng Người phụ thuộc vào Cấp 1 (Vai trò) và Cấp 2 (Ban)
  const availableAccounts = useMemo(() => {
    const map = new Map<string, { account: string; department: string; role: string; count: number }>();
    baseRecords.forEach((r) => {
      const roleMatch = filters.role === 'ALL' || r.role === filters.role;
      const deptMatch = filters.department === 'ALL' || r.department === filters.department;
      if (roleMatch && deptMatch && r.account) {
        if (!map.has(r.account)) {
          map.set(r.account, {
            account: r.account,
            department: r.department,
            role: r.role,
            count: 0,
          });
        }
        map.get(r.account)!.count++;
      }
    });
    return Array.from(map.values()).sort((a, b) => a.account.localeCompare(b.account));
  }, [baseRecords, filters.role, filters.department]);

  // Các tùy chọn phụ: Ngày và Chức năng
  const { availableDates, availableFeatures } = useMemo(() => {
    const dates = new Set<string>();
    const features = new Set<string>();

    baseRecords.forEach((r) => {
      if (r.date && r.date !== 'N/A') dates.add(r.date);
      if (r.feature) features.add(r.feature);
    });

    return {
      availableDates: Array.from(dates),
      availableFeatures: Array.from(features).sort(),
    };
  }, [baseRecords]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return filterRecords(baseRecords, filters);
  }, [baseRecords, filters]);

  // Computed metrics and aggregates
  const kpiMetrics = useMemo(() => computeKpiMetrics(filteredRecords), [filteredRecords]);
  const accountStats = useMemo(() => computeAccountStats(filteredRecords), [filteredRecords]);
  const departmentStats = useMemo(() => computeDepartmentStats(filteredRecords), [filteredRecords]);
  const featureStats = useMemo(() => computeFeatureStats(filteredRecords), [filteredRecords]);
  const platformStats = useMemo(() => computePlatformStats(filteredRecords), [filteredRecords]);
  const osStats = useMemo(() => computeOsStats(filteredRecords), [filteredRecords]);
  const hourlyData = useMemo(() => computeHourlyStats(filteredRecords), [filteredRecords]);
  const dailyData = useMemo(() => computeDailyStats(filteredRecords), [filteredRecords]);

  // Biểu đồ Trung bình
  const hourlyAvgData = useMemo(() => computeHourlyAverageStats(filteredRecords), [filteredRecords]);
  const weekdayAvgData = useMemo(() => computeWeekdayAverageStats(filteredRecords), [filteredRecords]);
  const dailyUserAvgData = useMemo(() => computeDailyUserFrequencyStats(filteredRecords), [filteredRecords]);
  const userDailyRanking = useMemo(() => computeUserDailyAvgRanking(filteredRecords), [filteredRecords]);
  const departmentDailyAvg = useMemo(() => computeDepartmentDailyAvgStats(filteredRecords), [filteredRecords]);

  const totalDays = useMemo(() => {
    const dates = new Set<string>();
    filteredRecords.forEach((r) => {
      if (r.date && r.date !== 'N/A') dates.add(r.date);
    });
    return Math.max(dates.size, 1);
  }, [filteredRecords]);

  // Modal data for specific account
  const modalAccountStat = useMemo(() => {
    if (!modalAccount) return undefined;
    return accountStats.find((a) => a.account === modalAccount);
  }, [modalAccount, accountStats]);

  const modalUserRecords = useMemo(() => {
    if (!modalAccount) return [];
    return baseRecords.filter((r) => r.account === modalAccount);
  }, [modalAccount, baseRecords]);

  // Handlers
  const handleFileUpload = (newCsv: string, fileName: string) => {
    setCsvText(newCsv);
    setActiveFileName(fileName);
    setFilters((prev) => ({
      ...INITIAL_FILTERS,
      excludeTestAccounts: prev.excludeTestAccounts, // Giữ nguyên tùy chọn loại bỏ test
    }));
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
    setFilters((prev) => ({
      ...INITIAL_FILTERS,
      excludeTestAccounts: prev.excludeTestAccounts, // Giữ nguyên tùy chọn loại bỏ test
    }));
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
    filters.role !== 'ALL' ||
    filters.feature !== 'ALL' ||
    filters.account !== 'ALL' ||
    filters.hourRange[0] !== 0 ||
    filters.hourRange[1] !== 23;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top App Header */}
      <Header
        recordsCount={baseRecords.length}
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
        {/* Fast Sync Bar for Google Sheets */}
        <QuickSyncBar onApplyData={handleFileUpload} currentCount={baseRecords.length} />

        {/* 1. Bộ Lọc Phân Cấp (Vai trò -> Ban -> Người) ĐẶT TRÊN CÙNG THEO YÊU CẦU */}
        <FilterBar
          filters={filters}
          onFilterChange={setFilters}
          availableDates={availableDates}
          availableDepartments={availableDepartments}
          availableRoles={availableRoles}
          availableAccounts={availableAccounts}
          availableFeatures={availableFeatures}
          totalCount={baseRecords.length}
          filteredCount={filteredRecords.length}
          excludedTestCount={excludedTestCount}
        />

        {/* 2. KPI Metrics Summary (Tự động cập nhật theo bộ lọc) */}
        <KpiCards
          metrics={kpiMetrics}
          onSelectAccount={handleSelectAccount}
          onSelectDepartment={handleSelectDepartment}
        />

        {/* 3. Analytical Insights Highlights */}
        <InsightsBanner
          metrics={kpiMetrics}
          topAccounts={accountStats}
          departmentStats={departmentStats}
          onSelectAccount={handleSelectAccount}
          onSelectDept={handleSelectDepartment}
        />

        {/* Navigation Tabs (Đã bỏ tab "Xếp Hạng & Ban Biên Tập") */}
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
            {/* 1. Biểu đồ Bổ Sung: Tần Suất Trung Bình / Người / Ngày (Theo yêu cầu) */}
            <UserDailyAverageChart
              dailyUserAvgData={dailyUserAvgData}
              userDailyRanking={userDailyRanking}
              departmentDailyAvg={departmentDailyAvg}
              onSelectAccount={handleSelectAccount}
              onSelectDepartment={handleSelectDepartment}
            />

            {/* 2. Biểu đồ Trung bình trong ngày (từng giờ) & Trung bình trong tuần (từng thứ) */}
            <AverageTrendCharts
              hourlyAvgData={hourlyAvgData}
              weekdayAvgData={weekdayAvgData}
              totalDays={totalDays}
            />

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

        {/* Tab 2: Heatmap Matrix */}
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

        {/* Tab 3: Detailed Data Table */}
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
