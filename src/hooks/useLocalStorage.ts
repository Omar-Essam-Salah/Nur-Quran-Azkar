import { useState, useEffect, useCallback } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error(`Error writing localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setStoredValue(prev => {
      const nextValue = value instanceof Function ? value(prev) : value;
      return nextValue;
    });
  }, []);

  return [storedValue, setValue];
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useLocalStorage<Array<{
    id: string;
    type: 'ayah' | 'azkar';
    surahNumber?: number;
    ayahNumber?: number;
    azkarId?: string;
    text?: string;
    translation?: string;
    timestamp: number;
  }>>('nur-bookmarks', []);

  const addBookmark = useCallback((bookmark: Omit<typeof bookmarks[0], 'id' | 'timestamp'>) => {
    const newBookmark = {
      ...bookmark,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };
    setBookmarks(prev => [newBookmark, ...prev]);
  }, [setBookmarks]);

  const removeBookmark = useCallback((id: string) => {
    setBookmarks(prev => prev.filter(b => b.id !== id));
  }, [setBookmarks]);

  const isBookmarked = useCallback((type: string, surahNumber?: number, ayahNumber?: number) => {
    return bookmarks.some(b => 
      b.type === type && 
      b.surahNumber === surahNumber && 
      b.ayahNumber === ayahNumber
    );
  }, [bookmarks]);

  return { bookmarks, addBookmark, removeBookmark, isBookmarked };
}

export function useLastRead() {
  const [lastRead, setLastRead] = useLocalStorage<{
    surahNumber: number;
    ayahNumber: number;
    timestamp: number;
  } | null>('nur-last-read', null);

  const updateLastRead = useCallback((surahNumber: number, ayahNumber: number) => {
    setLastRead({ surahNumber, ayahNumber, timestamp: Date.now() });
  }, [setLastRead]);

  return { lastRead, updateLastRead };
}

export function useSettings() {
  const [settings, setSettings] = useLocalStorage('nur-settings', {
    theme: 'dark' as 'auto' | 'dark' | 'light',
    arabicFontSize: 24,
    translationFontSize: 14,
    showTranslation: true,
    showTransliteration: false,
    reciter: 'minshawi_murattal',
    translationIds: [131] as number[], // Dr. Mustafa Khattab — The Clear Quran
    language: 'en',
    elderMode: false,
  });

  return { settings, setSettings };
}

export function useTasbih() {
  const [counts, setCounts] = useLocalStorage<Record<string, number>>('nur-tasbih-counts', {});
  const [activeDhikr, setActiveDhikr] = useLocalStorage('nur-tasbih-active', 'subhanallah');

  const increment = useCallback((key: string) => {
    setCounts(prev => ({ ...prev, [key]: (prev[key] || 0) + 1 }));
  }, [setCounts]);

  const reset = useCallback((key: string) => {
    setCounts(prev => ({ ...prev, [key]: 0 }));
  }, [setCounts]);

  const getCount = useCallback((key: string) => {
    return counts[key] || 0;
  }, [counts]);

  return { counts, activeDhikr, setActiveDhikr, increment, reset, getCount };
}
