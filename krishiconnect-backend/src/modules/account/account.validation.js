const Joi = require('joi');

const verifyDeleteOtpSchema = Joi.object({
  otp: Joi.string().length(6).pattern(/^\d+$/).required().messages({
    'string.length': 'OTP must be 6 digits',
    'any.required': 'OTP is required',
  }),
}).options({ stripUnknown: true });

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });
  if (error) {
    const ApiError = require('../../utils/ApiError');
    const errors = error.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));
    throw new ApiError(400, error.details.map((d) => d.message).join('; ') || 'Validation failed', errors);
  }
  req.body = value;
  next();
};

module.exports = {
  verifyDeleteOtpSchema,
  validate,
};
