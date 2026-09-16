import { AccessRecord, FilterState, KpiMetrics, AccountStat, DepartmentStat, FeatureStat, PlatformStat, OsStat, HourlyStat, DailyStat } from '../types';

const VIETNAMESE_DAYS = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

export function parseAccessCsv(csvText: string): AccessRecord[] {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  // Parse header
  const records: AccessRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Handle CSV line splitting
    const parts = parseCsvLine(line);
    if (parts.length < 9) continue;

    const stt = parseInt(parts[0], 10) || i;
    const account = (parts[1] || '').trim();
    const feature = (parts[2] || '').trim();
    const rawTimestamp = (parts[3] || '').trim();
    const platform = (parts[4] || 'WEB').trim().toUpperCase();
    const os = (parts[5] || 'Unknown').trim();
    const department = (parts[6] || 'Chưa phân loại').trim();
    const role = (parts[7] || 'Thành viên').trim();
    const ip = (parts[8] || '').trim();

    // Parse timestamp: "16:30:51 16/09/2026"
    let time = '';
    let date = '';
    let isoDate = '';
    let hour = 0;
    let dayOfWeek = '';
    let epochMs = 0;

    const timeDateMatch = rawTimestamp.match(/^(\d{2}:\d{2}:\d{2})\s+(\d{2})\/(\d{2})\/(\d{4})$/);
    if (timeDateMatch) {
      time = timeDateMatch[1];
      const day = parseInt(timeDateMatch[2], 10);
      const month = parseInt(timeDateMatch[3], 10) - 1; // 0-indexed
      const year = parseInt(timeDateMatch[4], 10);
      date = `${timeDateMatch[2]}/${timeDateMatch[3]}/${timeDateMatch[4]}`;
      isoDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      const [h, m, s] = time.split(':').map(Number);
      hour = h;
      const dObj = new Date(year, month, day, h, m, s);
      epochMs = dObj.getTime();
      dayOfWeek = VIETNAMESE_DAYS[dObj.getDay()] || '';
    } else {
      time = rawTimestamp;
      date = 'N/A';
      isoDate = 'N/A';
    }

    records.push({
      stt,
      account,
      feature,
      rawTimestamp,
      time,
      date,
      isoDate,
      hour,
      dayOfWeek,
      platform,
      os,
      department,
      role,
      ip,
      timestamp: epochMs,
    });
  }

  return records;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

export function filterRecords(records: AccessRecord[], filters: FilterState): AccessRecord[] {
  const searchLower = filters.search.trim().toLowerCase();

  return records.filter((r) => {
    // Search query matches account, department, feature, IP, role, os
    if (searchLower) {
      const match =
        r.account.toLowerCase().includes(searchLower) ||
        r.department.toLowerCase().includes(searchLower) ||
        r.feature.toLowerCase().includes(searchLower) ||
        r.ip.toLowerCase().includes(searchLower) ||
        r.os.toLowerCase().includes(searchLower) ||
        r.role.toLowerCase().includes(searchLower);
      if (!match) return false;
    }

    // Date
    if (filters.date !== 'ALL' && r.date !== filters.date) {
      return false;
    }

    // Department
    if (filters.department !== 'ALL' && r.department !== filters.department) {
      return false;
    }

    // Platform
    if (filters.platform !== 'ALL' && r.platform !== filters.platform) {
      return false;
    }

    // Feature
    if (filters.feature !== 'ALL' && r.feature !== filters.feature) {
      return false;
    }

    // OS
    if (filters.os !== 'ALL' && r.os !== filters.os) {
      return false;
    }

    // Account
    if (filters.account !== 'ALL' && r.account !== filters.account) {
      return false;
    }

    // Hour Range
    if (r.hour < filters.hourRange[0] || r.hour > filters.hourRange[1]) {
      return false;
    }

    return true;
  });
}

export function computeKpiMetrics(records: AccessRecord[]): KpiMetrics {
  const totalLogs = records.length;
  if (totalLogs === 0) {
    return {
      totalLogs: 0,
      uniqueAccounts: 0,
      uniqueDepartments: 0,
      uniqueIPs: 0,
      webCount: 0,
      appCount: 0,
      webPercent: 0,
      appPercent: 0,
      topAccount: { name: '-', count: 0, department: '-' },
      topDepartment: { name: '-', count: 0, userCount: 0 },
      topFeature: { name: '-', count: 0 },
      peakHour: { hour: 0, count: 0 },
      peakDay: { date: '-', count: 0 },
    };
  }

  const accountCounts = new Map<string, { count: number; department: string }>();
  const deptCounts = new Map<string, { count: number; users: Set<string> }>();
  const featureCounts = new Map<string, number>();
  const ipSet = new Set<string>();
  const hourCounts = new Array(24).fill(0);
  const dayCounts = new Map<string, number>();

  let webCount = 0;
  let appCount = 0;

  for (const r of records) {
    // Platform
    if (r.platform === 'WEB') webCount++;
    else if (r.platform === 'APP') appCount++;

    // Account
    const acc = accountCounts.get(r.account) || { count: 0, department: r.department };
    acc.count++;
    accountCounts.set(r.account, acc);

    // Department
    const dept = deptCounts.get(r.department) || { count: 0, users: new Set() };
    dept.count++;
    dept.users.add(r.account);
    deptCounts.set(r.department, dept);

    // Feature
    featureCounts.set(r.feature, (featureCounts.get(r.feature) || 0) + 1);

    // IP
    if (r.ip) ipSet.add(r.ip);

    // Hour
    if (r.hour >= 0 && r.hour < 24) {
      hourCounts[r.hour]++;
    }

    // Day
    if (r.date && r.date !== 'N/A') {
      dayCounts.set(r.date, (dayCounts.get(r.date) || 0) + 1);
    }
  }

  // Find top account
  let topAccount = { name: '-', count: 0, department: '-' };
  for (const [name, data] of accountCounts.entries()) {
    if (data.count > topAccount.count) {
      topAccount = { name, count: data.count, department: data.department };
    }
  }

  // Find top department
  let topDepartment = { name: '-', count: 0, userCount: 0 };
  for (const [name, data] of deptCounts.entries()) {
    if (data.count > topDepartment.count) {
      topDepartment = { name, count: data.count, userCount: data.users.size };
    }
  }

  // Find top feature
  let topFeature = { name: '-', count: 0 };
  for (const [name, count] of featureCounts.entries()) {
    if (count > topFeature.count) {
      topFeature = { name, count };
    }
  }

  // Find peak hour
  let peakHour = { hour: 0, count: 0 };
  hourCounts.forEach((count, h) => {
    if (count > peakHour.count) {
      peakHour = { hour: h, count };
    }
  });

  // Find peak day
  let peakDay = { date: '-', count: 0 };
  for (const [date, count] of dayCounts.entries()) {
    if (count > peakDay.count) {
      peakDay = { date, count };
    }
  }

  return {
    totalLogs,
    uniqueAccounts: accountCounts.size,
    uniqueDepartments: deptCounts.size,
    uniqueIPs: ipSet.size,
    webCount,
    appCount,
    webPercent: Math.round((webCount / totalLogs) * 100),
    appPercent: Math.round((appCount / totalLogs) * 100),
    topAccount,
    topDepartment,
    topFeature,
    peakHour,
    peakDay,
  };
}

export function computeAccountStats(records: AccessRecord[]): AccountStat[] {
  const map = new Map<
    string,
    {
      count: number;
      departments: Set<string>;
      role: string;
      platforms: Map<string, number>;
      oses: Map<string, number>;
      latestTime: string;
      latestEpoch: number;
      features: Record<string, number>;
      days: Set<string>;
      ips: Set<string>;
    }
  >();

  const total = records.length;

  for (const r of records) {
    if (!map.has(r.account)) {
      map.set(r.account, {
        count: 0,
        departments: new Set(),
        role: r.role,
        platforms: new Map(),
        oses: new Map(),
        latestTime: r.rawTimestamp,
        latestEpoch: r.timestamp,
        features: {},
        days: new Set(),
        ips: new Set(),
      });
    }

    const item = map.get(r.account)!;
    item.count++;
    item.departments.add(r.department);
    item.days.add(r.date);
    if (r.ip) item.ips.add(r.ip);

    item.platforms.set(r.platform, (item.platforms.get(r.platform) || 0) + 1);
    item.oses.set(r.os, (item.oses.get(r.os) || 0) + 1);
    item.features[r.feature] = (item.features[r.feature] || 0) + 1;

    if (r.timestamp > item.latestEpoch) {
      item.latestEpoch = r.timestamp;
      item.latestTime = r.rawTimestamp;
    }
  }

  const result: AccountStat[] = [];

  for (const [account, data] of map.entries()) {
    // get dominant platform
    let primaryPlatform = 'WEB';
    let maxPlat = 0;
    for (const [plat, c] of data.platforms.entries()) {
      if (c > maxPlat) {
        maxPlat = c;
        primaryPlatform = plat;
      }
    }

    // get dominant OS
    let primaryOs = 'Windows';
    let maxOs = 0;
    for (const [os, c] of data.oses.entries()) {
      if (c > maxOs) {
        maxOs = c;
        primaryOs = os;
      }
    }

    result.push({
      account,
      count: data.count,
      percentage: total > 0 ? Number(((data.count / total) * 100).toFixed(1)) : 0,
      departments: Array.from(data.departments),
      role: data.role,
      primaryPlatform,
      primaryOs,
      latestAccess: data.latestTime,
      featuresUsed: data.features,
      daysActive: Array.from(data.days),
      ips: Array.from(data.ips),
    });
  }

  return result.sort((a, b) => b.count - a.count);
}

export function computeDepartmentStats(records: AccessRecord[]): DepartmentStat[] {
  const map = new Map<
    string,
    {
      count: number;
      users: Set<string>;
      features: Map<string, number>;
      webCount: number;
      appCount: number;
    }
  >();

  const total = records.length;

  for (const r of records) {
    if (!map.has(r.department)) {
      map.set(r.department, {
        count: 0,
        users: new Set(),
        features: new Map(),
        webCount: 0,
        appCount: 0,
      });
    }

    const item = map.get(r.department)!;
    item.count++;
    item.users.add(r.account);
    item.features.set(r.feature, (item.features.get(r.feature) || 0) + 1);
    if (r.platform === 'WEB') item.webCount++;
    else if (r.platform === 'APP') item.appCount++;
  }

  const result: DepartmentStat[] = [];
  for (const [department, data] of map.entries()) {
    let topFeature = 'Story';
    let maxFeature = 0;
    for (const [feat, c] of data.features.entries()) {
      if (c > maxFeature) {
        maxFeature = c;
        topFeature = feat;
      }
    }

    result.push({
      department,
      count: data.count,
      percentage: total > 0 ? Number(((data.count / total) * 100).toFixed(1)) : 0,
      userCount: data.users.size,
      topFeature,
      webCount: data.webCount,
      appCount: data.appCount,
    });
  }

  return result.sort((a, b) => b.count - a.count);
}

export function computeFeatureStats(records: AccessRecord[]): FeatureStat[] {
  const counts = new Map<string, number>();
  const total = records.length;

  for (const r of records) {
    counts.set(r.feature, (counts.get(r.feature) || 0) + 1);
  }

  const result: FeatureStat[] = [];
  for (const [feature, count] of counts.entries()) {
    result.push({
      feature,
      count,
      percentage: total > 0 ? Number(((count / total) * 100).toFixed(1)) : 0,
    });
  }

  return result.sort((a, b) => b.count - a.count);
}

export function computePlatformStats(records: AccessRecord[]): PlatformStat[] {
  const counts = new Map<string, number>();
  const total = records.length;

  for (const r of records) {
    counts.set(r.platform, (counts.get(r.platform) || 0) + 1);
  }

  const result: PlatformStat[] = [];
  for (const [platform, count] of counts.entries()) {
    result.push({
      platform,
      count,
      percentage: total > 0 ? Number(((count / total) * 100).toFixed(1)) : 0,
    });
  }

  return result.sort((a, b) => b.count - a.count);
}

export function computeOsStats(records: AccessRecord[]): OsStat[] {
  const counts = new Map<string, number>();
  const total = records.length;

  for (const r of records) {
    counts.set(r.os, (counts.get(r.os) || 0) + 1);
  }

  const result: OsStat[] = [];
  for (const [os, count] of counts.entries()) {
    result.push({
      os,
      count,
      percentage: total > 0 ? Number(((count / total) * 100).toFixed(1)) : 0,
    });
  }

  return result.sort((a, b) => b.count - a.count);
}

export function computeHourlyStats(records: AccessRecord[]): HourlyStat[] {
  const hours: HourlyStat[] = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    label: `${String(i).padStart(2, '0')}:00`,
    count: 0,
    web: 0,
    app: 0,
  }));

  for (const r of records) {
    if (r.hour >= 0 && r.hour < 24) {
      hours[r.hour].count++;
      if (r.platform === 'WEB') hours[r.hour].web++;
      else if (r.platform === 'APP') hours[r.hour].app++;
    }
  }

  return hours;
}

export function computeDailyStats(records: AccessRecord[]): DailyStat[] {
  const map = new Map<
    string,
    {
      isoDate: string;
      displayDate: string;
      count: number;
      users: Set<string>;
      web: number;
      app: number;
    }
  >();

  for (const r of records) {
    if (!r.date || r.date === 'N/A') continue;

    if (!map.has(r.date)) {
      map.set(r.date, {
        isoDate: r.isoDate,
        displayDate: `${r.date} (${r.dayOfWeek})`,
        count: 0,
        users: new Set(),
        web: 0,
        app: 0,
      });
    }

    const item = map.get(r.date)!;
    item.count++;
    item.users.add(r.account);
    if (r.platform === 'WEB') item.web++;
    else if (r.platform === 'APP') item.app++;
  }

  const result: DailyStat[] = [];
  for (const [date, data] of map.entries()) {
    result.push({
      date,
      isoDate: data.isoDate,
      displayDate: data.displayDate,
      count: data.count,
      uniqueUsers: data.users.size,
      web: data.web,
      app: data.app,
    });
  }

  // Sort chronologically by isoDate
  return result.sort((a, b) => a.isoDate.localeCompare(b.isoDate));
}

export function exportToCsv(records: AccessRecord[], filename = 'thong_ke_lich_su_truy_cap.csv') {
  const headers = ['STT', 'Tài khoản', 'Chức năng', 'Thời gian', 'Nền tảng', 'Hệ điều hành', 'Ban', 'Vai trò', 'IP'];
  const rows = records.map((r) => [
    r.stt,
    `"${r.account}"`,
    `"${r.feature}"`,
    `"${r.rawTimestamp}"`,
    `"${r.platform}"`,
    `"${r.os}"`,
    `"${r.department}"`,
    `"${r.role}"`,
    `"${r.ip}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
