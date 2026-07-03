import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Check, Flame, BookOpen, Bell, BellOff, Loader2 } from 'lucide-react';
import { useI18n } from '@/i18n';
import { surahList } from '@/data/surahList';
import { loadAyahRange, type SimpleAyah } from '@/lib/localQuran';
import {
  PRAYERS, dateKey, getDayMask, isPrayed, countPrayed, togglePrayer, getStreak, getMonthCounts,
} from '@/lib/prayerTracker';
import {
  DAILY_VERSE_REFS, todayVerseIndex, dailyVerseReminderOn, scheduleDailyVerseReminders, cancelDailyVerseReminders,
} from '@/lib/dailyVerses';
import { haptic } from '@/lib/haptics';

interface Props { onBack: () => void; onOpenSurah: (n: number, ayah?: number) => void }

export default function PrayerTrackerPage({ onBack, onOpenSurah }: Props) {
  const { t, lang } = useI18n();
  const isAr = lang === 'ar';
  const todayKey = dateKey();

  const [mask, setMask] = useState(() => getDayMask(todayKey));
  const [streak, setStreak] = useState(() => getStreak());
  const toggle = (idx: number) => { setMask(togglePrayer(todayKey, idx)); setStreak(getStreak()); haptic.light(); };

  // Verse of the day (text from the bundled offline mushaf).
  const vref = DAILY_VERSE_REFS[todayVerseIndex()];
  const [verse, setVerse] = useState<SimpleAyah | null>(null);
  useEffect(() => {
    let active = true;
    loadAyahRange(vref.s, vref.a, vref.a).then((r) => { if (active) setVerse(r[0] || null); });
    return () => { active = false; };
  }, [vref.s, vref.a]);
  const vName = surahList.find((s) => s.number === vref.s)?.name ?? String(vref.s);

  const [remOn, setRemOn] = useState(dailyVerseReminderOn());
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (dailyVerseReminderOn()) void scheduleDailyVerseReminders(); }, []);
  const toggleReminder = async () => {
    setBusy(true);
    if (remOn) { await cancelDailyVerseReminders(); setRemOn(false); }
    else { const ok = await scheduleDailyVerseReminders(); setRemOn(ok); }
    setBusy(false);
  };

  // Month grid.
  const now = new Date();
  const monthCounts = useMemo(() => getMonthCounts(now.getFullYear(), now.getMonth()), [mask]);
  const monthName = new Intl.DateTimeFormat(isAr ? 'ar' : 'en', { month: 'long', year: 'numeric' }).format(now);
  const todayNum = now.getDate();
  const dotColor = (c: number) => c === 5 ? '#10b981' : c >= 3 ? '#d4af37' : c >= 1 ? '#14879c' : 'rgba(255,255,255,0.07)';

  return (
    <div className="page-enter min-h-screen">
      <header className="sticky top-0 z-40 px-4 py-3">
        <div className="mx-auto max-w-lg flex items-center gap-3 rounded-2xl px-4 py-3"
          style={{ background: 'linear-gradient(135deg, rgba(var(--glass-1), 0.6), rgba(var(--glass-2), 0.7))', border: '1px solid rgba(var(--hair), 0.08)', borderTop: '1px solid rgba(var(--hair), 0.15)', backdropFilter: 'blur(8px)' }}>
          <button onClick={onBack} className="p-2 rounded-xl hover:bg-white/10 transition-all">
            <ArrowLeft size={18} className="text-[color:var(--text-muted)]" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-semibold text-white arabic-text">{t('Prayer Tracker', 'متابعة الصلوات')}</h1>
            <p className="text-[10px] text-[color:var(--text-muted)]">{t('Log your five daily prayers', 'سجّل صلواتك الخمس')}</p>
          </div>
          <div className="flex items-center gap-1 text-[#d4af37]"><Flame size={16} /><span className="text-sm font-bold tabular-nums">{streak}</span></div>
        </div>
      </header>

      <div className="px-4 pt-2 pb-10 max-w-lg mx-auto space-y-3">
        {/* Verse of the day */}
        <div className="glass-card p-5 space-y-2" style={{ border: '1px solid rgba(212,175,55,0.25)' }}>
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-wider text-[#d4af37]">{t('Verse of the day', 'آية اليوم')}</p>
            <button onClick={toggleReminder} disabled={busy} className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-60"
              title={remOn ? t('Daily verse reminder on', 'تذكير آية اليوم مُفعّل') : t('Remind me daily', 'ذكّرني يوميًا')}>
              {busy ? <Loader2 size={15} className="animate-spin text-[#14879c]" /> : remOn ? <Bell size={15} className="text-[#10b981]" /> : <BellOff size={15} className="text-[color:var(--text-muted)]" />}
            </button>
          </div>
          {verse ? (
            <>
              <p className="arabic-text text-white text-[18px] leading-loose text-right" dir="rtl">{verse.text}</p>
              {!isAr && verse.translation && <p className="text-[12px] text-[color:var(--text-muted)] leading-relaxed" dir="ltr">{verse.translation}</p>}
              <button onClick={() => onOpenSurah(vref.s, vref.a)} className="flex items-center gap-1.5 text-[11px] text-[#14879c] arabic-text pt-1">
                <BookOpen size={12} /> {vName} · {t('Ayah', 'آية')} {vref.a}
              </button>
            </>
          ) : <div className="flex justify-center py-4"><Loader2 size={18} className="animate-spin text-[#14879c]" /></div>}
        </div>

        {/* Today's prayers */}
        <div className="glass-card-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs text-[color:var(--text-muted)] uppercase tracking-wider arabic-text">{t('Today', 'اليوم')}</h3>
            <span className="text-[11px] text-[#10b981] tabular-nums">{countPrayed(mask)}/5</span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {PRAYERS.map((p, i) => {
              const on = isPrayed(mask, i);
              return (
                <button key={p.en} onClick={() => toggle(i)}
                  className="flex flex-col items-center gap-1.5 rounded-xl py-3 transition-all active:scale-95"
                  style={{ background: on ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.04)', border: on ? '1px solid rgba(16,185,129,0.4)' : '1px solid transparent' }}>
                  <span className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: on ? '#10b981' : 'rgba(255,255,255,0.08)' }}>
                    {on ? <Check size={15} className="text-white" /> : <span className="text-[10px] text-[color:var(--text-muted)]">{i + 1}</span>}
                  </span>
                  <span className="text-[10px] arabic-text" style={{ color: on ? '#10b981' : 'var(--text-muted)' }}>{isAr ? p.ar : p.en}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Month grid */}
        <div className="glass-card-sm p-4">
          <h3 className="text-xs text-[color:var(--text-muted)] uppercase tracking-wider arabic-text mb-3">{monthName}</h3>
          <div className="grid grid-cols-7 gap-1.5">
            {monthCounts.map((c, i) => {
              const day = i + 1;
              return (
                <div key={day} className="aspect-square rounded-lg flex items-center justify-center text-[9px]"
                  style={{ background: dotColor(c), color: c >= 3 ? '#07151d' : 'var(--text-muted)', outline: day === todayNum ? '2px solid rgba(212,175,55,0.7)' : 'none' }}>
                  {day}
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-center gap-3 mt-3 text-[9px] text-[color:var(--text-muted)]">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded" style={{ background: '#10b981' }} /> {t('All 5', 'الخمس')}</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded" style={{ background: '#d4af37' }} /> 3–4</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded" style={{ background: '#14879c' }} /> 1–2</span>
          </div>
        </div>
        <div className="h-8" />
      </div>
    </div>
  );
}
