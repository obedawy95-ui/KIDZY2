import React, { createContext, useContext, useEffect, useState } from 'react';
import { Languages } from 'lucide-react';

export type AppLanguage = 'ar' | 'en';

interface LanguageContextValue {
  lang: AppLanguage;
  setLang: (lang: AppLanguage) => void;
  toggleLang: () => void;
  isAr: boolean;
  dir: 'rtl' | 'ltr';
  t: (arText: string, enText: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const STORAGE_KEY = 'kidzy_kpis_lang';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<AppLanguage>(() => {
    try {
      const urlLang = new URLSearchParams(window.location.search).get('lang');
      if (urlLang === 'en' || urlLang === 'ar') return urlLang;
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'en' || stored === 'ar') return stored;
    } catch {
      // ignore storage access issues
    }
    return 'ar';
  });

  const setLang = (next: AppLanguage) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  };

  const toggleLang = () => {
    setLang(lang === 'ar' ? 'en' : 'ar');
  };

  useEffect(() => {
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
  }, [lang]);

  const value: LanguageContextValue = {
    lang,
    setLang,
    toggleLang,
    isAr: lang === 'ar',
    dir: lang === 'ar' ? 'rtl' : 'ltr',
    t: (arText: string, enText: string) => (lang === 'en' ? enText : arText),
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = (): LanguageContextValue => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return ctx;
};

interface LanguageSwitcherProps {
  variant?: 'glass' | 'light' | 'subtle';
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'glass',
  className = '',
}) => {
  const { lang, toggleLang } = useLanguage();

  const variantClasses =
    variant === 'glass'
      ? 'bg-white/15 hover:bg-white/25 text-white border border-white/25'
      : variant === 'light'
      ? 'bg-white hover:bg-[#FEF4E3] text-[#063B44] border border-[#01AFC5]/40 shadow-2xs'
      : 'bg-[#FEF4E3]/80 hover:bg-[#BAEBF1]/45 text-[#063B44] border border-[#BAEBF1]';

  return (
    <button
      type="button"
      onClick={toggleLang}
      aria-label={lang === 'ar' ? 'Switch survey language to English' : 'تغيير اللغة إلى العربية'}
      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#01AFC5] ${variantClasses} ${className}`}
    >
      <Languages className="w-3.5 h-3.5 shrink-0" />
      <span>{lang === 'ar' ? 'English' : 'العربية'}</span>
    </button>
  );
};
