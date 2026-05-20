import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../App.jsx';
import { api } from '../api.js';
import StatusBadge from '../components/StatusBadge.jsx';
import AttachSession from '../components/AttachSession.jsx';

const S = {
  page: {
    minHeight: '100vh',
    background: 'radial-gradient(ellipse at 50% 0%, #12052e 0%, #060611 55%)',
    padding: '0 0 40px',
  },
  nav: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '18px 28px',
    borderBottom: '1px solid rgba(124,58,237,0.12)',
    background: 'rgba(6,6,17,0.7)',
    backdropFilter: 'blur(12px)',
    position: 'sticky', top: 0, zIndex: 100,
  },
  navLogo: { display: 'flex', alignItems: 'center', gap: 10 },
  navIcon: {
    width: 34, height: 34, borderRadius: 10,
    background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  navTitle: { fontSize: 16, fontWeight: 800, color: '#f5f3ff', letterSpacing: '-0.2px' },
  navRight: { display: 'flex', alignItems: 'center', gap: 14 },
  navUser: { fontSize: 13, color: '#7c6fa0' },
  logoutBtn: {
    padding: '7px 16px', borderRadius: 8,
    border: '1px solid rgba(124,58,237,0.25)',
    background: 'transparent', color: '#a78bfa',
    fontSize: 13, fontWeight: 600, cursor: 'pointer',
  },
  main: { maxWidth: 720, margin: '0 auto', padding: '32px 20px' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 },
  card: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(124,58,237,0.15)',
    borderRadius: 16, padding: '20px 22px',
    backdropFilter: 'blur(10px)',
    animation: 'fadeIn 0.35s ease',
  },
  cardLabel: { fontSize: 11, fontWeight: 700, color: '#6d5fa0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 },
  cardValue: { fontSize: 20, fontWeight: 700, color: '#f5f3ff' },
  cardSub: { fontSize: 12, color: '#6d5fa0', marginTop: 3 },
  sessionBox: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(124,58,237,0.15)',
    borderRadius: 16, padding: '18px 22px',
    marginBottom: 14,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: 14, flexWrap: 'wrap',
  },
  sessionId: { fontFamily: 'monospace', fontSize: 12, color: '#a78bfa', wordBreak: 'break-all' },
  pill: (c) => ({
    padding: '5px 14px', borderRadius: 20,
    background: c === 'green' ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)',
    color: c === 'green' ? '#4ade80' : '#f87171',
    fontSize: 12, fontWeight: 600,
  }),
  ctrlRow: {
    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 12, marginBottom: 14,
  },
  ctrlBtn: (color, disabled) => ({
    padding: '16px 0', borderRadius: 14, border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.45 : 1,
    fontSize: 14, fontWeight: 700,
    background: color === 'green'
      ? 'linear-gradient(135deg, #059669, #065f46)'
      : color === 'yellow'
        ? 'linear-gradient(135deg, #d97706, #92400e)'
        : 'linear-gradient(135deg, #dc2626, #7f1d1d)',
    color: '#fff',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
    transition: 'opacity 0.2s, transform 0.1s',
  }),
  ctrlIcon: { fontSize: 20 },
  logsCard: {
    background: 'rgba(0,0,0,0.4)',
    border: '1px solid rgba(124,58,237,0.15)',
    borderRadius: 16,
    overflow: 'hidden',
  },
  logsHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 20px',
    borderBottom: '1px solid rgba(124,58,237,0.1)',
  },
  logsTitle: { fontSize: 12, fontWeight: 700, color: '#6d5fa0', textTransform: 'uppercase', letterSpacing: '0.06em' },
  logsList: {
    maxHeight: 220, overflowY: 'auto',
    padding: '10px 20px',
    display: 'flex', flexDirection: 'column', gap: 4,
  },
  logLine: (ev) => ({
    display: 'flex', gap: 10, alignItems: 'flex-start',
    fontSize: 12, lineHeight: 1.5,
    color: ev === 'error' ? '#f87171' : ev === 'start' ? '#4ade80' : ev === 'stop' ? '#f87171' : '#c4b5fd',
  }),
  logTime: { color: '#4b4069', minWidth: 58, fontSize: 11 },
  emptyLogs: { padding: '20px', textAlign: 'center', color: '#4b4069', fontSize: 12 },
  attachBtn: {
    padding: '7px 16px', borderRadius: 8,
    border: '1px solid rgba(167,139,250,0.3)',
    background: 'transparent', color: '#a78bfa',
    fontSize: 12, fontWeight: 600, cursor: 'pointer',
  },
  refreshBtn: {
    padding: '5px 12px', borderRadius: 7,
    border: '1px solid rgba(124,58,237,0.2)',
    background: 'transparent', color: '#7c6fa0',
    fontSize: 11, cursor: 'pointer',
  },
};

function fmt(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
function fmtDate(d) {
  return new Date(d).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function Dashboard() {
  const { user, token, logout, refreshUser } = useAuth();
  const [runtimeStatus, setRuntimeStatus] = useState('unknown');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(null);
  const [showAttach, setShowAttach] = useState(false);
  const [toast, setToast] = useState('');
  const logsRef = useRef(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchStatus = useCallback(async () => {
    if (!user?.session_id) { setRuntimeStatus('unknown'); return; }
    try {
      const data = await api.status();
      setRuntimeStatus(data.status || 'unknown');
    } catch {
      setRuntimeStatus('unknown');
    }
  }, [user?.session_id]);

  const fetchEvents = useCallback(async () => {
    try {
      const { events: ev } = await api.events();
      setEvents(ev || []);
    } catch {}
  }, []);

  useEffect(() => {
    fetchStatus();
    fetchEvents();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, [fetchStatus, fetchEvents]);

  // Socket.io — listen for CORE push events
  useEffect(() => {
    if (!token) return;
    const socket = io({ auth: { token }, transports: ['websocket'] });
    socket.on('runtime:status', ({ status }) => setRuntimeStatus(status));
    socket.on('runtime:log', (line) => {
      setEvents((ev) => [{ event: 'log', message: line, created_at: new Date().toISOString() }, ...ev].slice(0, 30));
    });
    return () => socket.disconnect();
  }, [token]);

  useEffect(() => {
    if (logsRef.current) logsRef.current.scrollTop = 0;
  }, [events]);

  async function doAction(action) {
    if (!user?.session_id) { setShowAttach(true); return; }
    setLoading(action);
    try {
      await api[action]();
      showToast(`${action.charAt(0).toUpperCase() + action.slice(1)} command sent`);
      setTimeout(fetchStatus, 1500);
      setTimeout(fetchEvents, 1000);
    } catch (err) {
      showToast(err.message || 'Command failed');
    } finally {
      setLoading(null);
    }
  }

  const isExpiringSoon = user?.expiry_date && (new Date(user.expiry_date) - new Date()) < 7 * 86400000;
  const expired = user?.expiry_date && new Date(user.expiry_date) < new Date();

  return (
    <div style={S.page}>
      {/* Nav */}
      <nav style={S.nav}>
        <div style={S.navLogo}>
          <div style={S.navIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <span style={S.navTitle}>BOTIFY X</span>
          <span style={{ fontSize: 11, color: '#4b4069', marginLeft: 2 }}>CLIENT PANEL</span>
        </div>
        <div style={S.navRight}>
          <span style={S.navUser}>@{user?.username}</span>
          <button style={S.logoutBtn} onClick={logout}>Sign Out</button>
        </div>
      </nav>

      <div style={S.main}>
        {/* Status cards */}
        <div style={S.grid2}>
          <div style={S.card}>
            <div style={S.cardLabel}>Runtime Status</div>
            <StatusBadge status={runtimeStatus} />
          </div>
          <div style={S.card}>
            <div style={S.cardLabel}>Expiry</div>
            <div style={{ ...S.cardValue, fontSize: 15, color: expired ? '#f87171' : isExpiringSoon ? '#fbbf24' : '#f5f3ff' }}>
              {user?.expiry_date ? fmtDate(user.expiry_date) : '—'}
            </div>
            {isExpiringSoon && !expired && <div style={{ ...S.cardSub, color: '#fbbf24' }}>Expiring soon</div>}
            {expired && <div style={{ ...S.cardSub, color: '#f87171' }}>Expired</div>}
          </div>
        </div>

        {/* Session ID row */}
        <div style={S.sessionBox}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6d5fa0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>
              Session
            </div>
            {user?.session_id
              ? <div style={S.sessionId}>{user.session_id}</div>
              : <div style={{ fontSize: 13, color: '#4b4069' }}>No session attached</div>
            }
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={S.pill(user?.session_id ? 'green' : 'red')}>
              {user?.session_id ? 'Connected' : 'None'}
            </span>
            <button style={S.attachBtn} onClick={() => setShowAttach(true)}>
              {user?.session_id ? 'Change' : 'Attach'}
            </button>
          </div>
        </div>

        {/* Control buttons */}
        <div style={S.ctrlRow}>
          <button
            style={S.ctrlBtn('green', !!loading || runtimeStatus === 'running')}
            onClick={() => doAction('start')}
            disabled={!!loading || runtimeStatus === 'running'}
          >
            <span style={S.ctrlIcon}>▶</span>
            {loading === 'start' ? 'Starting...' : 'Start'}
          </button>
          <button
            style={S.ctrlBtn('yellow', !!loading)}
            onClick={() => doAction('restart')}
            disabled={!!loading}
          >
            <span style={S.ctrlIcon}>↺</span>
            {loading === 'restart' ? 'Restarting...' : 'Restart'}
          </button>
          <button
            style={S.ctrlBtn('red', !!loading || runtimeStatus === 'stopped')}
            onClick={() => doAction('stop')}
            disabled={!!loading || runtimeStatus === 'stopped'}
          >
            <span style={S.ctrlIcon}>■</span>
            {loading === 'stop' ? 'Stopping...' : 'Kill'}
          </button>
        </div>

        {/* Live logs */}
        <div style={S.logsCard}>
          <div style={S.logsHeader}>
            <span style={S.logsTitle}>Activity Log</span>
            <button style={S.refreshBtn} onClick={fetchEvents}>Refresh</button>
          </div>
          <div style={S.logsList} ref={logsRef}>
            {events.length === 0
              ? <div style={S.emptyLogs}>No activity yet</div>
              : events.map((ev, i) => (
                <div key={i} style={S.logLine(ev.event)}>
                  <span style={S.logTime}>{fmt(ev.created_at)}</span>
                  <span>[{ev.event.toUpperCase()}]</span>
                  <span style={{ color: '#c4b5fd', flex: 1 }}>{ev.message || ''}</span>
                </div>
              ))
            }
          </div>
        </div>
      </div>

      {/* Modals */}
      {showAttach && (
        <AttachSession
          onDone={() => { setShowAttach(false); showToast('Session attached'); }}
          onCancel={() => setShowAttach(false)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(124,58,237,0.9)', color: '#fff',
          padding: '10px 22px', borderRadius: 10, fontSize: 13, fontWeight: 600,
          boxShadow: '0 8px 30px rgba(91,33,182,0.4)', zIndex: 2000,
          animation: 'fadeIn 0.2s ease',
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}
