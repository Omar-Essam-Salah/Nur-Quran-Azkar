import { useState, useEffect, useMemo, useRef } from 'react';
import { ArrowLeft, Clock, Compass, MapPin, Sunrise, Sun, Sunset, Moon, Navigation, Bell, BellOff, Loader2, Volume2, PlayCircle, ChevronDown, Square } from 'lucide-react';
import type { Page } from '@/types';
import { computePrayerTimes, getHijriDate } from '@/lib/prayer';
import { getCachedGeo } from '@/lib/permissions';
import { useI18n } from '@/i18n';
import { audioEl, claimAudio, isOwner, unlockAudio } from '@/lib/audioBus';
import { isLocationEnabled, openLocationSettings } from '@/lib/locationGate';
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

const prayerArabic: Record<string, string> = {
  Fajr: 'الفجر', Sunrise: 'الشروق', Dhuhr: 'الظهر', Asr: 'العصر', Maghrib: 'المغرب', Isha: 'العشاء',
};
const prayerNameAr = (n: string) => prayerArabic[n] ?? n;

// The phrases of the adhan, cycled on the "adhan now" screen so it visually
// calls the adhan (not just plays the sound).
const ADHAN_PHRASES = [
  'اللَّهُ أَكْبَرُ  اللَّهُ أَكْبَر',
  'أَشْهَدُ أَنْ لَا إِلٰهَ إِلَّا اللَّه',
  'أَشْهَدُ أَنَّ مُحَمَّدًا رَسُولُ اللَّه',
  'حَيَّ عَلَى الصَّلَاة',
  'حَيَّ عَلَى الْفَلَاح',
  'اللَّهُ أَكْبَرُ  اللَّهُ أَكْبَر',
  'لَا إِلٰهَ إِلَّا اللَّه',
];

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

// The five prayers, each with its own adhan on/off (id used for the scheduled
// notification). Lets the user silence the adhan for a specific prayer while
// keeping it on for the rest.
const ADHAN_PRAYERS: { key: string; en: string; ar: string; id: number }[] = [
  { key: 'Fajr', en: 'Fajr', ar: 'الفجر', id: 1001 },
  { key: 'Dhuhr', en: 'Dhuhr', ar: 'الظهر', id: 1002 },
  { key: 'Asr', en: 'Asr', ar: 'العصر', id: 1003 },
  { key: 'Maghrib', en: 'Maghrib', ar: 'المغرب', id: 1004 },
  { key: 'Isha', en: 'Isha', ar: 'العشاء', id: 1005 },
];

// Android locks a notification channel's sound at creation time, so we can't
// "fix" a previously-silent channel — we must delete the old ones and create a
// fresh id. Bump this whenever the adhan sound/behaviour needs to change.
const ADHAN_CHANNEL = 'nur-adhan-v3';

async function ensureAdhanChannel(): Promise<void> {
  try {
    for (const id of ['adhan', 'nur-adhan', 'nur-adhan-v2']) {
      await LocalNotifications.deleteChannel({ id }).catch(() => {});
    }
    await LocalNotifications.createChannel({
      id: ADHAN_CHANNEL,
      name: 'Adhan · الأذان',
      description: 'Prayer-time adhan',
      sound: 'adhan.mp3',   // → res/raw/adhan.mp3 (extension stripped by Capacitor)
      importance: 4,        // IMPORTANCE_HIGH — required for sound + heads-up
      visibility: 1,
      vibration: true,
    });
  } catch { /* not native */ }
}

export default function PrayerTimesPage({ onBack, onNavigate }: PrayerTimesPageProps) {
  const { t, lang } = useI18n();
  // Seed from the cached location so prayer times compute instantly on every
  // mount (the calculation is local/instant) — no GPS wait, no loading hang.
  const cachedGeo = useMemo(() => getCachedGeo(), []);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(cachedGeo);
  const [locationError, setLocationError] = useState('');
  const [gpsOff, setGpsOff] = useState(false); // location SERVICE off (vs permission)
  const [locating, setLocating] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [timings, setTimings] = useState<Record<string, string> | null>(null);
  const [hijriDate, setHijriDate] = useState<string>('');
  const [loading, setLoading] = useState(cachedGeo === null);

  const [adhanEnabled, setAdhanEnabled] = useState(() => localStorage.getItem('nur-adhan-enabled') === '1');
  // Per-prayer adhan switch (default: all on). Lets you mute a single prayer.
  const [prayerAdhan, setPrayerAdhan] = useState<Record<string, boolean>>(() => {
    const base: Record<string, boolean> = { Fajr: true, Dhuhr: true, Asr: true, Maghrib: true, Isha: true };
    try { return { ...base, ...JSON.parse(localStorage.getItem('nur-adhan-prayers') || '{}') }; } catch { return base; }
  });
  const togglePrayerAdhan = (k: string) => setPrayerAdhan((prev) => {
    const next = { ...prev, [k]: !prev[k] };
    try { localStorage.setItem('nur-adhan-prayers', JSON.stringify(next)); } catch { /* ignore */ }
    return next;
  });
  const [adhanOpen, setAdhanOpen] = useState(false);
  const [previewing, setPreviewing] = useState(false); // adhan sound preview is playing
  const [selectedAdhan, setSelectedAdhan] = useState(() => {
    return localStorage.getItem('nur-adhan-voice') || 'makkah';
  });
  const [lastPlayedPrayer, setLastPlayedPrayer] = useState<string | null>(null);
  // When the adhan is sounding in the foreground we show a full-screen minaret
  // "adhan now" screen. Holds the prayer's names (or a preview marker) or null.
  const [adhanNow, setAdhanNow] = useState<{ ar: string; en: string } | null>(null);
  const [adhanPhrase, setAdhanPhrase] = useState(0); // cycles the adhan phrases
  useEffect(() => {
    if (!adhanNow) { setAdhanPhrase(0); return; }
    const id = setInterval(() => setAdhanPhrase((i) => (i + 1) % ADHAN_PHRASES.length), 3600);
    return () => clearInterval(id);
  }, [adhanNow]);
  const ownerRef = useRef(0); // our claim on the shared audio element
  const adhanSoundingRef = useRef(false); // true while the adhan itself is audible
  const [audioSrc, setAudioSrc] = useState<string>('');
  const [_useFallback, setUseFallback] = useState(false);

  // The adhan plays through the app-wide shared audio element (lib/audioBus.ts).
  // We keep ONLY the selected file path here — no persistent <audio> element,
  // which used to permanently reserve a media decoder and starve the reciter.
  const setAudioSource = (id: string) => {
    const option = adhanOptions.find(a => a.id === id) ?? adhanOptions[0];
    setAudioSrc(option.local);
    setUseFallback(false);
  };

  useEffect(() => {
    setAudioSource(selectedAdhan);
  }, [selectedAdhan]);

  // Stop the adhan if it's still playing (e.g. a preview) when leaving the page.
  useEffect(() => () => { if (isOwner(ownerRef.current)) { try { audioEl().pause(); } catch { /* ignore */ } } }, []);

  // Stop a sounding adhan (button on the minaret screen, or a physical volume key).
  const stopAdhanNow = () => {
    try { audioEl().pause(); } catch { /* ignore */ }
    adhanSoundingRef.current = false;
    setPreviewing(false);
    setAdhanNow(null);
  };

  // A physical volume button silences a sounding adhan (the native side fires
  // this). It only acts while the adhan itself is audible, so adjusting volume
  // during recitation never interrupts the reciter.
  useEffect(() => {
    const stop = () => { if (adhanSoundingRef.current) stopAdhanNow(); };
    window.addEventListener('nur-volume-key', stop);
    return () => window.removeEventListener('nur-volume-key', stop);
  }, []);

  const requestLocation = () => {
    if (!navigator.geolocation) { if (!getCachedGeo()) setLocation({ lat: 21.3891, lng: 39.8579 }); return; }
    setLocating(true);
    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLocation(loc);
        setLocationError('');
        setGpsOff(false);
        setLocating(false);
        try { localStorage.setItem('nur-geo', JSON.stringify({ ...loc, t: Date.now() })); } catch { /* ignore */ }
      },
      async () => {
        setLocating(false);
        // Distinguish "location service (GPS) is OFF" from "permission denied":
        // if the service is off we can send the user straight to the toggle.
        const enabled = await isLocationEnabled();
        setGpsOff(!enabled);
        setLocationError(enabled
          ? t("Couldn't get your location. Tap Retry.", 'تعذّر تحديد موقعك. اضغط إعادة المحاولة.')
          : t('Location (GPS) is off — turn it on for accurate times.', 'خدمة الموقع (GPS) مقفولة — فعّلها لمواقيت دقيقة.'));
        if (!getCachedGeo()) setLocation((prev) => prev ?? { lat: 21.3891, lng: 39.8579 });
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  };

  // Open the system Location toggle, then auto-retry as soon as the user returns.
  const enableLocation = async () => {
    await openLocationSettings();
    // resume listener below re-requests; this is a fast fallback too.
    setTimeout(requestLocation, 1500);
  };

  useEffect(() => {
    requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When the user comes back from the location settings page (or re-opens the
  // app), try again automatically — no manual Retry needed.
  useEffect(() => {
    let remove: (() => void) | undefined;
    (async () => {
      try {
        const { App } = await import('@capacitor/app');
        const h = await App.addListener('resume', () => { requestLocation(); });
        remove = () => h.remove();
      } catch { /* not native */ }
    })();
    return () => { remove?.(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The once-a-day reconnect sync (lib/dailySync) → refresh location & times.
  useEffect(() => {
    const onSync = () => requestLocation();
    window.addEventListener('nur-sync', onSync);
    return () => window.removeEventListener('nur-sync', onSync);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!location) return;
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
        await ensureAdhanChannel();
        // Always clear all five first, then schedule only the enabled prayers.
        await LocalNotifications.cancel({ notifications: ADHAN_PRAYERS.map((p) => ({ id: p.id })) }).catch(() => {});
        const now = new Date();
        const notifications = ADHAN_PRAYERS
          .filter((p) => prayerAdhan[p.key] !== false)
          .map((p) => {
            const [h, m] = timings[p.key].split(':').map(Number);
            const at = new Date();
            at.setHours(h, m, 0, 0);
            return {
              id: p.id,
              title: t('Prayer Time', 'حان وقت الصلاة'),
              body: `${t('It is now time for', 'حان الآن وقت صلاة')} ${t(p.en, p.ar)}`,
              schedule: { at, allowWhileIdle: true },
              channelId: ADHAN_CHANNEL,
              sound: 'adhan.mp3',
              smallIcon: 'ic_stat_nur',
              largeIcon: 'nur_logo',
            };
          })
          .filter((n) => n.schedule.at > now);
        if (notifications.length) await LocalNotifications.schedule({ notifications });
      } catch {
        /* notifications unavailable on this platform */
      }
    })();
  }, [timings, adhanEnabled, prayerAdhan, t]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      if (timings && adhanEnabled && audioSrc) {
        const nowHHMM = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

        const prayersToCheck = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
        for (const prayer of prayersToCheck) {
          if (prayerAdhan[prayer] === false) continue; // this prayer's adhan is muted
          if (timings[prayer] === nowHHMM && lastPlayedPrayer !== prayer) {
            ownerRef.current = claimAudio();
            const a = audioEl();
            a.src = audioSrc; a.volume = 1;
            adhanSoundingRef.current = true;
            setAdhanNow({ ar: prayerNameAr(prayer), en: prayer });
            a.onended = () => { adhanSoundingRef.current = false; setAdhanNow(null); };
            a.play().catch(e => console.log("Autoplay blocked:", e));
            setLastPlayedPrayer(prayer);
            break;
          }
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [timings, adhanEnabled, lastPlayedPrayer, audioSrc, prayerAdhan]);

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
    const now = currentTime;
    for (const prayer of prayerList) {
      if (prayer.name === 'Sunrise') continue;
      const [h, m] = prayer.time.split(':').map(Number);
      const target = new Date(now); target.setHours(h, m, 0, 0);
      if (target.getTime() > now.getTime()) {
        return { prayer, secondsLeft: Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000)) };
      }
    }
    // All of today's prayers passed → wrap to Fajr tomorrow.
    const fajr = prayerList[0];
    const [fh, fm] = fajr.time.split(':').map(Number);
    const target = new Date(now); target.setDate(now.getDate() + 1); target.setHours(fh, fm, 0, 0);
    return { prayer: fajr, secondsLeft: Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000)) };
  }, [prayerList, currentTime]);

  // HH:MM:SS for the live countdown (LTR digits so it renders cleanly in RTL).
  const fmtCountdown = (s: number) => {
    const hh = Math.floor(s / 3600), mm = Math.floor((s % 3600) / 60), ss = s % 60;
    return `${hh}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  };

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

  // Open the nearest mosques in Google Maps, centred on the user's location
  // (from the same cached geo used for prayer times); falls back to a plain
  // "mosque near me" search when we don't have coordinates yet.
  const openNearestMosque = () => {
    const geo = getCachedGeo();
    const term = lang === 'ar' ? 'مسجد' : 'mosque';
    const url = geo
      ? `https://www.google.com/maps/search/${encodeURIComponent(term)}/@${geo.lat},${geo.lng},15z`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lang === 'ar' ? 'أقرب مسجد' : 'mosque near me')}`;
    try { window.open(url, '_blank'); } catch { /* ignore */ }
  };

  const toggleAdhan = () => {
    // Unlock audio on this tap so the prayer-time auto-play later isn't blocked.
    if (!adhanEnabled) unlockAudio();
    const nv = !adhanEnabled;
    setAdhanEnabled(nv);
    localStorage.setItem('nur-adhan-enabled', nv ? '1' : '0');
  };

  const previewAdhan = async () => {
    // Tap again while previewing → stop.
    if (previewing) { stopAdhanNow(); return; }
    if (!audioSrc) {
      alert(t('The adhan file is still loading, please wait a moment…', 'جاري تحميل ملف الأذان، انتظر قليلاً...'));
      return;
    }
    try {
      unlockAudio();
      ownerRef.current = claimAudio(); // take the shared element (frees any other sound)
      const a = audioEl();
      a.onended = () => { setPreviewing(false); adhanSoundingRef.current = false; setAdhanNow(null); };
      a.onerror = () => { setPreviewing(false); adhanSoundingRef.current = false; setAdhanNow(null); };
      a.src = audioSrc;
      a.volume = 1;
      adhanSoundingRef.current = true;
      setAdhanNow({ ar: nextPrayerData ? prayerNameAr(nextPrayerData.prayer.name) : 'الأذان', en: nextPrayerData?.prayer.name ?? 'Adhan' });
      await a.play();
      setPreviewing(true);
    } catch {
      setPreviewing(false);
      setAdhanNow(null);
      alert(t('Could not play the adhan. Please try again.', 'تعذّر تشغيل الأذان. حاول مرّة أخرى.'));
    }
  };

  // Fire a real adhan NOTIFICATION ~3s from now so the user can verify the
  // actual prayer-time sound path (the preview above only plays in-app audio).
  const testAdhanNotification = async () => {
    try {
      const perm = await LocalNotifications.requestPermissions();
      if (perm.display !== 'granted') { alert(t('Enable notifications first.', 'فعّل إذن الإشعارات أولًا.')); return; }
      await ensureAdhanChannel();
      await LocalNotifications.schedule({
        notifications: [{
          id: 1099,
          title: t('Adhan test', 'اختبار الأذان'),
          body: t('This is how the adhan will sound at prayer time.', 'هكذا سيُسمع الأذان عند دخول وقت الصلاة.'),
          schedule: { at: new Date(Date.now() + 3000), allowWhileIdle: true },
          channelId: ADHAN_CHANNEL,
          sound: 'adhan.mp3',
          smallIcon: 'ic_stat_nur',
          largeIcon: 'nur_logo',
        }],
      });
      alert(t('Lock your screen now — the adhan notification will arrive in a few seconds.', 'اقفل الشاشة الآن — إشعار الأذان سيصل خلال ثوانٍ.'));
    } catch {
      alert(t('Notifications are not available here.', 'الإشعارات غير متاحة هنا.'));
    }
  };

  return (
    <div className="page-enter min-h-screen">
      {/* ── Full-screen "adhan is now" minaret screen ─────────────────────────
          Shown while the adhan sounds in the foreground (a real prayer time or
          the preview). Tap Silence — or a volume key — to stop. */}
      {adhanNow && (
        <div className="fixed inset-0 z-[90] flex flex-col items-center justify-between text-center overflow-hidden" style={{ animation: 'adhan-fade 0.5s ease both' }}>
          <style>{`@keyframes adhan-fade{from{opacity:0}to{opacity:1}}@keyframes adhan-halo{0%,100%{transform:scale(1);opacity:.5}50%{transform:scale(1.12);opacity:.85}}@keyframes adhan-phrase{0%{opacity:0;transform:translateY(8px)}12%{opacity:1;transform:translateY(0)}88%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(-8px)}}`}</style>
          <img src="/adhan/minaret.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(10,18,58,0.48) 0%, rgba(10,16,52,0.34) 40%, rgba(6,10,38,0.94) 100%)' }} />

          {/* Top: which prayer is being called */}
          <div className="relative z-10 px-6" style={{ paddingTop: 'calc(3rem + env(safe-area-inset-top))' }}>
            <span className="text-[11px] uppercase tracking-[0.3em] text-[#f3e3b4]">{t('It is time for', 'حان الآن موعد')}</span>
            <h2 className="arabic-text text-4xl font-bold text-white mt-1" style={{ textShadow: '0 2px 18px rgba(0,0,0,0.8)' }}>{t(adhanNow.en, 'صلاة ' + adhanNow.ar)}</h2>
          </div>

          {/* Middle: the adhan being CALLED — phrases cycle as it sounds */}
          <div className="relative z-10 px-6 flex-1 flex items-center justify-center">
            <p key={adhanPhrase} className="arabic-text text-white leading-relaxed" dir="rtl"
              style={{ fontSize: 'clamp(26px, 8vw, 40px)', textShadow: '0 2px 20px rgba(0,0,0,0.85)', animation: 'adhan-phrase 3.6s ease-in-out' }}>
              {ADHAN_PHRASES[adhanPhrase]}
            </p>
          </div>

          {/* Bottom: muezzin + silence */}
          <div className="relative z-10 px-6 flex flex-col items-center gap-4" style={{ paddingBottom: 'calc(2.5rem + env(safe-area-inset-bottom))' }}>
            <p className="arabic-text text-[#f3e3b4] text-[13px]" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.7)' }}>{adhanOptions.find((a) => a.id === selectedAdhan)?.name ?? ''}</p>
            <button onClick={stopAdhanNow} className="relative flex items-center gap-2 px-7 py-3 rounded-full active:scale-95 transition-transform"
              style={{ background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.35)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}>
              <span className="absolute inset-0 rounded-full" style={{ border: '1px solid rgba(243,227,180,0.6)', animation: 'adhan-halo 2.4s ease-in-out infinite' }} />
              <Square size={15} className="text-white" fill="currentColor" />
              <span className="arabic-text text-white text-sm font-semibold">{t('Silence the adhan', 'إسكات الأذان')}</span>
            </button>
          </div>
        </div>
      )}

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
                  {locating ? t('Locating…', 'جاري تحديد الموقع…') : location ? `${location.lat.toFixed(2)}, ${location.lng.toFixed(2)}` : t('Locating…', 'جاري تحديد الموقع…')}
                </span>
              </div>
              {locationError && (
                <div className="flex flex-col items-center gap-2 pt-1">
                  <p className="text-[10px] text-[#f59e0b] arabic-text text-center px-4" dir={t('ltr', 'rtl')}>{locationError}</p>
                  <div className="flex items-center gap-2">
                    {gpsOff && (
                      <button onClick={enableLocation} disabled={locating}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 disabled:opacity-50"
                        style={{ background: 'rgba(212,175,55,0.2)', color: '#d4af37' }}>
                        <MapPin size={12} /> {t('Turn on Location', 'تفعيل خدمة الموقع')}
                      </button>
                    )}
                    <button onClick={requestLocation} disabled={locating}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-medium flex items-center gap-1.5 disabled:opacity-50"
                      style={{ background: 'rgba(20,135,156,0.18)', color: '#14879c' }}>
                      <Navigation size={12} /> {t('Retry', 'إعادة المحاولة')}
                    </button>
                  </div>
                </div>
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
                  <p className="text-2xl font-light text-[#14879c]">{formatTime12Hour(nextPrayerData.prayer.time)}</p>
                </div>
                {/* Live countdown — ticks every second */}
                <div className="relative z-10 mt-1 flex items-center justify-center gap-2 rounded-xl py-2"
                  style={{ background: 'rgba(0,0,0,0.18)' }}>
                  <span className="text-[10px] text-[color:var(--text-muted)] arabic-text">{t('Time left', 'المتبقّي')}</span>
                  <span className="text-lg font-semibold text-white tabular-nums tracking-wider" dir="ltr">{fmtCountdown(nextPrayerData.secondsLeft)}</span>
                </div>
              </div>
            )}

            <div className="glass-card-sm p-4 flex flex-col gap-3 relative z-30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Volume2 size={16} className="text-[#14879c]" />
                  <span className="text-sm font-medium text-white">{t('Adhan voice', 'صوت المؤذن')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={testAdhanNotification}
                    className="relative z-50 flex items-center gap-1 text-[10px] bg-[#d4af37]/15 hover:bg-[#d4af37]/30 px-2.5 py-1.5 rounded-lg text-[#d4af37] transition-colors"
                  >
                    <Bell size={12} /> {t('Test alert', 'اختبار الإشعار')}
                  </button>
                  <button
                    onClick={previewAdhan}
                    className="relative z-50 flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded-lg transition-colors"
                    style={{ background: previewing ? 'rgba(239,68,68,0.18)' : 'rgba(20,135,156,0.12)', color: previewing ? '#f87171' : '#14879c' }}
                  >
                    {previewing ? <Square size={11} fill="currentColor" /> : <PlayCircle size={12} />} {previewing ? t('Stop', 'إيقاف') : t('Preview', 'معاينة')}
                  </button>
                </div>
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

              {/* Per-prayer adhan on/off — mute the adhan for a specific prayer
                  while keeping the service running for the rest. */}
              <div className="pt-1">
                <p className="text-[10px] text-[color:var(--text-muted)] arabic-text mb-2" dir={t('ltr', 'rtl')}>{t('Adhan per prayer (tap to mute)', 'الأذان لكل صلاة (اضغط للكتم)')}</p>
                <div className="grid grid-cols-5 gap-1.5">
                  {ADHAN_PRAYERS.map((p) => {
                    const on = prayerAdhan[p.key] !== false;
                    return (
                      <button key={p.key} onClick={() => togglePrayerAdhan(p.key)}
                        className="py-2 rounded-lg text-[10px] arabic-text transition-all flex flex-col items-center gap-0.5"
                        style={{ background: on ? 'rgba(20,135,156,0.16)' : 'rgba(255,255,255,0.04)', color: on ? '#14879c' : 'var(--text-muted)', border: on ? '1px solid rgba(20,135,156,0.3)' : '1px solid rgba(var(--hair),0.08)' }}>
                        {on ? <Bell size={12} /> : <BellOff size={12} />}
                        <span>{t(p.en, p.ar)}</span>
                      </button>
                    );
                  })}
                </div>
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

        {/* Nearest mosque — opens Google Maps centred on the user's location. */}
        <button
          onClick={openNearestMosque}
          className="glass-card w-full p-4 flex items-center gap-4 text-left mt-3"
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl" style={{ background: 'rgba(31,157,87,0.15)' }}>🕌</div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white arabic-text">{t('Nearest Mosque', 'أقرب مسجد')}</p>
            <p className="text-xs text-[color:var(--text-muted)] arabic-text" dir={lang === 'ar' ? 'rtl' : 'ltr'}>{t('Show the closest mosques on Google Maps', 'اعرض أقرب المساجد على خرائط جوجل')}</p>
          </div>
          <MapPin size={16} className="text-[#1f9d57]" />
        </button>

        <button
          onClick={() => onNavigate('fasting')}
          className="glass-card w-full p-4 flex items-center gap-4 text-left mt-3"
        >
          <div className="w-12 h-12 rounded-xl bg-[#d4af37]/15 flex items-center justify-center flex-shrink-0">
            <Moon size={22} className="text-[#d4af37]" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white arabic-text">{t('Voluntary Fasting', 'صيام التطوّع')}</p>
            <p className="text-xs text-[color:var(--text-muted)]">{t('Upcoming sunnah & nafl fasts', 'إمساكية السنن والنوافل القادمة')}</p>
          </div>
        </button>

        <div className="h-8" />
      </div>
    </div>
  );
}