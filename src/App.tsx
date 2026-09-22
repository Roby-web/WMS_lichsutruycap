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
import { getAnchorDate, resolvePresetPeriods, getDataDateRange } from './utils/dateRanges';
import { FilterState, AutoSyncScheduleConfig } from './types';
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
import { DataSourceModal } from './components/DataSourceModal';
import { ScheduleModal } from './components/ScheduleModal';
import {
  fetchLatestDataFromUrl,
  STORAGE_KEY_SOURCE_URL,
  STORAGE_KEY_LAST_SYNC_TIME,
  DEFAULT_DATA_SOURCE_URL,
} from './utils/syncService';
import {
  getScheduleConfig,
  shouldTriggerAutoSync,
  recordScheduleExecution,
  saveScheduleConfig,
} from './utils/scheduleService';
import { LayoutDashboard, TableProperties, Flame, Activity, CheckCircle2, AlertCircle, X, CalendarClock } from 'lucide-react';

const STORAGE_KEY_CSV = 'access_dashboard_custom_csv_v5';
const STORAGE_KEY_NAME = 'access_dashboard_custom_name_v5';
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
  timePreset: 'all', // Mặc định show tất cả các ngày (toàn bộ thời gian từ 11/09 đến 21/09)
  customRange: {
    startDate: '',
    endDate: '',
  },
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
  // Active dataset (chuẩn 897 dòng dữ liệu từ link, bắt đầu từ ngày 11/09/2026)
  const [csvText, setCsvText] = useState<string>(() => {
    try {
      // Clear old v3/v4 stale datasets that lacked 11/09/2026 data
      ['access_dashboard_custom_csv_v3', 'access_dashboard_custom_csv_v4'].forEach(k => {
        try { localStorage.removeItem(k); } catch {}
      });
      const saved = localStorage.getItem(STORAGE_KEY_CSV);
      if (saved && saved.trim().length > 30) {
        // If saved dataset doesn't contain 11/09/2026 data or contains stale thiha repeat, reset to fresh
        if (!saved.includes('11/09/2026') || saved.includes('897,thiha')) {
          localStorage.removeItem(STORAGE_KEY_CSV);
          return RAW_ACCESS_CSV;
        }
        return saved;
      }
      return RAW_ACCESS_CSV;
    } catch {
      return RAW_ACCESS_CSV;
    }
  });
  const [activeFileName, setActiveFileName] = useState<string>(() => {
    try {
      const savedName = localStorage.getItem(STORAGE_KEY_NAME);
      if (savedName && !savedName.includes('1757')) return savedName;
      return 'Lich_su_truy_cap_897_records.csv';
    } catch {
      return 'Lich_su_truy_cap_897_records.csv';
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

  // Nguồn Dữ Liệu & Đồng Bộ (Google Sheets / CSV Link)
  const [dataSourceUrl, setDataSourceUrl] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SOURCE_URL);
      if (saved && saved.trim()) return saved.trim();
      localStorage.setItem(STORAGE_KEY_SOURCE_URL, DEFAULT_DATA_SOURCE_URL);
      return DEFAULT_DATA_SOURCE_URL;
    } catch {
      return DEFAULT_DATA_SOURCE_URL;
    }
  });

  const [lastSyncTime, setLastSyncTime] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_LAST_SYNC_TIME) || '';
    } catch {
      return '';
    }
  });

  const [isDataSourceModalOpen, setIsDataSourceModalOpen] = useState<boolean>(false);
  const [isUpdatingData, setIsUpdatingData] = useState<boolean>(false);
  const [syncToast, setSyncToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Lịch cập nhật dữ liệu tự động từ link vào 10h sáng hàng ngày
  const [scheduleConfig, setScheduleConfig] = useState<AutoSyncScheduleConfig>(() => getScheduleConfig());
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState<boolean>(false);

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

  // Mốc thời gian tham chiếu dựa trên dữ liệu thực tế (hoặc ngày hiện tại)
  const anchorDate = useMemo(() => {
    return getAnchorDate(baseRecords);
  }, [baseRecords]);

  // Dải ngày có dữ liệu thực tế trong dataset (từ ngày đầu tiên có dữ liệu đến ngày mới nhất)
  const dataDateRange = useMemo(() => {
    return getDataDateRange(baseRecords, anchorDate);
  }, [baseRecords, anchorDate]);

  // Giải quyết khoảng thời gian hiện tại và cùng kỳ trước dựa trên Preset được chọn
  const presetPeriods = useMemo(() => {
    return resolvePresetPeriods(filters.timePreset, anchorDate, filters.customRange, dataDateRange);
  }, [filters.timePreset, anchorDate, filters.customRange, dataDateRange]);

  // Filtered records trong kỳ đang chọn
  const filteredRecords = useMemo(() => {
    return filterRecords(baseRecords, filters, presetPeriods.current);
  }, [baseRecords, filters, presetPeriods.current]);

  // Dữ liệu cùng kỳ trước đó (áp dụng cùng các điều kiện vai trò, ban, tài khoản, v.v. để so sánh công bằng)
  const previousPeriodFilteredRecords = useMemo(() => {
    return filterRecords(baseRecords, filters, presetPeriods.previous);
  }, [baseRecords, filters, presetPeriods.previous]);

  // Computed metrics and aggregates (kpiMetrics có tính toán so sánh tăng trưởng cùng kỳ)
  const kpiMetrics = useMemo(() => {
    return computeKpiMetrics(
      filteredRecords,
      previousPeriodFilteredRecords,
      presetPeriods.comparisonLabel
    );
  }, [filteredRecords, previousPeriodFilteredRecords, presetPeriods.comparisonLabel]);
  const accountStats = useMemo(() => computeAccountStats(filteredRecords), [filteredRecords]);
  const departmentStats = useMemo(() => computeDepartmentStats(filteredRecords), [filteredRecords]);
  const featureStats = useMemo(() => computeFeatureStats(filteredRecords), [filteredRecords]);
  const platformStats = useMemo(() => computePlatformStats(filteredRecords), [filteredRecords]);
  const osStats = useMemo(() => computeOsStats(filteredRecords), [filteredRecords]);
  const hourlyData = useMemo(() => computeHourlyStats(filteredRecords), [filteredRecords]);
  const dailyData = useMemo(() => computeDailyStats(filteredRecords, true), [filteredRecords]);

  // Full dữ liệu tất cả các ngày từ khi có dữ liệu (không bị ngắt bởi bộ lọc ngày hay khoảng thời gian thu hẹp)
  // để biểu đồ đường xu hướng hiển thị đầy đủ chuỗi ngày đánh giá toàn diện sự thay đổi
  const fullDailyRecords = useMemo(() => {
    return filterRecords(
      baseRecords,
      {
        ...filters,
        date: 'ALL',
      },
      {
        startIso: '1970-01-01',
        endIso: '2099-12-31',
      }
    );
  }, [baseRecords, filters]);
  const fullDailyData = useMemo(() => computeDailyStats(fullDailyRecords, true), [fullDailyRecords]);

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
    setActiveFileName('Lich_su_truy_cap_897_records.csv');
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

  const handleDataSourceUrlChange = (newUrl: string) => {
    setDataSourceUrl(newUrl);
    try {
      localStorage.setItem(STORAGE_KEY_SOURCE_URL, newUrl);
    } catch {
      // ignore
    }
  };

  const handleUpdateLatestData = async () => {
    const urlToUse = (dataSourceUrl && dataSourceUrl.trim()) || DEFAULT_DATA_SOURCE_URL;

    setIsUpdatingData(true);
    setSyncToast(null);

    try {
      const res = await fetchLatestDataFromUrl(urlToUse);
      handleFileUpload(res.csvText, `Google Sheets (${res.recordCount} dòng)`);
      setLastSyncTime(res.syncedTimeFormatted);
      try {
        localStorage.setItem(STORAGE_KEY_LAST_SYNC_TIME, res.syncedTimeFormatted);
      } catch {
        // ignore
      }
      setSyncToast({
        type: 'success',
        message: `Đã cập nhật thành công ${res.recordCount.toLocaleString()} bản ghi mới nhất từ nguồn dữ liệu đã lưu! (${res.syncedTimeFormatted})`,
      });
    } catch (err: any) {
      setSyncToast({
        type: 'error',
        message: err.message || 'Lỗi khi cập nhật dữ liệu mới nhất từ nguồn.',
      });
    } finally {
      setIsUpdatingData(false);
    }
  };

  const handleSaveAndSyncDataSource = async (newUrl: string, providedCsv?: string, providedCount?: number) => {
    handleDataSourceUrlChange(newUrl);

    if (providedCsv && providedCount !== undefined) {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} ngày ${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
      handleFileUpload(providedCsv, `Google Sheets (${providedCount} dòng)`);
      setLastSyncTime(timeStr);
      try {
        localStorage.setItem(STORAGE_KEY_LAST_SYNC_TIME, timeStr);
      } catch {
        // ignore
      }
      setSyncToast({
        type: 'success',
        message: `Đã cập nhật thành công ${providedCount.toLocaleString()} bản ghi mới nhất! (${timeStr})`,
      });
    } else if (newUrl.trim()) {
      setIsUpdatingData(true);
      try {
        const res = await fetchLatestDataFromUrl(newUrl);
        handleFileUpload(res.csvText, `Google Sheets (${res.recordCount} dòng)`);
        setLastSyncTime(res.syncedTimeFormatted);
        try {
          localStorage.setItem(STORAGE_KEY_LAST_SYNC_TIME, res.syncedTimeFormatted);
        } catch {
          // ignore
        }
        setSyncToast({
          type: 'success',
          message: `Đã cập nhật thành công ${res.recordCount.toLocaleString()} bản ghi mới nhất từ Google Sheets! (${res.syncedTimeFormatted})`,
        });
      } catch (err: any) {
        setSyncToast({
          type: 'error',
          message: err.message || 'Lỗi khi kết nối nguồn dữ liệu.',
        });
      } finally {
        setIsUpdatingData(false);
      }
    }
  };

  // Định kỳ kiểm tra lịch cập nhật tự động từ link vào 10h sáng hàng ngày
  useEffect(() => {
    const checkAndExecuteScheduledSync = async () => {
      const currentConfig = getScheduleConfig();
      const now = new Date();

      if (shouldTriggerAutoSync(currentConfig, now)) {
        console.log('[Auto-Sync] Đã đến giờ hẹn tự động cập nhật:', currentConfig.time);
        const urlToUse = (dataSourceUrl && dataSourceUrl.trim()) || DEFAULT_DATA_SOURCE_URL;

        setIsUpdatingData(true);
        try {
          const res = await fetchLatestDataFromUrl(urlToUse);
          handleFileUpload(res.csvText, `Google Sheets (${res.recordCount} dòng)`);
          setLastSyncTime(res.syncedTimeFormatted);
          try {
            localStorage.setItem(STORAGE_KEY_LAST_SYNC_TIME, res.syncedTimeFormatted);
          } catch {
            // ignore
          }

          const updatedConfig = recordScheduleExecution(
            currentConfig,
            'success',
            `Tự động cập nhật thành công ${res.recordCount} bản ghi`,
            res.recordCount,
            now
          );
          setScheduleConfig(updatedConfig);

          setSyncToast({
            type: 'success',
            message: `⏰ [Đã đến ${currentConfig.time || '10:00'} sáng] Hệ thống đã tự động cập nhật ${res.recordCount.toLocaleString()} bản ghi mới nhất từ link nguồn theo lịch hẹn! (${res.syncedTimeFormatted})`,
          });
        } catch (err: any) {
          console.error('[Auto-Sync] Lỗi cập nhật theo lịch:', err);
          const updatedConfig = recordScheduleExecution(
            currentConfig,
            'error',
            err.message || 'Lỗi kết nối khi tự động cập nhật',
            0,
            now
          );
          setScheduleConfig(updatedConfig);

          setSyncToast({
            type: 'error',
            message: `⏰ [Lịch tự động ${currentConfig.time || '10:00'}] Không thể tự động lấy dữ liệu: ${err.message || 'Lỗi kết nối link'}`,
          });
        } finally {
          setIsUpdatingData(false);
        }
      }
    };

    // Kiểm tra ngay khi khởi động
    checkAndExecuteScheduledSync();

    // Và quét kiểm tra mỗi 30 giây
    const intervalTimer = setInterval(checkAndExecuteScheduledSync, 30000);
    return () => clearInterval(intervalTimer);
  }, [dataSourceUrl]);

  // Chạy thử nghiệm ngay lịch tự động
  const handleTriggerScheduleNow = async () => {
    const urlToUse = (dataSourceUrl && dataSourceUrl.trim()) || DEFAULT_DATA_SOURCE_URL;
    setIsUpdatingData(true);
    try {
      const res = await fetchLatestDataFromUrl(urlToUse);
      handleFileUpload(res.csvText, `Google Sheets (${res.recordCount} dòng)`);
      setLastSyncTime(res.syncedTimeFormatted);
      try {
        localStorage.setItem(STORAGE_KEY_LAST_SYNC_TIME, res.syncedTimeFormatted);
      } catch {
        // ignore
      }

      const now = new Date();
      const updatedConfig = recordScheduleExecution(
        scheduleConfig,
        'success',
        `Chạy thử nghiệm thành công (${res.recordCount} dòng)`,
        res.recordCount,
        now
      );
      setScheduleConfig(updatedConfig);

      setSyncToast({
        type: 'success',
        message: `⏰ [Chạy thử lịch tự động] Cập nhật thành công ${res.recordCount.toLocaleString()} bản ghi mới nhất từ link nguồn! (${res.syncedTimeFormatted})`,
      });
    } catch (err: any) {
      setSyncToast({
        type: 'error',
        message: `Lỗi khi chạy thử cập nhật từ link: ${err.message || 'Không thể kết nối link'}`,
      });
      throw err;
    } finally {
      setIsUpdatingData(false);
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
        dataSourceUrl={dataSourceUrl}
        lastSyncTime={lastSyncTime}
        isUpdating={isUpdatingData}
        onUpdateData={handleUpdateLatestData}
        onOpenDataSourceModal={() => setIsDataSourceModalOpen(true)}
        onOpenScheduleModal={() => setIsScheduleModalOpen(true)}
        scheduleConfig={scheduleConfig}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Sync Toast Banner */}
        {syncToast && (
          <div
            className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-xs shadow-xs animate-in fade-in duration-200 ${
              syncToast.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-2">
              {syncToast.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span className="font-semibold">{syncToast.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setSyncToast(null)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 1. Bộ Lọc Phân Cấp & Mốc Thời Gian */}
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
          anchorDate={anchorDate}
          presetPeriods={presetPeriods}
          dataDateRange={dataDateRange}
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
            {/* 1. Xu Hướng Tần Suất Theo Ngày & Giờ (Được đưa lên đầu theo yêu cầu) */}
            <TimeTrendChart
              dailyData={dailyData}
              hourlyData={hourlyData}
              fullDailyData={fullDailyData}
              selectedDate={filters.date}
              onSelectDate={handleSelectDate}
            />

            {/* 2. Biểu đồ Trung bình trong ngày (từng giờ) & Trung bình trong tuần (từng thứ) */}
            <AverageTrendCharts
              hourlyAvgData={hourlyAvgData}
              weekdayAvgData={weekdayAvgData}
              totalDays={totalDays}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Account & Department Ranking */}
              <AccountRankingChart
                accountStats={accountStats}
                departmentStats={departmentStats}
                onSelectAccount={handleSelectAccount}
                onSelectDepartment={handleSelectDepartment}
              />

              {/* Platform & Feature Distribution */}
              <PlatformFeatureChart
                featureStats={featureStats}
                platformStats={platformStats}
                osStats={osStats}
                onSelectFeature={handleSelectFeature}
                onSelectPlatform={handleSelectPlatform}
              />
            </div>

            {/* 3. Tần Suất Trung Bình / Người / Ngày */}
            <UserDailyAverageChart
              dailyUserAvgData={dailyUserAvgData}
              userDailyRanking={userDailyRanking}
              departmentDailyAvg={departmentDailyAvg}
              onSelectAccount={handleSelectAccount}
              onSelectDepartment={handleSelectDepartment}
            />

            {/* 4. Heatmap Matrix Overview */}
            <HeatmapView records={filteredRecords} />

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

      {/* Data Source Configuration & Quick Sync Modal */}
      <DataSourceModal
        isOpen={isDataSourceModalOpen}
        onClose={() => setIsDataSourceModalOpen(false)}
        currentUrl={dataSourceUrl}
        onSaveAndSync={handleSaveAndSyncDataSource}
        onOpenScheduleModal={() => setIsScheduleModalOpen(true)}
        scheduleConfig={scheduleConfig}
      />

      {/* Schedule Auto-Sync Modal (10h sáng hàng ngày) */}
      <ScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        config={scheduleConfig}
        onSaveConfig={(newConfig) => {
          setScheduleConfig(newConfig);
          setSyncToast({
            type: 'success',
            message: `Đã lưu cấu hình tự động cập nhật vào ${newConfig.time} hàng ngày (${newConfig.enabled ? 'Đang kích hoạt' : 'Tạm dừng'})!`,
          });
        }}
        onTriggerNow={handleTriggerScheduleNow}
        dataSourceUrl={dataSourceUrl}
        isUpdating={isUpdatingData}
      />
    </div>
  );
}
