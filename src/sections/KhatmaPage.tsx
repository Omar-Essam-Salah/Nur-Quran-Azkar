import { useState } from 'react';
import { ArrowLeft, BookOpen, Check, RotateCcw } from 'lucide-react';
import type { Page } from '@/types';
import { useI18n } from '@/i18n';

const TOTAL = 604;
const PRESETS = [7, 15, 30, 60];

interface Khatma { targetDays: number; currentPage: number; startDate: string }

function load(): Khatma {
  try {
    const k = JSON.parse(localStorage.getItem('nur-khatma') || '');
    if (k && k.targetDays) return k;
  } catch { /* ignore */ }
  return { targetDays: 30, currentPage: 1, startDate: new Date().toISOString() };
}

interface KhatmaPageProps {
  onBack: () => void;
  onNavigate: (p: Page) => void;
}

export default function KhatmaPage({ onBack, onNavigate }: KhatmaPageProps) {
  const { t } = useI18n();
  const [k, setK] = useState<Khatma>(load);

  const save = (next: Khatma) => {
    setK(next);
    localStorage.setItem('nur-khatma', JSON.stringify(next));
  };

  const daily = Math.ceil(TOTAL / k.targetDays);
  const pagesRead = k.currentPage - 1;
  const progress = Math.min(100, Math.round((pagesRead / TOTAL) * 100));
  const done = k.currentPage > TOTAL;
  const from = Math.min(TOTAL, k.currentPage);
  const to = Math.min(TOTAL, k.currentPage + daily - 1);

  const readNow = () => {
    localStorage.setItem('nur-mushaf-page', String(from));
    onNavigate('mushaf');
  };
  const markDone = () => save({ ...k, currentPage: Math.min(TOTAL + 1, to + 1) });
  const reset = () => save({ targetDays: k.targetDays, currentPage: 1, startDate: new Date().toISOString() });

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
            <h1 className="text-base font-semibold text-white arabic-text">خطة الختمة</h1>
            <p className="text-[10px] text-[color:var(--text-muted)]">{t('Quran completion plan', 'هدف يومي وتتبّع التقدّم')}</p>
          </div>
          <button onClick={reset} className="p-2 rounded-xl hover:bg-white/10 transition-all" title="إعادة">
            <RotateCcw size={16} className="text-[color:var(--text-muted)]" />
          </button>
        </div>
      </header>

      <div className="px-4 pt-2 pb-8 max-w-lg mx-auto space-y-4">
        {/* Progress ring */}
        <div className="glass-card p-6 text-center space-y-4">
          <div className="relative w-44 h-44 mx-auto">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(var(--hair),0.08)" strokeWidth="6" />
              <circle cx="60" cy="60" r="54" fill="none" stroke="#14879c" strokeWidth="6" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 54}`} strokeDashoffset={`${2 * Math.PI * 54 * (1 - progress / 100)}`}
                style={{ transition: 'stroke-dashoffset 0.4s ease' }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-4xl font-light text-white">{progress}%</p>
              <p className="text-[10px] text-[color:var(--text-muted)]">{pagesRead} / {TOTAL} {t('pages', 'صفحة')}</p>
            </div>
          </div>
          {done ? (
            <p className="text-sm text-[#d4af37] arabic-text">ما شاء الله، أتممت الختمة! 🌙</p>
          ) : (
            <p className="text-sm text-white arabic-text">وِرد اليوم: من صفحة <b className="text-[#14879c]">{from}</b> إلى <b className="text-[#14879c]">{to}</b></p>
          )}
        </div>

        {/* Target days */}
        <div className="glass-card-sm p-4 space-y-3">
          <h3 className="text-xs text-[color:var(--text-muted)] uppercase tracking-wider arabic-text">مدة الختمة</h3>
          <div className="grid grid-cols-4 gap-2">
            {PRESETS.map((d) => {
              const on = k.targetDays === d;
              return (
                <button key={d} onClick={() => save({ ...k, targetDays: d })}
                  className="py-2 rounded-xl text-sm transition-all"
                  style={{ background: on ? 'rgba(20,135,156,0.2)' : 'rgba(var(--hair),0.04)', color: on ? '#14879c' : 'var(--text-muted)' }}>
                  {d} {t('d', 'يوم')}
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-[color:var(--text-muted)] arabic-text">≈ {daily} {t('pages/day', 'صفحة يوميًا')}</p>
        </div>

        {/* Actions */}
        {!done && (
          <div className="grid grid-cols-2 gap-3">
            <button onClick={readNow} className="glass-btn py-3 flex items-center justify-center gap-2 text-sm">
              <BookOpen size={16} /> {t('Read now', 'اقرأ الآن')}
            </button>
            <button onClick={markDone} className="py-3 rounded-full flex items-center justify-center gap-2 text-sm"
              style={{ background: 'rgba(212,175,55,0.15)', color: '#d4af37', border: '1px solid rgba(212,175,55,0.3)' }}>
              <Check size={16} /> {t('Done today', 'تمّ ورد اليوم')}
            </button>
          </div>
        )}
        <div className="h-8" />
      </div>
    </div>
  );
}
