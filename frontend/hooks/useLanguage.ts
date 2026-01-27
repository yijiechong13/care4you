import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { changeLanguage, getCurrentLanguage } from '@/lib/i18n';

export type Language = 'en' | 'zh';

export function useLanguage() {
  const { i18n } = useTranslation();
  const [language, setLanguageState] = useState<Language>(
    (getCurrentLanguage() as Language) || 'en'
  );

  useEffect(() => {
    // Sync state with i18n when language changes
    setLanguageState((i18n.language as Language) || 'en');
  }, [i18n.language]);

  const setLanguage = async (lng: Language) => {
    await changeLanguage(lng);
    setLanguageState(lng);
  };

  const toggleLanguage = async () => {
    const newLang = language === 'en' ? 'zh' : 'en';
    await setLanguage(newLang);
  };

  return {
    language,
    setLanguage,
    toggleLanguage,
    isEnglish: language === 'en',
    isChinese: language === 'zh',
  };
}
