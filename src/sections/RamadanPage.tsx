import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Sunrise, Sunset, Moon } from 'lucide-react';
import { computePrayerTimes } from '@/lib/prayer';
import { hijriParts, HIJRI_MONTHS } from '@/lib/fasting';
import { useI18n } from '@/i18n';

interface RamadanPageProps { onBack: () => void }

const to12h = (t: string) => {
  const [h, m] = t.split(':');
  let hr = parseInt(h, 10);
  const ap = hr >= 12 ? 'م' : 'ص';
  hr = hr % 12 || 12;
  return `${hr}:${m} ${ap}`;
};

function daysUntilRamadan(from: Date): number {
  const d = new Date(from);
  for (let i = 0; i < 380; i++) {
    const h = hijriParts(d);
    if (h.month === 9 && h.day === 1) return i;
    d.setDate(d.getDate() + 1);
  }
  return -1;
}

export default function RamadanPage({ onBack }: RamadanPageProps) {
  const { t } = useI18n();
  const [loc, setLoc] = useState({ lat: 30.0444, lng: 31.2357 });

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (p) => setLoc({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => {},
    );
  }, []);

  const today = new Date();
  const h = useMemo(() => hijriParts(today), []);
  const times = useMemo(() => computePrayerTimes(loc.lat, loc.lng), [loc]);
  const inRamadan = h.month === 9;
  const countdown = useMemo(() => (inRamadan ? 0 : daysUntilRamadan(today)), [inRamadan]);

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
            <h1 className="text-base font-semibold text-white arabic-text">وضع رمضان</h1>
            <p className="text-[10px] text-[color:var(--text-muted)] arabic-text">{h.day} {HIJRI_MONTHS[h.month - 1]} {h.year} هـ</p>
          </div>
          <Moon size={18} className="text-[#d4af37]" />
        </div>
      </header>

      <div className="px-4 pt-2 pb-8 max-w-lg mx-auto space-y-4">
        {/* Hero */}
        <div className="glass-card p-6 text-center space-y-2">
          {inRamadan ? (
            <>
              <p className="text-xs text-[#d4af37] uppercase tracking-widest">رمضان كريم</p>
              <p className="text-5xl font-light text-white">{h.day}</p>
              <p className="text-sm text-[color:var(--text-muted)] arabic-text">اليوم {h.day} من رمضان</p>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden mt-3">
                <div className="h-full rounded-full bg-[#d4af37]" style={{ width: `${Math.min(100, (h.day / 30) * 100)}%` }} />
              </div>
            </>
          ) : (
            <>
              <p className="text-xs text-[#14879c] uppercase tracking-widest">{t('Countdown to Ramadan', 'العدّ التنازلي لرمضان')}</p>
              <p className="text-5xl font-light text-white">{countdown}</p>
              <p className="text-sm text-[color:var(--text-muted)] arabic-text">{t('days remaining', 'يومًا على رمضان')}</p>
            </>
          )}
        </div>

        {/* Imsak / Iftar */}
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card-sm p-5 text-center space-y-2">
            <Sunrise size={22} className="text-[#6366f1] mx-auto" />
            <p className="text-[10px] text-[color:var(--text-muted)] arabic-text">الإمساك (الفجر)</p>
            <p className="text-xl font-light text-white">{to12h(times.Fajr)}</p>
          </div>
          <div className="glass-card-sm p-5 text-center space-y-2">
            <Sunset size={22} className="text-[#ec4899] mx-auto" />
            <p className="text-[10px] text-[color:var(--text-muted)] arabic-text">الإفطار (المغرب)</p>
            <p className="text-xl font-light text-white">{to12h(times.Maghrib)}</p>
          </div>
        </div>

        <div className="glass-card-sm p-4">
          <p className="text-[11px] text-[color:var(--text-muted)] arabic-text leading-relaxed text-center">
            «شَهْرُ رَمَضَانَ الَّذِي أُنزِلَ فِيهِ الْقُرْآنُ هُدًى لِّلنَّاسِ»
          </p>
        </div>
        <div className="h-8" />
      </div>
    </div>
  );
}
