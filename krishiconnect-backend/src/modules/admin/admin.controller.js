const expertApplicationService = require('../expert-application/expert-application.service');
const adminService = require('./admin.service');
const ApiResponse = require('../../utils/ApiResponse');
const asyncHandler = require('../../utils/asyncHandler');

/** GET /admin/expert-applications — Admin only. Same data as GET /expert-application/all (all applications, no user filter). */
const getExpertApplications = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const status = req.query.status;
  const result = await expertApplicationService.getAll({ page, limit, status });
  if (process.env.NODE_ENV !== 'production') {
    console.log('Fetching expert applications (admin). Found:', result.data?.length ?? 0);
  }
  res.status(200).json(
    new ApiResponse(200, result.data, 'Applications fetched', {
      pagination: result.pagination,
    })
  );
});

/** GET /admin/expert-applications/:id — Admin only. Single application by id. */
const getExpertApplicationById = asyncHandler(async (req, res) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('Fetching application:', req.params.id);
  }
  const application = await expertApplicationService.getById(req.params.id);
  res.status(200).json(new ApiResponse(200, application, 'Application found'));
});

/** PATCH /admin/expert-applications/:id/approve — Admin only. */
const approveExpertApplication = asyncHandler(async (req, res) => {
  const { application, user } = await expertApplicationService.approve(
    req.params.id,
    req.user._id
  );
  res.status(200).json(
    new ApiResponse(200, { application, user }, 'Application approved')
  );
});

/** PATCH /admin/expert-applications/:id/reject — Admin only. Body: { adminNote } */
const rejectExpertApplication = asyncHandler(async (req, res) => {
  const application = await expertApplicationService.reject(
    req.params.id,
    req.user._id,
    req.body.adminNote
  );
  res.status(200).json(
    new ApiResponse(200, application, 'Application rejected')
  );
});

/** POST /admin/create-admin — Admin only. Body: { name, email, password } */
const createAdmin = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const user = await adminService.createAdmin(name, email, password, {
    _id: req.user._id,
    name: req.user.name,
  });
  res.status(201).json(new ApiResponse(201, user, 'Admin created successfully'));
});

/** PATCH /admin/users/:userId/role — Admin only. Body: { role: "admin"|"farmer"|"expert" } */
const updateUserRole = asyncHandler(async (req, res) => {
  const user = await adminService.updateUserRole(
    req.params.userId,
    req.body.role,
    { _id: req.user._id, name: req.user.name }
  );
  res.status(200).json(new ApiResponse(200, user, 'Role updated successfully'));
});

/** PATCH /admin/users/:userId/verify-expert — Admin only. Sets isVerifiedExpert = true. */
const verifyExpert = asyncHandler(async (req, res) => {
  const user = await adminService.verifyExpert(req.params.userId, {
    _id: req.user._id,
    name: req.user.name,
  });
  res.status(200).json(new ApiResponse(200, user, 'Expert verified successfully'));
});

/** GET /admin/users — Admin only. Query: page, limit, role, q (search). */
const listUsers = asyncHandler(async (req, res) => {
  const result = await adminService.listUsers(req.query);
  res.status(200).json(
    new ApiResponse(200, result.data, 'Users fetched successfully', {
      pagination: result.pagination,
    })
  );
});

module.exports = {
  getExpertApplications,
  getExpertApplicationById,
  approveExpertApplication,
  rejectExpertApplication,
  createAdmin,
  updateUserRole,
  verifyExpert,
  listUsers,
};
