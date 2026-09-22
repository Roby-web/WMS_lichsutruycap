import { AccessRecord, CustomDateRange, GrowthMetric, TimePreset } from '../types';

export function formatToIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatToVnDate(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const y = d.getFullYear();
  return `${day}/${m}/${y}`;
}

export function formatIsoToVnDate(iso: string): string {
  if (!iso || !iso.includes('-')) return iso;
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

/**
 * Xác định ngày neo (Anchor Date):
 * - Nếu hôm nay (new Date()) có dữ liệu trong dataset => dùng ngày hôm nay.
 * - Nếu không (file log lịch sử/mẫu), dùng ngày mới nhất có trong dataset.
 */
export function getAnchorDate(records: AccessRecord[]): Date {
  const now = new Date();
  const todayIso = formatToIso(now);
  const hasToday = records.some((r) => r.isoDate === todayIso);
  if (hasToday) {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  // Lấy ngày max trong dataset
  let maxIso = '';
  for (const r of records) {
    if (r.isoDate && r.isoDate > maxIso) {
      maxIso = r.isoDate;
    }
  }

  if (maxIso) {
    const [y, m, d] = maxIso.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export interface DataDateRange {
  minIso: string;
  maxIso: string;
  minVn: string;
  maxVn: string;
  minDate: Date;
  maxDate: Date;
}

/**
 * Trích xuất dải ngày có dữ liệu thực tế từ các bản ghi (từ ngày đầu tiên có dữ liệu đến ngày mới nhất)
 */
export function getDataDateRange(records: AccessRecord[], fallbackAnchor?: Date): DataDateRange {
  const fallback = fallbackAnchor || new Date();
  let minIso = '';
  let maxIso = '';

  for (const r of records) {
    if (r.isoDate && r.isoDate !== 'N/A') {
      if (!minIso || r.isoDate < minIso) minIso = r.isoDate;
      if (!maxIso || r.isoDate > maxIso) maxIso = r.isoDate;
    }
  }

  if (!minIso || !maxIso) {
    const todayIso = formatToIso(fallback);
    const todayVn = formatToVnDate(fallback);
    return {
      minIso: todayIso,
      maxIso: todayIso,
      minVn: todayVn,
      maxVn: todayVn,
      minDate: fallback,
      maxDate: fallback,
    };
  }

  const [minY, minM, minD] = minIso.split('-').map(Number);
  const [maxY, maxM, maxD] = maxIso.split('-').map(Number);

  return {
    minIso,
    maxIso,
    minVn: formatIsoToVnDate(minIso),
    maxVn: formatIsoToVnDate(maxIso),
    minDate: new Date(minY, minM - 1, minD),
    maxDate: new Date(maxY, maxM - 1, maxD),
  };
}

export interface PeriodDateRange {
  startIso: string;
  endIso: string;
  label: string;
  shortLabel: string;
}

export interface PresetPeriods {
  current: PeriodDateRange;
  previous: PeriodDateRange;
  comparisonLabel: string;
}

/**
 * Tính khoảng thời gian hiện tại và khoảng thời gian cùng kỳ trước theo Preset
 */
export function resolvePresetPeriods(
  preset: TimePreset,
  anchorDate: Date,
  customRange?: CustomDateRange,
  dataDateRange?: DataDateRange
): PresetPeriods {
  const anchorYear = anchorDate.getFullYear();
  const anchorMonth = anchorDate.getMonth();
  const anchorDay = anchorDate.getDate();

  switch (preset) {
    case 'today': {
      const curDate = new Date(anchorYear, anchorMonth, anchorDay);
      const curIso = formatToIso(curDate);
      const curVn = formatToVnDate(curDate);

      const prevDate = new Date(anchorYear, anchorMonth, anchorDay - 1);
      const prevIso = formatToIso(prevDate);
      const prevVn = formatToVnDate(prevDate);

      return {
        current: {
          startIso: curIso,
          endIso: curIso,
          label: `Hôm nay (${curVn})`,
          shortLabel: 'Hôm nay',
        },
        previous: {
          startIso: prevIso,
          endIso: prevIso,
          label: `Hôm qua (${prevVn})`,
          shortLabel: 'Hôm qua',
        },
        comparisonLabel: `hôm qua (${prevVn})`,
      };
    }

    case 'yesterday': {
      const curDate = new Date(anchorYear, anchorMonth, anchorDay - 1);
      const curIso = formatToIso(curDate);
      const curVn = formatToVnDate(curDate);

      const prevDate = new Date(anchorYear, anchorMonth, anchorDay - 2);
      const prevIso = formatToIso(prevDate);
      const prevVn = formatToVnDate(prevDate);

      return {
        current: {
          startIso: curIso,
          endIso: curIso,
          label: `Hôm qua (${curVn})`,
          shortLabel: 'Hôm qua',
        },
        previous: {
          startIso: prevIso,
          endIso: prevIso,
          label: `Hôm trước (${prevVn})`,
          shortLabel: 'Hôm trước',
        },
        comparisonLabel: `hôm trước (${prevVn})`,
      };
    }

    case 'this_week': {
      // Tuần bắt đầu từ Thứ Hai (Monday) đến Chủ Nhật (Sunday)
      const dayOfWeek = anchorDate.getDay(); // 0: CN, 1: T2 ... 6: T7
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(anchorYear, anchorMonth, anchorDay + mondayOffset);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      const curStartIso = formatToIso(monday);
      const curEndIso = formatToIso(sunday);
      const curStartVn = formatToVnDate(monday).slice(0, 5);
      const curEndVn = formatToVnDate(sunday);

      // Tuần trước: lùi 7 ngày
      const prevMonday = new Date(monday);
      prevMonday.setDate(monday.getDate() - 7);
      const prevSunday = new Date(sunday);
      prevSunday.setDate(sunday.getDate() - 7);

      const prevStartIso = formatToIso(prevMonday);
      const prevEndIso = formatToIso(prevSunday);
      const prevStartVn = formatToVnDate(prevMonday).slice(0, 5);
      const prevEndVn = formatToVnDate(prevSunday);

      return {
        current: {
          startIso: curStartIso,
          endIso: curEndIso,
          label: `Tuần này (${curStartVn} - ${curEndVn})`,
          shortLabel: 'Tuần này',
        },
        previous: {
          startIso: prevStartIso,
          endIso: prevEndIso,
          label: `Tuần trước (${prevStartVn} - ${prevEndVn})`,
          shortLabel: 'Tuần trước',
        },
        comparisonLabel: `tuần trước (${prevStartVn} - ${prevEndVn})`,
      };
    }

    case 'last_week': {
      const dayOfWeek = anchorDate.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const thisMonday = new Date(anchorYear, anchorMonth, anchorDay + mondayOffset);

      const lastMonday = new Date(thisMonday);
      lastMonday.setDate(thisMonday.getDate() - 7);
      const lastSunday = new Date(lastMonday);
      lastSunday.setDate(lastMonday.getDate() + 6);

      const curStartIso = formatToIso(lastMonday);
      const curEndIso = formatToIso(lastSunday);
      const curStartVn = formatToVnDate(lastMonday).slice(0, 5);
      const curEndVn = formatToVnDate(lastSunday);

      // 2 tuần trước
      const twoWeeksAgoMon = new Date(lastMonday);
      twoWeeksAgoMon.setDate(lastMonday.getDate() - 7);
      const twoWeeksAgoSun = new Date(lastSunday);
      twoWeeksAgoSun.setDate(lastSunday.getDate() - 7);

      const prevStartIso = formatToIso(twoWeeksAgoMon);
      const prevEndIso = formatToIso(twoWeeksAgoSun);
      const prevStartVn = formatToVnDate(twoWeeksAgoMon).slice(0, 5);
      const prevEndVn = formatToVnDate(twoWeeksAgoSun);

      return {
        current: {
          startIso: curStartIso,
          endIso: curEndIso,
          label: `Tuần trước (${curStartVn} - ${curEndVn})`,
          shortLabel: 'Tuần trước',
        },
        previous: {
          startIso: prevStartIso,
          endIso: prevEndIso,
          label: `2 tuần trước (${prevStartVn} - ${prevEndVn})`,
          shortLabel: '2 tuần trước',
        },
        comparisonLabel: `2 tuần trước`,
      };
    }

    case 'this_month': {
      const firstDay = new Date(anchorYear, anchorMonth, 1);
      const lastDay = new Date(anchorYear, anchorMonth + 1, 0);

      const curStartIso = formatToIso(firstDay);
      const curEndIso = formatToIso(lastDay);

      // Tháng trước
      const prevMonthFirst = new Date(anchorYear, anchorMonth - 1, 1);
      const prevMonthLast = new Date(anchorYear, anchorMonth, 0);

      const prevStartIso = formatToIso(prevMonthFirst);
      const prevEndIso = formatToIso(prevMonthLast);

      const curMonthLabel = `Tháng ${anchorMonth + 1}/${anchorYear}`;
      const prevMonthLabel = `Tháng ${prevMonthFirst.getMonth() + 1}/${prevMonthFirst.getFullYear()}`;

      return {
        current: {
          startIso: curStartIso,
          endIso: curEndIso,
          label: `Tháng này (${curMonthLabel})`,
          shortLabel: 'Tháng này',
        },
        previous: {
          startIso: prevStartIso,
          endIso: prevEndIso,
          label: `Tháng trước (${prevMonthLabel})`,
          shortLabel: 'Tháng trước',
        },
        comparisonLabel: `tháng trước (${prevMonthLabel})`,
      };
    }

    case 'last_month': {
      const prevMonthFirst = new Date(anchorYear, anchorMonth - 1, 1);
      const prevMonthLast = new Date(anchorYear, anchorMonth, 0);

      const curStartIso = formatToIso(prevMonthFirst);
      const curEndIso = formatToIso(prevMonthLast);

      const twoMonthsAgoFirst = new Date(anchorYear, anchorMonth - 2, 1);
      const twoMonthsAgoLast = new Date(anchorYear, anchorMonth - 1, 0);

      const prevStartIso = formatToIso(twoMonthsAgoFirst);
      const prevEndIso = formatToIso(twoMonthsAgoLast);

      const lastMonthLabel = `Tháng ${prevMonthFirst.getMonth() + 1}/${prevMonthFirst.getFullYear()}`;
      const twoMonthsAgoLabel = `Tháng ${twoMonthsAgoFirst.getMonth() + 1}/${twoMonthsAgoFirst.getFullYear()}`;

      return {
        current: {
          startIso: curStartIso,
          endIso: curEndIso,
          label: `Tháng trước (${lastMonthLabel})`,
          shortLabel: 'Tháng trước',
        },
        previous: {
          startIso: prevStartIso,
          endIso: prevEndIso,
          label: `2 tháng trước (${twoMonthsAgoLabel})`,
          shortLabel: '2 tháng trước',
        },
        comparisonLabel: `2 tháng trước (${twoMonthsAgoLabel})`,
      };
    }

    case 'custom': {
      const startIso = customRange?.startDate || formatToIso(anchorDate);
      const endIso = customRange?.endDate || startIso;

      const startDateObj = new Date(startIso + 'T00:00:00');
      const endDateObj = new Date(endIso + 'T00:00:00');

      // Tính số ngày của chu kỳ
      const diffMs = Math.max(endDateObj.getTime() - startDateObj.getTime(), 0);
      const daySpan = Math.max(Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1, 1);

      // Cùng kỳ trước: lùi lại đúng daySpan ngày
      const prevEndDateObj = new Date(startDateObj);
      prevEndDateObj.setDate(startDateObj.getDate() - 1);

      const prevStartDateObj = new Date(prevEndDateObj);
      prevStartDateObj.setDate(prevEndDateObj.getDate() - (daySpan - 1));

      const prevStartIso = formatToIso(prevStartDateObj);
      const prevEndIso = formatToIso(prevEndDateObj);

      const curStartVn = formatIsoToVnDate(startIso);
      const curEndVn = formatIsoToVnDate(endIso);
      const prevStartVn = formatIsoToVnDate(prevStartIso);
      const prevEndVn = formatIsoToVnDate(prevEndIso);

      return {
        current: {
          startIso,
          endIso,
          label: startIso === endIso ? `Ngày ${curStartVn}` : `${curStartVn} - ${curEndVn}`,
          shortLabel: 'Khoảng ngày',
        },
        previous: {
          startIso: prevStartIso,
          endIso: prevEndIso,
          label: prevStartIso === prevEndIso ? `Ngày ${prevStartVn}` : `${prevStartVn} - ${prevEndVn}`,
          shortLabel: 'Kỳ trước',
        },
        comparisonLabel: `cùng kỳ trước (${prevStartVn} - ${prevEndVn})`,
      };
    }

    case 'all':
    default: {
      const startIso = dataDateRange?.minIso || '';
      const endIso = dataDateRange?.maxIso || '';
      const startVn = dataDateRange?.minVn || (startIso ? formatIsoToVnDate(startIso) : '');
      const endVn = dataDateRange?.maxVn || (endIso ? formatIsoToVnDate(endIso) : '');

      let displayLabel = 'Tất cả thời gian';
      if (startVn && endVn) {
        displayLabel = startVn === endVn ? `Tất cả (${startVn})` : `Tất cả (${startVn} - ${endVn})`;
      }

      return {
        current: {
          startIso,
          endIso,
          label: displayLabel,
          shortLabel: 'Tất cả',
        },
        previous: {
          startIso: '',
          endIso: '',
          label: 'Toàn kỳ',
          shortLabel: 'Toàn kỳ',
        },
        comparisonLabel: 'toàn kỳ',
      };
    }
  }
}

/**
 * Tính toán chỉ số tăng trưởng giữa kỳ hiện tại và kỳ trước
 */
export function calculateGrowth(
  current: number,
  previous: number,
  periodLabel: string
): GrowthMetric {
  const delta = current - previous;
  let percentage = 0;

  if (previous > 0) {
    percentage = Number(((delta / previous) * 100).toFixed(1));
  } else if (current > 0) {
    percentage = 100; // Tăng trưởng mới từ 0
  } else {
    percentage = 0;
  }

  return {
    current,
    previous,
    delta,
    percentage,
    periodLabel,
  };
}
