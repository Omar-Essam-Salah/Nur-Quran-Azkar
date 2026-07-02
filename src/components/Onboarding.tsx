import { useEffect, useState } from 'react';
import { MapPin, Bell, Check, WifiOff, ChevronLeft, Loader2 } from 'lucide-react';
import { useI18n } from '@/i18n';
import { isLocationEnabled, openLocationSettings } from '@/lib/locationGate';

// First-launch welcome: explains the app and requests its runtime permissions
// (location for Qibla/prayer times, notifications for adhan/reminders) with
// clear buttons — Android can silently drop permission prompts fired with no
// user interaction, so we ask them explicitly here.
export default function Onboarding({ onDone }: { onDone: () => void }) {
  const { t, lang } = useI18n();
  const isAr = lang === 'ar';
  const [loc, setLoc] = useState<'idle' | 'ok' | 'no' | 'pending'>('idle');
  const [gpsOff, setGpsOff] = useState(false); // location SERVICE off (vs permission)
  const [notif, setNotif] = useState<'idle' | 'ok' | 'no' | 'pending'>('idle');
  const [offline, setOffline] = useState(typeof navigator !== 'undefined' && navigator.onLine === false);
  useEffect(() => {
    const on = () => setOffline(false); const off = () => setOffline(true);
    window.addEventListener('online', on); window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  const askLocation = () => {
    if (!navigator.geolocation) { setLoc('no'); return; }
    setLoc('pending'); // show a spinner immediately so it never looks frozen
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        try { localStorage.setItem('nur-geo', JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude, t: Date.now() })); } catch { /* ignore */ }
        setLoc('ok'); setGpsOff(false);
      },
      async () => {
        // Permission may be granted but the location SERVICE (GPS) switched off —
        // detect that so we can send the user straight to the toggle.
        setGpsOff(!(await isLocationEnabled()));
        setLoc('no');
      },
      { enableHighAccuracy: false, timeout: 6000, maximumAge: 600000 },
    );
  };

  // Open the GPS toggle; when the user returns, re-check automatically.
  const enableLocation = async () => { await openLocationSettings(); setTimeout(askLocation, 1500); };

  useEffect(() => {
    let remove: (() => void) | undefined;
    (async () => {
      try {
        const { App } = await import('@capacitor/app');
        const h = await App.addListener('resume', () => { if (loc !== 'ok') askLocation(); });
        remove = () => h.remove();
      } catch { /* not native */ }
    })();
    return () => { remove?.(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loc]);

  const askNotif = async () => {
    setNotif('pending');
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      const p = await LocalNotifications.requestPermissions();
      setNotif(p.display === 'granted' ? 'ok' : 'no');
    } catch { setNotif('no'); }
  };

  const finish = () => {
    try { localStorage.setItem('nur-onboarded', '1'); } catch { /* ignore */ }
    onDone();
  };

  const PermRow = ({ icon: Icon, color, title, desc, state, onAsk, cta }: {
    icon: typeof MapPin; color: string; title: string; desc: string; state: 'idle' | 'ok' | 'no' | 'pending'; onAsk: () => void; cta?: string;
  }) => (
    <div className="glass-card-sm p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}1f` }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">{title}</p>
        <p className="text-[11px] text-[color:var(--text-muted)] arabic-text" dir={isAr ? 'rtl' : 'ltr'}>{desc}</p>
      </div>
      {state === 'ok' ? (
        <span className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center"><Check size={18} className="text-emerald-400" /></span>
      ) : state === 'pending' ? (
        <span className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: `${color}22` }}><Loader2 size={17} className="animate-spin" style={{ color }} /></span>
      ) : (
        <button onClick={onAsk} className="px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap" style={{ background: `${color}22`, color }}>
          {cta ?? (state === 'no' ? t('Retry', 'إعادة') : t('Allow', 'سماح'))}
        </button>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[95] overflow-y-auto" style={{ background: 'radial-gradient(ellipse at top, #0c2f44 0%, #07151d 80%)' }}>
      <div className="min-h-full flex flex-col items-center justify-center px-5 py-10 max-w-md mx-auto">
        <img src={`${import.meta.env.BASE_URL}icon-512.png`} alt="Nur" className="w-20 h-20 rounded-3xl" style={{ boxShadow: '0 12px 40px rgba(0,0,0,0.5)' }} />
        <h1 className="mt-4 text-2xl font-bold text-white arabic-text">{t('Welcome to Nur', 'أهلًا بك في نور')}</h1>
        <p className="mt-1 text-xs text-[color:var(--text-muted)] arabic-text text-center" dir={isAr ? 'rtl' : 'ltr'}>
          {t('Quran & Azkar — free, ad-free, and works offline.', 'قرآن وأذكار — مجاني، بلا إعلانات، ويعمل بدون إنترنت.')}
        </p>

        {offline && (
          <div className="w-full mt-4 rounded-xl p-3 flex items-start gap-2.5" style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)' }}>
            <WifiOff size={16} className="text-[#f59e0b] flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-[#f59e0b] arabic-text leading-relaxed" dir={isAr ? 'rtl' : 'ltr'}>
              {t('You seem to be offline. Connect to the internet to download recitations & Mushaf pages. The Quran text, azkar & guide already work offline.',
                 'يبدو أنك بدون إنترنت. اتّصل بالشبكة لتحميل التلاوات وصفحات المصحف. أمّا نص القرآن والأذكار والدليل فتعمل بدون إنترنت بالفعل.')}
            </p>
          </div>
        )}

        <div className="w-full mt-6 space-y-2.5">
          <p className="text-[10px] uppercase tracking-wider text-[#d4af37] px-1">{t('Permissions', 'الصلاحيات')}</p>
          <PermRow icon={MapPin} color="#f472b6" state={loc}
            onAsk={gpsOff ? enableLocation : askLocation}
            cta={gpsOff ? t('Turn on GPS', 'تفعيل الموقع') : undefined}
            title={t('Location', 'الموقع')}
            desc={gpsOff
              ? t('Location service is off — tap to turn it on.', 'خدمة الموقع مقفولة — اضغط لتفعيلها.')
              : t('For the Qibla compass & prayer times', 'لبوصلة القبلة ومواقيت الصلاة')} />
          <PermRow icon={Bell} color="#14879c" state={notif} onAsk={askNotif}
            title={t('Notifications', 'الإشعارات')}
            desc={t('For the adhan & gentle reminders', 'للأذان والتذكيرات اللطيفة')} />
        </div>

        <div className="w-full mt-4 glass-card-sm p-4 flex items-start gap-3">
          <WifiOff size={18} className="text-[#14879c] flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-white/80 arabic-text leading-relaxed" dir={isAr ? 'rtl' : 'ltr'}>
            {t('The Quran, azkar, prayer times and guide are built-in and work offline right away. Recitations and mushaf pages download as you use them (they are too large to bundle), and each surah has a download button for offline listening.',
               'القرآن والأذكار والمواقيت والدليل مدمجة وتعمل بدون إنترنت فورًا. التلاوات وصفحات المصحف تُحمّل عند استخدامها (أكبر من أن تُدمج كلها)، ولكل سورة زر تحميل للاستماع دون إنترنت.')}
          </p>
        </div>

        <button onClick={finish} className="glass-btn w-full mt-6 py-3.5 text-sm font-semibold flex items-center justify-center gap-2">
          {t('Get Started', 'ابدأ الآن')} <ChevronLeft size={16} className={isAr ? '' : 'rotate-180'} />
        </button>
        <p className="mt-3 text-[10px] text-[color:var(--text-muted)]/70 arabic-text">{t('You can change permissions anytime in system settings.', 'تقدر تغيّر الصلاحيات في أي وقت من إعدادات النظام.')}</p>
      </div>
    </div>
  );
}
