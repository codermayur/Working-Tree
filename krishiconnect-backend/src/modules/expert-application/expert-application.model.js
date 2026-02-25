/**
 * ExpertApplication — farmer applies to become expert; admin approves/rejects.
 * On approval: User.role → 'expert', roleUpgradeStatus → 'approved'.
 * Includes government-approved certificate (required).
 */
const mongoose = require('mongoose');
const ApiError = require('../../utils/ApiError');

const EXPERTISE_AREAS = [
  'Crop Science',
  'Soil Health',
  'Pest Management',
  'Irrigation',
  'Organic Farming',
  'AgriTech',
  'Livestock',
  'Other',
];

const GOVERNMENT_ID_TYPES = ['Aadhar', 'PAN', 'Passport', 'Voter ID'];

const APPLICATION_STATUSES = ['pending', 'approved', 'rejected'];

const governmentApprovedCertificateSchema = new mongoose.Schema(
  {
    certificateName: { type: String, required: true, trim: true },
    issuingAuthority: { type: String, required: true, trim: true },
    certificateNumber: { type: String, required: true, trim: true },
    issueDate: { type: Date, required: true },
    expiryDate: { type: Date, default: null },
    certificateFileUrl: { type: String, required: true, trim: true },
    isLifelong: { type: Boolean, default: false },
  },
  { _id: false }
);

const expertApplicationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phoneNumber: { type: String, required: true, trim: true },
    expertiseArea: {
      type: String,
      required: true,
      enum: EXPERTISE_AREAS,
    },
    yearsOfExperience: { type: Number, required: true, min: 1, max: 50 },
    specializedDomain: { type: String, required: true, trim: true, minlength: 10, maxlength: 200 },
    governmentApprovedCertificate: {
      type: governmentApprovedCertificateSchema,
      required: true,
    },
    qualifications: { type: String, trim: true },
    currentOrganization: { type: String, trim: true },
    governmentIdType: {
      type: String,
      required: true,
      enum: GOVERNMENT_ID_TYPES,
    },
    governmentIdNumber: { type: String, required: true, trim: true },
    supportingDocuments: [{ type: String }],
    linkedInProfile: { type: String, trim: true },
    shortBio: { type: String, maxlength: 500, trim: true },
    status: {
      type: String,
      enum: APPLICATION_STATUSES,
      default: 'pending',
      index: true,
    },
    adminNote: { type: String, trim: true },
    appliedAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Certificate number unique per application (sparse for legacy docs without certificate)
expertApplicationSchema.index({ 'governmentApprovedCertificate.certificateNumber': 1 }, { sparse: true });
expertApplicationSchema.index({ userId: 1, status: 1 });
expertApplicationSchema.index({ appliedAt: -1 });

// Validate: issueDate not in future; if !isLifelong, expiryDate required and must be future; expiryDate > issueDate
expertApplicationSchema.pre('save', function (next) {
  const cert = this.governmentApprovedCertificate;
  if (!cert) return next();
  const now = new Date();
  if (cert.issueDate > now) {
    return next(new ApiError(400, 'Issue date cannot be a future date'));
  }
  if (!cert.isLifelong) {
    if (!cert.expiryDate) {
      return next(new ApiError(400, 'Expiry date is required when certificate is not lifelong'));
    }
    if (cert.expiryDate <= cert.issueDate) {
      return next(new ApiError(400, 'Expiry date must be after the issue date'));
    }
    if (cert.expiryDate < now) {
      return next(new ApiError(400, 'Your certificate has expired. Please provide a valid certificate.'));
    }
  }
  next();
});

module.exports = mongoose.model('ExpertApplication', expertApplicationSchema);
module.exports.EXPERTISE_AREAS = EXPERTISE_AREAS;
module.exports.GOVERNMENT_ID_TYPES = GOVERNMENT_ID_TYPES;
module.exports.APPLICATION_STATUSES = APPLICATION_STATUSES;
