import React, { createContext, useState, useContext, useMemo, useEffect } from 'react';
import { useTranslationManager } from './useTranslations';

type Theme = 'light' | 'dark';

interface AppContextType {
  language: string;
  setLanguage: (langCode: string) => void;
  t: (key: string, replacements?: Record<string, any>) => string;
  isTranslating: null;
  theme: Theme;
  toggleTheme: () => void;
  locale: string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const translationManager = useTranslationManager();

  const [theme, setTheme] = useState<Theme>(() => {
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const value = useMemo(() => {
    const { language } = translationManager;
    // Specific locale mapping for date/time formatting consistency
    const localeMap: Record<string, string> = {
      hi: 'hi-IN',
      de: 'de-DE',
    };
    const locale = localeMap[language] || language;
    
    return {
      ...translationManager,
      locale,
      theme,
      toggleTheme,
    }
  }, [translationManager, theme]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};