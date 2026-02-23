import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

const styles = {
  container: {
    background: '#1a1d27',
    border: '1px solid #2a2d3a',
    borderRadius: 12,
    padding: '12px 16px',
    marginBottom: 16,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  high: { borderLeft: '4px solid #ef4444' },
  moderate: { borderLeft: '4px solid #f59e0b' },
  icon: { flexShrink: 0 },
  message: { flex: 1, color: '#ffffff', fontSize: 14, fontWeight: 500 },
  dismiss: { background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 },
};

export default function AlertBanner({ alerts, onDismiss }) {
  const [dismissed, setDismissed] = useState(new Set());
  if (!alerts?.length) return null;

  const visible = alerts.filter((a) => !dismissed.has(a.id));
  if (!visible.length) return null;

  const handleDismiss = (id) => {
    setDismissed((s) => new Set([...s, id]));
    onDismiss?.(id);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {visible.map((alert) => (
        <div
          key={alert.id}
          style={{
            ...styles.container,
            ...(alert.severity === 'high' ? styles.high : styles.moderate),
          }}
        >
          <span style={styles.icon}>{alert.icon || <AlertTriangle size={20} color="#f59e0b" />}</span>
          <span style={styles.message}>{alert.message}</span>
          <button type="button" style={styles.dismiss} onClick={() => handleDismiss(alert.id)} aria-label="Dismiss">
            <X size={18} />
          </button>
        </div>
      ))}
    </div>
  );
}
