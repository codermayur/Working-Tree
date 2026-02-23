const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['text', 'image', 'voice', 'file'],
      required: true,
      default: 'text',
    },
    text: { type: String, default: '' },
    attachment: {
      type: {
        type: String,
        enum: ['image', 'video', 'document'],
      },
      url: String,
      publicId: String,
      data: Buffer,
      contentType: String,
      filename: String,
      size: Number,
    },
    /** Encrypted payload (optional; used when CHAT_ENCRYPTION_KEY is set). */
    encryptedContent: { type: String },
    iv: { type: String },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
    reactions: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        emoji: { type: String, required: true },
      },
    ],
    isEdited: { type: Boolean, default: false },
    editedAt: { type: Date },
    isUnsent: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read'],
      default: 'sent',
    },
    deliveredTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    readBy: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        readAt: { type: Date, default: Date.now },
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
