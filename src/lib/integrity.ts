// Content integrity — a fingerprint of the bundled Qur'an ARABIC text.
//
// IMPORTANT: it hashes ONLY the Uthmani Arabic of every ayah (ayah number + text
// of the 114 surahs) — NOT the translations, tajweed markup or word data. Taḥrīf
// (tampering) means altering the Qur'anic text itself; translations legitimately
// change (e.g. switching translator) and must NOT trip the check. Hashing the raw
// file bytes was the old, fragile approach and gave a false "tampered" warning
// after a translation update.
//
// Algorithm (identical in the browser and in scripts):
//   for n in 1..114:  arabic = verses.map(v => `${v.a}|${v.t}`).join('\n')
//                     h[n]   = sha256Hex(utf8(arabic))
//   fingerprint       = sha256Hex(utf8( h[1] + h[2] + … + h[114] ))
export const QURAN_DATA_FINGERPRINT =
  'ead4f719a5d9120427ccb04099e1315c54982d6af09e2359d966601d164a4df0';

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const d = await crypto.subtle.digest('SHA-256', bytes as unknown as BufferSource);
  return Array.from(new Uint8Array(d)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

interface LVerse { a: number; t: string }

export async function computeQuranFingerprint(onProgress?: (done: number, total: number) => void): Promise<string> {
  const enc = new TextEncoder();
  const parts: string[] = [];
  for (let n = 1; n <= 114; n++) {
    const res = await fetch(`${import.meta.env.BASE_URL}data/surah/${n}.json`);
    const data = (await res.json()) as { verses: LVerse[] };
    const arabic = (data.verses || []).map((v) => `${v.a}|${v.t}`).join('\n');
    parts.push(await sha256Hex(enc.encode(arabic)));
    onProgress?.(n, 114);
  }
  return sha256Hex(enc.encode(parts.join('')));
}

export async function verifyQuranData(onProgress?: (done: number, total: number) => void): Promise<boolean> {
  try {
    return (await computeQuranFingerprint(onProgress)) === QURAN_DATA_FINGERPRINT;
  } catch {
    return false;
  }
}
