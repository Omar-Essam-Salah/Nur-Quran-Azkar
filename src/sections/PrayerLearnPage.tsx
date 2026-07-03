import { useState } from 'react';
import { ArrowLeft, Droplets, Sparkles, Baby } from 'lucide-react';
import { useI18n } from '@/i18n';
import LearnFigure from '@/components/LearnFigure';
import { SpeakButton } from '@/components/SpeakButton';
import { WUDU_STEPS, PRAYER_STEPS, RAKAHS, KIDS_TEXT, type LearnStep } from '@/data/learn';

interface Props { onBack: () => void }
type Tab = 'wudu' | 'salah';

function StepCard({ step, index, isAr, kid }: { step: LearnStep; index: number; isAr: boolean; kid?: { ar: string; en: string } }) {
  const desc = kid ? (isAr ? kid.ar : kid.en) : (isAr ? step.descAr : step.descEn);
  return (
    <div className="glass-card-sm p-4 flex gap-3.5">
      {/* Illustration */}
      <div className="flex-shrink-0 flex flex-col items-center gap-1.5">
        <div className={`${kid ? 'w-[72px] h-[72px]' : 'w-16 h-16'} rounded-2xl flex items-center justify-center text-[#d4af37]`}
          style={{ background: 'radial-gradient(circle at 50% 35%, rgba(20,135,156,0.18), rgba(212,175,55,0.10))', border: '1px solid rgba(212,175,55,0.22)' }}>
          <LearnFigure pose={step.pose} className={kid ? 'w-12 h-12' : 'w-11 h-11'} />
        </div>
        <span className="w-5 h-5 rounded-full bg-[#d4af37]/15 flex items-center justify-center text-[10px] font-bold text-[#d4af37]">{index + 1}</span>
      </div>
      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3 className={`font-semibold text-white arabic-text ${kid ? 'text-[15px]' : 'text-sm'}`}>{isAr ? step.titleAr : step.titleEn}</h3>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {step.middle && <span className="text-[9px] text-[#d4af37] bg-[#d4af37]/15 border border-[#d4af37]/30 px-1.5 py-0.5 rounded-full arabic-text">{isAr ? 'صلوات ٣ و ٤ ركعات' : '3 & 4 rakʿah prayers'}</span>}
            {step.repeat && <span className="text-[10px] text-[#14879c] font-bold">{step.repeat}</span>}
            <SpeakButton text={desc} lang={isAr ? 'ar-SA' : 'en-US'} size={14} />
          </div>
        </div>
        {!kid && <p className="text-[11px] text-[color:var(--text-muted)] mt-0.5 arabic-text" dir={isAr ? 'rtl' : 'ltr'}>{isAr ? step.titleEn : step.titleAr}</p>}
        <p className={`leading-relaxed mt-1.5 ${isAr ? 'arabic-text' : ''} ${kid ? 'text-[14px]' : 'text-[12.5px]'}`} dir={isAr ? 'rtl' : 'ltr'} style={{ color: 'rgba(var(--text-strong-rgb), 0.88)' }}>
          {desc}
        </p>
        {step.sayAr && (
          <div className="mt-2 rounded-xl px-3 py-2" style={{ background: 'rgba(212,175,55,0.10)', border: '1px solid rgba(212,175,55,0.22)' }}>
            <div className="flex items-start justify-between gap-2">
              <p className="arabic-text text-[15px] leading-loose text-[#d4af37] whitespace-pre-line flex-1" dir="rtl">{step.sayAr}</p>
              <SpeakButton text={step.sayAr} lang="ar-SA" size={14} className="p-1 rounded-lg hover:bg-white/10 flex-shrink-0 mt-0.5" />
            </div>
            {!kid && step.translit && <p className="text-[10.5px] text-[#14879c] italic mt-1 leading-snug">{step.translit}</p>}
            {!kid && step.sayEn && <p className="text-[11px] text-[color:var(--text-muted)] mt-0.5 leading-snug" dir="ltr">“{step.sayEn}”</p>}
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
  const [kids, setKids] = useState(false);
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
          {/* Kids mode toggle */}
          <button onClick={() => setKids((k) => !k)}
            className="px-2.5 py-2 rounded-xl flex items-center gap-1.5 transition-all"
            style={kids ? { background: 'rgba(52,211,153,0.18)', border: '1px solid rgba(52,211,153,0.4)' } : { background: 'rgba(255,255,255,0.05)', border: '1px solid transparent' }}
            title={t('Kids mode', 'وضع الأطفال')}>
            <Baby size={16} className={kids ? 'text-[#34d399]' : 'text-[color:var(--text-muted)]'} />
            <span className="text-[10px] font-bold arabic-text" style={{ color: kids ? '#34d399' : 'var(--text-muted)' }}>{t('Kids', 'أطفال')}</span>
          </button>
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
          {kids
            ? t('Simple steps for children — tap the speaker to listen. 🌱', 'خطوات بسيطة للأطفال — اضغط زر الصوت عشان تسمع. 🌱')
            : tab === 'wudu'
              ? t('Wudū is purifying yourself with water before prayer. Follow the steps in order.', 'الوضوء هو التطهّر بالماء قبل الصلاة. اتبع الخطوات بالترتيب.')
              : t('This is one rakʿah (unit). Repeat it for the number of rakʿahs of each prayer.', 'هذه ركعة واحدة، كرّرها بعدد ركعات كلّ صلاة.')}
        </p>

        <div className="space-y-2.5">
          {steps.map((s, i) => <StepCard key={s.id} step={s} index={i} isAr={isAr} kid={kids ? KIDS_TEXT[tab][s.id] : undefined} />)}
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
