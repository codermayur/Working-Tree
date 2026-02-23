import React from 'react';

function formatTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
}

function dayLength(sunrise, sunset) {
  if (!sunrise || !sunset) return null;
  const a = new Date(sunrise).getTime();
  const b = new Date(sunset).getTime();
  const mins = (b - a) / 60000;
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return `${h}h ${m}m`;
}

export default function SunriseSunset({ forecast }) {
  const sunrise = forecast?.sunrise?.[0];
  const sunset = forecast?.sunset?.[0];
  const length = dayLength(sunrise, sunset);
  const now = Date.now();
  const sunR = sunrise ? new Date(sunrise).getTime() : 0;
  const sunS = sunset ? new Date(sunset).getTime() : 0;
  const progress = sunR && sunS && now >= sunR && now <= sunS ? (now - sunR) / (sunS - sunR) : 0;

  return (
    <div style={{ background: '#1a1d27', border: '1px solid #2a2d3a', borderRadius: 12, padding: 16 }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8', marginBottom: 12 }}>🌅 Sun</h3>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>Sunrise</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{formatTime(sunrise)}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>Sunset</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{formatTime(sunset)}</div>
        </div>
      </div>
      <div style={{ height: 6, background: '#2a2d3a', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
        <div style={{ width: `${progress * 100}%`, height: '100%', background: 'linear-gradient(90deg, #f59e0b, #fbbf24)', transition: 'width 0.3s' }} />
      </div>
      {length && <div style={{ fontSize: 11, color: '#94a3b8' }}>Day length: {length}</div>}
    </div>
  );
}
