import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ChangeEmail from './ChangeEmail';
import ChangePassword from './ChangePassword';
import ChangeUsername from './ChangeUsername';
import DeleteAccount from './DeleteAccount';
import PaymentMethod from './PaymentMethod';
import AdminPayout from './AdminPayout';
import './ProfilePage.css';
import { useTranslation } from 'react-i18next';

const ProfilePage: React.FC = () => {
  const { username, email, token, role, adminBalance, paypalEmail } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [showChangeEmail, setShowChangeEmail] = useState<boolean>(false);
  const [showChangePassword, setShowChangePassword] = useState<boolean>(false);
  const [showChangeUsername, setShowChangeUsername] = useState<boolean>(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
  const [showAdminCollectModal, setShowAdminCollectModal] = useState<boolean>(false);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState<boolean>(false);

  const [error, setError] = useState<string | null>(null);

  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!token) {
      navigate('/');
    }
  }, [token, navigate]);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  const handleBack = () => {
    navigate('/game');
  };

  const highlightEmailSymbols = (emailStr: string) => {
    const parts = emailStr.split(/([@.])/g);
    return parts.map((part, index) =>
      part === '@' || part === '.' ? (
        <span key={index} className="email-symbol">
          {part}
        </span>
      ) : (
        <span key={index}>{part}</span>
      )
    );
  };

  const openChangeEmail = () => setShowChangeEmail(true);
  const closeChangeEmail = () => setShowChangeEmail(false);
  const openChangePassword = () => setShowChangePassword(true);
  const closeChangePassword = () => setShowChangePassword(false);
  const openChangeUsername = () => setShowChangeUsername(true);
  const closeChangeUsername = () => setShowChangeUsername(false);
  const openConfirmDeleteAccount = () => setShowConfirmDialog(true);
  const cancelDeleteAccount = () => setShowConfirmDialog(false);

  const openAdminCollectModal = () => setShowAdminCollectModal(true);

  const fetchProfile = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/user/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      await res.json();
      // Si necesitas actualizar adminBalance o paypalEmail en el estado de AuthContext, hazlo aquí
    } catch (error) {
      console.error('Error al obtener perfil tras el cobro del admin:', error);
    }
  };

  const handleAdminCollect = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/collect', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (res.ok) {
        alert(`Cobro del bote de administrador realizado con éxito. Transaction ID: ${data.transactionId}`);
        await fetchProfile();
      } else {
        setError(data.error || 'No se pudo realizar el cobro del bote de administrador.');
      }
    } catch (err) {
      console.error('Error al cobrar bote de administrador:', err);
      setError('Error interno al cobrar el bote de administrador.');
    } finally {
      setShowAdminCollectModal(false);
    }
  };

  if (token && (username === null || email === null)) {
    return (
      <div className="profile-container">
        <button type="button" className="back-button" onClick={handleBack}>
          {t('profilePage.back')}
        </button>
        <h1 tabIndex={-1} ref={titleRef}>
          {t('profilePage.loading')}
        </h1>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <button
        type="button"
        className="back-button"
        onClick={handleBack}
        aria-label={t('profilePage.back') as string}
      >
        {t('profilePage.back')}
      </button>
      <h1 ref={titleRef} tabIndex={-1}>
        {username || t('profilePage.unknownUser')}
        {role === 'superuser' && (
          <span className="superuser-label">
            {t('profilePage.superuserLabel')}
          </span>
        )}
        {role === 'admin' && (
          <span className="superuser-label">
            {t('profilePage.adminLabel')}
          </span>
        )}
      </h1>
      <div className="profile-info">
        <p>
          <strong>{t('profilePage.emailLabel')}</strong>{' '}
          {email
            ? highlightEmailSymbols(email)
            : t('profilePage.noEmail')}
        </p>
        <div className="profile-buttons">
          {role === 'admin' && (
            <button
              type="button"
              className="profile-button"
              onClick={() => navigate('/admin/roles')}
            >
              {t('profilePage.adminRoles')}
            </button>
          )}
          <button
            type="button"
            className="profile-button"
            onClick={openChangeEmail}
          >
            {t('profilePage.changeEmail')}
          </button>
          <button
            type="button"
            className="profile-button"
            onClick={openChangePassword}
          >
            {t('profilePage.changePassword')}
          </button>
          <button
            type="button"
            className="profile-button"
            onClick={openChangeUsername}
          >
            {t('profilePage.changeUsername')}
          </button>
          <button
            type="button"
            className="profile-button delete-account-button"
            onClick={openConfirmDeleteAccount}
          >
            {t('profilePage.deleteAccount')}
          </button>
        </div>

        {role === 'admin' && (
          <div className="admin-balance-section">
            <p>
              {t('profilePage.adminPot', {
                amount: adminBalance?.toFixed(2)
              })}
            </p>
            <button
              type="button"
              className="profile-button"
              onClick={openAdminCollectModal}
            >
              {t('profilePage.adminCollect')}
            </button>
          </div>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {showChangeEmail && (
        <div className="modal-overlay" onClick={closeChangeEmail}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="change-email-title"
          >
            <ChangeEmail closeModal={closeChangeEmail} />
          </div>
        </div>
      )}

      {showChangePassword && (
        <div className="modal-overlay" onClick={closeChangePassword}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="change-password-title"
          >
            <ChangePassword closeModal={closeChangePassword} />
          </div>
        </div>
      )}

      {showChangeUsername && (
        <div className="modal-overlay" onClick={closeChangeUsername}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="change-username-title"
          >
            <ChangeUsername closeModal={closeChangeUsername} />
          </div>
        </div>
      )}

      {showConfirmDialog && (
        <DeleteAccount
          title={t('deleteAccount.confirmTitle')}
          message={t('deleteAccount.confirmMessage')}
          onCancel={cancelDeleteAccount}
        />
      )}

      {showAdminCollectModal && (
        <AdminPayout
          onClose={() => setShowAdminCollectModal(false)}
          onEditMethod={() => {
            setShowAdminCollectModal(false);
            setShowPaymentMethodModal(true);
          }}
          onConfirm={handleAdminCollect}
          paypalEmail={paypalEmail || null}
          adminBalance={adminBalance || 0}
        />
      )}

      {showPaymentMethodModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowPaymentMethodModal(false)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-method-title"
          >
            <PaymentMethod
              onClose={() => setShowPaymentMethodModal(false)}
              onSuccess={async () => {
                setShowPaymentMethodModal(false);
                await fetchProfile();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
