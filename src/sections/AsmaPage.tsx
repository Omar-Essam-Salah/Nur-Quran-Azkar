import { useEffect, useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useI18n } from '@/i18n';

interface AsmaPageProps {
  onBack: () => void;
}

interface AsmaName { n: number; name: string; translit: string; meaning: string }

export default function AsmaPage({ onBack }: AsmaPageProps) {
  const { t } = useI18n();
  const [names, setNames] = useState<AsmaName[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`${import.meta.env.BASE_URL}data/asma.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => active && setNames(d.names))
      .catch(() => active && setError(true));
    return () => { active = false; };
  }, []);

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
            <h1 className="text-base font-semibold text-white arabic-text">الأسماء الحسنى</h1>
            <p className="text-[10px] text-[color:var(--text-muted)]">{t('The 99 Names of Allah', '٩٩ اسمًا لله تعالى')}</p>
          </div>
        </div>
      </header>

      <div className="px-4 pt-2 pb-8 max-w-lg mx-auto">
        {!names && !error && (
          <div className="glass-card p-10 flex justify-center"><Loader2 size={26} className="text-[#14879c] animate-spin" /></div>
        )}
        {error && <div className="glass-card p-8 text-center text-sm text-[color:var(--text-muted)]">تعذّر التحميل.</div>}

        <div className="grid grid-cols-2 gap-3">
          {names?.map((a) => (
            <div key={a.n} className="glass-card-sm p-4 text-center space-y-1.5 relative">
              <span className="absolute top-2 right-2 text-[9px] text-[color:var(--text-muted)]">{a.n}</span>
              <p className="arabic-text text-2xl text-[#d4af37] gold-glow leading-tight pt-2">{a.name}</p>
              <p className="text-[10px] text-[#14879c] uppercase tracking-wider">{a.translit}</p>
              <p className="text-[11px] text-[color:var(--text-muted)] leading-snug">{a.meaning}</p>
            </div>
          ))}
        </div>
        <div className="h-8" />
      </div>
    </div>
  );
}
