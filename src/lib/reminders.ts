// Engine for "The Heartbeat" spiritual reminders:
//  • pickReminder(): weighted random with a rolling 14-day no-repeat ledger.
//  • scheduleSpiritualNudges(): gentle local notifications across the next days,
//    strictly avoiding the user's sleep window (23:30 – 04:30).

import { REMINDERS, type Reminder } from '@/data/reminders';
import { getCachedGeo } from '@/lib/permissions';
import { prayerDates } from '@/lib/prayer';

const LEDGER_KEY = 'nur-reminder-ledger';
const DND_KEY = 'nur-prayer-dnd';

/** In-app "Do Not Disturb during prayer" preference. */
export function isPrayerDnd(): boolean { return localStorage.getItem(DND_KEY) === '1'; }
export function setPrayerDnd(on: boolean): void {
  localStorage.setItem(DND_KEY, on ? '1' : '0');
  void scheduleSpiritualNudges(); // reschedule so the change takes effect
}

/** True if we're inside a prayer window now AND the user enabled prayer DND. */
export function isPrayerTimeNow(windowMin = 12): boolean {
  if (!isPrayerDnd()) return false;
  const geo = getCachedGeo();
  if (!geo) return false;
  const now = Date.now();
  return prayerDates(geo.lat, geo.lng, new Date()).some((p) => Math.abs(p.getTime() - now) <= windowMin * 60000);
}
const COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000; // 14 days
const NUDGE_ID_BASE = 5000; // reserved id range for spiritual nudges

type Ledger = Record<number, number>; // reminder index -> last shown (ms)

function readLedger(): Ledger {
  try { return JSON.parse(localStorage.getItem(LEDGER_KEY) || '{}'); } catch { return {}; }
}
function writeLedger(l: Ledger) {
  try { localStorage.setItem(LEDGER_KEY, JSON.stringify(l)); } catch { /* ignore */ }
}

/** Pick a reminder index that hasn't been shown within the cooldown window. */
function pickIndex(record: boolean): number {
  const now = Date.now();
  const ledger = readLedger();
  let eligible = REMINDERS.map((_, i) => i).filter((i) => !ledger[i] || now - ledger[i] > COOLDOWN_MS);
  if (eligible.length === 0) {
    // Pool exhausted → reset and reuse the oldest-seen first.
    eligible = REMINDERS.map((_, i) => i);
  }
  const idx = eligible[Math.floor(Math.random() * eligible.length)];
  if (record) {
    ledger[idx] = now;
    writeLedger(ledger);
  }
  return idx;
}

/** One reminder for on-open display (records it so notifications won't repeat it soon). */
export function pickReminder(): Reminder {
  return REMINDERS[pickIndex(true)];
}

/** A reminder without touching the ledger (for previews). */
export function peekReminder(): Reminder {
  return REMINDERS[pickIndex(false)];
}

// Hours of the day we allow a nudge (all outside the 23:30–04:30 sleep window).
const NUDGE_HOURS = [8, 13, 17, 21];

function inSleepWindow(d: Date): boolean {
  const mins = d.getHours() * 60 + d.getMinutes();
  // 23:30 (1410) .. 24:00, and 00:00 .. 04:30 (270)
  return mins >= 1410 || mins < 270;
}

/**
 * Schedule gentle reminders for the coming days. Safe no-op on web / when the
 * plugin or permission isn't available. Cancels its own previous schedule first.
 */
export async function scheduleSpiritualNudges(days = 5): Promise<void> {
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');

    const perm = await LocalNotifications.requestPermissions().catch(() => null);
    if (!perm || perm.display !== 'granted') return;

    // Clear our previous nudges so we don't pile up.
    const pending = await LocalNotifications.getPending().catch(() => ({ notifications: [] as { id: number }[] }));
    const ours = pending.notifications.filter((n) => n.id >= NUDGE_ID_BASE && n.id < NUDGE_ID_BASE + 1000);
    if (ours.length) await LocalNotifications.cancel({ notifications: ours.map((n) => ({ id: n.id })) }).catch(() => {});

    const now = new Date();
    const notifications: any[] = [];
    let id = NUDGE_ID_BASE;

    const dnd = isPrayerDnd();
    const geo = dnd ? getCachedGeo() : null;

    for (let day = 0; day < days; day++) {
      for (const hour of NUDGE_HOURS) {
        const at = new Date(now);
        at.setDate(now.getDate() + day);
        at.setHours(hour, 0, 0, 0);
        if (at.getTime() <= now.getTime() + 60_000) continue; // skip past times
        if (inSleepWindow(at)) continue;                       // respect sleep window
        if (dnd && geo) {
          // Don't disturb around prayer times (±25 min).
          const prayers = prayerDates(geo.lat, geo.lng, at);
          if (prayers.some((p) => Math.abs(p.getTime() - at.getTime()) <= 25 * 60000)) continue;
        }
        const r = REMINDERS[Math.floor(Math.random() * REMINDERS.length)];
        notifications.push({
          id: id++,
          title: 'نور · تذكير',
          body: r.ar,
          schedule: { at, allowWhileIdle: true },
          smallIcon: 'ic_stat_icon',
        });
      }
    }

    if (notifications.length) await LocalNotifications.schedule({ notifications });
  } catch {
    // plugin missing (web) or scheduling failed — ignore silently
  }
}
