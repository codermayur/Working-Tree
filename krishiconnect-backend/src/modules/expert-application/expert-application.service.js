/**
 * Expert application service: apply, list, approve, reject.
 * On approval: User.role → expert, roleUpgradeStatus → approved, isExpert → true.
 */
const ExpertApplication = require('./expert-application.model');
const User = require('../user/user.model');
const ApiError = require('../../utils/ApiError');
const Pagination = require('../../utils/pagination');
const notificationService = require('../notification/notification.service');
const logger = require('../../config/logger');
const { getIO } = require('../../socket');

const applicationPagination = new Pagination(ExpertApplication);

/** Only farmers can apply; roleUpgradeStatus must be none or rejected (re-apply). */
async function apply(userId, body) {
  const user = await User.findById(userId).select('role roleUpgradeStatus name email phoneNumber').lean();
  if (!user) throw new ApiError(404, 'User not found');
  if (user.role !== 'farmer') {
    throw new ApiError(403, 'Only farmers can apply to become an expert');
  }
  const status = user.roleUpgradeStatus || 'none';
  if (status === 'pending') {
    const pending = await ExpertApplication.findOne({ userId, status: 'pending' }).lean();
    if (pending) throw new ApiError(400, 'You already have a pending application');
  }
  if (status !== 'none' && status !== 'rejected') {
    throw new ApiError(400, 'Cannot apply at this time');
  }

  const application = await ExpertApplication.create({
    userId,
    fullName: body.fullName,
    email: body.email,
    phoneNumber: body.phoneNumber,
    expertiseArea: body.expertiseArea,
    yearsOfExperience: body.yearsOfExperience,
    specializedDomain: body.specializedDomain,
    governmentApprovedCertificate: body.governmentApprovedCertificate,
    qualifications: body.qualifications || '',
    currentOrganization: body.currentOrganization || '',
    governmentIdType: body.governmentIdType,
    governmentIdNumber: body.governmentIdNumber,
    supportingDocuments: body.supportingDocuments || [],
    linkedInProfile: body.linkedInProfile || '',
    shortBio: body.shortBio,
    status: 'pending',
  });

  await User.findByIdAndUpdate(userId, {
    roleUpgradeStatus: 'pending',
    expertApplicationId: application._id,
  });

  logger.info('Expert application submitted', {
    event: 'expert_application_submitted',
    userId: userId.toString(),
    applicationId: application._id.toString(),
  });

  if (process.env.NODE_ENV !== 'production') {
    console.log('Expert application saved:', { id: application._id.toString(), status: application.status, userId: application.userId?.toString() });
  }

  return application;
}

async function getMyApplication(userId) {
  const app = await ExpertApplication.findOne({ userId })
    .sort({ appliedAt: -1 })
    .lean();
  return app || null;
}

async function getAll(query = {}) {
  const { page = 1, limit = 10, status } = query;
  const filter = {};
  if (status && ['pending', 'approved', 'rejected'].includes(status)) {
    filter.status = status;
  }
  const result = await applicationPagination.paginate(filter, {
    page,
    limit,
    sort: { appliedAt: -1 },
    populate: [{ path: 'userId', select: 'name email createdAt' }],
  });
  if (process.env.NODE_ENV !== 'production') {
    console.log('Expert applications getAll — filter:', JSON.stringify(filter), 'found:', result.data?.length ?? 0, 'totalItems:', result.pagination?.totalItems);
  }
  return result;
}

async function getById(id, adminOnly = false) {
  const app = await ExpertApplication.findById(id)
    .populate('userId', 'name email phoneNumber createdAt')
    .populate('reviewedBy', 'name')
    .lean();
  if (!app) throw new ApiError(404, 'Application not found');
  return app;
}

async function approve(applicationId, adminUserId) {
  const app = await ExpertApplication.findById(applicationId);
  if (!app) throw new ApiError(404, 'Application not found');
  if (app.status !== 'pending') {
    throw new ApiError(400, 'Application is not pending');
  }

  app.status = 'approved';
  app.reviewedAt = new Date();
  app.reviewedBy = adminUserId;
  await app.save();

  const user = await User.findById(app.userId);
  if (!user) throw new ApiError(404, 'User not found');
  user.role = 'expert';
  user.roleUpgradeStatus = 'approved';
  user.isExpert = true;
  user.badges = user.badges || {};
  user.badges.expert = true;
  user.expertDetails = user.expertDetails || {};
  user.expertDetails.specialization = app.expertiseArea;
  user.expertDetails.experience = app.yearsOfExperience;
  user.expertDetails.isVerifiedExpert = true;
  user.expertDetails.verifiedAt = new Date();
  user.expertDetails.verifiedBy = adminUserId;
  await user.save({ validateBeforeSave: true });

  logger.info('Expert application approved', {
    event: 'expert_application_approved',
    applicationId: app._id.toString(),
    userId: user._id.toString(),
    adminUserId: adminUserId.toString(),
  });

  // In-app notification
  await notificationService.create({
    recipient: user._id,
    sender: adminUserId,
    type: 'system',
    entityId: app._id,
    entityType: 'expert_application',
    message: 'Your expert application has been approved. You are now an expert on Khetibari!',
    metadata: { roleUpgraded: true },
  }).catch(() => {});

  // Optional: emit for real-time UI update without re-login
  try {
    const io = getIO();
    if (io) {
      io.to(`user:${user._id}`).emit('role-upgraded', {
        role: 'expert',
        roleUpgradeStatus: 'approved',
      });
    }
  } catch (e) {
    logger.warn('[expert-application] socket emit role-upgraded failed', e.message);
  }

  return { application: app, user };
}

async function reject(applicationId, adminUserId, adminNote) {
  const app = await ExpertApplication.findById(applicationId);
  if (!app) throw new ApiError(404, 'Application not found');
  if (app.status !== 'pending') {
    throw new ApiError(400, 'Application is not pending');
  }

  app.status = 'rejected';
  app.reviewedAt = new Date();
  app.reviewedBy = adminUserId;
  app.adminNote = adminNote || '';
  await app.save();

  await User.findByIdAndUpdate(app.userId, {
    roleUpgradeStatus: 'rejected',
    $unset: { expertApplicationId: 1 },
  });

  logger.info('Expert application rejected', {
    event: 'expert_application_rejected',
    applicationId: app._id.toString(),
    userId: app.userId.toString(),
    adminUserId: adminUserId.toString(),
  });

  await notificationService.create({
    recipient: app.userId,
    sender: adminUserId,
    type: 'system',
    entityId: app._id,
    entityType: 'expert_application',
    message: adminNote
      ? `Your expert application was not approved. Reason: ${adminNote}`
      : 'Your expert application was not approved. You may re-apply with updated information.',
    metadata: { roleUpgraded: false },
  }).catch(() => {});

  return app;
}

module.exports = {
  apply,
  getMyApplication,
  getAll,
  getById,
  approve,
  reject,
};
