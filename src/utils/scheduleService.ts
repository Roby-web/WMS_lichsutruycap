import { AutoSyncScheduleConfig } from '../types';

export const STORAGE_KEY_SCHEDULE_CONFIG = 'access_dashboard_schedule_config_v2';

export const DEFAULT_SCHEDULE_CONFIG: AutoSyncScheduleConfig = {
  enabled: true, // Mặc định BẬT theo yêu cầu của người dùng
  time: '10:00', // 10h sáng hàng ngày
  repeat: 'daily',
  lastRunDate: '',
  lastRunTime: '',
  lastRunStatus: undefined,
  lastRunMessage: '',
  lastRecordCount: 0,
};

export function getScheduleConfig(): AutoSyncScheduleConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SCHEDULE_CONFIG);
    if (!raw) return { ...DEFAULT_SCHEDULE_CONFIG };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SCHEDULE_CONFIG,
      ...parsed,
      // Đảm bảo các giá trị tối thiểu
      time: parsed.time || '10:00',
      repeat: 'daily',
    };
  } catch {
    return { ...DEFAULT_SCHEDULE_CONFIG };
  }
}

export function saveScheduleConfig(config: AutoSyncScheduleConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY_SCHEDULE_CONFIG, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save schedule config', e);
  }
}

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatDateTime(date: Date): string {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${hh}:${mm}:${ss} ${dd}/${month}/${yyyy}`;
}

export interface NextRunInfo {
  nextDate: Date;
  formattedTime: string;
  relativeDay: 'today' | 'tomorrow' | 'later';
  countdownLabel: string;
}

export function getNextRunInfo(config: AutoSyncScheduleConfig, now: Date = new Date()): NextRunInfo {
  const [targetHStr, targetMStr] = config.time.split(':');
  const targetHour = parseInt(targetHStr || '10', 10);
  const targetMinute = parseInt(targetMStr || '0', 10);

  const nextDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), targetHour, targetMinute, 0, 0);

  // Nếu thời điểm mục tiêu hôm nay đã qua, hoặc đã chạy hôm nay rồi, lần chạy tiếp theo là 10h sáng ngày mai
  const todayKey = toDateKey(now);
  const isPastToday = now.getTime() >= nextDate.getTime();
  const alreadyRanToday = config.lastRunDate === todayKey;

  if (isPastToday || alreadyRanToday) {
    nextDate.setDate(nextDate.getDate() + 1);
  }

  const diffMs = nextDate.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  let countdownLabel = '';
  if (diffHours > 0) {
    countdownLabel = `sau ${diffHours} giờ ${diffMinutes} phút`;
  } else if (diffMinutes > 0) {
    countdownLabel = `sau ${diffMinutes} phút`;
  } else {
    countdownLabel = 'trong giây lát';
  }

  const isToday = nextDate.getDate() === now.getDate() && nextDate.getMonth() === now.getMonth();
  const dd = String(nextDate.getDate()).padStart(2, '0');
  const mm = String(nextDate.getMonth() + 1).padStart(2, '0');
  const yyyy = nextDate.getFullYear();

  return {
    nextDate,
    formattedTime: `${String(targetHour).padStart(2, '0')}:${String(targetMinute).padStart(2, '0')} ngày ${dd}/${mm}/${yyyy}`,
    relativeDay: isToday ? 'today' : 'tomorrow',
    countdownLabel,
  };
}

/**
 * Kiểm tra xem tại thời điểm `now` có cần kích hoạt tự động cập nhật hay không.
 * Điều kiện:
 * 1. Schedule đang bật (`enabled === true`).
 * 2. Chưa chạy trong ngày hôm nay (`lastRunDate !== todayKey`).
 * 3. Thời gian hiện tại đã đến hoặc qua mốc giờ định kỳ (mặc định 10:00).
 */
export function shouldTriggerAutoSync(config: AutoSyncScheduleConfig, now: Date = new Date()): boolean {
  if (!config.enabled) return false;

  const todayKey = toDateKey(now);
  if (config.lastRunDate === todayKey) {
    // Đã chạy trong ngày hôm nay rồi
    return false;
  }

  const [targetHStr, targetMStr] = config.time.split(':');
  const targetHour = parseInt(targetHStr || '10', 10);
  const targetMinute = parseInt(targetMStr || '0', 10);

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const targetMinutes = targetHour * 60 + targetMinute;

  return currentMinutes >= targetMinutes;
}

export function recordScheduleExecution(
  prevConfig: AutoSyncScheduleConfig,
  status: 'success' | 'error',
  message: string,
  recordCount: number = 0,
  now: Date = new Date()
): AutoSyncScheduleConfig {
  const updated: AutoSyncScheduleConfig = {
    ...prevConfig,
    lastRunDate: toDateKey(now),
    lastRunTime: formatDateTime(now),
    lastRunStatus: status,
    lastRunMessage: message,
    lastRecordCount: recordCount,
  };
  saveScheduleConfig(updated);
  return updated;
}
