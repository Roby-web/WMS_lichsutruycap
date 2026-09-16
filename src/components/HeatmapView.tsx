import { useState, useMemo } from 'react';
import { AccessRecord } from '../types';
import { Flame, Calendar, Building2, HelpCircle } from 'lucide-react';

interface HeatmapViewProps {
  records: AccessRecord[];
  onSelectCell?: (dateOrDept: string, hour: number) => void;
}

export function HeatmapView({ records, onSelectCell }: HeatmapViewProps) {
  const [matrixType, setMatrixType] = useState<'day_hour' | 'dept_hour'>('day_hour');

  // Compute Day vs Hour or Dept vs Hour matrix
  const { rowLabels, gridData, maxVal } = useMemo(() => {
    let rows: string[] = [];
    if (matrixType === 'day_hour') {
      // Unique dates sorted chronologically
      const dateMap = new Map<string, string>(); // date -> isoDate
      records.forEach((r) => {
        if (r.date && r.date !== 'N/A') {
          dateMap.set(r.date, r.isoDate);
        }
      });
      rows = Array.from(dateMap.entries())
        .sort((a, b) => a[1].localeCompare(b[1]))
        .map((entry) => entry[0]);
    } else {
      // Top 8 departments by total count
      const deptCounts = new Map<string, number>();
      records.forEach((r) => {
        deptCounts.set(r.department, (deptCounts.get(r.department) || 0) + 1);
      });
      rows = Array.from(deptCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map((e) => e[0]);
    }

    // Grid: row x 24 hours
    const grid: { [row: string]: { count: number; users: Set<string> }[] } = {};
    rows.forEach((row) => {
      grid[row] = Array.from({ length: 24 }, () => ({ count: 0, users: new Set() }));
    });

    let highest = 0;

    records.forEach((r) => {
      const rowKey = matrixType === 'day_hour' ? r.date : r.department;
      if (grid[rowKey] && r.hour >= 0 && r.hour < 24) {
        grid[rowKey][r.hour].count++;
        grid[rowKey][r.hour].users.add(r.account);
        if (grid[rowKey][r.hour].count > highest) {
          highest = grid[rowKey][r.hour].count;
        }
      }
    });

    return { rowLabels: rows, gridData: grid, maxVal: Math.max(highest, 1) };
  }, [records, matrixType]);

  // Color intensity calculation
  const getCellColor = (count: number) => {
    if (count === 0) return 'bg-slate-100/70 text-transparent';
    const ratio = count / maxVal;
    if (ratio < 0.1) return 'bg-blue-100 text-blue-800';
    if (ratio < 0.25) return 'bg-blue-200 text-blue-900';
    if (ratio < 0.5) return 'bg-indigo-300 text-indigo-950 font-medium';
    if (ratio < 0.75) return 'bg-indigo-500 text-white font-bold';
    return 'bg-rose-600 text-white font-extrabold shadow-xs';
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Flame className="w-4 h-4 text-rose-500" />
            <span>Ma Trận Nhiệt Tần Suất Truy Cập (Heatmap)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Mật độ truy cập theo từng giờ trong ngày giúp nhận diện các đợt thao tác dồn dập
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-xs font-medium">
            <button
              onClick={() => setMatrixType('day_hour')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                matrixType === 'day_hour' ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Ngày vs Giờ
            </button>
            <button
              onClick={() => setMatrixType('dept_hour')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                matrixType === 'dept_hour' ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Ban vs Giờ
            </button>
          </div>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[760px]">
          {/* Hour labels header */}
          <div className="flex items-center text-[10px] text-slate-400 mb-1 pl-28">
            {hours.map((h) => (
              <div key={h} className="flex-1 text-center font-mono font-medium">
                {h}h
              </div>
            ))}
          </div>

          {/* Rows */}
          <div className="space-y-1.5">
            {rowLabels.map((row) => (
              <div key={row} className="flex items-center gap-1">
                {/* Row label */}
                <div
                  className="w-28 text-xs font-semibold text-slate-700 truncate text-right pr-3"
                  title={row}
                >
                  {row}
                </div>

                {/* 24 hour cells */}
                <div className="flex-1 grid grid-cols-24 gap-1">
                  {gridData[row]?.map((cell, h) => (
                    <div
                      key={h}
                      onClick={() => cell.count > 0 && onSelectCell?.(row, h)}
                      title={`${row} lúc ${h}:00 - ${h + 1}:00: ${cell.count} lượt truy cập (${Array.from(cell.users).join(', ')})`}
                      className={`h-7 rounded flex items-center justify-center text-[10px] transition-transform hover:scale-115 hover:z-10 cursor-pointer ${getCellColor(
                        cell.count
                      )}`}
                    >
                      {cell.count > 0 ? cell.count : ''}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend & Guide */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-3">
        <div className="flex items-center gap-1.5">
          <span>Mật độ tần suất:</span>
          <span className="w-3.5 h-3.5 rounded bg-slate-100 inline-block border border-slate-200" title="0 lượt" />
          <span className="text-[11px] text-slate-400 mr-1">0</span>
          <span className="w-3.5 h-3.5 rounded bg-blue-100 inline-block" title="Thấp" />
          <span className="w-3.5 h-3.5 rounded bg-blue-200 inline-block" />
          <span className="w-3.5 h-3.5 rounded bg-indigo-300 inline-block" />
          <span className="w-3.5 h-3.5 rounded bg-indigo-500 inline-block" />
          <span className="w-3.5 h-3.5 rounded bg-rose-600 inline-block" title="Rất cao" />
          <span className="text-[11px] text-slate-600 font-semibold ml-1">Đỉnh điểm ({maxVal}+ lượt)</span>
        </div>

        <span className="text-slate-400">
          💡 Rê chuột vào ô để xem danh sách tài khoản thao tác trong giờ đó
        </span>
      </div>
    </div>
  );
}
