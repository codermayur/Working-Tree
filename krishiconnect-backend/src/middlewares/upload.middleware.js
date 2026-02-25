const multer = require('multer');
const ApiError = require('../utils/ApiError');
const { MAX_FILE_SIZE, MAX_FILES, PROFILE_PIC_MAX_SIZE, BACKGROUND_MAX_SIZE, CHAT_UPLOAD_MAX_SIZE, CERTIFICATE_MAX_SIZE } = require('../config/constants');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedImages = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  const allowedVideos = ['video/mp4', 'video/mpeg', 'video/quicktime'];
  const allowedAudio = ['audio/mpeg', 'audio/wav', 'audio/webm'];

  const allowed = [...allowedImages, ...allowedVideos, ...allowedAudio];

  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Invalid file type'), false);
  }
};

const imageOnlyFilter = (req, file, cb) => {
  const allowedImages = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  if (allowedImages.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Invalid file type. Allowed: JPEG, PNG, WebP'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES,
  },
});

const uploadProfilePic = multer({
  storage,
  fileFilter: imageOnlyFilter,
  limits: { fileSize: PROFILE_PIC_MAX_SIZE, files: 1 },
});

const uploadBackground = multer({
  storage,
  fileFilter: imageOnlyFilter,
  limits: { fileSize: BACKGROUND_MAX_SIZE, files: 1 },
});

const uploadSingle = (fieldName) => (req, res, next) => {
  const uploadHandler = upload.single(fieldName);

  uploadHandler(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new ApiError(400, 'File too large (max 20MB)'));
      }
      return next(new ApiError(400, err.message));
    }
    if (err) return next(err);
    next();
  });
};

const uploadMultiple = (fieldName, maxCount = MAX_FILES) => (req, res, next) => {
  const uploadHandler = upload.array(fieldName, maxCount);

  uploadHandler(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new ApiError(400, 'File too large (max 20MB)'));
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return next(new ApiError(400, `Maximum ${maxCount} files allowed`));
      }
      return next(new ApiError(400, err.message));
    }
    if (err) return next(err);
    next();
  });
};

const uploadSingleProfilePic = (fieldName) => (req, res, next) => {
  const uploadHandler = uploadProfilePic.single(fieldName);
  uploadHandler(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new ApiError(400, 'File is too large. Max size is 5MB'));
      }
      return next(new ApiError(400, err.message));
    }
    if (err) return next(err);
    next();
  });
};

const uploadSingleBackground = (fieldName) => (req, res, next) => {
  const uploadHandler = uploadBackground.single(fieldName);
  uploadHandler(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new ApiError(400, 'File is too large. Max size is 10MB'));
      }
      return next(new ApiError(400, err.message));
    }
    if (err) return next(err);
    next();
  });
};

// Chat: images (jpeg, jpg, png, gif, webp, svg), videos (mp4, mkv, avi, mov, webm), documents/PDF. Field name "file".
const chatFileFilter = (req, file, cb) => {
  const allowedImages = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  const allowedVideos = ['video/mp4', 'video/x-matroska', 'video/avi', 'video/quicktime', 'video/webm'];
  const allowedDocs = ['application/pdf'];
  const allowed = [...allowedImages, ...allowedVideos, ...allowedDocs];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Invalid file type. Allowed: images (JPEG, PNG, GIF, WebP, SVG), videos (MP4, MKV, AVI, MOV, WebM), PDF.'), false);
  }
};

const uploadChatFile = multer({
  storage: multer.memoryStorage(),
  fileFilter: chatFileFilter,
  limits: { fileSize: CHAT_UPLOAD_MAX_SIZE, files: 1 },
});

const uploadSingleChatFile = (fieldName) => (req, res, next) => {
  const uploadHandler = uploadChatFile.single(fieldName);
  uploadHandler(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new ApiError(400, 'File too large. Maximum size is 100 MB.'));
      }
      return next(new ApiError(400, err.message));
    }
    if (err) return next(err);
    next();
  });
};

const certificateFileFilter = (req, file, cb) => {
  const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Invalid file type. Only PDF, JPG, or PNG files are accepted.'), false);
  }
};

const uploadCertificate = multer({
  storage: multer.memoryStorage(),
  fileFilter: certificateFileFilter,
  limits: { fileSize: CERTIFICATE_MAX_SIZE, files: 1 },
});

const uploadSingleCertificate = (fieldName) => (req, res, next) => {
  const uploadHandler = uploadCertificate.single(fieldName);
  uploadHandler(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new ApiError(400, 'File size exceeds 5MB. Please compress your file and try again.'));
      }
      return next(new ApiError(400, err.message));
    }
    if (err) return next(err);
    next();
  });
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  uploadSingleProfilePic,
  uploadSingleBackground,
  uploadSingleChatFile,
  uploadSingleCertificate,
};
