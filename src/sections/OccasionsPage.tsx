import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CalendarClock, Bell, BellOff, Moon, Info, ExternalLink, Star } from 'lucide-react';
import { useI18n } from '@/i18n';
import { getHijriDate } from '@/lib/prayer';
import {
  upcomingOccasions, occasionRemindersOn, scheduleOccasionReminders, cancelOccasionReminders,
  OCCASION_SOURCES, type UpcomingOccasion,
} from '@/lib/occasions';

interface Props { onBack: () => void }

const greg = (d: Date, isAr: boolean) =>
  new Intl.DateTimeFormat(isAr ? 'ar' : 'en', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(d);

const countdown = (n: number, isAr: boolean) =>
  n === 0 ? (isAr ? 'اليوم' : 'Today')
    : n === 1 ? (isAr ? 'غدًا' : 'Tomorrow')
      : (isAr ? `بعد ${n} يومًا` : `in ${n} days`);

export default function OccasionsPage({ onBack }: Props) {
  const { t, lang } = useI18n();
  const isAr = lang === 'ar';
  const list = useMemo<UpcomingOccasion[]>(() => upcomingOccasions(), []);
  const [remOn, setRemOn] = useState(occasionRemindersOn());
  const [busy, setBusy] = useState(false);

  // Keep the schedule fresh whenever the page is opened with reminders enabled.
  useEffect(() => { if (occasionRemindersOn()) void scheduleOccasionReminders(); }, []);

  const toggleReminders = async () => {
    setBusy(true);
    if (remOn) { await cancelOccasionReminders(); setRemOn(false); }
    else { const ok = await scheduleOccasionReminders(); setRemOn(ok); }
    setBusy(false);
  };

  const next = list[0];

  return (
    <div className="page-enter min-h-screen">
      <header className="sticky top-0 z-40 px-4 py-3">
        <div className="mx-auto max-w-lg flex items-center gap-3 rounded-2xl px-4 py-3"
          style={{ background: 'linear-gradient(135deg, rgba(var(--glass-1), 0.6), rgba(var(--glass-2), 0.7))', border: '1px solid rgba(var(--hair), 0.08)', borderTop: '1px solid rgba(var(--hair), 0.15)', backdropFilter: 'blur(8px)' }}>
          <button onClick={onBack} className="p-2 rounded-xl hover:bg-white/10 transition-all">
            <ArrowLeft size={18} className="text-[color:var(--text-muted)]" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-semibold text-white arabic-text">{t('Islamic Occasions', 'المناسبات الإسلامية')}</h1>
            <p className="text-[10px] text-[color:var(--text-muted)]">{t('Countdowns & reminders', 'عدّاد تنازلي وتذكيرات')}</p>
          </div>
          <CalendarClock size={18} className="text-[#d4af37]" />
        </div>
      </header>

      <div className="px-4 pt-2 pb-10 max-w-lg mx-auto space-y-3">
        {/* Hero: the next occasion */}
        {next && (
          <div className="glass-card p-5 text-center space-y-2" style={{ border: '1px solid rgba(212,175,55,0.28)' }}>
            <p className="text-[10px] uppercase tracking-wider text-[#14879c]">{t('Next occasion', 'المناسبة القادمة')}</p>
            <h2 className="text-2xl font-bold text-[#d4af37] gold-glow arabic-text">{isAr ? next.ar : next.en}</h2>
            <p className="text-3xl font-light text-white tabular-nums">{countdown(next.daysUntil, isAr)}</p>
            <p className="text-[11px] text-[color:var(--text-muted)] arabic-text">{greg(next.date, isAr)}</p>
            <p className="text-[10px] text-[#14879c] arabic-text">{getHijriDate(next.date, isAr ? 'ar' : 'en')}</p>
          </div>
        )}

        {/* Reminder toggle */}
        <button onClick={toggleReminders} disabled={busy}
          className="glass-card-sm w-full p-4 flex items-center gap-3 text-right disabled:opacity-60">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: remOn ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)' }}>
            {remOn ? <Bell size={18} className="text-[#10b981]" /> : <BellOff size={18} className="text-[color:var(--text-muted)]" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white arabic-text">{remOn ? t('Reminders are on', 'التذكيرات مُفعّلة') : t('Enable reminders', 'فعِّل التذكيرات')}</p>
            <p className="text-[10px] text-[color:var(--text-muted)] arabic-text">{t('A notification the night before & on the day', 'إشعار ليلة المناسبة وصباحها')}</p>
          </div>
        </button>

        {/* Moon-sighting disclaimer */}
        <div className="rounded-xl p-3 flex items-start gap-2.5" style={{ background: 'rgba(20,135,156,0.10)', border: '1px solid rgba(20,135,156,0.25)' }}>
          <Info size={14} className="text-[#14879c] flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-[color:var(--text-muted)] leading-relaxed arabic-text" dir={isAr ? 'rtl' : 'ltr'}>
            {t('Dates are computed from the Umm al-Qurā calendar and may differ by a day, since Ramadan and Eid depend on the official moon sighting. Confirm with an authoritative source.',
               'التواريخ محسوبة من تقويم أم القرى وقد تختلف بيومٍ واحد، لأنّ رمضان والعيد يُثبتان بالرؤية الشرعية. تأكّد من مصدرٍ رسمي.')}
          </p>
        </div>

        {/* Full list */}
        <div className="space-y-2">
          {list.map((o) => (
            <div key={o.id} className="glass-card-sm p-4 flex gap-3">
              <div className="flex flex-col items-center justify-center flex-shrink-0 w-14">
                <span className="text-lg font-bold text-[#d4af37] tabular-nums leading-none">{o.daysUntil}</span>
                <span className="text-[8px] text-[color:var(--text-muted)] arabic-text">{o.daysUntil === 0 ? t('today', 'اليوم') : t('days', 'يوم')}</span>
              </div>
              <div className="flex-1 min-w-0 border-r border-white/5 pr-3" style={{ borderRightWidth: isAr ? 1 : 0, borderLeftWidth: isAr ? 0 : 1 }}>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-semibold text-white arabic-text">{isAr ? o.ar : o.en}</h3>
                  {o.fasting && <Star size={11} className="text-[#10b981]" />}
                </div>
                <p className="text-[10px] text-[#14879c] arabic-text mt-0.5">{greg(o.date, isAr)}</p>
                <p className={`text-[11.5px] text-[color:var(--text-muted)] leading-relaxed mt-1 ${isAr ? 'arabic-text' : ''}`} dir={isAr ? 'rtl' : 'ltr'}>{isAr ? o.descAr : o.descEn}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Authoritative sources */}
        <div className="glass-card-sm p-4">
          <p className="text-[10px] uppercase tracking-wider text-[#d4af37] mb-2 arabic-text flex items-center gap-1.5"><Moon size={12} /> {t('Confirm from', 'للتأكّد من')}</p>
          <div className="space-y-1.5">
            {OCCASION_SOURCES.map((s) => (
              <button key={s.url} onClick={() => { try { window.open(s.url, '_blank'); } catch { /* ignore */ } }}
                className="w-full flex items-center justify-between rounded-lg px-3 py-2 text-right" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <span className="text-[12px] text-white arabic-text">{isAr ? s.ar : s.en}</span>
                <ExternalLink size={13} className="text-[color:var(--text-muted)] flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
        <div className="h-8" />
      </div>
    </div>
  );
}
