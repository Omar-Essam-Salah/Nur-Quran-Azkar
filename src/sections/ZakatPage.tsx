import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Coins, Info, RefreshCw, Loader2, CalendarClock, Calculator } from 'lucide-react';
import { fetchGoldPricePerGram, getCachedGold, ZAKAT_CURRENCIES } from '@/lib/goldPrice';
import { useI18n } from '@/i18n';

interface ZakatPageProps { onBack: () => void }

// Pure-math, fully offline. The user enters amounts in their own currency.
const NISAB_GOLD_G = 85; // 85g of gold = the gold nisab threshold

const num = (v: string) => {
  const n = parseFloat((v || '').replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? n : 0;
};

// Defined at module scope — NOT inside the page — so it keeps a stable identity
// across renders. (Defining it inline remounted the <input> on every keystroke,
// which is exactly what was closing the keyboard.)
function ZField({ label, value, onChange, dir }: { label: string; value: string; onChange: (v: string) => void; dir: 'ltr' | 'rtl' }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <label className="text-xs text-white/80 arabic-text flex-1" dir={dir}>{label}</label>
      <input type="number" inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} placeholder="0"
        className="w-32 px-3 py-2 rounded-lg bg-white/5 text-sm text-white text-right outline-none border border-transparent focus:border-[#14879c]/40" />
    </div>
  );
}

export default function ZakatPage({ onBack }: ZakatPageProps) {
  const { t } = useI18n();
  const [cash, setCash] = useState('');
  const [gold, setGold] = useState('');        // value of gold you own (currency)
  const [silver, setSilver] = useState('');    // value of silver you own
  const [business, setBusiness] = useState(''); // trade goods value
  const [receivable, setReceivable] = useState(''); // money owed TO you
  const [debts, setDebts] = useState('');       // money you owe (subtracted)
  const [goldPrice, setGoldPrice] = useState(''); // price of 1g gold (for nisab)
  const [currency, setCurrency] = useState(() => localStorage.getItem('nur-zakat-currency') || 'EGP');
  const [liveAt, setLiveAt] = useState<number | null>(null);
  const [fetching, setFetching] = useState(false);

  // Auto-fetch the live 24k gold price (per gram) in the chosen currency so the
  // nisab is always at today's market — refreshes whenever the net is available.
  const loadGold = async (cur: string) => {
    const cached = getCachedGold(cur);
    if (cached) { setGoldPrice(String(Math.round(cached.perGram * 100) / 100)); setLiveAt(cached.at); }
    setFetching(true);
    const q = await fetchGoldPricePerGram(cur);
    setFetching(false);
    if (q) { setGoldPrice(String(Math.round(q.perGram * 100) / 100)); setLiveAt(q.at); }
  };
  useEffect(() => { void loadGold(currency); /* eslint-disable-next-line */ }, [currency]);

  const { wealth, nisab, due, zakat } = useMemo(() => {
    const wealth = num(cash) + num(gold) + num(silver) + num(business) + num(receivable) - num(debts);
    const nisab = num(goldPrice) * NISAB_GOLD_G;
    const due = nisab > 0 && wealth >= nisab;
    return { wealth, nisab, due, zakat: due ? wealth * 0.025 : 0 };
  }, [cash, gold, silver, business, receivable, debts, goldPrice]);

  const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  const dir = t('ltr', 'rtl') as 'ltr' | 'rtl';

  // The result updates live, but a "Calculate" button gives an explicit action:
  // it scrolls to the result and pulses it so the user clearly sees the figure.
  const resultRef = useRef<HTMLDivElement>(null);
  const [pulse, setPulse] = useState(false);
  const calculate = () => {
    resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setPulse(true);
    window.setTimeout(() => setPulse(false), 1400);
  };

  // Hawl reminder — a local notification on the date the user's wealth completes
  // a full lunar year, nudging them to recalculate and pay their zakat.
  const [zReminder, setZReminder] = useState(() => localStorage.getItem('nur-zakat-reminder') || '');
  const setZakatReminder = async (date: string) => {
    setZReminder(date);
    try { localStorage.setItem('nur-zakat-reminder', date); } catch { /* ignore */ }
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      await LocalNotifications.cancel({ notifications: [{ id: 2003 }] }).catch(() => {});
      if (!date) return;
      const perm = await LocalNotifications.requestPermissions();
      if (perm.display !== 'granted') return;
      const at = new Date(`${date}T10:00:00`);
      if (at.getTime() <= Date.now()) return; // only schedule future reminders
      await LocalNotifications.schedule({
        notifications: [{
          id: 2003,
          title: 'نُور · موعد زكاتك',
          body: 'حال الحول على مالك — احسب زكاتك وأخرِجها، طُهرةً لمالك ونماءً 🤍',
          schedule: { at, allowWhileIdle: true },
          smallIcon: 'ic_stat_nur', largeIcon: 'nur_logo',
        }],
      });
    } catch { /* not native */ }
  };

  return (
    <div className="page-enter min-h-screen">
      <header className="sticky top-0 z-40 px-4 py-3">
        <div className="mx-auto max-w-lg flex items-center gap-3 rounded-2xl px-4 py-3"
          style={{ background: 'linear-gradient(135deg, rgba(var(--glass-1), 0.6), rgba(var(--glass-2), 0.7))', border: '1px solid rgba(var(--hair), 0.08)', borderTop: '1px solid rgba(var(--hair), 0.15)', backdropFilter: 'blur(8px)' }}>
          <button onClick={onBack} className="p-2 rounded-xl hover:bg-white/10 transition-all">
            <ArrowLeft size={18} className="text-[color:var(--text-muted)]" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-semibold text-white arabic-text">{t('Zakat Calculator', 'حاسبة الزكاة')}</h1>
            <p className="text-[10px] text-[color:var(--text-muted)]">{t('Zakat on wealth (2.5%)', 'زكاة المال · ٢٫٥٪')}</p>
          </div>
          <Coins size={18} className="text-[#d4af37]" />
        </div>
      </header>

      <div className="px-4 pt-2 pb-10 max-w-lg mx-auto space-y-4">
        {/* Result */}
        <div ref={resultRef} className="glass-card p-6 text-center space-y-1" style={{ scrollMarginTop: 70, transition: 'box-shadow 0.4s ease, border-color 0.4s ease', boxShadow: pulse ? '0 0 0 2px rgba(212,175,55,0.6), 0 0 30px rgba(212,175,55,0.35)' : undefined }}>
          <p className="text-[10px] uppercase tracking-wider text-[#d4af37]">{t('Zakat due', 'الزكاة المستحقّة')}</p>
          <p className="text-4xl font-light text-white tabular-nums">{fmt(zakat)} <span className="text-base text-[#d4af37]">{currency}</span></p>
          <p className="text-[11px] arabic-text" dir={t('ltr', 'rtl')}
            style={{ color: due ? '#10b981' : 'var(--text-muted)' }}>
            {num(goldPrice) <= 0
              ? t('Enter the gold price/gram to find the nisab', 'أدخل سعر جرام الذهب لحساب النِّصاب')
              : due
                ? t('Your wealth reached the nisab — zakat is due.', 'بلغ مالك النِّصاب — تجب الزكاة.')
                : t('Below the nisab — no zakat due.', 'أقلّ من النِّصاب — لا زكاة.')}
          </p>
          <p className="text-[10px] text-[color:var(--text-muted)] arabic-text pt-1" dir={t('ltr', 'rtl')}>
            {t('Zakatable wealth', 'وعاء الزكاة')}: {fmt(wealth)} · {t('Nisab', 'النِّصاب')}: {fmt(nisab)}
          </p>
        </div>

        {/* Assets */}
        <div className="glass-card-sm p-4 space-y-3">
          <h3 className="text-xs text-[color:var(--text-muted)] uppercase tracking-wider arabic-text">{t('Assets', 'الأموال')}</h3>
          <ZField dir={dir} label={t('Cash & bank savings', 'النقود والمدّخرات')} value={cash} onChange={setCash} />
          <ZField dir={dir} label={t('Gold value', 'قيمة الذهب')} value={gold} onChange={setGold} />
          <ZField dir={dir} label={t('Silver value', 'قيمة الفضة')} value={silver} onChange={setSilver} />
          <ZField dir={dir} label={t('Trade goods', 'عروض التجارة')} value={business} onChange={setBusiness} />
          <ZField dir={dir} label={t('Money owed to you', 'ديون لك (مرجوّة السداد)')} value={receivable} onChange={setReceivable} />
        </div>

        {/* Deductions */}
        <div className="glass-card-sm p-4 space-y-3">
          <h3 className="text-xs text-[color:var(--text-muted)] uppercase tracking-wider arabic-text">{t('Deduct', 'يُخصم')}</h3>
          <ZField dir={dir} label={t('Debts you owe (due now)', 'ديون عليك حالّة')} value={debts} onChange={setDebts} />
        </div>

        {/* Nisab basis — live gold price */}
        <div className="glass-card-sm p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs text-[color:var(--text-muted)] uppercase tracking-wider arabic-text">{t('Nisab', 'النِّصاب')}</h3>
            <div className="flex items-center gap-1.5">
              {fetching && <Loader2 size={12} className="text-[#14879c] animate-spin" />}
              <select value={currency}
                onChange={(e) => { setCurrency(e.target.value); localStorage.setItem('nur-zakat-currency', e.target.value); }}
                className="px-2 py-1 rounded-lg bg-white/5 text-xs text-white outline-none border border-transparent focus:border-[#14879c]/40">
                {ZAKAT_CURRENCIES.map((c) => <option key={c} value={c} className="bg-[#0c2f44]">{c}</option>)}
              </select>
              <button onClick={() => loadGold(currency)} className="p-1.5 rounded-lg hover:bg-white/10" title={t('Refresh', 'تحديث')} aria-label="Refresh">
                <RefreshCw size={13} className="text-[#d4af37]" />
              </button>
            </div>
          </div>
          <ZField dir={dir} label={t('Gold price per gram (24k)', 'سعر جرام الذهب (عيار ٢٤)')} value={goldPrice} onChange={setGoldPrice} />
          <p className="text-[10px] arabic-text" dir={t('ltr', 'rtl')} style={{ color: liveAt ? '#10b981' : 'var(--text-muted)' }}>
            {liveAt ? t('Live market price — adjust if needed.', 'سعرٌ مباشر من السوق — عدّله لو لزم.') : t('Connect to the internet for the live price, or enter it.', 'اتّصل بالإنترنت للسعر المباشر، أو أدخله يدويًا.')}
          </p>
          <p className="text-[10px] text-[color:var(--text-muted)] arabic-text leading-relaxed" dir={t('ltr', 'rtl')}>
            {t('Nisab = 85 g of gold. Zakat is 2.5% of wealth held for a full lunar year (hawl).',
               'النِّصاب = ٨٥ جرامًا من الذهب. ومقدار الزكاة ٢٫٥٪ مما حال عليه الحول (سنة هجرية).')}
          </p>
        </div>

        {/* Calculate — scrolls to & highlights the result at the top */}
        <button onClick={calculate}
          className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm font-semibold"
          style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.95), rgba(212,175,55,0.75))', color: '#0c2f44' }}>
          <Calculator size={17} /> {t('Calculate my Zakat', 'احسب زكاتي')}
        </button>

        {/* Hawl (lunar-year) reminder */}
        <div className="glass-card-sm p-4 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-xs text-white/90 arabic-text flex items-center gap-1.5">
                <CalendarClock size={13} className="text-[#d4af37]" /> {t('Hawl reminder', 'تذكير بحلول الحَوْل')}
              </h3>
              <p className="text-[10px] text-[color:var(--text-muted)] arabic-text" dir={dir}>
                {zReminder
                  ? `${t('Reminder set for', 'تذكير يوم')} ${zReminder}`
                  : t('Get reminded when a lunar year passes on your wealth.', 'ذكّرني عند مرور سنة هجرية على مالك.')}
              </p>
            </div>
            <input type="date" value={zReminder} onChange={(e) => setZakatReminder(e.target.value)}
              className="px-2 py-1.5 rounded-lg bg-white/5 text-xs text-white outline-none border border-transparent focus:border-[#14879c]/40" />
          </div>
          {zReminder && (
            <button onClick={() => setZakatReminder('')} className="text-[10px] text-red-400/80 px-2 py-1 rounded-lg hover:bg-red-500/10">
              {t('Cancel reminder', 'إلغاء التذكير')}
            </button>
          )}
        </div>

        <div className="glass-card-sm p-4 flex items-start gap-2.5">
          <Info size={15} className="text-[#14879c] flex-shrink-0 mt-0.5" />
          <p className="text-[10px] text-[color:var(--text-muted)] arabic-text leading-relaxed" dir={t('ltr', 'rtl')}>
            {t('This is a simplified estimate to help you. For complex cases (shares, livestock, agriculture) please consult a scholar.',
               'هذه حاسبة مبسّطة للتقريب والمساعدة. وللحالات الخاصة (الأسهم، الأنعام، الزروع) يُرجى سؤال أهل العلم.')}
          </p>
        </div>
        <div className="h-8" />
      </div>
    </div>
  );
}
