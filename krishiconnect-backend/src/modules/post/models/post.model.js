const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    content: {
      type: String,
      default: '',
      maxlength: 5000,
    },
    media: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
        type: { type: String, enum: ['image', 'video'], required: true },
      },
    ],
    tags: [{ type: String, trim: true }],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    savedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    savedCount: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ likesCount: -1 });
postSchema.index({ savedBy: 1 });

module.exports = mongoose.model('Post', postSchema);
