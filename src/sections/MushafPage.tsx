import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, Bookmark, BookmarkCheck, ListTree, X, Play, Pause, BookOpen, Search } from 'lucide-react';
import { getReciter, everyayahUrl } from '@/data/reciters';
import { absoluteAudioUrl } from '@/lib/quranApi';
import { audioEl, claimAudio, isOwner } from '@/lib/audioBus';
import { pushBack } from '@/lib/backStack';
import { loadAyahRange } from '@/lib/localQuran';
import { surahList } from '@/data/surahList';
import { startPageForSurah } from '@/data/mushafPages';
import { loadPageTokens, keysFromTokens, type PageToken } from '@/lib/mushafText';
import { useI18n } from '@/i18n';

interface MushafPageProps {
  onBack: () => void;
  initialPage?: number;
}

const TOTAL_PAGES = 604;

// Page on which each Juz' begins (standard Madani mushaf).
const JUZ_START_PAGES = [
  1, 22, 42, 62, 82, 102, 121, 142, 162, 182, 201, 222, 242, 262, 282,
  302, 322, 342, 362, 382, 402, 422, 442, 462, 482, 502, 522, 542, 562, 582,
];
const juzForPage = (page: number) => {
  let juz = 1;
  for (let i = 0; i < JUZ_START_PAGES.length; i++) if (page >= JUZ_START_PAGES[i]) juz = i + 1;
  return juz;
};

const toArabicDigits = (n: number) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[+d]);

// Which word (1-based) is sounding at `ms`, from the reciter's timing segments.
// Each segment is [wordIndex, …, startMs, endMs]; returns 0 if none/between.
function wordAt(segments: number[][], ms: number): number {
  for (const seg of segments) {
    if (seg.length < 2) continue;
    const start = seg[seg.length - 2], end = seg[seg.length - 1];
    if (ms >= start && ms < end) return seg[0] + 1;
  }
  return 0;
}

export default function MushafPage({ onBack, initialPage }: MushafPageProps) {
  const { t } = useI18n();
  const [page, setPage] = useState(() => {
    if (initialPage) return Math.min(Math.max(1, initialPage), TOTAL_PAGES);
    const saved = Number(localStorage.getItem('nur-mushaf-page'));
    return saved >= 1 && saved <= TOTAL_PAGES ? saved : 1;
  });
  const [tokens, setTokens] = useState<PageToken[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [bookmarks, setBookmarks] = useState<number[]>(() => {
    try { return JSON.parse(localStorage.getItem('nur-mushaf-bookmarks') || '[]'); } catch { return []; }
  });
  const touchStartX = useRef<number | null>(null);
  const [pageStr, setPageStr] = useState(String(page));
  const [showIndex, setShowIndex] = useState(false);
  const [indexQuery, setIndexQuery] = useState('');
  const [chrome, setChrome] = useState(true); // top/bottom bars visible (tap page to hide)
  const [fontSize, setFontSize] = useState<number>(() => {
    const v = Number(localStorage.getItem('nur-mushaf-font'));
    return v >= 1 && v <= 3.4 ? v : 1.6;
  });

  // Which surah the current page belongs to (for highlighting in the index).
  const currentSurahNumber = useMemo(() => {
    let n = 1;
    for (let i = 0; i < surahList.length; i++) if (page >= startPageForSurah(i + 1)) n = i + 1;
    return n;
  }, [page]);
  const currentSurah = surahList.find((s) => s.number === currentSurahNumber);
  useEffect(() => { setPageStr(String(page)); }, [page]);

  // ── Page recitation audio (plays the current page's verses in sequence,
  //    then auto-advances to the next page). Online feature. ──
  const reciter = useMemo(() => {
    try { return getReciter(JSON.parse(localStorage.getItem('nur-settings') || '{}').reciter); }
    catch { return getReciter(undefined); }
  }, []);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const ownerRef = useRef(0); // our claim on the app-wide shared audio element
  const playlistRef = useRef<{ url: string; key?: string; segments?: number[][] }[]>([]);
  const idxRef = useRef(0);
  const playingPageRef = useRef<number>(page);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [currentVerseKey, setCurrentVerseKey] = useState<string | null>(null);
  const [currentWord, setCurrentWord] = useState(0); // word position being recited (0 = none / no timing)
  const [tafsirFollow, setTafsirFollow] = useState(false);
  const [pageVerseKeys, setPageVerseKeys] = useState<string[]>([]);
  const audioPlayingRef = useRef(false);
  audioPlayingRef.current = audioPlaying;

  const loadAndPlayPage = async (p: number) => {
    try {
      setAudioLoading(true);
      playingPageRef.current = p;
      ownerRef.current = claimAudio(); // take the shared element (frees adhan/preview)
      let items: { url: string; key?: string }[];
      if (reciter.everyayah) {
        const res = await fetch(`https://api.quran.com/api/v4/verses/by_page/${p}?per_page=50&fields=verse_key`);
        const data = await res.json();
        items = ((data?.verses ?? []) as { verse_key: string }[]).map((v) => {
          const [s, a] = v.verse_key.split(':').map(Number);
          return { url: everyayahUrl(reciter.everyayah!, s, a), key: v.verse_key };
        });
      } else {
        const res = await fetch(`https://api.quran.com/api/v4/recitations/${reciter.apiId}/by_page/${p}`);
        const data = await res.json();
        items = ((data?.audio_files ?? []) as { url: string; verse_key?: string; segments?: number[][] }[])
          .map((f) => ({ url: absoluteAudioUrl(f.url) as string, key: f.verse_key, segments: f.segments }))
          .filter((x) => x.url);
      }
      playlistRef.current = items;
      idxRef.current = 0;
      setCurrentWord(0);
      setAudioLoading(false);
      if (!items.length) { setAudioPlaying(false); return; }
      setCurrentVerseKey(items[0].key ?? null);
      const a = ensureAudioEl();
      a.src = items[0].url;
      await a.play();
      setAudioPlaying(true);
    } catch { setAudioLoading(false); setAudioPlaying(false); }
  };

  const ensureAudioEl = (): HTMLAudioElement => {
    const a = audioEl();
    a.onplay = () => { if (!isOwner(ownerRef.current)) return; document.body.classList.add('reciting'); };
    a.onpause = () => { if (!isOwner(ownerRef.current)) return; document.body.classList.remove('reciting'); };
    a.onerror = () => { if (!isOwner(ownerRef.current)) return; document.body.classList.remove('reciting'); setAudioPlaying(false); setAudioLoading(false); };
    a.ontimeupdate = () => {
      if (!isOwner(ownerRef.current)) return;
      const seg = playlistRef.current[idxRef.current]?.segments;
      setCurrentWord(seg && seg.length ? wordAt(seg, a.currentTime * 1000) : 0);
    };
    a.onended = () => {
      if (!isOwner(ownerRef.current)) return;
      idxRef.current += 1;
      setCurrentWord(0);
      if (idxRef.current < playlistRef.current.length) {
        const it = playlistRef.current[idxRef.current];
        setCurrentVerseKey(it.key ?? null);
        a.src = it.url;
        void a.play().catch(() => {});
      } else {
        const np = playingPageRef.current + 1; // page finished → continue reading
        if (np <= TOTAL_PAGES) { slideDirRef.current = 1; setPage(np); void loadAndPlayPage(np); }
        else setAudioPlaying(false);
      }
    };
    audioElRef.current = a;
    return a;
  };

  const toggleAudio = () => {
    const a = audioEl();
    if (audioPlaying) { a.pause(); setAudioPlaying(false); return; }
    if (isOwner(ownerRef.current) && a.src && a.paused && playingPageRef.current === page && playlistRef.current.length) {
      ensureAudioEl();
      void a.play(); setAudioPlaying(true); return;
    }
    void loadAndPlayPage(page);
  };

  // If the user navigates to another page mid-recitation, follow them.
  useEffect(() => {
    if (audioPlaying && playingPageRef.current !== page) void loadAndPlayPage(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Stop audio on unmount (only if we still own the shared element).
  useEffect(() => () => { if (isOwner(ownerRef.current)) { try { audioEl().pause(); } catch { /* ignore */ } document.body.classList.remove('reciting'); } }, []);

  // Load the page's text tokens (offline) and keep the tafsir ayah-keys in sync.
  const scrollRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const pinchRef = useRef<{ startDist: number; startFont: number } | null>(null);
  const slideDirRef = useRef(1);
  const pageRef = useRef(page);
  pageRef.current = page;
  useEffect(() => {
    let active = true;
    setPageLoading(true);
    loadPageTokens(page).then((tk) => {
      if (!active) return;
      setTokens(tk);
      const keys = keysFromTokens(tk);
      setPageVerseKeys(keys);
      if (tafsirFollow && !audioPlayingRef.current) setCurrentVerseKey(keys[0] ?? null);
      setPageLoading(false);
      scrollRef.current?.scrollTo({ top: 0 });
    });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const commitPage = () => {
    const n = Number(pageStr);
    if (n >= 1 && n <= TOTAL_PAGES) { slideDirRef.current = n >= page ? 1 : -1; setPage(n); }
    else setPageStr(String(page));
  };

  const isBookmarked = bookmarks.includes(page);
  const toggleBookmark = () => {
    setBookmarks((prev) => {
      const next = prev.includes(page) ? prev.filter((p) => p !== page) : [...prev, page].sort((a, b) => a - b);
      localStorage.setItem('nur-mushaf-bookmarks', JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => { localStorage.setItem('nur-mushaf-page', String(page)); }, [page]);

  const turn = (dir: number) => {
    const from = pageRef.current;
    const to = Math.min(TOTAL_PAGES, Math.max(1, from + dir));
    if (to === from) return;
    slideDirRef.current = dir;
    setPage(to);
  };
  const goNext = () => turn(1);
  const goPrev = () => turn(-1);

  // Tap a word → show its ayah's tafsir; swipe → turn the page; tap blank → bars.
  const onWord = (key: string) => {
    setCurrentVerseKey(key);
    setPageVerseKeys((prev) => (prev.length ? prev : keysFromTokens(tokens)));
    setTafsirFollow(true);
    setChrome(true);
  };
  // Two-finger pinch zooms the text. We preview with a GPU transform during the
  // gesture, then commit the new font size on release (so it reflows crisply).
  const dist2 = (tl: React.TouchList) => Math.hypot(tl[0].clientX - tl[1].clientX, tl[0].clientY - tl[1].clientY);
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      pinchRef.current = { startDist: dist2(e.touches), startFont: fontSize };
      if (paperRef.current) { paperRef.current.style.transformOrigin = 'center top'; paperRef.current.style.willChange = 'transform'; }
      touchStartX.current = null;
    } else {
      touchStartX.current = e.touches[0].clientX;
    }
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchRef.current && paperRef.current) {
      const scale = Math.min(2.2, Math.max(0.6, dist2(e.touches) / pinchRef.current.startDist));
      paperRef.current.style.transform = `scale(${scale})`;
    }
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (pinchRef.current && paperRef.current) {
      const m = /scale\(([\d.]+)\)/.exec(paperRef.current.style.transform);
      const scale = m ? parseFloat(m[1]) : 1;
      paperRef.current.style.transform = '';
      paperRef.current.style.willChange = '';
      const nf = Math.min(3.4, Math.max(1.0, Math.round(pinchRef.current.startFont * scale * 100) / 100));
      pinchRef.current = null;
      setFontSize(nf);
      try { localStorage.setItem('nur-mushaf-font', String(nf)); } catch { /* ignore */ }
      return;
    }
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) {
      if (dx > 0) goNext();
      else goPrev();
    } else if (Math.abs(dx) < 10 && !(e.target as HTMLElement).closest('.mushaf-word')) {
      setChrome((c) => !c);
    }
    touchStartX.current = null;
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goPrev();
      if (e.key === 'ArrowLeft') goNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Keep the verse being recited in view (the page follows the recitation).
  useEffect(() => {
    if (!audioPlaying || !currentVerseKey) return;
    const el = scrollRef.current?.querySelector("[data-reciting='true']") as HTMLElement | null;
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [currentVerseKey, audioPlaying]);

  // Hardware back closes an open overlay (index / tafsir) and stays on the Mushaf.
  useEffect(() => { if (showIndex) return pushBack(() => { setShowIndex(false); return true; }); }, [showIndex]);
  useEffect(() => { if (tafsirFollow) return pushBack(() => { setTafsirFollow(false); return true; }); }, [tafsirFollow]);

  const openTafsir = () => setTafsirFollow((v) => {
    const nv = !v;
    if (nv && !currentVerseKey) setCurrentVerseKey(pageVerseKeys[0] ?? keysFromTokens(tokens)[0] ?? null);
    return nv;
  });

  return (
    <div className="page-enter mushaf-stage" style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>
      {/* Slim top pill — surah · juz · page (slides away with the side bar). */}
      <div className="fixed top-0 inset-x-0 z-40 flex justify-center px-3 pointer-events-none transition-transform duration-300 ease-out"
        style={{ paddingTop: 'calc(0.4rem + env(safe-area-inset-top))', transform: chrome ? 'none' : 'translateY(-180%)' }}>
        <div className="px-3 py-1 rounded-full" style={{ background: 'rgba(8,29,35,0.82)', border: '1px solid rgba(212,175,55,0.25)' }}>
          <p className="text-[10px] font-semibold text-white arabic-text whitespace-nowrap">سورة {currentSurah?.name ?? ''} · {t('Juz', 'ج')} {juzForPage(page)} · {t('p.', 'ص')} {page}/{TOTAL_PAGES}</p>
        </div>
      </div>

      {/* Ivory FULL-SCREEN page; every word is tappable; pinch to zoom. */}
      <div
        ref={scrollRef}
        className="absolute inset-0 overflow-auto select-none mushaf-scroll"
        style={{ paddingTop: 'calc(0.3rem + env(safe-area-inset-top))', paddingBottom: 'calc(0.3rem + env(safe-area-inset-bottom))' }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          ref={paperRef}
          key={page}
          className="mushaf-paper"
          style={{ animation: `${slideDirRef.current >= 0 ? 'mushaf-in-fwd' : 'mushaf-in-back'} 0.3s ease-out both` }}
        >
          {pageLoading ? (
            <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
              <Loader2 size={26} className="animate-spin" style={{ color: '#c9a227' }} />
            </div>
          ) : (
            <p className="mushaf-paper-inner" dir="rtl" style={{ fontSize: `${fontSize}rem` }}>
              {tokens.map((tk, i) => {
                if (tk.kind === 'surah') {
                  const name = surahList.find((s) => s.number === tk.surah)?.name ?? '';
                  return (
                    <span key={`s${i}`} className="mushaf-surah-block">
                      <span className="mushaf-surah-name">سورة {name}</span>
                      {tk.bismillah && <span className="mushaf-bismillah">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</span>}
                    </span>
                  );
                }
                if (tk.kind === 'end') {
                  return <span key={`e${i}`} className="mushaf-ayah-end">{toArabicDigits(tk.num)}</span>;
                }
                const active = tafsirFollow && tk.key === currentVerseKey;
                const reciting = audioPlaying && tk.key === currentVerseKey;
                const recitingWord = reciting && currentWord > 0 && tk.pos === currentWord;
                return (
                  <span
                    key={i}
                    className="mushaf-word"
                    data-active={active ? 'true' : undefined}
                    data-reciting={reciting ? 'true' : undefined}
                    data-reciting-word={recitingWord ? 'true' : undefined}
                    onClick={() => onWord(tk.key)}
                  >
                    {tk.text}{' '}
                  </span>
                );
              })}
            </p>
          )}
        </div>
      </div>

      {/* Compact vertical SIDE BAR — slides off the left edge so it never sits on
          top of the text. Tap a blank area of the page to show/hide it. */}
      <div className="fixed left-0 z-40 transition-transform duration-300 ease-out"
        style={{ top: '50%', transform: chrome ? 'translateY(-50%)' : 'translate(-130%, -50%)' }}>
        <div className="flex flex-col items-center gap-1 py-2 px-1 rounded-r-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(16,34,29,0.94), rgba(13,28,24,0.94))',
            border: '1px solid rgba(212,175,55,0.18)', borderLeft: 'none',
            boxShadow: '4px 0 22px rgba(0,0,0,0.45)',
            backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
          }}>
          <button onClick={onBack} className="p-2 rounded-lg hover:bg-white/10 transition-all" aria-label="Back">
            <ArrowLeft size={17} className="text-[color:var(--text-muted)]" />
          </button>
          <div className="w-5 h-px bg-white/10" />
          <button onClick={goNext} disabled={page >= TOTAL_PAGES} className="p-2 rounded-lg hover:bg-white/10 transition-all disabled:opacity-30" aria-label="Next page">
            <ChevronLeft size={18} className="text-white" />
          </button>
          <input type="number" inputMode="numeric" min={1} max={TOTAL_PAGES} value={pageStr}
            onChange={(e) => setPageStr(e.target.value)} onBlur={commitPage}
            onKeyDown={(e) => { if (e.key === 'Enter') { commitPage(); (e.currentTarget as HTMLInputElement).blur(); } }}
            className="w-9 px-0.5 py-1 rounded-md bg-white/5 text-center text-[11px] text-white outline-none" title={t('Page number', 'رقم الصفحة')} />
          <button onClick={goPrev} disabled={page <= 1} className="p-2 rounded-lg hover:bg-white/10 transition-all disabled:opacity-30" aria-label="Previous page">
            <ChevronRight size={18} className="text-white" />
          </button>
          <div className="w-5 h-px bg-white/10" />
          <button onClick={() => setShowIndex(true)} className="p-2 rounded-lg hover:bg-white/10 transition-all" aria-label="Index" title={t('Index', 'الفهرس')}>
            <ListTree size={16} className="text-[#14879c]" />
          </button>
          <button onClick={openTafsir} className="p-2 rounded-lg hover:bg-white/10 transition-all" aria-label="Tafsir" title={t('Tafsir', 'التفسير')}>
            <BookOpen size={16} className={tafsirFollow ? 'text-[#d4af37]' : 'text-[#14879c]'} />
          </button>
          <button onClick={toggleAudio} className="p-2 rounded-lg hover:bg-white/10 transition-all" aria-label="Recite" title={t('Recite', 'تلاوة')}>
            {audioLoading ? <Loader2 size={16} className="text-[#14879c] animate-spin" /> : audioPlaying ? <Pause size={16} className="text-[#14879c]" fill="currentColor" /> : <Play size={16} className="text-[#14879c]" fill="currentColor" />}
          </button>
          <button onClick={toggleBookmark} className="p-2 rounded-lg hover:bg-white/10 transition-all" aria-label="Bookmark page">
            {isBookmarked ? <BookmarkCheck size={16} className="text-[#d4af37]" /> : <Bookmark size={16} className="text-[color:var(--text-muted)]" />}
          </button>
        </div>
      </div>

      {/* Floating tafsir window — opens on a word tap or follows recitation. */}
      {tafsirFollow && currentVerseKey && (
        <MushafTafsirPanel verseKey={currentVerseKey} keys={pageVerseKeys} onSelect={setCurrentVerseKey} onClose={() => setTafsirFollow(false)} />
      )}

      {/* Page index (jump to any surah) */}
      {showIndex && (
        <div className="fixed inset-0 z-[70] flex flex-col" style={{ background: 'rgba(var(--glass-2), 0.98)', backdropFilter: 'blur(6px)' }}>
          <div className="sticky top-0 px-4 py-3 flex items-center gap-3 border-b border-white/10">
            <button onClick={() => setShowIndex(false)} className="p-2 rounded-xl hover:bg-white/10">
              <X size={18} className="text-white" />
            </button>
            <h2 className="text-base font-semibold text-white arabic-text flex-1">{t('Surah index', 'فهرس السور')}</h2>
          </div>
          <div className="px-4 pt-3 max-w-lg mx-auto w-full">
            <div className="relative">
              <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--text-muted)]" />
              <input
                value={indexQuery}
                onChange={(e) => setIndexQuery(e.target.value)}
                placeholder={t('Search by surah name or number…', 'ابحث باسم السورة أو رقمها…')}
                className="w-full pr-9 pl-3 py-2.5 rounded-xl bg-white/5 text-sm text-white arabic-text text-right outline-none border border-transparent focus:border-[#14879c]/40 placeholder:text-[color:var(--text-muted)]/60"
                dir="rtl"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3 max-w-lg mx-auto w-full space-y-1.5">
            {surahList
              .filter((s) => {
                const q = indexQuery.trim();
                if (!q) return true;
                return s.name.includes(q) || s.englishName.toLowerCase().includes(q.toLowerCase()) || String(s.number) === q;
              })
              .map((s) => {
                const sp = startPageForSurah(s.number);
                const active = currentSurahNumber === s.number;
                return (
                  <button
                    key={s.number}
                    onClick={() => { slideDirRef.current = sp >= page ? 1 : -1; setPage(sp); setShowIndex(false); setIndexQuery(''); }}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl transition-all"
                    style={{ background: active ? 'rgba(20,135,156,0.18)' : 'rgba(var(--hair),0.04)', border: active ? '1px solid rgba(20,135,156,0.35)' : '1px solid rgba(var(--hair),0.06)' }}
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#14879c]/15 flex items-center justify-center flex-shrink-0">
                      <span className="text-[11px] font-bold text-[#14879c]">{s.number}</span>
                    </div>
                    <div className="flex-1 min-w-0 text-right">
                      <p className="text-sm font-medium text-white arabic-text">{s.name}</p>
                      <p className="text-[10px] text-[color:var(--text-muted)] arabic-text" dir="rtl">{s.verses} {t('verses', 'آية')} · {s.type === 'Meccan' ? t('Meccan', 'مكية') : t('Medinan', 'مدنية')}</p>
                    </div>
                    <span className="text-[10px] text-[#d4af37] arabic-text flex-shrink-0">{t('p.', 'ص')} {sp}</span>
                  </button>
                );
              })}
            <div className="h-6" />
          </div>
        </div>
      )}
    </div>
  );
}

// Translucent panel that shows the tafsir of the tapped/recited ayah.
function MushafTafsirPanel({ verseKey, keys, onSelect, onClose }: { verseKey: string; keys: string[]; onSelect: (k: string) => void; onClose: () => void }) {
  const { t } = useI18n();
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [ayahText, setAyahText] = useState('');
  const idx = keys.indexOf(verseKey);

  // The ayah's own text (offline) — shown highlighted in gold.
  useEffect(() => {
    let active = true;
    const [s, a] = verseKey.split(':').map(Number);
    loadAyahRange(s, a, a).then((r) => { if (active) setAyahText(r[0]?.text ?? ''); });
    return () => { active = false; };
  }, [verseKey]);

  // Its tafsir (online).
  useEffect(() => {
    let active = true;
    setLoading(true);
    setText(null);
    fetch(`https://api.quran.com/api/v4/tafsirs/91/by_ayah/${verseKey}`)
      .then((r) => r.json())
      .then((d) => { if (active) setText(d?.tafsir?.text ?? null); })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [verseKey]);

  return (
    <div className="fixed inset-x-0 bottom-32 z-40 px-3 pointer-events-none">
      <div
        className="mx-auto max-w-md rounded-2xl p-3 pointer-events-auto"
        style={{ background: 'rgba(var(--glass-2), 0.92)', border: '1px solid rgba(212,175,55,0.3)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
      >
        <div className="flex items-center justify-between mb-1.5 gap-2">
          <span className="text-[11px] text-[#d4af37] arabic-text flex-1 truncate">{t('Ayah', 'الآية')} {verseKey} · {t('Tafsir al-Saʿdi', 'تفسير السعدي')}</span>
          <div className="flex items-center gap-0.5">
            <button onClick={() => idx > 0 && onSelect(keys[idx - 1])} disabled={idx <= 0}
              className="p-1 rounded hover:bg-white/10 disabled:opacity-30" aria-label="Previous ayah" title={t('Previous ayah', 'الآية السابقة')}>
              <ChevronRight size={15} className="text-[color:var(--text-muted)]" />
            </button>
            <button onClick={() => idx >= 0 && idx < keys.length - 1 && onSelect(keys[idx + 1])} disabled={idx < 0 || idx >= keys.length - 1}
              className="p-1 rounded hover:bg-white/10 disabled:opacity-30" aria-label="Next ayah" title={t('Next ayah', 'الآية التالية')}>
              <ChevronLeft size={15} className="text-[color:var(--text-muted)]" />
            </button>
            <button onClick={onClose} className="p-1 rounded hover:bg-white/10" aria-label="Close">
              <X size={15} className="text-[color:var(--text-muted)]" />
            </button>
          </div>
        </div>

        {ayahText && (
          <p className="arabic-text text-[16px] leading-loose mb-2 px-2.5 py-2 rounded-lg" dir="rtl"
             style={{ background: 'rgba(212,175,55,0.18)', color: 'rgb(var(--text-strong-rgb))', border: '1px solid rgba(212,175,55,0.38)' }}>
            {ayahText}
          </p>
        )}

        <div className="overflow-y-auto custom-scrollbar text-[12.5px] arabic-text leading-loose" dir="rtl" style={{ maxHeight: '24vh', color: 'rgba(var(--text-strong-rgb), 0.85)' }}>
          {loading
            ? <div className="flex justify-center py-4"><Loader2 size={18} className="animate-spin text-[#14879c]" /></div>
            : text
              ? <span dangerouslySetInnerHTML={{ __html: text }} />
              : <p className="text-[color:var(--text-muted)] py-2">{t('Tafsir is unavailable right now (needs an internet connection).', 'التفسير غير متاح الآن (يتطلب اتصالًا بالإنترنت).')}</p>}
        </div>
      </div>
    </div>
  );
}
