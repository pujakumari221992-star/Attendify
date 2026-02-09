
import { useState, useCallback, useEffect } from 'react';
import { translations } from '../translations';

const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur'];
const DEFAULT_LANGUAGE = 'en';

const getInitialLanguage = (): string => {
    const savedLang = localStorage.getItem('app_language');
    if (savedLang && translations[savedLang]) return savedLang;

    // Check browser's preferred languages
    const browserLangs = navigator.languages || [];
    for (const lang of browserLangs) {
        // 1. Try exact match (e.g. 'hi-IN')
        if (translations[lang]) return lang;
        // 2. Try base match (e.g. 'hi')
        const base = lang.split('-')[0];
        if (translations[base]) return base;
    }

    return DEFAULT_LANGUAGE;
};

export const useTranslationManager = () => {
  const [language, setLanguageState] = useState<string>(() => getInitialLanguage());

  // Update direction and lang attribute when language changes
  useEffect(() => {
    const isRtl = RTL_LANGUAGES.some(l => language.toLowerCase().startsWith(l));
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((langCode: string) => {
    // Only allow setting supported languages, otherwise fallback to default
    const effectiveLang = translations[langCode] ? langCode : DEFAULT_LANGUAGE;
    localStorage.setItem('app_language', effectiveLang);
    setLanguageState(effectiveLang);
  }, []);

  const t = useCallback((key: string, replacements?: Record<string, any>): string => {
    const baseLang = language.split('-')[0];
    
    // Priority: 
    // 1. Exact Language (e.g. 'hi')
    // 2. Base Language (e.g. 'hi' if 'hi-IN' missing)
    // 3. Default Language ('en')
    let template = 
        translations[language]?.[key] ?? 
        translations[baseLang]?.[key] ?? 
        translations[DEFAULT_LANGUAGE]?.[key];

    // If key is missing in all dictionaries, return the key itself as a fallback so it's visible
    if (template === undefined) {
        // console.warn(`Missing translation for key: ${key}`);
        return key;
    }

    // Handle string replacements {key} -> value
    if (typeof template === 'string' && replacements) {
      return Object.entries(replacements).reduce((acc, [placeholder, value]) => {
        return acc.replace(`{${placeholder}}`, String(value ?? ''));
      }, template);
    }
    
    return template;
  }, [language]);

  return { language, setLanguage, t, isTranslating: false };
};
