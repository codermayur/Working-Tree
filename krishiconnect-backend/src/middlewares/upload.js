const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../utils/cloudinary');
const ApiError = require('../utils/ApiError');

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_IMAGES = 5;
const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const storage = new CloudinaryStorage({
  cloudinary,
  params: async () => ({
    folder: 'khetibari/opportunities',
    resource_type: 'image',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  }),
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new ApiError(400, 'Invalid file type. Only JPG, JPEG, PNG, or WEBP images are allowed.'),
      false
    );
  }
};

const rawUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_IMAGE_BYTES,
    files: MAX_IMAGES,
  },
});

function uploadOpportunityImages(req, res, next) {
  const handler = rawUpload.array('images', MAX_IMAGES);
  handler(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new ApiError(400, 'Image too large. Maximum size is 5MB per image.'));
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return next(new ApiError(400, `Maximum ${MAX_IMAGES} images allowed.`));
      }
      return next(new ApiError(400, err.message));
    }
    if (err) return next(err);
    return next();
  });
}

module.exports = {
  uploadOpportunityImages,
};

