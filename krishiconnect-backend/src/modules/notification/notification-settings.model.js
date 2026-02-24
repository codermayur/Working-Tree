const mongoose = require('mongoose');

const notificationSettingsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    social: {
      likes: { type: Boolean, default: true },
      comments: { type: Boolean, default: true },
      connections: { type: Boolean, default: true },
      messages: { type: Boolean, default: true },
    },
    alerts: {
      market: { type: Boolean, default: true },
      weather: { type: Boolean, default: true },
      pestDisease: { type: Boolean, default: true },
      jobs: { type: Boolean, default: true },
    },
    delivery: {
      push: { type: Boolean, default: false },
      emailDigest: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('NotificationSettings', notificationSettingsSchema);
