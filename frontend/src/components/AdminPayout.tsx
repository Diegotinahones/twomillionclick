import React, { useEffect, useRef } from 'react';
import './AdminPayout.css';
import { useTranslation } from 'react-i18next';

interface AdminPayoutProps {
  onClose: () => void;
  onEditMethod: () => void;
  onConfirm: () => void;
  paypalEmail: string | null;
  adminBalance: number;
}

const AdminPayout: React.FC<AdminPayoutProps> = ({
  onClose,
  onEditMethod,
  onConfirm,
  paypalEmail,
  adminBalance
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
      className="admin-payout-modal-container"
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-payout-title"
    >
      <div className="admin-payout-modal-content">
        <button
          type="button"
          className="close-button"
          aria-label={t('adminPayout.cancel')}
          onClick={onClose}
        >
          ×
        </button>
        <h2 id="admin-payout-title" tabIndex={-1}>
          {t('adminPayout.title')}
        </h2>
        <p>
          {t('adminPayout.transferInfo', {
            balance: adminBalance.toFixed(2),
            email: paypalEmail || t('adminPayout.notConfigured')
          })}
        </p>
        <div className="actions">
          <button type="button" className="edit-button" onClick={onEditMethod}>
            {t('adminPayout.editMethod')}
          </button>
          <button type="button" className="cancel-button" onClick={onClose}>
            {t('adminPayout.cancel')}
          </button>
          <button type="button" className="confirm-button" onClick={onConfirm}>
            {t('adminPayout.confirmCharge')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPayout;
