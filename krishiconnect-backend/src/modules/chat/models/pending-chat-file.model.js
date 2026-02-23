const mongoose = require('mongoose');

const pendingChatFileSchema = new mongoose.Schema(
  {
    buffer: { type: Buffer, required: true },
    contentType: { type: String, required: true },
    filename: { type: String, default: '' },
    size: { type: Number, required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

pendingChatFileSchema.index({ createdAt: 1 }, { expireAfterSeconds: 3600 }); // TTL 1 hour

module.exports = mongoose.model('PendingChatFile', pendingChatFileSchema);
