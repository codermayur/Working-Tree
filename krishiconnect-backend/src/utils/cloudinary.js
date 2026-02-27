const { v2: cloudinary } = require('cloudinary');

/**
 * Central Cloudinary configuration using environment variables.
 *
 * Supports both:
 * - CLOUDINARY_NAME / CLOUDINARY_KEY / CLOUDINARY_SECRET
 * - CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET (existing)
 */
const {
  CLOUDINARY_NAME,
  CLOUDINARY_KEY,
  CLOUDINARY_SECRET,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
} = process.env;

const cloudName = CLOUDINARY_NAME || CLOUDINARY_CLOUD_NAME;
const apiKey = CLOUDINARY_KEY || CLOUDINARY_API_KEY;
const apiSecret = CLOUDINARY_SECRET || CLOUDINARY_API_SECRET;

if (cloudName && apiKey && apiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

module.exports = cloudinary;

