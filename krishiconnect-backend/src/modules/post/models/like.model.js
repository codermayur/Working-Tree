const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    target: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'targetModel',
    },
    targetModel: {
      type: String,
      required: true,
      enum: ['Post', 'Comment', 'Answer'],
    },
  },
  { timestamps: true }
);

likeSchema.index({ user: 1, target: 1, targetModel: 1 }, { unique: true });
likeSchema.index({ target: 1, targetModel: 1, createdAt: -1 });

module.exports = mongoose.model('Like', likeSchema);
