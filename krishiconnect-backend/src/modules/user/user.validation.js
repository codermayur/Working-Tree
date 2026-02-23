const Joi = require('joi');
const ApiError = require('../../utils/ApiError');

const updateLanguageSchema = Joi.object({
  language: Joi.string().valid('en', 'hi', 'mr').required().messages({
    'any.only': 'Language must be en, hi, or mr',
  }),
});

const updateThemeSchema = Joi.object({
  darkMode: Joi.boolean().required(),
});

const updatePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'string.empty': 'Current password is required',
  }),
  newPassword: Joi.string().min(8).max(128).required().messages({
    'string.min': 'New password must be at least 8 characters',
    'string.max': 'New password must be at most 128 characters',
  }),
});

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });
  if (error) {
    const errors = error.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));
    throw new ApiError(400, 'Validation failed', errors);
  }
  req.body = value;
  next();
};

module.exports = {
  updateLanguageSchema,
  updateThemeSchema,
  updatePasswordSchema,
  validate,
};
