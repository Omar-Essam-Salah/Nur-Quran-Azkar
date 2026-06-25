export interface Surah {
  number: number;
  name: string;
  englishName: string;
  verses: number;
  type: 'Meccan' | 'Medinan';
  englishNameTranslation: string;
}

export interface Ayah {
  number: number;
  text: string;
  translation: string;
  surah: number;
  numberInSurah: number;
}

export interface AzkarItem {
  id: string;
  arabic: string;
  translation: string;
  transliteration: string;
  count: number;
  reference?: string;
  virtue?: string;
}

export interface AzkarCategory {
  id: string;
  name: string;
  arabicName: string;
  icon: string;
  items: AzkarItem[];
}

export interface Bookmark {
  id: string;
  type: 'ayah' | 'azkar';
  surahNumber?: number;
  ayahNumber?: number;
  azkarId?: string;
  azkarItemId?: string;
  text?: string;
  translation?: string;
  timestamp: number;
}

export interface PrayerTime {
  name: string;
  arabicName: string;
  time: string;
  rakats: number;
  type: 'fard' | 'sunnah' | 'nafl';
}

export interface AppSettings {
  theme: 'auto' | 'dark' | 'light';
  arabicFontSize: number;
  translationFontSize: number;
  showTranslation: boolean;
  showTransliteration: boolean;
  reciter: string;
  /** Selected translation resource ids (api.quran.com). */
  translationIds: number[];
  language: string;
  /** Elderly mode — enlarges the whole interface for easier reading. */
  elderMode: boolean;
}

export type Page = 'home' | 'quran' | 'quran-reader' | 'azkar' | 'azkar-detail' | 'prayer' | 'qibla' | 'tasbih' | 'bookmarks' | 'settings' | 'search' | 'mushaf' | 'fasting' | 'prophets' | 'hadith' | 'asma' | 'khatma' | 'ramadan' | 'ledger' | 'guide' | 'zakat' | 'kids' | 'more';

export type BottomNavPage = 'home' | 'quran' | 'azkar' | 'prayer' | 'more';
