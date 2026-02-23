const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    otpCode: {
      type: String,
      required: true,
    },
    otpType: {
      type: String,
      enum: ['registration', 'password_reset', '2fa_enable', '2fa_login'],
      required: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationAttempts: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

otpSchema.index({ userId: 1, otpType: 1 });
otpSchema.index({ email: 1, expiresAt: 1 });

module.exports = mongoose.model('OTP', otpSchema);
