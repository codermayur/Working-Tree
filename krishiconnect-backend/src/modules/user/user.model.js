const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      validate: {
        validator: (v) => /^[6-9]\d{9}$/.test(v),
        message: 'Invalid Indian phone number',
      },
    },
    email: {
      type: String,
      sparse: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    password: {
      type: String,
      select: false,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    username: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
      index: true,
    },
    avatar: {
      url: String,
      publicId: String,
    },
    profilePhoto: {
      url: String,
      publicId: String,
    },
    bio: {
      type: String,
      maxlength: 500,
    },
    location: {
      city: String,
      state: String,
      district: String,
      village: String,
      country: { type: String, default: 'India' },
      coordinates: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point',
        },
        coordinates: {
          type: [Number],
          index: '2dsphere',
        },
      },
    },

    farmSize: {
      value: Number,
      unit: {
        type: String,
        enum: ['acres', 'hectares'],
        default: 'acres',
      },
    },
    crops: [
      {
        type: String,
        enum: ['rice', 'wheat', 'cotton', 'sugarcane', 'vegetables', 'fruits', 'pulses', 'other'],
      },
    ],
    languages: [
      {
        type: String,
        enum: ['hindi', 'english', 'punjabi', 'tamil', 'telugu', 'marathi', 'bengali', 'gujarati'],
        default: ['hindi'],
      },
    ],

    isExpert: {
      type: Boolean,
      default: false,
    },
    expertDetails: {
      specialization: String,
      qualifications: [String],
      experience: Number,
      verificationDocs: [
        {
          type: {
            type: String,
            enum: ['aadhar', 'degree', 'certificate', 'id'],
          },
          url: String,
          publicId: String,
        },
      ],
      verifiedAt: Date,
      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    },

    stats: {
      followersCount: { type: Number, default: 0 },
      followingCount: { type: Number, default: 0 },
      postsCount: { type: Number, default: 0 },
      likesCount: { type: Number, default: 0 },
      questionsAsked: { type: Number, default: 0 },
      answersGiven: { type: Number, default: 0 },
      savedCount: { type: Number, default: 0 },
      profileViewers: { type: Number, default: 0 },
      postImpressions: { type: Number, default: 0 },
    },

    background: {
      url: String,
      publicId: String,
    },
    backgroundPreset: {
      type: String,
      enum: ['default', 'gradient_teal', 'gradient_blue', 'gradient_purple', 'solid_green', 'gradient_orange', 'gradient_dark', 'custom'],
      default: 'default',
    },
    profileCompleteness: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    lastProfileUpdate: Date,

    preferences: {
      language: {
        type: String,
        enum: ['en', 'hi', 'mr'],
        default: 'en',
      },
      darkMode: {
        type: Boolean,
        default: false,
      },
      notifications: {
        push: { type: Boolean, default: true },
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
      },
      privacy: {
        profileVisibility: {
          type: String,
          enum: ['public', 'followers', 'private'],
          default: 'public',
        },
        showLocation: { type: Boolean, default: true },
      },
    },

    fcmTokens: [
      {
        token: String,
        device: String,
        createdAt: Date,
      },
    ],
    refreshTokens: [
      {
        token: String,
        expiresAt: Date,
      },
    ],
    lastLogin: Date,
    emailVerified: {
      type: Boolean,
      default: false,
    },
    verificationStatus: {
      type: String,
      enum: ['unverified', 'verified', 'suspended'],
      default: 'unverified',
    },
    lastPasswordChangeAt: Date,
    isActive: {
      type: Boolean,
      default: true,
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },

    schemaVersion: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSchema.index({ phoneNumber: 1 });
userSchema.index({ email: 1 });
// Single compound text index for search (name, username, bio, specialization, location)
userSchema.index(
  {
    name: 'text',
    username: 'text',
    bio: 'text',
    'expertDetails.specialization': 'text',
    'location.city': 'text',
    'location.state': 'text',
  },
  { name: 'search_text' }
);
userSchema.index({ 'location.state': 1, 'location.district': 1 });
userSchema.index({ isExpert: 1, 'expertDetails.specialization': 1 });
userSchema.index({ createdAt: -1 });

// Networking recommendations: location-based + pagination
userSchema.index({ 'location.city': 1, isActive: 1 });
userSchema.index({ 'location.state': 1, isActive: 1 });
userSchema.index({ 'location.country': 1, isActive: 1 });
userSchema.index({ 'stats.followersCount': -1 });
userSchema.index({ lastProfileUpdate: -1 });

userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.computeProfileCompleteness = function () {
  let score = 0;
  if (this.name && this.name.trim().length > 0) score += 25;
  if (this.profilePhoto?.url || this.avatar?.url) score += 25;
  if (this.bio && this.bio.trim().length > 0) score += 25;
  if (this.background?.url || (this.backgroundPreset && this.backgroundPreset !== 'default')) score += 25;
  this.profileCompleteness = Math.min(100, score);
  return this.profileCompleteness;
};

module.exports = mongoose.model('User', userSchema);
