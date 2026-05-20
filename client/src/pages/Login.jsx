import React, { useState } from 'react';
import { useAuth } from '../App.jsx';
import { api } from '../api.js';

const S = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    background: 'radial-gradient(ellipse at 50% 0%, #1a0533 0%, #060611 60%)',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    background: 'rgba(15,10,30,0.85)',
    border: '1px solid rgba(124,58,237,0.25)',
    borderRadius: 20,
    padding: '40px 36px',
    backdropFilter: 'blur(20px)',
    boxShadow: '0 24px 80px rgba(91,33,182,0.25)',
    animation: 'fadeIn 0.4s ease',
  },
  logo: {
    textAlign: 'center',
    marginBottom: 32,
  },
  logoIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    animation: 'glow 3s ease infinite',
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: '#f5f3ff',
    letterSpacing: '-0.3px',
  },
  subtitle: {
    fontSize: 13,
    color: '#7c6fa0',
    marginTop: 4,
  },
  tabs: {
    display: 'flex',
    background: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
    padding: 4,
    marginBottom: 28,
    gap: 4,
  },
  tab: (active) => ({
    flex: 1,
    padding: '8px 0',
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    transition: 'all 0.2s',
    background: active ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' : 'transparent',
    color: active ? '#fff' : '#7c6fa0',
  }),
  label: {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: '#a78bfa',
    marginBottom: 8,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  input: {
    width: '100%',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(124,58,237,0.2)',
    borderRadius: 10,
    padding: '12px 14px',
    color: '#f5f3ff',
    fontSize: 14,
    outline: 'none',
    marginBottom: 16,
    transition: 'border-color 0.2s',
  },
  btn: {
    width: '100%',
    padding: '13px',
    borderRadius: 12,
    border: 'none',
    cursor: 'pointer',
    fontSize: 15,
    fontWeight: 700,
    background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
    color: '#fff',
    letterSpacing: '0.02em',
    transition: 'opacity 0.2s, transform 0.1s',
    marginTop: 4,
  },
  error: {
    background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.25)',
    borderRadius: 10,
    padding: '10px 14px',
    color: '#fca5a5',
    fontSize: 13,
    marginBottom: 16,
  },
  fieldWrap: { marginBottom: 4 },
};

export default function Login() {
  const { login } = useAuth();
  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({ username: '', password: '', inviteToken: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (tab === 'login') {
        const { token, user } = await api.login(form.username, form.password);
        login(token, user);
      } else {
        const { token, user } = await api.register(form.username, form.password, form.inviteToken);
        login(token, user);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.logo}>
          <div style={S.logoIcon}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <div style={S.title}>BOTIFY X</div>
          <div style={S.subtitle}>Client Panel</div>
        </div>

        <div style={S.tabs}>
          <button style={S.tab(tab === 'login')} onClick={() => setTab('login')}>Sign In</button>
          <button style={S.tab(tab === 'register')} onClick={() => setTab('register')}>Register</button>
        </div>

        {error && <div style={S.error}>{error}</div>}

        <form onSubmit={submit} autoComplete="off">
          <div style={S.fieldWrap}>
            <label style={S.label}>Username</label>
            <input
              style={S.input}
              type="text"
              value={form.username}
              onChange={set('username')}
              placeholder="your_username"
              required
              autoFocus
            />
          </div>
          <div style={S.fieldWrap}>
            <label style={S.label}>Password</label>
            <input
              style={S.input}
              type="password"
              value={form.password}
              onChange={set('password')}
              placeholder="••••••••"
              required
            />
          </div>
          {tab === 'register' && (
            <div style={S.fieldWrap}>
              <label style={S.label}>Invite Token</label>
              <input
                style={S.input}
                type="text"
                value={form.inviteToken}
                onChange={set('inviteToken')}
                placeholder="BX-INVITE-..."
                required
              />
            </div>
          )}
          <button
            style={{ ...S.btn, opacity: loading ? 0.6 : 1 }}
            type="submit"
            disabled={loading}
          >
            {loading ? 'Please wait...' : tab === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
