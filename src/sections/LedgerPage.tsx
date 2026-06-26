import { useEffect, useState } from 'react';
import { ArrowLeft, BookOpen, Flame, Hash, CalendarCheck, Bookmark, Award, Sparkles } from 'lucide-react';
import { getLedger, DAILY_GOAL_AYAHS, type LedgerView } from '@/lib/ledger';
import { useI18n } from '@/i18n';

interface LedgerPageProps { onBack: () => void }

export default function LedgerPage({ onBack }: LedgerPageProps) {
  const { t } = useI18n();
  const [data, setData] = useState<LedgerView | null>(null);

  useEffect(() => { setData(getLedger()); }, []);

  const pct = data?.goalPct ?? 0;
  const R = 52;
  const C = 2 * Math.PI * R;
  const dash = (pct / 100) * C;

  const encouragement = pct >= 100
    ? t('You reached today’s goal — may Allah accept it 🤍', 'بلغت هدف اليوم — تقبّل الله منك 🤍')
    : pct >= 70
      ? t('So close — your heart is almost there 🌟', 'ما شاء الله، أنت قريبٌ جدًا 🌟')
      : pct >= 40
        ? t('Beautiful — you are drawing nearer and nearer ✨', 'أحسنت، تقترب أكثر فأكثر… ✨')
        : pct > 0
          ? t('A blessed beginning — every step brings you closer 🌱', 'بدايةٌ مباركة — كلّ خطوةٍ تُقرّبك أكثر 🌱')
          : t('Open your heart with a single ayah, and begin 🤲', 'افتح قلبك بآيةٍ واحدة، وابدأ القُرب 🤲');

  const stats = data ? [
    { icon: BookOpen, color: '#14879c', label: t('Ayat read', 'آيات قُرئت'), value: data.totalAyahs },
    { icon: Hash, color: '#10b981', label: t('Dhikr', 'تسبيحات'), value: data.dhikrTotal },
    { icon: Flame, color: '#f59e0b', label: t('Day streak', 'أيام متتالية'), value: data.streak },
    { icon: CalendarCheck, color: '#d4af37', label: t('Active days', 'أيام النشاط'), value: data.daysActive },
    { icon: Award, color: '#a78bfa', label: t('Best streak', 'أطول تتابع'), value: data.bestStreak },
    { icon: Bookmark, color: '#f472b6', label: t('Bookmarks', 'محفوظات'), value: data.bookmarks },
  ] : [];

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
            <h1 className="text-base font-semibold text-white arabic-text">{t('Deeds Ledger', 'سجل الخيرات')}</h1>
            <p className="text-[10px] text-[color:var(--text-muted)]">{t('Your private record of devotion', 'سجلّك الخاص للطاعات')}</p>
          </div>
        </div>
      </header>

      <div className="px-4 pt-2 pb-10 max-w-lg mx-auto space-y-4">
        {/* Proximity Gauge */}
        <div className="glass-card p-6 flex flex-col items-center">
          <p className="text-[10px] uppercase tracking-wider text-[#d4af37] mb-4 flex items-center gap-1.5">
            <Sparkles size={12} /> {t('Proximity Gauge', 'عدّاد القُرب')}
          </p>
          <div className="relative w-40 h-40">
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
              <circle cx="60" cy="60" r={R} fill="none" stroke="rgba(var(--hair),0.10)" strokeWidth="9" />
              <circle
                cx="60" cy="60" r={R} fill="none" stroke="url(#g)" strokeWidth="9" strokeLinecap="round"
                strokeDasharray={`${dash} ${C}`}
                style={{ transition: 'stroke-dasharray 0.9s ease' }}
              />
              <defs>
                <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#14879c" />
                  <stop offset="100%" stopColor="#d4af37" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-light text-white">{pct}%</span>
              <span className="text-[10px] text-[color:var(--text-muted)]">
                {data?.todayAyahs ?? 0}/{DAILY_GOAL_AYAHS} {t('today', 'اليوم')}
              </span>
            </div>
          </div>
          <p className="text-xs text-center text-white/80 arabic-text mt-4 leading-relaxed" dir={t('ltr', 'rtl')}>
            {encouragement}
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="glass-card-sm p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${s.color}1f` }}>
                  <Icon size={18} style={{ color: s.color }} />
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-semibold text-white tabular-nums leading-none">{s.value}</p>
                  <p className="text-[10px] text-[color:var(--text-muted)] mt-1 arabic-text truncate">{s.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-[10px] text-center text-[color:var(--text-muted)]/70 arabic-text leading-relaxed px-4" dir="rtl">
          إنما هي بينك وبين الله؛ لا تُحصى عليك، بل تُذكّرك بالخير وتُعينك على الدوام عليه.
        </p>
        <div className="h-8" />
      </div>
    </div>
  );
}
