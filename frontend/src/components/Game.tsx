import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import './Game.css';
import Register from './Register';
import Login from './Login';
import { io, Socket } from 'socket.io-client';
import { Link, useNavigate } from 'react-router-dom';
import PurchaseClicksModal from './PurchaseClicksModal';
import PaymentMethod from './PaymentMethod';
import ConfirmPayment from './ConfirmPayment';
import LanguageSwitcher from './LanguageSwitcher';
import { useTranslation } from 'react-i18next';

interface GameState {
  globalClicks: number;
  pot: number;
  lastWinner: string | null;
  lastClickUser: string | null;
}

interface Flash {
  id: number;
  x: number;
  y: number;
}

// Configuración del socket
const socket: Socket = io({ transports: ['websocket'] });

// Milestones de ejemplo
const MILESTONES = [10, 50, 100];
const MAX_CLICKS = 1000000;

const Game: React.FC = () => {
  const { token, isGuest, handleLogout, username, continueAsGuest, setToken, role } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [gameState, setGameState] = useState<GameState>({
    globalClicks: 0,
    pot: 0,
    lastWinner: null,
    lastClickUser: null
  });

  const [freeClicks, setFreeClicks] = useState<number>(0);
  const [hasInfiniteClicks, setHasInfiniteClicks] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [potEarned, setPotEarned] = useState<number>(0);
  const [paypalEmail, setPaypalEmail] = useState<string | null>(null);

  const [showRegisterModal, setShowRegisterModal] = useState<boolean>(false);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState<boolean>(false);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState<boolean>(false);
  const [showConfirmPaymentModal, setShowConfirmPaymentModal] = useState<boolean>(false);

  const [connectedUsers, setConnectedUsers] = useState<number>(0);

  const radius = 50;
  const circumference = 2 * Math.PI * radius;

  const centralRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLDivElement>(null);
  const buttonContainerRef = useRef<HTMLDivElement>(null);

  const [flashes, setFlashes] = useState<Flash[]>([]);
  const flashIdRef = useRef<number>(0);

  function getNextMilestone(current: number): number | null {
    return MILESTONES.find((m) => m > current) ?? null;
  }

  function getMilestoneRewardLabel(milestone: number): string {
    switch (milestone) {
      case 10:
        return '+100 clics gratis';
      case 50:
        return '+500 clics gratis';
      case 100:
        return '¡Ganas el Bote!';
      default:
        return '';
    }
  }

  function getMilestoneProgress(current: number, next: number | null): number {
    if (!next) return 1;
    return Math.min(current / next, 1);
  }

  const fetchProfile = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/user/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data) {
        let computedFreeClicks = data.freeClicks;
        if (computedFreeClicks >= Number.MAX_SAFE_INTEGER) {
          computedFreeClicks = Infinity;
        }
        setFreeClicks(computedFreeClicks);
        setHasInfiniteClicks(Boolean(data.hasInfiniteClicks));
        setPotEarned(data.potEarned || 0);
        setPaypalEmail(data.paypalEmail || null);
      }
    } catch {
      setError(t('game.errors.profileError') as string);
    }
  };

  const fetchGameState = async () => {
    try {
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/game/state', { method: 'GET', headers });
      const data = await res.json();
      if (res.ok && data.gameState) {
        setGameState(data.gameState);
      } else {
        setError(data.message || t('game.errors.gameStateError'));
      }
    } catch {
      setError(t('game.errors.gameStateError'));
    }
  };

  useEffect(() => {
    const isTokenExpired = () => {
      if (!token) return true;
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return Date.now() > payload.exp * 1000;
      } catch {
        return true;
      }
    };
    if ((!token && !isGuest) || (token && isTokenExpired())) {
      setToken(null);
      navigate('/');
    }
  }, [token, navigate, setToken, isGuest]);

  useEffect(() => {
    fetchGameState();
  }, []);

  useEffect(() => {
    if (token) {
      fetchGameState();
      fetchProfile();
    }
  }, [token]);

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Conectado a Socket.IO:', socket.id);
    });

    socket.on('gameStateUpdate', (updatedState: GameState) => {
      setGameState(updatedState);
      if (token) {
        fetchProfile();
      }
    });

    socket.on('winner', (winnerData: { username: string; pot: number }) => {
      alert(
        t('game.alerts.winner', {
          username: winnerData.username,
          pot: winnerData.pot
        })
      );
      if (token) {
        fetchProfile();
      }
    });

    socket.on('userCountUpdate', (count: number) => {
      setConnectedUsers(count);
    });

    socket.on('disconnect', () => {
      console.log('Desconectado de Socket.IO');
    });

    return () => {
      socket.off('gameStateUpdate');
      socket.off('winner');
      socket.off('userCountUpdate');
      socket.off('connect');
      socket.off('disconnect');
    };
  }, [token, t]);

  const handleIncrement = async () => {
    if (!token) return;

    const originalGlobalClicks = gameState.globalClicks;
    const originalFreeClicks = freeClicks;

    setGameState((prev) => ({
      ...prev,
      globalClicks: prev.globalClicks + 1
    }));

    const isInfiniteRole = role === 'admin' || role === 'superuser';
    if (!isInfiniteRole && !hasInfiniteClicks && freeClicks !== Infinity && freeClicks > 0) {
      setFreeClicks((prev) => prev - 1);
    }

    createFlash();

    try {
      const res = await fetch('/api/game/click', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        setGameState((prev) => ({ ...prev, globalClicks: originalGlobalClicks }));
        setFreeClicks(originalFreeClicks);
        setError(data.message || t('game.errors.clickError'));
      } else {
        fetchProfile();
      }
    } catch {
      setGameState((prev) => ({ ...prev, globalClicks: originalGlobalClicks }));
      setFreeClicks(originalFreeClicks);
      setError(t('game.errors.clickError'));
    }
  };

  const createFlash = () => {
    if (!centralRef.current) return;
    const centralRect = centralRef.current.getBoundingClientRect();
    const flashSize = 20;
    const minX = centralRect.left;
    const maxX = centralRect.right - flashSize;
    const minY = centralRect.top;
    const maxY = centralRect.bottom - flashSize;

    let found = false;
    let finalX = minX;
    let finalY = minY;
    let attempts = 0;

    while (attempts < 100 && !found) {
      const randX = Math.random() * (maxX - minX) + minX;
      const randY = Math.random() * (maxY - minY) + minY;
      found = true;
      finalX = randX;
      finalY = randY;
      attempts++;
    }
    if (!found) return;

    const relativeX = finalX - centralRect.left;
    const relativeY = finalY - centralRect.top;
    const id = flashIdRef.current++;

    setFlashes((prev) => [
      ...prev,
      { id, x: relativeX, y: relativeY }
    ]);
    setTimeout(() => {
      setFlashes((prev) => prev.filter((f) => f.id !== id));
    }, 500);
  };

  const handleCollectWinnings = async () => {
    if (!token) return;
    const originalPotEarned = potEarned;
    setPotEarned(0);

    try {
      const res = await fetch('/api/winners/collect', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Pago realizado con éxito. Transaction ID: ${data.transactionId}`);
        fetchProfile();
      } else {
        setPotEarned(originalPotEarned);
        setError(data.error || t('game.errors.collectError'));
      }
    } catch {
      setPotEarned(originalPotEarned);
      setError(t('game.errors.collectError'));
    }
  };

  const handlePurchaseModalOpen = () => setShowPurchaseModal(true);
  const handlePurchaseModalClose = () => setShowPurchaseModal(false);
  const handlePurchaseSuccess = () => {
    fetchProfile();
    fetchGameState();
  };
  const handleRegisterClick = () => setShowRegisterModal(true);
  const handleLoginClick = () => setShowLoginModal(true);
  const closeModal = () => {
    setShowRegisterModal(false);
    setShowLoginModal(false);
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const isInfiniteRole = role === 'admin' || role === 'superuser';
  const userHasInfinite = isInfiniteRole || hasInfiniteClicks;

  const lastClickText = gameState.lastClickUser
    ? t('game.lastClick.user', { username: gameState.lastClickUser })
    : t('game.lastClick.nobody');

  const lastWinnerText = gameState.lastWinner
    ? t('game.lastWinner.user', { username: gameState.lastWinner })
    : t('game.lastWinner.none');

  const nextMilestone = getNextMilestone(gameState.globalClicks);
  const milestoneProgress = getMilestoneProgress(gameState.globalClicks, nextMilestone);
  const milestonePercent = Math.round(milestoneProgress * 100);
  const rewardLabel = nextMilestone ? getMilestoneRewardLabel(nextMilestone) : '';

  const milestoneAriaText = nextMilestone
    ? t('game.milestones.progressAria', {
        percent: milestonePercent,
        milestone: nextMilestone,
        reward: rewardLabel
      })
    : t('game.milestones.progressCompleteAria');

  const milestoneLabel = nextMilestone
    ? t('game.milestones.labelNext', { milestone: nextMilestone, reward: rewardLabel })
    : t('game.milestones.labelDone');

  let displayedFreeClicks: string | number = freeClicks;
  if (userHasInfinite || freeClicks === Infinity) {
    displayedFreeClicks = '∞';
  }

  const disableBuyButton = userHasInfinite;
  const hasClicksAvailable = userHasInfinite || freeClicks > 0;

  return (
    <div className="game-container">
      <header className="game-header">
        <div className="header-left">
          {!isGuest && (
            <>
              <span>{t('game.header.potLabel')}</span>&nbsp;
              <span>{gameState.pot.toFixed(2)}</span>&nbsp;
              <span>{t('game.header.currencySymbol')}</span>
            </>
          )}
        </div>
        <div className="header-center">
          <Link to="/winners" className="winners-link">
            {t('game.header.winnersLink')}
          </Link>
        </div>
        <div className="header-right">
          {token ? (
            <>
              <span>
                {t('game.header.hello')}&nbsp;
                <Link to="/profile" className="username-link">
                  <strong>{username || t('game.header.unknownUser')}</strong>
                </Link>
                !
              </span>
              <button className="header-button" onClick={handleLogout}>
                {t('game.header.logout')}
              </button>
            </>
          ) : isGuest ? (
            <>
              <button className="header-button" onClick={handleRegisterClick}>
                {t('game.header.register')}
              </button>
              <button className="header-button" onClick={handleLoginClick}>
                {t('game.header.login')}
              </button>
            </>
          ) : (
            <>
              <button className="header-button" onClick={handleRegisterClick}>
                {t('game.header.register')}
              </button>
              <button className="header-button" onClick={handleLoginClick}>
                {t('game.header.login')}
              </button>
              <button className="header-button" onClick={continueAsGuest}>
                {t('game.header.guest')}
              </button>
            </>
          )}
          <LanguageSwitcher />
        </div>
      </header>

      <main className="game-main">
        <div className="center-area" ref={centralRef}>
          <div className="counter-number" ref={counterRef}>
            {gameState.globalClicks.toLocaleString()}
          </div>
          <div className="increment-button-container" ref={buttonContainerRef}>
            <button
              className="increment-button"
              onClick={handleIncrement}
              disabled={!token || !hasClicksAvailable}
              aria-disabled={!token || !hasClicksAvailable}
            >
              {t('game.buttons.increment')}
            </button>
            <svg
              className="progress-ring"
              width="100"
              height="100"
              style={
                {
                  '--ring-offset':
                    circumference - circumference * Math.min(gameState.globalClicks / MAX_CLICKS, 1)
                } as React.CSSProperties
              }
            >
              <circle
                strokeDasharray={circumference}
                r={radius}
                cx={50}
                cy={50}
              />
            </svg>
          </div>

          <div
            className="progress-milestone-container"
            role="progressbar"
            aria-valuenow={milestonePercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={milestoneAriaText || ''}
            aria-live="polite"
          >
            <div
              className="progress-milestone-bar"
              style={
                {
                  '--progress-percentage': `${milestonePercent}%`
                } as React.CSSProperties
              }
            />
          </div>
          <div className="milestone-label" aria-hidden="true">
            {milestoneLabel}
          </div>

          {token && !isGuest && (
            <p className="free-clicks-info">
              {t('game.freeClicksInfo', { clicks: displayedFreeClicks })}
            </p>
          )}

          {!isGuest && (
            <>
              <p>{lastClickText}</p>
              <p>{lastWinnerText}</p>
            </>
          )}

          {flashes.map((f) => (
            <div
              key={f.id}
              className="click-flash"
              style={
                {
                  '--flash-left': `${f.x}px`,
                  '--flash-top': `${f.y}px`
                } as React.CSSProperties
              }
            />
          ))}

          {token && potEarned > 0 && (
            <div className="pot-earned-container">
              {!paypalEmail ? (
                <div>
                  <p>
                    {t('game.potEarnedMessage', {
                      amount: potEarned.toFixed(2)
                    })}
                  </p>
                  <button
                    className="header-button"
                    onClick={() => setShowPaymentMethodModal(true)}
                  >
                    {t('game.buttons.configure')}
                  </button>
                </div>
              ) : (
                <div>
                  <p>
                    {t('game.potEarnedMessage', {
                      amount: potEarned.toFixed(2)
                    })}
                  </p>
                  <button
                    className="header-button"
                    onClick={() => setShowConfirmPaymentModal(true)}
                  >
                    {t('game.buttons.transfer')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <footer className="game-footer">
        <div className="footer-left">
          <p>{t('game.connectedUsers', { count: connectedUsers })}</p>
        </div>
        <div className="footer-right">
          {!isGuest && (
            <button
              className="participate-button"
              onClick={handlePurchaseModalOpen}
              disabled={disableBuyButton}
              aria-disabled={disableBuyButton}
            >
              {t('game.buttons.buyClicks')}
            </button>
          )}
        </div>
      </footer>

      {error && <div className="error-message">{error}</div>}

      {showRegisterModal && <Register closeModal={closeModal} />}
      {showLoginModal && <Login closeModal={closeModal} />}
      {showPurchaseModal && (
        <PurchaseClicksModal
          onClose={handlePurchaseModalClose}
          onPurchaseSuccess={handlePurchaseSuccess}
        />
      )}
      {showPaymentMethodModal && (
        <PaymentMethod
          onClose={() => setShowPaymentMethodModal(false)}
          onSuccess={() => {
            setShowPaymentMethodModal(false);
            fetchProfile();
          }}
        />
      )}
      {showConfirmPaymentModal && (
        <ConfirmPayment
          onClose={() => setShowConfirmPaymentModal(false)}
          onEditMethod={() => {
            setShowConfirmPaymentModal(false);
            setShowPaymentMethodModal(true);
          }}
          onConfirm={async () => {
            setShowConfirmPaymentModal(false);
            await handleCollectWinnings();
          }}
          paypalEmail={paypalEmail}
          amount={potEarned}
        />
      )}
    </div>
  );
};

export default Game;
