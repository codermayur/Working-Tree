import React, { useState, useEffect } from 'react';
import { getWeatherLabel } from '../../hooks/useWeather';

const GRADIENTS = {
  clear: 'linear-gradient(135deg, #1e3a5f 0%, #4f9cf9 50%, #7dd3fc 100%)',
  cloudy: 'linear-gradient(135deg, #374151 0%, #4b5563 50%, #6b7280 100%)',
  rain: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 50%, #3b82f6 100%)',
  storm: 'linear-gradient(135deg, #312e81 0%, #4c1d95 50%, #6d28d9 100%)',
  default: 'linear-gradient(135deg, #1e3a5f 0%, #334155 100%)',
};

function getGradient(weatherCode) {
  if (weatherCode == null) return GRADIENTS.default;
  if ([95, 96, 99].includes(weatherCode)) return GRADIENTS.storm;
  if ([0, 1].includes(weatherCode)) return GRADIENTS.clear;
  if ([2, 3, 45, 48].includes(weatherCode)) return GRADIENTS.cloudy;
  if ([51, 53, 61, 63, 65, 80, 81, 82].includes(weatherCode)) return GRADIENTS.rain;
  return GRADIENTS.default;
}

const WEATHER_EMOJI = {
  0: '☀️',
  1: '🌤️',
  2: '⛅',
  3: '☁️',
  45: '🌫️',
  48: '🌫️',
  51: '🌦️',
  53: '🌦️',
  61: '🌧️',
  63: '🌧️',
  65: '🌧️',
  71: '🌨️',
  73: '🌨️',
  75: '🌨️',
  80: '🌦️',
  81: '🌧️',
  82: '🌧️',
  95: '⛈️',
  96: '⛈️',
  99: '⛈️',
};

export default function HeroCard({ currentWeather, locationName, liveTime }) {
  const [time, setTime] = useState(liveTime ?? new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!currentWeather) return null;

  const gradient = getGradient(currentWeather.weatherCode);
  const emoji = WEATHER_EMOJI[currentWeather.weatherCode] ?? '⛅';
  const temp = currentWeather.temperature != null ? Math.round(currentWeather.temperature) : '—';
  const feels = currentWeather.feelsLike != null ? Math.round(currentWeather.feelsLike) : null;

  return (
    <div
      style={{
        background: gradient,
        borderRadius: 16,
        padding: 24,
        border: '1px solid #2a2d3a',
        minHeight: 220,
        transition: 'background 0.5s ease',
      }}
    >
      <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, marginBottom: 4 }}>
        {locationName || currentWeather.location}
      </div>
      <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 12 }}>
        {time.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} · {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <span style={{ fontSize: 56, fontWeight: 800, color: '#fff', lineHeight: 1, letterSpacing: '-0.02em' }}>
            {temp}°
          </span>
          <span style={{ fontSize: 24, color: 'rgba(255,255,255,0.8)', marginLeft: 4 }}>C</span>
        </div>
        <div style={{ paddingTop: 8 }}>
          <span style={{ fontSize: 36 }}>{emoji}</span>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginTop: 4 }}>
            {getWeatherLabel(currentWeather.weatherCode)}
          </div>
          {feels != null && (
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>Feels like {feels}°C</div>
          )}
        </div>
      </div>
    </div>
  );
}
