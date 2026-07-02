import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BookText, Search, ChevronLeft, Download, CheckCircle2, Loader2 } from 'lucide-react';
import { useI18n } from '@/i18n';
import { pushBack } from '@/lib/backStack';
import { SkeletonCards } from '@/components/Skeleton';
import { SpeakButton } from '@/components/SpeakButton';
import { downloadForOffline, isDownloaded, markDownloaded } from '@/lib/offlineDownload';

interface HadithPageProps { onBack: () => void }

// Authentic collections (Arabic + English) fetched from the free jsDelivr CDN and
// cached for offline reuse — thousands of hadith, with the English serving as the
// accessible meaning.
const CDN = 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions';
const COLLECTIONS = [
  { id: 'bukhari', ar: 'صحيح البخاري', en: 'Sahih al-Bukhari', count: '٧٥٦٣' },
  { id: 'muslim', ar: 'صحيح مسلم', en: 'Sahih Muslim', count: '٧٤٧٠' },
  { id: 'nawawi', ar: 'الأربعون النووية', en: "An-Nawawi's 40", count: '٤٢' },
  { id: 'qudsi', ar: 'الأحاديث القدسية', en: 'Hadith Qudsi', count: '٤٠' },
  { id: 'abudawud', ar: 'سنن أبي داود', en: 'Sunan Abi Dawud', count: '٥٢٧٤' },
  { id: 'tirmidhi', ar: 'جامع الترمذي', en: "Jami' at-Tirmidhi", count: '٣٩٥٦' },
  { id: 'nasai', ar: 'سنن النسائي', en: "Sunan an-Nasa'i", count: '٥٧٦٢' },
  { id: 'ibnmajah', ar: 'سنن ابن ماجه', en: 'Sunan Ibn Majah', count: '٤٣٤١' },
  { id: 'malik', ar: 'موطأ مالك', en: "Muwatta' Malik", count: '١٨٥٨' },
];
type Collection = typeof COLLECTIONS[number];

interface HItem { n: number; ar: string; en: string }

const stripTashkeel = (s: string) => s.replace(/[ً-ٰٟـ]/g, '');

export default function HadithPage({ onBack }: HadithPageProps) {
  const { t, lang } = useI18n();
  const isAr = lang === 'ar';
  const [col, setCol] = useState<Collection | null>(null);
  const [items, setItems] = useState<HItem[] | null>(null);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(30);

  // Per-collection offline download state.
  const [dl, setDl] = useState<Record<string, 'idle' | 'busy' | 'done'>>(() => {
    const s: Record<string, 'idle' | 'busy' | 'done'> = {};
    COLLECTIONS.forEach((c) => { if (isDownloaded(`hadith-${c.id}`)) s[c.id] = 'done'; });
    return s;
  });
  const downloadCollection = async (c: Collection) => {
    if (dl[c.id] === 'busy' || dl[c.id] === 'done') return;
    setDl((s) => ({ ...s, [c.id]: 'busy' }));
    const a = await downloadForOffline(`${CDN}/ara-${c.id}.min.json`);
    const e = await downloadForOffline(`${CDN}/eng-${c.id}.min.json`);
    if (a && e) { markDownloaded(`hadith-${c.id}`); setDl((s) => ({ ...s, [c.id]: 'done' })); }
    else setDl((s) => ({ ...s, [c.id]: 'idle' }));
  };

  // Hardware back: from a collection → back to the list; from the list → leave.
  useEffect(() => { if (col) return pushBack(() => { setCol(null); return true; }); }, [col]);

  useEffect(() => {
    if (!col) { setItems(null); return; }
    let active = true;
    setItems(null); setError(false); setQuery(''); setLimit(30);
    Promise.all([
      fetch(`${CDN}/ara-${col.id}.min.json`).then((r) => r.json()),
      fetch(`${CDN}/eng-${col.id}.min.json`).then((r) => r.json()),
    ])
      .then(([a, e]) => {
        if (!active) return;
        const eng = new Map<number, string>();
        ((e?.hadiths ?? []) as { hadithnumber: number; text: string }[]).forEach((h) => eng.set(h.hadithnumber, h.text));
        const merged: HItem[] = ((a?.hadiths ?? []) as { hadithnumber: number; text: string }[]).map((h) => ({
          n: h.hadithnumber, ar: h.text, en: eng.get(h.hadithnumber) ?? '',
        }));
        setItems(merged);
      })
      .catch(() => active && setError(true));
    return () => { active = false; };
  }, [col]);

  const filtered = useMemo(() => {
    if (!items) return [];
    const q = query.trim();
    if (!q) return items;
    const qa = stripTashkeel(q);
    const ql = q.toLowerCase();
    return items.filter((h) => stripTashkeel(h.ar).includes(qa) || h.en.toLowerCase().includes(ql) || String(h.n) === q);
  }, [items, query]);

  return (
    <div className="page-enter min-h-screen">
      <header className="sticky top-0 z-40 px-4 py-3">
        <div className="mx-auto max-w-lg flex items-center gap-3 rounded-2xl px-4 py-3"
          style={{ background: 'linear-gradient(135deg, rgba(var(--glass-1), 0.6), rgba(var(--glass-2), 0.7))', border: '1px solid rgba(var(--hair), 0.08)', borderTop: '1px solid rgba(var(--hair), 0.15)', backdropFilter: 'blur(8px)' }}>
          <button onClick={() => (col ? setCol(null) : onBack())} className="p-2 rounded-xl hover:bg-white/10 transition-all">
            <ArrowLeft size={18} className="text-[color:var(--text-muted)]" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-semibold text-white arabic-text truncate">{col ? (isAr ? col.ar : col.en) : t('Hadith Library', 'مكتبة الحديث')}</h1>
            <p className="text-[10px] text-[color:var(--text-muted)]">{col ? (isAr ? col.en : col.ar) : t('Authentic collections · Arabic & English', 'مجموعات موثّقة · عربي وإنجليزي')}</p>
          </div>
          <BookText size={18} className="text-[#d4af37]" />
        </div>
      </header>

      <div className="px-4 pt-2 pb-10 max-w-lg mx-auto space-y-3">
        {/* Collection picker */}
        {!col && (
          <>
            <p className="text-[11px] text-[color:var(--text-muted)] arabic-text leading-relaxed px-1" dir={isAr ? 'rtl' : 'ltr'}>
              {t('Each collection downloads once then works offline. The English is the accessible meaning of each hadith.',
                 'كل مجموعة تُحمّل مرّة ثم تعمل بدون إنترنت. والترجمة الإنجليزية هي المعنى المبسّط لكل حديث.')}
            </p>
            {COLLECTIONS.map((c) => (
              <div key={c.id} className="glass-card-sm w-full p-4 flex items-center gap-2">
                <button onClick={() => setCol(c)} className="flex items-center gap-3 flex-1 min-w-0 text-right">
                  <div className="w-10 h-10 rounded-xl bg-[#d4af37]/15 flex items-center justify-center flex-shrink-0">
                    <BookText size={18} className="text-[#d4af37]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white arabic-text">{isAr ? c.ar : c.en}</p>
                    <p className="text-[10px] text-[color:var(--text-muted)] arabic-text truncate" dir={isAr ? 'rtl' : 'ltr'}>{isAr ? c.en : c.ar} · {c.count} {t('hadith', 'حديث')}</p>
                  </div>
                </button>
                <button onClick={() => downloadCollection(c)} disabled={dl[c.id] === 'busy' || dl[c.id] === 'done'}
                  className="p-2 rounded-xl hover:bg-white/10 flex-shrink-0 disabled:opacity-80"
                  title={dl[c.id] === 'done' ? t('Saved offline', 'محفوظ للعمل دون إنترنت') : t('Download for offline', 'تحميل للعمل دون إنترنت')}>
                  {dl[c.id] === 'done' ? <CheckCircle2 size={17} className="text-[#10b981]" /> : dl[c.id] === 'busy' ? <Loader2 size={17} className="animate-spin text-[#14879c]" /> : <Download size={17} className="text-[#d4af37]" />}
                </button>
                <ChevronLeft size={16} className="text-[color:var(--text-muted)] flex-shrink-0" />
              </div>
            ))}
          </>
        )}

        {/* A collection's hadith */}
        {col && (
          <>
            <div className="relative">
              <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--text-muted)]" />
              <input value={query} onChange={(e) => { setQuery(e.target.value); setLimit(30); }}
                placeholder={t('Search in this collection…', 'ابحث في المجموعة…')} dir={isAr ? 'rtl' : 'ltr'}
                className="w-full pr-9 pl-3 py-2.5 rounded-xl bg-white/5 text-sm text-white arabic-text outline-none border border-transparent focus:border-[#d4af37]/40 placeholder:text-[color:var(--text-muted)]/60" />
            </div>

            {error && <div className="glass-card p-8 text-center text-sm text-[color:var(--text-muted)] arabic-text">{t('Could not load. Check your connection and try again.', 'تعذّر التحميل. تحقّق من الاتصال وحاول مجددًا.')}</div>}
            {!items && !error && <SkeletonCards count={5} />}

            {items && filtered.slice(0, limit).map((h) => (
              <div key={h.n} className="glass-card-sm p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-[#d4af37]/15 flex items-center justify-center text-[10px] font-bold text-[#d4af37]">{h.n}</span>
                  <span className="text-[10px] text-[color:var(--text-muted)] arabic-text">{isAr ? col.ar : col.en}</span>
                  <SpeakButton text={isAr ? h.ar : (h.en || h.ar)} lang={isAr || !h.en ? 'ar-SA' : 'en-US'} size={15} className="ml-auto p-1.5 rounded-lg hover:bg-white/10 transition-all flex-shrink-0" />
                </div>
                <p className="arabic-text text-white leading-loose text-[15px]" dir="rtl">{h.ar}</p>
                {h.en && (
                  <div className="border-t border-white/5 pt-2.5">
                    <p className="text-[9px] uppercase tracking-wider text-[#14879c] mb-1">{t('Meaning', 'المعنى')}</p>
                    <p className="text-[13px] text-[color:var(--text-muted)] leading-relaxed" dir="ltr">{h.en}</p>
                  </div>
                )}
              </div>
            ))}

            {items && filtered.length > limit && (
              <button onClick={() => setLimit((l) => l + 30)} className="glass-btn w-full py-2.5 text-sm flex items-center justify-center gap-2">
                {t('Load more', 'عرض المزيد')} ({filtered.length - limit})
              </button>
            )}
            {items && filtered.length === 0 && (
              <div className="glass-card p-8 text-center text-sm text-[color:var(--text-muted)] arabic-text">{t('No results.', 'لا نتائج.')}</div>
            )}
            {items && <div className="text-center text-[10px] text-[color:var(--text-muted)] py-2">{filtered.length} {t('hadith', 'حديث')}</div>}
          </>
        )}
        <div className="h-8" />
      </div>
    </div>
  );
}
