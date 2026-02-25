const Joi = require('joi');

const registerSchema = Joi.object({
  phoneNumber: Joi.string()
    .trim()
    .pattern(/^[6-9]\d{9}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid Indian phone number (10 digits, starting with 6-9)',
      'any.required': 'Phone number is required',
    }),
  email: Joi.string().email().lowercase().trim().allow('', null).optional(),
  name: Joi.string().trim().min(1).max(100).required().messages({
    'any.required': 'Name is required',
    'string.empty': 'Name is required',
  }),
  password: Joi.string().min(6).max(128).required().messages({
    'string.min': 'Password must be at least 6 characters',
    'any.required': 'Password is required',
  }),
  location: Joi.object({
    state: Joi.string().allow('', null),
    district: Joi.string().allow('', null),
    village: Joi.string().allow('', null),
  }).optional(),
}).options({ stripUnknown: true });

const verifyOTPSchema = Joi.object({
  phoneNumber: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .required(),
  otp: Joi.string().length(6).required(),
});

const verifyRegistrationOTPSchema = Joi.object({
  otpId: Joi.string().required(),
  otp: Joi.string().length(6).required(),
});

const loginSchema = Joi.object({
  phoneNumber: Joi.string().pattern(/^[6-9]\d{9}$/).allow('').optional(),
  email: Joi.string().lowercase().trim().allow('').optional(), // allow "admin" as username
  password: Joi.string().required(),
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

const forgotPasswordSchema = Joi.object({
  phoneNumber: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .required(),
});

const resetPasswordSchema = Joi.object({
  phoneNumber: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .required(),
  otp: Joi.string().length(6).required(),
  newPassword: Joi.string().min(6).required(),
});

const forgotPasswordEmailSchema = Joi.object({
  email: Joi.string().email().required().lowercase().trim(),
});

const resetPasswordWithOTPSchema = Joi.object({
  otpId: Joi.string().required(),
  otp: Joi.string().length(6).required(),
  newPassword: Joi.string().min(6).max(50).required(),
});

const resendOTPSchema = Joi.object({
  otpId: Joi.string().required(),
});

const verifyPasswordSchema = Joi.object({
  password: Joi.string().required(),
});

const enable2FASchema = Joi.object({
  otp: Joi.string().length(6).required(),
});

const verifyLoginOTPSchema = Joi.object({
  userId: Joi.string().required(),
  otp: Joi.string().length(6).required(),
});

const resendLoginOTPSchema = Joi.object({
  userId: Joi.string().required(),
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
    const ApiError = require('../../utils/ApiError');
    throw new ApiError(400, error.details.map((d) => d.message).join('; ') || 'Validation failed', errors);
  }
  req.body = value;
  next();
};

module.exports = {
  registerSchema,
  verifyOTPSchema,
  verifyRegistrationOTPSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  forgotPasswordEmailSchema,
  resetPasswordWithOTPSchema,
  resendOTPSchema,
  verifyPasswordSchema,
  enable2FASchema,
  verifyLoginOTPSchema,
  resendLoginOTPSchema,
  validate,
};
