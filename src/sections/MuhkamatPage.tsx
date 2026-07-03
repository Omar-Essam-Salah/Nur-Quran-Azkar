import { useEffect, useState } from 'react';
import { ArrowLeft, Star, Scale, BookOpenCheck, Loader2 } from 'lucide-react';
import { useI18n } from '@/i18n';
import { SpeakButton } from '@/components/SpeakButton';
import { loadAyahRange, type SimpleAyah } from '@/lib/localQuran';
import { surahList } from '@/data/surahList';
import { KEY_VERSES, RULING_VERSES, MUHKAM_INTRO } from '@/data/learn';

interface Props { onBack: () => void }
type Tab = 'key' | 'rulings' | 'concept';

const surahName = (n: number) => surahList.find((s) => s.number === n)?.name ?? `${n}`;

// Renders an ayah range from the bundled offline mushaf (Arabic + meaning).
function VerseBlock({ surah, from, to, showTranslation }: { surah: number; from: number; to: number; showTranslation: boolean }) {
  const [ayat, setAyat] = useState<SimpleAyah[] | null>(null);
  useEffect(() => {
    let active = true;
    loadAyahRange(surah, from, to).then((r) => { if (active) setAyat(r); });
    return () => { active = false; };
  }, [surah, from, to]);

  if (ayat === null) return <div className="flex justify-center py-4"><Loader2 size={16} className="animate-spin text-[#14879c]" /></div>;
  if (ayat.length === 0) return null;
  return (
    <div className="space-y-2" dir="rtl">
      {ayat.map((a) => (
        <div key={a.ayah}>
          <p className="arabic-text text-white leading-loose text-[17px]">
            {a.text}
            <span className="inline-flex items-center justify-center w-6 h-6 mx-1 rounded-full bg-[#d4af37]/15 text-[10px] text-[#d4af37] align-middle">{a.ayah}</span>
          </p>
          {showTranslation && a.translation && (
            <p className="text-[12px] text-[color:var(--text-muted)] leading-relaxed mt-1" dir="ltr">{a.translation}</p>
          )}
        </div>
      ))}
      <p className="text-[10px] text-[#14879c] arabic-text pt-0.5">{surahName(surah)} · {from}{to > from ? `–${to}` : ''}</p>
    </div>
  );
}

export default function MuhkamatPage({ onBack }: Props) {
  const { t, lang } = useI18n();
  const isAr = lang === 'ar';
  const [tab, setTab] = useState<Tab>('key');

  return (
    <div className="page-enter min-h-screen">
      <header className="sticky top-0 z-40 px-4 py-3">
        <div className="mx-auto max-w-lg flex items-center gap-3 rounded-2xl px-4 py-3"
          style={{ background: 'linear-gradient(135deg, rgba(var(--glass-1), 0.6), rgba(var(--glass-2), 0.7))', border: '1px solid rgba(var(--hair), 0.08)', borderTop: '1px solid rgba(var(--hair), 0.15)', backdropFilter: 'blur(8px)' }}>
          <button onClick={onBack} className="p-2 rounded-xl hover:bg-white/10 transition-all">
            <ArrowLeft size={18} className="text-[color:var(--text-muted)]" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-semibold text-white arabic-text">{t('Clear Verses (Muḥkamāt)', 'الآيات المحكمات')}</h1>
            <p className="text-[10px] text-[color:var(--text-muted)]">{t('Foundational verses & rulings', 'آياتٌ جامعة وأحكامٌ بيّنة')}</p>
          </div>
        </div>
      </header>

      <div className="px-4 pt-2 pb-10 max-w-lg mx-auto">
        {/* Tabs */}
        <div className="flex gap-2 mb-3">
          {([['key', t('Key verses', 'مختارة'), Star], ['rulings', t('Rulings', 'الأحكام'), Scale], ['concept', t('What is it?', 'المفهوم'), BookOpenCheck]] as const).map(([id, label, Icon]) => (
            <button key={id} onClick={() => setTab(id as Tab)}
              className="flex-1 py-2.5 rounded-xl text-[12.5px] font-semibold arabic-text flex items-center justify-center gap-1.5 transition-all"
              style={tab === id
                ? { background: 'rgba(212,175,55,0.22)', color: '#d4af37', border: '1px solid rgba(212,175,55,0.45)' }
                : { background: 'rgba(var(--glass-1), 0.8)', color: 'var(--text-muted)', border: '1px solid rgba(var(--hair), 0.12)' }}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {/* (a) Key verses */}
        {tab === 'key' && (
          <div className="space-y-2.5">
            {KEY_VERSES.map((v) => (
              <div key={`${v.surah}:${v.from}`} className="glass-card-sm p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-[#d4af37] arabic-text">{isAr ? v.titleAr : v.titleEn}</h3>
                    <p className={`text-[11.5px] text-[color:var(--text-muted)] leading-relaxed mt-0.5 ${isAr ? 'arabic-text' : ''}`} dir={isAr ? 'rtl' : 'ltr'}>{isAr ? v.whyAr : v.whyEn}</p>
                  </div>
                  <SpeakButton text={`${isAr ? v.titleAr : v.titleEn}. ${isAr ? v.whyAr : v.whyEn}`} lang={isAr ? 'ar-SA' : 'en-US'} size={14} />
                </div>
                <div className="border-t border-white/5 pt-2.5"><VerseBlock surah={v.surah} from={v.from} to={v.to} showTranslation={!isAr} /></div>
              </div>
            ))}
          </div>
        )}

        {/* (b) Rulings */}
        {tab === 'rulings' && (
          <div className="space-y-2.5">
            {RULING_VERSES.map((v) => (
              <div key={`${v.surah}:${v.from}`} className="glass-card-sm p-4 space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-[#14879c]/15 flex items-center justify-center flex-shrink-0"><Scale size={15} className="text-[#14879c]" /></span>
                  <h3 className="text-sm font-semibold text-white arabic-text flex-1">{isAr ? v.topicAr : v.topicEn}</h3>
                  <SpeakButton text={`${isAr ? v.topicAr : v.topicEn}. ${isAr ? v.explAr : v.explEn}`} lang={isAr ? 'ar-SA' : 'en-US'} size={14} />
                </div>
                <div className="border-t border-white/5 pt-2.5"><VerseBlock surah={v.surah} from={v.from} to={v.to} showTranslation={!isAr} /></div>
                <p className={`text-[12px] leading-relaxed rounded-lg px-3 py-2 ${isAr ? 'arabic-text' : ''}`} dir={isAr ? 'rtl' : 'ltr'}
                  style={{ background: 'rgba(20,135,156,0.10)', color: 'rgba(var(--text-strong-rgb),0.85)' }}>
                  {isAr ? v.explAr : v.explEn}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* (c) Concept */}
        {tab === 'concept' && (
          <div className="space-y-3">
            <div className="glass-card-sm p-5">
              <div className="flex justify-end -mt-1 -mr-1 mb-1">
                <SpeakButton text={isAr ? MUHKAM_INTRO.ar : MUHKAM_INTRO.en} lang={isAr ? 'ar-SA' : 'en-US'} size={15} />
              </div>
              <p className={`text-[13.5px] leading-loose ${isAr ? 'arabic-text' : ''}`} dir={isAr ? 'rtl' : 'ltr'} style={{ color: 'rgba(var(--text-strong-rgb),0.9)' }}>
                {isAr ? MUHKAM_INTRO.ar : MUHKAM_INTRO.en}
              </p>
            </div>
            <div className="glass-card-sm p-4">
              <p className="text-[10px] uppercase tracking-wider text-[#d4af37] mb-2 arabic-text">{t('The source verse', 'آية الأصل')}</p>
              <VerseBlock surah={MUHKAM_INTRO.refSurah} from={MUHKAM_INTRO.refAyah} to={MUHKAM_INTRO.refAyah} showTranslation={!isAr} />
            </div>
          </div>
        )}
        <div className="h-8" />
      </div>
    </div>
  );
}
