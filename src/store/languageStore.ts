import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { translations, type Language, type Translations } from '@/i18n/translations';

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
}

function applyDocumentLanguage(lang: Language) {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    if (lang === 'ar') {
      document.documentElement.classList.add('rtl-lang');
    } else {
      document.documentElement.classList.remove('rtl-lang');
    }
  }
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: 'fr',

      setLanguage: (language: Language) => {
        applyDocumentLanguage(language);
        set({ language });
      },

      toggleLanguage: () => {
        const nextLang: Language = get().language === 'fr' ? 'ar' : 'fr';
        applyDocumentLanguage(nextLang);
        set({ language: nextLang });
      },
    }),
    {
      name: 'zaxi_language',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state?.language) {
          applyDocumentLanguage(state.language);
        }
      },
    },
  ),
);

// Helper hook
export function useTranslation() {
  const language = useLanguageStore((s) => s.language);
  const setLanguage = useLanguageStore((s) => s.setLanguage);
  const toggleLanguage = useLanguageStore((s) => s.toggleLanguage);
  const t: Translations = translations[language] || translations.fr;

  return {
    t,
    language,
    setLanguage,
    toggleLanguage,
    isRTL: language === 'ar',
    dir: language === 'ar' ? ('rtl' as const) : ('ltr' as const),
  };
}
