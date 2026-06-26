// Content integrity — a fingerprint of the bundled Qur'an text (the 114 surah
// files). The Authenticity screen recomputes it to help detect a tampered or
// repackaged copy of the app.
//
// Computed at build time over the RAW file bytes:
//   for n in 1..114:  h[n] = sha256( bytes of public/data/surah/n.json )  (hex)
//   fingerprint       = sha256( h[1] + h[2] + … + h[114] )                 (hex)
// The function below reproduces exactly this, so a match proves the on-device
// Qur'an data is byte-for-byte the authentic, unaltered text.
export const QURAN_DATA_FINGERPRINT =
  '9535c0c5ca1c765fd183f0b9530a56aee58653a6d5c00e160a92a7d52f583fc1';

async function sha256Hex(buf: BufferSource): Promise<string> {
  const d = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(d)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function computeQuranFingerprint(onProgress?: (done: number, total: number) => void): Promise<string> {
  const parts: string[] = [];
  for (let n = 1; n <= 114; n++) {
    const res = await fetch(`${import.meta.env.BASE_URL}data/surah/${n}.json`);
    parts.push(await sha256Hex(await res.arrayBuffer()));
    onProgress?.(n, 114);
  }
  return sha256Hex(new TextEncoder().encode(parts.join('')));
}

export async function verifyQuranData(onProgress?: (done: number, total: number) => void): Promise<boolean> {
  try {
    return (await computeQuranFingerprint(onProgress)) === QURAN_DATA_FINGERPRINT;
  } catch {
    return false;
  }
}
