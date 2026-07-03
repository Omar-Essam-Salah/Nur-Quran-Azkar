import { useEffect, useRef, useState } from 'react';
import { HardDrive, Trash2, Loader2, Download, X, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '@/i18n';
import { surahList } from '@/data/surahList';
import { RECITERS, getReciter } from '@/data/reciters';
import { fetchSurahContent } from '@/lib/quranApi';
import {
  audioStorageStats, deleteSurahAudioAll, deleteAllAudio, downloadSurahAudio, isSurahAudioDownloaded,
  type AudioStats,
} from '@/lib/contentCache';

const mb = (b: number) => b >= 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`;
const reciterName = (id: number, ar: boolean) => { const r = RECITERS.find((x) => x.apiId === id); return r ? (ar ? r.arabicName : r.name) : `#${id}`; };
const surahName = (n: number, ar: boolean) => { const s = surahList.find((x) => x.number === n); return s ? (ar ? s.name : s.englishName) : `${n}`; };

export function StorageManager() {
  const { t, lang } = useI18n();
  const isAr = lang === 'ar';
  const [stats, setStats] = useState<AudioStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [full, setFull] = useState<{ surah: number; total: number; done: number } | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const refresh = () => { setLoading(true); audioStorageStats().then((s) => { setStats(s); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(() => { refresh(); return () => abortRef.current?.abort(); }, []);

  const savedReciter = (() => { try { return getReciter(JSON.parse(localStorage.getItem('nur-settings') || '{}').reciter); } catch { return getReciter(undefined); } })();

  const removeSurah = async (reciterId: number, chapter: number) => {
    await deleteSurahAudioAll(reciterId, chapter);
    toast(t('Removed', 'تمّت الإزالة'), { description: `${surahName(chapter, isAr)} — ${reciterName(reciterId, isAr)}` });
    refresh();
  };
  const removeAll = async () => {
    await deleteAllAudio();
    toast(t('All downloaded audio removed', 'تمّ حذف كل الصوت المحمّل'));
    refresh();
  };

  const downloadFullQuran = async () => {
    if (full) return;
    if (savedReciter.everyayah) {
      toast(t('Choose a Quran.com reciter first', 'اختر قارئًا من Quran.com أولًا'), { description: t('Full-Quran download works with the main reciters; you can still download per surah.', 'التحميل الكامل يعمل مع القرّاء الأساسيين؛ ويمكنك التحميل لكل سورة على حدة.') });
      return;
    }
    const controller = new AbortController();
    abortRef.current = controller;
    setFull({ surah: 0, total: 114, done: 0 });
    toast(t('Downloading the whole Quran…', 'جارٍ تحميل المصحف كاملًا…'), { description: t('This is large (~1 GB) and continues while the app is open.', 'الحجم كبير (~١ جيجا) ويستمرّ ما دام التطبيق مفتوحًا.') });
    try {
      for (let ch = 1; ch <= 114; ch++) {
        if (controller.signal.aborted) break;
        setFull({ surah: ch, total: 114, done: ch - 1 });
        if (await isSurahAudioDownloaded(savedReciter.apiId, ch)) continue;
        try {
          const content = await fetchSurahContent(ch, { reciterId: savedReciter.apiId, translationIds: [], signal: controller.signal });
          const urls = content.verses.filter((v) => v.audioUrl).map((v) => ({ ayah: v.ayah, url: v.audioUrl as string }));
          if (urls.length) await downloadSurahAudio(savedReciter.apiId, ch, urls, undefined, controller.signal);
        } catch (e) { if ((e as Error)?.name === 'AbortError') break; /* skip this surah, continue */ }
      }
      if (!controller.signal.aborted) toast(t('Quran download finished ✓', 'اكتمل تحميل المصحف ✓'));
    } finally {
      setFull(null); abortRef.current = null; refresh();
    }
  };

  return (
    <div className="glass-card-sm p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs text-[color:var(--text-muted)] uppercase tracking-wider arabic-text flex items-center gap-1.5">
          <HardDrive size={13} className="text-[#d4af37]" /> {t('Offline audio storage', 'تخزين الصوت للأوفلاين')}
        </h3>
        <span className="text-[11px] text-[#14879c] tabular-nums">{loading ? '…' : mb(stats?.bytes || 0)}</span>
      </div>

      {/* Download full Quran (current reciter) */}
      {full ? (
        <div className="rounded-xl p-3" style={{ background: 'rgba(212,175,55,0.10)', border: '1px solid rgba(212,175,55,0.25)' }}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] text-[#d4af37] arabic-text">{t('Downloading', 'جارٍ التحميل')} {surahName(full.surah, isAr)} ({full.surah}/114)</span>
            <button onClick={() => abortRef.current?.abort()} className="p-1 rounded-lg hover:bg-white/10"><X size={14} className="text-[color:var(--text-muted)]" /></button>
          </div>
          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-[#d4af37] to-[#14879c] transition-all" style={{ width: `${Math.round((full.done / full.total) * 100)}%` }} />
          </div>
        </div>
      ) : (
        <button onClick={downloadFullQuran} className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5" style={{ background: 'rgba(20,135,156,0.12)', border: '1px solid rgba(20,135,156,0.25)' }}>
          <Download size={16} className="text-[#14879c] flex-shrink-0" />
          <div className="flex-1 min-w-0 text-right">
            <p className="text-[12.5px] font-semibold text-white arabic-text">{t('Download the whole Quran', 'تحميل المصحف كاملًا')}</p>
            <p className="text-[9px] text-[color:var(--text-muted)] arabic-text">{reciterName(savedReciter.apiId, isAr)} · {t('large, ~1 GB', 'حجم كبير ~١ جيجا')}</p>
          </div>
        </button>
      )}

      {/* Downloaded surahs list */}
      {loading ? (
        <div className="flex justify-center py-4"><Loader2 size={18} className="animate-spin text-[#14879c]" /></div>
      ) : !stats?.surahs.length ? (
        <p className="text-[11px] text-[color:var(--text-muted)] arabic-text text-center py-3">{t('No surahs downloaded yet. Use the download button in the reader.', 'لا توجد سور محمّلة بعد. استخدم زر التحميل في القارئ.')}</p>
      ) : (
        <>
          <div className="space-y-1.5 max-h-72 overflow-y-auto custom-scrollbar">
            {stats.surahs.map((s) => (
              <div key={`${s.reciterId}/${s.chapter}`} className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <CheckCircle2 size={14} className="text-[#10b981] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-white arabic-text truncate">{surahName(s.chapter, isAr)}</p>
                  <p className="text-[9px] text-[color:var(--text-muted)] arabic-text truncate">{reciterName(s.reciterId, isAr)} · {s.ayat} {t('ayat', 'آية')} · {mb(s.bytes)}</p>
                </div>
                <button onClick={() => removeSurah(s.reciterId, s.chapter)} className="p-1.5 rounded-lg hover:bg-red-500/15 flex-shrink-0" title={t('Delete', 'حذف')}>
                  <Trash2 size={14} className="text-red-400/80" />
                </button>
              </div>
            ))}
          </div>
          <button onClick={removeAll} className="w-full text-[11px] text-red-400/80 py-2 rounded-lg hover:bg-red-500/10 arabic-text">
            {t('Delete all downloaded audio', 'حذف كل الصوت المحمّل')} ({mb(stats.bytes)})
          </button>
        </>
      )}
    </div>
  );
}
