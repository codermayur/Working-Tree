const mongoose = require('mongoose');

const followSchema = new mongoose.Schema(
  {
    follower: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    following: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    notifications: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

followSchema.index({ follower: 1, following: 1 }, { unique: true });
followSchema.index({ following: 1, createdAt: -1 });

followSchema.pre('save', function (next) {
  if (this.follower.equals(this.following)) {
    next(new Error('Cannot follow yourself'));
  } else {
    next();
  }
});

module.exports = mongoose.model('Follow', followSchema);
