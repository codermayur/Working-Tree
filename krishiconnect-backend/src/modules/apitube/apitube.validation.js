const Joi = require('joi');

const MAX_QUERY_LENGTH = 200;
const MAX_PAGE = 100;
const MAX_LIMIT = 50;
const MIN_LIMIT = 1;

const querySchema = Joi.object({
  q: Joi.string().max(MAX_QUERY_LENGTH).trim().allow('').optional(),
  page: Joi.number().integer().min(1).max(MAX_PAGE).optional().default(1),
  limit: Joi.number().integer().min(MIN_LIMIT).max(MAX_LIMIT).optional().default(20),
  language: Joi.string().pattern(/^[a-z]{2}(-[A-Z]{2})?$/).max(10).optional(),
  category: Joi.string().max(50).trim().optional(),
}).unknown(false); // reject unknown keys to prevent injection

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errors = error.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));
    const ApiError = require('../../utils/ApiError');
    throw new ApiError(400, 'Validation failed', errors);
  }

  req.query = value;
  next();
};

module.exports = {
  querySchema,
  validate,
};
