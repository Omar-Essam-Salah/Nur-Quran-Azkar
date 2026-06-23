// Request the permissions the app needs up-front, on launch, instead of only
// when the user first opens Qibla / Prayer Times. Safe no-op on web.

export async function requestStartupPermissions(): Promise<void> {
  // 1) Notifications (prayer alerts + gentle reminders).
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.requestPermissions().catch(() => {});
  } catch { /* not native */ }

  // 2) Location — prompt at launch and cache the position so Qibla & Prayer
  //    Times resolve instantly afterwards.
  try {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          try {
            localStorage.setItem('nur-geo', JSON.stringify({
              lat: pos.coords.latitude, lng: pos.coords.longitude, t: Date.now(),
            }));
          } catch { /* ignore */ }
        },
        () => { /* denied / unavailable — Qibla will fall back to a default */ },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 },
      );
    }
  } catch { /* ignore */ }
}

/** Cached last-known location (set by requestStartupPermissions), if any. */
export function getCachedGeo(): { lat: number; lng: number } | null {
  try {
    const g = JSON.parse(localStorage.getItem('nur-geo') || 'null');
    return g && typeof g.lat === 'number' ? { lat: g.lat, lng: g.lng } : null;
  } catch { return null; }
}
