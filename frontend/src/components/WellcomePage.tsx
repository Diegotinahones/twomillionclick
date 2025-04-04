import React, { useState, useEffect, useRef } from 'react';
import './WellcomePage.css';
import { useAuth } from '../context/AuthContext';
import Register from './Register';
import Login from './Login';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

const WelcomePage: React.FC = () => {
  const { continueAsGuest } = useAuth();
  const { t } = useTranslation();

  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  const handleContinue = (): void => {
    continueAsGuest();
  };

  const handleRegisterClick = (): void => {
    setShowRegisterModal(true);
  };

  const handleLoginClick = (): void => {
    setShowLoginModal(true);
  };

  const closeModal = (): void => {
    setShowRegisterModal(false);
    setShowLoginModal(false);
  };

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeModal();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  return (
    <div className="welcome-container">
      {/* Cabecera con título y un LanguageSwitcher accesible incluso para usuarios no logueados */}
      <header className="welcome-header">
        <LanguageSwitcher />
      </header>

      <h1 className="welcome-title" tabIndex={-1} ref={titleRef}>
        {t('welcomePage.title')}{' '}
        <span className="highlight">{t('welcomePage.titleHighlight')}</span>{' '}
        {t('welcomePage.titleClicks')}
      </h1>

      <p className="welcome-text">{t('welcomePage.wantPot')}</p>

      {/*
        Lista de pasos:
        - Usamos una <ul> con bullets en .step-icon,
        - id="steps-description" podría ser la descripción (sr-only)
          si quisieras atarla con aria-describedby en la <ul>.
      */}
      <ul className="steps-list" aria-describedby="steps-description">
        <li>
          <span className="step-icon">•</span> {t('welcomePage.step1')}
        </li>
        <li>
          <span className="step-icon">•</span> {t('welcomePage.step2')}
        </li>
        <li>
          <span className="step-icon">•</span> {t('welcomePage.step3')}
        </li>
      </ul>

      {/*
        Si quieres que 'welcomePage.subtext' sea un texto accesible
        SOLO vinculado a la lista (con aria-describedby),
        puedes usarlo en #steps-description con sr-only,
        de modo que no se muestre duplicado en pantalla.
      */}
      <p id="steps-description" className="sr-only">
        {t('welcomePage.subtext')}
      </p>

      {/*
        Si NO quieres duplicarlo, quita la línea de arriba
        y deja el subtext visible con una sola <p>.
      */}
      <p className="welcome-subtext">{t('welcomePage.subtext')}</p>

      <div className="welcome-buttons">
        <button
          className="continue-button"
          onClick={handleContinue}
          aria-label={t('welcomePage.continue') as string}
        >
          {t('welcomePage.continue')}
        </button>
        <button
          className="register-button"
          onClick={handleRegisterClick}
          aria-label={t('welcomePage.register')}
        >
          {t('welcomePage.register')}
        </button>
        <button
          className="login-button"
          onClick={handleLoginClick}
          aria-label={t('welcomePage.login')}
        >
          {t('welcomePage.login')}
        </button>
      </div>

      {showRegisterModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close-button"
              onClick={closeModal}
              aria-label={t('welcomeButtons.closeOverlay')}
            >
              &times;
            </button>
            <Register closeModal={closeModal} />
          </div>
        </div>
      )}

      {showLoginModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close-button"
              onClick={closeModal}
              aria-label={t('welcomeButtons.closeOverlay')}
            >
              &times;
            </button>
            <Login closeModal={closeModal} />
          </div>
        </div>
      )}
    </div>
  );
};

export default WelcomePage;
