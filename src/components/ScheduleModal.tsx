import React, { useState, useEffect } from 'react';
import {
  CalendarClock,
  CheckCircle2,
  AlertCircle,
  X,
  Play,
  Loader2,
  Clock,
  Sparkles,
  FileSpreadsheet,
  ExternalLink,
  ShieldCheck,
  BellRing,
} from 'lucide-react';
import { AutoSyncScheduleConfig } from '../types';
import {
  getNextRunInfo,
  saveScheduleConfig,
  DEFAULT_SCHEDULE_CONFIG,
} from '../utils/scheduleService';
import { DEFAULT_DATA_SOURCE_URL } from '../utils/syncService';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AutoSyncScheduleConfig;
  onSaveConfig: (newConfig: AutoSyncScheduleConfig) => void;
  onTriggerNow: () => Promise<void>;
  dataSourceUrl: string;
  isUpdating: boolean;
}

export const ScheduleModal: React.FC<ScheduleModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onTriggerNow,
  dataSourceUrl,
  isUpdating,
}) => {
  const [enabled, setEnabled] = useState(config.enabled);
  const [time, setTime] = useState(config.time || '10:00');
  const [testSuccessMessage, setTestSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setEnabled(config.enabled);
    setTime(config.time || '10:00');
    setTestSuccessMessage(null);
  }, [config, isOpen]);

  if (!isOpen) return null;

  const currentPreviewConfig: AutoSyncScheduleConfig = {
    ...config,
    enabled,
    time,
  };

  const nextRun = getNextRunInfo(currentPreviewConfig);
  const effectiveUrl = (dataSourceUrl && dataSourceUrl.trim()) || DEFAULT_DATA_SOURCE_URL;

  const handleSave = () => {
    const updated: AutoSyncScheduleConfig = {
      ...config,
      enabled,
      time: time || '10:00',
    };
    saveScheduleConfig(updated);
    onSaveConfig(updated);
    onClose();
  };

  const handleRunTest = async () => {
    setTestSuccessMessage(null);
    try {
      await onTriggerNow();
      setTestSuccessMessage('Đã kích hoạt cập nhật dữ liệu tự động thành công!');
    } catch {
      // errors handled by parent toast
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50/80 to-indigo-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <CalendarClock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Lịch Cập Nhật Dữ Liệu Tự Động</h3>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                    enabled
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-slate-100 text-slate-600 border border-slate-300'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      enabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                    }`}
                  />
                  {enabled ? 'Đang hoạt động' : 'Tạm dừng'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Tự động lấy dữ liệu mới nhất từ Google Sheets vào 10:00 sáng hàng ngày
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

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Toggle Switch */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/90 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <BellRing className="w-4 h-4 text-blue-600" />
                <span>Kích hoạt tự động cập nhật hàng ngày</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Hệ thống sẽ tự động đồng bộ số liệu mới nhất mà không cần bấm thủ công
              </p>
            </div>

            <button
              type="button"
              onClick={() => setEnabled(!enabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                enabled ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Time & Frequency */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-800 text-xs">
                Thời gian cập nhật:
              </label>
              <div className="relative">
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  disabled={!enabled}
                  className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50 font-mono shadow-2xs"
                />
              </div>
              <span className="text-[10px] text-slate-500 block">
                Mặc định: 10:00 sáng hàng ngày
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-800 text-xs">
                Chu kỳ lặp lại:
              </label>
              <div className="w-full px-3 py-2 text-xs font-semibold bg-slate-100 border border-slate-200 rounded-xl text-slate-700 flex items-center justify-between">
                <span>Hàng ngày</span>
                <Clock className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <span className="text-[10px] text-slate-500 block">
                Chạy định kỳ mỗi 24 giờ
              </span>
            </div>
          </div>

          {/* Data Source Link info */}
          <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 space-y-1.5">
            <div className="flex items-center justify-between text-blue-900">
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Nguồn dữ liệu sẽ được tự động đồng bộ:</span>
              </div>
              <a
                href={effectiveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-[11px] font-semibold inline-flex items-center gap-1 hover:underline"
              >
                <span>Xem link</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-[11px] text-slate-600 font-mono truncate bg-white/80 px-2.5 py-1.5 rounded-lg border border-blue-200/60" title={effectiveUrl}>
              {effectiveUrl}
            </p>
          </div>

          {/* Next execution info box */}
          {enabled ? (
            <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Kế hoạch thực thi kế tiếp</span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-emerald-200 shadow-2xs">
                  {nextRun.countdownLabel}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-white p-2.5 rounded-lg border border-emerald-100 shadow-2xs">
                  <span className="text-slate-400 block text-[10px]">Thời điểm chạy tiếp theo</span>
                  <strong className="text-slate-900 font-bold text-xs block mt-0.5">
                    {nextRun.formattedTime}
                  </strong>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-emerald-100 shadow-2xs">
                  <span className="text-slate-400 block text-[10px]">Lần chạy tự động gần nhất</span>
                  <strong className="text-slate-800 font-medium block mt-0.5">
                    {config.lastRunTime || 'Chưa chạy hôm nay'}
                  </strong>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>Lịch tự động đang tạm dừng. Bật công tắc phía trên để kích hoạt lại cập nhật lúc 10h sáng hàng ngày.</span>
            </div>
          )}

          {/* Test run banner if triggered */}
          {testSuccessMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{testSuccessMessage}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-2">
          {/* Button test execution */}
          <button
            type="button"
            onClick={handleRunTest}
            disabled={isUpdating}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 hover:text-slate-900 rounded-xl transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
            title="Thực thi quy trình tự động cập nhật ngay lập tức để kiểm tra"
          >
            {isUpdating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                <span>Đang đồng bộ...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-blue-600 fill-blue-600" />
                <span>Chạy thử lịch ngay</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
            >
              Hủy
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Lưu lịch cập nhật</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
