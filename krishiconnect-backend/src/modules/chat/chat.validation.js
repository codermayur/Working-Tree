const Joi = require('joi');

const createConversationSchema = Joi.object({
  type: Joi.string().valid('direct', 'group').default('direct'),
  participants: Joi.array()
    .items(Joi.string().hex().length(24))
    .min(1)
    .required(),
});

const startConversationSchema = Joi.object({
  otherUserId: Joi.string().hex().length(24).required(),
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
  createConversationSchema,
  startConversationSchema,
  validate,
};
