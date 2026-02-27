const express = require('express');
const router = express.Router();
const opportunityController = require('./opportunity.controller');
const {
  createOpportunitySchema,
  listOpportunitiesSchema,
  applySchema,
  validateBody,
  validateQuery,
  validateParamsId,
} = require('./opportunity.validation');
const { authenticate, optionalAuth } = require('../../middlewares/auth.middleware');
const { uploadOpportunityImages } = require('../../middlewares/upload');

router.get(
  '/',
  optionalAuth,
  validateQuery(listOpportunitiesSchema),
  opportunityController.listOpportunities
);

router.get(
  '/mine',
  authenticate,
  opportunityController.getMyOpportunities
);

router.get(
  '/applications/mine',
  authenticate,
  opportunityController.getMyApplications
);

router.get(
  '/:id',
  optionalAuth,
  validateParamsId('id'),
  opportunityController.getOpportunity
);

router.post(
  '/',
  authenticate,
  uploadOpportunityImages,
  validateBody(createOpportunitySchema),
  opportunityController.createOpportunity
);

router.post(
  '/:id/applications',
  authenticate,
  validateParamsId('id'),
  validateBody(applySchema),
  opportunityController.apply
);

router.get(
  '/:id/applications',
  authenticate,
  validateParamsId('id'),
  opportunityController.getApplicationsForOpportunity
);

router.patch(
  '/:id/applications/:applicationId',
  authenticate,
  validateParamsId('id'),
  validateParamsId('applicationId'),
  opportunityController.updateApplicationStatus
);

router.delete(
  '/:id',
  authenticate,
  validateParamsId('id'),
  opportunityController.deleteOpportunity
);

module.exports = router;

