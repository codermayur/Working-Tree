const Joi = require('joi');
const ApiError = require('../../utils/ApiError');
const mongoose = require('mongoose');

const listSchema = Joi.object({
  cursor: Joi.string().trim().optional(),
  limit: Joi.number().integer().min(1).max(50).default(20),
  unreadOnly: Joi.boolean().optional().truthy('true').falsy('false'),
});

const idParamSchema = Joi.object({
  id: Joi.string()
    .required()
    .custom((value, helpers) => {
      if (mongoose.Types.ObjectId.isValid(value)) return value;
      return helpers.error('any.invalid');
    }, 'valid ObjectId'),
});

const settingsSchema = Joi.object({
  social: Joi.object({
    likes: Joi.boolean().optional(),
    comments: Joi.boolean().optional(),
    connections: Joi.boolean().optional(),
    messages: Joi.boolean().optional(),
  }).optional(),
  alerts: Joi.object({
    market: Joi.boolean().optional(),
    weather: Joi.boolean().optional(),
    pestDisease: Joi.boolean().optional(),
    jobs: Joi.boolean().optional(),
  }).optional(),
  delivery: Joi.object({
    push: Joi.boolean().optional(),
    emailDigest: Joi.boolean().optional(),
  }).optional(),
}).min(1);

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

function validateParams(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) {
      const msg = error.details.map((d) => d.message).join('; ') || 'Invalid notification id';
      throw new ApiError(400, msg);
    }
    req.params = value;
    next();
  };
}

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

module.exports = {
  listSchema,
  idParamSchema,
  settingsSchema,
  validateQuery,
  validateParams,
  validateBody,
};
