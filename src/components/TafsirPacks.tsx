import { useEffect, useRef, useState } from 'react';
import { BookOpen, Download, Loader2, CheckCircle2, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '@/i18n';
import { downloadTafsirPack, deleteTafsirPack, downloadedTafsirPacks } from '@/lib/contentCache';

const PACKS = [
  { id: 16, ar: 'التفسير الميسّر', en: 'Al-Muyassar' },
  { id: 91, ar: 'تفسير السعدي', en: 'As-Saʿdī' },
  { id: 14, ar: 'تفسير ابن كثير', en: 'Ibn Kathīr' },
  { id: 169, ar: 'ابن كثير (إنجليزي)', en: 'Ibn Kathīr (English)' },
];

export function TafsirPacks() {
  const { t, lang } = useI18n();
  const isAr = lang === 'ar';
  const [done, setDone] = useState<number[]>([]);
  const [busy, setBusy] = useState<number | null>(null);
  const [prog, setProg] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const refresh = () => downloadedTafsirPacks().then(setDone).catch(() => {});
  useEffect(() => { refresh(); return () => abortRef.current?.abort(); }, []);

  const download = async (id: number) => {
    if (busy !== null) return;
    const c = new AbortController(); abortRef.current = c; setBusy(id); setProg(0);
    try {
      await downloadTafsirPack(id, (p) => setProg(Math.round((p.done / p.total) * 100)), c.signal);
      toast(t('Tafsir saved offline ✓', 'تم حفظ التفسير للعمل دون إنترنت ✓'));
      refresh();
    } catch (e) { if ((e as Error)?.name !== 'AbortError') toast(t('Download failed', 'فشل التحميل'), { description: t('Check your connection and try again.', 'تحقّق من اتصالك وحاول مجددًا.') }); }
    finally { setBusy(null); abortRef.current = null; }
  };
  const remove = async (id: number) => { await deleteTafsirPack(id); toast(t('Removed', 'تمّت الإزالة')); refresh(); };

  return (
    <div className="glass-card-sm p-4 space-y-2.5">
      <h3 className="text-xs text-[color:var(--text-muted)] uppercase tracking-wider arabic-text flex items-center gap-1.5">
        <BookOpen size={13} className="text-[#d4af37]" /> {t('Tafsir offline packs', 'حزم التفسير للأوفلاين')}
      </h3>
      {PACKS.map((p) => {
        const isDone = done.includes(p.id);
        const isBusy = busy === p.id;
        return (
          <div key={p.id} className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <div className="flex-1 min-w-0">
              <p className="text-[12.5px] text-white arabic-text">{isAr ? p.ar : p.en}</p>
              {isBusy && (
                <div className="mt-1.5 w-full h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-[#14879c] transition-all" style={{ width: `${prog}%` }} />
                </div>
              )}
            </div>
            {isBusy ? (
              <button onClick={() => abortRef.current?.abort()} className="p-1.5 rounded-lg hover:bg-white/10 flex items-center gap-1 text-[10px] text-[color:var(--text-muted)]">
                <Loader2 size={14} className="animate-spin text-[#14879c]" /> {prog}% <X size={13} />
              </button>
            ) : isDone ? (
              <div className="flex items-center gap-1">
                <CheckCircle2 size={16} className="text-[#10b981]" />
                <button onClick={() => remove(p.id)} className="p-1.5 rounded-lg hover:bg-red-500/15" title={t('Delete', 'حذف')}><Trash2 size={14} className="text-red-400/80" /></button>
              </div>
            ) : (
              <button onClick={() => download(p.id)} disabled={busy !== null} className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-50" title={t('Download', 'تحميل')}>
                <Download size={16} className="text-[#d4af37]" />
              </button>
            )}
          </div>
        );
      })}
      <p className="text-[10px] text-[color:var(--text-muted)] arabic-text leading-relaxed">
        {t('Downloads the entire tafsir (all 114 surahs) so it works 100% offline — no need to open each ayah first.', 'يُحمّل التفسير كاملًا (١١٤ سورة) ليعمل بدون إنترنت — بلا حاجة لفتح كل آية أولًا.')}
      </p>
    </div>
  );
}
