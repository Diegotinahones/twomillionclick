import React, { useState, useRef, useEffect } from 'react';
import './Register.css';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface RegisterProps {
  closeModal: () => void;
}

const Register: React.FC<RegisterProps> = ({ closeModal }) => {
  const { setToken, setMessage, setIsGuest } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [formValues, setFormValues] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const usernameInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [focusableElements, setFocusableElements] = useState<HTMLElement[]>([]);

  useEffect(() => {
    usernameInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (modalRef.current) {
      const elements = modalRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      setFocusableElements(Array.from(elements));
    }
  }, [modalRef]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!focusableElements.length) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        handleCloseModal();
      }
      if (event.key === 'Tab') {
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

    const modalNode = modalRef.current;
    if (modalNode) {
      modalNode.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      if (modalNode) {
        modalNode.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [focusableElements]);

  const handleCloseModal = () => {
    setFormValues({ username: '', email: '', password: '', confirmPassword: '' });
    setShowPassword(false);
    setShowConfirmPassword(false);
    setErrorMessage('');
    closeModal();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validateForm = () => {
    if (
      !formValues.username ||
      !formValues.email ||
      !formValues.password ||
      !formValues.confirmPassword
    ) {
      setErrorMessage(t('register.allRequired'));
      return false;
    }
    if (formValues.password !== formValues.confirmPassword) {
      setErrorMessage(t('register.passwordsDontMatch'));
      return false;
    }
    if (formValues.password.length < 6) {
      setErrorMessage(t('register.passwordHelp'));
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formValues.email)) {
      setErrorMessage(t('register.validEmailError'));
      return false;
    }
    if (formValues.username.length < 3) {
      setErrorMessage(t('register.usernameMinLength'));
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const response = await fetch('/api/user/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          username: formValues.username,
          email: formValues.email,
          password: formValues.password
        })
      });

      const contentType = response.headers.get('content-type') || '';
      let data: any = {};
      if (contentType.includes('application/json')) {
        data = await response.json();
      }

      if (!response.ok) {
        setErrorMessage(data.message || t('register.errorGeneric'));
        return;
      }

      setToken(data.token);
      setIsGuest(false);
      setMessage(t('register.title')); // o "Registro exitoso."
      handleCloseModal();
      navigate('/game');
    } catch (error) {
      console.error('Error al registrar el usuario:', error);
      setErrorMessage(t('register.errorGeneric'));
    }
  };

  return (
    <div
      className="modal-container"
      role="dialog"
      aria-modal="true"
      aria-labelledby="register-title"
      aria-describedby="register-description"
      ref={modalRef}
    >
      <form className="modal-form" onSubmit={handleSubmit}>
        <h2 id="register-title">{t('register.title')}</h2>
        <p id="register-description" className="sr-only">
          {t('register.description')}
        </p>

        {errorMessage && (
          <div role="alert" className="error-message">
            {errorMessage}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="username">{t('register.usernameLabel')}</label>
          <input
            type="text"
            id="username"
            name="username"
            ref={usernameInputRef}
            value={formValues.username}
            onChange={handleChange}
            required
            autoComplete="username"
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">{t('register.emailLabel')}</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formValues.email}
            onChange={handleChange}
            required
            autoComplete="email"
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">{t('register.passwordLabel')}</label>
          <div className="password-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={formValues.password}
              onChange={handleChange}
              required
              aria-describedby="passwordHelp"
              autoComplete="new-password"
            />
            <p id="passwordHelp" className="sr-only">
              {t('register.passwordHelp')}
            </p>
            <button
              type="button"
              className="toggle-password-button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? t('changePassword.togglePasswordHide') : t('changePassword.togglePasswordShow')}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">{t('register.confirmPasswordLabel')}</label>
          <div className="password-wrapper">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              name="confirmPassword"
              value={formValues.confirmPassword}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />
            <button
              type="button"
              className="toggle-password-button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showConfirmPassword ? t('changePassword.togglePasswordHide') : t('changePassword.togglePasswordShow')}
            </button>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="cancel-button" onClick={handleCloseModal}>
            {t('register.cancel')}
          </button>
          <button type="submit" className="submit-button">
            {t('register.submit')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Register;
