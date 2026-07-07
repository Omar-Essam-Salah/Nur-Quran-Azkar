import { useMemo, useState } from 'react';
import { ArrowLeft, Search, Check, BookOpen, Brain } from 'lucide-react';
import { surahList } from '@/data/surahList';
import { getHifz, setSurahStatus, hifzStats, type HifzMap } from '@/lib/hifz';
import { useI18n } from '@/i18n';

interface Props { onBack: () => void; onOpenSurah: (surahNumber: number, ayahNumber?: number) => void }

export default function HifzPage({ onBack, onOpenSurah }: Props) {
  const { t, lang } = useI18n();
  const isAr = lang === 'ar';
  const [map, setMap] = useState<HifzMap>(() => getHifz());
  const [q, setQ] = useState('');
  const stats = useMemo(() => hifzStats(map), [map]);

  const setStatus = (n: number, s: 'memorized' | 'learning') => {
    const current = map[n]?.status;
    setMap({ ...setSurahStatus(n, current === s ? null : s) });
  };

  const query = q.trim();
  const list = surahList.filter((s) => !query || s.name.includes(query) || s.englishName.toLowerCase().includes(query.toLowerCase()) || String(s.number) === query);
  const learning = surahList.filter((s) => map[s.number]?.status === 'learning');

  return (
    <div className="page-enter min-h-screen">
      <header className="sticky top-0 z-40 px-4 py-3">
        <div className="mx-auto max-w-lg flex items-center gap-3 rounded-2xl px-4 py-3"
          style={{ background: 'linear-gradient(135deg, rgba(var(--glass-1), 0.6), rgba(var(--glass-2), 0.7))', border: '1px solid rgba(var(--hair), 0.08)', borderTop: '1px solid rgba(var(--hair), 0.15)', backdropFilter: 'blur(8px)' }}>
          <button onClick={onBack} className="p-2 rounded-xl hover:bg-white/10 transition-all">
            <ArrowLeft size={18} className="text-[color:var(--text-muted)]" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-semibold text-white arabic-text">{t('Memorization', 'رفيق الحفظ')}</h1>
            <p className="text-[10px] text-[color:var(--text-muted)] arabic-text" dir={isAr ? 'rtl' : 'ltr'}>{t('Track your Quran memorization', 'تابِع حفظك للقرآن')}</p>
          </div>
        </div>
      </header>

      <div className="px-4 pt-2 pb-10 max-w-lg mx-auto space-y-3">
        {/* Progress */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-3xl font-bold text-[#d4af37] tabular-nums">{stats.percent}%</p>
              <p className="text-[11px] text-[color:var(--text-muted)] arabic-text" dir={isAr ? 'rtl' : 'ltr'}>{t('of the Quran memorized', 'من القرآن محفوظ')}</p>
            </div>
            <div className="text-right space-y-0.5">
              <p className="text-[11px] text-white arabic-text" dir={isAr ? 'rtl' : 'ltr'}>{stats.memorizedSurahs} {t('surahs', 'سورة')} · {stats.memorizedAyat} {t('ayat', 'آية')}</p>
              {stats.learningSurahs > 0 && <p className="text-[10px] text-[#14879c] arabic-text" dir={isAr ? 'rtl' : 'ltr'}>{stats.learningSurahs} {t('in progress', 'قيد الحفظ')}</p>}
            </div>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(var(--hair),0.1)' }}>
            <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${stats.percent}%`, background: 'linear-gradient(90deg, #14879c, #d4af37)' }} />
          </div>
        </div>

        {/* Currently learning */}
        {learning.length > 0 && (
          <div>
            <h3 className="text-xs text-[color:var(--text-muted)] uppercase tracking-wider mb-2 px-1 arabic-text">{t('Currently memorizing', 'أحفظها الآن')}</h3>
            <div className="space-y-2">
              {learning.map((s) => (
                <button key={s.number} onClick={() => onOpenSurah(s.number)} className="glass-card-sm w-full p-3 flex items-center gap-3 text-left">
                  <div className="w-9 h-9 rounded-lg bg-[#14879c]/15 flex items-center justify-center flex-shrink-0"><Brain size={16} className="text-[#14879c]" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white arabic-text">{isAr ? s.name : s.englishName}</p>
                    <p className="text-[10px] text-[color:var(--text-muted)] arabic-text" dir={isAr ? 'rtl' : 'ltr'}>{s.verses} {t('ayat', 'آية')}</p>
                  </div>
                  <BookOpen size={15} className="text-[color:var(--text-muted)]" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* All surahs */}
        <div className="relative">
          <Search size={15} className="absolute top-1/2 -translate-y-1/2 left-3 text-[color:var(--text-muted)] pointer-events-none" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('Search surah…', 'ابحث عن سورة…')}
            className="w-full rounded-xl py-2.5 pl-9 pr-3 text-sm text-white arabic-text outline-none" dir={isAr ? 'rtl' : 'ltr'}
            style={{ background: 'rgba(var(--glass-1),0.8)', border: '1px solid rgba(var(--hair),0.12)' }} />
        </div>

        <div className="space-y-1.5">
          {list.map((s) => {
            const st = map[s.number]?.status;
            return (
              <div key={s.number} className="cv-row glass-card-sm p-2.5 flex items-center gap-2.5">
                <button onClick={() => onOpenSurah(s.number)} className="flex items-center gap-2.5 flex-1 min-w-0 text-left">
                  <span className="w-8 h-8 rounded-lg bg-[#14879c]/12 flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-[#14879c]">{s.number}</span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-white arabic-text truncate">{isAr ? s.name : s.englishName}</p>
                    <p className="text-[9px] text-[color:var(--text-muted)] arabic-text" dir={isAr ? 'rtl' : 'ltr'}>{s.verses} {t('ayat', 'آية')}</p>
                  </div>
                </button>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => setStatus(s.number, 'learning')}
                    className="px-2 py-1 rounded-lg text-[10px] arabic-text transition-all"
                    style={st === 'learning' ? { background: 'rgba(20,135,156,0.2)', color: '#14879c', border: '1px solid rgba(20,135,156,0.4)' } : { background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)', border: '1px solid transparent' }}>
                    {t('Learning', 'أحفظ')}
                  </button>
                  <button onClick={() => setStatus(s.number, 'memorized')}
                    className="px-2 py-1 rounded-lg text-[10px] arabic-text flex items-center gap-1 transition-all"
                    style={st === 'memorized' ? { background: 'rgba(212,175,55,0.2)', color: '#d4af37', border: '1px solid rgba(212,175,55,0.4)' } : { background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)', border: '1px solid transparent' }}>
                    <Check size={11} /> {t('Done', 'حفظت')}
                  </button>
                </div>
              </div>
            );
          })}
          <div className="h-6" />
        </div>
      </div>
    </div>
  );
}
