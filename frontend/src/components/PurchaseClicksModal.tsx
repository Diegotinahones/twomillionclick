import React, { useEffect, useState, useRef } from 'react';
import './PurchaseClicksModal.css';
import dropin, { Dropin, PaymentMethodPayload } from 'braintree-web-drop-in';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

interface PurchaseOption {
  label: string;  // Clave para i18n (p.ej. 'pack100', 'pack500'…)
  amount: string;
  clicks: number | '∞';
}

interface PurchaseClicksModalProps {
  onClose: () => void;
  onPurchaseSuccess: () => void;
}

// Array de opciones, pero ahora la propiedad "label" es una clave i18n
// que luego pasamos al t('purchaseClicksModal.options.xxx')
const PURCHASE_OPTIONS: PurchaseOption[] = [
  { label: 'pack100', amount: '0.99', clicks: 100 },
  { label: 'pack500', amount: '1.99', clicks: 500 },
  { label: 'pack1000', amount: '4.99', clicks: 1000 },
  { label: 'packInfinite', amount: '9.99', clicks: '∞' }
];

const PurchaseClicksModal: React.FC<PurchaseClicksModalProps> = ({ onClose, onPurchaseSuccess }) => {
  const { token } = useAuth();
  const { t } = useTranslation();

  const [clientToken, setClientToken] = useState<string | null>(null);
  const dropinRef = useRef<Dropin | null>(null);
  const dropinContainerRef = useRef<HTMLDivElement | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<string>(PURCHASE_OPTIONS[0].amount);
  const [error, setError] = useState<string | null>(null);
  const [dropinReady, setDropinReady] = useState<boolean>(false);
  const [savedNonce, setSavedNonce] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    // Para accesibilidad: enfocar título al abrir
    titleRef.current?.focus();
    setTimeout(() => {
      const firstRadio = modalRef.current?.querySelector<HTMLInputElement>('input[type="radio"]');
      firstRadio?.focus();
    }, 100);
  }, []);

  useEffect(() => {
    // Obtenemos el clientToken desde el backend
    const fetchToken = async () => {
      try {
        const res = await fetch('/api/payments/token', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const data = await res.json();
        if (res.ok && data.clientToken) {
          setClientToken(data.clientToken);
        } else {
          setError(data.error || t('purchaseClicksModal.errorMessageGeneric'));
        }
      } catch (err: any) {
        console.error('Error al obtener el token:', err);
        setError(t('purchaseClicksModal.errorMessageGeneric'));
      }
    };
    fetchToken();
  }, [token, t]);

  useEffect(() => {
    async function createDropin() {
      if (clientToken && dropinContainerRef.current) {
        try {
          const instance = await dropin.create({
            authorization: clientToken,
            container: dropinContainerRef.current,
            paypal: {
              flow: 'checkout',
              amount: parseFloat(selectedAmount),
              currency: 'EUR'
            }
          });
          dropinRef.current = instance;
          setDropinReady(true);
        } catch (err) {
          console.error('Error creando drop-in:', err);
          setError(t('purchaseClicksModal.errorMessageGeneric'));
        }
      }
    }

    createDropin();

    // Al desmontar, hacemos teardown
    return () => {
      if (dropinRef.current) {
        dropinRef.current.teardown().catch((err) => console.error(err));
        dropinRef.current = null;
        setDropinReady(false);
      }
    };
  }, [clientToken, selectedAmount, t]);

  const handlePurchase = async () => {
    if (!dropinRef.current) return;

    try {
      let nonce = savedNonce;
      if (!nonce) {
        const paymentMethodPayload: PaymentMethodPayload = await dropinRef.current.requestPaymentMethod();
        nonce = paymentMethodPayload.nonce;
        if (paymentMethodPayload.type === 'PayPalAccount') {
          setSavedNonce(nonce);
        }
      }
      if (!nonce) {
        setError(t('purchaseClicksModal.errorMessageGeneric'));
        return;
      }

      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ paymentMethodNonce: nonce, amount: selectedAmount })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        alert(`Compra realizada con éxito. Transaction ID: ${data.transactionId}`);
        onPurchaseSuccess();
        onClose();
      } else {
        setError(data.error || t('purchaseClicksModal.errorMessageGeneric'));
      }
    } catch (err: any) {
      console.error('Error en la transacción:', err);
      setError(t('purchaseClicksModal.errorMessageGeneric'));
    }
  };

  useEffect(() => {
    // Cerrar con Esc, comprar con Enter, manejo de tabulación
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      } else if (event.key === 'Enter') {
        if (dropinReady) {
          handlePurchase();
        }
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
  }, [onClose, dropinReady, t]);

  return (
    <div
      className="purchase-modal-container"
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="purchase-title"
    >
      <div className="purchase-modal-content">
        <h2 id="purchase-title" tabIndex={-1} ref={titleRef}>
          {t('purchaseClicksModal.title')}
        </h2>
        {error && (
          <div className="error-message" role="alert" aria-live="assertive">
            {error}
          </div>
        )}

        <p className="purchase-info">{t('purchaseClicksModal.info')}</p>

        <fieldset className="purchase-options">
          <legend>{t('purchaseClicksModal.optionsLegend')}</legend>
          {PURCHASE_OPTIONS.map((option) => (
            <div key={option.amount} className="purchase-option">
              <label>
                <input
                  type="radio"
                  name="purchaseAmount"
                  value={option.amount}
                  checked={selectedAmount === option.amount}
                  onChange={() => {
                    setSelectedAmount(option.amount);
                    setSavedNonce(null);
                  }}
                />
                {/*
                  Aquí usamos la clave "purchaseClicksModal.options.[packXXX]"
                  y pasamos "clicks" y "amount"
                */}
                {t(`purchaseClicksModal.options.${option.label}`, {
                  clicks: option.clicks,
                  amount: option.amount
                })}
              </label>
            </div>
          ))}
        </fieldset>

        <div className="dropin-container" ref={dropinContainerRef}></div>

        <div className="actions">
          <button type="button" className="cancel-button" onClick={onClose}>
            {t('purchaseClicksModal.cancel')}
          </button>
          <button
            type="button"
            className="confirm-button"
            onClick={handlePurchase}
            disabled={!dropinReady}
          >
            {t('purchaseClicksModal.confirmPayment')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PurchaseClicksModal;
