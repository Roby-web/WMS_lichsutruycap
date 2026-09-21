import React, { useState } from 'react';
import { ExternalLink, Link2, CheckCircle2, AlertCircle, Loader2, X, HelpCircle, Save, Sparkles, RefreshCw, CalendarClock, Clock } from 'lucide-react';
import { fetchLatestDataFromUrl, DEFAULT_DATA_SOURCE_URL } from '../utils/syncService';
import { AccessRecord, AutoSyncScheduleConfig } from '../types';

interface DataSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUrl: string;
  onSaveAndSync: (newUrl: string, csvText?: string, recordCount?: number) => void;
  onOpenScheduleModal?: () => void;
  scheduleConfig?: AutoSyncScheduleConfig;
}

export const DataSourceModal: React.FC<DataSourceModalProps> = ({
  isOpen,
  onClose,
  currentUrl,
  onSaveAndSync,
  onOpenScheduleModal,
  scheduleConfig,
}) => {
  const effectiveCurrentUrl = currentUrl.trim() || DEFAULT_DATA_SOURCE_URL;
  const [urlInput, setUrlInput] = useState(effectiveCurrentUrl);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewInfo, setPreviewInfo] = useState<{ count: number; firstAccount: string; latestTime: string; csvText: string } | null>(null);

  // Sync state with prop when modal opens
  React.useEffect(() => {
    setUrlInput(currentUrl.trim() || DEFAULT_DATA_SOURCE_URL);
    setErrorMsg(null);
    setPreviewInfo(null);
  }, [isOpen, currentUrl]);

  if (!isOpen) return null;

  const handleTestAndFetch = async () => {
    setErrorMsg(null);
    setPreviewInfo(null);

    const targetUrl = urlInput.trim();
    if (!targetUrl) {
      setErrorMsg('Vui lòng nhập đường link Google Sheets hoặc link CSV');
      return;
    }

    setLoading(true);
    try {
      const res = await fetchLatestDataFromUrl(targetUrl);
      const firstRec = res.records[0];
      setPreviewInfo({
        count: res.recordCount,
        firstAccount: firstRec?.account || 'N/A',
        latestTime: firstRec ? `${firstRec.time} ${firstRec.date}` : 'N/A',
        csvText: res.csvText,
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Không thể kết nối đến đường link này.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveOnly = () => {
    const targetUrl = urlInput.trim();
    onSaveAndSync(targetUrl);
    onClose();
  };

  const handleApplyNewData = () => {
    const targetUrl = urlInput.trim();
    if (previewInfo) {
      onSaveAndSync(targetUrl, previewInfo.csvText, previewInfo.count);
    } else {
      onSaveAndSync(targetUrl);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Cấu Hình Nguồn Dữ Liệu</h3>
              <p className="text-xs text-slate-500">
                Gắn link Google Sheets trực tuyến để tự động cập nhật dữ liệu mới nhất
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-800 mb-1.5 text-xs">
              Đường link Google Sheets hoặc link CSV nguồn:
            </label>
            <div className="space-y-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  setErrorMsg(null);
                  setPreviewInfo(null);
                }}
                placeholder="https://docs.google.com/spreadsheets/d/.../edit#gid=0"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all shadow-2xs font-mono"
              />

              {urlInput.trim() && (
                <div className="flex items-center justify-between pt-1">
                  <a
                    href={urlInput.trim()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold hover:underline text-[11px]"
                  >
                    <span>Mở link nguồn trong tab mới</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <button
                    type="button"
                    onClick={handleTestAndFetch}
                    disabled={loading || !urlInput.trim()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg border border-blue-200 transition-colors cursor-pointer disabled:opacity-50 text-[11px]"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Đang kiểm tra...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3 h-3" />
                        <span>Kiểm tra & Tải thử</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Guide box */}
          <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-100 text-slate-600 text-[11px] leading-relaxed space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-blue-900">
              <HelpCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Lưu ý về quyền truy cập Google Sheets:</span>
            </div>
            <p>
              Trên file Google Sheets, hãy bấm <strong className="text-slate-800">Chia sẻ (Share)</strong> và chọn{' '}
              <strong className="text-blue-700">"Bất kỳ ai có đường liên kết đều có thể xem"</strong>. Hệ thống sẽ tự động chuyển đổi sang định dạng dữ liệu và cập nhật ngay khi bấm nút "Cập nhật dữ liệu".
            </p>
          </div>

          {/* Schedule Banner in DataSourceModal */}
          <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 text-slate-700 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <CalendarClock className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <span>Lịch tự động: {scheduleConfig?.time || '10:00'} sáng hàng ngày</span>
                  <span className={`w-2 h-2 rounded-full ${scheduleConfig?.enabled !== false ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                </div>
                <p className="text-[11px] text-slate-500 truncate">
                  {scheduleConfig?.enabled !== false ? 'Đang bật - Tự động đồng bộ mỗi ngày' : 'Đang tạm dừng'}
                </p>
              </div>
            </div>

            {onOpenScheduleModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenScheduleModal();
                }}
                className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-white border border-emerald-300 hover:bg-emerald-100 rounded-lg shrink-0 transition-colors cursor-pointer shadow-2xs"
              >
                Cài đặt lịch
              </button>
            )}
          </div>

          {/* Error message */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">{errorMsg}</div>
            </div>
          )}

          {/* Success preview card */}
          {previewInfo && (
            <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-2 animate-in fade-in">
              <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Đã kết nối thành công với nguồn dữ liệu!</span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1 text-slate-700 text-[11px]">
                <div className="bg-white p-2 rounded-lg border border-emerald-100 shadow-2xs">
                  <span className="text-slate-400 block text-[10px]">Tổng số bản ghi</span>
                  <strong className="text-emerald-700 text-sm font-bold">{previewInfo.count.toLocaleString()}</strong> dòng
                </div>
                <div className="bg-white p-2 rounded-lg border border-emerald-100 shadow-2xs">
                  <span className="text-slate-400 block text-[10px]">Thời gian mới nhất</span>
                  <strong className="text-slate-800 text-[11px] truncate block font-medium" title={previewInfo.latestTime}>
                    {previewInfo.latestTime}
                  </strong>
                </div>
                <div className="bg-white p-2 rounded-lg border border-emerald-100 shadow-2xs">
                  <span className="text-slate-400 block text-[10px]">Tài khoản đầu</span>
                  <strong className="text-slate-800 text-[11px] truncate block font-mono">
                    @{previewInfo.firstAccount}
                  </strong>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            Đóng
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveOnly}
              disabled={!urlInput.trim()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer disabled:opacity-40"
            >
              <Save className="w-3.5 h-3.5 text-slate-500" />
              <span>Chỉ lưu link</span>
            </button>

            <button
              type="button"
              onClick={previewInfo ? handleApplyNewData : handleTestAndFetch}
              disabled={loading || !urlInput.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang tải...</span>
                </>
              ) : previewInfo ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Áp dụng {previewInfo.count.toLocaleString()} bản ghi mới</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Tải & Cập nhật ngay</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
