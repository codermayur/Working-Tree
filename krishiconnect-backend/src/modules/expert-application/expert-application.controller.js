const expertApplicationService = require('./expert-application.service');
const ApiResponse = require('../../utils/ApiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const { uploadToCloudinary } = require('../../utils/uploadToCloudinary');
const ApiError = require('../../utils/ApiError');

/** POST /expert-application/upload-certificate — upload certificate file, returns { certificateFileUrl } */
const uploadCertificate = asyncHandler(async (req, res) => {
  if (!req.file || !req.file.buffer) {
    throw new ApiError(400, 'No file uploaded. Please upload a PDF, JPG, or PNG file.');
  }
  const result = await uploadToCloudinary(req.file.buffer, {
    folder: 'khetibari/certificates',
    resourceType: req.file.mimetype === 'application/pdf' ? 'raw' : 'image',
  });
  const certificateFileUrl = result.url || result.secure_url;
  res.status(200).json(
    new ApiResponse(200, { certificateFileUrl }, 'Certificate uploaded successfully')
  );
});

/** POST /expert-application/apply — farmers only, body validated */
const apply = asyncHandler(async (req, res) => {
  const application = await expertApplicationService.apply(req.user._id, req.body);
  res
    .status(201)
    .json(
      new ApiResponse(201, application, 'Application submitted successfully')
    );
});

/** GET /expert-application/my-application — current user's latest application */
const getMyApplication = asyncHandler(async (req, res) => {
  const application = await expertApplicationService.getMyApplication(req.user._id);
  res
    .status(200)
    .json(
      new ApiResponse(200, application, application ? 'Application found' : 'No application found')
    );
});

/** GET /expert-application/all — admin only, paginated, filter by status */
const getAll = asyncHandler(async (req, res) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('Admin fetching expert applications');
  }
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const status = req.query.status;
  const result = await expertApplicationService.getAll({ page, limit, status });
  if (process.env.NODE_ENV !== 'production') {
    console.log('Found:', result.data?.length ?? 0, 'totalItems:', result.pagination?.totalItems);
  }
  res.status(200).json(
    new ApiResponse(200, result.data, 'Applications fetched', {
      pagination: result.pagination,
    })
  );
});

/** GET /expert-application/:id — admin only */
const getById = asyncHandler(async (req, res) => {
  const application = await expertApplicationService.getById(req.params.id);
  res.status(200).json(new ApiResponse(200, application, 'Application found'));
});

/** PATCH /expert-application/:id/approve — admin only */
const approve = asyncHandler(async (req, res) => {
  const { application, user } = await expertApplicationService.approve(
    req.params.id,
    req.user._id
  );
  res.status(200).json(
    new ApiResponse(200, { application, user }, 'Application approved')
  );
});

/** PATCH /expert-application/:id/reject — admin only, body: { adminNote } */
const reject = asyncHandler(async (req, res) => {
  const application = await expertApplicationService.reject(
    req.params.id,
    req.user._id,
    req.body.adminNote
  );
  res.status(200).json(
    new ApiResponse(200, application, 'Application rejected')
  );
});

module.exports = {
  uploadCertificate,
  apply,
  getMyApplication,
  getAll,
  getById,
  approve,
  reject,
};
