import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import { FilterState, TimePreset } from '../types';
import { formatToIso, formatIsoToVnDate } from '../utils/dateRanges';

interface DateRangePickerProps {
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  anchorDate?: Date;
}

const VIETNAMESE_WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

function formatVnFullDate(d: Date): string {
  const dayNames = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  const dayName = dayNames[d.getDay()];
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  return `${dayName}, ${day}/${month}/${year}`;
}

function parseIsoToDate(iso: string, fallback: Date): Date {
  if (!iso || !iso.includes('-')) return fallback;
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return fallback;
  return new Date(y, m - 1, d);
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  filters,
  onFilterChange,
  anchorDate,
}) => {
  const baseAnchor = anchorDate || new Date();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize dates from filters
  const resolveCurrentDates = (): { start: Date; end: Date; preset: string } => {
    const anchorY = baseAnchor.getFullYear();
    const anchorM = baseAnchor.getMonth();
    const anchorD = baseAnchor.getDate();

    switch (filters.timePreset) {
      case 'today': {
        const d = new Date(anchorY, anchorM, anchorD);
        return { start: d, end: d, preset: 'today' };
      }
      case 'yesterday': {
        const d = new Date(anchorY, anchorM, anchorD - 1);
        return { start: d, end: d, preset: 'yesterday' };
      }
      case 'this_week': {
        const dayOfWeek = baseAnchor.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(anchorY, anchorM, anchorD + mondayOffset);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        return { start: monday, end: sunday, preset: 'this_week' };
      }
      case 'last_week': {
        const dayOfWeek = baseAnchor.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const thisMonday = new Date(anchorY, anchorM, anchorD + mondayOffset);
        const lastMonday = new Date(thisMonday);
        lastMonday.setDate(thisMonday.getDate() - 7);
        const lastSunday = new Date(lastMonday);
        lastSunday.setDate(lastMonday.getDate() + 6);
        return { start: lastMonday, end: lastSunday, preset: 'last_week' };
      }
      case 'this_month': {
        const first = new Date(anchorY, anchorM, 1);
        const last = new Date(anchorY, anchorM + 1, 0);
        return { start: first, end: last, preset: 'this_month' };
      }
      case 'last_month': {
        const first = new Date(anchorY, anchorM - 1, 1);
        const last = new Date(anchorY, anchorM, 0);
        return { start: first, end: last, preset: 'last_month' };
      }
      case 'custom': {
        const s = parseIsoToDate(filters.customRange.startDate, baseAnchor);
        const e = parseIsoToDate(filters.customRange.endDate || filters.customRange.startDate, s);
        return { start: s, end: e, preset: 'custom' };
      }
      case 'all': {
        const s = new Date(anchorY - 1, anchorM, 1);
        const e = new Date(anchorY, anchorM, anchorD);
        return { start: s, end: e, preset: 'all' };
      }
      default: {
        const d = new Date(anchorY, anchorM, anchorD);
        return { start: d, end: d, preset: 'today' };
      }
    }
  };

  const currentInit = resolveCurrentDates();
  const [tempStart, setTempStart] = useState<Date>(currentInit.start);
  const [tempEnd, setTempEnd] = useState<Date>(currentInit.end);
  const [activePreset, setActivePreset] = useState<string>(filters.timePreset);
  const [isPickingRange, setIsPickingRange] = useState(false);

  // Month navigation: viewMonth represents the left calendar (0-11)
  const [viewYear, setViewYear] = useState(currentInit.start.getFullYear());
  const [viewMonth, setViewMonth] = useState(currentInit.start.getMonth());

  // Re-sync when modal opens or filters change
  useEffect(() => {
    if (isOpen) {
      const dates = resolveCurrentDates();
      setTempStart(dates.start);
      setTempEnd(dates.end);
      setActivePreset(dates.preset);
      setIsPickingRange(false);
      setViewYear(dates.start.getFullYear());
      setViewMonth(dates.start.getMonth());
    }
  }, [isOpen, filters.timePreset, filters.customRange]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Navigation handlers
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  // Preset click handler
  const handlePresetSelect = (presetKey: string) => {
    setActivePreset(presetKey);
    setIsPickingRange(false);
    const anchorY = baseAnchor.getFullYear();
    const anchorM = baseAnchor.getMonth();
    const anchorD = baseAnchor.getDate();

    let s = new Date(anchorY, anchorM, anchorD);
    let e = new Date(anchorY, anchorM, anchorD);

    if (presetKey === 'today') {
      s = new Date(anchorY, anchorM, anchorD);
      e = new Date(anchorY, anchorM, anchorD);
    } else if (presetKey === 'yesterday') {
      s = new Date(anchorY, anchorM, anchorD - 1);
      e = new Date(anchorY, anchorM, anchorD - 1);
    } else if (presetKey === 'this_week') {
      const dayOfWeek = baseAnchor.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      s = new Date(anchorY, anchorM, anchorD + mondayOffset);
      e = new Date(s);
      e.setDate(s.getDate() + 6);
    } else if (presetKey === 'last_week') {
      const dayOfWeek = baseAnchor.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const thisMon = new Date(anchorY, anchorM, anchorD + mondayOffset);
      s = new Date(thisMon);
      s.setDate(thisMon.getDate() - 7);
      e = new Date(s);
      e.setDate(s.getDate() + 6);
    } else if (presetKey === 'this_month') {
      s = new Date(anchorY, anchorM, 1);
      e = new Date(anchorY, anchorM + 1, 0);
    } else if (presetKey === 'last_month') {
      s = new Date(anchorY, anchorM - 1, 1);
      e = new Date(anchorY, anchorM, 0);
    } else if (presetKey === '3_days_next') {
      s = new Date(anchorY, anchorM, anchorD);
      e = new Date(anchorY, anchorM, anchorD + 2);
    } else if (presetKey === '7_days_next') {
      s = new Date(anchorY, anchorM, anchorD);
      e = new Date(anchorY, anchorM, anchorD + 6);
    } else if (presetKey === '3_days_past') {
      s = new Date(anchorY, anchorM, anchorD - 2);
      e = new Date(anchorY, anchorM, anchorD);
    } else if (presetKey === '7_days_past') {
      s = new Date(anchorY, anchorM, anchorD - 6);
      e = new Date(anchorY, anchorM, anchorD);
    } else if (presetKey === 'all') {
      s = new Date(anchorY - 1, anchorM, 1);
      e = new Date(anchorY, anchorM, anchorD);
    }

    setTempStart(s);
    setTempEnd(e);
    setViewYear(s.getFullYear());
    setViewMonth(s.getMonth());
  };

  // Date selection click handler on calendar cell
  const handleDateClick = (dateObj: Date) => {
    setActivePreset('custom');

    if (!isPickingRange) {
      // First click: sets start date and prepares for end date
      setTempStart(dateObj);
      setTempEnd(dateObj);
      setIsPickingRange(true);
    } else {
      // Second click: finalize range
      if (dateObj.getTime() < tempStart.getTime()) {
        setTempEnd(tempStart);
        setTempStart(dateObj);
      } else {
        setTempEnd(dateObj);
      }
      setIsPickingRange(false);
    }
  };

  // Check if a date is within selected range
  const isSelectedDate = (dateObj: Date) => {
    const time = dateObj.getTime();
    const startTime = new Date(tempStart.getFullYear(), tempStart.getMonth(), tempStart.getDate()).getTime();
    const endTime = new Date(tempEnd.getFullYear(), tempEnd.getMonth(), tempEnd.getDate()).getTime();

    const isStart = time === startTime;
    const isEnd = time === endTime;
    const isInRange = time > startTime && time < endTime;

    return { isStart, isEnd, isInRange };
  };

  // Generate calendar days for a specific year and month (0-11)
  const generateMonthDays = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay(); // 0 = CN, 1 = T2 ... 6 = T7
    const daysInMonth = lastDay.getDate();

    const days: (Date | null)[] = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(new Date(year, month, d));
    }
    return days;
  };

  // Month 1 (Left)
  const leftDays = generateMonthDays(viewYear, viewMonth);
  // Month 2 (Right)
  const rightMonthIndex = viewMonth === 11 ? 0 : viewMonth + 1;
  const rightYear = viewMonth === 11 ? viewYear + 1 : viewYear;
  const rightDays = generateMonthDays(rightYear, rightMonthIndex);

  // Apply changes
  const handleApply = () => {
    const startIso = formatToIso(tempStart);
    const endIso = formatToIso(tempEnd);

    if (activePreset === 'all') {
      onFilterChange({
        ...filters,
        timePreset: 'all',
        date: 'ALL',
        customRange: { startDate: '', endDate: '' },
      });
    } else if (
      activePreset === 'today' ||
      activePreset === 'yesterday' ||
      activePreset === 'this_week' ||
      activePreset === 'last_week' ||
      activePreset === 'this_month' ||
      activePreset === 'last_month'
    ) {
      onFilterChange({
        ...filters,
        timePreset: activePreset as TimePreset,
        date: 'ALL',
        customRange: { startDate: startIso, endDate: endIso },
      });
    } else {
      // Custom range
      onFilterChange({
        ...filters,
        timePreset: 'custom',
        date: 'ALL',
        customRange: { startDate: startIso, endDate: endIso },
      });
    }

    setIsOpen(false);
  };

  // Display label for the trigger input
  const displayRangeText = () => {
    const curStartIso = filters.customRange.startDate || formatToIso(currentInit.start);
    const curEndIso = filters.customRange.endDate || formatToIso(currentInit.end);

    if (filters.timePreset === 'all') {
      return 'Tất cả thời gian';
    }

    const sVn = formatIsoToVnDate(curStartIso);
    const eVn = formatIsoToVnDate(curEndIso);
    return `${sVn} - ${eVn}`;
  };

  return (
    <div className="relative inline-block w-full" ref={containerRef}>
      {/* Trigger Button: Formatted exactly like in the screenshot "18/09/2026 - 18/09/2026 📅" */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm font-semibold text-slate-800 transition-all shadow-2xs hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#9D174D]/20 cursor-pointer"
        title="Bấm để mở bộ lọc mốc thời gian"
      >
        <span className="font-mono text-slate-800 tracking-tight truncate">
          {displayRangeText()}
        </span>
        <CalendarIcon className="w-4 h-4 text-slate-500 shrink-0" />
      </button>

      {/* Dropdown / Popover Dialog exactly matching user's screenshot - left aligned with the trigger input */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 z-50 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden w-[95vw] sm:w-[780px] max-w-[calc(100vw-2rem)] animate-in fade-in zoom-in-95 duration-150">
          <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-200">
            {/* LEFT SIDEBAR: Presets */}
            <div className="w-full md:w-48 bg-white p-3 sm:p-4 shrink-0 space-y-4 select-none">
              {/* Theo ngày */}
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-2">
                  Theo ngày
                </div>
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => handlePresetSelect('today')}
                    className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                      activePreset === 'today'
                        ? 'bg-[#9D174D] text-white shadow-xs'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Hôm nay
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetSelect('yesterday')}
                    className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                      activePreset === 'yesterday'
                        ? 'bg-[#9D174D] text-white shadow-xs'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Hôm qua
                  </button>
                </div>
              </div>

              {/* Tuần / Tháng */}
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-2">
                  Tuần / Tháng
                </div>
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => handlePresetSelect('last_week')}
                    className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                      activePreset === 'last_week'
                        ? 'bg-[#9D174D] text-white shadow-xs'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Tuần trước
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetSelect('this_week')}
                    className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                      activePreset === 'this_week'
                        ? 'bg-[#9D174D] text-white shadow-xs'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Tuần này
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetSelect('last_month')}
                    className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                      activePreset === 'last_month'
                        ? 'bg-[#9D174D] text-white shadow-xs'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Tháng trước
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetSelect('this_month')}
                    className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                      activePreset === 'this_month'
                        ? 'bg-[#9D174D] text-white shadow-xs'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Tháng này
                  </button>
                </div>
              </div>

              {/* Khoảng thời gian */}
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-2">
                  Khoảng thời gian
                </div>
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => handlePresetSelect('3_days_next')}
                    className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                      activePreset === '3_days_next'
                        ? 'bg-[#9D174D] text-white shadow-xs'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    3 ngày tới
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetSelect('7_days_next')}
                    className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                      activePreset === '7_days_next'
                        ? 'bg-[#9D174D] text-white shadow-xs'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    7 ngày tới
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetSelect('7_days_past')}
                    className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                      activePreset === '7_days_past'
                        ? 'bg-[#9D174D] text-white shadow-xs'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    7 ngày qua
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetSelect('all')}
                    className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                      activePreset === 'all'
                        ? 'bg-[#9D174D] text-white shadow-xs'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Tất cả
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT SECTION: Summary Boxes + Dual Calendar */}
            <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between space-y-4">
              {/* TOP SUMMARY BOXES */}
              <div className="flex items-center gap-2.5 sm:gap-3">
                {/* Box 1: Từ ngày */}
                <div className="flex-1 bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="text-[11px] font-medium text-slate-500">Từ ngày</div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5">
                    {formatVnFullDate(tempStart)}
                  </div>
                </div>

                {/* Arrow */}
                <div className="text-slate-400 font-bold px-1">
                  <ArrowRight className="w-4 h-4" />
                </div>

                {/* Box 2: Đến ngày */}
                <div className="flex-1 bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="text-[11px] font-medium text-slate-500">Đến ngày</div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5">
                    {formatVnFullDate(tempEnd)}
                  </div>
                </div>
              </div>

              {/* DUAL CALENDAR SECTION */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1 select-none">
                {/* LEFT CALENDAR: Tháng N */}
                <div>
                  <div className="flex items-center justify-between mb-3 px-1">
                    <button
                      type="button"
                      onClick={handlePrevMonth}
                      className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                      title="Tháng trước"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-800">
                      THÁNG {viewMonth + 1} {viewYear}
                    </span>
                    <div className="w-7 h-7 opacity-0" /> {/* Spacer */}
                  </div>

                  {/* Weekday headers */}
                  <div className="grid grid-cols-7 text-center mb-1 text-[11px] font-semibold">
                    {VIETNAMESE_WEEKDAYS.map((day, idx) => (
                      <span key={day} className={idx === 0 ? 'text-rose-600 font-bold' : 'text-slate-500'}>
                        {day}
                      </span>
                    ))}
                  </div>

                  {/* Days grid */}
                  <div className="grid grid-cols-7 gap-1 text-center text-xs">
                    {leftDays.map((dateObj, idx) => {
                      if (!dateObj) {
                        return <div key={`empty-left-${idx}`} className="h-8 w-8" />;
                      }
                      const { isStart, isEnd, isInRange } = isSelectedDate(dateObj);
                      const isSingleSelected = isStart && isEnd;

                      return (
                        <button
                          key={dateObj.toISOString()}
                          type="button"
                          onClick={() => handleDateClick(dateObj)}
                          className={`h-8 w-8 mx-auto flex items-center justify-center text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                            isSingleSelected
                              ? 'border-2 border-blue-500 text-blue-800 font-bold bg-blue-50/70 shadow-2xs'
                              : isStart || isEnd
                              ? 'bg-[#9D174D] text-white font-bold shadow-xs'
                              : isInRange
                              ? 'bg-rose-50 text-rose-900 font-semibold'
                              : 'text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {dateObj.getDate()}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* RIGHT CALENDAR: Tháng N + 1 */}
                <div>
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="w-7 h-7 opacity-0" /> {/* Spacer */}
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-800">
                      THÁNG {rightMonthIndex + 1} {rightYear}
                    </span>
                    <button
                      type="button"
                      onClick={handleNextMonth}
                      className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                      title="Tháng sau"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Weekday headers */}
                  <div className="grid grid-cols-7 text-center mb-1 text-[11px] font-semibold">
                    {VIETNAMESE_WEEKDAYS.map((day, idx) => (
                      <span key={day} className={idx === 0 ? 'text-rose-600 font-bold' : 'text-slate-500'}>
                        {day}
                      </span>
                    ))}
                  </div>

                  {/* Days grid */}
                  <div className="grid grid-cols-7 gap-1 text-center text-xs">
                    {rightDays.map((dateObj, idx) => {
                      if (!dateObj) {
                        return <div key={`empty-right-${idx}`} className="h-8 w-8" />;
                      }
                      const { isStart, isEnd, isInRange } = isSelectedDate(dateObj);
                      const isSingleSelected = isStart && isEnd;

                      return (
                        <button
                          key={dateObj.toISOString()}
                          type="button"
                          onClick={() => handleDateClick(dateObj)}
                          className={`h-8 w-8 mx-auto flex items-center justify-center text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                            isSingleSelected
                              ? 'border-2 border-blue-500 text-blue-800 font-bold bg-blue-50/70 shadow-2xs'
                              : isStart || isEnd
                              ? 'bg-[#9D174D] text-white font-bold shadow-xs'
                              : isInRange
                              ? 'bg-rose-50 text-rose-900 font-semibold'
                              : 'text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {dateObj.getDate()}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* FOOTER ACTION BUTTONS */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-colors cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#9D174D] hover:bg-[#831843] active:scale-95 rounded-xl shadow-sm shadow-[#9D174D]/25 transition-all cursor-pointer"
                >
                  Áp dụng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
