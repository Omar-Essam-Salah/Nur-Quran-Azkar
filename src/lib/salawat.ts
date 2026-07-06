// Optional periodic "Salawat" reminder — a gentle notification every N minutes
// inviting the user to send blessings on the Prophet ﷺ, with a CUSTOM short
// sound (android/app/src/main/res/raw/salawat.mp3; on iOS a `salawat.mp3`/.caf
// bundled with the app).
//
// 100% offline by design: it uses SCHEDULED LOCAL notifications only — no
// server, no push, no always-on background task (which the OS would kill and
// which drains battery). We queue a batch of future reminders and top the batch
// up every time the app opens. Sleep hours (23:30–06:00) are skipped.
//
// NOTE ON THE SOUND: Android/iOS play a NOTIFICATION sound, which the system
// keeps short (≈ ≤ 30 s and it can be truncated). Use a brief salawat clip —
// this is a reminder tone, not a full audio player.

import { Capacitor } from '@capacitor/core';

const ENABLED_KEY = 'nur-salawat-enabled';
const INTERVAL_KEY = 'nur-salawat-interval'; // stored in minutes
const CHANNEL = 'nur-salawat-v1';
const ID_BASE = 4000;      // reserved id range 4000–4999 (adhan/nudges use others)
const ID_COUNT = 60;       // how many future reminders we keep queued

/** Selectable intervals, in minutes. */
export const SALAWAT_INTERVALS = [30, 60, 120, 180, 240];

export function salawatEnabled(): boolean { return localStorage.getItem(ENABLED_KEY) === '1'; }
export function salawatInterval(): number {
  const v = Number(localStorage.getItem(INTERVAL_KEY));
  return SALAWAT_INTERVALS.includes(v) ? v : 120;
}
export function setSalawatInterval(min: number): void { localStorage.setItem(INTERVAL_KEY, String(min)); }

// A little rotation so the reminder never feels mechanical.
const PHRASES: { ar: string; en: string }[] = [
  { ar: 'اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّد ﷺ', en: 'O Allah, send blessings and peace upon our Prophet Muhammad ﷺ' },
  { ar: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّد', en: 'O Allah, send blessings upon Muhammad and the family of Muhammad' },
  { ar: 'أكثِر من الصلاة على النبي ﷺ في يومك', en: 'Send abundant blessings upon the Prophet ﷺ today' },
  { ar: 'أَولى النَّاسِ بي يومَ القيامةِ أكثرُهم عليَّ صلاةً', en: '“The nearest to me on the Day of Rising are those who send the most blessings upon me.”' },
];

async function ensureChannel(): Promise<void> {
  if (Capacitor.getPlatform() !== 'android') return;
  const { LocalNotifications } = await import('@capacitor/local-notifications');
  try {
    await LocalNotifications.createChannel({
      id: CHANNEL,
      name: 'Salawat · الصلاة على النبي ﷺ',
      description: 'Periodic reminder to send blessings on the Prophet ﷺ',
      importance: 4,
      sound: 'salawat.mp3', // → res/raw/salawat.mp3 (extension is stripped natively)
      visibility: 1,
    });
  } catch { /* ignore */ }
}

/** Cancel every queued salawat reminder. */
export async function cancelSalawat(): Promise<void> {
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const pending = await LocalNotifications.getPending().catch(() => ({ notifications: [] as { id: number }[] }));
    const ours = pending.notifications.filter((n) => n.id >= ID_BASE && n.id < ID_BASE + 1000);
    if (ours.length) await LocalNotifications.cancel({ notifications: ours.map((n) => ({ id: n.id })) });
  } catch { /* ignore */ }
}

function inSleepWindow(d: Date): boolean {
  const mins = d.getHours() * 60 + d.getMinutes();
  return mins >= 1410 || mins < 360; // 23:30 … 06:00
}

/**
 * (Re)schedule the salawat reminders from the saved settings. Cancels the old
 * batch first. Safe no-op on web / without permission. Call on app open and
 * whenever the setting changes.
 */
export async function scheduleSalawat(): Promise<void> {
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await cancelSalawat();
    if (!salawatEnabled()) return;

    let perm = await LocalNotifications.checkPermissions().catch(() => null);
    if (!perm || perm.display !== 'granted') perm = await LocalNotifications.requestPermissions().catch(() => null);
    if (!perm || perm.display !== 'granted') return;

    await ensureChannel();

    const isAr = (localStorage.getItem('nur-lang') || 'ar') === 'ar';
    const stepMs = salawatInterval() * 60 * 1000;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const notifications: any[] = [];
    let when = Date.now() + stepMs;
    let guard = 0;
    while (notifications.length < ID_COUNT && guard < ID_COUNT * 4) {
      guard++;
      const at = new Date(when);
      when += stepMs;
      if (inSleepWindow(at)) continue;
      const p = PHRASES[notifications.length % PHRASES.length];
      notifications.push({
        id: ID_BASE + notifications.length,
        title: isAr ? 'صلِّ على النبي ﷺ' : 'Send blessings ﷺ',
        body: isAr ? p.ar : p.en,
        channelId: CHANNEL,
        sound: 'salawat.mp3',
        smallIcon: 'ic_stat_nur',
        largeIcon: 'nur_logo',
        schedule: { at, allowWhileIdle: true },
      });
    }
    if (notifications.length) await LocalNotifications.schedule({ notifications });
  } catch { /* plugin missing (web) or scheduling failed — ignore silently */ }
}

/** Turn the feature on/off and (re)schedule accordingly. */
export async function setSalawatEnabled(on: boolean): Promise<void> {
  localStorage.setItem(ENABLED_KEY, on ? '1' : '0');
  if (on) await scheduleSalawat(); else await cancelSalawat();
}

/** Fire one salawat notification ~4 s from now so the user can hear the sound. */
export async function testSalawat(): Promise<boolean> {
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const perm = await LocalNotifications.requestPermissions().catch(() => null);
    if (!perm || perm.display !== 'granted') return false;
    await ensureChannel();
    const isAr = (localStorage.getItem('nur-lang') || 'ar') === 'ar';
    await LocalNotifications.schedule({ notifications: [{
      id: ID_BASE + 999,
      title: isAr ? 'صلِّ على النبي ﷺ' : 'Send blessings ﷺ',
      body: isAr ? PHRASES[0].ar : PHRASES[0].en,
      channelId: CHANNEL,
      sound: 'salawat.mp3',
      smallIcon: 'ic_stat_nur',
      largeIcon: 'nur_logo',
      schedule: { at: new Date(Date.now() + 4000), allowWhileIdle: true },
    }] });
    return true;
  } catch { return false; }
}
