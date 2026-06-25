// Live gold price (per gram, 24k spot) in the chosen currency, for the Zakat
// nisab. Free, no-key, CORS-enabled APIs; values are cached so the last figure
// shows offline and refreshes whenever the internet is available.
const GRAMS_PER_OZ = 31.1034768;
const CACHE_KEY = 'nur-gold-gram';

export const ZAKAT_CURRENCIES = ['EGP', 'USD', 'SAR', 'AED', 'KWD', 'QAR', 'JOD', 'MAD', 'DZD', 'EUR', 'GBP', 'TRY', 'PKR', 'INR', 'IDR'];

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
