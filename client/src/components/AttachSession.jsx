import React, { useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../App.jsx';

const S = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(6,6,17,0.85)',
    backdropFilter: 'blur(6px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: 24,
    animation: 'fadeIn 0.2s ease',
  },
  card: {
    width: '100%', maxWidth: 440,
    background: 'rgba(15,10,30,0.95)',
    border: '1px solid rgba(124,58,237,0.3)',
    borderRadius: 18,
    padding: '32px 28px',
    boxShadow: '0 24px 80px rgba(91,33,182,0.3)',
  },
  title: { fontSize: 18, fontWeight: 700, color: '#f5f3ff', marginBottom: 6 },
  desc: { fontSize: 13, color: '#7c6fa0', marginBottom: 24, lineHeight: 1.5 },
  input: {
    width: '100%',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(124,58,237,0.25)',
    borderRadius: 10, padding: '12px 14px',
    color: '#f5f3ff', fontSize: 13,
    outline: 'none', marginBottom: 16,
    fontFamily: 'monospace',
  },
  row: { display: 'flex', gap: 10 },
  btn: (v) => ({
    flex: 1, padding: '11px', borderRadius: 10,
    border: v === 'cancel' ? '1px solid rgba(255,255,255,0.1)' : 'none',
    cursor: 'pointer', fontSize: 14, fontWeight: 600,
    background: v === 'cancel' ? 'transparent' : 'linear-gradient(135deg, #7c3aed, #4f46e5)',
    color: '#fff',
  }),
  error: {
    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
    borderRadius: 8, padding: '9px 12px', color: '#fca5a5',
    fontSize: 12, marginBottom: 12,
  },
};

export default function AttachSession({ onDone, onCancel }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { refreshUser } = useAuth();

  async function attach() {
    setError('');
    setLoading(true);
    try {
      await api.attachSession(value.trim());
      await refreshUser();
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={S.overlay} onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div style={S.card}>
        <div style={S.title}>Attach Session ID</div>
        <div style={S.desc}>
          Paste your <strong style={{ color: '#a78bfa' }}>BOTIFY-X=...</strong> session ID from the pairing portal.
          This links your WhatsApp session to your account.
        </div>
        {error && <div style={S.error}>{error}</div>}
        <input
          style={S.input}
          type="text"
          placeholder="BOTIFY-X=abc123...-def456..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
        />
        <div style={S.row}>
          <button style={S.btn('cancel')} onClick={onCancel}>Cancel</button>
          <button style={{ ...S.btn('confirm'), opacity: loading ? 0.6 : 1 }} onClick={attach} disabled={loading}>
            {loading ? 'Attaching...' : 'Attach'}
          </button>
        </div>
      </div>
    </div>
  );
}
