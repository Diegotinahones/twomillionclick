import React, { useEffect, useRef } from 'react';
import './ConfirmPayment.css';
import { useTranslation } from 'react-i18next';

interface ConfirmPaymentProps {
  onClose: () => void;
  onEditMethod: () => void;
  onConfirm: () => void;
  paypalEmail: string | null;
  amount: number;
}

const ConfirmPayment: React.FC<ConfirmPaymentProps> = ({
  onClose,
  onEditMethod,
  onConfirm,
  paypalEmail,
  amount
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    titleRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="confirm-payment-modal-container"
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-payment-title"
    >
      <div className="confirm-payment-modal-content">
        <button
          type="button"
          className="close-button"
          aria-label={t('confirmPayment.cancel')}
          onClick={onClose}
        >
          ×
        </button>
        <h2 id="confirm-payment-title" tabIndex={-1}>
          {t('confirmPayment.title')}
        </h2>
        <p>
          {t('confirmPayment.transferInfo', {
            amount: amount.toFixed(2),
            email: paypalEmail || t('confirmPayment.notConfigured')
          })}
        </p>
        <div className="actions">
          <button type="button" className="edit-button" onClick={onEditMethod}>
            {t('confirmPayment.editMethod')}
          </button>
          <button type="button" className="cancel-button" onClick={onClose}>
            {t('confirmPayment.cancel')}
          </button>
          <button type="button" className="confirm-button" onClick={onConfirm}>
            {t('confirmPayment.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmPayment;
