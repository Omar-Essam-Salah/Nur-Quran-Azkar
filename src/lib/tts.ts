// Text-to-speech that reads ANY on-screen text aloud.
//
// On the device it uses the NATIVE @capacitor-community/text-to-speech plugin
// (the Android system TTS engine) — the Web Speech API is unreliable / absent in
// the Android WebView. Works offline once a voice for the language is installed.
// In a plain browser (dev) it falls back to window.speechSynthesis.
//
// Voice selection: the user can pick a preferred voice PER LANGUAGE (persisted);
// otherwise we auto-pick a MALE voice for BOTH Arabic and English (previously
// English fell back to the engine default, which was often female). A tiny
// pub/sub lets every "listen" button reflect whether it is the one speaking.

import { Capacitor } from '@capacitor/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';

const native = Capacitor.isNativePlatform();

type Listener = () => void;
const listeners = new Set<Listener>();
let speakingId = 0; // owner id currently speaking (0 = none)

export interface TtsVoice { key: string; name: string; lang: string; index: number }
let voiceList: TtsVoice[] = [];
let voicesLoaded = false;

export function ttsSupported(): boolean {
  if (native) return true;
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

async function loadVoices(): Promise<TtsVoice[]> {
  if (voicesLoaded) return voiceList;
  try {
    if (native) {
      const { voices } = await TextToSpeech.getSupportedVoices();
      voiceList = voices.map((v, i) => ({ key: v.voiceURI || v.name || String(i), name: v.name || v.voiceURI || v.lang, lang: v.lang || '', index: i }));
    } else if (ttsSupported()) {
      const vs = window.speechSynthesis.getVoices();
      voiceList = vs.map((v, i) => ({ key: v.voiceURI || v.name, name: v.name, lang: v.lang || '', index: i }));
    }
    voicesLoaded = voiceList.length > 0;
  } catch { /* ignore */ }
  return voiceList;
}
if (native) void loadVoices();
if (!native && ttsSupported()) {
  try { window.speechSynthesis.addEventListener('voiceschanged', () => { voicesLoaded = false; void loadVoices(); }); } catch { /* ignore */ }
}

/** All voices whose language matches the given prefix (e.g. 'ar', 'en'). */
export async function listVoices(langPrefix: string): Promise<TtsVoice[]> {
  await loadVoices();
  const p = langPrefix.slice(0, 2).toLowerCase();
  return voiceList.filter((v) => v.lang.toLowerCase().startsWith(p));
}

const prefKey = (lang: string) => `nur-tts-voice-${lang.slice(0, 2).toLowerCase()}`;
export function getPreferredVoice(lang: string): string | null { try { return localStorage.getItem(prefKey(lang)); } catch { return null; } }
export function setPreferredVoice(lang: string, key: string | null): void {
  try { if (key) localStorage.setItem(prefKey(lang), key); else localStorage.removeItem(prefKey(lang)); } catch { /* ignore */ }
}

const isMale = (s: string) => /(^|[^fe])male|-arm|_arm|\bard\b|\bman\b|rjl|ذكر|رجل/i.test(s) && !/female|woman/i.test(s);
const isFemale = (s: string) => /female|woman|\barf\b|-arf|_arf|أنثى|امرأة/i.test(s);

function pickVoiceFor(lang: string): TtsVoice | undefined {
  const p = lang.slice(0, 2).toLowerCase();
  const cands = voiceList.filter((v) => v.lang.toLowerCase().startsWith(p));
  if (!cands.length) return undefined;
  const pref = getPreferredVoice(lang);
  if (pref) { const f = cands.find((v) => v.key === pref); if (f) return f; }
  // Default: prefer an identifiable MALE voice; otherwise any non-female voice.
  return cands.find((v) => isMale(`${v.name} ${v.key}`))
    ?? cands.find((v) => !isFemale(`${v.name} ${v.key}`))
    ?? cands[0];
}

// Split long text into speakable chunks at sentence boundaries. Android's TTS
// engine silently truncates very long utterances; chunking also lets Stop
// interrupt promptly between sentences.
function chunkText(text: string, limit = 220): string[] {
  const parts = text.replace(/\s+/g, ' ').trim().split(/(?<=[.!?؟۔:،…\n])\s+/);
  const out: string[] = [];
  let buf = '';
  for (const p of parts) {
    if ((buf + ' ' + p).trim().length > limit && buf) { out.push(buf.trim()); buf = p; }
    else buf = (buf ? buf + ' ' : '') + p;
  }
  if (buf.trim()) out.push(buf.trim());
  return out.length ? out : [text];
}

function notify() { listeners.forEach((l) => l()); }
export function subscribeTTS(l: Listener): () => void { listeners.add(l); return () => { listeners.delete(l); }; }
export function speakingOwner(): number { return speakingId; }
let nextId = 1;
export function newSpeakerId(): number { return nextId++; }
function clearIf(id: number) { if (speakingId === id) { speakingId = 0; notify(); } }

/** Speak `text` on behalf of owner `id` (cancels anything already speaking). */
export function speakAs(id: number, text: string, opts: { lang?: string; rate?: number } = {}): void {
  if (!ttsSupported() || !text.trim()) return;
  const lang = opts.lang || 'ar-SA';
  speakingId = id; notify(); // optimistic → instant button feedback
  const chosen = pickVoiceFor(lang);

  if (native) {
    // rate 0.85 (slower = clearer, less robotic) + pitch 0.96 (natural, gently masculine).
    const base: Record<string, unknown> = { lang, rate: opts.rate ?? 0.85, pitch: 0.96, volume: 1.0, category: 'playback' };
    if (chosen) base.voice = chosen.index;
    void loadVoices();
    const chunks = chunkText(text);
    // Speak chunks one after another, but only while this owner is still active
    // (so Stop / a new speaker interrupts cleanly).
    const speakChunk = (i: number) => {
      if (speakingId !== id || i >= chunks.length) { clearIf(id); return; }
      TextToSpeech.speak({ ...base, text: chunks[i] } as unknown as { text: string; lang: string })
        .then(() => speakChunk(i + 1))
        .catch(() => clearIf(id));
    };
    // Flush anything currently playing, then start this one cleanly.
    TextToSpeech.stop().catch(() => {}).finally(() => speakChunk(0));
    return;
  }

  // Browser fallback.
  const synth = window.speechSynthesis;
  try { synth.cancel(); } catch { /* ignore */ }
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = opts.rate ?? 0.85;
  u.pitch = 0.96;
  if (chosen) { const v = synth.getVoices()[chosen.index]; if (v) u.voice = v; }
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
