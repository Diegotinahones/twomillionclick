import React, { useEffect, useState, useRef } from 'react';
import './PaymentMethod.css';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

interface PaymentMethodProps {
  onClose: () => void;
  onSuccess: () => void;
}

const PaymentMethod: React.FC<PaymentMethodProps> = ({ onClose, onSuccess }) => {
  const { token } = useAuth();
  const { t } = useTranslation();

  const [paypalEmail, setPaypalEmail] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
    setTimeout(() => {
      const firstInput = modalRef.current?.querySelector<HTMLInputElement>('input[type="email"]');
      firstInput?.focus();
    }, 100);
  }, []);

  const handleSave = async () => {
    setError(null);
    if (!paypalEmail) {
      setError(t('paymentMethod.missingEmailError'));
      return;
    }

    const body = { paypalEmail };

    try {
      const res = await fetch('/api/winners/setPaymentMethod', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        setError(data.error || t('paymentMethod.internalError'));
      }
    } catch (err: any) {
      console.error('Error al guardar el método de cobro:', err);
      setError(t('paymentMethod.internalError'));
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      } else if (event.key === 'Enter') {
        handleSave();
      } else if (event.key === 'Tab') {
        const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (!focusableElements || focusableElements.length === 0) return;
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
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="payment-method-modal-container"
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-method-title"
    >
      <div className="payment-method-modal-content">
        <button
          type="button"
          className="close-button"
          aria-label={t('paymentMethod.cancel')}
          onClick={onClose}
        >
          ×
        </button>

        <h2 id="payment-method-title" tabIndex={-1}>
          {t('paymentMethod.title')}
        </h2>
        {error && (
          <div className="error-message" role="alert" aria-live="assertive">
            {error}
          </div>
        )}

        <div className="input-field-group">
          <label htmlFor="paypalEmail">{t('paymentMethod.paypalEmailLabel')}</label>
          <input
            type="email"
            id="paypalEmail"
            value={paypalEmail}
            onChange={(e) => setPaypalEmail(e.target.value)}
            placeholder="ejemplo@correo.com"
          />
        </div>

        <div className="actions">
          <button type="button" className="cancel-button" onClick={onClose}>
            {t('paymentMethod.cancel')}
          </button>
          <button type="button" className="save-button" onClick={handleSave}>
            {t('paymentMethod.save')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethod;
