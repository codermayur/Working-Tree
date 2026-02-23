import React from 'react';
import WeatherMapLeaflet from './WeatherMapLeaflet';

// TODO: Add OWM tile key for clouds/precipitation overlay: https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid={KEY}
export default function WeatherMap({ lat, lon, locationName, condition, temperature }) {
  if (lat == null || lon == null) {
    return (
      <div style={{ background: '#1a1d27', border: '1px solid #2a2d3a', borderRadius: 12, padding: 16, minHeight: 200 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8', marginBottom: 12 }}>🗺️ Weather Map</h3>
        <p style={{ fontSize: 13, color: '#94a3b8' }}>Location required.</p>
      </div>
    );
  }

  return (
    <div style={{ background: '#1a1d27', border: '1px solid #2a2d3a', borderRadius: 12, overflow: 'hidden' }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8', marginBottom: 0, padding: 12 }}>🗺️ Weather Map</h3>
      <WeatherMapLeaflet lat={lat} lon={lon} locationName={locationName} condition={condition} temperature={temperature} />
    </div>
  );
}
