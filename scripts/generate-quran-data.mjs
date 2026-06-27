// Build-time generator: fetches the full Quran (Arabic word-by-word + tajweed +
// one translation) from api.quran.com ONCE and writes per-surah JSON into
// public/data/surah/. At runtime the app reads these local files — no network.
//
// Run: node scripts/generate-quran-data.mjs

import { writeFileSync, mkdirSync } from 'fs';

const API = 'https://api.quran.com/api/v4';
const TRANSLATION = 20; // Saheeh International
const OUT = 'public/data/surah';

// Strip translation footnote markup. Throws loudly on empty/undefined input —
// sacred + translation text must NEVER silently degrade to an empty string.
const stripTags = (s, where) => {
  if (typeof s !== 'string' || s.length === 0) throw new Error(`stripTags: missing text at ${where}`);
  const out = s.replace(/<sup[^>]*>.*?<\/sup>/gis, '').replace(/<[^>]+>/g, '').trim();
  if (!out.length) throw new Error(`stripTags: text became empty after cleanup at ${where}`);
  return out;
};

mkdirSync(OUT, { recursive: true });

let grandTotal = 0;
for (let ch = 1; ch <= 114; ch++) {
  const verses = [];
  let page = 1;
  for (;;) {
    const params = new URLSearchParams({
      language: 'en',
      words: 'true',
      word_fields: 'text_uthmani',
      fields: 'text_uthmani,text_uthmani_tajweed',
      translations: String(TRANSLATION),
      per_page: '50',
      page: String(page),
    });
    const res = await fetch(`${API}/verses/by_chapter/${ch}?${params}`);
    if (!res.ok) throw new Error(`surah ${ch} page ${page}: HTTP ${res.status}`);
    const data = await res.json();
    for (const v of data.verses) {
      const key = `${ch}:${v.verse_number}`;
      if (typeof v.text_uthmani !== 'string' || !v.text_uthmani.length) throw new Error(`Missing text_uthmani at ${key}`);
      if (typeof v.text_uthmani_tajweed !== 'string' || !v.text_uthmani_tajweed.length) throw new Error(`Missing tajweed at ${key}`);
      const words = (v.words ?? []).filter((w) => w.char_type_name === 'word').map((w) => {
        if (typeof w.text_uthmani !== 'string' || !w.text_uthmani.length) throw new Error(`Missing word text at ${key} pos ${w.position}`);
        return { p: w.position, t: w.text_uthmani };
      });
      if (!words.length) throw new Error(`No words at ${key}`);
      verses.push({
        a: v.verse_number,
        t: v.text_uthmani,
        j: v.text_uthmani_tajweed,
        w: words,
        r: stripTags(v.translations?.[0]?.text, key),
      });
    }
    if (!data.pagination.next_page) break;
    page = data.pagination.next_page;
  }
  writeFileSync(`${OUT}/${ch}.json`, JSON.stringify({ chapter: ch, translation: TRANSLATION, verses }));
  grandTotal += verses.length;
  process.stdout.write(`surah ${ch} (${verses.length})  `);
}
console.log(`\nDONE. ${grandTotal} ayat written to ${OUT}`);
