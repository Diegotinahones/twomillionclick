import React, { useState, useRef, useEffect } from 'react';
import './Login.css';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n/i18n'; // Asegúrate de apuntar al archivo i18n correcto

interface LoginProps {
  closeModal: () => void;
}

const Login: React.FC<LoginProps> = ({ closeModal }) => {
  const { setToken, setMessage, setIsGuest } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const modalRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const usernameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
    setTimeout(() => {
      usernameInputRef.current?.focus();
    }, 50);
  }, []);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        handleCloseModal();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  useEffect(() => {
    const handleTab = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (!focusableElements || focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };
    window.addEventListener('keydown', handleTab);
    return () => window.removeEventListener('keydown', handleTab);
  }, []);

  const handleCloseModal = () => {
    setEmailOrUsername('');
    setPassword('');
    setErrorMessage('');
    closeModal();
  };

  const validateForm = () => {
    if (!emailOrUsername || !password) {
      setErrorMessage(t('login.allRequired'));
      return false;
    }
    return true;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) return;

    try {
      const response = await fetch('/api/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ emailOrUsername, password })
      });

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        setErrorMessage(t('login.errorGeneric'));
        return;
      }

      const data = await response.json();

      if (response.ok) {
        // Si el backend envía preferredLanguage, lo forzamos en i18n
        if (data.preferredLanguage) {
          i18n.changeLanguage(data.preferredLanguage);
        }

        setToken(data.token);
        setIsGuest(false);
        setMessage(t('login.title')); // O algún mensaje de éxito, ej: t('login.success')
        handleCloseModal();
        navigate('/game');
      } else {
        setErrorMessage(data.message || t('login.invalidCredentials'));
      }
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      setErrorMessage(t('login.errorGeneric'));
    }
  };

  return (
    <div
      className="modal-container"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-title"
      aria-describedby="login-description"
      ref={modalRef}
    >
      <form className="modal-form" onSubmit={handleSubmit}>
        <h2 id="login-title" tabIndex={-1} ref={titleRef}>
          {t('login.title')}
        </h2>
        <p id="login-description" className="sr-only">
          {t('login.description')}
        </p>
        {errorMessage && (
          <div role="alert" className="error-message" aria-live="assertive">
            {errorMessage}
          </div>
        )}
        <div className="form-group">
          <label htmlFor="username">{t('login.emailOrUsername')}</label>
          <input
            type="text"
            id="username"
            name="username"
            ref={usernameInputRef}
            value={emailOrUsername}
            onChange={(e) => setEmailOrUsername(e.target.value)}
            required
            autoComplete="username"
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">{t('login.password')}</label>
          <input
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>
        <div className="form-actions">
          <button type="button" className="cancel-button" onClick={handleCloseModal}>
            {t('login.cancel')}
          </button>
          <button type="submit" className="submit-button">
            {t('login.submit')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Login;
