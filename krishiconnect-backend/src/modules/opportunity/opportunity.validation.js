const Joi = require('joi');
const ApiError = require('../../utils/ApiError');

const idSchema = Joi.string().hex().length(24).required();

const createOpportunitySchema = Joi.object({
  type: Joi.string().valid('job', 'equipment', 'cattle').required(),
  title: Joi.string().trim().max(160).required(),
  description: Joi.string().allow('').max(3000),

  // Common
  paymentType: Joi.string().valid('per_day', 'per_hour', 'fixed', 'per_acre').optional(),
  amount: Joi.number().min(0).optional(),
  urgent: Joi.boolean().optional(),

  locationText: Joi.string().trim().max(200).required(),
  lat: Joi.number().min(-90).max(90).optional(),
  lng: Joi.number().min(-180).max(180).optional(),

  requirements: Joi.array().items(Joi.string().trim().max(300)).optional(),
  images: Joi.array()
    .items(
      Joi.object({
        url: Joi.string().uri().max(1024).required(),
        publicId: Joi.string().max(240).required(),
      })
    )
    .optional(),

  // Job-specific
  workType: Joi.string().valid('harvesting', 'planting', 'irrigation', 'labour', 'other').optional(),
  workersRequired: Joi.number().integer().min(1).optional(),
  startDate: Joi.date().iso().optional(),
  durationDays: Joi.number().integer().min(0).optional(),
  durationHours: Joi.number().integer().min(0).optional(),
  foodIncluded: Joi.boolean().optional(),
  stayIncluded: Joi.boolean().optional(),
  contactMethods: Joi.array().items(Joi.string().valid('call', 'whatsapp', 'chat')).optional(),

  // Equipment-specific
  equipmentName: Joi.string().trim().max(120).optional(),
  equipmentBrandModel: Joi.string().trim().max(160).optional(),
  equipmentCondition: Joi.string().valid('new', 'good', 'average').optional(),
  rentalUnit: Joi.string().valid('per_hour', 'per_day', 'per_acre').optional(),
  securityDeposit: Joi.number().min(0).optional(),
  availabilityFrom: Joi.date().iso().optional(),
  availabilityTo: Joi.date().iso().optional(),
  deliveryAvailable: Joi.boolean().optional(),
  fuelIncluded: Joi.boolean().optional(),

  // Cattle-specific
  animalType: Joi.string().valid('cow', 'buffalo', 'bull', 'ox').optional(),
  purpose: Joi.string().valid('ploughing', 'dairy', 'transport', 'other').optional(),
  pricePerDay: Joi.number().min(0).optional(),
  healthCondition: Joi.string().trim().max(500).optional(),
  vaccinated: Joi.boolean().optional(),
  ageYears: Joi.number().min(0).max(40).optional(),
});

const listOpportunitiesSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
  type: Joi.string().valid('job', 'equipment', 'cattle').optional(),
  q: Joi.string().trim().max(200).optional(),
  urgent: Joi.boolean().truthy('true').falsy('false').optional(),
  sort: Joi.string().valid('latest', 'price_low', 'price_high', 'nearest').default('latest'),
  lat: Joi.number().min(-90).max(90).optional(),
  lng: Joi.number().min(-180).max(180).optional(),
  radiusKm: Joi.number().min(1).max(200).default(50),
});

const applySchema = Joi.object({
  name: Joi.string().trim().max(160).required(),
  phone: Joi.string()
    .trim()
    .pattern(/^[0-9]{10}$/)
    .required()
    .messages({
      'string.pattern.base': 'Phone must be a 10 digit number',
    }),
  govtIdNumber: Joi.string().trim().max(80).required(),
  experienceYears: Joi.number().integer().min(0).max(80).required(),
  experience: Joi.string().trim().max(1000).allow('').optional(),
  skills: Joi.string().trim().max(500).required(),
  idProofUrl: Joi.string().uri().max(1024).required(),
  expectedPay: Joi.string().trim().max(200).allow('').optional(),
  message: Joi.string().trim().max(2000).allow('').optional(),
  confirm: Joi.boolean()
    .valid(true)
    .required()
    .messages({
      'any.only': 'You must confirm that the information is correct',
    }),
});

function validateBody(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) {
      const msg = error.details.map((d) => d.message).join('; ') || 'Validation failed';
      throw new ApiError(400, msg);
    }
    req.body = value;
    next();
  };
}

function validateQuery(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) {
      const msg = error.details.map((d) => d.message).join('; ') || 'Validation failed';
      throw new ApiError(400, msg);
    }
    req.query = value;
    next();
  };
}

function validateParamsId(paramName = 'id') {
  return (req, res, next) => {
    const { error, value } = idSchema.label(paramName).validate(req.params[paramName]);
    if (error) {
      throw new ApiError(400, error.message || 'Invalid id');
    }
    req.params[paramName] = value;
    next();
  };
}

module.exports = {
  createOpportunitySchema,
  listOpportunitiesSchema,
  applySchema,
  validateBody,
  validateQuery,
  validateParamsId,
};

