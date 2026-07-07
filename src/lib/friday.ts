// Friday essentials — a gentle weekly reminder for the sunnahs of Jumuʿah:
//   • Friday morning: read Sūrat al-Kahf.
//   • The last hour before Maghrib: the hour of response — duʿāʾ & ṣalawāt.
//
// 100% local (same offline prayer math for Maghrib). Own notification ids
// 7000–7019 + own channel, so it never conflicts with the adhan / prayer
// reminders / salawat / nudges. Default ON (a beloved, gentle weekly sunnah).

import { Capacitor } from '@capacitor/core';
import { getCachedGeo } from '@/lib/permissions';
import { prayerDates } from '@/lib/prayer';

const ENABLED = 'nur-friday-enabled';
const CH = 'nur-friday-v1';
const ID_BASE = 7000;

export function fridayEnabled(): boolean { return localStorage.getItem(ENABLED) !== '0'; }

const isAr = () => (localStorage.getItem('nur-lang') || 'ar') === 'ar';

async function ensureChannel(): Promise<void> {
  if (Capacitor.getPlatform() !== 'android') return;
  const { LocalNotifications } = await import('@capacitor/local-notifications');
  try { await LocalNotifications.createChannel({ id: CH, name: 'Friday · الجمعة', description: 'Weekly Friday reminders', importance: 4, visibility: 1 }); } catch { /* ignore */ }
}

export async function cancelFriday(): Promise<void> {
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const pending = await LocalNotifications.getPending().catch(() => ({ notifications: [] as { id: number }[] }));
    const ours = pending.notifications.filter((n) => n.id >= ID_BASE && n.id < ID_BASE + 20);
    if (ours.length) await LocalNotifications.cancel({ notifications: ours.map((n) => ({ id: n.id })) });
  } catch { /* ignore */ }
}

export async function scheduleFriday(): Promise<void> {
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await cancelFriday();
    if (!fridayEnabled()) return;
    let perm = await LocalNotifications.checkPermissions().catch(() => null);
    if (!perm || perm.display !== 'granted') perm = await LocalNotifications.requestPermissions().catch(() => null);
    if (!perm || perm.display !== 'granted') return;
    await ensureChannel();

    const ar = isAr();
    const geo = getCachedGeo();
    const now = Date.now();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const notifs: any[] = [];
    let id = ID_BASE;

    for (let d = 0; d < 45 && notifs.length < 18; d++) {
      const day = new Date(); day.setDate(day.getDate() + d);
      if (day.getDay() !== 5) continue; // Friday

      const morning = new Date(day); morning.setHours(9, 0, 0, 0);
      if (morning.getTime() > now + 60000) {
        notifs.push({
          id: id++,
          title: ar ? '📖 يوم الجمعة' : '📖 It’s Friday',
          body: ar ? 'لا تنسَ قراءة سورة الكهف اليوم' : 'Don’t forget to read Sūrat al-Kahf today',
          channelId: CH, smallIcon: 'ic_stat_nur', largeIcon: 'nur_logo',
          schedule: { at: morning, allowWhileIdle: true },
        });
      }

      // The last hour before Maghrib — the hour of response (needs location).
      if (geo) {
        const maghrib = prayerDates(geo.lat, geo.lng, day)[3];
        const lastHour = new Date(maghrib.getTime() - 60 * 60000);
        if (lastHour.getTime() > now + 60000) {
          notifs.push({
            id: id++,
            title: ar ? '🤲 ساعة الإجابة' : '🤲 The hour of response',
            body: ar ? 'في آخر ساعة من الجمعة ساعةُ إجابة — أكثِر من الدعاء والصلاة على النبي ﷺ' : 'The last hour of Friday is an hour of response — make abundant duʿāʾ and ṣalawāt',
            channelId: CH, smallIcon: 'ic_stat_nur', largeIcon: 'nur_logo',
            schedule: { at: lastHour, allowWhileIdle: true },
          });
        }
      }
    }
    if (notifs.length) await LocalNotifications.schedule({ notifications: notifs });
  } catch { /* plugin missing (web) or failed — ignore */ }
}

export async function setFridayEnabled(on: boolean): Promise<void> {
  localStorage.setItem(ENABLED, on ? '1' : '0');
  if (on) await scheduleFriday(); else await cancelFriday();
}
