import { useState } from 'react';
import { Link2, FileText, CheckCircle2, AlertCircle, Loader2, X, Globe, Sparkles, HelpCircle } from 'lucide-react';
import { parseAccessCsv } from '../utils/csvParser';
import { AccessRecord } from '../types';

interface ImportLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyData: (csvText: string, sourceName: string) => void;
}

export function ImportLinkModal({ isOpen, onClose, onApplyData }: ImportLinkModalProps) {
  const [activeTab, setActiveTab] = useState<'url' | 'paste'>('url');
  const [urlInput, setUrlInput] = useState('');
  const [pasteText, setPasteText] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewRecords, setPreviewRecords] = useState<AccessRecord[] | null>(null);
  const [fetchedCsv, setFetchedCsv] = useState<string>('');

  if (!isOpen) return null;

  // Format Google Sheets URL to CSV export if applicable
  const convertUrlToCsvEndpoint = (rawUrl: string): string => {
    let clean = rawUrl.trim();
    if (!clean) return clean;

    // Google Sheets regex
    const sheetMatch = clean.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (sheetMatch && sheetMatch[1]) {
      const sheetId = sheetMatch[1];
      // Check for gid
      const gidMatch = clean.match(/[#&?]gid=([0-9]+)/);
      const gid = gidMatch ? gidMatch[1] : '0';
      return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`;
    }

    return clean;
  };

  const handleFetchUrl = async () => {
    setErrorMsg(null);
    setPreviewRecords(null);
    setFetchedCsv('');

    if (!urlInput.trim()) {
      setErrorMsg('Vui lòng nhập đường link Google Sheets hoặc link file CSV');
      return;
    }

    setLoading(true);
    const targetUrl = convertUrlToCsvEndpoint(urlInput);

    try {
      let text = '';
      let fetchSuccess = false;

      // Attempt 1: Direct fetch
      try {
        const res = await fetch(targetUrl, {
          headers: {
            Accept: 'text/csv, text/plain, */*',
          },
        });
        if (res.ok) {
          const rawText = await res.text();
          if (rawText && !rawText.trim().startsWith('<!DOCTYPE') && !rawText.trim().startsWith('<html')) {
            text = rawText;
            fetchSuccess = true;
          }
        }
      } catch (clientErr) {
        console.warn('Direct fetch failed, falling back to proxy:', clientErr);
      }

      // Attempt 2: Proxy fetch if direct fetch failed
      if (!fetchSuccess) {
        const proxyUrl = `/api/fetch-sheet?url=${encodeURIComponent(targetUrl)}`;
        const resProxy = await fetch(proxyUrl);
        if (resProxy.ok) {
          const rawText = await resProxy.text();
          if (rawText && !rawText.trim().startsWith('<!DOCTYPE') && !rawText.trim().startsWith('<html')) {
            text = rawText;
            fetchSuccess = true;
          }
        }
      }

      // Attempt 3: If still failed and it is Google Sheets, try the export endpoint
      if (!fetchSuccess && urlInput.includes('docs.google.com/spreadsheets')) {
        const sheetMatch = urlInput.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        const gidMatch = urlInput.match(/[#&?]gid=([0-9]+)/);
        const sheetId = sheetMatch ? sheetMatch[1] : '';
        const gid = gidMatch ? gidMatch[1] : '0';
        if (sheetId) {
          const altUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
          const resAlt = await fetch(`/api/fetch-sheet?url=${encodeURIComponent(altUrl)}`);
          if (resAlt.ok) {
            const rawText = await resAlt.text();
            if (rawText && !rawText.trim().startsWith('<!DOCTYPE') && !rawText.trim().startsWith('<html')) {
              text = rawText;
              fetchSuccess = true;
            }
          }
        }
      }

      if (!fetchSuccess || !text || text.length < 20) {
        throw new Error('Google Sheet chưa được mở quyền công khai hoặc không thể kết nối. Vui lòng bật chia sẻ "Bất kỳ ai có đường liên kết" trên Google Sheet, hoặc bạn chỉ cần nhấn Ctrl+A, Ctrl+C trên Sheet rồi dán vào tab "Dán Nội Dung CSV".');
      }

      // Test parsing
      const parsed = parseAccessCsv(text);
      if (parsed.length === 0) {
        throw new Error('Không đọc được định dạng CSV lịch sử truy cập. Vui lòng kiểm tra định dạng cột.');
      }

      setFetchedCsv(text);
      setPreviewRecords(parsed);
    } catch (err: any) {
      console.error('Fetch error:', err);
      setErrorMsg(err.message || 'Không thể tải dữ liệu từ liên kết này');
    } finally {
      setLoading(false);
    }
  };

  const handleParsePaste = () => {
    setErrorMsg(null);
    setPreviewRecords(null);
    setFetchedCsv('');

    if (!pasteText.trim()) {
      setErrorMsg('Vui lòng dán nội dung CSV vào khung nhập');
      return;
    }

    const parsed = parseAccessCsv(pasteText);
    if (parsed.length === 0) {
      setErrorMsg('Không tìm thấy bản ghi hợp lệ. Cột cần có: STT, Tài khoản, Chức năng, Thời gian...');
      return;
    }

    setFetchedCsv(pasteText);
    setPreviewRecords(parsed);
  };

  const handleApply = () => {
    if (!fetchedCsv || !previewRecords) return;

    let sourceName = 'Dữ liệu mới tải về';
    if (activeTab === 'url') {
      try {
        const u = new URL(urlInput);
        sourceName = u.hostname + u.pathname.slice(0, 20);
      } catch {
        sourceName = 'Link trực tuyến';
      }
    } else {
      sourceName = `Dán trực tiếp (${previewRecords.length} bản ghi)`;
    }

    onApplyData(fetchedCsv, sourceName);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Cập Nhật Dữ Liệu Từ Link</h3>
              <p className="text-xs text-slate-500">
                Đồng bộ lịch sử truy cập mới nhất từ Google Sheets, URL CSV hoặc văn bản
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-200 bg-slate-50/40 text-xs font-semibold px-5 pt-3">
          <button
            onClick={() => {
              setActiveTab('url');
              setErrorMsg(null);
            }}
            className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'url'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Link Google Sheets / CSV URL</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('paste');
              setErrorMsg(null);
            }}
            className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'paste'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Dán Nội Dung CSV</span>
          </button>
        </div>

        {/* Modal content */}
        <div className="p-5 space-y-4 text-xs">
          {activeTab === 'url' ? (
            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1 text-xs">
                  Nhập đường dẫn Google Sheets hoặc link tải CSV:
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/.../edit hoặc link .csv"
                    className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white"
                  />
                  <button
                    onClick={handleFetchUrl}
                    disabled={loading || !urlInput.trim()}
                    className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Đang tải...</span>
                      </>
                    ) : (
                      <span>Tải Dữ Liệu</span>
                    )}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-slate-600 text-[11px] leading-relaxed">
                <strong className="text-blue-900 block font-semibold mb-1 flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                  Hướng dẫn kết nối Google Sheets:
                </strong>
                Hệ thống tự động hỗ trợ link Google Sheets thông thường. Đảm bảo bạn đã bật quyền:{' '}
                <strong className="text-slate-800">"Bất kỳ ai có liên kết đều có thể xem" (Anyone with the link)</strong>{' '}
                hoặc dùng menu <strong className="text-slate-800">Tệp &gt; Chia sẻ &gt; Xuất bản lên web &gt; định dạng CSV</strong>.
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1 text-xs">
                  Dán nội dung bảng dữ liệu CSV vào đây:
                </label>
                <textarea
                  rows={6}
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder="STT,Tài khoản,Chức năng,Thời gian,Nền tảng,Hệ điều hành,Ban,Vai trò,IP&#10;1,thanhnga,statistics,16:30:51 16/09/2026,WEB,Windows,Pháp luật,Trưởng/Phó ban,172.30.164.133..."
                  className="w-full p-3 font-mono text-[11px] bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white resize-none"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleParsePaste}
                  disabled={!pasteText.trim()}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none rounded-lg transition-colors cursor-pointer"
                >
                  Kiểm Tra & Xem Trước
                </button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Preview Card */}
          {previewRecords && (
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
              <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Đã phát hiện dữ liệu hợp lệ!</span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1 text-slate-700 text-[11px]">
                <div className="bg-white p-2 rounded-lg border border-emerald-100">
                  <span className="text-slate-400 block text-[10px]">Số bản ghi</span>
                  <strong className="text-emerald-700 text-sm">{previewRecords.length}</strong> dòng
                </div>
                <div className="bg-white p-2 rounded-lg border border-emerald-100">
                  <span className="text-slate-400 block text-[10px]">Thời gian mới nhất</span>
                  <strong className="text-slate-800 text-[11px] truncate block" title={previewRecords[0]?.rawTimestamp}>
                    {previewRecords[0]?.time} {previewRecords[0]?.date}
                  </strong>
                </div>
                <div className="bg-white p-2 rounded-lg border border-emerald-100">
                  <span className="text-slate-400 block text-[10px]">Tài khoản đầu</span>
                  <strong className="text-slate-800 text-[11px] truncate block">
                    @{previewRecords[0]?.account}
                  </strong>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/50 rounded-lg transition-colors cursor-pointer"
          >
            Hủy
          </button>

          <button
            onClick={handleApply}
            disabled={!previewRecords}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:pointer-events-none rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Áp Dụng Dữ Liệu Mới ({previewRecords?.length || 0} bản ghi)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
