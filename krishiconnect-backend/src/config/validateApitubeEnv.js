/**
 * Validates APITube environment variables at startup.
 * Call only when APITube integration is enabled (e.g. when mounting apitube routes).
 * Throws with a clear message if required vars are missing.
 * Never logs secret values.
 */

function validateApitubeEnv() {
  const baseUrl = process.env.APITUBE_BASE_URL;
  const key = process.env.APITUBE_KEY;

  if (!key || typeof key !== 'string' || key.trim() === '') {
    throw new Error(
      'APITube integration requires APITUBE_KEY. Set it in .env or disable the integration.'
    );
  }

  if (!baseUrl || typeof baseUrl !== 'string' || baseUrl.trim() === '') {
    throw new Error(
      'APITube integration requires APITUBE_BASE_URL (e.g. https://api.apitube.io/v1). Set it in .env.'
    );
  }

  const url = baseUrl.trim().replace(/\/$/, '');
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('APITUBE_BASE_URL must use http or https');
    }
  } catch (e) {
    if (e.message && e.message.includes('http')) throw e;
    throw new Error('APITUBE_BASE_URL must be a valid URL');
  }

  const timeout = process.env.APITUBE_TIMEOUT;
  if (timeout !== undefined && timeout !== '') {
    const num = Number(timeout, 10);
    if (Number.isNaN(num) || num < 1000 || num > 60000) {
      throw new Error('APITUBE_TIMEOUT must be a number between 1000 and 60000 (ms)');
    }
  }
}

module.exports = { validateApitubeEnv };
