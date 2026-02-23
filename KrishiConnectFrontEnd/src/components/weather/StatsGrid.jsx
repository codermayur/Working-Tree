import React from 'react';
import { Wind, Droplets, Eye, Gauge, CloudRain, Thermometer } from 'lucide-react';

const cardStyle = {
  background: '#1a1d27',
  border: '1px solid #2a2d3a',
  borderRadius: 12,
  padding: 16,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 6,
  minWidth: 80,
};

const iconStyle = { color: '#4f9cf9' };
const valueStyle = { fontSize: 18, fontWeight: 700, color: '#ffffff' };
const labelStyle = { fontSize: 11, color: '#94a3b8' };

function StatCard({ icon: Icon, label, value, unit }) {
  const display = value != null && value !== '' ? `${value}${unit || ''}` : '—';
  return (
    <div style={cardStyle}>
      <Icon size={18} style={iconStyle} />
      <span style={valueStyle}>{display}</span>
      <span style={labelStyle}>{label}</span>
    </div>
  );
}

export default function StatsGrid({ currentWeather, weatherUnion }) {
  const w = currentWeather ?? {};
  const wu = weatherUnion ?? {};

  const windSpeed = w.windSpeed ?? wu.wind_speed;
  const windDir = w.windDirection ?? wu.wind_direction_compass;
  const windDisplay = windSpeed != null ? (windDir ? `${windSpeed} km/h ${windDir}` : `${windSpeed} km/h`) : null;
  const humidity = w.humidity ?? wu.humidity;
  const visibility = w.visibility;
  const pressure = w.pressure;
  const precipitation = w.precipitation;
  const rainIntensity = wu.rain_intensity;
  const rainAccumulation = wu.rain_accumulation;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <StatCard icon={Wind} label="Wind" value={windDisplay} unit="" />
      <StatCard icon={Droplets} label="Humidity" value={humidity} unit={humidity != null ? '%' : ''} />
      <StatCard icon={Eye} label="Visibility" value={visibility} unit={visibility != null ? ' km' : ''} />
      <StatCard icon={Gauge} label="Pressure" value={pressure} unit={pressure != null ? ' hPa' : ''} />
      <StatCard icon={CloudRain} label="Precipitation" value={precipitation} unit={precipitation != null ? ' mm' : ''} />
      <StatCard icon={Thermometer} label="Rain (mm/min)" value={rainIntensity} unit="" />
      <StatCard icon={CloudRain} label="Rain total" value={rainAccumulation} unit={rainAccumulation != null ? ' mm' : ''} />
    </div>
  );
}
