const Joi = require('joi');

const createPostSchema = Joi.object({
  type: Joi.string().valid('text', 'image', 'video', 'poll').required(),

  content: Joi.object({
    text: Joi.string().max(5000),
  }),

  media: Joi.array().items(
    Joi.object({
      url: Joi.string().uri().required(),
      publicId: Joi.string().required(),
      type: Joi.string().valid('image', 'video').required(),
    })
  ).max(10),

  category: Joi.string().valid(
    'farming-tips',
    'crop-advice',
    'pest-control',
    'irrigation',
    'market-news',
    'government-schemes',
    'success-story',
    'question',
    'general'
  ),

  visibility: Joi.string().valid('public', 'followers', 'private').default('public'),

  poll: Joi.object({
    question: Joi.string().required(),
    options: Joi.array()
      .items(Joi.object({ text: Joi.string().required() }))
      .min(2)
      .max(4),
  }).when('type', {
    is: 'poll',
    then: Joi.required(),
  }),
});

const updatePostSchema = Joi.object({
  content: Joi.object({ text: Joi.string().max(5000) }),
  category: Joi.string().valid(
    'farming-tips',
    'crop-advice',
    'pest-control',
    'irrigation',
    'market-news',
    'government-schemes',
    'success-story',
    'question',
    'general'
  ),
  visibility: Joi.string().valid('public', 'followers', 'private'),
});

const commentSchema = Joi.object({
  content: Joi.string().required().max(1000).trim(),
  text: Joi.string().max(1000),
  media: Joi.object({
    url: Joi.string().uri(),
    publicId: Joi.string(),
    type: Joi.string().valid('image', 'gif'),
  }),
  parentComment: Joi.string().hex().length(24),
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
  createPostSchema,
  updatePostSchema,
  commentSchema,
  validate,
};
