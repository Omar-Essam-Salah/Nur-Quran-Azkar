// Bundles authentic hadith collections offline (fetched once from the public
// fawazahmed0/hadith-api CDN). Run: node scripts/generate-hadith.mjs

import { writeFileSync, mkdirSync } from 'fs';

const SOURCES = [
  { key: 'ara-nawawi', id: 'nawawi', title: 'الأربعون النووية', author: 'الإمام النووي' },
];

mkdirSync('public/data', { recursive: true });

for (const s of SOURCES) {
  const url = `https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/${s.key}.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${s.key}: HTTP ${res.status}`);
  const data = await res.json();
  const hadiths = (data.hadiths ?? []).map((h) => ({ n: h.hadithnumber, text: (h.text ?? '').trim() }));
  writeFileSync(`public/data/hadith-${s.id}.json`, JSON.stringify({ id: s.id, title: s.title, author: s.author, hadiths }));
  console.log(`hadith-${s.id}.json: ${hadiths.length} hadiths`);
}
console.log('DONE');
