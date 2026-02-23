const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'like',
        'comment',
        'follow',
        'mention',
        'answer',
        'message',
        'weather-alert',
        'market-alert',
        'system',
      ],
      required: true,
    },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    target: { type: mongoose.Schema.Types.ObjectId, refPath: 'targetModel' },
    targetModel: {
      type: String,
      enum: ['Post', 'Comment', 'Question', 'Answer', 'Message'],
    },
    title: String,
    message: String,
    actionUrl: String,
    isRead: { type: Boolean, default: false },
    readAt: Date,
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
