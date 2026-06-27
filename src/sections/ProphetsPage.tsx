import { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, ChevronLeft, Loader2 } from 'lucide-react';
import { PROPHETS, type Prophet } from '@/data/prophets';
import { loadAyahRange, type SimpleAyah } from '@/lib/localQuran';
import { useI18n } from '@/i18n';

interface ProphetsPageProps {
  onBack: () => void;
  onOpenSurah: (surahNumber: number, ayah?: number) => void;
}

export default function ProphetsPage({ onBack, onOpenSurah }: ProphetsPageProps) {
  const { t, lang } = useI18n();
  const isAr = lang === 'ar';
  const [selected, setSelected] = useState<Prophet | null>(null);

  if (selected) {
    return <ProphetDetail prophet={selected} onBack={() => setSelected(null)} onOpenSurah={onOpenSurah} />;
  }

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
            <h1 className="text-base font-semibold text-white arabic-text">{t('Stories of the Prophets', 'قصص الأنبياء')}</h1>
            <p className="text-[10px] text-[color:var(--text-muted)]">{t('25 prophets mentioned in the Quran', '٢٥ نبيًّا ذُكروا في القرآن')}</p>
          </div>
        </div>
      </header>

      <div className="px-4 pt-2 pb-8 max-w-lg mx-auto space-y-2">
        {PROPHETS.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelected(p)}
            className="w-full glass-card-sm p-4 flex items-center gap-3 text-right transition-all hover:bg-white/5"
          >
            <div className="w-10 h-10 rounded-xl bg-[#d4af37]/15 flex items-center justify-center flex-shrink-0">
              <BookOpen size={18} className="text-[#d4af37]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white arabic-text">{p.name}{!isAr && <span className="text-[color:var(--text-muted)] font-normal"> · {p.en}</span>}</p>
              <p className={`text-[11px] text-[color:var(--text-muted)] truncate ${isAr ? 'arabic-text' : ''}`} dir={isAr ? 'rtl' : 'ltr'}>{isAr ? p.note : (p.noteEn ?? p.note)}</p>
            </div>
            <ChevronLeft size={16} className="text-[color:var(--text-muted)] flex-shrink-0" />
          </button>
        ))}
        <div className="h-8" />
      </div>
    </div>
  );
}

function ProphetDetail({ prophet, onBack, onOpenSurah }: { prophet: Prophet; onBack: () => void; onOpenSurah: (n: number, ayah?: number) => void }) {
  const { t, lang } = useI18n();
  const isAr = lang === 'ar';
  const story = isAr ? prophet.story : (prophet.storyEn ?? prophet.story);
  const [ayat, setAyat] = useState<SimpleAyah[] | null>(null);

  useEffect(() => {
    let active = true;
    setAyat(null);
    if (prophet.passage) {
      loadAyahRange(prophet.passage.surah, prophet.passage.from, prophet.passage.to)
        .then((r) => { if (active) setAyat(r); });
    } else {
      setAyat([]);
    }
    return () => { active = false; };
  }, [prophet]);

  const passageSurahName = prophet.passage
    ? prophet.refs.find((r) => r.n === prophet.passage!.surah)?.name ?? `سورة ${prophet.passage.surah}`
    : '';

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
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-semibold text-white arabic-text truncate">{prophet.name}</h1>
            <p className="text-[10px] text-[color:var(--text-muted)]">{prophet.en}</p>
          </div>
        </div>
      </header>

      <div className="px-4 pt-2 pb-10 max-w-lg mx-auto space-y-4">
        {/* Title card */}
        <div className="glass-card p-6 text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#d4af37]/15 flex items-center justify-center">
            <BookOpen size={24} className="text-[#d4af37]" />
          </div>
          <h2 className="text-2xl font-bold text-white arabic-text">{prophet.name}</h2>
          <p className={`text-xs text-[color:var(--text-muted)] ${isAr ? 'arabic-text' : ''}`} dir={isAr ? 'rtl' : 'ltr'}>{isAr ? prophet.note : (prophet.noteEn ?? prophet.note)}</p>
        </div>

        {/* Story */}
        <div className="glass-card-sm p-5">
          <p className="text-[10px] uppercase tracking-wider text-[#14879c] mb-3">{t('The Story', 'القصة')}</p>
          <div className="space-y-3" dir={isAr ? 'rtl' : 'ltr'}>
            {story.split('\n\n').map((para, i) => (
              <p key={i} className={`text-[15px] leading-loose ${isAr ? 'arabic-text' : ''}`} style={{ color: 'rgba(var(--text-strong-rgb), 0.9)' }}>{para}</p>
            ))}
          </div>
        </div>

        {/* Qur'anic passage */}
        {prophet.passage && (
          <div className="glass-card-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] uppercase tracking-wider text-[#d4af37]">{t('From the Qur’an', 'من القرآن الكريم')}</p>
              <span className="text-[10px] text-[color:var(--text-muted)] arabic-text">
                {passageSurahName} {prophet.passage.from}–{prophet.passage.to}
              </span>
            </div>
            {ayat == null ? (
              <div className="flex justify-center py-6"><Loader2 size={22} className="animate-spin text-[#14879c]" /></div>
            ) : ayat.length === 0 ? (
              <p className="text-center text-xs text-[color:var(--text-muted)] py-4 arabic-text">{t('Could not load these ayat — open the surah below.', 'تعذّر تحميل الآيات — افتح السورة بالأسفل.')}</p>
            ) : (
              <div className="space-y-3" dir="rtl">
                {ayat.map((a) => (
                  <div key={a.ayah} className="border-b border-white/5 last:border-0 pb-3 last:pb-0">
                    <p className="arabic-text text-white leading-loose text-[18px]">
                      {a.text}
                      <span className="inline-flex items-center justify-center w-6 h-6 mx-1 rounded-full bg-[#14879c]/15 text-[10px] text-[#14879c] align-middle">{a.ayah}</span>
                    </p>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => onOpenSurah(prophet.passage!.surah, prophet.passage!.from)}
              className="glass-btn w-full mt-4 py-2.5 text-sm flex items-center justify-center gap-2"
            >
              <BookOpen size={14} /> {t('Read these ayat in the surah', 'اقرأ هذه الآيات في السورة')}
            </button>
          </div>
        )}

        {/* Other surahs */}
        <div className="glass-card-sm p-5">
          <p className="text-[10px] uppercase tracking-wider text-[color:var(--text-muted)] mb-3">{t('Mentioned in', 'ورد ذكره في')}</p>
          <div className="flex flex-wrap gap-2" dir="rtl">
            {prophet.refs.map((r) => (
              <button
                key={r.n}
                onClick={() => onOpenSurah(r.n)}
                className="text-[12px] px-3 py-1.5 rounded-lg arabic-text transition-all hover:opacity-80"
                style={{ background: 'rgba(20,135,156,0.15)', color: '#14879c', border: '1px solid rgba(20,135,156,0.25)' }}
              >
                {r.name}
              </button>
            ))}
          </div>
        </div>
        <div className="h-8" />
      </div>
    </div>
  );
}
