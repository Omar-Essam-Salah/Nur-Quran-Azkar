import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useI18n } from '@/i18n';
import { pushBack } from '@/lib/backStack';
import { SkeletonCards } from '@/components/Skeleton';

interface AsmaPageProps {
  onBack: () => void;
}

interface AsmaName { n: number; name: string; translit: string; meaning: string }
interface AsmaExtra { ar: string; exp: string; expEn: string }

export default function AsmaPage({ onBack }: AsmaPageProps) {
  const { t, lang } = useI18n();
  const isAr = lang === 'ar';
  const [names, setNames] = useState<AsmaName[] | null>(null);
  const [extra, setExtra] = useState<Record<string, AsmaExtra>>({});
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<AsmaName | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`${import.meta.env.BASE_URL}data/asma.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => active && setNames(d.names))
      .catch(() => active && setError(true));
    fetch(`${import.meta.env.BASE_URL}data/asma-extra.json`)
      .then((r) => (r.ok ? r.json() : {}))
      .then((d) => active && setExtra(d))
      .catch(() => {});
    return () => { active = false; };
  }, []);

  // Hardware back closes the meaning popup instead of leaving the page.
  useEffect(() => { if (selected) return pushBack(() => { setSelected(null); return true; }); }, [selected]);

  return (
    <div className="page-enter min-h-screen">
      <header className="sticky top-0 z-40 px-4 py-3">
        <div
          className="mx-auto max-w-lg flex items-center gap-3 rounded-2xl px-4 py-3"
          style={{
            background: 'linear-gradient(135deg, rgba(var(--glass-1), 0.6), rgba(var(--glass-2), 0.7))',
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
            <h1 className="text-base font-semibold text-white arabic-text">{t('The 99 Names of Allah', 'الأسماء الحسنى')}</h1>
            <p className="text-[10px] text-[color:var(--text-muted)]">{t('Tap a name to see its meaning', 'اضغط على اسم لمعرفة معناه')}</p>
          </div>
        </div>
      </header>

      <div className="px-4 pt-2 pb-8 max-w-lg mx-auto">
        {!names && !error && <SkeletonCards count={9} grid />}
        {error && <div className="glass-card p-8 text-center text-sm text-[color:var(--text-muted)]">{t('Could not load.', 'تعذّر التحميل.')}</div>}

        <div className="grid grid-cols-3 gap-2.5">
          {names?.map((a) => (
            <button
              key={a.n}
              onClick={() => setSelected(a)}
              className="glass-card-sm p-3 text-center space-y-1 relative transition-all active:scale-95 hover:bg-white/5"
            >
              <span className="absolute top-1.5 right-1.5 text-[8px] text-[color:var(--text-muted)]">{a.n}</span>
              <p className="arabic-text text-xl text-[#d4af37] gold-glow leading-tight pt-1.5">{a.name}</p>
              <p className="text-[8px] text-[#14879c] uppercase tracking-wide truncate">{a.translit}</p>
            </button>
          ))}
        </div>
        <div className="h-8" />
      </div>

      {/* Tap-to-reveal meaning */}
      {selected && (
        <div
          className="fixed inset-0 z-[80] overflow-y-auto"
          style={{ background: 'rgba(4,12,16,0.72)' }}
          onClick={() => setSelected(null)}
        >
          <div className="flex min-h-full items-center justify-center p-5">
            <div
              className="max-w-sm w-full rounded-2xl text-center max-h-[88vh] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              style={{ background: 'linear-gradient(135deg, rgba(var(--glass-1), 0.98), rgba(var(--glass-2), 0.98))', border: '1px solid rgba(212,175,55,0.3)' }}
            >
              {/* Header — always visible */}
              <div className="px-6 pt-5 pb-3 space-y-1.5 flex-shrink-0">
                <span className="text-[10px] text-[color:var(--text-muted)]">{selected.n} / 99</span>
                <p className="arabic-text text-3xl text-[#d4af37] gold-glow leading-tight">{selected.name}</p>
                <p className="text-[11px] text-[#14879c] uppercase tracking-wider">{selected.translit}</p>
                <p className="text-sm text-white/90 leading-relaxed">
                  {extra[selected.n]?.ar && <span className="arabic-text text-[#d4af37]">{extra[selected.n].ar}</span>}
                  {extra[selected.n]?.ar && <span className="text-white/40"> · </span>}
                  {selected.meaning}
                </p>
              </div>
              {/* Explanation — scrolls on its own only if very long */}
              {extra[selected.n] && (
                <div className="px-6 overflow-y-auto flex-1 min-h-0 custom-scrollbar">
                  <p className={`text-[13px] text-white/70 leading-relaxed border-t border-white/10 pt-3 pb-1 ${isAr ? 'arabic-text' : ''}`} dir={isAr ? 'rtl' : 'ltr'}>
                    {isAr ? extra[selected.n].exp : extra[selected.n].expEn}
                  </p>
                </div>
              )}
              {/* Close — always visible */}
              <div className="px-6 pt-2 pb-4 flex-shrink-0">
                <button onClick={() => setSelected(null)} className="glass-btn w-full py-2.5 text-sm">{t('Close', 'إغلاق')}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
