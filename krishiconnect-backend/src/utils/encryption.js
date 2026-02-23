/**
 * AES-256-GCM encryption for chat messages. Uses env CHAT_ENCRYPTION_KEY (32 bytes hex or base64).
 * IV is generated per message and stored with ciphertext. Never store plain text messages.
 */
const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

function getKey() {
  const raw = process.env.CHAT_ENCRYPTION_KEY || process.env.MESSAGE_SECRET;
  if (!raw || raw.length < 32) {
    throw new Error('CHAT_ENCRYPTION_KEY or MESSAGE_SECRET must be set and at least 32 characters');
  }
  if (Buffer.isBuffer(raw)) return raw.slice(0, KEY_LENGTH);
  const buf = raw.length === 64 && /^[0-9a-fA-F]+$/.test(raw)
    ? Buffer.from(raw, 'hex')
    : Buffer.from(raw, 'utf8');
  return crypto.createHash('sha256').update(buf).digest();
}

/**
 * Encrypt plaintext (string or object; objects are JSON.stringify'd).
 * @returns {{ encrypted: string, iv: string }} base64-encoded
 */
function encrypt(plaintext) {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const text = typeof plaintext === 'string' ? plaintext : JSON.stringify(plaintext);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const combined = Buffer.concat([encrypted, authTag]);
  return {
    encrypted: combined.toString('base64'),
    iv: iv.toString('base64'),
  };
}

/**
 * Decrypt payload.
 * @param {string} encrypted - base64
 * @param {string} iv - base64
 * @returns {string|object} decrypted string or parsed JSON object
 */
function decrypt(encrypted, iv, parseJson = true) {
  if (!encrypted || !iv) {
    throw new Error('Encrypted content and iv are required');
  }
  const key = getKey();
  const ivBuf = Buffer.from(iv, 'base64');
  const combined = Buffer.from(encrypted, 'base64');
  const authTag = combined.subarray(combined.length - AUTH_TAG_LENGTH);
  const data = combined.subarray(0, combined.length - AUTH_TAG_LENGTH);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, ivBuf, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(authTag);
  const decrypted = decipher.update(data, undefined, 'utf8') + decipher.final('utf8');
  if (parseJson) {
    try {
      return JSON.parse(decrypted);
    } catch {
      return decrypted;
    }
  }
  return decrypted;
}

module.exports = {
  encrypt,
  decrypt,
  getKey,
};
