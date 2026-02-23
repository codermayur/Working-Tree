import React from 'react';

const UV_RANGES = [
  { max: 2, label: 'Low', color: '#22c55e', advice: 'No protection needed.' },
  { max: 5, label: 'Moderate', color: '#eab308', advice: 'Wear sunscreen SPF 30+.' },
  { max: 7, label: 'High', color: '#f59e0b', advice: 'Hat + sunglasses recommended.' },
  { max: 10, label: 'Very High', color: '#ef4444', advice: 'Avoid midday sun.' },
  { max: Infinity, label: 'Extreme', color: '#a855f7', advice: 'Stay indoors if possible.' },
];

function getUVInfo(value) {
  const v = value ?? 0;
  const r = UV_RANGES.find((x) => v <= x.max);
  return { ...r, value: v };
}

export default function UVCard({ uvIndex }) {
  const info = getUVInfo(uvIndex);

  return (
    <div style={{ background: '#1a1d27', border: '1px solid #2a2d3a', borderRadius: 12, padding: 16 }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8', marginBottom: 12 }}>☀️ UV Index</h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', border: `3px solid ${info.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: info.color }}>
          {info.value}
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{info.label}</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{info.advice}</div>
        </div>
      </div>
    </div>
  );
}
