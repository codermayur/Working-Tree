const express = require('express');
const router = express.Router();
const adminController = require('./admin.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/authorizeRoles');
const { validateRole, validateCreateAdmin } = require('./admin.validation');
const { validateReject } = require('../expert-application/expert-application.validation');

// All admin routes: authenticate then require admin role
router.use(authenticate);
router.use(requireAdmin);

router.post('/create-admin', validateCreateAdmin, adminController.createAdmin);
router.get('/expert-applications', adminController.getExpertApplications);
router.get('/expert-applications/:id', adminController.getExpertApplicationById);
router.patch('/expert-applications/:id/approve', adminController.approveExpertApplication);
router.patch('/expert-applications/:id/reject', validateReject, adminController.rejectExpertApplication);
router.get('/users', adminController.listUsers);
router.patch('/users/:userId/role', validateRole, adminController.updateUserRole);
router.patch('/users/:userId/verify-expert', adminController.verifyExpert);

module.exports = router;
