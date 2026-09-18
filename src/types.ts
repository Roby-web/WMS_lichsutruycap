export interface AccessRecord {
  stt: number;
  account: string;
  feature: string;
  rawTimestamp: string;
  time: string; // HH:mm:ss
  date: string; // DD/MM/YYYY
  isoDate: string; // YYYY-MM-DD for sorting
  hour: number; // 0 - 23
  dayOfWeek: string;
  platform: 'WEB' | 'APP' | string;
  os: string;
  department: string;
  role: string;
  ip: string;
  timestamp: number; // epoch ms
}

export type TimePreset =
  | 'today' // Hôm nay: mặc định active
  | 'yesterday' // Hôm qua
  | 'this_week' // Tuần này
  | 'last_week' // Tuần trước
  | 'this_month' // Tháng này
  | 'last_month' // Tháng trước
  | 'custom' // Khoảng thời gian
  | 'all'; // Tất cả

export interface CustomDateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}

export interface GrowthMetric {
  current: number;
  previous: number;
  delta: number;
  percentage: number;
  periodLabel: string;
}

export interface FilterState {
  search: string;
  timePreset: TimePreset;
  customRange: CustomDateRange;
  date: string; // 'ALL' or specific DD/MM/YYYY
  department: string; // 'ALL' or specific
  platform: string; // 'ALL' | 'WEB' | 'APP'
  role: string; // 'ALL' or specific (Trưởng/Phó ban, Phóng viên, BBT...)
  feature: string; // 'ALL' or specific
  os: string; // 'ALL' or specific
  account: string; // 'ALL' or specific
  hourRange: [number, number]; // [minHour, maxHour] e.g. [0, 23]
  excludeTestAccounts: boolean; // Loại bỏ các tài khoản test wms_bbt, wms_truongban, wms_phongvien và ban Tech, Test WMS
}

export const TOTAL_SYSTEM_USERS = 268;
export const TOTAL_SYSTEM_DEPARTMENTS = 24;

export interface KpiMetrics {
  totalLogs: number;
  uniqueAccounts: number;
  uniqueDepartments: number;
  totalSystemUsers: number;
  totalSystemDepartments: number;
  userParticipationRate: number;
  departmentParticipationRate: number;
  uniqueIPs: number;
  webCount: number;
  appCount: number;
  webPercent: number;
  appPercent: number;
  topAccount: { name: string; count: number; department: string };
  topDepartment: { name: string; count: number; userCount: number };
  topFeature: { name: string; count: number };
  peakHour: { hour: number; count: number };
  peakDay: { date: string; count: number };
  growth: {
    logs: GrowthMetric;
    users: GrowthMetric;
    departments: GrowthMetric;
    comparisonPeriodName: string;
  };
}

export interface AccountStat {
  account: string;
  count: number;
  percentage: number;
  departments: string[];
  role: string;
  primaryPlatform: string;
  primaryOs: string;
  latestAccess: string;
  featuresUsed: Record<string, number>;
  daysActive: string[];
  ips: string[];
}

export interface DepartmentStat {
  department: string;
  count: number;
  percentage: number;
  userCount: number;
  topFeature: string;
  webCount: number;
  appCount: number;
}

export interface FeatureStat {
  feature: string;
  count: number;
  percentage: number;
}

export interface PlatformStat {
  platform: string;
  count: number;
  percentage: number;
}

export interface OsStat {
  os: string;
  count: number;
  percentage: number;
}

export interface HourlyStat {
  hour: number;
  label: string;
  count: number;
  web: number;
  app: number;
}

export interface DailyStat {
  date: string; // DD/MM/YYYY
  isoDate: string;
  displayDate: string;
  count: number;
  uniqueUsers: number;
  web: number;
  app: number;
}

export interface HourlyAverageStat {
  hour: number;
  label: string;
  avgCount: number;
  totalCount: number;
  web: number;
  app: number;
  percentage: number;
}

export interface WeekdayAverageStat {
  dayIndex: number; // 1 = Thứ Hai, ..., 7 = Chủ Nhật
  dayName: string; // Thứ Hai, Thứ Ba, ...
  shortName: string; // T2, T3, T4, T5, T6, T7, CN
  avgCount: number;
  totalCount: number;
  distinctDays: number;
  uniqueUsers: number;
  web: number;
  app: number;
  percentage: number;
}

export interface DailyUserFrequencyStat {
  date: string; // DD/MM/YYYY
  isoDate: string;
  displayDate: string; // "16/09 (Thứ Tư)"
  dayOfWeek: string;
  totalLogs: number;
  activeUsers: number;
  avgPerUser: number; // totalLogs / activeUsers (lượt/người/ngày)
  web: number;
  app: number;
}

export interface UserDailyAvgStat {
  account: string;
  department: string;
  role: string;
  totalLogs: number;
  activeDaysCount: number;
  avgPerDay: number; // totalLogs / activeDaysCount (lượt/ngày)
  webCount: number;
  appCount: number;
}

export interface DepartmentDailyAvgStat {
  department: string;
  totalLogs: number;
  userCount: number;
  distinctDays: number;
  avgPerUserPerDay: number; // totalLogs / (userCount * distinctDays)
  webCount: number;
  appCount: number;
}
