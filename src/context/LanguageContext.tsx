import React, { createContext, useContext, useEffect, useState } from 'react';
import { SupportedLanguage, translate } from '../i18n/translations';
import { useAuth } from './AuthContext';

interface LanguageContextValue {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { user, apiFetch } = useAuth();
  const [language, setLanguageState] = useState<SupportedLanguage>('en');

  useEffect(() => {
    if (
      user?.preferredLanguage === 'en' ||
      user?.preferredLanguage === 'hi' ||
      user?.preferredLanguage === 'mr'
    ) {
      setLanguageState(user.preferredLanguage);
    }
  }, [user?.preferredLanguage]);

  const setLanguage = async (lang: SupportedLanguage) => {
    setLanguageState(lang);
    if (user) {
      try {
        await apiFetch('/api/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ preferredLanguage: lang }),
        });
      } catch (err) {
        console.error('Failed to persist language preference:', err);
      }
    }
  };

  const t = (key: string) => translate(language, key);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider');
  return ctx;
}
