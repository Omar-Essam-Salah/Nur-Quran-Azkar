import { useEffect, useRef, useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { pickReminder, isPrayerTimeNow } from '@/lib/reminders';
import { useI18n } from '@/i18n';

// Gentle "treasure" banner shown once per app-open: a hope-instilling reminder
// that slides in from the top, then auto-dismisses.
export default function DailyReminder() {
  const { t, lang } = useI18n();
  const muted = useRef(isPrayerTimeNow()); // don't pop up during prayer (if DND on)
  const reminderRef = useRef(muted.current ? null : pickReminder());
  const [show, setShow] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const close = () => { setLeaving(true); setTimeout(() => setShow(false), 350); };

  useEffect(() => {
    if (muted.current) return;
    const t1 = setTimeout(() => setShow(true), 200);      // after splash settles
    const t2 = setTimeout(() => close(), 11000);          // auto-dismiss
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (muted.current || !show || !reminderRef.current) return null;
  const text = lang === 'ar' ? reminderRef.current!.ar : reminderRef.current!.en;

  return (
    <div
      className="fixed top-0 inset-x-0 z-[90] flex justify-center px-3 pt-3 pointer-events-none"
      style={{ transition: 'transform 0.35s ease, opacity 0.35s ease', transform: leaving ? 'translateY(-120%)' : 'translateY(0)', opacity: leaving ? 0 : 1 }}
    >
      <div
        className="pointer-events-auto w-full max-w-lg rounded-2xl px-4 py-3 flex items-start gap-3"
        style={{
          background: 'linear-gradient(135deg, rgba(20,135,156,0.22), rgba(212,175,55,0.12))',
          border: '1px solid rgba(212,175,55,0.30)',
          borderTop: '1px solid rgba(212,175,55,0.45)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
        }}
      >
        <div className="w-8 h-8 rounded-full bg-[#d4af37]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Sparkles size={16} className="text-[#d4af37]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-[#d4af37] mb-0.5">{t('A gentle reminder', 'تذكير لطيف')}</p>
          <p className={`text-sm text-white leading-relaxed ${lang === 'ar' ? 'arabic-text' : ''}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            {text}
          </p>
        </div>
        <button onClick={close} className="p-1 rounded-lg hover:bg-white/10 transition-all flex-shrink-0" aria-label="Dismiss">
          <X size={15} className="text-[color:var(--text-muted)]" />
        </button>
      </div>
    </div>
  );
}
