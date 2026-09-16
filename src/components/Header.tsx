import { useRef, type ChangeEvent } from 'react';
import { Activity, Download, Upload, RefreshCw, FileSpreadsheet, ShieldCheck, Link2 } from 'lucide-react';
import { exportToCsv } from '../utils/csvParser';
import { AccessRecord } from '../types';

interface HeaderProps {
  recordsCount: number;
  filteredCount: number;
  isFiltered: boolean;
  onFileUpload: (csvText: string, fileName: string) => void;
  onResetData: () => void;
  onOpenLinkModal: () => void;
  filteredRecords: AccessRecord[];
  activeFileName: string;
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
}: HeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    // Reset input value so same file can be re-uploaded if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Title & Status */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/30">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Thống Kê Tần Suất Truy Cập
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                Live Data
              </span>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
              <span>Nguồn: <strong className="font-medium text-slate-700">{activeFileName}</strong></span>
              <span>•</span>
              <span>Đang hiển thị: <strong className="font-semibold text-blue-600">{filteredCount.toLocaleString()}</strong> / {recordsCount.toLocaleString()} lượt</span>
              {isFiltered && (
                <span className="text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded text-[11px] font-medium border border-amber-200">
                  Đang lọc
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onOpenLinkModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer border border-blue-200 shadow-xs"
            title="Nhập dữ liệu mới từ link Google Sheets hoặc link CSV trực tuyến"
          >
            <Link2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Cập nhật từ Link</span>
          </button>

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
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 rounded-lg transition-colors cursor-pointer border border-slate-200"
            title="Nhập dữ liệu CSV mới từ máy tính"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Nạp CSV</span>
          </button>

          <button
            type="button"
            onClick={onResetData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border border-transparent"
            title="Khôi phục lại dữ liệu mẫu gốc"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Dữ liệu gốc</span>
          </button>

          <button
            type="button"
            onClick={() => exportToCsv(filteredRecords, `thong_ke_truy_cap_${new Date().toISOString().slice(0, 10)}.csv`)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
            title="Xuất dữ liệu đang lọc ra file CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất CSV</span>
          </button>
        </div>
      </div>
    </header>
  );
}
