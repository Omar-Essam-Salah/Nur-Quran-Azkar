// Word-by-word helper for the reader and the paper Mushaf:
//   • per-word meaning + transliteration for a verse (fetched from quran.com,
//     cached in memory), and
//   • single-word recitation playback using the dedicated word-by-word audio
//     files (audio.qurancdn.com/wbw/…) — the same clear, one-word-at-a-time
//     recitation quran.com plays when you tap a word.
//
// Playback goes through the app-wide shared audio element (audioBus), so tapping
// a word cleanly interrupts any surah / page recitation instead of fighting it
// for the WebView's single media decoder.

import { audioEl, claimAudio, isOwner } from '@/lib/audioBus';

const pad3 = (n: number) => String(n).padStart(3, '0');

/** Deterministic URL of the word-by-word recitation for surah:ayah:word. */
export function wordAudioUrl(surah: number, ayah: number, position: number): string {
  return `https://audio.qurancdn.com/wbw/${pad3(surah)}_${pad3(ayah)}_${pad3(position)}.mp3`;
}

export interface WbwWord {
  position: number;
  text: string;
  translation?: string;
  transliteration?: string;
}

const wordCache = new Map<string, WbwWord[]>();

/** Per-word text + meaning + transliteration for a verse (cached in memory). */
export async function fetchVerseWords(verseKey: string, lang = 'en'): Promise<WbwWord[]> {
  const ck = `${verseKey}|${lang}`;
  const hit = wordCache.get(ck);
  if (hit) return hit;
  const res = await fetch(`https://api.quran.com/api/v4/verses/by_key/${verseKey}?words=true&word_fields=text_uthmani&language=${lang}`);
  if (!res.ok) throw new Error(`words ${res.status}`);
  const d = await res.json();
  const words: WbwWord[] = (d?.verse?.words ?? [])
    .filter((w: { char_type_name?: string }) => w.char_type_name === 'word')
    .map((w: { position: number; text_uthmani?: string; text?: string; translation?: { text?: string | null }; transliteration?: { text?: string | null } }) => ({
      position: w.position,
      text: w.text_uthmani ?? w.text ?? '',
      translation: w.translation?.text ?? undefined,
      transliteration: w.transliteration?.text ?? undefined,
    }));
  wordCache.set(ck, words);
  return words;
}

// ── Single-word playback on the shared audio element ──────────────────────
let owner = 0;
const listeners = new Set<() => void>();
let playingKey: string | null = null; // "surah:ayah:pos" currently sounding

export function subscribeWordAudio(fn: () => void): () => void { listeners.add(fn); return () => { listeners.delete(fn); }; }
export function wordPlaying(): string | null { return playingKey; }
function notify() { listeners.forEach((l) => l()); }

/** Play one word aloud (word-by-word recitation). Interrupts any other audio. */
export async function playWord(surah: number, ayah: number, position: number): Promise<void> {
  owner = claimAudio();
  playingKey = `${surah}:${ayah}:${position}`;
  notify();
  const a = audioEl();
  const clear = () => { if (isOwner(owner)) { playingKey = null; notify(); } };
  a.onended = clear;
  a.onerror = clear;
  try {
    a.src = wordAudioUrl(surah, ayah, position);
    a.load();                      // Android WebView: required on every src change
    await a.play();
  } catch { clear(); }
}

export function stopWord(): void {
  if (isOwner(owner)) { try { audioEl().pause(); } catch { /* ignore */ } playingKey = null; notify(); }
}
