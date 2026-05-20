import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import { api } from './api.js';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('bx_token'));
  const [loading, setLoading] = useState(true);

  const login = useCallback((tok, u) => {
    localStorage.setItem('bx_token', tok);
    setToken(tok);
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('bx_token');
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { user: u } = await api.me();
      setUser(u);
    } catch {
      logout();
    }
  }, [logout]);

  useEffect(() => {
    if (token) {
      api.me()
        .then(({ user: u }) => setUser(u))
        .catch(() => logout())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div style={styles.loader}>
        <div style={styles.loaderDot} />
      </div>
    );
  }

  return (
    <AuthCtx.Provider value={{ user, token, login, logout, refreshUser }}>
      {user ? <Dashboard /> : <Login />}
    </AuthCtx.Provider>
  );
}

const styles = {
  loader: {
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#060611',
  },
  loaderDot: {
    width: 48,
    height: 48,
    borderRadius: '50%',
    border: '3px solid #5b21b6',
    borderTopColor: '#a78bfa',
    animation: 'spin 0.8s linear infinite',
  },
};

// inject keyframes
const sheet = document.createElement('style');
sheet.textContent = `@keyframes spin { to { transform: rotate(360deg); } }
@keyframes fadeIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
@keyframes pulse { 0%,100%{ opacity:1; } 50%{ opacity:.4; } }
@keyframes glow { 0%,100%{ box-shadow: 0 0 10px #7c3aed44; } 50%{ box-shadow: 0 0 24px #7c3aed99; } }`;
document.head.appendChild(sheet);
