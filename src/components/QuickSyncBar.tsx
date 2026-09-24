import React, { useState } from 'react';
import {
  ExternalLink,
  RefreshCw,
  Loader2,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  Pencil,
  Clock,
  Sparkles,
  CalendarClock,
} from 'lucide-react';
import { fetchLatestDataFromUrl, DEFAULT_DATA_SOURCE_URL } from '../utils/syncService';
import { AutoSyncScheduleConfig } from '../types';

interface QuickSyncBarProps {
  dataSourceUrl: string;
  onDataSourceUrlChange: (newUrl: string) => void;
  onApplyData: (csvContent: string, fileName?: string) => void;
  lastSyncTime?: string;
  currentCount: number;
  onOpenDataSourceModal: () => void;
  onOpenScheduleModal?: () => void;
  scheduleConfig?: AutoSyncScheduleConfig;
}

export const QuickSyncBar: React.FC<QuickSyncBarProps> = ({
  dataSourceUrl,
  onDataSourceUrlChange,
  onApplyData,
  lastSyncTime,
  currentCount,
  onOpenDataSourceModal,
  onOpenScheduleModal,
  scheduleConfig,
}) => {
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const effectiveUrl = dataSourceUrl.trim() || DEFAULT_DATA_SOURCE_URL;
  const [inputUrl, setInputUrl] = useState(effectiveUrl);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  React.useEffect(() => {
    if (dataSourceUrl) {
      setInputUrl(dataSourceUrl);
    }
  }, [dataSourceUrl]);

  const handleUpdateData = async (targetUrlOverride?: string) => {
    setStatus(null);
    const targetUrl = (targetUrlOverride || inputUrl || effectiveUrl).trim();

    setLoading(true);
    try {
      const res = await fetchLatestDataFromUrl(targetUrl);
      onDataSourceUrlChange(targetUrl);
      setIsEditingUrl(false);
      onApplyData(res.csvText, `Google Sheets (${res.recordCount} dòng)`);
      setStatus({
        type: 'success',
        message: `Đã tự động cập nhật dữ liệu mới nhất từ link data thành công! (${res.recordCount.toLocaleString()} bản ghi, cập nhật lúc: ${res.syncedTimeFormatted})`,
      });
    } catch (err: any) {
      setIsEditingUrl(true);
      setStatus({
        type: 'error',
        message: err.message || 'Lỗi khi kết nối và cập nhật dữ liệu từ nguồn. Vui lòng dán lại link Google Sheets của bạn.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAndSync = (e: React.FormEvent) => {
    e.preventDefault();
    handleUpdateData(inputUrl);
  };

  return (
    <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-slate-50 border border-blue-200/90 rounded-2xl p-4 shadow-xs">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Left: Link "Nguồn dữ liệu" gắn link */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-slate-600">Nguồn dữ liệu:</span>
              <a
                href={effectiveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900 hover:underline bg-white px-2.5 py-1 rounded-lg border border-blue-200 shadow-2xs group"
                title={`Mở nguồn dữ liệu trực tuyến: ${effectiveUrl}`}
              >
                <span className="truncate max-w-[240px] sm:max-w-xs">Nguồn dữ liệu (Google Sheets)</span>
                <ExternalLink className="w-3.5 h-3.5 text-blue-600 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </a>

              <button
                type="button"
                onClick={() => {
                  setIsEditingUrl(!isEditingUrl);
                  setStatus(null);
                }}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-blue-700 hover:bg-white/80 px-2 py-0.5 rounded transition-colors cursor-pointer"
                title="Thay đổi đường link nguồn dữ liệu"
              >
                <Pencil className="w-3 h-3" />
                <span>{isEditingUrl ? 'Đóng ô nhập' : 'Đổi link'}</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5 flex-wrap">
              <span>Đang lưu trữ: <strong className="font-semibold text-slate-700">{currentCount.toLocaleString()}</strong> bản ghi</span>
              {lastSyncTime && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-slate-500">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>Lần cập nhật cuối: {lastSyncTime}</span>
                  </span>
                </>
              )}
              {onOpenScheduleModal && (
                <>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={onOpenScheduleModal}
                    className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer"
                    title="Xem cài đặt lịch cập nhật tự động 10h sáng hàng ngày"
                  >
                    <CalendarClock className="w-3 h-3 text-emerald-600" />
                    <span>Lịch tự động: {scheduleConfig?.time || '10:00'} hàng ngày</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-0.5"></span>
                  </button>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {onOpenDataSourceModal && (
            <button
              type="button"
              onClick={onOpenDataSourceModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors cursor-pointer shadow-2xs"
              title="Quản lý link nguồn dữ liệu và kiểm tra kết nối chi tiết"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
              <span>Nguồn & Link</span>
            </button>
          )}

          {onOpenScheduleModal && (
            <button
              type="button"
              onClick={onOpenScheduleModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-100/80 hover:bg-emerald-200/80 border border-emerald-300 rounded-xl transition-colors cursor-pointer shadow-2xs"
              title="Đặt lịch cập nhật tự động từ link vào 10h sáng hàng ngày"
            >
              <CalendarClock className="w-3.5 h-3.5 text-emerald-700" />
              <span>Lịch 10h hàng ngày</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping"></span>
            </button>
          )}

          <button
            type="button"
            onClick={() => handleUpdateData()}
            disabled={loading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:bg-blue-400 rounded-xl shadow-sm shadow-blue-500/25 transition-all cursor-pointer"
            title="Bấm vào để tự động cập nhật dữ liệu mới nhất từ link data"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang cập nhật từ link...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>Cập nhật dữ liệu</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Expandable Input for Editing Data Source Link */}
      {isEditingUrl && (
        <form onSubmit={handleSaveAndSync} className="mt-3 pt-3 border-t border-blue-200/60 flex flex-col sm:flex-row items-stretch gap-2 animate-in fade-in duration-200">
          <div className="relative flex-1">
            <input
              type="url"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="Dán link Google Sheets (https://docs.google.com/spreadsheets/d/...)"
              className="w-full text-xs py-2 px-3.5 bg-white border border-blue-300 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-2xs font-mono"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={loading || !inputUrl.trim()}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl transition-colors cursor-pointer shadow-xs shrink-0"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>Lưu & Cập nhật</span>
            </button>

            <button
              type="button"
              onClick={() => setIsEditingUrl(false)}
              className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-white/70 hover:bg-white rounded-xl border border-slate-200 transition-colors cursor-pointer"
            >
              Hủy
            </button>
          </div>
        </form>
      )}

      {/* Sync Status Banner */}
      {status && (
        <div
          className={`mt-3 flex items-start gap-2.5 text-xs p-3 rounded-xl animate-in fade-in ${
            status.type === 'success'
              ? 'bg-emerald-100/80 text-emerald-900 border border-emerald-300/80'
              : 'bg-rose-100/80 text-rose-900 border border-rose-300/80'
          }`}
        >
          {status.type === 'success' ? (
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          )}
          <div className="flex-1 font-medium">{status.message}</div>
          <button
            type="button"
            onClick={() => setStatus(null)}
            className="text-slate-400 hover:text-slate-600 text-[11px] font-semibold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
