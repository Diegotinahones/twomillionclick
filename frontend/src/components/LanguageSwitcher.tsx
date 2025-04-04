// src/components/LanguageSwitcher.tsx
import React from 'react';
import i18n from '../i18n/i18n';
import './LanguageSwitcher.css';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

interface Language {
  code: string;
  name: string;
  flag: string;
}

const LANGUAGES: Language[] = [
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' }
];

const LanguageSwitcher: React.FC = () => {
  const { token } = useAuth();
  const { t } = useTranslation();

  const handleLanguageChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedLang = event.target.value;
    // Cambiamos el idioma en i18n
    i18n.changeLanguage(selectedLang);

    // Si el usuario está logueado, guardamos la preferencia en el servidor
    if (token) {
      try {
        const res = await fetch('/api/user/change-language', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ language: selectedLang })
        });

        if (!res.ok) {
          const data = await res.json();
          console.error('Error al guardar idioma:', data.message || 'Error desconocido');
        }
      } catch (err) {
        console.error('Error al conectar con el servidor:', err);
      }
    }
    // Si el usuario NO está logueado, i18n se encargará de guardar en localStorage,
    // gracias a i18n.on('languageChanged', ...) en i18n.ts
  };

  return (
    <div className="language-switcher">
      <label htmlFor="language-select" className="language-label">
        {t('languageSwitcher.label')}
      </label>

      <select
        id="language-select"
        className="language-select"
        value={i18n.language || 'es'}
        onChange={handleLanguageChange}
      >
        {/*
         Si deseas un option "placeholder" no seleccionable:
         <option value="" disabled hidden>
           {t('languageSwitcher.selectPlaceholder')}
         </option>
        */}
        {LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSwitcher;
