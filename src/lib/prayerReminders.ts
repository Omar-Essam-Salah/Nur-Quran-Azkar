// Prayer-time reminders — 100% local, no server, offline-friendly.
//
//   • Pre-prayer reminder: a gentle notification a chosen number of minutes
//     BEFORE each prayer ("Fajr in 15 minutes"). This is distinct from the
//     adhan (which fires AT the prayer time on its own channel/ids), so the two
//     never conflict.
//   • Next-prayer status: one quiet, ongoing notification showing the upcoming
//     prayer + its time, refreshed whenever the app opens.
//
// Prayer times come from the same local `adhan` math used everywhere — nothing
// is fetched. Reserved notification ids: 6000–6099 (reminders) + 6999 (status),
// separate from adhan (1001–1005/1099), salawat (4000s) and nudges (5000s).

import { Capacitor } from '@capacitor/core';
import { getCachedGeo } from '@/lib/permissions';
import { prayerDates } from '@/lib/prayer';

const ENABLED = 'nur-prayer-reminder-enabled';
const LEAD = 'nur-prayer-reminder-min';
const STATUS = 'nur-prayer-status-enabled';
const CH_REMIND = 'nur-prayer-reminder-v1';
const CH_STATUS = 'nur-prayer-status-v1';
const ID_REMIND_BASE = 6000;
const ID_STATUS = 6999;

export const LEAD_OPTIONS = [5, 10, 15, 20, 30];

const NAMES: { en: string; ar: string }[] = [
  { en: 'Fajr', ar: 'الفجر' }, { en: 'Dhuhr', ar: 'الظهر' }, { en: 'Asr', ar: 'العصر' },
  { en: 'Maghrib', ar: 'المغرب' }, { en: 'Isha', ar: 'العشاء' },
];

export function prayerReminderEnabled(): boolean { return localStorage.getItem(ENABLED) === '1'; }
export function prayerStatusEnabled(): boolean { return localStorage.getItem(STATUS) === '1'; }
export function prayerReminderLead(): number { const v = Number(localStorage.getItem(LEAD)); return LEAD_OPTIONS.includes(v) ? v : 15; }
export function setPrayerReminderLead(m: number): void { localStorage.setItem(LEAD, String(m)); }

const isAr = () => (localStorage.getItem('nur-lang') || 'ar') === 'ar';
const fmt12 = (d: Date) => {
  let h = d.getHours(); const m = d.getMinutes(); const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12; return `${h}:${String(m).padStart(2, '0')} ${ap}`;
};

async function ensureChannels(): Promise<void> {
  if (Capacitor.getPlatform() !== 'android') return;
  const { LocalNotifications } = await import('@capacitor/local-notifications');
  try {
    await LocalNotifications.createChannel({ id: CH_REMIND, name: 'Prayer reminders · تذكير قبل الصلاة', description: 'A reminder shortly before each prayer', importance: 4, visibility: 1 });
    await LocalNotifications.createChannel({ id: CH_STATUS, name: 'Next prayer · الصلاة القادمة', description: 'Quiet ongoing next-prayer info', importance: 2, visibility: 1 });
  } catch { /* ignore */ }
}

export async function cancelPrayerReminders(): Promise<void> {
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const pending = await LocalNotifications.getPending().catch(() => ({ notifications: [] as { id: number }[] }));
    const ours = pending.notifications.filter((n) => (n.id >= ID_REMIND_BASE && n.id < ID_REMIND_BASE + 100) || n.id === ID_STATUS);
    if (ours.length) await LocalNotifications.cancel({ notifications: ours.map((n) => ({ id: n.id })) });
  } catch { /* ignore */ }
}

/** The next upcoming prayer (name + time), searching today then tomorrow. */
function nextPrayer(lat: number, lng: number): { en: string; ar: string; at: Date } | null {
  const now = Date.now();
  for (let day = 0; day < 2; day++) {
    const d = new Date(); d.setDate(d.getDate() + day);
    const dates = prayerDates(lat, lng, d);
    for (let i = 0; i < dates.length; i++) if (dates[i].getTime() > now) return { ...NAMES[i], at: dates[i] };
  }
  return null;
}

/** (Re)schedule reminders + refresh the status from the saved settings. */
export async function schedulePrayerReminders(): Promise<void> {
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await cancelPrayerReminders();
    const remOn = prayerReminderEnabled(), statOn = prayerStatusEnabled();
    if (!remOn && !statOn) return;

    let perm = await LocalNotifications.checkPermissions().catch(() => null);
    if (!perm || perm.display !== 'granted') perm = await LocalNotifications.requestPermissions().catch(() => null);
    if (!perm || perm.display !== 'granted') return;

    const geo = getCachedGeo();
    if (!geo) return; // no location yet → try again next app open
    await ensureChannels();

    const ar = isAr();
    const now = Date.now();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const notifs: any[] = [];

    if (remOn) {
      const lead = prayerReminderLead();
      let id = ID_REMIND_BASE;
      for (let day = 0; day < 3; day++) {
        const d = new Date(); d.setDate(d.getDate() + day);
        const dates = prayerDates(geo.lat, geo.lng, d);
        for (let i = 0; i < dates.length; i++) {
          const at = new Date(dates[i].getTime() - lead * 60000);
          if (at.getTime() <= now + 30000) continue; // skip past
          notifs.push({
            id: id++,
            title: ar ? '🕌 اقترب وقت الصلاة' : '🕌 Prayer is near',
            body: ar ? `صلاة ${NAMES[i].ar} بعد ${lead} دقيقة (${fmt12(dates[i])})` : `${NAMES[i].en} in ${lead} minutes (${fmt12(dates[i])})`,
            channelId: CH_REMIND,
            smallIcon: 'ic_stat_nur',
            largeIcon: 'nur_logo',
            schedule: { at, allowWhileIdle: true },
          });
        }
      }
    }

    if (notifs.length) await LocalNotifications.schedule({ notifications: notifs });
    if (statOn) await postStatus();
  } catch { /* plugin missing (web) or scheduling failed — ignore */ }
}

/** Post/refresh the quiet ongoing "next prayer" notification. */
export async function postStatus(): Promise<void> {
  try {
    if (!prayerStatusEnabled()) return;
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const geo = getCachedGeo(); if (!geo) return;
    await ensureChannels();
    const np = nextPrayer(geo.lat, geo.lng); if (!np) return;
    const ar = isAr();
    await LocalNotifications.schedule({ notifications: [{
      id: ID_STATUS,
      title: ar ? 'الصلاة القادمة' : 'Next prayer',
      body: ar ? `${np.ar} · ${fmt12(np.at)}` : `${np.en} · ${fmt12(np.at)}`,
      channelId: CH_STATUS,
      smallIcon: 'ic_stat_nur',
      ongoing: true,
      autoCancel: false,
      schedule: { at: new Date(Date.now() + 1500) },
    }] });
  } catch { /* ignore */ }
}

export async function setPrayerReminderEnabled(on: boolean): Promise<void> {
  localStorage.setItem(ENABLED, on ? '1' : '0');
  await schedulePrayerReminders();
}

export async function setPrayerStatusEnabled(on: boolean): Promise<void> {
  localStorage.setItem(STATUS, on ? '1' : '0');
  if (on) { await schedulePrayerReminders(); }
  else {
    try { const { LocalNotifications } = await import('@capacitor/local-notifications'); await LocalNotifications.cancel({ notifications: [{ id: ID_STATUS }] }); } catch { /* ignore */ }
  }
}

/** Fire a sample pre-prayer reminder ~4s out so the user can preview it. */
export async function testPrayerReminder(): Promise<boolean> {
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const perm = await LocalNotifications.requestPermissions().catch(() => null);
    if (!perm || perm.display !== 'granted') return false;
    await ensureChannels();
    const ar = isAr();
    await LocalNotifications.schedule({ notifications: [{
      id: ID_REMIND_BASE + 99,
      title: ar ? '🕌 اقترب وقت الصلاة' : '🕌 Prayer is near',
      body: ar ? 'مثال: صلاة الظهر بعد ١٥ دقيقة' : 'Example: Dhuhr in 15 minutes',
      channelId: CH_REMIND, smallIcon: 'ic_stat_nur', largeIcon: 'nur_logo',
      schedule: { at: new Date(Date.now() + 4000), allowWhileIdle: true },
    }] });
    return true;
  } catch { return false; }
}
