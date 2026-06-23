// Fully-local prayer-time calculation (no external API).
// Uses the `adhan` library for astronomical timings and the Intl Islamic
// calendar for the Hijri date — so prayer times work 100% offline.

import { Coordinates, CalculationMethod, PrayerTimes, Madhab } from 'adhan';

export type PrayerName = 'Fajr' | 'Sunrise' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';
export type Timings = Record<PrayerName, string>;

const fmt = (d: Date) =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

/** Computes today's prayer times locally (Egyptian method, Shafi asr). */
export function computePrayerTimes(lat: number, lng: number, date = new Date()): Timings {
  const coords = new Coordinates(lat, lng);
  const params = CalculationMethod.Egyptian();
  params.madhab = Madhab.Shafi;
  const pt = new PrayerTimes(coords, date, params);
  return {
    Fajr: fmt(pt.fajr),
    Sunrise: fmt(pt.sunrise),
    Dhuhr: fmt(pt.dhuhr),
    Asr: fmt(pt.asr),
    Maghrib: fmt(pt.maghrib),
    Isha: fmt(pt.isha),
  };
}

/** The five obligatory prayer times as Date objects (for windows / DND). */
export function prayerDates(lat: number, lng: number, date = new Date()): Date[] {
  const coords = new Coordinates(lat, lng);
  const params = CalculationMethod.Egyptian();
  params.madhab = Madhab.Shafi;
  const pt = new PrayerTimes(coords, date, params);
  return [pt.fajr, pt.dhuhr, pt.asr, pt.maghrib, pt.isha];
}

/** Local Hijri date string (no network). */
export function getHijriDate(date = new Date(), locale = 'en'): string {
  try {
    return new Intl.DateTimeFormat(`${locale}-u-ca-islamic`, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return '';
  }
}
