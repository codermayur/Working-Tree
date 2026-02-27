const opportunityService = require('./opportunity.service');
const { getIO } = require('../../socket');
const notificationService = require('../notification/notification.service');
const notificationSocket = require('../notification/notification.socket');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');
const asyncHandler = require('../../utils/asyncHandler');
const opportunitySocket = require('./opportunity.socket');

const createOpportunity = asyncHandler(async (req, res) => {
  const images =
    Array.isArray(req.files) && req.files.length
      ? req.files.map((file) => ({
          url: file.path,
          publicId: file.filename,
        }))
      : [];

  const body = {
    ...req.body,
    images,
  };

  const doc = await opportunityService.createOpportunity(req.user._id, body);

  const payload = await opportunityService.getOpportunityById(doc._id, req.user._id);

  try {
    const io = getIO();
    opportunitySocket.emitNewOpportunity(io, payload);
  } catch (_) {}

  res
    .status(201)
    .json(new ApiResponse(201, payload, 'Opportunity created successfully'));
});

const listOpportunities = asyncHandler(async (req, res) => {
  const viewerId = req.user?._id ?? null;
  const result = await opportunityService.listOpportunities(req.query, viewerId);
  res
    .status(200)
    .json(
      new ApiResponse(200, result.data, 'Opportunities fetched', {
        pagination: result.pagination,
      })
    );
});

const getOpportunity = asyncHandler(async (req, res) => {
  const viewerId = req.user?._id ?? null;
  const doc = await opportunityService.getOpportunityById(
    req.params.id,
    viewerId
  );
  res.status(200).json(new ApiResponse(200, doc, 'Opportunity fetched'));
});

const getMyOpportunities = asyncHandler(async (req, res) => {
  const result = await opportunityService.getMyOpportunities(
    req.user._id,
    req.query
  );
  res
    .status(200)
    .json(
      new ApiResponse(200, result.data, 'My opportunities', {
        pagination: result.pagination,
      })
    );
});

const apply = asyncHandler(async (req, res) => {
  const { application, opportunity } = await opportunityService.applyToOpportunity(
    req.params.id,
    req.user._id,
    req.body
  );

  res
    .status(201)
    .json(new ApiResponse(201, application, 'Application submitted'));

  // Notify owner asynchronously
  setImmediate(() => {
    notificationService
      .create({
        recipient: opportunity.farmer,
        sender: req.user._id,
        type: 'system',
        entityId: opportunity._id,
        entityType: 'opportunity',
        message:
          opportunity.type === 'job'
            ? 'applied to your job opportunity'
            : 'requested to rent your listing',
        metadata: {
          opportunityId: opportunity._id,
          applicationId: application._id,
          opportunityType: opportunity.type,
        },
      })
      .then((created) => {
        if (created) {
          try {
            const io = getIO();
            notificationSocket.emitNewNotification(
              io,
              created.notification.recipient,
              created.notification,
              created.unreadCount
            );
          } catch (_) {}
        }
      })
      .catch(() => {});

    // Notify applicant that their application was submitted
    const applicantMessage = `Your application for "${opportunity.title}" was submitted.`;
    notificationService
      .create({
        recipient: req.user._id,
        sender: null,
        type: 'system',
        entityId: opportunity._id,
        entityType: 'opportunity',
        message: applicantMessage,
        metadata: {
          opportunityId: opportunity._id,
          applicationId: application._id,
          opportunityType: opportunity.type,
          opportunityTitle: opportunity.title,
        },
      })
      .then((created) => {
        if (created) {
          try {
            const io = getIO();
            notificationSocket.emitNewNotification(
              io,
              created.notification.recipient,
              created.notification,
              created.unreadCount
            );
          } catch (_) {}
        }
      })
      .catch(() => {});

    try {
      const io = getIO();
      opportunitySocket.emitApplicationEvent(io, opportunity.farmer, {
        type: 'created',
        opportunityId: opportunity._id,
        applicationId: application._id,
      });
    } catch (_) {}
  });
});

const getApplicationsForOpportunity = asyncHandler(async (req, res) => {
  const result = await opportunityService.getApplicationsForOpportunity(
    req.params.id,
    req.user._id,
    req.query
  );
  res
    .status(200)
    .json(
      new ApiResponse(200, result.data, 'Applications fetched', {
        pagination: result.pagination,
        opportunity: {
          _id: result.opportunity._id,
          title: result.opportunity.title,
          type: result.opportunity.type,
        },
      })
    );
});

const getMyApplications = asyncHandler(async (req, res) => {
  const result = await opportunityService.getMyApplications(
    req.user._id,
    req.query
  );
  res
    .status(200)
    .json(
      new ApiResponse(200, result.data, 'My applications', {
        pagination: result.pagination,
      })
    );
});

const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const allowed = ['pending', 'accepted', 'rejected'];
  if (!allowed.includes(status)) {
    throw new ApiError(400, 'Invalid status');
  }

  const { opportunity, application, rejectedApplications = [] } =
    await opportunityService.updateApplicationStatus(
      req.params.id,
      req.params.applicationId,
      req.user._id,
      status
    );

  res
    .status(200)
    .json(
      new ApiResponse(200, application, 'Application status updated')
    );

  setImmediate(() => {
    const io = getIO();
    const opportunityTitle = opportunity.title || 'Opportunity';

    const notifyApplicant = (recipientId, message, meta = {}) => {
      notificationService
        .create({
          recipient: recipientId,
          sender: req.user._id,
          type: 'system',
          entityId: opportunity._id,
          entityType: 'opportunity',
          message,
          metadata: {
            opportunityId: opportunity._id,
            applicationId: application._id,
            opportunityType: opportunity.type,
            opportunityTitle,
            ...meta,
          },
        })
        .then((created) => {
          if (created) {
            try {
              notificationSocket.emitNewNotification(
                io,
                created.notification.recipient,
                created.notification,
                created.unreadCount
              );
            } catch (_) {}
          }
        })
        .catch(() => {});
    };

    // Notify the applicant whose status was updated (accepted or rejected)
    const acceptedMessage = `Your application for "${opportunityTitle}" was accepted.`;
    const rejectedMessage = `Your application for "${opportunityTitle}" was declined.`;
    const messageForApplicant =
      application.status === 'accepted' ? acceptedMessage : rejectedMessage;
    notifyApplicant(application.applicant._id || application.applicant, messageForApplicant);

    // Notify applicants who were auto-rejected (positions filled)
    const autoRejectedMessage = `"${opportunityTitle}" has been filled. Your application was not selected.`;
    rejectedApplications.forEach((r) => {
      const applicantId = r.applicant && r.applicant._id ? r.applicant._id : r.applicant;
      if (applicantId) {
        notifyApplicant(applicantId, autoRejectedMessage, { applicationId: r._id });
      }
    });

    opportunitySocket.emitApplicationEvent(io, application.applicant._id || application.applicant, {
      type: 'status',
      opportunityId: opportunity._id,
      applicationId: application._id,
      status: application.status,
    });
    rejectedApplications.forEach((r) => {
      const applicantId = r.applicant && r.applicant._id ? r.applicant._id : r.applicant;
      if (applicantId) {
        try {
          opportunitySocket.emitApplicationEvent(io, applicantId, {
            type: 'status',
            opportunityId: opportunity._id,
            applicationId: r._id,
            status: 'rejected',
          });
        } catch (_) {}
      }
    });
  });
});

const deleteOpportunity = asyncHandler(async (req, res) => {
  await opportunityService.deleteOpportunity(req.params.id, req.user._id);
  res
    .status(200)
    .json(new ApiResponse(200, null, 'Opportunity deleted successfully'));
});

module.exports = {
  createOpportunity,
  listOpportunities,
  getOpportunity,
  getMyOpportunities,
  apply,
  getApplicationsForOpportunity,
  getMyApplications,
  updateApplicationStatus,
  deleteOpportunity,
};

