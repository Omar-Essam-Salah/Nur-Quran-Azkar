// Live gold price (per gram, 24k spot) in the chosen currency, for the Zakat
// nisab. Free, no-key, CORS-enabled APIs; values are cached so the last figure
// shows offline and refreshes whenever the internet is available.
const GRAMS_PER_OZ = 31.1034768;
const CACHE_KEY = 'nur-gold-gram';

export const ZAKAT_CURRENCIES = ['EGP', 'USD', 'SAR', 'AED', 'KWD', 'QAR', 'JOD', 'MAD', 'DZD', 'EUR', 'GBP', 'TRY', 'PKR', 'INR', 'IDR'];

// APPROXIMATE 24k gold price per gram, used as a fallback so the Zakat nisab is
// never zero when there is no live/cached price (offline / first run). Rough and
// editable — the field auto-updates to the live price whenever online.
const DEFAULT_GOLD_PER_GRAM: Record<string, number> = {
  USD: 95, EGP: 4700, SAR: 356, AED: 349, KWD: 29, QAR: 346, JOD: 67, MAD: 950,
  DZD: 12800, EUR: 88, GBP: 75, TRY: 3300, PKR: 26500, INR: 8100, IDR: 1540000,
};
export function defaultGoldPerGram(currency: string): number { return DEFAULT_GOLD_PER_GRAM[currency] ?? DEFAULT_GOLD_PER_GRAM.USD; }

export interface GoldQuote { perGram: number; currency: string; at: number }

export function getCachedGold(currency: string): GoldQuote | null {
  try {
    const q = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
    return q && q.currency === currency && typeof q.perGram === 'number' ? q : null;
  } catch { return null; }
}

/** Fetch live 24k gold price per gram in `currency`. Returns null when offline. */
export async function fetchGoldPricePerGram(currency: string): Promise<GoldQuote | null> {
  try {
    const [gold, fx] = await Promise.all([
      fetch('https://api.gold-api.com/price/XAU').then((r) => r.json()),
      currency === 'USD'
        ? Promise.resolve({ rates: { USD: 1 } })
        : fetch('https://open.er-api.com/v6/latest/USD').then((r) => r.json()),
    ]);
    const usdPerOz = Number(gold?.price);
    const rate = currency === 'USD' ? 1 : Number(fx?.rates?.[currency]);
    if (!usdPerOz || !rate || !Number.isFinite(usdPerOz) || !Number.isFinite(rate)) return null;
    const quote: GoldQuote = { perGram: (usdPerOz / GRAMS_PER_OZ) * rate, currency, at: Date.now() };
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(quote)); } catch { /* ignore */ }
    return quote;
  } catch { return null; }
}
