import type { AzkarItem, AzkarCategory } from '@/types';

// User-created adhkar ("أذكاري"). Stored on-device only, like everything else.
const KEY = 'nur-custom-adhkar';
export const MY_ADHKAR_ID = 'my-adhkar';

interface RawDhikr { id: string; arabic: string; count: number }

function rawList(): RawDhikr[] {
  try {
    const arr = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

function save(items: RawDhikr[]): void {
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* ignore */ }
}

/** Custom adhkar shaped as AzkarItem[] so they render like the built-in ones. */
export function getCustomAdhkar(): AzkarItem[] {
  return rawList().map((d) => ({
    id: d.id,
    arabic: d.arabic,
    translation: '',
    transliteration: '',
    count: Math.max(1, d.count || 1),
  }));
}

export function addCustomDhikr(arabic: string, count: number): void {
  const text = (arabic || '').trim();
  if (!text) return;
  const items = rawList();
  items.push({
    id: 'c' + Date.now().toString(36),
    arabic: text,
    count: Math.max(1, Math.min(1000, Math.round(count) || 1)),
  });
  save(items);
}

export function removeCustomDhikr(id: string): void {
  save(rawList().filter((d) => d.id !== id));
}

/** A synthetic category for the My-Adhkar screen / list card. */
export function customAdhkarCategory(): AzkarCategory {
  return { id: MY_ADHKAR_ID, name: 'My Adhkar', arabicName: 'أذكاري', icon: 'heart', items: getCustomAdhkar() };
}
