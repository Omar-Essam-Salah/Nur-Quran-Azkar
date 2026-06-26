// Text-based Mushaf paging — fully OFFLINE, with the EXACT Madani page layout.
//
// `public/data/page-map.json` holds, for each of the 604 pages, the first word
// on that page as [surah, ayah, wordPosition] (generated from the authentic
// quran.com page data). A page therefore runs from its own start word up to the
// next page's start word — so page beginnings/endings and mid-ayah splits match
// the printed Madani mushaf exactly. The word TEXT still comes from the bundled
// per-surah JSON, so the whole thing works with no internet.

interface LWord { p: number; t: string }
interface LAyah { a: number; w: LWord[] }
interface LSurah { chapter: number; verses: LAyah[] }

type Start = [number, number, number]; // [surah, ayah, wordPos]

let pageMap: Start[] | null = null;
async function getPageMap(): Promise<Start[]> {
  if (pageMap) return pageMap;
  const res = await fetch(`${import.meta.env.BASE_URL}data/page-map.json`);
  pageMap = (await res.json()) as Start[];
  return pageMap;
}

const surahCache = new Map<number, LSurah | null>();
async function loadSurah(s: number): Promise<LSurah | null> {
  const hit = surahCache.get(s);
  if (hit !== undefined) return hit;
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}data/surah/${s}.json`);
    const data = res.ok ? ((await res.json()) as LSurah) : null;
    surahCache.set(s, data);
    return data;
  } catch {
    surahCache.set(s, null);
    return null;
  }
}

/** The 0-based page index a surah begins on (for the index list / "go to surah"). */
export async function pageForSurah(s: number): Promise<number> {
  const map = await getPageMap();
  for (let i = 0; i < map.length; i++) {
    const [ms, ma, mp] = map[i];
    if (ms === s && ma === 1 && mp === 1) return i + 1;
    if (ms > s) return Math.max(1, i); // surah starts mid-page → that page
  }
  return 1;
}

export type PageToken =
  | { kind: 'surah'; surah: number; bismillah: boolean }
  | { kind: 'word'; text: string; key: string; pos: number }
  | { kind: 'end'; num: number; key: string };

/** All renderable tokens for one Mushaf page — exact Madani boundaries, offline. */
export async function loadPageTokens(p: number): Promise<PageToken[]> {
  const map = await getPageMap();
  const start = map[p - 1];
  if (!start) return [];
  const end: Start = p < 604 ? map[p] : [115, 1, 1]; // sentinel past An-Nas
  const tokens: PageToken[] = [];

  for (let s = start[0]; s <= end[0] && s <= 114; s++) {
    const surah = await loadSurah(s);
    if (!surah) continue;
    for (const v of surah.verses) {
      const a = v.a;
      const n = v.w.length;
      // Word range of this ayah that falls on page p:
      let fromPos: number;
      if (s < start[0] || (s === start[0] && a < start[1])) continue;       // before the page
      else if (s === start[0] && a === start[1]) fromPos = start[2];        // the page's first ayah
      else fromPos = 1;
      let toPos: number;
      if (s > end[0] || (s === end[0] && a > end[1])) continue;            // past the page
      else if (s === end[0] && a === end[1]) toPos = end[2] - 1;            // up to (not incl.) next page's first word
      else toPos = n;
      if (fromPos > toPos) continue;

      if (a === 1 && fromPos === 1) tokens.push({ kind: 'surah', surah: s, bismillah: s !== 1 && s !== 9 });
      const key = `${s}:${a}`;
      for (const w of v.w) {
        if (w.p >= fromPos && w.p <= toPos) tokens.push({ kind: 'word', text: w.t, key, pos: w.p });
      }
      if (toPos === n) tokens.push({ kind: 'end', num: a, key });
    }
  }
  return tokens;
}

/** Distinct ayah keys present on a page (for recitation + tafsir prev/next). */
export function keysFromTokens(tokens: PageToken[]): string[] {
  const seen: string[] = [];
  for (const tk of tokens) {
    if (tk.kind === 'word' && !seen.includes(tk.key)) seen.push(tk.key);
  }
  return seen;
}
