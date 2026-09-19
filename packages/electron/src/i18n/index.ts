import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import jaCommon from './locales/ja/common.json';

i18n
  .use(initReactI18next)
  .init({
    lng: 'ja',
    fallbackLng: 'en',
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
    resources: {
      ja: {
        common: jaCommon,
      },
      en: {
        common: {},
      },
    },
  });

export default i18n;
