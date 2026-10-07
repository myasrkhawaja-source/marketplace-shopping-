/**
 * src/context/LanguageContext.jsx
 * ---------------------------------------------------------
 * Simple i18n state for the storefront: Arabic + Hebrew.
 */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { translations } from '../i18n/translations';

const DEFAULT_LANGUAGE = 'ar';
const STORAGE_KEY = 'bm_lang';

export const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved && translations[saved] ? saved : DEFAULT_LANGUAGE;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  const t = useMemo(() => translations[lang], [lang]);

  const value = useMemo(() => ({
    lang,
    setLang,
    t,
    isArabic: lang === 'ar',
    isHebrew: lang === 'he',
  }), [lang, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
