import { useState, useEffect, useRef, useCallback, memo } from 'react';
import {
  ArrowLeft, Bookmark, BookmarkCheck, Share2, ChevronLeft, ChevronRight,
  Type, Languages, Play, Pause, Loader2, RefreshCw, WifiOff, BookOpen, X, Brain, Volume2
} from 'lucide-react';
import { playWord, subscribeWordAudio, wordPlaying } from '@/lib/wordByWord';
import { shareVerseCard } from '@/lib/shareVerse';
import { surahList } from '@/data/surahList';
import { getReciter, everyayahUrl } from '@/data/reciters';
import { DEFAULT_TRANSLATION_IDS, translationLabel } from '@/data/translations';
import { useTranslationsList } from '@/hooks/useTranslationsList';
import { useSurahAudio, type PlayerVerse } from '@/hooks/useSurahAudio';
import AudioPlayer from '@/components/AudioPlayer';
import { fetchSurahContent, type NormVerse, type SurahContent } from '@/lib/quranApi';
import { getContent, putContent, contentKey, getTafsirText } from '@/lib/contentCache';
import { loadLocalSurah } from '@/lib/localQuran';
import { useI18n } from '@/i18n';
import type { AppSettings } from '@/types';

interface QuranReaderProps {
  surahNumber: number;
  initialAyah?: number;
  onBack: () => void;
  onBookmark: (bookmark: { type: 'ayah'; surahNumber: number; ayahNumber: number; text: string; translation: string }) => void;
  isBookmarked: (type: string, surahNumber?: number, ayahNumber?: number) => boolean;
  updateLastRead: (surahNumber: number, ayahNumber: number) => void;
  settings: AppSettings;
}

// A tapped word, lifted to the page so its meaning shows in ONE bottom bar
// (never a floating tooltip that covers the lines you're reading).
interface WordSel { surah: number; ayah: number; position: number; text: string; translation?: string; transliteration?: string }

// ── Memoized ayah row (only the reciting ayah re-renders on word change) ──────
interface AyahViewProps {
  verse: NormVerse;
  fontSize: number;
  showTranslation: boolean;
  isActive: boolean;
  isPlaying: boolean;
  activeWord: number;
  selectedWord: number;
  bookmarked: boolean;
  memorize: boolean;
  labelFor: (id: number) => string;
  onToggleBookmark: (verse: NormVerse) => void;
  onTogglePlay: (ayah: number) => void;
  onOpenTafsir: (verse: NormVerse) => void;
  onShare: (verse: NormVerse) => void;
  onWordTap: (w: WordSel) => void;
}

const AyahView = memo(function AyahView({
  verse, fontSize, showTranslation, isActive, isPlaying, activeWord, selectedWord, bookmarked, memorize, labelFor, onToggleBookmark, onTogglePlay, onOpenTafsir, onShare, onWordTap
}: AyahViewProps) {
  const words = verse.words.filter((w) => w.charType === 'word');
  const [surahNo, ayahNo] = verse.key.split(':').map(Number);
  const [revealed, setRevealed] = useState(false);
  // When memorization mode is toggled, re-hide every ayah so you test fresh.
  useEffect(() => { setRevealed(false); }, [memorize]);
  const hidden = memorize && !revealed;

  return (
    <div id={`ayah-${verse.ayah}`} className="group relative">
      <div
        className="glass-card-sm p-5 space-y-3 transition-all"
        style={isActive ? {
          boxShadow: '0 0 0 1px rgba(20, 135, 156, 0.6), 0 0 24px rgba(20, 135, 156, 0.15)',
          background: 'linear-gradient(135deg, rgba(20, 135, 156, 0.10), rgba(255, 255, 255, 0.02))',
        } : undefined}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-[#14879c]/15 flex items-center justify-center text-[10px] font-bold text-[#14879c]">
              {verse.ayah}
            </span>
            <button
              onClick={() => onTogglePlay(verse.ayah)}
              className="w-7 h-7 rounded-full flex items-center justify-center transition-all hover:bg-white/10"
              style={isActive ? { background: 'rgba(20, 135, 156, 0.2)' } : undefined}
              aria-label={isPlaying ? 'Pause ayah' : 'Play ayah'}
              title="Play this ayah"
            >
              {isPlaying
                ? <Pause size={12} className="text-[#14879c]" fill="currentColor" />
                : <Play size={12} className="text-[#14879c] ml-0.5" fill="currentColor" />}
            </button>
          </div>
          <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onOpenTafsir(verse)}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-all"
              aria-label="Tafsir"
              title="Read Tafsir"
            >
              <BookOpen size={14} className="text-[color:var(--text-muted)] hover:text-[#14879c]" />
            </button>
            <button
              onClick={() => onToggleBookmark(verse)}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-all"
              aria-label="Bookmark"
            >
              {bookmarked
                ? <BookmarkCheck size={14} className="text-[#d4af37]" />
                : <Bookmark size={14} className="text-[color:var(--text-muted)]" />}
            </button>
            <button
              onClick={() => onShare(verse)}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-all"
              aria-label="Share"
              title="Share as image"
            >
              <Share2 size={14} className="text-[color:var(--text-muted)]" />
            </button>
          </div>
        </div>

        {/* Arabic, word by word with Tafsir Popup and Tajweed Support.
            In memorization mode the text is blurred until you tap to reveal. */}
        <div className="relative">
        {hidden && (
          <button onClick={() => setRevealed(true)}
            className="absolute inset-0 z-20 flex items-center justify-center rounded-lg"
            style={{ background: 'rgba(8,29,35,0.25)' }}>
            <span className="text-[11px] text-[#d4af37] arabic-text px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(212,175,55,0.16)', border: '1px solid rgba(212,175,55,0.35)' }}>
              {'اضغط للكشف · اختبر حفظك'}
            </span>
          </button>
        )}
        <p dir="rtl" className="arabic-text text-white leading-loose flex flex-wrap gap-x-1.5 gap-y-1 transition-all"
          style={{ fontSize: `${fontSize}px`, filter: hidden ? 'blur(9px)' : undefined, opacity: hidden ? 0.55 : 1 }}>
          {words.map((w) => {
            const lit = isActive && activeWord === w.position;
            const picked = selectedWord === w.position;
            return (
              <span
                key={w.position}
                onClick={() => onWordTap({ surah: surahNo, ayah: ayahNo, position: w.position, text: w.text, translation: w.translation, transliteration: w.transliteration })}
                className="cursor-pointer rounded px-0.5 transition-colors"
                style={(lit || picked) ? { color: '#d4af37', background: 'rgba(212, 175, 55, 0.16)' } : undefined}
              >
                {w.text}
              </span>
            );
          })}
        </p>
        </div>

        {showTranslation && verse.translations.map((t) => (
          <div key={t.id} className="border-t border-white/5 pt-3">
            <p className="text-[9px] uppercase tracking-wider text-[#14879c]/70 mb-1">{labelFor(t.id)}</p>
            <p className="text-sm text-[color:var(--text-muted)] leading-relaxed">{t.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
});

export default function QuranReader({
  surahNumber, initialAyah, onBack, onBookmark, isBookmarked, updateLastRead, settings,
}: QuranReaderProps) {
  const { t, lang } = useI18n();
  const [showTranslation, setShowTranslation] = useState(settings.showTranslation);
  const [fontSize, setFontSize] = useState(settings.arabicFontSize);
  const [showControls, setShowControls] = useState(false);
  const [memorize, setMemorize] = useState(false); // hide-to-test memorization
  const [content, setContent] = useState<SurahContent | null>(null);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const contentRef = useRef<HTMLDivElement>(null);

  // Tafsir Modal State
  const [tafsirVerse, setTafsirVerse] = useState<NormVerse | null>(null);
  const [tafsirData, setTafsirData] = useState<{ text: string, name: string } | null>(null);
  const [tafsirLoading, setTafsirLoading] = useState(false);
  const [tafsirId, setTafsirId] = useState(91); // 91 = Saadi, 16 = Muyassar, 14 = Ibn Kathir, 169 = EN

  const TAFSIRS = [
    { id: 16, name: 'الميسر' },
    { id: 91, name: 'السعدي' },
    { id: 14, name: 'ابن كثير' },
    { id: 169, name: 'Ibn Kathir (EN)' },
  ];

  const surah = surahList.find((s) => s.number === surahNumber);
  const reciter = getReciter(settings.reciter);
  const translationIds = settings.translationIds?.length ? settings.translationIds : DEFAULT_TRANSLATION_IDS;
  const trKey = translationIds.join(',');
  const { list: trCatalogue } = useTranslationsList();

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setContent(null);
    setLoadState('loading');
    const key = contentKey(surahNumber, reciter.apiId, translationIds);

    (async () => {
      // 1) Best case: previously-cached full content (text + audio + segments).
      const cached = await getContent(key).catch(() => undefined);
      if (active && cached) {
        setContent(cached);
        setLoadState('ready');
      }

      // 2) Otherwise show the bundled local text immediately — works offline.
      if (active && !cached) {
        const local = await loadLocalSurah(surahNumber);
        if (active && local) {
          setContent(local);
          setLoadState('ready');
        }
      }

      // 3) Enrich from the network when online: audio + word-timing segments +
      //    the user's selected translations + tajweed. Cached for next time.
      try {
        const fresh = await fetchSurahContent(surahNumber, {
          reciterId: reciter.apiId,
          translationIds,
          signal: controller.signal,
        });
        if (!active) return;
        setContent(fresh);
        setLoadState('ready');
        void putContent(key, fresh);
      } catch (err) {
        if ((err as Error)?.name === 'AbortError' || !active) return;
        // Offline / failed: keep cached-or-local if we have it; else show error.
        setLoadState((s) => (s === 'ready' ? 'ready' : 'error'));
      }
    })();

    return () => {
      active = false;
      controller.abort();
    };
  }, [surahNumber, reciter.apiId, trKey]);

  // Load Tafsir when modal opens or source changes — OFFLINE-FIRST: use the
  // downloaded pack (IndexedDB) if present, otherwise fetch (and the SW caches).
  useEffect(() => {
    if (!tafsirVerse) return;
    let active = true;
    setTafsirLoading(true);
    setTafsirData(null);
    const verseKey = `${surahNumber}:${tafsirVerse.ayah}`;
    const name = TAFSIRS.find((x) => x.id === tafsirId)?.name ?? 'التفسير';
    (async () => {
      const local = await getTafsirText(tafsirId, verseKey).catch(() => undefined);
      if (!active) return;
      if (local) { setTafsirData({ text: local, name }); setTafsirLoading(false); return; }
      try {
        const res = await fetch(`https://api.quran.com/api/v4/tafsirs/${tafsirId}/by_ayah/${verseKey}`);
        const data = await res.json();
        if (active && data.tafsir) setTafsirData({ text: data.tafsir.text, name: data.tafsir.resource_name });
      } catch { /* offline & not downloaded */ }
      finally { if (active) setTafsirLoading(false); }
    })();
    return () => { active = false; };
  }, [tafsirVerse, tafsirId, surahNumber, lang]);

  const playerVerses: PlayerVerse[] = content
    ? content.verses.map((v) => ({
        ayah: v.ayah,
        // everyayah reciters aren't on the API → build their per-ayah URL locally.
        audioUrl: reciter.everyayah ? everyayahUrl(reciter.everyayah, surahNumber, v.ayah) : v.audioUrl,
        segments: reciter.everyayah ? [] : v.segments,
      }))
    : [];
  const audio = useSurahAudio({ reciterApiId: reciter.apiId, chapter: surahNumber, verses: playerVerses });

  useEffect(() => {
    updateLastRead(surahNumber, initialAyah || 1);
  }, [surahNumber, initialAyah, updateLastRead]);

  useEffect(() => {
    if (initialAyah && loadState === 'ready') {
      document.getElementById(`ayah-${initialAyah}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [initialAyah, loadState]);

  useEffect(() => {
    if (audio.playingAyah) {
      document.getElementById(`ayah-${audio.playingAyah}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [audio.playingAyah]);

  // While reciting with the Tafsir sheet open, follow the recitation: when the
  // audio advances to the next ayah, swap the Tafsir to that ayah automatically.
  useEffect(() => {
    if (!tafsirVerse || !content) return;
    const ayah = audio.playingAyah;
    if (ayah == null || ayah === tafsirVerse.ayah) return;
    const next = content.verses.find((v) => v.ayah === ayah);
    if (next) setTafsirVerse(next);
  }, [audio.playingAyah, tafsirVerse, content]);

  const goToSurah = useCallback((n: number) => {
    if (n >= 1 && n <= 114) {
      window.dispatchEvent(new CustomEvent('navigate-to-surah', { detail: { surahNumber: n } }));
    }
  }, []);

  const labelFor = useCallback((id: number) => translationLabel(id, trCatalogue), [trCatalogue]);
  const handleToggleBookmark = useCallback((verse: NormVerse) => {
    onBookmark({
      type: 'ayah',
      surahNumber,
      ayahNumber: verse.ayah,
      text: verse.textUthmani,
      translation: verse.translations[0]?.text ?? '',
    });
  }, [onBookmark, surahNumber]);
  // Keep this callback STABLE: `audio` is a fresh object every render (it carries
  // progress/word state that ticks during playback). If the callback changed
  // each render, every memo'd AyahView would re-render ~4×/sec while reciting —
  // the stutter you'd see in the snow and the word highlight. Route through a ref.
  const audioApiRef = useRef(audio);
  audioApiRef.current = audio;
  const handleTogglePlay = useCallback((ayah: number) => audioApiRef.current.toggle(ayah), []);
  const handleOpenTafsir = useCallback((verse: NormVerse) => setTafsirVerse(verse), []);

  // ── Word-by-word bottom bar (shared, single popup) ──
  const [wordPopup, setWordPopup] = useState<WordSel | null>(null);
  useEffect(() => { setWordPopup(null); }, [surahNumber]); // close it when the surah changes
  const handleWordTap = useCallback((w: WordSel) => { setWordPopup(w); void playWord(w.surah, w.ayah, w.position); }, []);
  // Step to the previous / next word — continues across ayah boundaries.
  const stepWord = useCallback((delta: number) => {
    if (!content) return;
    setWordPopup((prev) => {
      if (!prev) return prev;
      const verses = content.verses;
      let vi = verses.findIndex((v) => v.ayah === prev.ayah);
      if (vi < 0) return prev;
      let list = verses[vi].words.filter((w) => w.charType === 'word');
      let pos = prev.position + delta;
      while (pos < 1) { if (vi === 0) return prev; vi -= 1; list = verses[vi].words.filter((w) => w.charType === 'word'); pos += list.length; }
      while (pos > list.length) { if (vi >= verses.length - 1) return prev; pos -= list.length; vi += 1; list = verses[vi].words.filter((w) => w.charType === 'word'); }
      const w = list[pos - 1]; if (!w) return prev;
      const v = verses[vi];
      const surah = Number(v.key.split(':')[0]);
      void playWord(surah, v.ayah, w.position);
      if (v.ayah !== prev.ayah) document.getElementById(`ayah-${v.ayah}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return { surah, ayah: v.ayah, position: w.position, text: w.text, translation: w.translation, transliteration: w.transliteration };
    });
  }, [content]);
  const handleShare = useCallback((verse: NormVerse) => {
    const sName = surahList.find((s) => s.number === surahNumber)?.name ?? '';
    void shareVerseCard({
      arabic: verse.textUthmani,
      translation: verse.translations[0]?.text ?? '',
      reference: `${sName} · ${t('Ayah', 'آية')} ${verse.ayah}`,
    });
  }, [surahNumber, t]);

  if (!surah) return null;
  const bismillah = surah.number !== 9 && surah.number !== 1;

  return (
    <div className="page-enter min-h-screen">
      <style>{`
        .tafsir-html * { color: inherit !important; background: transparent !important; }
        .tafsir-html h1, .tafsir-html h2, .tafsir-html h3 { color: #14879c !important; font-size: 1.1em; margin-bottom: 0.5em; font-weight: bold; }
      `}</style>
      
      {/* Header */}
      <header className="sticky top-0 z-40 px-4 py-3">
        <div
          className="mx-auto max-w-lg flex items-center gap-3 rounded-2xl px-4 py-3"
          style={{
            // Opaque (no blur) so scrolling while reciting stays smooth.
            background: 'linear-gradient(135deg, rgb(var(--glass-1)), rgb(var(--glass-2)))',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderTop: '1px solid rgba(255, 255, 255, 0.15)',
          }}
        >
          <button onClick={onBack} className="p-2 rounded-xl hover:bg-white/10 transition-all">
            <ArrowLeft size={18} className="text-[color:var(--text-muted)]" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className={`text-base font-semibold text-white truncate ${lang === 'ar' ? 'arabic-text' : ''}`}>{lang === 'ar' ? surah.name : surah.englishName}</h1>
            <p className={`text-[10px] text-[color:var(--text-muted)] ${lang === 'ar' ? '' : 'arabic-text'}`}>{lang === 'ar' ? surah.englishName : surah.name} · {surah.verses} {t('verses', 'آية')}</p>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setMemorize((m) => !m)} className="p-2 rounded-xl hover:bg-white/10 transition-all"
              title={t('Memorization mode (hide to test yourself)', 'وضع الحفظ (إخفاء النص لاختبار نفسك)')}>
              <Brain size={16} className={memorize ? 'text-[#d4af37]' : 'text-[color:var(--text-muted)]'} />
            </button>
            <button onClick={() => setShowControls(!showControls)} className="p-2 rounded-xl hover:bg-white/10 transition-all">
              <Type size={16} className="text-[color:var(--text-muted)]" />
            </button>
            <button onClick={() => setShowTranslation(!showTranslation)} className="p-2 rounded-xl hover:bg-white/10 transition-all">
              <Languages size={16} className={showTranslation ? 'text-[#14879c]' : 'text-[color:var(--text-muted)]'} />
            </button>
          </div>
        </div>

        {showControls && (
          <div
            className="mx-auto max-w-lg mt-2 p-3 rounded-xl flex items-center gap-4"
            style={{
              background: 'linear-gradient(135deg, rgba(var(--glass-1), 0.9), rgba(var(--glass-2), 0.95))',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <span className="text-[10px] text-[color:var(--text-muted)] uppercase">{t('Font', 'الخط')}</span>
            <input
              type="range" min={16} max={48} value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#14879c]"
            />
            <span className="text-xs font-semibold text-[#14879c] w-14 text-right tabular-nums">
              {Math.round((fontSize / 24) * 100)}%
            </span>
          </div>
        )}

        {/* RTL mushaf order: the NEXT surah is on the LEFT, the PREVIOUS on the
            right — like turning pages of an Arabic book (right → left). */}
        <div className="mx-auto max-w-lg mt-2 flex items-center justify-between px-2">
          <button
            onClick={() => goToSurah(surahNumber + 1)} disabled={surahNumber >= 114}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] text-[color:var(--text-muted)] hover:text-white hover:bg-white/5 transition-all disabled:opacity-30"
          >
            <ChevronLeft size={14} />
            {surahNumber < 114 ? surahList.find((s) => s.number === surahNumber + 1)?.englishName : ''}
          </button>
          <span className="text-[10px] text-[#14879c]">{surah.number} / 114</span>
          <button
            onClick={() => goToSurah(surahNumber - 1)} disabled={surahNumber <= 1}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] text-[color:var(--text-muted)] hover:text-white hover:bg-white/5 transition-all disabled:opacity-30"
          >
            {surahNumber > 1 ? surahList.find((s) => s.number === surahNumber - 1)?.englishName : ''}
            <ChevronRight size={14} />
          </button>
        </div>
      </header>

      <div ref={contentRef} className="px-4 pt-4 pb-36 max-w-lg mx-auto space-y-4">
        {/* Surah info */}
        <div className="glass-card p-6 text-center space-y-3">
          <div className="relative inline-block">
            <svg viewBox="0 0 100 100" className="w-20 h-20 mx-auto">
              <polygon points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5" fill="none" stroke="#14879c" strokeWidth="0.5" opacity="0.3" />
              <polygon points="50,15 85,32.5 85,67.5 50,85 15,67.5 15,32.5" fill="none" stroke="#d4af37" strokeWidth="0.5" opacity="0.3" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-white arabic-text">{surah.name}</span>
            </div>
          </div>
          <div>
            <h2 className={`text-lg font-semibold text-white ${lang === 'ar' ? 'arabic-text' : ''}`}>{lang === 'ar' ? surah.name : surah.englishName}</h2>
            {lang !== 'ar' && <p className="text-xs text-[color:var(--text-muted)]">{surah.englishNameTranslation}</p>}
          </div>
          <div className="flex items-center justify-center gap-3">
            <span className="text-[10px] px-2 py-1 rounded-full arabic-text" style={{ background: surah.type === 'Meccan' ? 'rgba(20,135,156,0.15)' : 'rgba(212,175,55,0.15)', color: surah.type === 'Meccan' ? '#14879c' : '#d4af37' }}>{t(surah.type, surah.type === 'Meccan' ? 'مكية' : 'مدنية')}</span>
            <span className="text-[10px] text-[color:var(--text-muted)] arabic-text" dir={lang === 'ar' ? 'rtl' : 'ltr'}>{surah.verses} {t('Verses', 'آية')} · {lang === 'ar' ? reciter.arabicName : reciter.name}</span>
          </div>
        </div>

        {bismillah && (
          <div className="text-center py-2">
            <p className="arabic-text text-[#d4af37] gold-glow" style={{ fontSize: `${Math.round(fontSize * 1.2)}px` }}>
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </p>
          </div>
        )}

        {/* Verses */}
        {loadState === 'loading' && (
          <div className="glass-card p-10 flex flex-col items-center gap-3">
            <Loader2 size={28} className="text-[#14879c] animate-spin" />
            <p className="text-sm text-[color:var(--text-muted)]">{t('Loading', 'جارٍ تحميل')} {surah.englishName}…</p>
          </div>
        )}

        {loadState === 'error' && (
          <div className="glass-card p-8 text-center space-y-4">
            <WifiOff size={28} className="text-[#f59e0b] mx-auto" />
            <p className="text-sm text-white">{t('Couldn’t load this surah', 'تعذّر تحميل هذه السورة')}</p>
            <p className="text-xs text-[color:var(--text-muted)]">{t('You’re offline and it isn’t saved yet. Connect once to cache it for offline use.', 'أنت غير متصل ولم تُحفظ بعد. اتصل مرة واحدة لحفظها للاستخدام دون إنترنت.')}</p>
            <button
              onClick={() => { setLoadState('loading'); setContent(null); window.dispatchEvent(new CustomEvent('navigate-to-surah', { detail: { surahNumber } })); }}
              className="glass-btn inline-flex items-center gap-2 px-6 py-3 text-sm"
            >
              <RefreshCw size={16} /> {t('Retry', 'إعادة المحاولة')}
            </button>
          </div>
        )}

        {loadState === 'ready' && content && (
          <div className="space-y-4">
            {content.verses.map((v) => {
              const isActive = audio.playingAyah === v.ayah;
              return (
                <AyahView
                  key={v.ayah}
                  verse={v}
                  fontSize={fontSize}
                  showTranslation={showTranslation}
                  isActive={isActive}
                  isPlaying={isActive && audio.isPlaying}
                  activeWord={isActive ? audio.currentWord : 0}
                  selectedWord={wordPopup?.ayah === v.ayah ? wordPopup.position : 0}
                  bookmarked={isBookmarked('ayah', surah.number, v.ayah)}
                  memorize={memorize}
                  labelFor={labelFor}
                  onToggleBookmark={handleToggleBookmark}
                  onTogglePlay={handleTogglePlay}
                  onOpenTafsir={handleOpenTafsir}
                  onShare={handleShare}
                  onWordTap={handleWordTap}
                />
              );
            })}
          </div>
        )}

        {/* Footer nav — RTL: Next on the left, Previous on the right. */}
        <div className="flex items-center justify-between pt-4">
          <button onClick={() => goToSurah(surahNumber + 1)} disabled={surahNumber >= 114} className="glass-btn flex items-center gap-2 px-4 py-2.5 text-sm disabled:opacity-30">
            <ChevronLeft size={16} /> {t('Next', 'التالية')}
          </button>
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-[10px] text-[color:var(--text-muted)] hover:text-white transition-colors">{t('Top', 'أعلى')}</button>
          <button onClick={() => goToSurah(surahNumber - 1)} disabled={surahNumber <= 1} className="glass-btn flex items-center gap-2 px-4 py-2.5 text-sm disabled:opacity-30">
            {t('Previous', 'السابقة')} <ChevronRight size={16} />
          </button>
        </div>
        <div className="h-8" />
      </div>

      {/* Tafsir Modal */}
      {tafsirVerse && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 transition-all page-enter">
          <div className="w-full max-w-lg bg-[color:var(--app-bg)] border border-white/10 rounded-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
              <div>
                <h3 className="text-white font-semibold text-sm arabic-text">{t('Tafsir · Ayah', 'تفسير · آية')} {tafsirVerse.ayah}</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  {TAFSIRS.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setTafsirId(t.id)}
                      className={`text-[10px] px-2.5 py-1 rounded-full transition-colors ${tafsirId === t.id ? 'bg-[#14879c] text-white' : 'bg-white/10 text-[color:var(--text-muted)] hover:bg-white/20'}`}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={() => setTafsirVerse(null)} className="p-2 rounded-lg hover:bg-white/10 text-[color:var(--text-muted)] transition-colors self-start">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 overflow-y-auto custom-scrollbar flex-1 text-[color:var(--text-muted)] text-[15px] leading-loose arabic-text" dir={tafsirId === 169 ? 'ltr' : 'rtl'}>
              {tafsirLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin text-[#14879c]" size={28} /></div>
              ) : tafsirData ? (
                <div dangerouslySetInnerHTML={{ __html: tafsirData.text }} className="tafsir-html" />
              ) : (
                <p className="text-center py-10 arabic-text">{t('Tafsir not available. Check your connection.', 'التفسير غير متاح. تحقّق من اتصالك بالإنترنت.')}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Word-by-word bar — pinned above the player so it never covers the āyāt. */}
      {wordPopup && <ReaderWordPopup entry={wordPopup} onStep={stepWord} onClose={() => setWordPopup(null)} />}

      {/* Recitation player */}
      <AudioPlayer
        reciter={reciter}
        chapter={surahNumber}
        surahEnglishName={surah.englishName}
        surahName={surah.name}
        verses={playerVerses}
        audio={audio}
      />
    </div>
  );
}

// A single word-by-word bar pinned to the bottom (above the player). Shows the
// tapped word's meaning + transliteration, replays it, and steps through the
// words one by one (‹ prev · next ›), continuing across āyāt.
function ReaderWordPopup({ entry, onStep, onClose }: { entry: WordSel; onStep: (d: number) => void; onClose: () => void }) {
  const { t } = useI18n();
  const [, force] = useState(0);
  useEffect(() => subscribeWordAudio(() => force((n) => n + 1)), []);
  const sounding = wordPlaying() === `${entry.surah}:${entry.ayah}:${entry.position}`;
  return (
    <div className="fixed inset-x-0 z-[60] px-3 pointer-events-none" style={{ bottom: 'calc(5.5rem + env(safe-area-inset-bottom))' }}>
      <div className="mx-auto max-w-lg rounded-2xl p-3 pointer-events-auto relative"
        style={{ background: 'linear-gradient(135deg, rgb(var(--glass-1)), rgb(var(--glass-2)))', border: '1px solid rgba(212,175,55,0.3)', boxShadow: '0 -6px 26px rgba(0,0,0,0.4)' }}>
        <button onClick={onClose} className="absolute top-2 left-2 p-1 rounded-lg hover:bg-white/10" aria-label={t('Close', 'إغلاق')}>
          <X size={15} className="text-[color:var(--text-muted)]" />
        </button>
        <p className="arabic-text text-2xl text-[#d4af37] text-center leading-tight" dir="rtl">{entry.text}</p>
        {entry.transliteration && <p className="text-[11px] text-[#14879c] italic text-center mt-0.5" dir="ltr">{entry.transliteration}</p>}
        <p className="text-[13px] text-white text-center mt-0.5" dir="ltr">{entry.translation ?? t('Meaning needs a connection', 'المعنى يحتاج اتصالاً')}</p>
        {/* Labelled so the direction is unmistakable: LEFT = next word (Arabic
            reads right-to-left, so the next word is to the left). */}
        <div className="flex items-center justify-center gap-3 mt-2.5">
          <button onClick={() => onStep(1)} className="px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-1 text-[color:var(--text-muted)]" aria-label={t('Next word', 'الكلمة التالية')}>
            <ChevronLeft size={16} /> <span className="text-[10px] arabic-text">{t('Next', 'التالية')}</span>
          </button>
          <button onClick={() => void playWord(entry.surah, entry.ayah, entry.position)}
            className="w-11 h-11 rounded-full flex items-center justify-center active:scale-95 transition-transform flex-shrink-0"
            style={{ background: 'rgba(212,175,55,0.16)', border: '1px solid rgba(212,175,55,0.35)' }} aria-label={t('Play word', 'انطق الكلمة')}>
            <Volume2 size={19} className={sounding ? 'text-[#d4af37]' : 'text-[#14879c]'} />
          </button>
          <button onClick={() => onStep(-1)} className="px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-1 text-[color:var(--text-muted)]" aria-label={t('Previous word', 'الكلمة السابقة')}>
            <span className="text-[10px] arabic-text">{t('Prev', 'السابقة')}</span> <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}