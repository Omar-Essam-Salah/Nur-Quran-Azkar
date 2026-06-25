// Once-a-day background refresh, triggered whenever the device (re)gains
// connectivity. It nudges the service worker to pull a fresh build and lets any
// interested view re-validate its data by listening for the 'nur-sync' event.
// Everything degrades gracefully offline — this only ever runs when online.
const KEY = 'nur-last-sync';
const MIN_GAP = 22 * 60 * 60 * 1000; // ~once per day

let wired = false;

async function runSync(force = false): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
  const last = Number(localStorage.getItem(KEY) || 0);
  if (!force && Date.now() - last < MIN_GAP) return;
  localStorage.setItem(KEY, String(Date.now()));

  // Ask the service worker to check for a newer app/asset bundle.
  try {
    const regs = await navigator.serviceWorker?.getRegistrations?.();
    regs?.forEach((r) => { void r.update(); });
  } catch { /* no SW / not supported */ }

  // Let data-bound views (prayer times, etc.) refresh from the network.
  window.dispatchEvent(new Event('nur-sync'));
}

/** Call once at app start. Syncs now (if due) and on every reconnect. */
export function initDailySync(): void {
  if (wired) return;
  wired = true;
  void runSync();
  window.addEventListener('online', () => { void runSync(); });
}
