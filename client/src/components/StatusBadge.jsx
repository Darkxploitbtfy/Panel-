import React from 'react';

const MAP = {
  running:     { label: 'Running',     color: '#4ade80', bg: 'rgba(74,222,128,0.1)' },
  stopped:     { label: 'Stopped',     color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
  restarting:  { label: 'Restarting',  color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
  connecting:  { label: 'Connecting',  color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
  unknown:     { label: 'Unknown',     color: '#9ca3af', bg: 'rgba(156,163,175,0.1)' },
};

export default function StatusBadge({ status }) {
  const s = MAP[status] || MAP.unknown;
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '4px 12px',
      borderRadius: 20,
      background: s.bg,
      color: s.color,
      fontSize: 12,
      fontWeight: 600,
      letterSpacing: '0.04em',
    }}>
      <span style={{
        width: 7, height: 7, borderRadius: '50%',
        background: s.color,
        animation: status === 'running' ? 'pulse 2s ease infinite' : 'none',
        display: 'inline-block',
      }} />
      {s.label}
    </span>
  );
}
