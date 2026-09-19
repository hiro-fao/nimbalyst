import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import jaCommon from './locales/ja/common.json';

i18n
  .use(initReactI18next)
  .init({
    lng: 'en', // Default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    resources: {
      ja: {
        common: jaCommon,
      },
      en: {
        common: {
          // Default English translations will be added here or in a separate file
        },
      },
    },
  });

export default i18n;
