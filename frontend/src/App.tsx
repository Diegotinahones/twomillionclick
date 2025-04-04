// src/App.tsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import WelcomePage from './components/WellcomePage';
import Game from './components/Game';
import WinnersPage from './components/WinnersPage';
import ProfilePage from './components/ProfilePage';
import RoleManager from './components/RoleManager';

const App: React.FC = () => {
  const { token, isGuest, role } = useAuth();

  return (
    <Routes>
      <Route
        path="/"
        element={token || isGuest ? <Navigate to="/game" /> : <WelcomePage />}
      />
      <Route
        path="/game"
        element={<Game />}
      />
      <Route
        path="/winners"
        element={<WinnersPage />}
      />
      <Route
        path="/profile"
        element={token ? <ProfilePage /> : <Navigate to="/" />}
      />
      <Route
        path="/admin/roles"
        element={token && role === 'admin' ? <RoleManager /> : <Navigate to="/" />}
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default App;
