import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, Bookmark, BookmarkCheck, LayoutGrid, X, Play, Pause, ZoomIn, ZoomOut, BookOpen } from 'lucide-react';
import { getReciter, everyayahUrl } from '@/data/reciters';
import { absoluteAudioUrl } from '@/lib/quranApi';
import { loadAyahRange } from '@/lib/localQuran';

interface MushafPageProps {
  onBack: () => void;
  initialPage?: number;
}

const ZOOM_LEVELS = [1, 1.5, 2, 2.5, 3];

const TOTAL_PAGES = 604;

// Page on which each Juz' begins (standard Madani mushaf).
const JUZ_START_PAGES = [
  1, 22, 42, 62, 82, 102, 121, 142, 162, 182, 201, 222, 242, 262, 282,
  302, 322, 342, 362, 382, 402, 422, 442, 462, 482, 502, 522, 542, 562, 582,
];

const pad3 = (n: number) => String(n).padStart(3, '0');
const pageImageUrl = (page: number) => `https://files.quran.app/hafs/madani/width_1024/page${pad3(page)}.png`;
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
  const [zoom, setZoom] = useState(1);
  useEffect(() => { setPageStr(String(page)); }, [page]);

  // ── Page recitation audio (plays the current page's verses in sequence,
  //    then auto-advances to the next page). Online feature; mushaf is online. ──
  const reciter = useMemo(() => {
    try { return getReciter(JSON.parse(localStorage.getItem('nur-settings') || '{}').reciter); }
    catch { return getReciter(undefined); }
  }, []);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
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

  const ensureAudioEl = (): HTMLAudioElement => {
    if (!audioElRef.current) {
      const a = new Audio();
      a.onplay = () => document.body.classList.add('reciting');
      a.onpause = () => document.body.classList.remove('reciting');
      a.onended = () => {
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
    }
    return audioElRef.current;
  };

  const toggleAudio = () => {
    const a = ensureAudioEl();
    if (audioPlaying) { a.pause(); setAudioPlaying(false); return; }
    if (a.src && a.paused && playingPageRef.current === page && playlistRef.current.length) {
      void a.play(); setAudioPlaying(true); return;
    }
    void loadAndPlayPage(page);
  };

  // If the user navigates to another page mid-recitation, follow them.
  useEffect(() => {
    if (audioPlaying && playingPageRef.current !== page) void loadAndPlayPage(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Stop audio on unmount.
  useEffect(() => () => { audioElRef.current?.pause(); document.body.classList.remove('reciting'); }, []);

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

  const zoomIn = () => setZoom((z) => ZOOM_LEVELS[Math.min(ZOOM_LEVELS.length - 1, ZOOM_LEVELS.indexOf(z) + 1)]);
  const zoomOut = () => setZoom((z) => ZOOM_LEVELS[Math.max(0, ZOOM_LEVELS.indexOf(z) - 1)]);
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
        img.src = pageImageUrl(p);
      }
    });
  }, [page]);

  // In the mushaf, the "next" page (higher number) sits to the LEFT (RTL).
  const goNext = () => setPage((p) => Math.min(TOTAL_PAGES, p + 1)); // forward in reading
  const goPrev = () => setPage((p) => Math.max(1, p - 1));

  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) {
      // swipe right → previous page; swipe left → next page (RTL reading)
      if (dx > 0) goPrev();
      else goNext();
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
    <div className="page-enter min-h-screen flex flex-col" style={{ background: 'var(--app-bg)' }}>
      {/* Header */}
      <header className="sticky top-0 z-40 px-4 py-3">
        <div
          className="mx-auto max-w-lg flex items-center gap-3 rounded-2xl px-4 py-3"
          style={{
            background: 'linear-gradient(135deg, rgba(var(--glass-1), 0.7), rgba(var(--glass-2), 0.8))',
            border: '1px solid rgba(var(--hair), 0.08)',
            borderTop: '1px solid rgba(var(--hair), 0.15)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          <button onClick={onBack} className="p-2 rounded-xl hover:bg-white/10 transition-all">
            <ArrowLeft size={18} className="text-[color:var(--text-muted)]" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-semibold text-white">المصحف الشريف</h1>
            <p className="text-[10px] text-[color:var(--text-muted)]">مصحف المدينة — رواية حفص</p>
          </div>
          <button
            onClick={toggleAudio}
            className="p-2 rounded-xl hover:bg-white/10 transition-all"
            title={audioPlaying ? 'إيقاف التلاوة' : 'تلاوة الصفحة'}
            aria-label="Play page recitation"
          >
            {audioLoading
              ? <Loader2 size={18} className="text-[#14879c] animate-spin" />
              : audioPlaying
                ? <Pause size={18} className="text-[#14879c]" fill="currentColor" />
                : <Play size={18} className="text-[#14879c]" fill="currentColor" />}
          </button>
          <button
            onClick={toggleBookmark}
            className="p-2 rounded-xl hover:bg-white/10 transition-all"
            title={isBookmarked ? 'إزالة العلامة' : 'حفظ الصفحة'}
            aria-label="Bookmark page"
          >
            {isBookmarked
              ? <BookmarkCheck size={18} className="text-[#d4af37]" />
              : <Bookmark size={18} className="text-[color:var(--text-muted)]" />}
          </button>
          <div className="text-right">
            <p className="text-xs text-[#14879c]">الجزء {juzForPage(page)}</p>
            <p className="text-[10px] text-[color:var(--text-muted)]">صفحة {page} / {TOTAL_PAGES}</p>
          </div>
        </div>

        {/* Saved pages — quick jump */}
        {bookmarks.length > 0 && (
          <div className="mx-auto max-w-lg mt-2 flex gap-1.5 overflow-x-auto pb-1">
            {bookmarks.map((b) => (
              <button
                key={b}
                onClick={() => setPage(b)}
                className="flex-shrink-0 px-2.5 py-1 rounded-lg text-[10px] transition-all"
                style={{
                  background: b === page ? 'rgba(212,175,55,0.2)' : 'rgba(var(--glass-1), 0.5)',
                  color: b === page ? '#d4af37' : 'var(--text-muted)',
                  border: '1px solid rgba(var(--hair), 0.08)',
                }}
              >
                ص {b}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Page image (pannable when zoomed; swipe pages only at 1×) */}
      <div
        className="flex-1 overflow-auto px-3 pb-4 select-none"
        onTouchStart={zoom === 1 ? onTouchStart : undefined}
        onTouchEnd={zoom === 1 ? onTouchEnd : undefined}
      >
        <div
          className="relative mx-auto"
          style={{ width: `${Math.round(zoom * 100)}%`, maxWidth: zoom > 1 ? 'none' : '28rem', transition: 'width 0.2s ease' }}
        >
          {!loaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 size={28} className="text-[#14879c] animate-spin" />
            </div>
          )}
          <img
            key={page}
            src={pageImageUrl(page)}
            alt={`صفحة ${page}`}
            loading="lazy"
            decoding="async"
            onLoad={() => setLoaded(true)}
            onDoubleClick={() => setZoom((z) => (z > 1 ? 1 : 2))}
            className="w-full h-auto rounded-xl transition-opacity duration-300"
            style={{
              opacity: loaded ? 1 : 0,
              background: '#fffdf7',
              boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
              border: '1px solid rgba(var(--hair), 0.1)',
            }}
          />
        </div>
      </div>

      {/* Floating zoom controls — affect only the page image, not the UI */}
      <div className="fixed right-3 bottom-28 z-30 flex flex-col items-center gap-2">
        <button onClick={zoomIn} disabled={zoom >= ZOOM_LEVELS[ZOOM_LEVELS.length - 1]}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all disabled:opacity-30"
          style={{ background: 'rgba(var(--glass-2), 0.92)', border: '1px solid rgba(var(--hair), 0.15)', backdropFilter: 'blur(6px)' }}
          aria-label="Zoom in">
          <ZoomIn size={18} className="text-white" />
        </button>
        {zoom > 1 && <span className="text-[10px] font-bold text-[#d4af37]">{zoom}×</span>}
        <button onClick={zoomOut} disabled={zoom <= ZOOM_LEVELS[0]}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all disabled:opacity-30"
          style={{ background: 'rgba(var(--glass-2), 0.92)', border: '1px solid rgba(var(--hair), 0.15)', backdropFilter: 'blur(6px)' }}
          aria-label="Zoom out">
          <ZoomOut size={18} className="text-white" />
        </button>
      </div>

      {/* Pager */}
      <div className="sticky bottom-0 px-4 pb-4">
        <p className="mx-auto max-w-md text-center text-[10px] text-[color:var(--text-muted)] mb-1.5 arabic-text">
          الجزء {juzForPage(page)} · الحزب {hizbForPage(page)} · الصفحة {page} من {TOTAL_PAGES}
        </p>
        <div
          className="mx-auto max-w-md flex items-center gap-3 rounded-2xl px-3 py-2"
          style={{
            background: 'linear-gradient(135deg, rgba(var(--glass-1), 0.8), rgba(var(--glass-2), 0.9))',
            border: '1px solid rgba(var(--hair), 0.1)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          {/* Forward (next page, to the left in RTL) */}
          <button
            onClick={goNext}
            disabled={page >= TOTAL_PAGES}
            className="p-2 rounded-xl hover:bg-white/10 transition-all disabled:opacity-30"
            aria-label="Next page"
          >
            <ChevronLeft size={20} className="text-white" />
          </button>

          <input
            type="range"
            min={1}
            max={TOTAL_PAGES}
            value={page}
            onChange={(e) => setPage(Number(e.target.value))}
            className="flex-1 h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#14879c]"
            dir="rtl"
          />

          <button
            onClick={goPrev}
            disabled={page <= 1}
            className="p-2 rounded-xl hover:bg-white/10 transition-all disabled:opacity-30"
            aria-label="Previous page"
          >
            <ChevronRight size={20} className="text-white" />
          </button>

          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={TOTAL_PAGES}
            value={pageStr}
            onChange={(e) => setPageStr(e.target.value)}
            onBlur={commitPage}
            onKeyDown={(e) => { if (e.key === 'Enter') { commitPage(); (e.currentTarget as HTMLInputElement).blur(); } }}
            className="w-14 px-2 py-1.5 rounded-lg bg-white/5 text-center text-xs text-white outline-none"
          />

          <button
            onClick={() => setTafsirFollow((v) => !v)}
            className="p-2 rounded-xl hover:bg-white/10 transition-all"
            aria-label="Tafsir window"
            title="نافذة التفسير مع التلاوة"
          >
            <BookOpen size={18} className={tafsirFollow ? 'text-[#d4af37]' : 'text-white'} />
          </button>

          <button
            onClick={() => setShowIndex(true)}
            className="p-2 rounded-xl hover:bg-white/10 transition-all"
            aria-label="Index"
            title="فهرس الصفحات"
          >
            <LayoutGrid size={18} className="text-white" />
          </button>
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
            <h2 className="text-base font-semibold text-white arabic-text">فهرس الصفحات</h2>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4 max-w-lg mx-auto w-full space-y-4">
            {JUZ_START_PAGES.map((start, i) => {
              const end = (JUZ_START_PAGES[i + 1] ?? TOTAL_PAGES + 1) - 1;
              return (
                <div key={i}>
                  <p className="text-[10px] text-[#d4af37] mb-1.5 arabic-text">الجزء {i + 1}</p>
                  <div className="grid grid-cols-6 gap-1.5" dir="ltr">
                    {Array.from({ length: end - start + 1 }, (_, k) => start + k).map((p) => (
                      <button
                        key={p}
                        onClick={() => { setPage(p); setShowIndex(false); }}
                        className="py-2 rounded-lg text-xs transition-all"
                        style={{ background: p === page ? 'rgba(20,135,156,0.3)' : 'rgba(var(--hair),0.05)', color: p === page ? '#14879c' : '#fff', border: '1px solid rgba(var(--hair),0.06)' }}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
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
