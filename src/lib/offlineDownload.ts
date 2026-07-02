// Proactively fetch a URL so the service worker caches it for offline use, with
// optional download progress. Also tracks (in localStorage) what the user has
// chosen to download, purely to show a "downloaded" badge.

const DL_KEY = 'nur-downloaded';

function readSet(): Record<string, 1> {
  try { return JSON.parse(localStorage.getItem(DL_KEY) || '{}'); } catch { return {}; }
}
export function isDownloaded(id: string): boolean { return !!readSet()[id]; }
export function markDownloaded(id: string, on = true): void {
  const s = readSet();
  if (on) s[id] = 1; else delete s[id];
  try { localStorage.setItem(DL_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

/**
 * Download `url` fully so the SW's CacheFirst rule stores it. Reading the body to
 * completion both reports progress and ensures the cache write finishes.
 * Returns true on success.
 */
export async function downloadForOffline(url: string, onProgress?: (received: number, total: number) => void): Promise<boolean> {
  try {
    const res = await fetch(url);
    if (!res.ok) return false;
    if (!res.body) { await res.blob(); return true; }
    const total = Number(res.headers.get('content-length')) || 0;
    const reader = res.body.getReader();
    let received = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value?.byteLength || 0;
      onProgress?.(received, total);
    }
    return true;
  } catch { return false; }
}
