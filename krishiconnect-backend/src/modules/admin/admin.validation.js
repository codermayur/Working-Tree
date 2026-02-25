const Joi = require('joi');
const ApiError = require('../../utils/ApiError');
const { ROLES } = require('../../config/constants');

const createAdminSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required().messages({
    'any.required': 'Name is required',
    'string.empty': 'Name is required',
  }),
  email: Joi.string().trim().min(1).max(255).required().messages({
    'any.required': 'Email is required',
    'string.empty': 'Email is required',
  }),
  password: Joi.string().min(6).max(128).required().messages({
    'string.min': 'Password must be at least 6 characters',
    'any.required': 'Password is required',
  }),
});

const updateRoleSchema = Joi.object({
  role: Joi.string()
    .valid(...ROLES)
    .required()
    .messages({
      'any.only': `Role must be one of: ${ROLES.join(', ')}`,
    }),
});

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
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
  createAdminSchema,
  updateRoleSchema,
  validateRole: validate(updateRoleSchema),
  validateCreateAdmin: validate(createAdminSchema),
};
