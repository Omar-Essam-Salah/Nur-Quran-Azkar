// Ḥifẓ (memorization) companion — tracks which surahs the user is memorizing or
// has memorized, and computes progress across the whole Quran. Pure local
// storage (key 'nur-hifz'); no network, no conflicts with anything else.

import { surahList } from '@/data/surahList';

export type HifzStatus = 'memorized' | 'learning';
export type HifzMap = Record<number, { status: HifzStatus; ts: number }>;

const KEY = 'nur-hifz';

export function getHifz(): HifzMap {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; }
}

export function setSurahStatus(surah: number, status: HifzStatus | null): HifzMap {
  const m = getHifz();
  if (status) m[surah] = { status, ts: Date.now() };
  else delete m[surah];
  try { localStorage.setItem(KEY, JSON.stringify(m)); } catch { /* ignore */ }
  return m;
}

const TOTAL_AYAT = surahList.reduce((a, s) => a + s.verses, 0); // 6236

export interface HifzStats { memorizedSurahs: number; learningSurahs: number; memorizedAyat: number; totalAyat: number; percent: number }

export function hifzStats(m: HifzMap = getHifz()): HifzStats {
  let memorizedSurahs = 0, learningSurahs = 0, memorizedAyat = 0;
  for (const s of surahList) {
    const e = m[s.number];
    if (e?.status === 'memorized') { memorizedSurahs++; memorizedAyat += s.verses; }
    else if (e?.status === 'learning') learningSurahs++;
  }
  return { memorizedSurahs, learningSurahs, memorizedAyat, totalAyat: TOTAL_AYAT, percent: Math.round((memorizedAyat / TOTAL_AYAT) * 100) };
}
