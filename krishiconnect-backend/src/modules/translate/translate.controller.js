/**
 * Translate user content (e.g. post text) on demand. Uses MyMemory API (free, no key).
 * Does not store translations; frontend caches in memory.
 */
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');

const MYMEMORY_URL = 'https://api.mymemory.translated.net/get';
const MAX_CHARS = 400; // MyMemory free limit ~500 bytes; 400 chars safe for UTF-8

const TARGET_MAP = { en: 'en', hi: 'hi', mr: 'mr' };

async function callMyMemory(text, targetLang) {
  const target = TARGET_MAP[targetLang] || 'en';
  const langpair = `auto|${target}`;
  const q = text.slice(0, MAX_CHARS);
  const url = `${MYMEMORY_URL}?q=${encodeURIComponent(q)}&langpair=${langpair}`;
  const res = await fetch(url);
  if (!res.ok) throw new ApiError(502, 'Translation service unavailable');
  const data = await res.json();
  const translated = data?.responseData?.translatedText;
  if (!translated) throw new ApiError(502, 'Translation failed');
  return translated;
}

const translate = asyncHandler(async (req, res) => {
  const { text, targetLanguage: targetLang } = req.body;
  if (!text || typeof text !== 'string') {
    throw new ApiError(400, 'text is required');
  }
  const trimmed = text.trim();
  if (!trimmed) {
    return res.status(200).json(new ApiResponse(200, { translatedText: '' }, 'OK'));
  }
  const lang = targetLang && TARGET_MAP[targetLang] ? targetLang : 'en';
  const translatedText = await callMyMemory(trimmed, lang);
  res.status(200).json(new ApiResponse(200, { translatedText }, 'OK'));
});

module.exports = { translate };
