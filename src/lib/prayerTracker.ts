// Daily prayer tracker — logs which of the five obligatory prayers were prayed
// each day. Fully offline (localStorage). Stored as a 5-bit mask per date.

const KEY = 'nur-salah-log';

export const PRAYERS: { ar: string; en: string }[] = [
  { ar: 'الفجر', en: 'Fajr' },
  { ar: 'الظهر', en: 'Dhuhr' },
  { ar: 'العصر', en: 'Asr' },
  { ar: 'المغرب', en: 'Maghrib' },
  { ar: 'العشاء', en: 'Isha' },
];

export function dateKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function readLog(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; }
}
function writeLog(l: Record<string, number>): void {
  try { localStorage.setItem(KEY, JSON.stringify(l)); } catch { /* ignore */ }
}

export function getDayMask(key: string): number { return readLog()[key] || 0; }
export function isPrayed(mask: number, idx: number): boolean { return (mask & (1 << idx)) !== 0; }
export function countPrayed(mask: number): number { let c = 0; for (let i = 0; i < 5; i++) if (mask & (1 << i)) c++; return c; }

/** Toggle one prayer for a day; returns the new mask. */
export function togglePrayer(key: string, idx: number): number {
  const l = readLog();
  const next = (l[key] || 0) ^ (1 << idx);
  if (next) l[key] = next; else delete l[key];
  writeLog(l);
  return next;
}

/** Consecutive days (ending today, or yesterday if today isn't complete yet) on
 *  which all five prayers were logged. */
export function getStreak(): number {
  const l = readLog();
  const d = new Date();
  if (countPrayed(l[dateKey(d)] || 0) !== 5) d.setDate(d.getDate() - 1);
  let streak = 0;
  for (let i = 0; i < 2000; i++) {
    if (countPrayed(l[dateKey(d)] || 0) === 5) { streak++; d.setDate(d.getDate() - 1); }
    else break;
  }
  return streak;
}

/** For a month grid: the count (0–5) prayed on each day of the given month. */
export function getMonthCounts(year: number, month: number): number[] {
  const l = readLog();
  const days = new Date(year, month + 1, 0).getDate();
  const out: number[] = [];
  for (let day = 1; day <= days; day++) out.push(countPrayed(l[dateKey(new Date(year, month, day))] || 0));
  return out;
}
