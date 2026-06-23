// Voluntary-fasting (صيام التطوّع) calendar — computed 100% locally from the
// Umm al-Qura Hijri calendar + local prayer times (imsak = Fajr, iftar = Maghrib).

import { computePrayerTimes } from './prayer';

export const HIJRI_MONTHS = [
  'محرّم', 'صفر', 'ربيع الأول', 'ربيع الآخر', 'جمادى الأولى', 'جمادى الآخرة',
  'رجب', 'شعبان', 'رمضان', 'شوّال', 'ذو القعدة', 'ذو الحجّة',
];

const WEEKDAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export interface FastRecommendation {
  key: string;
  label: string;
  virtue?: string;
}

export interface FastDay {
  date: Date;
  hijri: { day: number; month: number; year: number; monthName: string };
  weekday: string;
  recommendations: FastRecommendation[];
  forbidden?: string;
  imsak: string; // Fajr (end of suhoor)
  iftar: string; // Maghrib
}

export function hijriParts(date: Date): { day: number; month: number; year: number } {
  const parts = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
    day: 'numeric', month: 'numeric', year: 'numeric',
  }).formatToParts(date);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  return { day: get('day'), month: get('month'), year: get('year') };
}

export function hijriString(date = new Date()): string {
  const h = hijriParts(date);
  return `${h.day} ${HIJRI_MONTHS[h.month - 1]} ${h.year} هـ`;
}

/** Classifies a single day for voluntary fasting. */
export function classifyFasting(date: Date): { recs: FastRecommendation[]; forbidden?: string } {
  const { day, month } = hijriParts(date);
  const dow = date.getDay();
  const recs: FastRecommendation[] = [];

  // Days on which fasting is forbidden.
  if (month === 10 && day === 1) return { recs: [], forbidden: 'عيد الفطر — يحرُم صيامه' };
  if (month === 12 && day >= 10 && day <= 13) return { recs: [], forbidden: 'عيد الأضحى وأيام التشريق — يحرُم صيامها' };

  if (month === 9) recs.push({ key: 'ramadan', label: 'رمضان', virtue: 'فريضة' });

  // Day of Arafah (for non-pilgrims).
  if (month === 12 && day === 9) recs.push({ key: 'arafah', label: 'يوم عرفة', virtue: 'يُكفّر سنتين: الماضية والآتية' });
  // Ashura + Tasu'a.
  if (month === 1 && day === 10) recs.push({ key: 'ashura', label: 'عاشوراء', virtue: 'يُكفّر السنة الماضية' });
  if (month === 1 && day === 9) recs.push({ key: 'tasua', label: 'تاسوعاء', virtue: 'مخالفةً لليهود' });
  // The white days (13, 14, 15).
  if (day === 13 || day === 14 || day === 15) recs.push({ key: 'white', label: 'الأيام البيض', virtue: 'ثلاثة من كل شهر كصيام الدهر' });
  // Six days of Shawwal.
  if (month === 10 && day >= 2 && day <= 8) recs.push({ key: 'shawwal', label: 'ست من شوّال', virtue: 'مع رمضان كصيام الدهر' });
  // Sha'ban (the Prophet ﷺ fasted much of it).
  if (month === 8 && day <= 28) recs.push({ key: 'shaban', label: 'صيام شعبان', virtue: 'كان النبي ﷺ يُكثر الصيام فيه' });
  // Weekly: Monday & Thursday.
  if (dow === 1) recs.push({ key: 'mon', label: 'صيام الإثنين', virtue: 'تُعرض فيه الأعمال على الله' });
  if (dow === 4) recs.push({ key: 'thu', label: 'صيام الخميس', virtue: 'تُعرض فيه الأعمال على الله' });

  return { recs };
}

/** Upcoming days (within `days`) that are recommended fasts, with imsak/iftar. */
export function getUpcomingFasts(lat: number, lng: number, from = new Date(), days = 45): FastDay[] {
  const out: FastDay[] = [];
  const start = new Date(from);
  start.setHours(0, 0, 0, 0);
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const { recs, forbidden } = classifyFasting(d);
    if (!recs.length) continue;
    const h = hijriParts(d);
    const t = computePrayerTimes(lat, lng, d);
    out.push({
      date: d,
      hijri: { ...h, monthName: HIJRI_MONTHS[h.month - 1] },
      weekday: WEEKDAYS[d.getDay()],
      recommendations: recs,
      forbidden,
      imsak: t.Fajr,
      iftar: t.Maghrib,
    });
  }
  return out;
}
