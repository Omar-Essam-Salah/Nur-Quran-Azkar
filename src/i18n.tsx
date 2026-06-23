import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Lang = 'ar' | 'en';

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
  /** t(english, arabic) → returns the string for the current language. */
  t: (en: string, ar: string) => string;
}

const I18nContext = createContext<I18nCtx>({
  lang: 'ar',
  setLang: () => {},
  toggle: () => {},
  t: (en) => en,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem('nur-lang');
    return saved === 'en' || saved === 'ar' ? saved : 'ar';
  });

  useEffect(() => {
    localStorage.setItem('nur-lang', lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (l: Lang) => setLangState(l);
  const toggle = () => setLangState((p) => (p === 'ar' ? 'en' : 'ar'));
  const t = (en: string, ar: string) => (lang === 'ar' ? ar : en);

  return <I18nContext.Provider value={{ lang, setLang, toggle, t }}>{children}</I18nContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useI18n() {
  return useContext(I18nContext);
}
