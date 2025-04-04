import React, { useEffect, useState, useRef } from 'react';
import './WinnersPage.css';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface Winner {
  _id: string;
  userId: {
    username?: string;
    email?: string;
  } | null;
  pot: number;
  createdAt: string;
}

const WinnersPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [winners, setWinners] = useState<Winner[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [randomView, setRandomView] = useState(true);
  const [currentWinner, setCurrentWinner] = useState<Winner | null>(null);
  const [fading, setFading] = useState(false);

  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  const formatearFecha = (fechaISO: string): string => {
    const fecha = new Date(fechaISO);
    const dia = fecha.getDate().toString().padStart(2, '0');
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const anio = fecha.getFullYear().toString();
    return `${dia}/${mes}/${anio}`;
  };

  const changeRandomWinner = () => {
    if (winners.length === 0) {
      setCurrentWinner(null);
      return;
    }
    setFading(true);
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * winners.length);
      setCurrentWinner(winners[randomIndex]);
      setFading(false);
    }, 300);
  };

  useEffect(() => {
    const fetchWinners = async () => {
      try {
        const res = await fetch('/api/winners');
        const data = await res.json();
        if (res.ok && data.winners) {
          setWinners(data.winners);
        } else {
          setError(data.message || 'No se pudo obtener la lista de ganadores.');
        }
      } catch (err) {
        console.error('Error al obtener ganadores:', err);
        setError('Error interno al obtener la lista de ganadores.');
      }
    };
    fetchWinners();
  }, []);

  useEffect(() => {
    if (randomView && winners.length > 0) {
      changeRandomWinner();
      const interval = setInterval(() => {
        changeRandomWinner();
      }, 5000);
      return () => clearInterval(interval);
    } else {
      setCurrentWinner(null);
    }
  }, [randomView, winners]);

  return (
    <div className="winners-container">
      <header className="winners-header">
        <button
          type="button"
          className="header-button"
          onClick={() => navigate('/game')}
          aria-label={t('winnersPage.back') as string}
        >
          {t('winnersPage.back')}
        </button>
        <h1 ref={titleRef} tabIndex={-1}>
          {t('winnersPage.title')}
        </h1>
        <button
          type="button"
          className="header-button"
          onClick={() => setRandomView(!randomView)}
        >
          {randomView
            ? t('winnersPage.tableMode')
            : t('winnersPage.randomMode')}
        </button>
      </header>

      <main className="winners-main">
        {error && <div className="error-message">{error}</div>}
        {!error && winners.length === 0 && <p>{t('winnersPage.noWinners')}</p>}

        {!randomView && winners.length > 0 && (
          <table className="winners-table">
            <thead>
              <tr>
                <th scope="col">{t('winnersPage.table.user')}</th>
                <th scope="col">{t('winnersPage.table.potWon')}</th>
                <th scope="col">{t('winnersPage.table.date')}</th>
              </tr>
            </thead>
            <tbody>
              {winners.map((winner) => (
                <tr key={winner._id}>
                  <td>
                    {winner.userId
                      ? winner.userId.username || 'Desconocido'
                      : 'Desconocido'}
                  </td>
                  <td>{winner.pot.toLocaleString()}$</td>
                  <td>{formatearFecha(winner.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {randomView && (
          <div
            className={`winner-card ${fading ? 'fade-out' : 'fade-in'}`}
            aria-live="polite"
          >
            {currentWinner ? (
              <>
                <h2>
                  {currentWinner.userId
                    ? currentWinner.userId.username || 'Desconocido'
                    : 'Desconocido'}
                </h2>
                <p>{currentWinner.pot.toLocaleString()}$</p>
                <p>{formatearFecha(currentWinner.createdAt)}</p>
              </>
            ) : (
              <p>{t('winnersPage.randomNoWinners')}</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default WinnersPage;
