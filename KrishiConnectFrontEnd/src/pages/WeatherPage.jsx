/**
 * Weather Dashboard — layout orchestrator.
 * Data from useWeather (WeatherUnion + Open-Meteo + BigDataCloud).
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCw, Navigation, AlertCircle } from 'lucide-react';
import { useWeather, forwardGeocode, INDIAN_CITIES } from '../hooks/useWeather';
import {
  AlertBanner,
  HeroCard,
  StatsGrid,
  HourlyForecast,
  DailyForecast,
  SunriseSunset,
  AQICard,
  UVCard,
  RainRadar,
  WeatherMap,
} from '../components/weather';

const DASHBOARD_STYLE = {
  background: '#0f1117',
  minHeight: '100vh',
  color: '#ffffff',
  padding: '16px',
};

const SEARCH_STYLE = {
  display: 'flex',
  gap: 10,
  marginBottom: 16,
  flexWrap: 'wrap',
};

const PERMISSION_BANNER = {
  background: '#1a1d27',
  border: '1px solid #f59e0b',
  borderRadius: 12,
  padding: 16,
  marginBottom: 16,
  display: 'flex',
  alignItems: 'center',
  gap: 12,
};

export default function WeatherPage() {
  const [coords, setCoords] = useState(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [liveTime, setLiveTime] = useState(() => new Date());

  const {
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
  } = useWeather(coords);

  useEffect(() => {
    const t = setInterval(() => setLiveTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const triggerLocationFetch = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setLocationDenied(false);
        setLocationError(null);
      },
      (err) => {
        if (err.code === 1) setLocationError('denied');
        else if (err.code === 2) setLocationError('unavailable');
        else if (err.code === 3) setLocationError('timeout');
        setLocationDenied(true);
        setCoords({ lat: INDIAN_CITIES[0].lat, lon: INDIAN_CITIES[0].lon });
      },
      { timeout: 8000, maximumAge: 300000, enableHighAccuracy: false }
    );
  }, []);

  useEffect(() => {
    if (coords) return;
    if (!navigator.geolocation) {
      setLocationDenied(true);
      setCoords({ lat: INDIAN_CITIES[0].lat, lon: INDIAN_CITIES[0].lon });
      return;
    }
    const getLocation = async () => {
      if ('permissions' in navigator) {
        try {
          const permission = await navigator.permissions.query({ name: 'geolocation' });
          if (permission.state === 'denied') {
            setLocationError('blocked');
            setLocationDenied(true);
            setCoords({ lat: INDIAN_CITIES[0].lat, lon: INDIAN_CITIES[0].lon });
            return;
          }
          permission.onchange = () => {
            if (permission.state === 'granted') triggerLocationFetch();
          };
        } catch (_) {}
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
          setLocationDenied(false);
          setLocationError(null);
        },
        (err) => {
          if (err.code === 1) setLocationError('denied');
          else if (err.code === 2) setLocationError('unavailable');
          else if (err.code === 3) setLocationError('timeout');
          setLocationDenied(true);
          setCoords({ lat: INDIAN_CITIES[0].lat, lon: INDIAN_CITIES[0].lon });
        },
        { timeout: 8000, maximumAge: 300000, enableHighAccuracy: false }
      );
    };
    getLocation();
  }, [coords, triggerLocationFetch]);

  const setCoordsFromQuery = useCallback(async (query, setLoading) => {
    const q = query?.trim();
    if (!q) return;
    setLoading(true);
    try {
      const geo = await forwardGeocode(q);
      if (geo) {
        setCoords({ lat: geo.lat, lon: geo.lon });
        setLocationDenied(false);
      } else {
        const city = INDIAN_CITIES.find((c) => c.name.toLowerCase().includes(q.toLowerCase()));
        if (city) {
          setCoords({ lat: city.lat, lon: city.lon });
          setLocationDenied(false);
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = useCallback((e) => {
    e?.preventDefault();
    setCoordsFromQuery(searchInput, setSearchLoading);
  }, [searchInput, setCoordsFromQuery]);

  const handleQuickPickChange = useCallback((e) => {
    const v = e.target.value;
    if (v) {
      const c = INDIAN_CITIES.find((x) => x.name === v);
      if (c) setCoords({ lat: c.lat, lon: c.lon });
    }
  }, []);

  const locationName = location ? [location.city, location.area, location.country].filter(Boolean).join(', ') : currentWeather?.location;
  const lastUpdatedMins = lastUpdated ? Math.round((Date.now() - lastUpdated) / 60000) : null;

  return (
    <div style={DASHBOARD_STYLE}>
      <style>{`
        .weather-grid {
          display: grid;
          gap: 16px;
          align-items: start;
          grid-template-columns: 1fr;
        }
        @media (min-width: 768px) {
          .weather-grid {
            grid-template-columns: 1fr 1fr;
          }
          .weather-hero { grid-column: 1; }
          .weather-stats { grid-column: 2; }
          .weather-hourly { grid-column: 1 / -1; }
          .weather-sun-aqi-uv {
            grid-column: 1 / -1;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
          }
          .weather-daily { grid-column: 1 / -1; }
          .weather-rain { grid-column: 1; }
          .weather-map { grid-column: 2; }
        }
        @media (min-width: 1024px) {
          .weather-grid {
            grid-template-columns: 1fr 280px;
            grid-template-rows: auto auto auto auto auto auto;
            gap: 16px;
          }
          .weather-hero { grid-column: 1; grid-row: 1; }
          .weather-stats { grid-column: 2; grid-row: 1 / 3; }
          .weather-hourly { grid-column: 1 / -1; grid-row: 2; }
          .weather-sun-aqi-uv {
            grid-column: 1 / -1;
            grid-row: 3;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
          }
          .weather-daily { grid-column: 1 / -1; grid-row: 4; }
          .weather-rain { grid-column: 1; grid-row: 5; }
          .weather-map { grid-column: 2; grid-row: 5; }
        }
      `}</style>

      <div style={{ marginBottom: 16 }}>
        <form onSubmit={handleSearch} style={SEARCH_STYLE}>
          <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search city or use quick pick..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 40px',
                background: '#1a1d27',
                border: '1px solid #2a2d3a',
                borderRadius: 12,
                color: '#fff',
                fontSize: 14,
              }}
            />
          </div>
          <button type="submit" disabled={searchLoading} style={{ padding: '10px 20px', background: '#4f9cf9', border: 'none', borderRadius: 12, color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
            {searchLoading ? '...' : 'Search'}
          </button>
          <select
            onChange={handleQuickPickChange}
            style={{ padding: '10px 12px', background: '#1a1d27', border: '1px solid #2a2d3a', borderRadius: 12, color: '#fff', minWidth: 140 }}
          >
            <option value="">Quick: Indian cities</option>
            {INDIAN_CITIES.map((c) => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
          <button type="button" onClick={triggerLocationFetch} style={{ padding: '10px 16px', background: '#1a1d27', border: '1px solid #2a2d3a', borderRadius: 12, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Navigation size={18} /> Use GPS
          </button>
        </form>
        <div style={{ fontSize: 12, color: '#94a3b8' }}>
          {locationName && <span>{locationName}</span>}
          {lastUpdatedMins != null && <span style={{ marginLeft: 12 }}>Last updated: {lastUpdatedMins} min ago</span>}
        </div>
      </div>

      {locationError === 'blocked' && (
        <div style={{ ...PERMISSION_BANNER, flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
            <AlertCircle size={24} color="#f59e0b" />
            <span style={{ fontWeight: 600 }}>Location access is blocked by your browser.</span>
          </div>
          <p style={{ margin: 0, fontSize: 14, color: '#94a3b8' }}>
            To enable: Click the 🔒 lock icon in your browser&apos;s address bar → Site Settings → Location → Allow
          </p>
          <button type="button" onClick={() => setLocationError(null)} style={{ padding: '10px 20px', background: '#2a2d3a', border: '1px solid #3a3d4a', borderRadius: 12, color: '#fff', cursor: 'pointer', fontSize: 14 }}>
            Search City Manually Instead
          </button>
        </div>
      )}

      {locationDenied && locationError !== 'blocked' && (
        <div style={PERMISSION_BANNER}>
          <AlertCircle size={24} color="#f59e0b" />
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontWeight: 600 }}>Location access denied. Showing Mumbai. Allow location or search for another city.</p>
          </div>
        </div>
      )}

      {error && (
        <div style={{ background: '#1a1d27', border: '1px solid #ef4444', borderRadius: 12, padding: 16, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: '#ef4444' }}>{error}</span>
          <button type="button" onClick={() => coords && refetch()} style={{ padding: '8px 16px', background: '#ef4444', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer' }}>Retry</button>
        </div>
      )}

      {!coords && !locationDenied && (
        <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Getting location…</div>
      )}

      {coords && (
        <>
          <AlertBanner alerts={alerts} />
          <div style={{ display: 'flex', gap: 16, marginBottom: 16, alignItems: 'flex-start' }}>
            <button type="button" onClick={refetch} disabled={isLoading} style={{ padding: '8px 14px', background: '#1a1d27', border: '1px solid #2a2d3a', borderRadius: 10, color: '#94a3b8', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>

          {isLoading && !currentWeather ? (
            <div style={{ background: '#1a1d27', border: '1px solid #2a2d3a', borderRadius: 16, padding: 40, textAlign: 'center', color: '#94a3b8' }}>
              Loading weather…
            </div>
          ) : (
            <div className="weather-grid">
              <div className="weather-hero">
                <HeroCard currentWeather={currentWeather} locationName={locationName} liveTime={liveTime} />
              </div>
              <div className="weather-stats">
                <StatsGrid currentWeather={currentWeather} weatherUnion={weatherUnion} />
              </div>
              <div className="weather-hourly" style={{ gridColumn: '1 / -1' }}>
                <HourlyForecast hourly={hourly} currentTime={liveTime?.toISOString?.() ?? new Date().toISOString()} />
              </div>
              <div className="weather-sun-aqi-uv">
                <SunriseSunset forecast={forecast} />
                <AQICard airQuality={airQuality} />
                <UVCard uvIndex={currentWeather?.uvIndex} />
              </div>
              <div className="weather-daily" style={{ gridColumn: '1 / -1' }}>
                <DailyForecast forecast={forecast} />
              </div>
              <div className="weather-rain">
                <RainRadar hourly={hourly} weatherUnion={weatherUnion} currentTime={liveTime} />
              </div>
              <div className="weather-map">
                <WeatherMap lat={coords.lat} lon={coords.lon} locationName={locationName} condition={currentWeather?.condition} temperature={currentWeather?.temperature} />
              </div>
            </div>
          )}
        </>
      )}

      {coords && !isLoading && navigator.onLine === false && (
        <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', background: '#ef4444', color: '#fff', padding: '10px 20px', borderRadius: 10, fontSize: 14, zIndex: 50 }}>
          You are offline
        </div>
      )}
    </div>
  );
}
