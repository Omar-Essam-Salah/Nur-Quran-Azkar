// "Verse of the day" — a rotating set of well-known, uplifting verses. Only the
// REFERENCES are listed here; the actual text is loaded from the bundled offline
// mushaf (so it is always the verified Uthmani text). Rotates by the day number.

import { loadAyahRange } from '@/lib/localQuran';

export const DAILY_VERSE_REFS: { s: number; a: number }[] = [
  { s: 2, a: 286 }, { s: 2, a: 255 }, { s: 2, a: 152 }, { s: 2, a: 186 }, { s: 2, a: 45 },
  { s: 2, a: 153 }, { s: 2, a: 201 }, { s: 2, a: 216 }, { s: 3, a: 139 }, { s: 3, a: 159 },
  { s: 3, a: 173 }, { s: 3, a: 134 }, { s: 8, a: 46 }, { s: 11, a: 88 }, { s: 13, a: 28 },
  { s: 14, a: 7 }, { s: 16, a: 97 }, { s: 16, a: 128 }, { s: 17, a: 80 }, { s: 20, a: 114 },
  { s: 23, a: 118 }, { s: 24, a: 35 }, { s: 25, a: 74 }, { s: 29, a: 69 }, { s: 31, a: 17 },
  { s: 39, a: 53 }, { s: 40, a: 60 }, { s: 41, a: 30 }, { s: 47, a: 7 }, { s: 49, a: 13 },
  { s: 50, a: 16 }, { s: 55, a: 13 }, { s: 57, a: 4 }, { s: 64, a: 11 }, { s: 65, a: 2 },
  { s: 65, a: 3 }, { s: 93, a: 5 }, { s: 94, a: 5 }, { s: 94, a: 6 }, { s: 3, a: 200 },
];

export function todayVerseIndex(offsetDays = 0): number {
  const day = Math.floor(Date.now() / 86400000) + offsetDays;
  return ((day % DAILY_VERSE_REFS.length) + DAILY_VERSE_REFS.length) % DAILY_VERSE_REFS.length;
}

const REMINDER_KEY = 'nur-daily-verse-reminder';
const VERSE_ID_BASE = 6100;

export function dailyVerseReminderOn(): boolean { return localStorage.getItem(REMINDER_KEY) === '1'; }

/** Schedule a "verse of the day" notification each morning (08:30) for the next
 *  ~10 days, with that day's verse text. Safe no-op on web / without permission. */
export async function scheduleDailyVerseReminders(): Promise<boolean> {
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const perm = await LocalNotifications.requestPermissions().catch(() => null);
    if (!perm || perm.display !== 'granted') return false;

    const pending = await LocalNotifications.getPending().catch(() => ({ notifications: [] as { id: number }[] }));
    const ours = pending.notifications.filter((n) => n.id >= VERSE_ID_BASE && n.id < VERSE_ID_BASE + 100);
    if (ours.length) await LocalNotifications.cancel({ notifications: ours.map((n) => ({ id: n.id })) }).catch(() => {});

    const isAr = (localStorage.getItem('nur-lang') || 'ar') === 'ar';
    const now = Date.now();
    const notifications: any[] = [];
    for (let i = 0; i < 10; i++) {
      const at = new Date(); at.setDate(at.getDate() + i); at.setHours(8, 30, 0, 0);
      if (at.getTime() <= now + 60000) continue;
      const ref = DAILY_VERSE_REFS[todayVerseIndex(i)];
      const ayat = await loadAyahRange(ref.s, ref.a, ref.a);
      const verse = ayat[0];
      if (!verse) continue;
      const body = isAr ? verse.text : (verse.translation || verse.text);
      notifications.push({
        id: VERSE_ID_BASE + i,
        title: isAr ? 'نُور · آية اليوم' : 'Nur · Verse of the day',
        body: body.length > 180 ? body.slice(0, 178) + '…' : body,
        schedule: { at, allowWhileIdle: true },
        smallIcon: 'ic_stat_nur', largeIcon: 'nur_logo',
      });
    }
    if (notifications.length) await LocalNotifications.schedule({ notifications });
    localStorage.setItem(REMINDER_KEY, '1');
    return true;
  } catch { return false; }
}

export async function cancelDailyVerseReminders(): Promise<void> {
  localStorage.setItem(REMINDER_KEY, '0');
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const pending = await LocalNotifications.getPending().catch(() => ({ notifications: [] as { id: number }[] }));
    const ours = pending.notifications.filter((n) => n.id >= VERSE_ID_BASE && n.id < VERSE_ID_BASE + 100);
    if (ours.length) await LocalNotifications.cancel({ notifications: ours.map((n) => ({ id: n.id })) }).catch(() => {});
  } catch { /* ignore */ }
}
