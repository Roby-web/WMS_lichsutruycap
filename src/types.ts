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

export interface FilterState {
  search: string;
  date: string; // 'ALL' or specific DD/MM/YYYY
  department: string; // 'ALL' or specific
  platform: string; // 'ALL' | 'WEB' | 'APP'
  feature: string; // 'ALL' or specific
  os: string; // 'ALL' or specific
  account: string; // 'ALL' or specific
  hourRange: [number, number]; // [minHour, maxHour] e.g. [0, 23]
}

export interface KpiMetrics {
  totalLogs: number;
  uniqueAccounts: number;
  uniqueDepartments: number;
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
