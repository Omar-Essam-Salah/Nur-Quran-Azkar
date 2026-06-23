import { useState, useEffect, useMemo, useRef } from 'react';
import { ArrowLeft, Clock, Compass, MapPin, Sunrise, Sun, Sunset, Moon, Navigation, Bell, BellOff, Loader2, Volume2, PlayCircle, ChevronDown } from 'lucide-react';
import type { Page } from '@/types';
import { computePrayerTimes, getHijriDate } from '@/lib/prayer';
import { useI18n } from '@/i18n';
import { LocalNotifications } from '@capacitor/local-notifications';

interface PrayerTimesPageProps {
  onBack: () => void;
  onNavigate: (page: Page) => void;
}

const prayerIcons: Record<string, typeof Clock> = {
  Fajr: Sunrise,
  Sunrise: Sun,
  Dhuhr: Sun,
  Asr: Sun,
  Maghrib: Sunset,
  Isha: Moon,
};

const prayerColors: Record<string, string> = {
  Fajr: '#6366f1',
  Sunrise: '#f59e0b',
  Dhuhr: '#f59e0b',
  Asr: '#f97316',
  Maghrib: '#ec4899',
  Isha: '#8b5cf6',
};

// قائمة أصوات المؤذنين — ملفات محلية بأسماء إنجليزية (تشتغل أوفلاين بلا مشاكل ترميز)
const adhanOptions = [
  { id: 'makkah', name: 'أذان الحرم المكي', local: '/adhan/makkah.mp3', fallback: '' },
  { id: 'mishary_fajr', name: 'مشاري العفاسي — أذان الفجر', local: '/adhan/mishary-fajr.mp3', fallback: '' },
  { id: 'abdulbasit', name: 'عبد الباسط عبد الصمد', local: '/adhan/abdulbasit.mp3', fallback: '' },
  { id: 'abdulbasit_fajr', name: 'عبد الباسط عبد الصمد — أذان الفجر', local: '/adhan/abdulbasit-fajr.mp3', fallback: '' },
  { id: 'husary', name: 'محمود خليل الحصري', local: '/adhan/husary.mp3', fallback: '' },
  { id: 'banna', name: 'محمود علي البنا', local: '/adhan/banna.mp3', fallback: '' },
  { id: 'rifat', name: 'محمد رفعت', local: '/adhan/rifat.mp3', fallback: '' },
  { id: 'mustafa', name: 'مصطفى إسماعيل', local: '/adhan/mustafa-ismail.mp3', fallback: '' },
  { id: 'naina', name: 'أحمد نعينع', local: '/adhan/naina.mp3', fallback: '' },
  { id: 'shuaisha', name: 'أبو العينين شعيشع', local: '/adhan/shuaisha.mp3', fallback: '' },
];

export default function PrayerTimesPage({ onBack, onNavigate }: PrayerTimesPageProps) {
  const { t } = useI18n();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const [timings, setTimings] = useState<Record<string, string> | null>(null);
  const [hijriDate, setHijriDate] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const [adhanEnabled, setAdhanEnabled] = useState(() => localStorage.getItem('nur-adhan-enabled') === '1');
  const [adhanOpen, setAdhanOpen] = useState(false);
  const [selectedAdhan, setSelectedAdhan] = useState(() => {
    return localStorage.getItem('nur-adhan-voice') || 'makkah';
  });
  const [lastPlayedPrayer, setLastPlayedPrayer] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioSrc, setAudioSrc] = useState<string>('');
  const [_useFallback, setUseFallback] = useState(false);

  const setAudioSource = (id: string) => {
    const option = adhanOptions.find(a => a.id === id) ?? adhanOptions[0];
    const src = option.local;
    setAudioSrc(src);
    setUseFallback(false);
    if (audioRef.current) {
      audioRef.current.src = src;
      audioRef.current.load();
    }
  };

  useEffect(() => {
    setAudioSource(selectedAdhan);
  }, [selectedAdhan]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleError = () => {
      console.warn('تعذّر تحميل ملف الأذان:', audioSrc);
    };

    audio.addEventListener('error', handleError);
    return () => audio.removeEventListener('error', handleError);
  }, [audioSrc]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          setLocationError('Location access denied. Using Cairo as default.');
          setLocation({ lat: 30.0444, lng: 31.2357 }); 
        }
      );
    } else {
      setLocation({ lat: 30.0444, lng: 31.2357 });
    }
  }, []);

  useEffect(() => {
    if (!location) return;
    setLoading(true);
    setTimings(computePrayerTimes(location.lat, location.lng));
    setHijriDate(getHijriDate(new Date(), 'en'));
    setLoading(false);
  }, [location]);

  // Schedule local athan notifications for today's prayers (works in the
  // installed mobile app; on web it degrades gracefully).
  useEffect(() => {
    if (!timings || !adhanEnabled) return;
    (async () => {
      try {
        const perm = await LocalNotifications.requestPermissions();
        if (perm.display !== 'granted') return;
        // Android 8+ ties the notification sound to its channel, so create a
        // dedicated high-importance channel that plays the bundled adhan.
        await LocalNotifications.createChannel({
          id: 'adhan',
          name: 'Adhan · الأذان',
          description: 'Prayer-time adhan',
          sound: 'adhan.mp3',
          importance: 5,
          visibility: 1,
          vibration: true,
        }).catch(() => {});
        const ids = [1001, 1002, 1003, 1004, 1005];
        await LocalNotifications.cancel({ notifications: ids.map((id) => ({ id })) }).catch(() => {});
        const prayers: [string, string][] = [['Fajr', 'الفجر'], ['Dhuhr', 'الظهر'], ['Asr', 'العصر'], ['Maghrib', 'المغرب'], ['Isha', 'العشاء']];
        const now = new Date();
        const notifications = prayers
          .map(([key, ar], i) => {
            const [h, m] = timings[key].split(':').map(Number);
            const at = new Date();
            at.setHours(h, m, 0, 0);
            return {
              id: ids[i],
              title: t('Prayer Time', 'حان وقت الصلاة'),
              body: `${t('It is now time for', 'حان الآن وقت صلاة')} ${ar}`,
              schedule: { at },
              channelId: 'adhan',
              sound: 'adhan.mp3',
              smallIcon: 'ic_stat_icon',
            };
          })
          .filter((n) => n.schedule.at > now);
        if (notifications.length) await LocalNotifications.schedule({ notifications });
      } catch {
        /* notifications unavailable on this platform */
      }
    })();
  }, [timings, adhanEnabled, t]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      if (timings && adhanEnabled && audioRef.current && audioSrc) {
        const nowHHMM = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
        
        const prayersToCheck = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
        for (const prayer of prayersToCheck) {
          if (timings[prayer] === nowHHMM && lastPlayedPrayer !== prayer) {
            audioRef.current.play().catch(e => console.log("Autoplay blocked:", e));
            setLastPlayedPrayer(prayer);
            break;
          }
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [timings, adhanEnabled, lastPlayedPrayer, audioSrc]);

  const formatTime12Hour = (time24: string) => {
    const [h, m] = time24.split(':');
    let hours = parseInt(h, 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${m} ${ampm}`;
  };

  const formatCurrentTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const prayerList = useMemo(() => {
    if (!timings) return [];
    return [
      { name: 'Fajr', arabicName: 'الفجر', time: timings.Fajr, rakats: 2 },
      { name: 'Sunrise', arabicName: 'الشروق', time: timings.Sunrise, rakats: 0 },
      { name: 'Dhuhr', arabicName: 'الظهر', time: timings.Dhuhr, rakats: 4 },
      { name: 'Asr', arabicName: 'العصر', time: timings.Asr, rakats: 4 },
      { name: 'Maghrib', arabicName: 'المغرب', time: timings.Maghrib, rakats: 3 },
      { name: 'Isha', arabicName: 'العشاء', time: timings.Isha, rakats: 4 },
    ];
  }, [timings]);

  const nextPrayerData = useMemo(() => {
    if (!prayerList.length) return null;
    const nowMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    
    for (const prayer of prayerList) {
      if (prayer.name === 'Sunrise') continue; 
      const [h, m] = prayer.time.split(':').map(Number);
      const prayerMinutes = h * 60 + m;
      if (prayerMinutes > nowMinutes) {
        const diff = prayerMinutes - nowMinutes;
        const hrs = Math.floor(diff / 60);
        const mins = diff % 60;
        return { prayer, timeRemaining: `${hrs}h ${mins}m` };
      }
    }
    
    const fajr = prayerList[0];
    const [fh, fm] = fajr.time.split(':').map(Number);
    const fajrMinutes = (fh + 24) * 60 + fm;
    const diff = fajrMinutes - nowMinutes;
    return { prayer: fajr, timeRemaining: `${Math.floor(diff / 60)}h ${diff % 60}m` };
  }, [prayerList, currentTime]);

  const currentPrayerIndex = useMemo(() => {
    if (!prayerList.length) return -1;
    const nowMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    for (let i = prayerList.length - 1; i >= 0; i--) {
      if (prayerList[i].name === 'Sunrise') continue;
      const [h, m] = prayerList[i].time.split(':').map(Number);
      if (h * 60 + m <= nowMinutes) return i;
    }
    return -1;
  }, [prayerList, currentTime]);

  const toggleAdhan = () => {
    if (!adhanEnabled && audioRef.current && audioSrc) {
      audioRef.current.volume = 0;
      audioRef.current.play().then(() => {
        audioRef.current!.pause();
        audioRef.current!.volume = 1;
        audioRef.current!.currentTime = 0;
      }).catch(e => console.log(e));
    }
    const nv = !adhanEnabled;
    setAdhanEnabled(nv);
    localStorage.setItem('nur-adhan-enabled', nv ? '1' : '0');
  };

  const previewAdhan = async () => {
    if (!audioRef.current) {
      alert("لم يتم تحميل مشغل الصوت بعد");
      return;
    }
    if (!audioSrc) {
      alert("جاري تحميل ملف الأذان، انتظر قليلاً...");
      return;
    }
    try {
      audioRef.current.currentTime = 0;
      audioRef.current.volume = 1;
      await audioRef.current.play();
    } catch (err: any) {
      console.error("خطأ في معاينة الأذان:", err);
      alert(`حدث خطأ في تشغيل الأذان: ${err.message || "يرجى المحاولة مرة أخرى"}`);
    }
  };

  return (
    <div className="page-enter min-h-screen">
      <audio ref={audioRef} src={audioSrc} preload="auto" crossOrigin="anonymous" />

      <header className="sticky top-0 z-40 px-4 py-3">
        <div 
          className="mx-auto max-w-lg flex items-center gap-3 rounded-2xl px-4 py-3"
          style={{
            background: 'linear-gradient(135deg, rgba(var(--glass-1), 0.6), rgba(var(--glass-2), 0.7))',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderTop: '1px solid rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          <button onClick={onBack} className="p-2 rounded-xl hover:bg-white/10 transition-all">
            <ArrowLeft size={18} className="text-[color:var(--text-muted)]" />
          </button>
          <h1 className="text-lg font-semibold text-white">{t('Prayer Times', 'مواقيت الصلاة')}</h1>
          
          <button 
            onClick={toggleAdhan} 
            className="ml-auto p-2 rounded-xl transition-all"
            style={{ background: adhanEnabled ? 'rgba(20, 135, 156, 0.2)' : 'rgba(255, 255, 255, 0.05)' }}
            title={adhanEnabled ? t('Adhan Enabled', 'الأذان مُفعّل') : t('Enable Adhan', 'تفعيل الأذان')}
          >
            {adhanEnabled ? <Bell size={18} className="text-[#14879c]" /> : <BellOff size={18} className="text-[color:var(--text-muted)]" />}
          </button>
        </div>
      </header>

      <div className="px-4 pt-2 pb-8 max-w-lg mx-auto space-y-4">
        {loading ? (
          <div className="glass-card p-12 flex flex-col items-center justify-center gap-4">
            <Loader2 size={32} className="text-[#14879c] animate-spin" />
            <p className="text-sm text-[color:var(--text-muted)]">{t('Calculating timings...', 'جاري حساب المواقيت...')}</p>
          </div>
        ) : (
          <>
            <div className="glass-card p-6 text-center space-y-3">
              <p className="text-xs text-[color:var(--text-muted)] uppercase tracking-widest">{hijriDate || '1447 Hijri'}</p>
              <p className="text-4xl font-light text-white">{formatCurrentTime(currentTime)}</p>
              <p className="text-xs text-[color:var(--text-muted)]">
                {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
              
              <div className="flex items-center justify-center gap-1.5 pt-1">
                <MapPin size={12} className="text-[#14879c]" />
                <span className="text-[10px] text-[color:var(--text-muted)]">
                  {location ? `${location.lat.toFixed(2)}, ${location.lng.toFixed(2)}` : t('Locating...', 'جاري تحديد الموقع...')}
                </span>
              </div>
              {locationError && (
                <p className="text-[10px] text-[#f59e0b]">{locationError}</p>
              )}
            </div>

            {nextPrayerData && (
              <div 
                className="p-5 rounded-2xl space-y-3 relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(20, 135, 156, 0.2), rgba(20, 135, 156, 0.05))',
                  border: '1px solid rgba(20, 135, 156, 0.2)',
                }}
              >
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <p className="text-[10px] text-[#14879c] uppercase tracking-wider">{t('Next Prayer', 'الصلاة القادمة')}</p>
                    <p className="text-xl font-semibold text-white mt-1">{nextPrayerData.prayer.name}</p>
                    <p className="text-xs text-[color:var(--text-muted)] arabic-text">{nextPrayerData.prayer.arabicName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-light text-[#14879c]">{formatTime12Hour(nextPrayerData.prayer.time)}</p>
                    <p className="text-[10px] text-[color:var(--text-muted)]">{t('in', 'خلال')} {nextPrayerData.timeRemaining}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="glass-card-sm p-4 flex flex-col gap-3 relative z-30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Volume2 size={16} className="text-[#14879c]" />
                  <span className="text-sm font-medium text-white">صوت المؤذن</span>
                </div>
                <button 
                  onClick={previewAdhan}
                  className="relative z-50 flex items-center gap-1 text-[10px] bg-[#14879c]/10 hover:bg-[#14879c]/30 px-3 py-1.5 rounded-lg text-[#14879c] transition-colors"
                >
                  <PlayCircle size={12} /> معاينة الصوت
                </button>
              </div>
              <div className="relative">
                <button
                  onClick={() => setAdhanOpen((o) => !o)}
                  className="w-full flex items-center justify-between gap-2 rounded-xl p-3 text-sm text-white arabic-text transition-colors"
                  style={{ background: 'rgba(var(--glass-1), 0.5)', border: '1px solid rgba(var(--hair), 0.12)' }}
                  dir="rtl"
                >
                  <span>{adhanOptions.find((o) => o.id === selectedAdhan)?.name ?? '—'}</span>
                  <ChevronDown size={16} className={`text-[color:var(--text-muted)] transition-transform ${adhanOpen ? 'rotate-180' : ''}`} />
                </button>
                {adhanOpen && (
                  <div
                    className="absolute z-50 mt-1 w-full rounded-xl overflow-hidden max-h-60 overflow-y-auto custom-scrollbar"
                    style={{
                      background: 'linear-gradient(135deg, rgba(var(--glass-1), 0.98), rgba(var(--glass-2), 0.99))',
                      border: '1px solid rgba(var(--hair), 0.12)',
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)',
                    }}
                    dir="rtl"
                  >
                    {adhanOptions.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => {
                          setSelectedAdhan(opt.id);
                          localStorage.setItem('nur-adhan-voice', opt.id);
                          setUseFallback(false);
                          setAdhanOpen(false);
                        }}
                        className="w-full text-right px-3 py-2.5 text-sm arabic-text transition-colors hover:bg-white/5 text-white"
                        style={{ background: selectedAdhan === opt.id ? 'rgba(20,135,156,0.15)' : 'transparent', color: selectedAdhan === opt.id ? '#14879c' : undefined }}
                      >
                        {opt.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs text-[color:var(--text-muted)] uppercase tracking-wider px-1">{t("Today's Schedule", 'جدول اليوم')}</h3>
              {prayerList.map((prayer, index) => {
                const Icon = prayerIcons[prayer.name] || Clock;
                const color = prayerColors[prayer.name] || '#14879c';
                const isCurrent = index === currentPrayerIndex;
                
                return (
                  <div
                    key={prayer.name}
                    className="glass-card-sm p-4 flex items-center gap-4"
                    style={{
                      borderLeft: isCurrent ? `3px solid ${color}` : '3px solid transparent',
                      background: isCurrent ? `${color}08` : undefined,
                    }}
                  >
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${color}15` }}
                    >
                      <Icon size={22} style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-sm font-medium ${isCurrent ? 'text-white' : 'text-white/80'}`}>
                            {prayer.name}
                          </p>
                          <p className="text-[10px] text-[color:var(--text-muted)] arabic-text">{prayer.arabicName}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-light text-white">{formatTime12Hour(prayer.time)}</p>
                          {prayer.rakats > 0 && (
                            <p className="text-[10px] text-[color:var(--text-muted)]">{prayer.rakats} {t("rak'ahs", 'ركعة')}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    {isCurrent && (
                      <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: color }} />
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        <button
          onClick={() => onNavigate('qibla')}
          className="glass-card w-full p-4 flex items-center gap-4 text-left mt-4"
        >
          <div className="w-12 h-12 rounded-xl bg-[#14879c]/15 flex items-center justify-center flex-shrink-0">
            <Compass size={22} className="text-[#14879c]" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white">{t('Qibla Direction', 'اتجاه القبلة')}</p>
            <p className="text-xs text-[color:var(--text-muted)]">{t('Find the direction to the Kaaba', 'اتجاه الكعبة المشرّفة')}</p>
          </div>
          <Navigation size={16} className="text-[#14879c]" />
        </button>

        <button
          onClick={() => onNavigate('fasting')}
          className="glass-card w-full p-4 flex items-center gap-4 text-left mt-3"
        >
          <div className="w-12 h-12 rounded-xl bg-[#d4af37]/15 flex items-center justify-center flex-shrink-0">
            <Moon size={22} className="text-[#d4af37]" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white arabic-text">صيام التطوّع</p>
            <p className="text-xs text-[color:var(--text-muted)]">إمساكية السنن والنوافل القادمة</p>
          </div>
        </button>

        <div className="h-8" />
      </div>
    </div>
  );
}