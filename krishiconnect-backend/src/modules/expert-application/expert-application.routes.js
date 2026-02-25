const express = require('express');
const router = express.Router();
const controller = require('./expert-application.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorizeRoles, requireAdmin } = require('../../middlewares/authorizeRoles');
const { validateApply, validateReject } = require('./expert-application.validation');
const { uploadSingleCertificate } = require('../../middlewares/upload.middleware');

// Farmer: upload certificate file; then apply with certificateFileUrl in body
router.post('/upload-certificate', authenticate, uploadSingleCertificate('certificate'), controller.uploadCertificate);
// Farmer: apply and get own application
router.post('/apply', authenticate, validateApply, controller.apply);
router.get('/my-application', authenticate, controller.getMyApplication);

// Admin: list all, get one, approve, reject
router.get('/all', authenticate, requireAdmin, controller.getAll);
router.get('/:id', authenticate, requireAdmin, controller.getById);
router.patch('/:id/approve', authenticate, requireAdmin, controller.approve);
router.patch('/:id/reject', authenticate, requireAdmin, validateReject, controller.reject);

module.exports = router;
