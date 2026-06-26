// Text-based Mushaf paging — fully OFFLINE.
//
// The bundled per-surah JSON (public/data/surah/{n}.json) gives us each ayah's
// words but no page numbers. We DO know the page each surah starts on (the
// standard 604-page Madani map in data/mushafPages). So we reconstruct a page's
// content by distributing a surah's words evenly across the pages it spans.
//
// This keeps the surah boundaries exact (Al-Fatiha = p.1, An-Nas = p.604) and
// the text/verse-keys always correct; only the within-surah line breaks are
// approximate (the printed mushaf justifies 15 lines per page). That trade-off
// is intentional — it lets the whole Mushaf work with no internet.

import { SURAH_START_PAGES } from '@/data/mushafPages';

interface LWord { p: number; t: string }
interface LAyah { a: number; t: string; w: LWord[]; r: string }
interface LSurah { chapter: number; verses: LAyah[] }

export const sStart = (s: number) => SURAH_START_PAGES[s - 1] ?? 1;
const sNext = (s: number) => (s >= 114 ? 605 : (SURAH_START_PAGES[s] ?? 605));
const sEnd = (s: number) => { const n = sNext(s); return n > sStart(s) ? n - 1 : sStart(s); };

const cache = new Map<number, LSurah | null>();
async function loadSurah(s: number): Promise<LSurah | null> {
  const hit = cache.get(s);
  if (hit !== undefined) return hit;
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}data/surah/${s}.json`);
    const data = res.ok ? ((await res.json()) as LSurah) : null;
    cache.set(s, data);
    return data;
  } catch {
    cache.set(s, null);
    return null;
  }
}

export type PageToken =
  | { kind: 'surah'; surah: number; bismillah: boolean }
  | { kind: 'word'; text: string; key: string; pos: number } // pos = word position within its ayah (1-based)
  | { kind: 'end'; num: number; key: string };

/** All renderable tokens for one Mushaf page (offline). */
export async function loadPageTokens(page: number): Promise<PageToken[]> {
  const tokens: PageToken[] = [];
  for (let s = 1; s <= 114; s++) {
    if (!(sStart(s) <= page && sEnd(s) >= page)) continue;
    const surah = await loadSurah(s);
    if (!surah) continue;
    const sp = sStart(s);
    const spanPages = Math.max(1, sNext(s) - sp);

    // Flatten the surah's words in order, tagged with their ayah + word position.
    const flat: { t: string; ayah: number; last: boolean; pos: number }[] = [];
    for (const v of surah.verses) {
      const n = v.w.length;
      v.w.forEach((w, i) => flat.push({ t: w.t, ayah: v.a, last: i === n - 1, pos: w.p }));
    }
    const total = flat.length || 1;
    const from = Math.floor(((page - sp) / spanPages) * total);
    const to = Math.floor(((page - sp + 1) / spanPages) * total);
    const slice = flat.slice(from, Math.max(from, to));
    if (!slice.length) continue;

    // Surah header (name + Basmala) only on the page that holds its first word.
    if (from === 0) tokens.push({ kind: 'surah', surah: s, bismillah: s !== 1 && s !== 9 });

    for (const w of slice) {
      const key = `${s}:${w.ayah}`;
      tokens.push({ kind: 'word', text: w.t, key, pos: w.pos });
      if (w.last) tokens.push({ kind: 'end', num: w.ayah, key });
    }
  }
  return tokens;
}

/** Distinct ayah keys present on a page (for the tafsir panel's prev/next). */
export function keysFromTokens(tokens: PageToken[]): string[] {
  const seen: string[] = [];
  for (const tk of tokens) {
    if (tk.kind === 'word' && !seen.includes(tk.key)) seen.push(tk.key);
  }
  return seen;
}
