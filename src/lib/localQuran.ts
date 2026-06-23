// Local-first Quran text loader. Reads the bundled per-surah JSON
// (public/data/surah/{n}.json) so the reader shows Arabic text + the bundled
// translation with NO network. Audio, word-timing segments, tafsir and extra
// translations are layered on top from the API when online (and then cached).

import type { SurahContent, NormVerse } from './quranApi';

export const BUNDLED_TRANSLATION_ID = 131; // Dr. Mustafa Khattab — The Clear Quran

interface LocalAyah {
  a: number;            // ayah number
  t: string;            // text_uthmani
  j: string;            // tajweed html
  w: { p: number; t: string }[]; // words (position, text)
  r: string;            // bundled translation
}
interface LocalSurah {
  chapter: number;
  translation: number;
  verses: LocalAyah[];
}

export interface SimpleAyah { ayah: number; text: string; translation: string }

/** Loads a contiguous ayah range of a surah (offline) for inline passages. */
export async function loadAyahRange(chapter: number, from: number, to: number): Promise<SimpleAyah[]> {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}data/surah/${chapter}.json`);
    if (!res.ok) return [];
    const data = (await res.json()) as LocalSurah;
    return data.verses
      .filter((v) => v.a >= from && v.a <= to)
      .map((v) => ({ ayah: v.a, text: v.t, translation: v.r ?? '' }));
  } catch {
    return [];
  }
}

/** Loads a surah's text + bundled translation from local assets (offline). */
export async function loadLocalSurah(chapter: number): Promise<SurahContent | null> {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}data/surah/${chapter}.json`);
    if (!res.ok) return null;
    const data = (await res.json()) as LocalSurah;
    const verses: NormVerse[] = data.verses.map((v) => ({
      key: `${chapter}:${v.a}`,
      ayah: v.a,
      textUthmani: v.t,
      tajweedHtml: v.j,
      words: v.w.map((w) => ({ position: w.p, text: w.t, charType: 'word' })),
      translations: v.r ? [{ id: data.translation ?? BUNDLED_TRANSLATION_ID, text: v.r }] : [],
      audioUrl: null,
      segments: [],
    }));
    return { chapter, reciterId: 0, translationIds: [data.translation ?? BUNDLED_TRANSLATION_ID], verses };
  } catch {
    return null;
  }
}
