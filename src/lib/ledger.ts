// "Soul Ledger" (سجل الخيرات) — a gentle, private, on-device record of devotion.
// No accounts, no servers; everything lives in localStorage. It is positive
// reinforcement only: it never scolds, only encourages.

const KEY = 'nur-ledger';
// Kept small on purpose: the gauge should feel rewarding from the very first
// ayah, not demand a big number before it moves.
export const DAILY_GOAL_AYAHS = 10;

export interface LedgerState {
  totalAyahs: number;
  todayAyahs: number;
  today: string;      // YYYY-MM-DD of the current tracked day
  lastActive: string; // YYYY-MM-DD of the last active day
  daysActive: number;
  streak: number;
  bestStreak: number;
}

export interface LedgerView extends LedgerState {
  dhikrTotal: number;
  bookmarks: number;
  goalPct: number; // 0..100 today's proximity gauge
}

const DEFAULT: LedgerState = {
  totalAyahs: 0, todayAyahs: 0, today: '', lastActive: '', daysActive: 0, streak: 0, bestStreak: 0,
};

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function load(): LedgerState {
  try { return { ...DEFAULT, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return { ...DEFAULT }; }
}
function save(s: LedgerState) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

/** Advance the ledger to today, updating streak / active-day counters once per day. */
function rollover(s: LedgerState): LedgerState {
  const now = new Date();
  const today = ymd(now);
  if (s.today === today) return s;

  const yesterday = ymd(new Date(now.getTime() - 86400000));
  s.streak = s.lastActive === yesterday ? s.streak + 1 : 1;
  s.bestStreak = Math.max(s.bestStreak, s.streak);
  s.daysActive += 1;
  s.lastActive = today;
  s.today = today;
  s.todayAyahs = 0;
  return s;
}

/** Record an act of devotion. Safe to call often. */
export function recordDeed(kind: 'ayah' | 'open', amount = 1): void {
  const s = rollover(load());
  if (kind === 'ayah') {
    s.totalAyahs += amount;
    s.todayAyahs += amount;
  }
  save(s);
}

function sumTasbih(): number {
  try {
    const counts = JSON.parse(localStorage.getItem('nur-tasbih-counts') || '{}') as Record<string, number>;
    return Object.values(counts).reduce((a, b) => a + (Number(b) || 0), 0);
  } catch { return 0; }
}
function countBookmarks(): number {
  try { return (JSON.parse(localStorage.getItem('nur-bookmarks') || '[]') as unknown[]).length; } catch { return 0; }
}

/** Current ledger snapshot for display (also persists the day rollover). */
export function getLedger(): LedgerView {
  const s = rollover(load());
  save(s);
  // Simply showing up today already fills the gauge a little (you came back to
  // your Lord) — every ayah after that pushes you closer. Small actions count.
  const openedToday = s.lastActive === ymd(new Date());
  const base = openedToday ? 12 : 0;
  const fromAyat = Math.min(88, Math.round((s.todayAyahs / DAILY_GOAL_AYAHS) * 88));
  return {
    ...s,
    dhikrTotal: sumTasbih(),
    bookmarks: countBookmarks(),
    goalPct: Math.min(100, base + fromAyat),
  };
}
