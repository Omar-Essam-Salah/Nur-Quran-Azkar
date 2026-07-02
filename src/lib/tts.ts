// Text-to-speech that reads ANY on-screen text aloud.
//
// On the device it uses the NATIVE @capacitor-community/text-to-speech plugin
// (the Android system TTS engine) — the Web Speech API is unreliable / absent in
// the Android WebView, which is why the buttons appeared to "do nothing". It
// works offline once an Arabic voice is installed on the device. In a plain
// browser (dev) it falls back to window.speechSynthesis. A tiny pub/sub lets
// every "listen" button reflect whether it is the one currently speaking.

import { Capacitor } from '@capacitor/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';

const native = Capacitor.isNativePlatform();

type Listener = () => void;
const listeners = new Set<Listener>();
let speakingId = 0; // owner id currently speaking (0 = none)

export function ttsSupported(): boolean {
  if (native) return true;
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

function notify() { listeners.forEach((l) => l()); }
export function subscribeTTS(l: Listener): () => void { listeners.add(l); return () => { listeners.delete(l); }; }
export function speakingOwner(): number { return speakingId; }

let nextId = 1;
export function newSpeakerId(): number { return nextId++; }

function clearIf(id: number) { if (speakingId === id) { speakingId = 0; notify(); } }

// ── Web fallback (browser dev) ──
let webVoices: SpeechSynthesisVoice[] = [];
if (!native && ttsSupported()) {
  const load = () => { try { webVoices = window.speechSynthesis.getVoices(); } catch { /* ignore */ } };
  load();
  try { window.speechSynthesis.addEventListener('voiceschanged', load); } catch { /* ignore */ }
}
function webPick(lang: string): SpeechSynthesisVoice | undefined {
  const p = lang.slice(0, 2).toLowerCase();
  const m = webVoices.filter((v) => (v.lang || '').toLowerCase().startsWith(p));
  return m.find((v) => v.localService) ?? m[0];
}

/** Speak `text` on behalf of owner `id` (cancels anything already speaking). */
export function speakAs(id: number, text: string, opts: { lang?: string; rate?: number } = {}): void {
  if (!ttsSupported() || !text.trim()) return;
  const lang = opts.lang || 'ar-SA';
  speakingId = id; notify(); // optimistic → instant button feedback

  if (native) {
    // A new speak flushes the previous one; resolve fires when it finishes.
    TextToSpeech.speak({ text, lang, rate: opts.rate ?? 1.0, pitch: 1.0, volume: 1.0, category: 'playback' })
      .then(() => clearIf(id))
      .catch(() => clearIf(id));
    return;
  }

  // Browser fallback.
  const synth = window.speechSynthesis;
  try { synth.cancel(); } catch { /* ignore */ }
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = opts.rate ?? 0.9;
  const v = webPick(lang);
  if (v) u.voice = v;
  u.onend = () => clearIf(id);
  u.onerror = () => clearIf(id);
  synth.speak(u);
}

export function stopSpeaking(): void {
  const wasId = speakingId;
  if (native) { TextToSpeech.stop().catch(() => {}); }
  else if (ttsSupported()) { try { window.speechSynthesis.cancel(); } catch { /* ignore */ } }
  if (wasId) { speakingId = 0; notify(); }
}
