import React, { createContext, useState, useEffect, ReactNode, FC } from 'react';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  token: string | null;
  setToken: (token: string | null) => void;
  username: string | null;
  setUsername: (username: string | null) => void;
  email: string | null;
  setEmail: (email: string | null) => void;
  isGuest: boolean;
  setIsGuest: (isGuest: boolean) => void;
  message: string;
  setMessage: (message: string) => void;
  handleLogout: () => void;
  continueAsGuest: () => void;
  role: string | null;
  setRole: (role: string | null) => void;
  adminBalance: number;
  setAdminBalance: (balance: number) => void;
  paypalEmail: string | null;               // Añadimos paypalEmail
  setPaypalEmail: (email: string | null) => void; // Añadimos setter para paypalEmail
}

function parseJwt(token: string): { exp?: number } {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return {};
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return {};
  }
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [role, setRole] = useState<string | null>(null);
  const [adminBalance, setAdminBalance] = useState<number>(0);
  const [paypalEmail, setPaypalEmail] = useState<string | null>(null); // Inicializamos paypalEmail
  
  const navigate = useNavigate();
  const [refreshTimeoutId, setRefreshTimeoutId] = useState<number | undefined>();

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUsername = localStorage.getItem('username');
    const storedEmail = localStorage.getItem('email');
    const storedRole = localStorage.getItem('role');

    if (storedToken) {
      setToken(storedToken);
    }
    if (storedUsername) {
      setUsername(storedUsername);
    }
    if (storedEmail) {
      setEmail(storedEmail);
    }
    if (storedRole) {
      setRole(storedRole);
    }
    // paypalEmail no se almacena en localStorage actualmente,
    // Se actualizará tras fetchProfile.
  }, []);

  const fetchProfile = async () => {
    if (!token) return;
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`
    };

    try {
      const res = await fetch('/api/user/profile', { headers });
      const contentType = res.headers.get('content-type') || '';
      if (!res.ok || !contentType.includes('application/json')) {
        console.error('No se pudo obtener el perfil del usuario');
        return;
      }
      const data = await res.json();
      if (data.username) {
        setUsername(data.username);
        localStorage.setItem('username', data.username);
      }
      if (data.email) {
        setEmail(data.email);
        localStorage.setItem('email', data.email);
      }
      if (data.role) {
        setRole(data.role);
        localStorage.setItem('role', data.role);
      }
      if (data.adminBalance !== undefined) {
        setAdminBalance(data.adminBalance);
      }
      if (data.paypalEmail !== undefined) {
        setPaypalEmail(data.paypalEmail);
        // Podrías guardarlo en localStorage si lo consideras necesario:
        // localStorage.setItem('paypalEmail', data.paypalEmail);
      }
    } catch (error) {
      console.error('Error al obtener el perfil:', error);
    }
  };

  const refreshAccessToken = async () => {
    try {
      const res = await fetch('/api/user/refresh', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (res.ok && data.token) {
        setToken(data.token);
        localStorage.setItem('token', data.token);
        console.log('Token refrescado con éxito');
        scheduleTokenRefresh(data.token);
      } else {
        handleLogout();
      }
    } catch (err) {
      console.error('Error al refrescar el token:', err);
      handleLogout();
    }
  };

  const scheduleTokenRefresh = (newToken?: string) => {
    const usedToken = newToken || token;
    if (!usedToken) return;
    const payload = parseJwt(usedToken);
    if (!payload.exp) return;
    const now = Math.floor(Date.now() / 1000);
    const exp = payload.exp;
    const refreshTime = (exp - now - 5 * 60) * 1000;
    if (refreshTime <= 0) {
      refreshAccessToken();
    } else {
      if (refreshTimeoutId) {
        clearTimeout(refreshTimeoutId);
      }
      const id = setTimeout(() => {
        refreshAccessToken();
      }, refreshTime) as unknown as number;
      setRefreshTimeoutId(id);
    }
  };

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      fetchProfile();
      setIsGuest(false);
      scheduleTokenRefresh(token);
    } else {
      if (refreshTimeoutId) {
        clearTimeout(refreshTimeoutId);
      }
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      localStorage.removeItem('email');
      localStorage.removeItem('role');
      // Si guardas paypalEmail en localStorage, también removeItem('paypalEmail') si es necesario
      setUsername(null);
      setEmail(null);
      setRole(null);
      setPaypalEmail(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleLogout = (): void => {
    if (refreshTimeoutId) {
      clearTimeout(refreshTimeoutId);
    }
    setToken(null);
    setUsername(null);
    setEmail(null);
    setIsGuest(false);
    setRole(null);
    setPaypalEmail(null);
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('email');
    localStorage.removeItem('role');
    // localStorage.removeItem('paypalEmail'); si lo usas
    setMessage('Has cerrado sesión.');
    navigate('/');
  };

  const continueAsGuest = (): void => {
    if (refreshTimeoutId) {
      clearTimeout(refreshTimeoutId);
    }
    setIsGuest(true);
    setToken(null);
    setUsername(null);
    setEmail(null);
    setRole(null);
    setPaypalEmail(null);
    navigate('/game');
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        setToken,
        username,
        setUsername,
        email,
        setEmail,
        isGuest,
        setIsGuest,
        message,
        setMessage,
        handleLogout,
        continueAsGuest,
        role,
        setRole,
        adminBalance,
        setAdminBalance,
        paypalEmail,       // Añadimos paypalEmail al provider
        setPaypalEmail     // Añadimos setPaypalEmail al provider
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
