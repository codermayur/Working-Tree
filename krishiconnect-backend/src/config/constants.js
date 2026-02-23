module.exports = {
  OTP_EXPIRY_SECONDS: 600, // 10 minutes
  OTP_MAX_ATTEMPTS: 3,
  JWT_ACCESS_EXPIRY: process.env.JWT_EXPIRES_IN || '7d',
  JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  MAX_FILE_SIZE: 20 * 1024 * 1024, // 20MB
  PROFILE_PIC_MAX_SIZE: 5 * 1024 * 1024, // 5MB for avatar/profile picture
  BACKGROUND_MAX_SIZE: 10 * 1024 * 1024, // 10MB for background image
  CHAT_UPLOAD_MAX_SIZE: 100 * 1024 * 1024, // 100MB for chat attachments
  MAX_FILES: 10,
  PAGINATION_DEFAULT_LIMIT: 20,
  CACHE_DURATION: 300, // 5 minutes
  LANGUAGES: ['hindi', 'english', 'punjabi', 'tamil', 'telugu', 'marathi', 'bengali', 'gujarati'],
  CROPS: ['rice', 'wheat', 'cotton', 'sugarcane', 'vegetables', 'fruits', 'pulses', 'other'],
  POST_CATEGORIES: [
    'farming-tips',
    'crop-advice',
    'pest-control',
    'irrigation',
    'market-news',
    'government-schemes',
    'success-story',
    'question',
    'general',
  ],
  QA_CATEGORIES: [
    'crop-disease',
    'pest-management',
    'irrigation',
    'fertilizer',
    'seeds',
    'weather',
    'market',
    'schemes',
    'equipment',
    'other',
  ],
};
