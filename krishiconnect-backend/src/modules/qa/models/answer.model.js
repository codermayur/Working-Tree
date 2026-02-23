const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema(
  {
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
      index: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    content: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    media: [{ url: String, publicId: String }],

    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    downvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    voteScore: { type: Number, default: 0 },

    isExpertAnswer: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

answerSchema.index({ question: 1, voteScore: -1 });
answerSchema.index({ author: 1 });

module.exports = mongoose.model('Answer', answerSchema);
