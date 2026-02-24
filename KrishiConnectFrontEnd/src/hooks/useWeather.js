/**
 * useWeather — fetches WeatherUnion (primary), Open-Meteo (fallback + extended), AQI, BigDataCloud geocode.
 * All API calls in parallel. Auto-refresh every 10 min. Generates alerts from data.
 */
import { useState, useEffect, useCallback, useRef } from 'react';

const WEATHER_UNION_PATH = '/weather-api/gw/weather/external/v0/get_weather_data';
const OPEN_METEO_FORECAST = 'https://api.open-meteo.com/v1/forecast';
const OPEN_METEO_AQI = 'https://air-quality-api.open-meteo.com/v1/air-quality';
const BIGDATA_REVERSE = 'https://api.bigdatacloud.net/data/reverse-geocode-client';
const BIGDATA_FORWARD = 'https://api.bigdatacloud.net/data/geocode-client';
const REFRESH_INTERVAL_MS = 10 * 60 * 1000;

function getWeatherUnionKey() {
  return import.meta.env.VITE_WEATHER_UNION_KEY || import.meta.env.VITE_WEATHER_API_KEY || '';
}

function degreesToCompass(deg) {
  if (deg == null || Number.isNaN(Number(deg))) return null;
  const d = Number(deg);
  const labels = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return labels[Math.round(d / 45) % 8] || null;
}

/** Open-Meteo WMO weather code → label */
export const WMO_CODE_LABELS = {
  0: 'Clear Sky',
  1: 'Mainly Clear',
  2: 'Partly Cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Icy Fog',
  51: 'Light Drizzle',
  53: 'Drizzle',
  61: 'Light Rain',
  63: 'Rain',
  65: 'Heavy Rain',
  71: 'Light Snow',
  73: 'Snow',
  75: 'Heavy Snow',
  80: 'Rain Showers',
  81: 'Moderate Showers',
  82: 'Violent Showers',
  95: 'Thunderstorm',
  96: 'Hail Thunderstorm',
  99: 'Heavy Hail',
};

export function getWeatherLabel(code) {
  return WMO_CODE_LABELS[code] ?? 'Unknown';
}

async function fetchWeatherUnion(lat, lon) {
  const key = getWeatherUnionKey();
  if (!key?.trim()) return null;
  const url = `${WEATHER_UNION_PATH}?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}`;
  try {
    const res = await fetch(url, { method: 'GET', headers: { 'x-zomato-api-key': key.trim() } });
    if (!res.ok) return null;
    const body = await res.json();
    const locality = body?.locality_weather_data;
    if (locality == null || (typeof locality === 'object' && Object.keys(locality).length === 0)) return null;
    return {
      temperature: locality.temperature != null ? Number(locality.temperature) : null,
      humidity: locality.humidity != null ? Number(locality.humidity) : null,
      wind_speed: locality.wind_speed != null ? Number(locality.wind_speed) : null,
      wind_direction: locality.wind_direction != null ? Number(locality.wind_direction) : null,
      wind_direction_compass: degreesToCompass(locality.wind_direction),
      rain_intensity: locality.rain_intensity != null ? Number(locality.rain_intensity) : null,
      rain_accumulation: locality.rain_accumulation != null ? Number(locality.rain_accumulation) : null,
    };
  } catch {
    return null;
  }
}

async function fetchOpenMeteo(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    timezone: 'auto',
    forecast_days: '7',
    current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,weather_code,apparent_temperature,precipitation,surface_pressure,visibility,uv_index',
    hourly: 'temperature_2m,precipitation_probability,weather_code,wind_speed_10m,uv_index,visibility',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,uv_index_max,sunrise,sunset,precipitation_probability_max',
  });
  try {
    const res = await fetch(`${OPEN_METEO_FORECAST}?${params}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchAirQuality(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    timezone: 'auto',
    current: 'pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,ozone,european_aqi,us_aqi',
  });
  try {
    const res = await fetch(`${OPEN_METEO_AQI}?${params}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchReverseGeocode(lat, lon) {
  try {
    const res = await fetch(
      `${BIGDATA_REVERSE}?latitude=${lat}&longitude=${lon}&localityLanguage=en`
    );
    const data = await res.json();
    return {
      city: data.city || data.locality || data.principalSubdivision || 'Unknown Location',
      area: data.localityInfo?.administrative?.[2]?.name || data.locality || '',
      country: data.countryName || '',
    };
  } catch {
    return { city: 'Unknown Location', area: '', country: '' };
  }
}

/** BigDataCloud forward geocode for city search */
export async function forwardGeocode(query) {
  try {
    const res = await fetch(
      `${BIGDATA_FORWARD}?q=${encodeURIComponent(query)}&localityLanguage=en`
    );
    const data = await res.json();
    const loc = data?.location;
    if (loc?.latitude == null || loc?.longitude == null) return null;
    return { lat: loc.latitude, lon: loc.longitude, city: loc.city || loc.locality || query, country: loc.countryName || '' };
  } catch {
    return null;
  }
}

/** Indian cities fallback when forward geocode fails. Sorted by name; Mumbai first for default. */
import { INDIAN_CITIES_WITH_COORDS } from '../data/indianCitiesWithCoords';
export const INDIAN_CITIES = INDIAN_CITIES_WITH_COORDS;

function buildAlerts(weatherUnion, openMeteo, airQuality) {
  const alerts = [];
  const current = openMeteo?.current;
  const aqi = airQuality?.current?.european_aqi ?? airQuality?.current?.us_aqi;
  const temp = weatherUnion?.temperature ?? current?.temperature_2m;
  const wind = weatherUnion?.wind_speed ?? current?.wind_speed_10m;
  const uv = current?.uv_index;
  const rainIntensity = weatherUnion?.rain_intensity;

  if (rainIntensity != null && rainIntensity > 2.5) {
    alerts.push({ id: 'rain', severity: 'high', message: 'Heavy Rain Alert: Intense rainfall detected', icon: '🌧️' });
  }
  if (wind != null && wind > 40) {
    alerts.push({ id: 'wind', severity: 'high', message: 'High Wind Alert: Strong winds in your area', icon: '💨' });
  }
  if (uv != null && uv > 8) {
    alerts.push({ id: 'uv', severity: 'high', message: 'UV Alert: Extreme UV levels, stay protected', icon: '☀️' });
  }
  if (aqi != null && aqi > 150) {
    alerts.push({ id: 'aqi', severity: 'high', message: 'Air Quality Alert: Unhealthy air, limit outdoor exposure', icon: '😷' });
  }
  if (temp != null && temp > 40) {
    alerts.push({ id: 'heat', severity: 'high', message: 'Heat Alert: Extreme heat conditions', icon: '🔥' });
  }
  if (temp != null && temp < 5) {
    alerts.push({ id: 'cold', severity: 'moderate', message: 'Cold Alert: Near freezing temperatures', icon: '🥶' });
  }
  if (uv != null && uv > 6 && uv <= 8) {
    alerts.push({ id: 'uv-moderate', severity: 'moderate', message: 'High UV: Wear sunscreen and hat', icon: '☀️' });
  }
  if (aqi != null && aqi > 100 && aqi <= 150) {
    alerts.push({ id: 'aqi-moderate', severity: 'moderate', message: 'Moderate air quality: Sensitive people limit outdoor time', icon: '😷' });
  }
  return alerts;
}

function mergeCurrent(weatherUnion, openMeteo, location) {
  const current = openMeteo?.current ?? {};
  const wu = weatherUnion ?? {};
  const code = current.weather_code;
  return {
    temperature: wu.temperature ?? current.temperature_2m,
    feelsLike: wu.temperature ?? current.apparent_temperature ?? current.temperature_2m,
    humidity: wu.humidity ?? current.relative_humidity_2m,
    windSpeed: wu.wind_speed ?? current.wind_speed_10m,
    windDirection: wu.wind_direction_compass ?? degreesToCompass(current.wind_direction_10m),
    windDirectionDeg: wu.wind_direction ?? current.wind_direction_10m,
    weatherCode: code,
    condition: getWeatherLabel(code),
    precipitation: current.precipitation,
    pressure: current.surface_pressure,
    visibility: current.visibility != null ? current.visibility / 1000 : null,
    uvIndex: current.uv_index,
    rainIntensity: wu.rain_intensity,
    rainAccumulation: wu.rain_accumulation,
    location: location ? [location.city, location.area, location.country].filter(Boolean).join(', ') : 'Unknown',
    country: location?.country ?? '',
  };
}

/**
 * @param {{ lat: number, lon: number } | null} coords - null = not yet located
 * @returns useWeather result
 */
export function useWeather(coords) {
  const [currentWeather, setCurrentWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [hourly, setHourly] = useState(null);
  const [airQuality, setAirQuality] = useState(null);
  const [location, setLocation] = useState(null);
  const [weatherUnion, setWeatherUnion] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const intervalRef = useRef(null);

  const refetch = useCallback(async () => {
    if (!coords || typeof coords.lat !== 'number' || typeof coords.lon !== 'number') return;
    const { lat, lon } = coords;
    setIsLoading(true);
    setError(null);
    try {
      const [wu, openMeteo, aqi, geo] = await Promise.all([
        fetchWeatherUnion(lat, lon),
        fetchOpenMeteo(lat, lon),
        fetchAirQuality(lat, lon),
        fetchReverseGeocode(lat, lon),
      ]);
      setWeatherUnion(wu);
      setLocation(geo);
      setAirQuality(aqi?.current ? { current: aqi.current } : null);

      if (!openMeteo) {
        setError('Unable to load forecast. Please try again.');
        setCurrentWeather(null);
        setForecast(null);
        setHourly(null);
        setAlerts([]);
        return;
      }

      const merged = mergeCurrent(wu, openMeteo, geo);
      setCurrentWeather(merged);
      setForecast(openMeteo.daily ?? null);
      setHourly(openMeteo.hourly ?? null);
      setAlerts(buildAlerts(wu, openMeteo, aqi));
      setLastUpdated(Date.now());
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  }, [coords?.lat, coords?.lon]);

  useEffect(() => {
    if (coords?.lat != null && coords?.lon != null) refetch();
  }, [refetch, coords?.lat, coords?.lon]);

  useEffect(() => {
    if (!coords || typeof coords.lat !== 'number' || typeof coords.lon !== 'number') return;
    intervalRef.current = setInterval(refetch, REFRESH_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refetch, coords?.lat, coords?.lon]);

  return {
    currentWeather,
    forecast,
    hourly,
    airQuality,
    location,
    weatherUnion,
    alerts,
    isLoading,
    error,
    refetch,
    lastUpdated,
  };
}
