const mongoose = require('mongoose');

const { Schema } = mongoose;

const applicationSchema = new Schema(
  {
    opportunity: {
      type: Schema.Types.ObjectId,
      ref: 'Opportunity',
      required: true,
      index: true,
    },
    applicant: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      trim: true,
      maxlength: 160,
    },
    experience: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    experienceYears: {
      type: Number,
      min: 0,
      max: 80,
    },
    expectedPay: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    message: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 20,
    },
    aadhaarLast4: {
      type: String,
      trim: true,
      minlength: 4,
      maxlength: 4,
    },
    govtIdHash: {
      type: String,
      select: false,
    },
    skills: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    idProofUrl: {
      type: String,
      trim: true,
      maxlength: 1024,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

applicationSchema.index({ opportunity: 1, applicant: 1 }, { unique: true });

module.exports = mongoose.model('OpportunityApplication', applicationSchema);

