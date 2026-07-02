// Text-to-speech via the Web Speech API. Inside the Capacitor Android WebView
// this drives the device's OWN TTS engine (the same engine a native plugin would
// use), so it can read ANY text on screen and works offline once an Arabic voice
// is installed on the device. One utterance plays at a time; a tiny pub/sub lets
// every "listen" button reflect whether it is the one currently speaking.

type Listener = () => void;
const listeners = new Set<Listener>();
let speakingId = 0; // owner id currently speaking (0 = none)
let voices: SpeechSynthesisVoice[] = [];

export function ttsSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

if (ttsSupported()) {
  const load = () => { try { voices = window.speechSynthesis.getVoices(); } catch { /* ignore */ } };
  load();
  try { window.speechSynthesis.addEventListener('voiceschanged', load); } catch { /* ignore */ }
}

function notify() { listeners.forEach((l) => l()); }
export function subscribeTTS(l: Listener): () => void { listeners.add(l); return () => { listeners.delete(l); }; }
export function speakingOwner(): number { return speakingId; }

let nextId = 1;
export function newSpeakerId(): number { return nextId++; }

function pickVoice(lang: string): SpeechSynthesisVoice | undefined {
  if (!voices.length) { try { voices = window.speechSynthesis.getVoices(); } catch { /* ignore */ } }
  const p = lang.slice(0, 2).toLowerCase();
  // Prefer a higher-quality/local voice for the language when several exist.
  const matches = voices.filter((v) => (v.lang || '').toLowerCase().startsWith(p));
  return matches.find((v) => v.localService) ?? matches[0];
}

/** Speak `text` on behalf of owner `id` (cancels anything already speaking). */
export function speakAs(id: number, text: string, opts: { lang?: string; rate?: number } = {}): void {
  if (!ttsSupported() || !text.trim()) return;
  const synth = window.speechSynthesis;
  try { synth.cancel(); } catch { /* ignore */ }
  const u = new SpeechSynthesisUtterance(text);
  u.lang = opts.lang || 'ar-SA';
  u.rate = opts.rate ?? 0.9;
  const v = pickVoice(u.lang);
  if (v) u.voice = v;
  u.onstart = () => { speakingId = id; notify(); };
  u.onend = () => { if (speakingId === id) { speakingId = 0; notify(); } };
  u.onerror = () => { if (speakingId === id) { speakingId = 0; notify(); } };
  // Optimistic: some WebViews are slow to fire onstart — reflect it right away.
  speakingId = id; notify();
  synth.speak(u);
}

export function stopSpeaking(): void {
  if (!ttsSupported()) return;
  try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
  if (speakingId) { speakingId = 0; notify(); }
}
