import { useRef, type ChangeEvent } from 'react';
import {
  Activity,
  Download,
  Upload,
  RefreshCw,
  ShieldCheck,
  ExternalLink,
  Pencil,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  CalendarClock,
} from 'lucide-react';
import { exportToCsv } from '../utils/csvParser';
import { AccessRecord, AutoSyncScheduleConfig } from '../types';
import { DEFAULT_DATA_SOURCE_URL } from '../utils/syncService';

interface HeaderProps {
  recordsCount: number;
  filteredCount: number;
  isFiltered: boolean;
  onFileUpload: (csvText: string, fileName: string) => void;
  onResetData: () => void;
  onOpenLinkModal: () => void;
  filteredRecords: AccessRecord[];
  activeFileName: string;
  dataSourceUrl: string;
  lastSyncTime?: string;
  isUpdating: boolean;
  onUpdateData: () => void;
  onOpenDataSourceModal: () => void;
  onOpenScheduleModal?: () => void;
  scheduleConfig?: AutoSyncScheduleConfig;
}

export function Header({
  recordsCount,
  filteredCount,
  isFiltered,
  onFileUpload,
  onResetData,
  onOpenLinkModal,
  filteredRecords,
  activeFileName,
  dataSourceUrl,
  lastSyncTime,
  isUpdating,
  onUpdateData,
  onOpenDataSourceModal,
  onOpenScheduleModal,
  scheduleConfig,
}: HeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const effectiveUrl = (dataSourceUrl && dataSourceUrl.trim()) || DEFAULT_DATA_SOURCE_URL;

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        onFileUpload(text, file.name);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Title & Status */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/30 shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Thống Kê Tần Suất Truy Cập
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                Live Data
              </span>
            </div>

            <div className="text-xs text-slate-500 flex items-center gap-2 mt-1 flex-wrap">
              {/* Link Nguồn dữ liệu gắn link */}
              <div className="inline-flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="text-slate-500 text-[11px]">Nguồn dữ liệu:</span>
                <a
                  href={effectiveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-bold text-blue-600 hover:text-blue-800 hover:underline text-xs"
                  title={`Mở nguồn dữ liệu: ${effectiveUrl}`}
                >
                  <span>Google Sheets</span>
                  <ExternalLink className="w-3 h-3 text-blue-500" />
                </a>

                <button
                  type="button"
                  onClick={onOpenDataSourceModal}
                  className="p-0.5 text-slate-400 hover:text-blue-600 hover:bg-slate-200/60 rounded transition-colors cursor-pointer ml-0.5"
                  title="Chỉnh sửa link nguồn dữ liệu"
                >
                  <Pencil className="w-2.5 h-2.5" />
                </button>
              </div>

              <span>•</span>
              <span>
                Đang hiển thị: <strong className="font-semibold text-blue-600">{filteredCount.toLocaleString()}</strong> / {recordsCount.toLocaleString()} lượt
              </span>

              {lastSyncTime && (
                <>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1 text-slate-500 text-[11px]" title="Thời điểm cập nhật dữ liệu mới nhất">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>Cập nhật: {lastSyncTime}</span>
                  </span>
                </>
              )}

              {/* Lịch tự động 10h sáng hàng ngày indicator */}
              <span>•</span>
              <button
                type="button"
                onClick={onOpenScheduleModal}
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer group"
                title="Cấu hình lịch tự động cập nhật dữ liệu vào 10:00 sáng hàng ngày"
              >
                <span className="relative flex h-2 w-2">
                  <span className={`absolute inline-flex h-full w-full rounded-full ${scheduleConfig?.enabled !== false ? 'bg-emerald-400 animate-ping opacity-75' : 'bg-slate-300'}`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${scheduleConfig?.enabled !== false ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                </span>
                <CalendarClock className="w-3 h-3 text-emerald-600" />
                <span>Lịch tự động: {scheduleConfig?.time || '10:00'} hàng ngày</span>
              </button>

              {isFiltered && (
                <span className="text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded text-[11px] font-medium border border-amber-200">
                  Đang lọc
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Button "Cập nhật dữ liệu" (bấm vào update luôn dữ liệu mới nhất ở link đã lưu) */}
          <button
            type="button"
            onClick={onUpdateData}
            disabled={isUpdating}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:bg-blue-400 rounded-lg shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
            title="Bấm vào để tự động cập nhật dữ liệu mới nhất từ link data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
            <span>{isUpdating ? 'Đang cập nhật từ link...' : 'Cập nhật dữ liệu'}</span>
          </button>

          {/* Button Đặt lịch tự động 10h sáng */}
          <button
            type="button"
            onClick={onOpenScheduleModal}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer border border-emerald-200 shadow-2xs group"
            title="Xem và chỉnh sửa lịch cập nhật dữ liệu tự động lúc 10h sáng hàng ngày"
          >
            <CalendarClock className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />
            <span>Lịch tự động 10h</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          </button>

          {/* Link "Nguồn dữ liệu" gắn link */}
          <a
            href={effectiveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer border border-blue-200 shadow-2xs group"
            title={`Mở nguồn dữ liệu: ${effectiveUrl}`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Nguồn dữ liệu</span>
            <ExternalLink className="w-3.5 h-3.5 text-blue-600 group-hover:translate-x-0.5 transition-transform" />
          </a>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv,.txt"
            className="hidden"
            id="csv-file-input"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 rounded-lg transition-colors cursor-pointer border border-slate-200"
            title="Nhập dữ liệu CSV mới từ máy tính"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Nạp CSV</span>
          </button>

          <button
            type="button"
            onClick={onResetData}
            className="inline-flex items-center gap-1.5 px-2.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border border-transparent"
            title="Khôi phục lại dữ liệu mẫu gốc"
          >
            <span>Dữ liệu gốc</span>
          </button>

          <button
            type="button"
            onClick={() => exportToCsv(filteredRecords, `thong_ke_truy_cap_${new Date().toISOString().slice(0, 10)}.csv`)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
            title="Xuất dữ liệu đang lọc ra file CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Xuất CSV</span>
          </button>
        </div>
      </div>
    </header>
  );
}
