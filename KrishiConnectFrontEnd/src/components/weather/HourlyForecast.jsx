import React from 'react';
import { getWeatherLabel } from '../../hooks/useWeather';

const WEATHER_EMOJI = { 0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️', 45: '🌫️', 48: '🌫️', 51: '🌦️', 53: '🌦️', 61: '🌧️', 63: '🌧️', 65: '🌧️', 71: '🌨️', 73: '🌨️', 75: '🌨️', 80: '🌦️', 81: '🌧️', 82: '🌧️', 95: '⛈️', 96: '⛈️', 99: '⛈️' };

const cardStyle = {
  background: '#1a1d27',
  border: '1px solid #2a2d3a',
  borderRadius: 12,
  padding: 12,
  minWidth: 72,
  flexShrink: 0,
  textAlign: 'center',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};
const currentCardStyle = { ...cardStyle, borderColor: '#4f9cf9', boxShadow: '0 0 0 2px rgba(79,156,249,0.3)' };

export default function HourlyForecast({ hourly, currentTime }) {
  if (!hourly?.time?.length) return null;

  const now = currentTime ? new Date(currentTime) : new Date();
  const nowHour = now.toISOString().slice(0, 13);
  const startIndex = hourly.time.findIndex((t) => t >= nowHour.slice(0, 13));
  const from = startIndex >= 0 ? startIndex : 0;
  const next24 = hourly.time.slice(from, from + 24).map((time, i) => {
    const idx = from + i;
    return {
      time,
      temp: hourly.temperature_2m?.[idx],
      precip: hourly.precipitation_probability?.[idx],
      code: hourly.weather_code?.[idx],
      wind: hourly.wind_speed_10m?.[idx],
    };
  });

  if (!next24.length) return null;

  return (
    <div style={{ marginBottom: 16 }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8', marginBottom: 12 }}>⏰ Hourly (24h)</h3>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8 }}>
        {next24.map((hour, i) => {
          const isCurrent = i === 0 && hour.time?.startsWith(nowHour.slice(0, 13));
          const timeStr = hour.time ? new Date(hour.time).toLocaleTimeString('en-IN', { hour: 'numeric' }) : '—';
          return (
            <div key={hour.time || i} style={isCurrent ? currentCardStyle : cardStyle}>
              <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>{timeStr}</div>
              <div style={{ fontSize: 20, marginBottom: 2 }}>{WEATHER_EMOJI[hour.code] ?? '⛅'}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{hour.temp != null ? `${hour.temp}°` : '—'}</div>
              <div style={{ fontSize: 10, color: '#94a3b8' }}>💧 {hour.precip != null ? `${hour.precip}%` : '—'}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
