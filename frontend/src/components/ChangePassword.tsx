import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import './ChangePassword.css';
import { useTranslation } from 'react-i18next';

interface ChangePasswordProps {
  closeModal: () => void;
}

const ChangePassword: React.FC<ChangePasswordProps> = ({ closeModal }) => {
  const { token } = useAuth();
  const { t } = useTranslation();

  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmNewPassword, setConfirmNewPassword] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');

  const [showCurrentPassword, setShowCurrentPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState<boolean>(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const currentPasswordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
    setTimeout(() => {
      currentPasswordRef.current?.focus();
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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (newPassword !== confirmNewPassword) {
      setError(t('changePassword.passwordsDontMatch') as string);
      return;
    }

    if (newPassword.length < 6) {
      setError(t('changePassword.passwordMinLength') as string);
      return;
    }

    try {
      const response = await fetch('/api/user/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || t('changePassword.errorMessageGeneric'));
      } else {
        setMessage(t('changePassword.successMessage'));
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setTimeout(() => {
          closeModal();
        }, 1000);
      }
    } catch (err) {
      console.error(err);
      setError(t('changePassword.errorMessageGeneric'));
    }
  };

  return (
    <div
      className="change-password-container"
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="change-password-title"
    >
      <h2 id="change-password-title" tabIndex={-1}>
        {t('changePassword.title')}
      </h2>
      <form onSubmit={handleChangePassword}>
        <div className="form-group">
          <label htmlFor="current-password">
            {t('changePassword.currentPasswordLabel')}
          </label>
          <div className="password-input-wrapper">
            <input
              type={showCurrentPassword ? 'text' : 'password'}
              id="current-password"
              ref={currentPasswordRef}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              aria-describedby={error ? 'error-message' : message ? 'success-message' : undefined}
            />
            <button
              type="button"
              className="toggle-password-button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              aria-label={
                showCurrentPassword
                  ? t('changePassword.togglePasswordHide')
                  : t('changePassword.togglePasswordShow')
              }
            >
              {showCurrentPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="new-password">{t('changePassword.newPasswordLabel')}</label>
          <div className="password-input-wrapper">
            <input
              type={showNewPassword ? 'text' : 'password'}
              id="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="toggle-password-button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              aria-label={
                showNewPassword
                  ? t('changePassword.togglePasswordHide')
                  : t('changePassword.togglePasswordShow')
              }
            >
              {showNewPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="confirm-new-password">
            {t('changePassword.confirmNewPasswordLabel')}
          </label>
          <div className="password-input-wrapper">
            <input
              type={showConfirmNewPassword ? 'text' : 'password'}
              id="confirm-new-password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="toggle-password-button"
              onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
              aria-label={
                showConfirmNewPassword
                  ? t('changePassword.togglePasswordHide')
                  : t('changePassword.togglePasswordShow')
              }
            >
              {showConfirmNewPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

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
            {t('changePassword.cancel')}
          </button>
          <button type="submit" className="change-password-button">
            {t('changePassword.updatePassword')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChangePassword;
