// ─────────────────────────────────────────────────────────────────────────
// audioBus — ONE shared HTMLAudioElement for the entire app.
//
// Every sound plays through this single element: the surah reciter, the
// Settings reciter preview, the prayer-times adhan (and its test button), and
// the Mushaf page recitation.
//
// WHY a singleton: Android's WebView exposes only a tiny pool of media
// decoders. Several independent <audio> elements competing for that pool — and
// especially one left stuck loading or in an error state — starve every other
// element. That was exactly the "the adhan froze, then the current reciter
// froze too — they're linked" bug: separate elements quietly fighting over one
// scarce resource. With a single element there is never more than one decoder
// in use, and claiming the element hard-resets it, so one stuck sound can never
// poison the next.
//
// Ownership model: a consumer calls claimAudio() to take the element (which
// hard-stops the previous owner and frees its decoder), stores the returned
// token, and gates its own event handlers with isOwner(token) so a stale
// owner's late callbacks don't fight the new one.
// ─────────────────────────────────────────────────────────────────────────

// A 0-length silent WAV used to "unlock" audio inside the first user gesture,
// so a later programmatic play() (which may run after an await, i.e. outside
// the gesture) isn't blocked by the browser's autoplay policy.
export const SILENT_AUDIO =
  'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';

let el: HTMLAudioElement | null = null;
let owner = 0;

/** The one shared audio element (created lazily). */
export function audioEl(): HTMLAudioElement {
  if (el === null && typeof Audio !== 'undefined') {
    el = new Audio();
    el.preload = 'auto';
  }
  return el as HTMLAudioElement;
}

/**
 * Take ownership of the shared element for a NEW playback. Hard-stops whatever
 * the previous owner was doing and resets the element to a clean slate so the
 * next `src` we assign loads reliably. Returns a token; store it and gate your
 * handlers with `isOwner(token)`.
 *
 * The reset (removeAttribute('src') + load()) is REQUIRED: unlike a freshly
 * created <audio>, this one element is reused across reciter/adhan/preview/
 * mushaf, and on Android WebView simply reassigning `.src` on a used element
 * doesn't always restart the load — playback would silently never begin. We use
 * removeAttribute (never src = '') so this reset doesn't itself raise an error.
 */
export function claimAudio(): number {
  const a = audioEl();
  if (a) {
    try { a.pause(); } catch { /* ignore */ }
    try { a.removeAttribute('src'); a.load(); } catch { /* ignore */ }
  }
  return ++owner;
}

/** True while `token` is still the current owner of the shared element. */
export function isOwner(token: number): boolean {
  return token === owner;
}

let unlocked = false;
/**
 * Warm up audio playback on a user gesture using a SEPARATE throwaway element
 * (never the shared one — a 0-length clip on the shared element would fire
 * spurious play/ended events and make it jump). This grants the document the
 * audio permission that the shared element then inherits. Safe to call many
 * times; only acts once.
 */
export function unlockAudio(): void {
  if (unlocked) return;
  unlocked = true;
  try {
    const s = new Audio(SILENT_AUDIO);
    s.volume = 0;
    const p = s.play();
    if (p) p.then(() => s.pause()).catch(() => { /* ignore */ });
  } catch { /* ignore */ }
}
