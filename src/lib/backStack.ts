// A tiny stack of "back interceptors" so transient overlays (the Mushaf surah
// index, the tafsir sheet, popups…) can swallow the Android hardware-back press
// and close themselves, instead of letting the app navigate away or exit.
type Interceptor = () => boolean; // return true if it handled the back press

const stack: Interceptor[] = [];

/** Register an interceptor (most-recent wins). Returns an unregister fn. */
export function pushBack(fn: Interceptor): () => void {
  stack.push(fn);
  return () => {
    const i = stack.indexOf(fn);
    if (i >= 0) stack.splice(i, 1);
  };
}

/** Called by the global back handler first; true means an overlay handled it. */
export function runBack(): boolean {
  for (let i = stack.length - 1; i >= 0; i--) {
    if (stack[i]()) return true;
  }
  return false;
}
