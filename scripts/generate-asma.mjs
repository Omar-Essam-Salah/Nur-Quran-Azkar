// Bundles the 99 Names of Allah (asma al-husna) offline.
// Run: node scripts/generate-asma.mjs

import { writeFileSync, mkdirSync } from 'fs';

mkdirSync('public/data', { recursive: true });

async function fetchAsma() {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch('https://api.aladhan.com/v1/asmaAlHusna', { signal: AbortSignal.timeout(20000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.data.map((x) => ({
        n: x.number,
        name: x.name,
        translit: x.transliteration,
        meaning: x.en?.meaning ?? '',
      }));
    } catch (e) {
      console.log(`attempt ${attempt} failed: ${e.message}`);
    }
  }
  return null;
}

const names = await fetchAsma();
if (!names) {
  console.error('Could not fetch asma al-husna.');
  process.exit(1);
}
writeFileSync('public/data/asma.json', JSON.stringify({ names }));
console.log(`asma.json: ${names.length} names`);
