import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import './ChangeUsername.css';
import { useTranslation } from 'react-i18next';

interface ChangeUsernameProps {
  closeModal: () => void;
}

const ChangeUsername: React.FC<ChangeUsernameProps> = ({ closeModal }) => {
  const { token, setUsername } = useAuth();
  const { t } = useTranslation();

  const [newUsername, setNewUsername] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');

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
        closeModal();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
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

  const handleChangeUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    const usernameRegex = /^[a-zA-Z0-9_]{3,}$/;
    if (!usernameRegex.test(newUsername)) {
      setError(t('changeUsername.usernameRequirements'));
      return;
    }

    try {
      const response = await fetch('/api/user/change-username', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ username: newUsername })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || t('changeUsername.errorMessageGeneric'));
      } else {
        setMessage(t('changeUsername.successMessage'));
        setUsername(newUsername);
        setNewUsername('');
        setTimeout(() => {
          closeModal();
        }, 1000);
      }
    } catch (err) {
      console.error(err);
      setError(t('changeUsername.errorMessageGeneric'));
    }
  };

  return (
    <div
      className="change-username-container"
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="change-username-title"
    >
      <h2 id="change-username-title" tabIndex={-1}>
        {t('changeUsername.title')}
      </h2>
      <form onSubmit={handleChangeUsername}>
        <label htmlFor="new-username">
          {t('changeUsername.newUsernameLabel')}
        </label>
        <input
          type="text"
          id="new-username"
          ref={usernameInputRef}
          value={newUsername}
          onChange={(e) => setNewUsername(e.target.value)}
          required
          aria-describedby={
            error ? 'error-message' : message ? 'success-message' : undefined
          }
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
          <button type="button" className="cancel-button" onClick={closeModal}>
            {t('changeUsername.cancel')}
          </button>
          <button type="submit" className="change-username-button">
            {t('changeUsername.updateUsername')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChangeUsername;
