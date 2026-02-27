/**
 * Government schemes data — loaded from public JSON.
 * In production you can replace with API.
 */
const SCHEMES_URL = '/data/schemes.json';

let cached = null;

function slugFromRedirectUrl(redirect_url) {
  if (!redirect_url || typeof redirect_url !== 'string') return null;
  const path = redirect_url.replace(/^\/+/, '').replace(/\/+$/, '');
  if (path.startsWith('schemes/')) return path.replace(/^schemes\/?/, '');
  return null;
}

function slugFromName(name) {
  if (!name || typeof name !== 'string') return null;
  return name
    .toLowerCase()
    .replace(/[\s()–—]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function fetchSchemes() {
  if (cached) return cached;
  const res = await fetch(SCHEMES_URL);
  if (!res.ok) throw new Error('Failed to load schemes');
  const data = await res.json();
  const raw = data?.schemes ?? [];
  // Slug for detail route; apply URL = official_url (external) or redirect_url
  cached = raw.map((s) => {
    const slug =
      s.slug ??
      slugFromRedirectUrl(s.redirect_url) ??
      slugFromName(s.name) ??
      (typeof s.id === 'number' ? String(s.id) : s.id);
    const redirect_url = s.official_url ?? s.redirect_url;
    return { ...s, slug, redirect_url };
  });
  return cached;
}

export function getSchemeBySlug(schemes, slug) {
  return schemes?.find((s) => s.slug === slug || s.id === slug) ?? null;
}

export function getCategories(schemes) {
  const set = new Set(schemes?.map((s) => s.category).filter(Boolean) ?? []);
  return Array.from(set).sort();
}

export function isExternalUrl(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    const u = new URL(url, window.location.origin);
    return u.origin !== window.location.origin;
  } catch {
    return false;
  }
}
