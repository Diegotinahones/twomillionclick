import React, { useEffect, useRef } from 'react';
import './DeleteAccount.css';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface DeleteAccountProps {
  title: string;
  message: string;
  onCancel: () => void;
}

const DeleteAccount: React.FC<DeleteAccountProps> = ({ title, message, onCancel }) => {
  const { token, setToken, setIsGuest, setEmail, setUsername } = useAuth();
  const navigate = useNavigate();
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const { t } = useTranslation();
  
  useEffect(() => {
    titleRef.current?.focus();
    setTimeout(()=>{
      confirmButtonRef.current?.focus();
    },50);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
      }
      if (event.key === 'Tab') {
        const focusableElements = dialogRef.current?.querySelectorAll<HTMLElement>('button');
        if (focusableElements && focusableElements.length > 0) {
          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          if (event.shiftKey) {
            if (document.activeElement === firstElement) {
              event.preventDefault();
              lastElement.focus();
            }
          } else {
            if (document.activeElement === lastElement) {
              event.preventDefault();
              firstElement.focus();
            }
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [onCancel]);

  const handleConfirm = async () => {
    try {
      const response = await fetch('/api/user/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.msg || t('deleteAccount.errorGeneric'));
      } else {
        setToken('');
        setEmail('');
        setUsername('');
        setIsGuest(true);
        navigate('/');
      }
    } catch (err) {
      console.error('Error al eliminar la cuenta:', err);
      alert(t('deleteAccount.serverError'));
    }
  };

  return (
    <div
      className="confirm-dialog-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
    >
      <div className="confirm-dialog-container" ref={dialogRef}>
        <h2 id="confirm-dialog-title" tabIndex={-1}>
          {title /* o t('deleteAccount.confirmTitle') si quieres */}
        </h2>
        <p id="confirm-dialog-message">
          {message /* o t('deleteAccount.confirmMessage') */}
        </p>
        <div className="confirm-dialog-buttons">
          <button
            ref={confirmButtonRef}
            className="confirm-button"
            onClick={handleConfirm}
          >
            {t('deleteAccount.confirm')}
          </button>
          <button
            className="cancel-button"
            onClick={onCancel}
          >
            {t('deleteAccount.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteAccount;
