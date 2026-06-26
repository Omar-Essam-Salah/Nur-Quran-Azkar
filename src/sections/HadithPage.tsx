import { useEffect, useState } from 'react';
import { ArrowLeft, Quote } from 'lucide-react';
import { useI18n } from '@/i18n';
import { SkeletonCards } from '@/components/Skeleton';

interface HadithPageProps {
  onBack: () => void;
}

interface Hadith { n: number; text: string; en?: string }
interface HadithBook { id: string; title: string; author: string; hadiths: Hadith[] }

export default function HadithPage({ onBack }: HadithPageProps) {
  const { t, lang } = useI18n();
  const [book, setBook] = useState<HadithBook | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`${import.meta.env.BASE_URL}data/hadith-nawawi.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => active && setBook(d))
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
            <h1 className="text-base font-semibold text-white arabic-text">{lang === 'ar' ? (book?.title ?? 'الأربعون النووية') : "Al-Nawawi's Forty Hadith"}</h1>
            <p className="text-[10px] text-[color:var(--text-muted)] arabic-text">{lang === 'ar' ? (book?.author ?? 'الإمام النووي') : 'Imam an-Nawawi'}</p>
          </div>
        </div>
      </header>

      <div className="px-4 pt-2 pb-8 max-w-lg mx-auto space-y-3">
        {!book && !error && <SkeletonCards count={6} />}
        {error && <div className="glass-card p-8 text-center text-sm text-[color:var(--text-muted)]">{t('Could not load the hadiths.', 'تعذّر تحميل الأحاديث.')}</div>}

        {book?.hadiths.map((h) => (
          <div key={h.n} className="glass-card-sm p-5 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-[#d4af37]/15 flex items-center justify-center text-[11px] font-bold text-[#d4af37]">
                {h.n}
              </span>
              <Quote size={14} className="text-[color:var(--text-muted)]" />
            </div>
            <p className="arabic-text text-white leading-loose text-[15px]" dir="rtl">{h.text}</p>
            {h.en && (
              <p className="text-[13px] text-[color:var(--text-muted)] leading-relaxed border-t border-white/5 pt-2.5" dir="ltr">{h.en}</p>
            )}
          </div>
        ))}
        <div className="h-8" />
      </div>
    </div>
  );
}
