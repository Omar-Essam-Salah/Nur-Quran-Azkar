// Recompute the Qur'an ARABIC-text fingerprint used by the Authenticity screen.
// Run this whenever the bundled surah data is regenerated, then paste the value
// into QURAN_DATA_FINGERPRINT in src/lib/integrity.ts. The algorithm here is
// byte-for-byte identical to computeQuranFingerprint() in the app.
//
// Run: node scripts/generate-fingerprint.mjs

import { readFileSync } from 'fs';
import { createHash } from 'crypto';

const sha = (s) => createHash('sha256').update(s, 'utf8').digest('hex');

const parts = [];
for (let n = 1; n <= 114; n++) {
  const d = JSON.parse(readFileSync(`public/data/surah/${n}.json`, 'utf8'));
  const arabic = (d.verses || []).map((v) => `${v.a}|${v.t}`).join('\n');
  parts.push(sha(arabic));
}
const fingerprint = sha(parts.join(''));
console.log('QURAN_DATA_FINGERPRINT =');
console.log(fingerprint);
