import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { LANGUAGES, LOCALES, type LangMeta } from '@/i18n/locales';

// A language is any code from LANGUAGES ('ar', 'en', 'fr', …). Arabic and
// English are resolved directly by t(); every other language looks the English
// string up in LOCALES and falls back to English when a string isn't translated
// yet. The QURAN TEXT is never touched here — it is always Arabic.
export type Lang = string;

interface I18nCtx {
  lang: Lang;
  languages: LangMeta[];
  setLang: (l: Lang) => void;
  /** Legacy Arabic⇄English toggle (kept for existing call sites). */
  toggle: () => void;
  /** t(english, arabic) → the string for the current language. */
  t: (en: string, ar: string) => string;
}

const isKnown = (l: string) => l === 'ar' || l === 'en' || !!LOCALES[l];

const I18nContext = createContext<I18nCtx>({
  lang: 'ar',
  languages: LANGUAGES,
  setLang: () => {},
  toggle: () => {},
  t: (en) => en,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem('nur-lang');
    return saved && isKnown(saved) ? saved : 'ar';
  });

  useEffect(() => {
    localStorage.setItem('nur-lang', lang);
    document.documentElement.lang = lang;
    // NOTE: we intentionally do NOT flip document.dir here. The app was built
    // LTR-root with Arabic handled per-element, and every seeded UI language is
    // LTR, so the layout stays correct. (RTL UI languages like Urdu/Farsi would
    // need per-call-site dir work and are a separate pass.)
  }, [lang]);

  const value = useMemo<I18nCtx>(() => ({
    lang,
    languages: LANGUAGES,
    setLang: (l) => setLangState(isKnown(l) ? l : 'en'),
    toggle: () => setLangState((p) => (p === 'ar' ? 'en' : 'ar')),
    t: (en, ar) => (lang === 'ar' ? ar : lang === 'en' ? en : (LOCALES[lang]?.[en] ?? en)),
  }), [lang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useI18n() {
  return useContext(I18nContext);
}
