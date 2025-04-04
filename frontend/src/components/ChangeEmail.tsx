import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import './ChangeEmail.css';
import { useTranslation } from 'react-i18next';

interface ChangeEmailProps {
  closeModal: () => void;
}

const ChangeEmail: React.FC<ChangeEmailProps> = ({ closeModal }) => {
  const { token, setEmail } = useAuth();
  const { t } = useTranslation();

  const [newEmail, setNewEmail] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');

  const modalRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
    setTimeout(() => {
      emailInputRef.current?.focus();
    }, 50);
  }, []);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeModal();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [closeModal]);

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

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      setError(t('changeEmail.validEmailError'));
      return;
    }

    try {
      const response = await fetch('/api/user/change-email', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ email: newEmail })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || t('changeEmail.errorMessageGeneric'));
      } else {
        setMessage(t('changeEmail.successMessage'));
        setEmail(newEmail);
        setNewEmail('');
        setTimeout(() => {
          closeModal();
        }, 1000);
      }
    } catch (err) {
      console.error(err);
      setError(t('changeEmail.errorMessageGeneric'));
    }
  };

  return (
    <div
      className="change-email-container"
      ref={modalRef}
      aria-modal="true"
      role="dialog"
      aria-labelledby="change-email-title"
    >
      <h2 id="change-email-title" ref={titleRef} tabIndex={-1}>
        {t('changeEmail.title')}
      </h2>
      <form onSubmit={handleChangeEmail}>
        <label htmlFor="new-email">{t('changeEmail.newEmailLabel')}</label>
        <input
          type="email"
          id="new-email"
          ref={emailInputRef}
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          required
          aria-describedby={error ? 'error-message' : message ? 'success-message' : undefined}
        />

        {error && (
          <div className="error-message" role="alert" aria-live="assertive" id="error-message">
            {error}
          </div>
        )}
        {message && (
          <div className="success-message" role="alert" aria-live="assertive" id="success-message">
            {message}
          </div>
        )}

        <div className="buttons">
          <button type="submit" className="change-email-button">
            {t('changeEmail.updateEmail')}
          </button>
          <button type="button" className="cancel-button" onClick={closeModal}>
            {t('changeEmail.cancel')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChangeEmail;
