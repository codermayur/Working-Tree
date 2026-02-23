import React from 'react';
import { getWeatherLabel } from '../../hooks/useWeather';

const WEATHER_EMOJI = { 0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️', 45: '🌫️', 48: '🌫️', 51: '🌦️', 53: '🌦️', 61: '🌧️', 63: '🌧️', 65: '🌧️', 71: '🌨️', 73: '🌨️', 75: '🌨️', 80: '🌦️', 81: '🌧️', 82: '🌧️', 95: '⛈️', 96: '⛈️', 99: '⛈️' };

const cardStyle = {
  background: '#1a1d27',
  border: '1px solid #2a2d3a',
  borderRadius: 12,
  padding: 16,
  minWidth: 100,
  flexShrink: 0,
  textAlign: 'center',
};

export default function DailyForecast({ forecast }) {
  if (!forecast?.time?.length) return null;

  const days = forecast.time.map((date, i) => ({
    date,
    dayName: i === 0 ? 'Today' : new Date(date).toLocaleDateString('en-IN', { weekday: 'short' }),
    code: forecast.weather_code?.[i],
    max: forecast.temperature_2m_max?.[i],
    min: forecast.temperature_2m_min?.[i],
    precip: forecast.precipitation_probability_max?.[i],
    wind: forecast.wind_speed_10m_max?.[i],
    uv: forecast.uv_index_max?.[i],
  }));

  return (
    <div style={{ marginBottom: 16 }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8', marginBottom: 12 }}>📅 7-Day Forecast</h3>
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8 }}>
        {days.map((d) => (
          <div key={d.date} style={cardStyle}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>{d.dayName}</div>
            <div style={{ fontSize: 24, marginBottom: 4 }}>{WEATHER_EMOJI[d.code] ?? '⛅'}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{d.max != null ? `${d.max}°` : '—'}</div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>{d.min != null ? `${d.min}°` : '—'} min</div>
            <div style={{ fontSize: 10, color: '#4f9cf9', marginTop: 4 }}>💧 {d.precip != null ? `${d.precip}%` : '—'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
