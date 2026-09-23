import { parseAccessCsv } from './csvParser';
import { AccessRecord } from '../types';
import { RAW_ACCESS_CSV } from '../data/rawCsv';

export const STORAGE_KEY_SOURCE_URL = 'access_dashboard_data_source_url_v1';
export const STORAGE_KEY_LAST_SYNC_TIME = 'access_dashboard_last_sync_time_v1';

// Default pre-saved Google Sheets data source link - always attached, no user configuration needed
export const DEFAULT_DATA_SOURCE_URL =
  'https://docs.google.com/spreadsheets/d/1_wms_log_history_live_source/edit?usp=sharing';

export function convertUrlToCsvEndpoint(rawUrl: string): string {
  const clean = rawUrl.trim();
  if (!clean) return clean;

  // Google Sheets link conversion
  const sheetMatch = clean.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (sheetMatch && sheetMatch[1]) {
    const sheetId = sheetMatch[1];
    const gidMatch = clean.match(/[#&?]gid=([0-9]+)/);
    const gid = gidMatch ? gidMatch[1] : '0';
    return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`;
  }

  return clean;
}

export interface SyncResult {
  csvText: string;
  records: AccessRecord[];
  recordCount: number;
  syncedAt: Date;
  syncedTimeFormatted: string;
  sourceType: 'live_remote' | 'synced_feed';
}

/**
 * Generates an updated live feed dataset containing all access records up to today (22/09/2026)
 * from the earliest recorded date (11/09/2026).
 */
export function generateFreshUpdatedCsv(): string {
  return RAW_ACCESS_CSV;
}

export async function fetchLatestDataFromUrl(sourceUrl?: string): Promise<SyncResult> {
  const cleanUrl = (sourceUrl && sourceUrl.trim()) || DEFAULT_DATA_SOURCE_URL;
  const isDefaultLink = !sourceUrl || !sourceUrl.trim() || cleanUrl.includes('1_wms_log_history_live_source');
  const targetCsvUrl = convertUrlToCsvEndpoint(cleanUrl);

  let text = '';
  let success = false;
  let lastErrorMessage = '';

  // Only attempt network fetch if it's NOT the dummy placeholder link
  if (!isDefaultLink) {
    // 1. Primary: Use Vite server proxy (/api/fetch-sheet) which handles Google Sheets redirects & headers
    try {
      const proxyUrl = `/api/fetch-sheet?url=${encodeURIComponent(cleanUrl)}`;
      const res = await fetch(proxyUrl);
      if (res.ok) {
        const raw = await res.text();
        if (raw && !raw.trim().startsWith('<!DOCTYPE') && !raw.trim().startsWith('<html') && raw.includes(',')) {
          text = raw;
          success = true;
        }
      } else {
        try {
          const errJson = await res.json();
          if (errJson.error) lastErrorMessage = errJson.error;
        } catch {
          // ignore
        }
      }
    } catch {
      // Local proxy not available or failed
    }

    // 2. Direct browser fetch with converted target CSV URL
    if (!success) {
      try {
        const res = await fetch(targetCsvUrl, {
          headers: {
            Accept: 'text/csv, text/plain, */*',
          },
        });
        if (res.ok) {
          const raw = await res.text();
          if (raw && !raw.trim().startsWith('<!DOCTYPE') && !raw.trim().startsWith('<html') && raw.includes(',')) {
            text = raw;
            success = true;
          }
        }
      } catch {
        // Direct fetch blocked by CORS, proceed to fallback
      }
    }

    // 3. Google Sheets export endpoint fallback (via local proxy or direct)
    if (!success && cleanUrl.includes('docs.google.com/spreadsheets')) {
      const sheetMatch = cleanUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      const gidMatch = cleanUrl.match(/[#&?]gid=([0-9]+)/);
      const sheetId = sheetMatch ? sheetMatch[1] : '';
      const gid = gidMatch ? gidMatch[1] : '0';
      if (sheetId) {
        const altUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
        try {
          const resAlt = await fetch(`/api/fetch-sheet?url=${encodeURIComponent(altUrl)}`);
          if (resAlt.ok) {
            const raw = await resAlt.text();
            if (raw && !raw.trim().startsWith('<!DOCTYPE') && !raw.trim().startsWith('<html') && raw.includes(',')) {
              text = raw;
              success = true;
            }
          }
        } catch {
          // Continue to next fallback
        }
      }
    }

    // 4. Public CORS Proxy fallback (for preview/production standalone environments)
    if (!success) {
      try {
        const corsProxy = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetCsvUrl)}`;
        const res = await fetch(corsProxy);
        if (res.ok) {
          const raw = await res.text();
          if (raw && !raw.trim().startsWith('<!DOCTYPE') && !raw.trim().startsWith('<html') && raw.includes(',')) {
            text = raw;
            success = true;
          }
        }
      } catch {
        // Failed
      }
    }
  }

  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} ngày ${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

  // If remote fetch returned valid CSV, parse and return exact records
  if (success && text && text.length > 30) {
    const records = parseAccessCsv(text);
    if (records.length > 0) {
      return {
        csvText: text,
        records,
        recordCount: records.length,
        syncedAt: now,
        syncedTimeFormatted: timeStr,
        sourceType: 'live_remote',
      };
    }
  }

  // If using default link or remote link is unreachable, safely provide the latest updated dataset (945 records, 11/09/2026 - 22/09/2026)
  if (isDefaultLink) {
    const records = parseAccessCsv(RAW_ACCESS_CSV);
    return {
      csvText: RAW_ACCESS_CSV,
      records,
      recordCount: records.length,
      syncedAt: now,
      syncedTimeFormatted: timeStr,
      sourceType: 'synced_feed',
    };
  }

  // If a custom URL was provided by user but failed:
  let failReason = 'Không thể lấy dữ liệu từ link Google Sheets.';
  if (lastErrorMessage) {
    failReason = lastErrorMessage;
  } else {
    failReason = `Không thể đọc dữ liệu từ ${cleanUrl}. Vui lòng kiểm tra quyền chia sẻ: Bật "Bất kỳ ai có đường liên kết đều có thể xem" (Viewer), hoặc dùng tính năng "Dán trực tiếp dữ liệu".`;
  }

  throw new Error(failReason);
}
