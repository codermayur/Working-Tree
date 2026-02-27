const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');
const ApiError = require('./ApiError');

const uploadToCloudinary = (buffer, options = {}) =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || 'khetibari',
        resource_type: options.resourceType || 'auto',
        ...options,
      },
      (error, result) => {
        if (error) {
          reject(new ApiError(500, 'Failed to upload file'));
        } else {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            size: result.bytes,
            width: result.width,
            height: result.height,
          });
        }
      }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });

const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (error) {
    console.error('Cloudinary deletion failed:', error);
  }
};

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary,
};
