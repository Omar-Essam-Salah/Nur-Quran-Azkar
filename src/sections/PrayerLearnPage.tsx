import { useState } from 'react';
import { ArrowLeft, Droplets, Sparkles } from 'lucide-react';
import { useI18n } from '@/i18n';
import LearnFigure from '@/components/LearnFigure';
import { WUDU_STEPS, PRAYER_STEPS, RAKAHS, type LearnStep } from '@/data/learn';

interface Props { onBack: () => void }
type Tab = 'wudu' | 'salah';

function StepCard({ step, index, isAr }: { step: LearnStep; index: number; isAr: boolean }) {
  return (
    <div className="glass-card-sm p-4 flex gap-3.5">
      {/* Illustration */}
      <div className="flex-shrink-0 flex flex-col items-center gap-1.5">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-[#d4af37]"
          style={{ background: 'radial-gradient(circle at 50% 35%, rgba(20,135,156,0.18), rgba(212,175,55,0.10))', border: '1px solid rgba(212,175,55,0.22)' }}>
          <LearnFigure pose={step.pose} className="w-11 h-11" />
        </div>
        <span className="w-5 h-5 rounded-full bg-[#d4af37]/15 flex items-center justify-center text-[10px] font-bold text-[#d4af37]">{index + 1}</span>
      </div>
      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-white arabic-text">{isAr ? step.titleAr : step.titleEn}</h3>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {step.middle && <span className="text-[9px] text-[#d4af37] bg-[#d4af37]/15 border border-[#d4af37]/30 px-1.5 py-0.5 rounded-full arabic-text">{isAr ? 'صلوات ٣ و ٤ ركعات' : '3 & 4 rakʿah prayers'}</span>}
            {step.repeat && <span className="text-[10px] text-[#14879c] font-bold">{step.repeat}</span>}
          </div>
        </div>
        <p className="text-[11px] text-[color:var(--text-muted)] mt-0.5 arabic-text" dir={isAr ? 'rtl' : 'ltr'}>{isAr ? step.titleEn : step.titleAr}</p>
        <p className={`text-[12.5px] leading-relaxed mt-1.5 ${isAr ? 'arabic-text' : ''}`} dir={isAr ? 'rtl' : 'ltr'} style={{ color: 'rgba(var(--text-strong-rgb), 0.85)' }}>
          {isAr ? step.descAr : step.descEn}
        </p>
        {step.sayAr && (
          <div className="mt-2 rounded-xl px-3 py-2" style={{ background: 'rgba(212,175,55,0.10)', border: '1px solid rgba(212,175,55,0.22)' }}>
            <p className="arabic-text text-[15px] leading-loose text-[#d4af37]" dir="rtl">{step.sayAr}</p>
            {step.translit && <p className="text-[10.5px] text-[#14879c] italic mt-1 leading-snug">{step.translit}</p>}
            {step.sayEn && <p className="text-[11px] text-[color:var(--text-muted)] mt-0.5 leading-snug" dir="ltr">“{step.sayEn}”</p>}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PrayerLearnPage({ onBack }: Props) {
  const { t, lang } = useI18n();
  const isAr = lang === 'ar';
  const [tab, setTab] = useState<Tab>('wudu');
  const steps = tab === 'wudu' ? WUDU_STEPS : PRAYER_STEPS;

  return (
    <div className="page-enter min-h-screen">
      <header className="sticky top-0 z-40 px-4 py-3">
        <div className="mx-auto max-w-lg flex items-center gap-3 rounded-2xl px-4 py-3"
          style={{ background: 'linear-gradient(135deg, rgba(var(--glass-1), 0.6), rgba(var(--glass-2), 0.7))', border: '1px solid rgba(var(--hair), 0.08)', borderTop: '1px solid rgba(var(--hair), 0.15)', backdropFilter: 'blur(8px)' }}>
          <button onClick={onBack} className="p-2 rounded-xl hover:bg-white/10 transition-all">
            <ArrowLeft size={18} className="text-[color:var(--text-muted)]" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-semibold text-white arabic-text">{t('Learn to Pray', 'تعلّم الصلاة')}</h1>
            <p className="text-[10px] text-[color:var(--text-muted)]">{t('Step by step, with what to say', 'خطوة بخطوة، مع ما يُقال')}</p>
          </div>
        </div>
      </header>

      <div className="px-4 pt-2 pb-10 max-w-lg mx-auto">
        {/* Tabs */}
        <div className="flex gap-2 mb-3">
          {([['wudu', t('Wudū', 'الوضوء'), Droplets], ['salah', t('Prayer', 'الصلاة'), Sparkles]] as const).map(([id, label, Icon]) => (
            <button key={id} onClick={() => setTab(id as Tab)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold arabic-text flex items-center justify-center gap-2 transition-all"
              style={tab === id
                ? { background: 'rgba(212,175,55,0.22)', color: '#d4af37', border: '1px solid rgba(212,175,55,0.45)' }
                : { background: 'rgba(var(--glass-1), 0.8)', color: 'var(--text-muted)', border: '1px solid rgba(var(--hair), 0.12)' }}>
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        <p className="text-[11px] text-[color:var(--text-muted)] arabic-text leading-relaxed px-1 mb-3" dir={isAr ? 'rtl' : 'ltr'}>
          {tab === 'wudu'
            ? t('Wudū is purifying yourself with water before prayer. Follow the steps in order.', 'الوضوء هو التطهّر بالماء قبل الصلاة. اتبع الخطوات بالترتيب.')
            : t('This is one rakʿah (unit). Repeat it for the number of rakʿahs of each prayer.', 'هذه ركعة واحدة، كرّرها بعدد ركعات كلّ صلاة.')}
        </p>

        <div className="space-y-2.5">
          {steps.map((s, i) => <StepCard key={s.id} step={s} index={i} isAr={isAr} />)}
        </div>

        {/* Rakʿah counts (prayer tab) */}
        {tab === 'salah' && (
          <div className="glass-card-sm p-4 mt-3">
            <p className="text-[10px] uppercase tracking-wider text-[#14879c] mb-2.5 arabic-text">{t('Number of rakʿahs', 'عدد الركعات')}</p>
            <div className="grid grid-cols-5 gap-2">
              {RAKAHS.map((r) => (
                <div key={r.en} className="text-center rounded-xl py-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <p className="text-lg font-bold text-[#d4af37] arabic-text">{r.n}</p>
                  <p className="text-[10px] text-[color:var(--text-muted)] arabic-text leading-tight">{isAr ? r.ar : r.en}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="h-8" />
      </div>
    </div>
  );
}
