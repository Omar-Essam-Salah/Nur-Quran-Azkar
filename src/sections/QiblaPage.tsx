import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Navigation, Locate, Compass } from 'lucide-react';
import { calculateQibla } from '@/data/prayerTimes';
import { getCachedGeo } from '@/lib/permissions';
import { isLocationEnabled, openLocationSettings } from '@/lib/locationGate';
import { useI18n } from '@/i18n';

interface QiblaPageProps {
  onBack: () => void;
}

export default function QiblaPage({ onBack }: QiblaPageProps) {
  const { t } = useI18n();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [qiblaDirection, setQiblaDirection] = useState<number>(45);
  const [compassHeading, setCompassHeading] = useState<number>(0);
  const [locationError, setLocationError] = useState('');
  const [gpsOff, setGpsOff] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [noSensor, setNoSensor] = useState(false);
  const [showTip, setShowTip] = useState(() => !localStorage.getItem('nur-qibla-tip'));
  const dismissTip = () => { setShowTip(false); try { localStorage.setItem('nur-qibla-tip', '1'); } catch { /* ignore */ } };
  const cardRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef(0);

  // Get location and calculate Qibla
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLocation({ lat, lng });
        setQiblaDirection(calculateQibla(lat, lng));
        setLocationError('');
        setGpsOff(false);
      },
      async () => {
        const enabled = await isLocationEnabled();
        setGpsOff(!enabled);
        setLocationError(enabled
          ? t('Location unavailable — Qibla shown from Makkah.', 'تعذّر تحديد الموقع — القبلة محسوبة من مكة.')
          : t('Location (GPS) is off — turn it on for accurate Qibla.', 'خدمة الموقع (GPS) مقفولة — فعّلها لقبلة دقيقة.'));
        if (!getCachedGeo()) setQiblaDirection(45);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  }, [t]);

  const enableLocation = useCallback(async () => {
    await openLocationSettings();
    setTimeout(requestLocation, 1500);
  }, [requestLocation]);

  useEffect(() => {
    const cached = getCachedGeo();
    if (cached) {
      setLocation(cached);
      setQiblaDirection(calculateQibla(cached.lat, cached.lng));
    }
    requestLocation();
  }, [requestLocation]);

  // Re-try automatically when the user returns from the location settings page.
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
  }, [requestLocation]);

  // Device orientation for compass.
  //
  // Lessons baked in here:
  //  • Don't blend two reference frames (absolute true-north vs. the relative
  //    drifting frame) — that caused the needle to flip/spin. We lock onto ONE
  //    source: prefer `deviceorientationabsolute`; if it never arrives, fall
  //    back to plain `deviceorientation` so the compass still shows SOMETHING.
  //  • Smooth in vector space (average sin/cos) instead of raw degrees, which
  //    handles the 0↔360 wrap cleanly and removes the sudden direction reversal.
  //  • Compensate for the screen rotation angle.
  useEffect(() => {
    let absoluteSeen = false;
    let everReceived = false;
    // Smoothed heading as a unit vector (atan2 gives a wrap-safe average), then
    // accumulated into a CONTINUOUS (unwrapped) value so the CSS rotation always
    // animates the short way — no violent spin when crossing 0°/360°.
    let sSin = 0, sCos = 1, primed = false;
    let continuous = 0;

    const screenAngle = (): number => {
      const a = (window.screen?.orientation && window.screen.orientation.angle);
      return typeof a === 'number' ? a : ((window as any).orientation || 0);
    };

    const applyHeading = (heading: number) => {
      if (!Number.isFinite(heading)) return;
      everReceived = true;
      setNoSensor(false);
      const rad = (heading * Math.PI) / 180;
      const k = 0.2; // smoothing strength
      if (!primed) {
        sSin = Math.sin(rad); sCos = Math.cos(rad); primed = true;
        continuous = heading; headingRef.current = heading; setCompassHeading(heading);
        return;
      }
      sSin += k * (Math.sin(rad) - sSin);
      sCos += k * (Math.cos(rad) - sCos);
      const deg = (Math.atan2(sSin, sCos) * 180) / Math.PI; // -180..180
      let delta = deg - (((continuous % 360) + 360) % 360);  // shortest step to the new angle
      if (delta > 180) delta -= 360; else if (delta < -180) delta += 360;
      continuous += delta;
      headingRef.current = continuous;
      setCompassHeading(continuous);
    };

    const headingFromEvent = (e: DeviceOrientationEvent): number | null => {
      const any = e as any;
      if (typeof any.webkitCompassHeading === 'number') return any.webkitCompassHeading; // iOS, already true-north
      if (e.alpha == null) return null;
      return (360 - e.alpha + screenAngle()) % 360; // Android device-compass heading
    };

    const onAbsolute = (e: DeviceOrientationEvent) => {
      const h = headingFromEvent(e);
      if (h == null) return;
      absoluteSeen = true; // accurate source found → ignore the relative event
      applyHeading(h);
    };
    const onRelative = (e: DeviceOrientationEvent) => {
      if (absoluteSeen) return; // an accurate source is already driving the needle
      const h = headingFromEvent(e);
      if (h == null) return;
      applyHeading(h); // not guaranteed north-referenced, but better than a dead compass
    };

    if ((window as any).DeviceOrientationEvent?.requestPermission) {
      setIsCalibrating(true); // iOS 13+ needs an explicit tap to grant
    }

    window.addEventListener('deviceorientationabsolute', onAbsolute as any, true);
    window.addEventListener('deviceorientation', onRelative as any, true);

    // If nothing ever arrives, tell the user instead of showing a frozen dial.
    const t = window.setTimeout(() => { if (!everReceived) setNoSensor(true); }, 3000);

    return () => {
      window.clearTimeout(t);
      window.removeEventListener('deviceorientationabsolute', onAbsolute as any, true);
      window.removeEventListener('deviceorientation', onRelative as any, true);
    };
  }, []);

  // Mouse tilt effect for the card
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    const x = (offsetX - rect.width / 2) / 16;
    const y = (offsetY - rect.height / 2) / 16;
    
    if (cardRef.current) {
      cardRef.current.style.transform = `rotateY(${x}deg) rotateX(${-y}deg)`;
    }
    if (bgRef.current) {
      bgRef.current.style.transform = `translateZ(-60px) scale(1.15) rotateY(${x * 0.5}deg) rotateX(${-y * 0.5}deg)`;
    }
    if (fgRef.current) {
      fgRef.current.style.transform = `translateZ(40px) rotateY(${x * 1.2}deg) rotateX(${-y * 1.2}deg)`;
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (cardRef.current) cardRef.current.style.transform = '';
    if (bgRef.current) bgRef.current.style.transform = 'translateZ(-60px) scale(1.15)';
    if (fgRef.current) fgRef.current.style.transform = 'translateZ(40px)';
  }, []);

  // The qibla marker sits at this screen angle from the top. Kept CONTINUOUS
  // (no %360) so it rotates the short way as the heading crosses 0°/360°.
  const qiblaScreen = qiblaDirection - compassHeading;
  const signedDiff = ((qiblaDirection - compassHeading) % 360 + 540) % 360 - 180; // -180..180
  const aligned = Math.abs(signedDiff) <= 6; // facing the qibla

  return (
    <div className="page-enter min-h-screen">
      {/* First-time calibration tip */}
      {showTip && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-6" style={{ background: 'rgba(4,12,16,0.7)' }} onClick={dismissTip}>
          <div className="max-w-xs w-full rounded-2xl p-5 text-center space-y-3" onClick={(e) => e.stopPropagation()}
            style={{ background: 'linear-gradient(135deg, rgb(16,34,29), rgb(12,27,23))', border: '1px solid rgba(212,175,55,0.25)' }}>
            <Compass size={34} className="text-[#d4af37] mx-auto" />
            <h2 className="text-base font-semibold text-white arabic-text">معايرة البوصلة</h2>
            <p className="text-xs text-white/80 arabic-text leading-relaxed" dir="rtl">
              {t('The compass needs a moment to find its bearing. Hold the phone flat and wave it in a figure-8 a few times to calibrate, away from metal and magnets.',
                 'البوصلة بتحتاج لحظات تضبط اتجاهها. امسك الهاتف بشكل مسطّح وحرّكه على شكل رقم ٨ عدة مرات للمعايرة، بعيدًا عن المعادن والمغناطيس.')}
            </p>
            <button onClick={dismissTip} className="glass-btn w-full py-2.5 text-sm">{t('Got it', 'فهمت')}</button>
          </div>
        </div>
      )}
      {/* Header */}
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
          <h1 className="text-lg font-semibold text-white">{t('Qibla Compass', 'بوصلة القبلة')}</h1>
        </div>
      </header>

      <div className="px-4 pt-4 pb-8 max-w-lg mx-auto space-y-6">
        {/* Info */}
        <div className="text-center space-y-2">
          <p className="text-xs text-[color:var(--text-muted)]">
            {location ? `${t('From', 'من')}: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : t('Using default location', 'يُستخدم الموقع الافتراضي')}
          </p>
          {locationError && (
            <div className="flex flex-col items-center gap-1.5">
              <p className="text-[10px] text-[#f59e0b] arabic-text" dir={t('ltr', 'rtl')}>{locationError}</p>
              {gpsOff && (
                <button onClick={enableLocation}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1.5"
                  style={{ background: 'rgba(212,175,55,0.2)', color: '#d4af37' }}>
                  <Locate size={12} /> {t('Turn on Location', 'تفعيل خدمة الموقع')}
                </button>
              )}
            </div>
          )}
          {noSensor ? (
            <p className="text-[11px] text-[#f59e0b] arabic-text leading-relaxed px-4" dir="rtl">
              {t('Compass sensor not detected. Your device may lack a magnetometer, or the browser blocked it — use the Qibla angle below and a separate compass.',
                 'لم يتمّ العثور على حسّاس البوصلة. قد لا يحتوي جهازك على مِقياس مغناطيسي — استعن بزاوية القبلة بالأسفل أو ببوصلة منفصلة.')}
            </p>
          ) : (
            <p className="text-[10px] text-[color:var(--text-muted)] arabic-text" dir="rtl">
              {t('If the needle drifts, wave the phone in a figure-8 to calibrate.',
                 'لو المؤشر غير مستقر، حرّك الهاتف على شكل رقم ٨ لمعايرة البوصلة.')}
            </p>
          )}
        </div>

        {/* 3D Tilt Compass Card */}
        <div 
          className="tilt-card-wrap mx-auto"
          style={{ maxWidth: '320px' }}
        >
          <div
            ref={cardRef}
            className="tilt-card relative rounded-3xl overflow-hidden"
            style={{
              aspectRatio: '1',
              background: 'linear-gradient(135deg, rgba(var(--glass-1), 0.6), rgba(var(--glass-2), 0.8))',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderTop: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(255, 255, 255, 0.05)',
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {/* Background Pattern Layer */}
            <div 
              ref={bgRef}
              className="tilt-bg absolute inset-0 opacity-30"
              style={{
                backgroundImage: 'url(/assets/islamic-star-pattern.svg)',
                backgroundSize: '60px',
              }}
            />

            {/* Main Content Layer */}
            <div 
              ref={fgRef}
              className="tilt-fg absolute inset-0 flex flex-col items-center justify-center p-6"
            >
              {/* Compass Dial — rotate yourself until the gold Kaaba marker
                  meets the fixed pointer at the top. */}
              <div className="relative w-52 h-52">
                {/* Fixed top reference pointer = the direction you are facing */}
                <div className="absolute left-1/2 -translate-x-1/2 -top-3 z-30">
                  <div style={{ width: 0, height: 0, borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderTop: `14px solid ${aligned ? '#34d399' : '#ffffff'}`, transition: 'border-color 0.3s' }} />
                </div>

                {/* Rings */}
                <div className="absolute inset-0 rounded-full" style={{ border: `2px solid ${aligned ? 'rgba(52,211,153,0.7)' : 'rgba(255,255,255,0.12)'}`, boxShadow: aligned ? '0 0 26px rgba(52,211,153,0.35)' : 'none', transition: 'all 0.3s' }} />
                <div className="absolute inset-4 rounded-full" style={{ border: '1px solid rgba(255,255,255,0.06)' }} />

                {/* Rotating compass rose — N points to true north */}
                <div className="absolute inset-0" style={{ transform: `rotate(${-compassHeading}deg)`, transition: 'transform 0.15s linear' }}>
                  <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[12px] font-bold text-[#ef4444]">N</span>
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] text-[color:var(--text-muted)]">S</span>
                  <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-[color:var(--text-muted)]">W</span>
                  <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-[color:var(--text-muted)]">E</span>
                  {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
                    <div key={deg} className="absolute top-0 left-1/2 w-px bg-white/10" style={{ height: '8px', transform: `translateX(-50%) rotate(${deg}deg)`, transformOrigin: '50% 104px' }} />
                  ))}
                </div>

                {/* Qibla arrow + Kaaba marker — points to the Kaaba */}
                <div className="absolute inset-0" style={{ transform: `rotate(${qiblaScreen}deg)`, transition: 'transform 0.15s linear' }}>
                  <div className="absolute left-1/2 top-1/2 rounded-full" style={{ width: '3px', height: '40%', transform: 'translate(-50%, -100%)', transformOrigin: 'bottom', background: `linear-gradient(to top, transparent, ${aligned ? '#34d399' : '#d4af37'})` }} />
                  <div className="absolute left-1/2 -top-1 flex flex-col items-center" style={{ transform: `translateX(-50%) rotate(${-qiblaScreen}deg)` }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: aligned ? '#34d399' : '#d4af37', boxShadow: `0 0 16px ${aligned ? 'rgba(52,211,153,0.8)' : 'rgba(212,175,55,0.7)'}`, transition: 'all 0.3s' }}>
                      <span style={{ fontSize: '17px', lineHeight: 1 }}>🕋</span>
                    </div>
                  </div>
                </div>

                {/* Center Hub */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-4 h-4 rounded-full bg-[#14879c] border-2 border-white/30 shadow-lg shadow-[#14879c]/30" />
                </div>
              </div>

              {/* Qibla Info — the big number is LIVE: it's how far you still need
                  to turn, counting down to 0° as you rotate toward the Kaaba. */}
              <div className="mt-6 text-center space-y-1">
                {aligned ? (
                  <>
                    <p className="text-3xl font-light text-[#34d399] tabular-nums">0°</p>
                    <div className="flex items-center justify-center gap-1.5">
                      <Navigation size={12} className="text-[#34d399]" />
                      <span className="text-[11px] font-semibold text-[#34d399] arabic-text">{t('You are facing the Qibla ✓', 'أنت تواجه القبلة ✓')}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-3xl font-light text-white tabular-nums">
                      {signedDiff > 0 ? '↻ ' : '↺ '}{Math.round(Math.abs(signedDiff))}°
                    </p>
                    <p className="text-[11px] text-[#d4af37] arabic-text">
                      {signedDiff > 0 ? t('Turn right toward the Qibla', 'لُفّ يمينًا نحو القبلة') : t('Turn left toward the Qibla', 'لُفّ يسارًا نحو القبلة')}
                    </p>
                  </>
                )}
                <p className="text-[10px] text-[color:var(--text-muted)] arabic-text pt-0.5" dir="rtl">
                  {t('Qibla', 'القبلة')} {Math.round(qiblaDirection)}° · {t('Heading', 'اتجاهك')} {Math.round(((compassHeading % 360) + 360) % 360)}°
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Manual Calibration */}
        {isCalibrating && (
          <div className="glass-card p-4 text-center space-y-3">
            <Locate size={24} className="text-[#14879c] mx-auto" />
            <p className="text-sm text-white">{t('Enable Compass', 'تفعيل البوصلة')}</p>
            <p className="text-xs text-[color:var(--text-muted)]">
              {t('For accurate Qibla direction, please allow compass access.', 'لاتجاه دقيق للقبلة، يُرجى السماح بالوصول إلى البوصلة.')}
            </p>
            <button
              onClick={async () => {
                try {
                  if ((window as any).DeviceOrientationEvent?.requestPermission) {
                    const response = await (window as any).DeviceOrientationEvent.requestPermission();
                    if (response === 'granted') {
                      setIsCalibrating(false);
                    }
                  }
                } catch {
                  setIsCalibrating(false);
                }
              }}
              className="glass-btn px-6 py-2.5 text-sm"
            >
              {t('Enable Compass', 'تفعيل البوصلة')}
            </button>
          </div>
        )}

        {/* Kaaba Image */}
        <div className="glass-card-sm p-4 text-center space-y-3">
          <img 
            src="/assets/kaaba.jpg" 
            alt="The Kaaba" 
            className="w-full h-40 object-cover rounded-xl"
          />
          <p className="text-xs text-[color:var(--text-muted)]">
            {t('The Kaaba in Masjid al-Haram, Makkah', 'الكعبة المشرّفة في المسجد الحرام بمكة')}
          </p>
        </div>

        {/* Instructions */}
        <div className="glass-card-sm p-4 space-y-2">
          <h3 className="text-xs text-[color:var(--text-muted)] uppercase tracking-wider">{t('How to Use', 'طريقة الاستخدام')}</h3>
          <ol className="space-y-2 text-xs text-white/80">
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-[#14879c]/20 flex items-center justify-center flex-shrink-0 text-[10px] text-[#14879c] font-medium">1</span>
              {t('Hold your device flat and level.', 'أمسك جهازك مستويًا أفقيًا.')}
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-[#14879c]/20 flex items-center justify-center flex-shrink-0 text-[10px] text-[#14879c] font-medium">2</span>
              {t('The golden needle points to the Qibla direction.', 'الإبرة الذهبية تشير إلى اتجاه القبلة.')}
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-[#14879c]/20 flex items-center justify-center flex-shrink-0 text-[10px] text-[#14879c] font-medium">3</span>
              {t('Rotate yourself until the needle aligns with North.', 'استدر حتى تتوافق الإبرة مع الشمال.')}
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-[#14879c]/20 flex items-center justify-center flex-shrink-0 text-[10px] text-[#14879c] font-medium">4</span>
              {t('You are now facing the Kaaba. Allahu Akbar!', 'أنت الآن تتّجه نحو الكعبة. الله أكبر!')}
            </li>
          </ol>
        </div>

        <div className="h-8" />
      </div>
    </div>
  );
}
