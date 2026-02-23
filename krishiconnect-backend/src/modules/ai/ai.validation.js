const Joi = require('joi');

const MAX_MESSAGE_LENGTH = 500;

const askSchema = Joi.object({
  question: Joi.string().min(10).max(MAX_MESSAGE_LENGTH).required(),
  model: Joi.string().optional(),
});

const chatSchema = Joi.object({
  message: Joi.string().min(10).max(MAX_MESSAGE_LENGTH).required(),
  model: Joi.string().optional(),
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
    throw new ApiError(400, 'Validation failed', errors);
  }

  req.body = value;
  next();
};

module.exports = {
  askSchema,
  chatSchema,
  validate,
};
