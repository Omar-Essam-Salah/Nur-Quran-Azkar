// Full-text search over the bundled Qur'an — fully OFFLINE. Loads the 114
// per-surah files once (they are precached by the service worker), builds a
// normalized in-memory index, then filters. Arabic search ignores tashkeel and
// hamza/alef/ta-marbuta variants; English search matches the bundled translation.

export interface QuranHit { s: number; a: number; t: string; r: string }
interface Row extends QuranHit { tn: string; rn: string }

const normAr = (s: string): string => (s || '')
  .replace(/[ً-ْٰـ]/g, '') // tashkeel + superscript alef + tatweel
  .replace(/[إأآ]/g, 'ا')
  .replace(/ى/g, 'ي')
  .replace(/ؤ/g, 'و')
  .replace(/ئ/g, 'ي')
  .replace(/ة/g, 'ه');

let rows: Row[] | null = null;
let loading: Promise<Row[]> | null = null;

async function load(): Promise<Row[]> {
  if (rows) return rows;
  if (loading) return loading;
  loading = (async () => {
    const base = import.meta.env.BASE_URL;
    const files = await Promise.all(
      Array.from({ length: 114 }, (_, i) =>
        fetch(`${base}data/surah/${i + 1}.json`).then((r) => r.json()).catch(() => null)),
    );
    const out: Row[] = [];
    files.forEach((d, i) => {
      if (!d?.verses) return;
      for (const v of d.verses) {
        out.push({ s: i + 1, a: v.a, t: v.t, r: v.r || '', tn: normAr(v.t), rn: (v.r || '').toLowerCase() });
      }
    });
    rows = out;
    return out;
  })();
  return loading;
}

/** Warm the index in the background (call when the search UI opens). */
export function preloadQuranIndex(): void { void load(); }

export async function searchQuran(query: string, limit = 60): Promise<QuranHit[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const idx = await load();
  const qn = normAr(q);
  const ql = q.toLowerCase();
  const out: QuranHit[] = [];
  for (const r of idx) {
    if ((qn && r.tn.includes(qn)) || (ql && r.rn.includes(ql))) {
      out.push({ s: r.s, a: r.a, t: r.t, r: r.r });
      if (out.length >= limit) break;
    }
  }
  return out;
}
