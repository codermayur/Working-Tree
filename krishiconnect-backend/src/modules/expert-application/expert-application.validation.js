const Joi = require('joi');
const ApiError = require('../../utils/ApiError');
const {
  EXPERTISE_AREAS,
  GOVERNMENT_ID_TYPES,
} = require('./expert-application.model');

const certificateSchema = Joi.object({
  certificateName: Joi.string().trim().min(3).required()
    .messages({ 'string.min': 'Certificate name must be at least 3 characters' }),
  issuingAuthority: Joi.string().trim().min(3).required()
    .messages({ 'string.min': 'Issuing authority must be at least 3 characters' }),
  certificateNumber: Joi.string().trim().min(5).required()
    .pattern(/^[a-zA-Z0-9\-_]+$/)
    .messages({
      'string.min': 'Certificate number must be at least 5 characters',
      'string.pattern.base': 'Certificate number must be alphanumeric',
    }),
  issueDate: Joi.date().required().max('now')
    .messages({ 'date.max': 'Issue date cannot be a future date' }),
  expiryDate: Joi.date().allow(null).when('isLifelong', {
    is: false,
    then: Joi.date().required().greater(Joi.ref('issueDate'))
      .messages({
        'date.greater': 'Expiry date must be after the issue date',
      }),
    otherwise: Joi.optional(),
  }),
  certificateFileUrl: Joi.string().trim().min(1).required(),
  isLifelong: Joi.boolean().default(false),
}).custom((value, helpers) => {
  if (!value.isLifelong && value.expiryDate && value.issueDate && value.expiryDate <= value.issueDate) {
    return helpers.error('any.custom', { message: 'Expiry date must be after the issue date' });
  }
  if (!value.isLifelong && value.expiryDate && new Date(value.expiryDate) < new Date()) {
    return helpers.error('any.custom', { message: 'Your certificate has expired. Please provide a valid certificate.' });
  }
  return value;
});

const applySchema = Joi.object({
  fullName: Joi.string().trim().required().max(100),
  email: Joi.string().email().trim().lowercase().required(),
  phoneNumber: Joi.string().trim().required(),
  expertiseArea: Joi.string().valid(...EXPERTISE_AREAS).required(),
  yearsOfExperience: Joi.number().integer().min(1).max(50).required()
    .messages({
      'number.min': 'Years of experience is required and must be between 1 and 50',
      'number.max': 'Years of experience is required and must be between 1 and 50',
    }),
  specializedDomain: Joi.string().trim().min(10).max(200).required()
    .messages({ 'string.min': 'Please describe your specialized domain (min 10 characters)' }),
  governmentApprovedCertificate: certificateSchema.required(),
  qualifications: Joi.string().trim().allow(''),
  currentOrganization: Joi.string().trim().allow(''),
  governmentIdType: Joi.string().valid(...GOVERNMENT_ID_TYPES).required(),
  governmentIdNumber: Joi.string().trim().required(),
  supportingDocuments: Joi.array().items(Joi.string()).max(10),
  linkedInProfile: Joi.string().trim().uri().allow('').optional(),
  shortBio: Joi.string().trim().max(500).required(),
});

const rejectSchema = Joi.object({
  adminNote: Joi.string().trim().required().min(1).max(1000),
});

const validate = (schema) => (req, res, next) => {
  const toValidate = req.body && typeof req.body === 'object' ? req.body : {};
  const { error, value } = schema.validate(toValidate, {
    abortEarly: false,
    stripUnknown: true,
  });
  if (error) {
    const errors = error.details.map((d) => ({
      field: d.path.join('.'),
      message: d.message,
    }));
    throw new ApiError(400, 'Validation failed', errors);
  }
  req.body = value;
  next();
};

module.exports = {
  applySchema,
  rejectSchema,
  validateApply: validate(applySchema),
  validateReject: validate(rejectSchema),
};
