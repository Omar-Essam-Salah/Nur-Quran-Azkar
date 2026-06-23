// Build-time generator: fetches the full Quran (Arabic word-by-word + tajweed +
// one translation) from api.quran.com ONCE and writes per-surah JSON into
// public/data/surah/. At runtime the app reads these local files — no network.
//
// Run: node scripts/generate-quran-data.mjs

import { writeFileSync, mkdirSync } from 'fs';

const API = 'https://api.quran.com/api/v4';
const TRANSLATION = 131; // Dr. Mustafa Khattab — The Clear Quran
const OUT = 'public/data/surah';

const stripTags = (s) => (s ?? '').replace(/<sup[^>]*>.*?<\/sup>/gis, '').replace(/<[^>]+>/g, '').trim();

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
      verses.push({
        a: v.verse_number,
        t: v.text_uthmani ?? '',
        j: v.text_uthmani_tajweed ?? '',
        w: (v.words ?? []).filter((w) => w.char_type_name === 'word').map((w) => ({ p: w.position, t: w.text_uthmani ?? '' })),
        r: stripTags(v.translations?.[0]?.text),
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
