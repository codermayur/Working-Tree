/**
 * Shared weather location (coords) for Home weather card and Weather page.
 * Persists to localStorage so city/location stays in sync across pages and reloads.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { INDIAN_CITIES } from '../hooks/useWeather';

const STORAGE_KEY = 'weather_coords';
const DEFAULT_COORDS = { lat: INDIAN_CITIES[0].lat, lon: INDIAN_CITIES[0].lon };

function loadStoredCoords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.lat === 'number' && typeof parsed.lon === 'number') {
      return { lat: parsed.lat, lon: parsed.lon };
    }
  } catch (_) {}
  return null;
}

function saveCoords(coords) {
  if (!coords || typeof coords.lat !== 'number' || typeof coords.lon !== 'number') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ lat: coords.lat, lon: coords.lon }));
  } catch (_) {}
}

const WeatherContext = createContext(null);

export function WeatherProvider({ children }) {
  const [coords, setCoordsState] = useState(() => loadStoredCoords() ?? DEFAULT_COORDS);
  const [coordsInitialized, setCoordsInitialized] = useState(!!loadStoredCoords());

  const setCoords = useCallback((next) => {
    if (next == null) {
      setCoordsState(DEFAULT_COORDS);
      saveCoords(DEFAULT_COORDS);
      return;
    }
    const lat = next.lat;
    const lon = next.lon;
    if (typeof lat === 'number' && typeof lon === 'number' && Number.isFinite(lat) && Number.isFinite(lon)) {
      const value = { lat, lon };
      setCoordsState(value);
      saveCoords(value);
    }
  }, []);

  // First load: if no stored coords, try geolocation then fallback to default (same as WeatherPage)
  useEffect(() => {
    if (coordsInitialized) return;
    setCoordsInitialized(true);
    if (!navigator.geolocation) {
      setCoordsState(DEFAULT_COORDS);
      saveCoords(DEFAULT_COORDS);
      return;
    }
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((permission) => {
        if (permission.state === 'denied') {
          setCoordsState(DEFAULT_COORDS);
          saveCoords(DEFAULT_COORDS);
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const value = { lat: pos.coords.latitude, lon: pos.coords.longitude };
            setCoordsState(value);
            saveCoords(value);
          },
          () => {
            setCoordsState(DEFAULT_COORDS);
            saveCoords(DEFAULT_COORDS);
          },
          { timeout: 8000, maximumAge: 300000, enableHighAccuracy: false }
        );
      }).catch(() => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const value = { lat: pos.coords.latitude, lon: pos.coords.longitude };
            setCoordsState(value);
            saveCoords(value);
          },
          () => {
            setCoordsState(DEFAULT_COORDS);
            saveCoords(DEFAULT_COORDS);
          },
          { timeout: 8000, maximumAge: 300000, enableHighAccuracy: false }
        );
      });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const value = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        setCoordsState(value);
        saveCoords(value);
      },
      () => {
        setCoordsState(DEFAULT_COORDS);
        saveCoords(DEFAULT_COORDS);
      },
      { timeout: 8000, maximumAge: 300000, enableHighAccuracy: false }
    );
  }, [coordsInitialized]);

  const value = { coords, setCoords };

  return (
    <WeatherContext.Provider value={value}>
      {children}
    </WeatherContext.Provider>
  );
}

export function useWeatherCoords() {
  const ctx = useContext(WeatherContext);
  if (!ctx) {
    throw new Error('useWeatherCoords must be used within WeatherProvider');
  }
  return ctx;
}

export default WeatherContext;
