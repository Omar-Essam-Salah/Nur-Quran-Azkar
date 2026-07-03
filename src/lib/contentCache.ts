// Offline cache (IndexedDB) for Quran content and per-ayah recitation audio.
//
// Two stores:
//   • content — normalized SurahContent JSON (text + words + segments + translations)
//   • audio   — per-ayah MP3 blobs (so a downloaded surah plays with no internet)

import type { SurahContent } from './quranApi';

const DB_NAME = 'nur-quran';
const DB_VERSION = 2;
const CONTENT = 'content';
const AUDIO = 'audio';
const TAFSIR = 'tafsir';

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
      if (!db.objectStoreNames.contains(TAFSIR)) db.createObjectStore(TAFSIR);
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
  quotaExceeded?: boolean; // device storage is full
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
  let quotaExceeded = false;

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
      } catch (e) {
        // Distinguish a real user-cancel from a per-ayah timeout/CORS/404:
        if (signal?.aborted) throw new DOMException('Download cancelled', 'AbortError');
        if ((e as Error)?.name === 'QuotaExceededError') quotaExceeded = true;
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
  return { saved, failed, total, quotaExceeded };
}

export async function deleteSurahAudio(reciterId: number, chapter: number, ayahNumbers: number[]): Promise<void> {
  for (const ayah of ayahNumbers) {
    await tx(AUDIO, 'readwrite', (s) => s.delete(audioKey(reciterId, chapter, ayah)));
  }
  await tx(AUDIO, 'readwrite', (s) => s.delete(audioDoneKey(reciterId, chapter)));
}

// ── Storage management ──────────────────────────────────────────────────────
export interface DownloadedSurah { reciterId: number; chapter: number; ayat: number; bytes: number }
export interface AudioStats { bytes: number; surahs: DownloadedSurah[] }

/** Total bytes used by downloaded audio + a per-surah breakdown (one cursor pass). */
export async function audioStorageStats(): Promise<AudioStats> {
  const db = await openDB();
  return new Promise<AudioStats>((resolve, reject) => {
    const store = db.transaction(AUDIO, 'readonly').objectStore(AUDIO);
    const req = store.openCursor();
    let bytes = 0;
    const map = new Map<string, DownloadedSurah>();
    req.onsuccess = () => {
      const cur = req.result;
      if (!cur) { resolve({ bytes, surahs: [...map.values()].sort((a, b) => a.reciterId - b.reciterId || a.chapter - b.chapter) }); return; }
      const size = cur.value instanceof Blob ? cur.value.size : 0;
      bytes += size;
      const m = String(cur.key).match(/^(\d+)\/(\d+)\/(\d+)$/); // reciter/chapter/ayah (skip __done)
      if (m) {
        const k = `${m[1]}/${m[2]}`;
        const e = map.get(k) || { reciterId: +m[1], chapter: +m[2], ayat: 0, bytes: 0 };
        e.ayat++; e.bytes += size; map.set(k, e);
      }
      cur.continue();
    };
    req.onerror = () => reject(req.error);
  });
}

/** Delete every ayah (and the done-marker) for one downloaded surah. */
export async function deleteSurahAudioAll(reciterId: number, chapter: number): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const t = db.transaction(AUDIO, 'readwrite');
    const store = t.objectStore(AUDIO);
    const prefix = `${reciterId}/${chapter}/`;
    const req = store.openCursor();
    req.onsuccess = () => { const c = req.result; if (!c) return; if (String(c.key).startsWith(prefix)) c.delete(); c.continue(); };
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
  });
}

export async function deleteAllAudio(): Promise<void> {
  await tx(AUDIO, 'readwrite', (s) => s.clear());
}

// ── Tafsir offline packs ────────────────────────────────────────────────────
// Store the WHOLE tafsir for a resource so it's 100% offline without opening
// each ayah first. Keys: `${tafsirId}/${verseKey}` → html text; `${id}/__done`.
const tafsirKey = (id: number, verseKey: string) => `${id}/${verseKey}`;
const tafsirDoneKey = (id: number) => `${id}/__done`;

export function getTafsirText(id: number, verseKey: string): Promise<string | undefined> {
  return tx<string | undefined>(TAFSIR, 'readonly', (s) => s.get(tafsirKey(id, verseKey)));
}
export function isTafsirPackDownloaded(id: number): Promise<boolean> {
  return tx<IDBValidKey | undefined>(TAFSIR, 'readonly', (s) => s.getKey(tafsirDoneKey(id))).then((k) => k !== undefined);
}

/** Download the entire tafsir (all 114 chapters) into IndexedDB, with progress. */
export async function downloadTafsirPack(
  id: number,
  onProgress?: (p: DownloadProgress) => void,
  signal?: AbortSignal,
): Promise<{ ok: boolean; verses: number }> {
  let verses = 0;
  for (let ch = 1; ch <= 114; ch++) {
    if (signal?.aborted) throw new DOMException('cancelled', 'AbortError');
    const res = await fetchWithTimeout(`https://api.quran.com/api/v4/tafsirs/${id}/by_chapter/${ch}`, signal, 25000);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as { tafsirs?: { verse_key: string; text: string | null }[] };
    const entries = data.tafsirs ?? [];
    for (const e of entries) {
      if (e.verse_key && typeof e.text === 'string') { await tx(TAFSIR, 'readwrite', (s) => s.put(e.text as string, tafsirKey(id, e.verse_key))); verses++; }
    }
    onProgress?.({ done: ch, total: 114 });
  }
  await tx(TAFSIR, 'readwrite', (s) => s.put('1', tafsirDoneKey(id)));
  return { ok: true, verses };
}

export async function deleteTafsirPack(id: number): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const t = db.transaction(TAFSIR, 'readwrite');
    const store = t.objectStore(TAFSIR);
    const prefix = `${id}/`;
    const req = store.openCursor();
    req.onsuccess = () => { const c = req.result; if (!c) return; if (String(c.key).startsWith(prefix)) c.delete(); c.continue(); };
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
  });
}

/** IDs of tafsirs whose full pack is downloaded. */
export async function downloadedTafsirPacks(): Promise<number[]> {
  const db = await openDB();
  return new Promise<number[]>((resolve, reject) => {
    const req = db.transaction(TAFSIR, 'readonly').objectStore(TAFSIR).openKeyCursor();
    const ids: number[] = [];
    req.onsuccess = () => {
      const c = req.result;
      if (!c) { resolve(ids); return; }
      const m = String(c.key).match(/^(\d+)\/__done$/);
      if (m) ids.push(+m[1]);
      c.continue();
    };
    req.onerror = () => reject(req.error);
  });
}
