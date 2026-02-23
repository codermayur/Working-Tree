import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Line, ComposedChart } from 'recharts';

function barColor(p) {
  if (p == null) return '#334155';
  if (p <= 20) return '#7dd3fc';
  if (p <= 50) return '#4f9cf9';
  if (p <= 80) return '#2563eb';
  return '#1e3a5f';
}

export default function RainRadar({ hourly, weatherUnion, currentTime }) {
  if (!hourly?.time?.length) {
    return (
      <div style={{ background: '#1a1d27', border: '1px solid #2a2d3a', borderRadius: 12, padding: 16, minHeight: 200 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8', marginBottom: 12 }}>🌧️ Rain & Temp</h3>
        <p style={{ fontSize: 13, color: '#94a3b8' }}>No hourly data available.</p>
      </div>
    );
  }

  const now = currentTime ? new Date(currentTime) : new Date();
  const nowStr = now.toISOString().slice(0, 13);
  const startIdx = hourly.time.findIndex((t) => t >= nowStr);
  const from = startIdx >= 0 ? startIdx : 0;
  const data = hourly.time.slice(from, from + 24).map((time, i) => {
    const idx = from + i;
    return {
      time: new Date(time).toLocaleTimeString('en-IN', { hour: 'numeric' }),
      temp: hourly.temperature_2m?.[idx],
      precip: hourly.precipitation_probability?.[idx] ?? 0,
      fill: barColor(hourly.precipitation_probability?.[idx]),
    };
  });

  return (
    <div style={{ background: '#1a1d27', border: '1px solid #2a2d3a', borderRadius: 12, padding: 16 }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8', marginBottom: 12 }}>🌧️ Rain & Temp (24h)</h3>
      {(weatherUnion?.rain_intensity != null || weatherUnion?.rain_accumulation != null) && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 12, fontSize: 12, color: '#94a3b8' }}>
          {weatherUnion.rain_intensity != null && <span>Intensity: {weatherUnion.rain_intensity} mm/min</span>}
          {weatherUnion.rain_accumulation != null && <span>Total: {weatherUnion.rain_accumulation} mm</span>}
        </div>
      )}
      <div style={{ width: '100%', height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
            <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#94a3b8' }} stroke="#2a2d3a" />
            <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#94a3b8' }} stroke="#2a2d3a" />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#94a3b8' }} stroke="#2a2d3a" />
            <Tooltip contentStyle={{ background: '#1a1d27', border: '1px solid #2a2d3a', borderRadius: 8 }} labelStyle={{ color: '#fff' }} />
            <Bar yAxisId="left" dataKey="precip" fill="#4f9cf9" radius={[4, 4, 0, 0]} name="Precip %" />
            <Line yAxisId="right" type="monotone" dataKey="temp" stroke="#f59e0b" strokeWidth={2} dot={false} name="Temp °C" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
