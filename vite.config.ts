import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'sheet-proxy',
        configureServer(server) {
          server.middlewares.use('/api/fetch-sheet', async (req, res) => {
            try {
              const urlObj = new URL(req.url || '', 'http://localhost:3000');
              const targetUrl = urlObj.searchParams.get('url');
              if (!targetUrl) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Missing url parameter' }));
                return;
              }

              // Determine URLs to try (especially for Google Sheets)
              const urlsToTry: string[] = [targetUrl];
              const sheetMatch = targetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
              if (sheetMatch && sheetMatch[1]) {
                const sheetId = sheetMatch[1];
                const gidMatch = targetUrl.match(/[#&?]gid=([0-9]+)/);
                const gid = gidMatch ? gidMatch[1] : '0';
                const gvizUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`;
                const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
                if (!urlsToTry.includes(gvizUrl)) urlsToTry.unshift(gvizUrl);
                if (!urlsToTry.includes(exportUrl)) urlsToTry.push(exportUrl);
              }

              let foundCsv: string | null = null;
              let lastStatus = 500;
              let lastError = 'Không thể lấy dữ liệu';

              for (const testUrl of urlsToTry) {
                try {
                  const response = await fetch(testUrl, {
                    headers: {
                      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                      Accept: 'text/csv, text/plain, */*',
                    },
                    redirect: 'follow',
                  });

                  if (response.ok) {
                    const text = await response.text();
                    const trimmed = text.trim();
                    // Check if it's HTML login or error page
                    if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html') || text.includes('accounts.google.com')) {
                      lastStatus = 403;
                      lastError = 'Trang tính Google Sheets đang bị khóa quyền truy cập riêng tư. Vui lòng mở quyền Chia sẻ > "Bất kỳ ai có đường liên kết đều có thể xem" (Viewer).';
                      continue;
                    }
                    if (text.length > 20 && (text.includes(',') || text.includes('\t'))) {
                      foundCsv = text;
                      break;
                    }
                  } else {
                    lastStatus = response.status;
                    lastError = `Google phản hồi mã lỗi ${response.status}: ${response.statusText}`;
                  }
                } catch (fetchErr: any) {
                  lastError = fetchErr.message;
                }
              }

              if (foundCsv) {
                res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                res.end(foundCsv);
              } else {
                res.statusCode = lastStatus;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: lastError }));
              }
            } catch (e: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: e.message }));
            }
          });
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
