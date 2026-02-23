const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      maxlength: 200,
    },
    description: {
      type: String,
      maxlength: 5000,
    },
    media: [{ url: String, publicId: String, type: String }],
    voiceNote: {
      url: String,
      publicId: String,
      transcription: String,
    },

    category: {
      type: String,
      enum: [
        'crop-disease',
        'pest-management',
        'irrigation',
        'fertilizer',
        'seeds',
        'weather',
        'market',
        'schemes',
        'equipment',
        'other',
      ],
      required: true,
    },
    tags: [{ type: String, lowercase: true }],
    taggedExperts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    status: {
      type: String,
      enum: ['open', 'solved', 'closed'],
      default: 'open',
    },
    solvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Answer' },

    views: { type: Number, default: 0 },
    answersCount: { type: Number, default: 0 },

    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

questionSchema.index({ author: 1, createdAt: -1 });
questionSchema.index({ category: 1, status: 1 });
questionSchema.index({ tags: 1 });
questionSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Question', questionSchema);
