import React, { useState } from 'react';
import { Link2, Sparkles, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { parseAccessCsv } from '../utils/csvParser';

interface QuickSyncBarProps {
  onApplyData: (csvContent: string, fileName?: string) => void;
  currentCount: number;
}

export const QuickSyncBar: React.FC<QuickSyncBarProps> = ({ onApplyData, currentCount }) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const convertUrl = (raw: string) => {
    let clean = raw.trim();
    const sheetMatch = clean.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (sheetMatch && sheetMatch[1]) {
      const sheetId = sheetMatch[1];
      const gidMatch = clean.match(/[#&?]gid=([0-9]+)/);
      const gid = gidMatch ? gidMatch[1] : '0';
      return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`;
    }
    return clean;
  };

  const handleSync = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    const input = url.trim();
    if (!input) {
      setStatus({ type: 'error', message: 'Vui lòng dán link Google Sheets của bạn vào ô này.' });
      return;
    }

    setLoading(true);
    const targetUrl = convertUrl(input);

    try {
      let text = '';
      let success = false;

      // 1. Direct fetch
      try {
        const res = await fetch(targetUrl);
        if (res.ok) {
          const t = await res.text();
          if (t && !t.trim().startsWith('<!DOCTYPE') && !t.trim().startsWith('<html')) {
            text = t;
            success = true;
          }
        }
      } catch {
        // Fall back to proxy
      }

      // 2. Proxy fetch
      if (!success) {
        const proxyUrl = `/api/fetch-sheet?url=${encodeURIComponent(targetUrl)}`;
        const res = await fetch(proxyUrl);
        if (res.ok) {
          const t = await res.text();
          if (t && !t.trim().startsWith('<!DOCTYPE') && !t.trim().startsWith('<html')) {
            text = t;
            success = true;
          }
        }
      }

      // 3. Alternative export format
      if (!success && input.includes('docs.google.com/spreadsheets')) {
        const sheetMatch = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        const gidMatch = input.match(/[#&?]gid=([0-9]+)/);
        const sheetId = sheetMatch ? sheetMatch[1] : '';
        const gid = gidMatch ? gidMatch[1] : '0';
        if (sheetId) {
          const altUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
          const resAlt = await fetch(`/api/fetch-sheet?url=${encodeURIComponent(altUrl)}`);
          if (resAlt.ok) {
            const t = await resAlt.text();
            if (t && !t.trim().startsWith('<!DOCTYPE') && !t.trim().startsWith('<html')) {
              text = t;
              success = true;
            }
          }
        }
      }

      if (!success || !text || text.length < 20) {
        throw new Error('Không thể tải dữ liệu tự động. Hãy đảm bảo Google Sheets đã bật chia sẻ "Bất kỳ ai có liên kết", hoặc tải file .csv về và bấm "Nạp CSV" ở trên.');
      }

      const records = parseAccessCsv(text);
      if (records.length === 0) {
        throw new Error('Dữ liệu không khớp cấu trúc cột của WMS_LogHistory.');
      }

      onApplyData(text, `WMS_LogHistory (${records.length} dòng)`);
      setStatus({
        type: 'success',
        message: `Đã nạp thành công toàn bộ ${records.length.toLocaleString()} bản ghi mới từ Google Sheets!`,
      });
      setUrl('');
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message || 'Lỗi khi đồng bộ dữ liệu.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-slate-50 border border-blue-200/80 rounded-xl p-3.5 shadow-xs">
      <form onSubmit={handleSync} className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
        <div className="flex items-center gap-2 text-blue-900 font-semibold text-xs shrink-0">
          <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Link2 className="w-3.5 h-3.5" />
          </div>
          <span>Đồng bộ Link Google Sheets:</span>
        </div>

        <div className="relative flex-1">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Dán link Google Sheets WMS_LogHistory (https://docs.google.com/spreadsheets/d/...)"
            className="w-full text-xs py-2 px-3 bg-white border border-blue-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-2xs"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition-colors cursor-pointer shadow-xs shrink-0"
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Đang đồng bộ...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Cập nhật đủ 1,112 dòng</span>
            </>
          )}
        </button>
      </form>

      {status && (
        <div
          className={`mt-2 flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg ${
            status.type === 'success'
              ? 'bg-emerald-100/70 text-emerald-800 border border-emerald-200'
              : 'bg-rose-100/70 text-rose-800 border border-rose-200'
          }`}
        >
          {status.type === 'success' ? (
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          )}
          <span className="flex-1 font-medium">{status.message}</span>
        </div>
      )}
    </div>
  );
};
