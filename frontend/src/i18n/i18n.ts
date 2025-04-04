// src/i18n/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
// import LanguageDetector from 'i18next-browser-languagedetector';

import es from './es.json';
import en from './en.json';
import fr from './fr.json';
import de from './de.json';
import it from './it.json';
import pt from './pt.json';

// Leemos el idioma que el usuario seleccionó en localStorage (en caso de usuario invitado o si la app no recibió datos del backend)
const savedLang = localStorage.getItem('language') || 'es';

i18n
  // .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      es: { translation: es },
      en: { translation: en },
      fr: { translation: fr },
      de: { translation: de },
      it: { translation: it },
      pt: { translation: pt },
    },
    lng: savedLang,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

// Suscribimos el cambio de idioma: si i18n cambia, guardamos en localStorage
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('language', lng);
});

export default i18n;
