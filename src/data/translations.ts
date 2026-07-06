// Translation metadata. The full catalogue (126 across 69 languages) is fetched
// from the API on demand (see useTranslationsList); this file holds the default
// and a verified "popular" shortlist for quick, offline-friendly labelling.

export interface TranslationInfo {
  id: number;
  name: string;
  language: string;
}

export const DEFAULT_TRANSLATION_IDS = [131]; // Dr. Mustafa Khattab — The Clear Quran (English)

// When the user picks a UI language, the Quran TRANSLATION shown alongside the
// (always-Arabic) text switches to a well-regarded translation in that language.
// IDs verified against api.quran.com /resources/translations.
export const LANG_TRANSLATION: Record<string, number> = {
  en: 131, // Dr. Mustafa Khattab — The Clear Quran
  fr: 136, // Montada Islamic Foundation
  es: 83,  // Sheikh Isa Garcia
  de: 27,  // Bubenheim & Nadeem
  tr: 77,  // Diyanet İşleri
  id: 33,  // Indonesian Ministry of Religious Affairs (Kemenag)
  ms: 39,  // Abdullah Muhammad Basmeih
  ru: 45,  // Elmir Kuliev
  pt: 43,  // Samir El-Hayek
};

// Verified against api.quran.com /resources/translations.
export const POPULAR_TRANSLATIONS: TranslationInfo[] = [
  { id: 131, name: 'Dr. Mustafa Khattab — The Clear Quran', language: 'english' },
  { id: 20, name: 'Saheeh International', language: 'english' },
  { id: 19, name: 'Pickthall', language: 'english' },
  { id: 85, name: 'M.A.S. Abdel Haleem', language: 'english' },
  { id: 84, name: 'T. Usmani', language: 'english' },
  { id: 95, name: 'A. Maududi (Tafhim)', language: 'english' },
  { id: 134, name: 'King Fahad Complex', language: 'indonesian' },
  { id: 779, name: 'Rashid Maash', language: 'french' },
];

export function translationLabel(id: number, catalogue: TranslationInfo[]): string {
  const all = [...POPULAR_TRANSLATIONS, ...catalogue];
  const found = all.find((t) => t.id === id);
  if (!found) return `Translation #${id}`;
  const lang = found.language.charAt(0).toUpperCase() + found.language.slice(1);
  return `${found.name} · ${lang}`;
}
