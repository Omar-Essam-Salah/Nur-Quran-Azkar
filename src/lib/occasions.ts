// Islamic occasions, computed locally (offline) from the Umm al-Qurā Hijri
// calendar via Intl. NOTE: the start of Ramadan, Eid and other month-beginnings
// ultimately depend on the official moon sighting, so a computed date may differ
// by ±1 day. The Occasions screen links to authoritative sources for the final
// confirmation — this engine is for planning and reminders, not a fatwa.

export interface Occasion {
  id: string;
  ar: string; en: string;
  hmonth: number; hday: number;   // Hijri month (1-12) & day
  descAr: string; descEn: string;
  fasting?: boolean;              // a recommended day of fasting
}

export const OCCASIONS: Occasion[] = [
  { id: 'newyear', ar: 'رأس السنة الهجرية', en: 'Islamic New Year', hmonth: 1, hday: 1, descAr: 'أوّل محرّم، بداية العام الهجري الجديد.', descEn: 'The first of Muharram — the start of the new Hijri year.' },
  { id: 'ashura', ar: 'يوم عاشوراء', en: 'Day of ʿĀshūrāʾ', hmonth: 1, hday: 10, descAr: 'صيامه يُكفّر السنة الماضية، ويُستحبّ صيام التاسع (تاسوعاء) معه.', descEn: 'Fasting it expiates the previous year; fasting the 9th with it is recommended.', fasting: true },
  { id: 'mawlid', ar: 'المولد النبوي الشريف', en: 'The Prophet’s Birth (12 Rabīʿ I)', hmonth: 3, hday: 12, descAr: 'ذكرى مولد النبي ﷺ في ربيع الأوّل.', descEn: 'Commemoration of the Prophet’s ﷺ birth in Rabīʿ al-Awwal.' },
  { id: 'isra', ar: 'الإسراء والمعراج', en: 'Al-Isrāʾ wal-Miʿrāj (27 Rajab)', hmonth: 7, hday: 27, descAr: 'ذكرى رحلة الإسراء والمعراج، وفيها فُرضت الصلوات الخمس.', descEn: 'The night journey and ascension, when the five daily prayers were ordained.' },
  { id: 'nisf', ar: 'ليلة النصف من شعبان', en: 'Mid-Shaʿbān', hmonth: 8, hday: 15, descAr: 'ليلةٌ يُستحبّ فيها الاجتهاد في العبادة والدعاء.', descEn: 'A night in which extra worship and supplication are encouraged.' },
  { id: 'ramadan', ar: 'أوّل رمضان', en: 'First of Ramadan', hmonth: 9, hday: 1, descAr: 'بداية شهر الصيام المبارك، شهر القرآن.', descEn: 'The start of the blessed month of fasting — the month of the Qur’an.', fasting: true },
  { id: 'qadr', ar: 'ليلة القدر (تُلتمَس)', en: 'Laylat al-Qadr (sought)', hmonth: 9, hday: 27, descAr: 'تُلتمَس في أوتار العشر الأواخر من رمضان، وأرجاها ليلة السابع والعشرين.', descEn: 'Sought in the odd nights of the last ten of Ramadan; most likely the 27th night.' },
  { id: 'eidfitr', ar: 'عيد الفطر المبارك', en: 'Eid al-Fitr', hmonth: 10, hday: 1, descAr: 'أوّل شوّال، عيد الفطر بعد إتمام صيام رمضان.', descEn: 'The first of Shawwāl — the festival after completing the Ramadan fast.' },
  { id: 'ashr', ar: 'عشر ذي الحجّة', en: 'First Ten of Dhul-Ḥijjah', hmonth: 12, hday: 1, descAr: 'أفضل أيّام الدنيا، يُستحبّ فيها الإكثار من العمل الصالح والذكر.', descEn: 'The best days of the year — a time to abound in righteous deeds and remembrance.', fasting: true },
  { id: 'arafah', ar: 'يوم عرفة (الوقفة)', en: 'Day of ʿArafah', hmonth: 12, hday: 9, descAr: 'وقفة عرفة، وصيامه لغير الحاجّ يُكفّر سنتين: الماضية والباقية.', descEn: 'The standing at ʿArafah; fasting it (for non-pilgrims) expiates two years — past and coming.', fasting: true },
  { id: 'eidadha', ar: 'عيد الأضحى المبارك', en: 'Eid al-Adha', hmonth: 12, hday: 10, descAr: 'عاشر ذي الحجّة، عيد النحر وأعظم أيّام السنة.', descEn: 'The tenth of Dhul-Ḥijjah — the festival of sacrifice and the greatest day of the year.' },
];

function hijri(d: Date): { d: number; m: number; y: number } {
  const parts = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { day: 'numeric', month: 'numeric', year: 'numeric' }).formatToParts(d);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return { d: get('day'), m: get('month'), y: get('year') };
}

/** The next Gregorian date (today or later) on which the given Hijri m/d falls. */
export function nextOccurrence(hmonth: number, hday: number, from = new Date()): Date {
  const start = new Date(from); start.setHours(0, 0, 0, 0);
  for (let i = 0; i < 400; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i);
    const h = hijri(d);
    if (h.m === hmonth && h.d === hday) return d;
  }
  return start; // fallback (should never hit within a lunar year)
}

export interface UpcomingOccasion extends Occasion { date: Date; daysUntil: number }

export function upcomingOccasions(from = new Date()): UpcomingOccasion[] {
  const start = new Date(from); start.setHours(0, 0, 0, 0);
  return OCCASIONS
    .map((o) => {
      const date = nextOccurrence(o.hmonth, o.hday, start);
      const daysUntil = Math.round((date.getTime() - start.getTime()) / 86400000);
      return { ...o, date, daysUntil };
    })
    .sort((a, b) => a.daysUntil - b.daysUntil);
}

const OCC_ID_BASE = 6000; // reserved id range for occasion reminders
const PREF_KEY = 'nur-occasion-reminders';

export function occasionRemindersOn(): boolean { return localStorage.getItem(PREF_KEY) === '1'; }

/**
 * Schedule a local reminder the evening before (18:00) and on the morning of
 * (08:00) each upcoming occasion. Safe no-op on web / without permission.
 */
export async function scheduleOccasionReminders(): Promise<boolean> {
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const perm = await LocalNotifications.requestPermissions().catch(() => null);
    if (!perm || perm.display !== 'granted') return false;

    const pending = await LocalNotifications.getPending().catch(() => ({ notifications: [] as { id: number }[] }));
    const ours = pending.notifications.filter((n) => n.id >= OCC_ID_BASE && n.id < OCC_ID_BASE + 1000);
    if (ours.length) await LocalNotifications.cancel({ notifications: ours.map((n) => ({ id: n.id })) }).catch(() => {});

    const isAr = (localStorage.getItem('nur-lang') || 'ar') === 'ar';
    const now = Date.now();
    const notifications: any[] = [];
    let id = OCC_ID_BASE;
    for (const o of upcomingOccasions()) {
      const eve = new Date(o.date); eve.setDate(o.date.getDate() - 1); eve.setHours(18, 0, 0, 0);
      const morn = new Date(o.date); morn.setHours(8, 0, 0, 0);
      const slots: [Date, boolean][] = [[eve, true], [morn, false]];
      for (const [at, isEve] of slots) {
        if (at.getTime() <= now + 60000) continue; // skip past times
        notifications.push({
          id: id++,
          title: isAr ? 'نُور · مناسبة' : 'Nur · Occasion',
          body: isEve
            ? (isAr ? `غدًا إن شاء الله: ${o.ar}` : `Tomorrow, in shāʾ Allāh: ${o.en}`)
            : (isAr ? `${o.ar} — تقبّل الله منّا ومنكم` : `${o.en} — may Allah accept from us all`),
          schedule: { at, allowWhileIdle: true },
          smallIcon: 'ic_stat_nur',
          largeIcon: 'nur_logo',
        });
      }
    }
    if (notifications.length) await LocalNotifications.schedule({ notifications });
    localStorage.setItem(PREF_KEY, '1');
    return true;
  } catch { return false; }
}

export async function cancelOccasionReminders(): Promise<void> {
  localStorage.setItem(PREF_KEY, '0');
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const pending = await LocalNotifications.getPending().catch(() => ({ notifications: [] as { id: number }[] }));
    const ours = pending.notifications.filter((n) => n.id >= OCC_ID_BASE && n.id < OCC_ID_BASE + 1000);
    if (ours.length) await LocalNotifications.cancel({ notifications: ours.map((n) => ({ id: n.id })) }).catch(() => {});
  } catch { /* ignore */ }
}

// Authoritative references for confirming month beginnings (moon sighting).
export const OCCASION_SOURCES: { ar: string; en: string; url: string }[] = [
  { ar: 'دار الإفتاء المصرية', en: 'Egyptian Dar al-Iftaa', url: 'https://www.dar-alifta.org/' },
  { ar: 'تقويم أم القرى (السعودية)', en: 'Umm al-Qura Calendar (KSA)', url: 'https://www.ummulqura.org.sa/' },
  { ar: 'Moonsighting.com', en: 'Moonsighting.com', url: 'https://www.moonsighting.com/' },
];
