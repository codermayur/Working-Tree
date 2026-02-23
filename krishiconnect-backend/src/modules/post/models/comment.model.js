const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
      index: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    text: { type: String, maxlength: 1000 },
    content: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    media: {
      url: String,
      publicId: String,
      type: {
        type: String,
        enum: ['image', 'gif'],
      },
    },

    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
    },

    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    likesCount: {
      type: Number,
      default: 0,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
  },
  { timestamps: true }
);

commentSchema.index({ post: 1, createdAt: -1 });
commentSchema.index({ author: 1 });
commentSchema.index({ parentComment: 1 });

module.exports = mongoose.model('Comment', commentSchema);
