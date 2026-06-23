import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Moon, Sunrise, Sunset, Star, CalendarDays } from 'lucide-react';
import { getUpcomingFasts, classifyFasting, hijriString, type FastDay } from '@/lib/fasting';

interface FastingPageProps {
  onBack: () => void;
}

const to12h = (t: string) => {
  const [h, m] = t.split(':');
  let hr = parseInt(h, 10);
  const ap = hr >= 12 ? 'م' : 'ص';
  hr = hr % 12 || 12;
  return `${hr}:${m} ${ap}`;
};

export default function FastingPage({ onBack }: FastingPageProps) {
  const [loc, setLoc] = useState<{ lat: number; lng: number }>({ lat: 30.0444, lng: 31.2357 });

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (p) => setLoc({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => {},
    );
  }, []);

  const today = useMemo(() => classifyFasting(new Date()), []);
  const upcoming: FastDay[] = useMemo(() => getUpcomingFasts(loc.lat, loc.lng, new Date(), 45), [loc]);
  const todayStr = useMemo(() => hijriString(new Date()), []);

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
            <h1 className="text-base font-semibold text-white">صيام التطوّع</h1>
            <p className="text-[10px] text-[color:var(--text-muted)]">إمساكية السنن والنوافل</p>
          </div>
          <Moon size={18} className="text-[#d4af37]" />
        </div>
      </header>

      <div className="px-4 pt-2 pb-8 max-w-lg mx-auto space-y-4">
        {/* Today */}
        <div className="glass-card p-6 text-center space-y-3">
          <p className="text-xs text-[color:var(--text-muted)] uppercase tracking-widest">اليوم</p>
          <p className="text-2xl font-light text-white arabic-text">{todayStr}</p>
          {today.forbidden ? (
            <p className="text-sm text-[#f59e0b]">{today.forbidden}</p>
          ) : today.recs.length ? (
            <div className="flex flex-wrap justify-center gap-2 pt-1">
              {today.recs.map((r) => (
                <span key={r.key} className="text-[11px] px-3 py-1 rounded-full arabic-text"
                  style={{ background: 'rgba(20,135,156,0.15)', color: '#14879c' }}>
                  {r.label}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[color:var(--text-muted)]">لا يوجد صيام تطوّع مخصوص اليوم</p>
          )}
        </div>

        {/* Upcoming list */}
        <div className="flex items-center gap-2 px-1">
          <CalendarDays size={14} className="text-[#14879c]" />
          <h3 className="text-xs text-[color:var(--text-muted)] uppercase tracking-wider">أيام الصيام القادمة</h3>
        </div>

        <div className="space-y-2">
          {upcoming.map((d, i) => (
            <div key={i} className="glass-card-sm p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white arabic-text">
                    {d.weekday} · {d.hijri.day} {d.hijri.monthName}
                  </p>
                  <p className="text-[10px] text-[color:var(--text-muted)]">
                    {d.date.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' })}
                  </p>
                </div>
                <div className="flex flex-wrap justify-end gap-1 max-w-[55%]">
                  {d.recommendations.map((r) => (
                    <span key={r.key} className="text-[9px] px-2 py-0.5 rounded-full arabic-text flex items-center gap-1"
                      style={{ background: 'rgba(212,175,55,0.15)', color: '#d4af37' }}>
                      <Star size={8} fill="currentColor" /> {r.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* virtue of the first recommendation */}
              {d.recommendations[0]?.virtue && (
                <p className="text-[10px] text-[color:var(--text-muted)] arabic-text leading-relaxed border-t border-white/5 pt-2">
                  {d.recommendations[0].virtue}
                </p>
              )}

              <div className="flex items-center gap-4 text-[11px]">
                <span className="flex items-center gap-1 text-[#6366f1]">
                  <Sunrise size={12} /> الإمساك {to12h(d.imsak)}
                </span>
                <span className="flex items-center gap-1 text-[#ec4899]">
                  <Sunset size={12} /> الإفطار {to12h(d.iftar)}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="h-8" />
      </div>
    </div>
  );
}
