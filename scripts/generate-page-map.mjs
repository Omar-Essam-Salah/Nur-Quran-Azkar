// Build-time generator for public/data/page-map.json — the EXACT Madani
// (King Fahd / quran.com) page layout. For each of the 604 pages it records the
// FIRST word printed on that page as [surah, ayah, wordPosition]; the app slices
// each page from its own start word up to the next page's start word, so page
// boundaries and mid-ayah splits match the printed mushaf exactly.
//
// Self-verifies (count, in-range vs the bundled surah text, strict monotonicity,
// known anchor pages) and THROWS before writing if anything is off — a corrupt
// page map can never be emitted silently.
//
// Run: node scripts/generate-page-map.mjs

import { writeFileSync, readFileSync } from 'fs';

const API = 'https://api.quran.com/api/v4';
const OUT = 'public/data/page-map.json';
const TOTAL_PAGES = 604;

const map = [];
for (let p = 1; p <= TOTAL_PAGES; p++) {
  const params = new URLSearchParams({ words: 'true', word_fields: 'page_number', per_page: '300', page: '1' });
  const res = await fetch(`${API}/verses/by_page/${p}?${params}`);
  if (!res.ok) throw new Error(`page ${p}: HTTP ${res.status}`);
  const data = await res.json();
  let first = null;
  for (const v of data.verses ?? []) {
    const [s, a] = v.verse_key.split(':').map(Number);
    for (const w of v.words ?? []) {
      // The first real WORD (not the ayah-end glyph) actually printed on page p.
      if (w.char_type_name === 'word' && w.page_number === p) { first = [s, a, w.position]; break; }
    }
    if (first) break;
  }
  if (!first) throw new Error(`page ${p}: could not determine the first word`);
  map.push(first);
  if (p % 50 === 0) process.stdout.write(`${p} `);
}

// ── self-verification (throws on any defect) ──
if (map.length !== TOTAL_PAGES) throw new Error(`expected ${TOTAL_PAGES} pages, got ${map.length}`);

// every reference must point at a real word in the bundled surah text
const wordCount = {};
for (let ch = 1; ch <= 114; ch++) {
  const d = JSON.parse(readFileSync(`public/data/surah/${ch}.json`, 'utf8'));
  wordCount[ch] = {};
  for (const v of d.verses) wordCount[ch][v.a] = v.w.length;
}
let prev = [0, 0, 0];
for (let i = 0; i < map.length; i++) {
  const [s, a, w] = map[i];
  if (!wordCount[s] || !wordCount[s][a] || w < 1 || w > wordCount[s][a]) {
    throw new Error(`page ${i + 1} out of range: ${JSON.stringify(map[i])} (surah ${s} ayah ${a} has ${wordCount[s]?.[a] ?? 'NO'} words)`);
  }
  // strict monotonic increase → no overlapping or backward page starts
  const cmp = s !== prev[0] ? s - prev[0] : (a !== prev[1] ? a - prev[1] : w - prev[2]);
  if (cmp <= 0) throw new Error(`page ${i + 1} not monotonic after ${JSON.stringify(prev)}: ${JSON.stringify(map[i])}`);
  prev = [s, a, w];
}

// known printed-mushaf anchors
const anchor = (p, exp) => {
  if (JSON.stringify(map[p - 1]) !== JSON.stringify(exp)) throw new Error(`anchor page ${p} = ${JSON.stringify(map[p - 1])}, expected ${JSON.stringify(exp)}`);
};
anchor(1, [1, 1, 1]);      // Al-Fatihah
anchor(2, [2, 1, 1]);      // Al-Baqarah
anchor(50, [3, 1, 1]);     // Aal-Imran
anchor(604, [112, 1, 1]);  // last page (Al-Ikhlas → An-Nas)

writeFileSync(OUT, JSON.stringify(map));
console.log(`\nDONE. ${map.length} pages written to ${OUT} (verified: in-range, monotonic, anchors OK)`);
