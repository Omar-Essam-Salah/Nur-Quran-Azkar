// Backup & restore the user's on-device data so they can move it to a new phone.
// We export the lightweight state (settings, bookmarks, reading progress, tasbih,
// the Soul Ledger, mushaf bookmarks, adhan choice…) as a copy-paste code.
// Downloaded surah audio (large IndexedDB blobs) is NOT included — it simply
// re-downloads on the new device.

const KEYS = [
  'nur-settings', 'nur-bookmarks', 'nur-last-read',
  'nur-tasbih-counts', 'nur-tasbih-active',
  'nur-ledger', 'nur-reminder-ledger',
  'nur-mushaf-bookmarks', 'nur-mushaf-page',
  'nur-adhan-voice', 'nur-adhan-enabled', 'nur-lang',
];

/** Encode all backup-able data into a portable base64 code. */
export function exportData(): string {
  const data: Record<string, string> = {};
  for (const k of KEYS) {
    const v = localStorage.getItem(k);
    if (v != null) data[k] = v;
  }
  const json = JSON.stringify({ v: 1, app: 'nur', at: Date.now(), data });
  return btoa(unescape(encodeURIComponent(json)));
}

/** Restore from a code produced by exportData(). Returns the number of keys restored, or -1 on error. */
export function importData(code: string): number {
  try {
    const json = decodeURIComponent(escape(atob(code.trim())));
    const parsed = JSON.parse(json);
    if (!parsed || parsed.app !== 'nur' || !parsed.data) return -1;
    let n = 0;
    for (const [k, v] of Object.entries(parsed.data)) {
      if (KEYS.includes(k) && typeof v === 'string') { localStorage.setItem(k, v); n++; }
    }
    return n;
  } catch {
    return -1;
  }
}
