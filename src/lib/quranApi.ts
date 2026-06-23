// Thin client for the Quran Foundation API (api.quran.com v4).
//
// Provides full-Quran verse text (word-by-word), per-ayah audio with *word
// timing segments* (for exact audio↔text sync), translations in many
// languages, and full-surah audio file URLs for downloading.

const API = 'https://api.quran.com/api/v4';
// Per-ayah recitation files are served here; verse.audio.url is relative to it.
const AUDIO_BASE = 'https://verses.quran.com/';

export interface NormWord {
  position: number;
  text: string;
  /** 'word' for actual words, 'end' for the ayah-number glyph. */
  charType: string;
  translation?: string;
  transliteration?: string;
}

export interface NormTranslation {
  id: number;
  text: string;
}

export interface NormVerse {
  key: string; // e.g. "7:2"
  ayah: number; // verse number within the surah
  textUthmani: string;
  /** Uthmani text with <tajweed class=…> spans for colour-coded rendering. */
  tajweedHtml: string;
  words: NormWord[];
  translations: NormTranslation[];
  /** Absolute per-ayah audio URL for the requested reciter. */
  audioUrl: string | null;
  /** Raw word-timing segments: each entry is [wordIndex, …, startMs, endMs]. */
  segments: number[][];
}

export interface SurahContent {
  chapter: number;
  reciterId: number;
  translationIds: number[];
  verses: NormVerse[];
}

export interface ChapterAudioFile {
  url: string;
  sizeBytes: number;
}

const stripTags = (s: string | null | undefined): string =>
  (s ?? '').replace(/<sup[^>]*>.*?<\/sup>/gi, '').replace(/<[^>]+>/g, '').trim();

/** Resolves a verse.audio.url (relative) to an absolute, playable URL. */
export function absoluteAudioUrl(relative: string | null | undefined): string | null {
  if (!relative) return null;
  if (/^https?:\/\//.test(relative)) return relative;
  // Some reciters return a protocol-relative URL on another host (e.g. Husary →
  // //mirrors.quranicaudio.com/...). Don't prepend the verses.quran.com base.
  if (relative.startsWith('//')) return 'https:' + relative;
  return AUDIO_BASE + relative.replace(/^\//, '');
}

interface RawWord {
  position: number;
  text_uthmani?: string;
  text?: string;
  char_type_name: string;
  translation?: { text: string | null };
  transliteration?: { text: string | null };
}
interface RawVerse {
  verse_key: string;
  verse_number: number;
  text_uthmani?: string;
  text_uthmani_tajweed?: string;
  words?: RawWord[];
  translations?: { resource_id: number; text: string }[];
  audio?: { url: string; segments?: number[][] };
}
interface RawResponse {
  verses: RawVerse[];
  pagination: { next_page: number | null; total_pages: number };
}

/**
 * Fetches a full surah: word-by-word Arabic, the chosen reciter's per-ayah
 * audio + timing segments, and the chosen translations. Paginates internally.
 */
export async function fetchSurahContent(
  chapter: number,
  opts: { reciterId: number; translationIds: number[]; signal?: AbortSignal },
): Promise<SurahContent> {
  const { reciterId, translationIds, signal } = opts;
  const verses: NormVerse[] = [];
  let page = 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const params = new URLSearchParams({
      language: 'en', // controls word-by-word translation/transliteration language
      words: 'true',
      word_fields: 'text_uthmani',
      fields: 'text_uthmani,text_uthmani_tajweed',
      audio: String(reciterId),
      per_page: '50',
      page: String(page),
    });
    if (translationIds.length) params.set('translations', translationIds.join(','));

    const res = await fetch(`${API}/verses/by_chapter/${chapter}?${params.toString()}`, { signal });
    if (!res.ok) throw new Error(`API ${res.status} for surah ${chapter}`);
    const data = (await res.json()) as RawResponse;

    for (const v of data.verses) {
      verses.push({
        key: v.verse_key,
        ayah: v.verse_number,
        textUthmani: v.text_uthmani ?? '',
        tajweedHtml: v.text_uthmani_tajweed ?? '',
        words: (v.words ?? []).map((w) => ({
          position: w.position,
          text: w.text_uthmani ?? w.text ?? '',
          charType: w.char_type_name,
          translation: w.translation?.text ?? undefined,
          transliteration: w.transliteration?.text ?? undefined,
        })),
        translations: (v.translations ?? []).map((t) => ({
          id: t.resource_id,
          text: stripTags(t.text),
        })),
        audioUrl: absoluteAudioUrl(v.audio?.url),
        segments: v.audio?.segments ?? [],
      });
    }

    if (!data.pagination.next_page) break;
    page = data.pagination.next_page;
  }

  return { chapter, reciterId, translationIds, verses };
}

export async function fetchChapterAudioFile(
  reciterId: number,
  chapter: number,
): Promise<ChapterAudioFile | null> {
  const res = await fetch(`${API}/chapter_recitations/${reciterId}/${chapter}`);
  if (!res.ok) return null;
  const data = (await res.json()) as { audio_file?: { audio_url: string; file_size: number } };
  if (!data.audio_file?.audio_url) return null;
  return { url: data.audio_file.audio_url, sizeBytes: data.audio_file.file_size };
}

export interface ApiTranslationInfo {
  id: number;
  name: string;
  languageName: string;
  authorName: string;
}

/** Returns a tafsir's HTML for a single ayah (e.g. verseKey "2:255"). */
export async function fetchTafsir(tafsirId: number, verseKey: string): Promise<string | null> {
  const res = await fetch(`${API}/tafsirs/${tafsirId}/by_ayah/${verseKey}`);
  if (!res.ok) return null;
  const data = (await res.json()) as { tafsir?: { text: string | null } };
  return data.tafsir?.text ?? null;
}

export async function fetchTranslationsList(): Promise<ApiTranslationInfo[]> {
  const res = await fetch(`${API}/resources/translations`);
  if (!res.ok) throw new Error(`API ${res.status} for translations list`);
  const data = (await res.json()) as {
    translations: { id: number; name: string; language_name: string; author_name: string }[];
  };
  return data.translations.map((t) => ({
    id: t.id,
    name: t.name,
    languageName: t.language_name,
    authorName: t.author_name,
  }));
}
