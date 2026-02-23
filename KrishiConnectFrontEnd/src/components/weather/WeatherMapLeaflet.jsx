import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Fix default marker icons in bundler
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function WeatherMapLeaflet({ lat, lon, locationName, condition, temperature }) {
  return (
    <MapContainer center={[lat, lon]} zoom={10} style={{ height: 280, borderRadius: 12 }} scrollWheelZoom={false}>
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker position={[lat, lon]}>
        <Popup>
          <strong>{locationName || 'Your location'}</strong>
          <br />
          {temperature != null && `${temperature}°C`}
          {condition && ` · ${condition}`}
        </Popup>
      </Marker>
    </MapContainer>
  );
}
