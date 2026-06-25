import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, Bookmark, BookmarkCheck, ListTree, X, Play, Pause, BookOpen, Search } from 'lucide-react';
import { getReciter, everyayahUrl } from '@/data/reciters';
import { absoluteAudioUrl } from '@/lib/quranApi';
import { audioEl, claimAudio, isOwner } from '@/lib/audioBus';
import { loadAyahRange } from '@/lib/localQuran';
import { surahList } from '@/data/surahList';
import { startPageForSurah } from '@/data/mushafPages';

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

const pad3 = (n: number) => String(n).padStart(3, '0');
// The illuminated "Mushaf al-Wasat" pages are bundled locally (offline, in
// public/mushaf). Falls back to the plain CDN render if a page is ever missing.
const localPageUrl = (page: number) => `${import.meta.env.BASE_URL}mushaf/${pad3(page)}.webp`;
const cdnPageUrl = (page: number) => `https://files.quran.app/hafs/madani/width_1024/page${pad3(page)}.png`;
const juzForPage = (page: number) => {
  let juz = 1;
  for (let i = 0; i < JUZ_START_PAGES.length; i++) if (page >= JUZ_START_PAGES[i]) juz = i + 1;
  return juz;
};
// Each juz' is two ahzab; the 2nd hizb begins around the juz' midpoint.
const hizbForPage = (page: number) => {
  const juz = juzForPage(page);
  const start = JUZ_START_PAGES[juz - 1];
  const end = JUZ_START_PAGES[juz] ?? TOTAL_PAGES + 1;
  return (juz - 1) * 2 + (page >= start + (end - start) / 2 ? 2 : 1);
};

export default function MushafPage({ onBack, initialPage }: MushafPageProps) {
  const [page, setPage] = useState(() => {
    if (initialPage) return Math.min(Math.max(1, initialPage), TOTAL_PAGES);
    const saved = Number(localStorage.getItem('nur-mushaf-page'));
    return saved >= 1 && saved <= TOTAL_PAGES ? saved : 1;
  });
  const [loaded, setLoaded] = useState(false);
  const [bookmarks, setBookmarks] = useState<number[]>(() => {
    try { return JSON.parse(localStorage.getItem('nur-mushaf-bookmarks') || '[]'); } catch { return []; }
  });
  const touchStartX = useRef<number | null>(null);
  const [pageStr, setPageStr] = useState(String(page));
  const [showIndex, setShowIndex] = useState(false);
  const [indexQuery, setIndexQuery] = useState('');
  const [zoom, setZoom] = useState(1);
  const [chrome, setChrome] = useState(true); // top/bottom bars visible (tap page to hide)

  // Which surah the current page belongs to (for highlighting in the index).
  const currentSurahNumber = useMemo(() => {
    let n = 1;
    for (let i = 0; i < surahList.length; i++) if (page >= startPageForSurah(i + 1)) n = i + 1;
    return n;
  }, [page]);
  const currentSurah = surahList.find((s) => s.number === currentSurahNumber);
  useEffect(() => { setPageStr(String(page)); }, [page]);

  // ── Page recitation audio (plays the current page's verses in sequence,
  //    then auto-advances to the next page). Online feature; mushaf is online. ──
  const reciter = useMemo(() => {
    try { return getReciter(JSON.parse(localStorage.getItem('nur-settings') || '{}').reciter); }
    catch { return getReciter(undefined); }
  }, []);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const ownerRef = useRef(0); // our claim on the app-wide shared audio element
  const playlistRef = useRef<{ url: string; key?: string }[]>([]);
  const idxRef = useRef(0);
  const playingPageRef = useRef<number>(page);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [currentVerseKey, setCurrentVerseKey] = useState<string | null>(null);
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
        // everyayah reciters: get the page's verse keys and build per-ayah URLs.
        const res = await fetch(`https://api.quran.com/api/v4/verses/by_page/${p}?per_page=50&fields=verse_key`);
        const data = await res.json();
        items = ((data?.verses ?? []) as { verse_key: string }[]).map((v) => {
          const [s, a] = v.verse_key.split(':').map(Number);
          return { url: everyayahUrl(reciter.everyayah!, s, a), key: v.verse_key };
        });
      } else {
        const res = await fetch(`https://api.quran.com/api/v4/recitations/${reciter.apiId}/by_page/${p}`);
        const data = await res.json();
        items = ((data?.audio_files ?? []) as { url: string; verse_key?: string }[])
          .map((f) => ({ url: absoluteAudioUrl(f.url) as string, key: f.verse_key }))
          .filter((x) => x.url);
      }
      playlistRef.current = items;
      idxRef.current = 0;
      setAudioLoading(false);
      if (!items.length) { setAudioPlaying(false); return; }
      setCurrentVerseKey(items[0].key ?? null);
      const a = ensureAudioEl();
      a.src = items[0].url;
      await a.play();
      setAudioPlaying(true);
    } catch { setAudioLoading(false); setAudioPlaying(false); }
  };

  // (Re)install our handlers on the shared element and return it. Handlers
  // no-op unless we still own the element, so the adhan / reciter / preview
  // never drive the mushaf's state (and vice-versa).
  const ensureAudioEl = (): HTMLAudioElement => {
    const a = audioEl();
    a.onplay = () => { if (!isOwner(ownerRef.current)) return; document.body.classList.add('reciting'); };
    a.onpause = () => { if (!isOwner(ownerRef.current)) return; document.body.classList.remove('reciting'); };
    a.onerror = () => { if (!isOwner(ownerRef.current)) return; document.body.classList.remove('reciting'); setAudioPlaying(false); setAudioLoading(false); };
    a.onended = () => {
      if (!isOwner(ownerRef.current)) return;
      idxRef.current += 1;
      if (idxRef.current < playlistRef.current.length) {
        const it = playlistRef.current[idxRef.current];
        setCurrentVerseKey(it.key ?? null);
        a.src = it.url;
        void a.play().catch(() => {});
      } else {
        const np = playingPageRef.current + 1; // page finished → continue reading
        if (np <= TOTAL_PAGES) { setPage(np); void loadAndPlayPage(np); }
        else setAudioPlaying(false);
      }
    };
    audioElRef.current = a;
    return a;
  };

  const toggleAudio = () => {
    const a = audioEl();
    if (audioPlaying) { a.pause(); setAudioPlaying(false); return; }
    // Resume only if we still hold the shared element from this same page.
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

  // Tafsir works WITHOUT recitation: when the window is open, load the current
  // page's ayat so the user can read tafsir and step through ayat manually.
  useEffect(() => {
    if (!tafsirFollow) return;
    let active = true;
    fetch(`https://api.quran.com/api/v4/verses/by_page/${page}?per_page=50&fields=verse_key`)
      .then((r) => r.json())
      .then((d) => {
        if (!active) return;
        const keys = ((d?.verses ?? []) as { verse_key: string }[]).map((v) => v.verse_key);
        setPageVerseKeys(keys);
        if (!audioPlayingRef.current) setCurrentVerseKey(keys[0] ?? null); // default to first ayah
      })
      .catch(() => {});
    return () => { active = false; };
  }, [tafsirFollow, page]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const pageElRef = useRef<HTMLDivElement>(null);
  const skipCenterRef = useRef(false); // after a pinch we set the scroll ourselves
  // Pinch state: scaled smoothly via CSS transform (GPU, no reflow) during the
  // gesture, then committed to a real width once. fx/fy = focal content point.
  const pinchRef = useRef<{ startDist: number; startZoom: number; midX: number; midY: number; fx: number; fy: number } | null>(null);

  const centerScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
      el.scrollTop = Math.max(0, (el.scrollHeight - el.clientHeight) / 2);
    });
  };

  // Keep the page centred when zooming (pinch / double-tap). Skip during a
  // pinch so it doesn't fight the user's fingers.
  useEffect(() => {
    if (skipCenterRef.current) { skipCenterRef.current = false; return; } // pinch sets its own scroll
    if (zoom > 1) centerScroll();
    else scrollRef.current?.scrollTo({ left: 0, top: 0 });
  }, [zoom]);
  const commitPage = () => {
    const n = Number(pageStr);
    if (n >= 1 && n <= TOTAL_PAGES) setPage(n);
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

  useEffect(() => {
    localStorage.setItem('nur-mushaf-page', String(page));
    setLoaded(false);
    // Preload the neighbouring pages for snappy paging.
    [page - 1, page + 1].forEach((p) => {
      if (p >= 1 && p <= TOTAL_PAGES) {
        const img = new Image();
        img.src = localPageUrl(p);
      }
    });
  }, [page]);

  // In the mushaf, the "next" page (higher number) sits to the LEFT (RTL).
  const goNext = () => setPage((p) => Math.min(TOTAL_PAGES, p + 1)); // forward in reading
  const goPrev = () => setPage((p) => Math.max(1, p - 1));

  // Combined gesture handling: 1 finger = swipe pages (only at 1×), 2 fingers = pinch zoom.
  const touchDist = (t: React.TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
  const midpoint = (t: React.TouchList) => {
    const el = scrollRef.current; const r = el?.getBoundingClientRect();
    return { x: (t[0].clientX + t[1].clientX) / 2 - (r?.left ?? 0), y: (t[0].clientY + t[1].clientY) / 2 - (r?.top ?? 0) };
  };
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const el = scrollRef.current;
      const m = midpoint(e.touches);
      const sw = el?.scrollWidth || 1, sh = el?.scrollHeight || 1;
      const originX = (el?.scrollLeft ?? 0) + m.x;
      const originY = (el?.scrollTop ?? 0) + m.y;
      pinchRef.current = { startDist: touchDist(e.touches), startZoom: zoom, midX: m.x, midY: m.y, fx: originX / sw, fy: originY / sh };
      // Scale around the point under the fingers — that point stays put.
      if (pageElRef.current) {
        pageElRef.current.style.transformOrigin = `${originX}px ${originY}px`;
        pageElRef.current.style.willChange = 'transform';
      }
      touchStartX.current = null;
    } else if (zoom === 1) { touchStartX.current = e.touches[0].clientX; }
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchRef.current && pageElRef.current) {
      const p = pinchRef.current;
      const target = Math.min(4, Math.max(1, p.startZoom * (touchDist(e.touches) / p.startDist)));
      // Pure GPU transform — no React, no layout reflow → buttery smooth.
      pageElRef.current.style.transform = `scale(${target / p.startZoom})`;
    }
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (pinchRef.current && pageElRef.current) {
      const p = pinchRef.current;
      const match = /scale\(([\d.]+)\)/.exec(pageElRef.current.style.transform);
      const newZoom = Math.round(Math.min(4, Math.max(1, p.startZoom * (match ? parseFloat(match[1]) : 1))) * 100) / 100;
      // Drop the temporary transform and commit the real width once.
      pageElRef.current.style.transform = '';
      pageElRef.current.style.transformOrigin = '';
      pageElRef.current.style.willChange = '';
      const { fx, fy, midX, midY } = p;
      pinchRef.current = null;
      skipCenterRef.current = true;
      setZoom(newZoom);
      requestAnimationFrame(() => {
        const el = scrollRef.current; if (!el) return;
        el.scrollLeft = fx * el.scrollWidth - midX;
        el.scrollTop = fy * el.scrollHeight - midY;
      });
      return;
    }
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) {
      // RTL mushaf: swipe left→right turns FORWARD (next page); right→left goes back.
      if (dx > 0) goNext();
      else goPrev();
    } else if (Math.abs(dx) < 10) {
      setChrome((c) => !c); // a tap → toggle the bars for full-screen reading
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

  return (
    <div className="page-enter mushaf-stage" style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>
      {/* Slim title pill — slides away with the toolbar for full-screen reading */}
      <div className="fixed top-0 inset-x-0 z-40 px-4 pt-3 transition-transform duration-300 ease-out pointer-events-none"
        style={{ transform: chrome ? 'none' : 'translateY(-160%)' }}>
        <div className="mx-auto w-max max-w-[90%] text-center px-4 py-1.5 rounded-full"
          style={{ background: 'rgba(8,29,35,0.85)', border: '1px solid rgba(212,175,55,0.2)' }}>
          <p className="text-xs font-semibold text-white arabic-text truncate">سورة {currentSurah?.name ?? ''} · ص {page}</p>
        </div>
      </div>

      {/* Page image — fills the whole screen; the page's own border is the edge.
          Centered vertically at 1×; pannable when zoomed; tap toggles the bars. */}
      <div
        ref={scrollRef}
        className={`absolute inset-0 overflow-auto select-none ${zoom === 1 ? 'flex items-center justify-center' : ''}`}
        style={{ paddingTop: 6, paddingBottom: chrome ? 64 : 6, transition: 'padding 0.3s ease' }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          ref={pageElRef}
          className="relative mx-auto flex-shrink-0"
          style={{ width: `${Math.round(zoom * 100)}%` }}
        >
          {!loaded && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <Loader2 size={28} className="text-[#d4af37] animate-spin" />
            </div>
          )}
          <img
            key={page}
            src={localPageUrl(page)}
            alt={`صفحة ${page}`}
            loading="lazy"
            decoding="async"
            onLoad={() => setLoaded(true)}
            onError={(e) => {
              const t = e.currentTarget;
              if (!t.dataset.fb) { t.dataset.fb = '1'; t.src = cdnPageUrl(page); }
            }}
            onDoubleClick={() => setZoom((z) => (z > 1 ? 1 : 2))}
            className="mushaf-page-img transition-opacity duration-300"
            style={{ opacity: loaded ? 1 : 0 }}
          />
        </div>
      </div>

      {/* One smooth slide toolbar with every control — tap the page to toggle */}
      <div className="fixed bottom-0 inset-x-0 z-40 px-3 pb-3 transition-transform duration-300 ease-out"
        style={{ transform: chrome ? 'none' : 'translateY(145%)' }}>
        <div className="mx-auto max-w-md rounded-2xl overflow-hidden"
          style={{
            // Opaque (no backdrop-blur) so the slide stays smooth — blur is the
            // expensive bit to re-rasterise every frame on mobile.
            background: 'linear-gradient(135deg, rgb(16,34,29), rgb(13,28,24))',
            border: '1px solid rgba(212,175,55,0.14)',
            boxShadow: '0 -8px 30px rgba(0,0,0,0.45)',
          }}>
          {/* Info row */}
          <div className="px-3 pt-2.5 pb-1.5 flex items-center gap-2">
            <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-white/10 transition-all" aria-label="Back">
              <ArrowLeft size={17} className="text-[color:var(--text-muted)]" />
            </button>
            <div className="flex-1 min-w-0 text-center">
              <p className="text-xs font-semibold text-white arabic-text truncate">سورة {currentSurah?.name ?? ''}</p>
              <p className="text-[9px] text-[#d4af37] arabic-text">الجزء {juzForPage(page)} · الحزب {hizbForPage(page)} · صفحة {page}/{TOTAL_PAGES}</p>
            </div>
            <button onClick={toggleBookmark} className="p-1.5 rounded-lg hover:bg-white/10 transition-all" aria-label="Bookmark page">
              {isBookmarked ? <BookmarkCheck size={17} className="text-[#d4af37]" /> : <Bookmark size={17} className="text-[color:var(--text-muted)]" />}
            </button>
          </div>

          {/* Saved pages */}
          {bookmarks.length > 0 && (
            <div className="px-3 pb-1 flex gap-1.5 overflow-x-auto">
              {bookmarks.map((b) => (
                <button key={b} onClick={() => setPage(b)} className="flex-shrink-0 px-2.5 py-0.5 rounded-lg text-[10px] transition-all"
                  style={{ background: b === page ? 'rgba(212,175,55,0.2)' : 'rgba(var(--glass-1), 0.5)', color: b === page ? '#d4af37' : 'var(--text-muted)', border: '1px solid rgba(var(--hair), 0.08)' }}>
                  ص {b}
                </button>
              ))}
            </div>
          )}

          {/* Action row */}
          <div className="px-3 pb-2.5 pt-1 flex items-center gap-1.5">
            <button onClick={goNext} disabled={page >= TOTAL_PAGES} className="p-2 rounded-xl hover:bg-white/10 transition-all disabled:opacity-30" aria-label="Next page">
              <ChevronLeft size={20} className="text-white" />
            </button>
            <button onClick={() => setShowIndex(true)} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all">
              <ListTree size={15} className="text-[#14879c]" /><span className="text-[11px] text-white arabic-text">الفهرس</span>
            </button>
            <button onClick={() => setTafsirFollow((v) => !v)} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all">
              <BookOpen size={15} className={tafsirFollow ? 'text-[#d4af37]' : 'text-[#14879c]'} /><span className="text-[11px] text-white arabic-text">التفسير</span>
            </button>
            <button onClick={toggleAudio} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all">
              {audioLoading ? <Loader2 size={15} className="text-[#14879c] animate-spin" /> : audioPlaying ? <Pause size={15} className="text-[#14879c]" fill="currentColor" /> : <Play size={15} className="text-[#14879c]" fill="currentColor" />}
              <span className="text-[11px] text-white arabic-text">تلاوة</span>
            </button>
            <input type="number" inputMode="numeric" min={1} max={TOTAL_PAGES} value={pageStr}
              onChange={(e) => setPageStr(e.target.value)} onBlur={commitPage}
              onKeyDown={(e) => { if (e.key === 'Enter') { commitPage(); (e.currentTarget as HTMLInputElement).blur(); } }}
              className="w-11 px-1 py-1.5 rounded-lg bg-white/5 text-center text-xs text-white outline-none" title="رقم الصفحة" />
            <button onClick={goPrev} disabled={page <= 1} className="p-2 rounded-xl hover:bg-white/10 transition-all disabled:opacity-30" aria-label="Previous page">
              <ChevronRight size={20} className="text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Floating translucent tafsir window — follows recitation, or step through
          ayat manually with the arrows (works without playing audio). */}
      {tafsirFollow && currentVerseKey && (
        <MushafTafsirPanel verseKey={currentVerseKey} keys={pageVerseKeys} onSelect={setCurrentVerseKey} onClose={() => setTafsirFollow(false)} />
      )}

      {/* Page index (jump to any page, grouped by Juz') */}
      {showIndex && (
        <div className="fixed inset-0 z-[70] flex flex-col" style={{ background: 'rgba(var(--glass-2), 0.98)', backdropFilter: 'blur(6px)' }}>
          <div className="sticky top-0 px-4 py-3 flex items-center gap-3 border-b border-white/10">
            <button onClick={() => setShowIndex(false)} className="p-2 rounded-xl hover:bg-white/10">
              <X size={18} className="text-white" />
            </button>
            <h2 className="text-base font-semibold text-white arabic-text flex-1">فهرس السور</h2>
          </div>
          <div className="px-4 pt-3 max-w-lg mx-auto w-full">
            <div className="relative">
              <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--text-muted)]" />
              <input
                value={indexQuery}
                onChange={(e) => setIndexQuery(e.target.value)}
                placeholder="ابحث باسم السورة أو رقمها…"
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
                    onClick={() => { setPage(sp); setShowIndex(false); setIndexQuery(''); }}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl transition-all"
                    style={{ background: active ? 'rgba(20,135,156,0.18)' : 'rgba(var(--hair),0.04)', border: active ? '1px solid rgba(20,135,156,0.35)' : '1px solid rgba(var(--hair),0.06)' }}
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#14879c]/15 flex items-center justify-center flex-shrink-0">
                      <span className="text-[11px] font-bold text-[#14879c]">{s.number}</span>
                    </div>
                    <div className="flex-1 min-w-0 text-right">
                      <p className="text-sm font-medium text-white arabic-text">{s.name}</p>
                      <p className="text-[10px] text-[color:var(--text-muted)] arabic-text" dir="rtl">{s.verses} آية · {s.type === 'Meccan' ? 'مكية' : 'مدنية'}</p>
                    </div>
                    <span className="text-[10px] text-[#d4af37] arabic-text flex-shrink-0">ص {sp}</span>
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

// Translucent panel that shows the tafsir of the ayah currently being recited
// in the mushaf, updating automatically as the recitation advances.
function MushafTafsirPanel({ verseKey, keys, onSelect, onClose }: { verseKey: string; keys: string[]; onSelect: (k: string) => void; onClose: () => void }) {
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [ayahText, setAyahText] = useState('');
  const idx = keys.indexOf(verseKey);

  // The recited ayah's own text (offline) — shown highlighted in yellow.
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
    <div className="fixed inset-x-0 bottom-20 z-40 px-3 pointer-events-none">
      <div
        className="mx-auto max-w-md rounded-2xl p-3 pointer-events-auto"
        style={{ background: 'rgba(var(--glass-2), 0.86)', border: '1px solid rgba(212,175,55,0.3)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
      >
        <div className="flex items-center justify-between mb-1.5 gap-2">
          <span className="text-[11px] text-[#d4af37] arabic-text flex-1 truncate">الآية {verseKey} · تفسير السعدي</span>
          <div className="flex items-center gap-0.5">
            <button onClick={() => idx > 0 && onSelect(keys[idx - 1])} disabled={idx <= 0}
              className="p-1 rounded hover:bg-white/10 disabled:opacity-30" aria-label="Previous ayah" title="الآية السابقة">
              <ChevronRight size={15} className="text-[color:var(--text-muted)]" />
            </button>
            <button onClick={() => idx >= 0 && idx < keys.length - 1 && onSelect(keys[idx + 1])} disabled={idx < 0 || idx >= keys.length - 1}
              className="p-1 rounded hover:bg-white/10 disabled:opacity-30" aria-label="Next ayah" title="الآية التالية">
              <ChevronLeft size={15} className="text-[color:var(--text-muted)]" />
            </button>
            <button onClick={onClose} className="p-1 rounded hover:bg-white/10" aria-label="Close">
              <X size={15} className="text-[color:var(--text-muted)]" />
            </button>
          </div>
        </div>

        {/* Recited ayah — highlighted in yellow, follows the recitation */}
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
              : <p className="text-[color:var(--text-muted)] py-2">التفسير غير متاح الآن (يتطلب اتصالًا بالإنترنت).</p>}
        </div>
      </div>
    </div>
  );
}
