import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Bookmark, BookmarkCheck, ListTree, X, Play, Pause, Search, BookOpen, GripHorizontal, Mic2, Check, Volume2 } from 'lucide-react';
import { getReciter, everyayahUrl, RECITERS } from '@/data/reciters';
import { absoluteAudioUrl } from '@/lib/quranApi';
import { getTafsirText } from '@/lib/contentCache';
import { fetchVerseWords, playWord, subscribeWordAudio, wordPlaying, type WbwWord } from '@/lib/wordByWord';
import { audioEl, claimAudio, isOwner } from '@/lib/audioBus';
import { pushBack } from '@/lib/backStack';
import { loadAyahRange } from '@/lib/localQuran';
import { surahList } from '@/data/surahList';
import { startPageForSurah } from '@/data/mushafPages';
import { loadPageTokens, keysFromTokens, type PageToken } from '@/lib/mushafText';
import { haptic } from '@/lib/haptics';
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

export default function MushafPage({ initialPage }: MushafPageProps) {
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
  const [showIndex, setShowIndex] = useState(false);
  const [indexQuery, setIndexQuery] = useState('');
  const [chrome, setChrome] = useState(true); // top/bottom bars visible (tap page to hide)
  // The page auto-fits ONE screen (no scrolling): fitFont is measured so the whole
  // page fits; zoom is the user's pinch multiplier on top of that.
  const [fitFont, setFitFont] = useState(1.5);
  const [zoom, setZoom] = useState<number>(() => {
    const v = Number(localStorage.getItem('nur-mushaf-zoom'));
    return v >= 0.6 && v <= 2.6 ? v : 1;
  });
  const zoomRef = useRef(1);
  zoomRef.current = zoom;
  const innerRef = useRef<HTMLParagraphElement>(null);

  // Which surah the current page belongs to (for highlighting in the index).
  const currentSurahNumber = useMemo(() => {
    let n = 1;
    for (let i = 0; i < surahList.length; i++) if (page >= startPageForSurah(i + 1)) n = i + 1;
    return n;
  }, [page]);
  const currentSurah = surahList.find((s) => s.number === currentSurahNumber);

  // ── Page recitation audio (plays the current page's verses in sequence,
  //    then auto-advances to the next page). Online feature. ──
  const [reciterId, setReciterId] = useState<string | undefined>(() => {
    try { return JSON.parse(localStorage.getItem('nur-settings') || '{}').reciter; } catch { return undefined; }
  });
  const reciter = useMemo(() => getReciter(reciterId), [reciterId]);
  const [showReciters, setShowReciters] = useState(false);
  const changeReciter = (id: string) => {
    setReciterId(id);
    try { const s = JSON.parse(localStorage.getItem('nur-settings') || '{}'); s.reciter = id; localStorage.setItem('nur-settings', JSON.stringify(s)); } catch { /* ignore */ }
    setShowReciters(false);
  };
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

  // Build the audio playlist for a page = the EXACT ayat shown on it (same
  // offline pagination as the text), so the recitation always matches the screen.
  const buildPlaylist = async (keys: string[]): Promise<{ url: string; key?: string; segments?: number[][] }[]> => {
    if (reciter.everyayah) {
      return keys.map((k) => {
        const [s, a] = k.split(':').map(Number);
        return { url: everyayahUrl(reciter.everyayah!, s, a), key: k };
      });
    }
    const fetched = await Promise.all(keys.map(async (k) => {
      try {
        // by_key (not by_ayah) is the endpoint that returns word-timing segments.
        const res = await fetch(`https://api.quran.com/api/v4/verses/by_key/${k}?audio=${reciter.apiId}&words=false`);
        const data = await res.json();
        const audio = (data?.verse?.audio ?? null) as { url?: string; segments?: number[][] } | null;
        if (audio?.url) return { url: absoluteAudioUrl(audio.url) as string, key: k, segments: audio.segments };
      } catch { /* skip this ayah */ }
      return undefined;
    }));
    const items: { url: string; key?: string; segments?: number[][] }[] = [];
    for (const x of fetched) if (x) items.push(x);
    return items;
  };

  const loadAndPlayPage = async (p: number, startKey?: string) => {
    try {
      setAudioLoading(true);
      playingPageRef.current = p;
      ownerRef.current = claimAudio(); // take the shared element (frees adhan/preview)
      const keys = keysFromTokens(await loadPageTokens(p));
      const items = await buildPlaylist(keys);
      if (playingPageRef.current !== p) return; // a newer page took over
      playlistRef.current = items;
      const start = startKey ? items.findIndex((it) => it.key === startKey) : 0;
      idxRef.current = Math.max(0, start);
      setCurrentWord(0);
      setAudioLoading(false);
      if (!items.length) { setAudioPlaying(false); return; }
      const it = items[idxRef.current];
      setCurrentVerseKey(it.key ?? null);
      const a = ensureAudioEl();
      a.src = it.url;
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

  // Switching reciter mid-recitation → reload the current page with the new voice.
  useEffect(() => {
    if (audioPlayingRef.current) void loadAndPlayPage(pageRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reciterId]);

  // Stop audio on unmount (only if we still own the shared element).
  useEffect(() => () => { if (isOwner(ownerRef.current)) { try { audioEl().pause(); } catch { /* ignore */ } document.body.classList.remove('reciting'); } }, []);

  // Load the page's text tokens (offline) and keep the tafsir ayah-keys in sync.
  const scrollRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const pinchRef = useRef<{ startDist: number; startZoom: number } | null>(null);
  const livePinchRef = useRef(1); // current zoom during a pinch
  const slideDirRef = useRef(1);
  const pageRef = useRef(page);
  pageRef.current = page;

  // Auto-fit: shrink the base font until the whole page fits the screen (so the
  // user flips instead of scrolling). The user's pinch `zoom` multiplies this.
  useLayoutEffect(() => {
    const scroll = scrollRef.current, inner = innerRef.current, paper = paperRef.current;
    if (pageLoading || !scroll || !inner || !paper) return;
    const cs = getComputedStyle(paper);
    const padV = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
    const avail = scroll.clientHeight - padV - 4; // room for the text inside the frame
    let font = 2.0;
    inner.style.fontSize = font + 'rem';
    // inner.scrollHeight = the text's natural height (independent of the page's
    // min-height), so we shrink until the whole page fits one screen.
    for (let g = 0; g < 26 && inner.scrollHeight > avail && font > 0.75; g++) {
      font -= 0.06;
      inner.style.fontSize = font + 'rem';
    }
    inner.style.fontSize = (font * zoomRef.current) + 'rem';
    setFitFont(font);
  }, [tokens, pageLoading]);
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
    haptic.light();
    setPage(to);
  };
  const goNext = () => turn(1);
  const goPrev = () => turn(-1);

  // Tap a WORD → show its meaning + hear it alone (word-by-word). A button in
  // that popup recites the whole ayah from here. Swipe → turn the page; tap a
  // blank area → toggle the bars.
  const [wordPopup, setWordPopup] = useState<{ key: string; pos: number } | null>(null);
  const openWord = (key: string, pos: number) => {
    haptic.light();
    setWordPopup({ key, pos });
    const [s, a] = key.split(':').map(Number);
    void playWord(s, a, pos);
  };
  // "Recite from here" (the old tap-an-ayah behaviour), now reached from the popup.
  const reciteFrom = (key: string) => {
    setWordPopup(null);
    setCurrentVerseKey(key);
    setPageVerseKeys((prev) => (prev.length ? prev : keysFromTokens(tokens)));
    void loadAndPlayPage(page, key);
  };
  useEffect(() => { if (wordPopup) return pushBack(() => { setWordPopup(null); return true; }); }, [wordPopup]);

  // The side bar can be dragged up/down (by its grip) so it's never in the way.
  const [sideY, setSideY] = useState(0);
  const sideDragRef = useRef<{ y: number; oy: number } | null>(null);
  const onSideDown = (e: React.PointerEvent) => { sideDragRef.current = { y: e.clientY, oy: sideY }; (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId); };
  const onSideMove = (e: React.PointerEvent) => {
    if (!sideDragRef.current) return;
    const limit = window.innerHeight / 2 - 130;
    setSideY(Math.max(-limit, Math.min(limit, sideDragRef.current.oy + (e.clientY - sideDragRef.current.y))));
  };
  const onSideUp = () => { sideDragRef.current = null; };
  // Two-finger pinch zooms the text. We preview with a GPU transform during the
  // gesture, then commit the new font size on release (so it reflows crisply).
  const dist2 = (tl: React.TouchList) => Math.hypot(tl[0].clientX - tl[1].clientX, tl[0].clientY - tl[1].clientY);
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      pinchRef.current = { startDist: dist2(e.touches), startZoom: zoom };
      livePinchRef.current = zoom;
      touchStartX.current = null;
    } else {
      touchStartX.current = e.touches[0].clientX;
    }
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchRef.current && innerRef.current) {
      // Zoom via FONT-SIZE (not transform): the text reflows within the frame, so
      // nothing (e.g. the surah header) overflows the gold border.
      const z = Math.min(2.6, Math.max(0.6, pinchRef.current.startZoom * (dist2(e.touches) / pinchRef.current.startDist)));
      livePinchRef.current = z;
      innerRef.current.style.fontSize = `${(fitFont * z).toFixed(3)}rem`;
    }
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (pinchRef.current) {
      const nz = Math.round(livePinchRef.current * 100) / 100;
      pinchRef.current = null;
      setZoom(nz);
      try { localStorage.setItem('nur-mushaf-zoom', String(nz)); } catch { /* ignore */ }
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
        <div className="px-3 py-1 rounded-full" style={{ background: 'linear-gradient(180deg, #f3e3b4, #ecd79a)', border: '1px solid #c9a227', boxShadow: '0 2px 8px rgba(0,0,0,0.25)' }}>
          <p className="text-[10px] font-semibold arabic-text whitespace-nowrap" style={{ color: '#6e4f08' }}>سورة {currentSurah?.name ?? ''} · {t('Juz', 'ج')} {juzForPage(page)} · {t('p.', 'ص')} {page}/{TOTAL_PAGES}</p>
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
          style={{ animation: `${slideDirRef.current >= 0 ? 'mushaf-in-fwd' : 'mushaf-in-back'} 0.4s cubic-bezier(0.22, 0.61, 0.36, 1) both` }}
        >
          {pageLoading ? (
            <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
              <Loader2 size={26} className="animate-spin" style={{ color: '#c9a227' }} />
            </div>
          ) : (
            <p ref={innerRef} className="mushaf-paper-inner" dir="rtl" style={{ fontSize: `${(fitFont * zoom).toFixed(3)}rem` }}>
              {tokens.map((tk, i) => {
                if (tk.kind === 'surah') {
                  const name = surahList.find((s) => s.number === tk.surah)?.name ?? '';
                  return (
                    <span key={`s${i}`} className="mushaf-surah-block">
                      <span className="mushaf-surah-name">سورة {name}</span>
                      {tk.bismillah && <span className="mushaf-bismillah">بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</span>}
                    </span>
                  );
                }
                if (tk.kind === 'end') {
                  return <span key={`e${i}`} className="mushaf-ayah-end">{toArabicDigits(tk.num)}</span>;
                }
                const active = tafsirFollow && tk.key === currentVerseKey;
                const reciting = audioPlaying && tk.key === currentVerseKey;
                const recitingWord = reciting && currentWord > 0 && tk.pos === currentWord;
                const picked = wordPopup?.key === tk.key && wordPopup?.pos === tk.pos;
                return (
                  <span
                    key={i}
                    className="mushaf-word"
                    data-active={active ? 'true' : undefined}
                    data-reciting={reciting ? 'true' : undefined}
                    data-reciting-word={(recitingWord || picked) ? 'true' : undefined}
                    onClick={() => openWord(tk.key, tk.pos)}
                  >
                    {tk.text}{' '}
                  </span>
                );
              })}
            </p>
          )}
        </div>
      </div>

      {/* Draggable vertical SIDE BAR — grab the grip to move it up/down so it's
          never in the way. Slides off-screen while tafsir is open / chrome hidden. */}
      <div className="fixed left-0 z-40"
        style={{
          top: `calc(50% + ${sideY}px)`,
          transform: (chrome && !tafsirFollow) ? 'translateY(-50%)' : 'translateY(-50%) translateX(-130%)',
          transition: 'transform 0.3s ease',
        }}>
        <div className="flex flex-col items-center gap-1 pb-2 px-1 rounded-r-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(16,34,29,0.94), rgba(13,28,24,0.94))',
            border: '1px solid rgba(212,175,55,0.18)', borderLeft: 'none',
            boxShadow: '4px 0 22px rgba(0,0,0,0.45)',
            backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
          }}>
          {/* Drag grip */}
          <div onPointerDown={onSideDown} onPointerMove={onSideMove} onPointerUp={onSideUp} onPointerCancel={onSideUp}
            className="w-full flex justify-center pt-1.5 pb-1 cursor-grab active:cursor-grabbing"
            style={{ touchAction: 'none' }} title={t('Drag to move', 'اسحب لتحريكه')}>
            <GripHorizontal size={15} className="text-[color:var(--text-muted)]" />
          </div>
          <button onClick={toggleAudio} className="p-2 rounded-lg hover:bg-white/10 transition-all" aria-label="Recite" title={t('Recite the verses', 'تلاوة الآيات')}>
            {audioLoading ? <Loader2 size={17} className="text-[#14879c] animate-spin" /> : audioPlaying ? <Pause size={17} className="text-[#14879c]" fill="currentColor" /> : <Play size={17} className="text-[#14879c]" fill="currentColor" />}
          </button>
          <button onClick={() => setShowReciters(true)} className="p-2 rounded-lg hover:bg-white/10 transition-all" aria-label="Reciter" title={t('Change reciter', 'تغيير القارئ')}>
            <Mic2 size={16} className="text-[#d4af37]" />
          </button>
          <button onClick={toggleBookmark} className="p-2 rounded-lg hover:bg-white/10 transition-all" aria-label="Save place" title={t('Save my place', 'احفظ مكاني')}>
            {isBookmarked ? <BookmarkCheck size={17} className="text-[#d4af37]" /> : <Bookmark size={17} className="text-[color:var(--text-muted)]" />}
          </button>
          <button onClick={openTafsir} className="p-2 rounded-lg hover:bg-white/10 transition-all" aria-label="Tafsir" title={t('Tafsir', 'التفسير')}>
            <BookOpen size={16} className={tafsirFollow ? 'text-[#d4af37]' : 'text-[#14879c]'} />
          </button>
          <button onClick={() => setShowIndex(true)} className="p-2 rounded-lg hover:bg-white/10 transition-all" aria-label="Index" title={t('Index', 'الفهرس')}>
            <ListTree size={16} className="text-[#14879c]" />
          </button>
        </div>
      </div>

      {/* Reciter picker — change the qārī without going to Settings. */}
      {showReciters && (
        <div className="fixed inset-0 z-[75] flex items-end justify-center" style={{ background: 'rgba(4,12,16,0.6)' }} onClick={() => setShowReciters(false)}>
          <div className="w-full max-w-lg rounded-t-2xl max-h-[70vh] overflow-y-auto custom-scrollbar p-4" onClick={(e) => e.stopPropagation()}
            style={{ background: 'linear-gradient(135deg, rgba(var(--glass-1), 0.98), rgba(var(--glass-2), 0.98))', border: '1px solid rgba(212,175,55,0.25)' }}>
            <p className="text-sm font-semibold text-white arabic-text mb-3 text-center">{t('Choose reciter', 'اختر القارئ')}</p>
            <div className="space-y-1.5">
              {RECITERS.map((r) => (
                <button key={r.id} onClick={() => changeReciter(r.id)}
                  className="w-full flex items-center justify-between rounded-xl px-3 py-2.5"
                  style={{ background: r.id === reciterId ? 'rgba(212,175,55,0.18)' : 'rgba(255,255,255,0.04)', border: r.id === reciterId ? '1px solid rgba(212,175,55,0.4)' : '1px solid transparent' }}>
                  <span className="arabic-text text-sm" style={{ color: r.id === reciterId ? '#d4af37' : '#fff' }}>{r.arabicName}</span>
                  {r.id === reciterId && <Check size={15} className="text-[#d4af37]" />}
                </button>
              ))}
            </div>
            <div className="h-4" />
          </div>
        </div>
      )}

      {/* Word-by-word popup — meaning + hear the single word + recite from here. */}
      {wordPopup && (
        <MushafWordPopup entry={wordPopup} onReciteFrom={reciteFrom} onClose={() => setWordPopup(null)} />
      )}

      {/* Floating tafsir window — opens on a word tap or follows recitation. */}
      {tafsirFollow && currentVerseKey && (
        <MushafTafsirPanel verseKey={currentVerseKey} keys={pageVerseKeys} onSelect={setCurrentVerseKey} onClose={() => setTafsirFollow(false)} playing={audioPlaying} onToggleAudio={toggleAudio} />
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

// Compact popup for a tapped word: its meaning + transliteration, a button to
// hear the single word (word-by-word recitation), and one to recite from here.
function MushafWordPopup({ entry, onReciteFrom, onClose }: { entry: { key: string; pos: number }; onReciteFrom: (key: string) => void; onClose: () => void }) {
  const { t } = useI18n();
  const [words, setWords] = useState<WbwWord[] | null>(null);
  const [, force] = useState(0);
  useEffect(() => subscribeWordAudio(() => force((n) => n + 1)), []);
  const [s, a] = entry.key.split(':').map(Number);

  useEffect(() => {
    let active = true;
    setWords(null);
    fetchVerseWords(entry.key, 'en').then((w) => { if (active) setWords(w); }).catch(() => { if (active) setWords([]); });
    return () => { active = false; };
  }, [entry.key]);

  const word = words?.find((w) => w.position === entry.pos);
  const sounding = wordPlaying() === `${s}:${a}:${entry.pos}`;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] px-3 pointer-events-none" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
      <div className="mx-auto max-w-sm rounded-2xl p-3.5 pointer-events-auto"
        style={{ background: 'linear-gradient(135deg, rgba(var(--glass-1), 0.98), rgba(var(--glass-2), 0.98))', border: '1px solid rgba(212,175,55,0.3)', boxShadow: '0 12px 34px rgba(0,0,0,0.4)' }}>
        <div className="flex items-start gap-3">
          <button onClick={() => void playWord(s, a, entry.pos)}
            className="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center active:scale-95 transition-transform"
            style={{ background: 'rgba(212,175,55,0.14)', border: '1px solid rgba(212,175,55,0.3)' }} aria-label={t('Play word', 'انطق الكلمة')}>
            <Volume2 size={22} className={sounding ? 'text-[#d4af37]' : 'text-[#14879c]'} />
          </button>
          <div className="flex-1 min-w-0 text-right">
            <p className="arabic-text text-2xl text-[#d4af37] leading-tight" dir="rtl">{word?.text ?? '…'}</p>
            {word?.transliteration && <p className="text-[11px] text-[#14879c] italic mt-0.5" dir="ltr">{word.transliteration}</p>}
            {words === null
              ? <p className="text-[11px] text-[color:var(--text-muted)] mt-0.5">{t('Loading…', 'جارٍ التحميل…')}</p>
              : <p className="text-[13px] text-white mt-0.5" dir="ltr">{word?.translation ?? t('Meaning needs a connection', 'المعنى يحتاج اتصالاً')}</p>}
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 flex-shrink-0" aria-label={t('Close', 'إغلاق')}><X size={16} className="text-[color:var(--text-muted)]" /></button>
        </div>
        <button onClick={() => onReciteFrom(entry.key)}
          className="mt-3 w-full py-2 rounded-xl text-[12px] font-semibold arabic-text flex items-center justify-center gap-2"
          style={{ background: 'rgba(20,135,156,0.16)', color: '#14879c', border: '1px solid rgba(20,135,156,0.3)' }}>
          <Play size={13} fill="currentColor" /> {t('Recite from here', 'اقرأ من هنا')}
        </button>
      </div>
    </div>
  );
}

// Translucent panel that shows the tafsir of the tapped/recited ayah.
const TAFSIRS: { id: number; ar: string; en: string; rtl: boolean }[] = [
  { id: 91, ar: 'السعدي', en: 'Al-Saadi', rtl: true },
  { id: 14, ar: 'ابن كثير', en: 'Ibn Kathir', rtl: true },
  { id: 169, ar: 'ابن كثير (إنجليزي)', en: 'Ibn Kathir (EN)', rtl: false },
];

function MushafTafsirPanel({ verseKey, keys, onSelect, onClose, playing, onToggleAudio }: { verseKey: string; keys: string[]; onSelect: (k: string) => void; onClose: () => void; playing: boolean; onToggleAudio: () => void }) {
  const { t } = useI18n();
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [ayahText, setAyahText] = useState('');
  const [src, setSrc] = useState<number>(() => Number(localStorage.getItem('nur-mushaf-tafsir')) || 91);
  const tafsir = TAFSIRS.find((x) => x.id === src) ?? TAFSIRS[0];
  const idx = keys.indexOf(verseKey);

  // Drag the panel by its title so it never sits on top of the verse you read.
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);
  const onDragStart = (e: React.PointerEvent) => {
    dragRef.current = { sx: e.clientX, sy: e.clientY, ox: pos.x, oy: pos.y };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onDragMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    setPos({ x: dragRef.current.ox + (e.clientX - dragRef.current.sx), y: dragRef.current.oy + (e.clientY - dragRef.current.sy) });
  };
  const onDragEnd = () => { dragRef.current = null; };

  // The ayah's own text (offline) — shown highlighted in gold.
  useEffect(() => {
    let active = true;
    const [s, a] = verseKey.split(':').map(Number);
    loadAyahRange(s, a, a).then((r) => { if (active) setAyahText(r[0]?.text ?? ''); });
    return () => { active = false; };
  }, [verseKey]);

  // Its tafsir — OFFLINE-FIRST: downloaded pack (IndexedDB) if present, else API.
  useEffect(() => {
    let active = true;
    setLoading(true);
    setText(null);
    (async () => {
      const local = await getTafsirText(src, verseKey).catch(() => undefined);
      if (!active) return;
      if (local) { setText(local); setLoading(false); return; }
      try {
        const r = await fetch(`https://api.quran.com/api/v4/tafsirs/${src}/by_ayah/${verseKey}`);
        const d = await r.json();
        if (active) setText(d?.tafsir?.text ?? null);
      } catch { /* offline & not downloaded */ }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [verseKey, src]);

  return (
    <div className="fixed inset-x-0 bottom-32 z-40 px-3 pointer-events-none">
      <div
        className="mx-auto max-w-md rounded-2xl p-3 pointer-events-auto"
        style={{ background: 'rgba(var(--glass-2), 0.92)', border: '1px solid rgba(212,175,55,0.3)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', transform: `translate(${pos.x}px, ${pos.y}px)` }}
      >
        <div className="flex items-center justify-between mb-1.5 gap-2">
          <span
            onPointerDown={onDragStart} onPointerMove={onDragMove} onPointerUp={onDragEnd} onPointerCancel={onDragEnd}
            className="text-[11px] text-[#d4af37] arabic-text flex-1 truncate cursor-grab active:cursor-grabbing"
            style={{ touchAction: 'none' }}
            title={t('Drag to move', 'اسحب لتحريكه')}
          >⠿ {t('Ayah', 'الآية')} {verseKey}</span>
          <div className="flex items-center gap-0.5">
            <button onClick={onToggleAudio} className="p-1 rounded hover:bg-white/10" aria-label="Play/Pause" title={t('Recite', 'تلاوة')}>
              {playing ? <Pause size={15} className="text-[#14879c]" fill="currentColor" /> : <Play size={15} className="text-[#14879c]" fill="currentColor" />}
            </button>
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

        {/* Tafsir source selector */}
        <div className="flex gap-1 mb-2">
          {TAFSIRS.map((x) => (
            <button key={x.id}
              onClick={() => { setSrc(x.id); try { localStorage.setItem('nur-mushaf-tafsir', String(x.id)); } catch { /* ignore */ } }}
              className="flex-1 py-1 rounded-lg text-[10px] arabic-text transition-all"
              style={{ background: src === x.id ? 'rgba(212,175,55,0.22)' : 'rgba(255,255,255,0.04)', color: src === x.id ? '#d4af37' : 'var(--text-muted)', border: src === x.id ? '1px solid rgba(212,175,55,0.4)' : '1px solid transparent' }}>
              {t(x.en, x.ar)}
            </button>
          ))}
        </div>

        {ayahText && (
          <p className="arabic-text text-[16px] leading-loose mb-2 px-2.5 py-2 rounded-lg" dir="rtl"
             style={{ background: 'rgba(212,175,55,0.18)', color: 'rgb(var(--text-strong-rgb))', border: '1px solid rgba(212,175,55,0.38)' }}>
            {ayahText}
          </p>
        )}

        <div className={`overflow-y-auto custom-scrollbar text-[12.5px] leading-loose ${tafsir.rtl ? 'arabic-text' : ''}`} dir={tafsir.rtl ? 'rtl' : 'ltr'} style={{ maxHeight: '24vh', color: 'rgba(var(--text-strong-rgb), 0.85)' }}>
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
