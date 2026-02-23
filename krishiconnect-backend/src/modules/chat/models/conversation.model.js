const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['direct', 'group'],
      required: true,
    },

    participants: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        role: {
          type: String,
          enum: ['admin', 'member'],
          default: 'member',
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
        lastRead: Date,
      },
    ],

    groupDetails: {
      name: String,
      avatar: String,
      description: String,
    },

    /** Last message preview for list. */
    lastMessage: {
      encryptedText: String,
      iv: String,
      text: String,
      sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      sentAt: Date,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

conversationSchema.index({ 'participants.user': 1, updatedAt: -1 });
conversationSchema.index({ type: 1 });

module.exports = mongoose.model('Conversation', conversationSchema);
