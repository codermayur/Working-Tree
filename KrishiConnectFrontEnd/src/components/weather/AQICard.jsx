import React from 'react';

const AQI_RANGES = [
  { max: 50, label: 'Good', color: '#22c55e' },
  { max: 100, label: 'Fair', color: '#eab308' },
  { max: 150, label: 'Moderate', color: '#f59e0b' },
  { max: 200, label: 'Poor', color: '#ef4444' },
  { max: Infinity, label: 'Very Poor', color: '#a855f7' },
];

function getAQIInfo(value) {
  const v = value ?? 0;
  const r = AQI_RANGES.find((x) => v <= x.max);
  return { ...r, value: v };
}

const RECOMMENDATIONS = {
  Good: 'Air quality is satisfactory.',
  Fair: 'Acceptable for most. Unusually sensitive people consider reducing prolonged outdoor exertion.',
  Moderate: 'Sensitive people consider reducing prolonged outdoor exertion.',
  Poor: 'Everyone may begin to experience health effects. Limit outdoor exposure.',
  'Very Poor': 'Health alert: avoid outdoor exposure.',
};

export default function AQICard({ airQuality }) {
  if (!airQuality?.current) return null;

  const cur = airQuality.current;
  const aqi = cur.european_aqi ?? cur.us_aqi ?? null;
  const info = getAQIInfo(aqi);

  return (
    <div style={{ background: '#1a1d27', border: '1px solid #2a2d3a', borderRadius: 12, padding: 16 }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8', marginBottom: 12 }}>🌿 Air Quality</h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: info.color }}>{info.value}</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{info.label}</div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>{RECOMMENDATIONS[info.label]}</div>
        </div>
      </div>
      <div style={{ height: 8, background: '#2a2d3a', borderRadius: 4, overflow: 'hidden', marginBottom: 12 }}>
        <div style={{ width: `${Math.min(100, (info.value / 200) * 100)}%`, height: '100%', background: info.color, transition: 'width 0.3s' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 11, color: '#94a3b8' }}>
        <span>PM2.5: {cur.pm2_5 ?? '—'}</span>
        <span>PM10: {cur.pm10 ?? '—'}</span>
        <span>NO₂: {cur.nitrogen_dioxide ?? '—'}</span>
        <span>O₃: {cur.ozone ?? '—'}</span>
        <span>CO: {cur.carbon_monoxide ?? '—'}</span>
      </div>
    </div>
  );
}
