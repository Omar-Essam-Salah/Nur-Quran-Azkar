// Offline cache (IndexedDB) for Quran content and per-ayah recitation audio.
//
// Two stores:
//   • content — normalized SurahContent JSON (text + words + segments + translations)
//   • audio   — per-ayah MP3 blobs (so a downloaded surah plays with no internet)

import type { SurahContent } from './quranApi';

const DB_NAME = 'nur-quran';
const DB_VERSION = 1;
const CONTENT = 'content';
const AUDIO = 'audio';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(CONTENT)) db.createObjectStore(CONTENT);
      if (!db.objectStoreNames.contains(AUDIO)) db.createObjectStore(AUDIO);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx<T>(store: string, mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(store, mode);
        const req = run(t.objectStore(store));
        req.onsuccess = () => resolve(req.result as T);
        req.onerror = () => reject(req.error);
      }),
  );
}

// ── Content ────────────────────────────────────────────────────────────────
export function contentKey(chapter: number, reciterId: number, translationIds: number[]): string {
  const ids = [...translationIds].sort((a, b) => a - b).join(',');
  return `${chapter}|${reciterId}|${ids}`;
}

export function getContent(key: string): Promise<SurahContent | undefined> {
  return tx<SurahContent | undefined>(CONTENT, 'readonly', (s) => s.get(key));
}

export function putContent(key: string, value: SurahContent): Promise<unknown> {
  return tx(CONTENT, 'readwrite', (s) => s.put(value, key));
}

// ── Audio ─────────────────────────────────────────────────────────────────
function audioKey(reciterId: number, chapter: number, ayah: number): string {
  return `${reciterId}/${chapter}/${ayah}`;
}
function audioDoneKey(reciterId: number, chapter: number): string {
  return `${reciterId}/${chapter}/__done`;
}

export function getAudioBlob(reciterId: number, chapter: number, ayah: number): Promise<Blob | undefined> {
  return tx<Blob | undefined>(AUDIO, 'readonly', (s) => s.get(audioKey(reciterId, chapter, ayah)));
}

function hasKey(key: string): Promise<boolean> {
  return tx<IDBValidKey | undefined>(AUDIO, 'readonly', (s) => s.getKey(key)).then((k) => k !== undefined);
}

export function isSurahAudioDownloaded(reciterId: number, chapter: number): Promise<boolean> {
  return hasKey(audioDoneKey(reciterId, chapter));
}

export interface DownloadProgress {
  done: number;
  total: number;
}

/** fetch() that gives up after `ms` so a stalled CDN can't hang the download. */
async function fetchWithTimeout(url: string, userSignal: AbortSignal | undefined, ms: number): Promise<Response> {
  const ctrl = new AbortController();
  const onAbort = () => ctrl.abort();
  userSignal?.addEventListener('abort', onAbort);
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { signal: ctrl.signal, mode: 'cors' });
  } finally {
    clearTimeout(timer);
    userSignal?.removeEventListener('abort', onAbort);
  }
}

export interface DownloadResult {
  saved: number;  // ayat now stored (incl. already-cached)
  failed: number; // ayat that couldn't be fetched (CORS / HTTP / network)
  total: number;
}

/**
 * Downloads every ayah's audio for a surah (bounded concurrency, cancellable).
 * Tolerant: a single ayah that fails to fetch (e.g. a CDN without CORS headers,
 * or a transient 404) no longer aborts the whole surah. We only mark the surah
 * fully-downloaded when every ayah was saved; otherwise the caller can retry to
 * fill the gaps. Cancellation still propagates immediately.
 */
export async function downloadSurahAudio(
  reciterId: number,
  chapter: number,
  ayahUrls: { ayah: number; url: string }[],
  onProgress?: (p: DownloadProgress) => void,
  signal?: AbortSignal,
): Promise<DownloadResult> {
  const total = ayahUrls.length;
  const concurrency = Math.min(6, total || 1);
  let cursor = 0;
  let done = 0;
  let saved = 0;
  let failed = 0;

  const worker = async (): Promise<void> => {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (signal?.aborted) throw new DOMException('Download cancelled', 'AbortError');
      const i = cursor++;
      if (i >= total) break;
      const { ayah, url } = ayahUrls[i];
      const key = audioKey(reciterId, chapter, ayah);
      try {
        if (!(await hasKey(key))) {
          const res = await fetchWithTimeout(url, signal, 25000);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const buf = await res.arrayBuffer();
          await tx(AUDIO, 'readwrite', (s) => s.put(new Blob([buf], { type: 'audio/mpeg' }), key));
        }
        saved++;
      } catch {
        // Distinguish a real user-cancel from a per-ayah timeout/CORS/404:
        if (signal?.aborted) throw new DOMException('Download cancelled', 'AbortError');
        failed++; // skip this ayah, keep going
      }
      done++;
      onProgress?.({ done, total });
    }
  };

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  if (saved === total && failed === 0) {
    await tx(AUDIO, 'readwrite', (s) => s.put(new Blob(['1']), audioDoneKey(reciterId, chapter)));
  }
  return { saved, failed, total };
}

export async function deleteSurahAudio(reciterId: number, chapter: number, ayahNumbers: number[]): Promise<void> {
  for (const ayah of ayahNumbers) {
    await tx(AUDIO, 'readwrite', (s) => s.delete(audioKey(reciterId, chapter, ayah)));
  }
  await tx(AUDIO, 'readwrite', (s) => s.delete(audioDoneKey(reciterId, chapter)));
}
