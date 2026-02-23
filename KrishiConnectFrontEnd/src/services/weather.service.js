/**
 * Backend weather API: GET /weather/current by state and district.
 * Uses shared api (VITE_API_URL). Response: { data: { location, current, forecast?, alerts? } }.
 */
import { api } from './api';

/**
 * Fetch current weather from backend by state and district (e.g. for Browse by State).
 * @param {string} state - State or UT name
 * @param {string} district - City/district name
 * @returns {Promise<{ location: { state, district }, current: object, forecast?, alerts? } | null>}
 */
export async function getCurrentWeatherByLocation(state, district) {
  if (!state?.trim() || !district?.trim()) return null;
  try {
    const { data } = await api.get('/weather/current', {
      params: { state: state.trim(), district: district.trim() },
    });
    return data?.data ?? null;
  } catch {
    return null;
  }
}
