import { useEffect, useState } from 'react';
import { fetchTranslationsList } from '@/lib/quranApi';
import type { TranslationInfo } from '@/data/translations';

const LS_KEY = 'nur-translations-catalogue';

/** Full translations catalogue (126 across 69 languages), fetched once and cached. */
export function useTranslationsList(): { list: TranslationInfo[]; loading: boolean } {
  const [list, setList] = useState<TranslationInfo[]>(() => {
    try {
      const cached = localStorage.getItem(LS_KEY);
      return cached ? (JSON.parse(cached) as TranslationInfo[]) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (list.length) return;
    let active = true;
    setLoading(true);
    fetchTranslationsList()
      .then((items) => {
        if (!active) return;
        const mapped: TranslationInfo[] = items.map((t) => ({
          id: t.id,
          name: t.name,
          language: t.languageName,
        }));
        setList(mapped);
        try {
          localStorage.setItem(LS_KEY, JSON.stringify(mapped));
        } catch {
          /* quota — ignore */
        }
      })
      .catch(() => {
        /* offline — picker falls back to the popular shortlist */
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [list.length]);

  return { list, loading };
}
