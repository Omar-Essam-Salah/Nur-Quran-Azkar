import { useState, useEffect, useRef, useCallback, memo } from 'react';
import {
  ArrowLeft, Bookmark, BookmarkCheck, Share2, ChevronLeft, ChevronRight,
  Type, Languages, Play, Pause, Loader2, RefreshCw, WifiOff, BookOpen, X
} from 'lucide-react';
import { surahList } from '@/data/surahList';
import { getReciter, everyayahUrl } from '@/data/reciters';
import { DEFAULT_TRANSLATION_IDS, translationLabel } from '@/data/translations';
import { useTranslationsList } from '@/hooks/useTranslationsList';
import { useSurahAudio, type PlayerVerse } from '@/hooks/useSurahAudio';
import AudioPlayer from '@/components/AudioPlayer';
import { fetchSurahContent, type NormVerse, type SurahContent } from '@/lib/quranApi';
import { getContent, putContent, contentKey } from '@/lib/contentCache';
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

// ── Memoized ayah row (only the reciting ayah re-renders on word change) ──────
interface AyahViewProps {
  verse: NormVerse;
  fontSize: number;
  showTranslation: boolean;
  isActive: boolean;
  isPlaying: boolean;
  activeWord: number;
  bookmarked: boolean;
  labelFor: (id: number) => string;
  onToggleBookmark: (verse: NormVerse) => void;
  onTogglePlay: (ayah: number) => void;
  onOpenTafsir: (verse: NormVerse) => void;
}

const AyahView = memo(function AyahView({
  verse, fontSize, showTranslation, isActive, isPlaying, activeWord, bookmarked, labelFor, onToggleBookmark, onTogglePlay, onOpenTafsir
}: AyahViewProps) {
  const words = verse.words.filter((w) => w.charType === 'word');
  const [activeWordPopup, setActiveWordPopup] = useState<number | null>(null);

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
              onClick={() => navigator.clipboard?.writeText(`${verse.textUthmani}\n\n${verse.translations[0]?.text ?? ''}`)}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-all"
              aria-label="Copy"
            >
              <Share2 size={14} className="text-[color:var(--text-muted)]" />
            </button>
          </div>
        </div>

        {/* Arabic, word by word with Tafsir Popup and Tajweed Support */}
        <p dir="rtl" className="arabic-text text-white leading-loose flex flex-wrap gap-x-1.5 gap-y-1" style={{ fontSize: `${fontSize}px` }}>
          {words.map((w) => {
            const lit = isActive && activeWord === w.position;
            const wordTranslation = (w as any).translation?.text;
            const wordTransliteration = (w as any).transliteration?.text;
            
            return (
              <div key={w.position} className="relative inline-block">
                <span
                  onClick={() => setActiveWordPopup(activeWordPopup === w.position ? null : w.position)}
                  className="cursor-pointer rounded px-0.5 transition-colors"
                  style={lit ? { color: '#d4af37', background: 'rgba(212, 175, 55, 0.14)' } : undefined}
                  dangerouslySetInnerHTML={{ __html: w.text }}
                />
                
                {/* Word Meaning Popover */}
                {activeWordPopup === w.position && (wordTranslation || wordTransliteration) && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-max max-w-[140px] z-50 p-2 rounded-lg text-center"
                       style={{ background: 'rgba(var(--glass-1), 0.95)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
                    {wordTranslation && <p className="text-[11px] font-semibold text-white leading-tight">{wordTranslation}</p>}
                    {wordTransliteration && <p className="text-[9px] text-[#14879c] mt-1 uppercase tracking-wider">{wordTransliteration}</p>}
                  </div>
                )}
              </div>
            );
          })}
        </p>

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

  // Fetch Tafsir when modal opens or source changes
  useEffect(() => {
    if (!tafsirVerse) return;
    let active = true;
    setTafsirLoading(true);
    setTafsirData(null);
    fetch(`https://api.quran.com/api/v4/tafsirs/${tafsirId}/by_ayah/${surahNumber}:${tafsirVerse.ayah}`)
      .then(res => res.json())
      .then(data => {
        if (active && data.tafsir) {
          setTafsirData({ text: data.tafsir.text, name: data.tafsir.resource_name });
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setTafsirLoading(false);
      });
    return () => { active = false; };
  }, [tafsirVerse, tafsirId, surahNumber]);

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
  const handleTogglePlay = useCallback((ayah: number) => audio.toggle(ayah), [audio]);
  const handleOpenTafsir = useCallback((verse: NormVerse) => setTafsirVerse(verse), []);

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
            background: 'linear-gradient(135deg, rgba(var(--glass-1), 0.8), rgba(var(--glass-2), 0.9))',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderTop: '1px solid rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
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

        <div className="mx-auto max-w-lg mt-2 flex items-center justify-between px-2">
          <button
            onClick={() => goToSurah(surahNumber - 1)} disabled={surahNumber <= 1}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] text-[color:var(--text-muted)] hover:text-white hover:bg-white/5 transition-all disabled:opacity-30"
          >
            <ChevronLeft size={14} />
            {surahNumber > 1 ? surahList.find((s) => s.number === surahNumber - 1)?.englishName : ''}
          </button>
          <span className="text-[10px] text-[#14879c]">{surah.number} / 114</span>
          <button
            onClick={() => goToSurah(surahNumber + 1)} disabled={surahNumber >= 114}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] text-[color:var(--text-muted)] hover:text-white hover:bg-white/5 transition-all disabled:opacity-30"
          >
            {surahNumber < 114 ? surahList.find((s) => s.number === surahNumber + 1)?.englishName : ''}
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
                  bookmarked={isBookmarked('ayah', surah.number, v.ayah)}
                  labelFor={labelFor}
                  onToggleBookmark={handleToggleBookmark}
                  onTogglePlay={handleTogglePlay}
                  onOpenTafsir={handleOpenTafsir}
                />
              );
            })}
          </div>
        )}

        {/* Footer nav */}
        <div className="flex items-center justify-between pt-4">
          <button onClick={() => goToSurah(surahNumber - 1)} disabled={surahNumber <= 1} className="glass-btn flex items-center gap-2 px-4 py-2.5 text-sm disabled:opacity-30">
            <ChevronLeft size={16} /> {t('Previous', 'السابقة')}
          </button>
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-[10px] text-[color:var(--text-muted)] hover:text-white transition-colors">{t('Top', 'أعلى')}</button>
          <button onClick={() => goToSurah(surahNumber + 1)} disabled={surahNumber >= 114} className="glass-btn flex items-center gap-2 px-4 py-2.5 text-sm disabled:opacity-30">
            {t('Next', 'التالية')} <ChevronRight size={16} />
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