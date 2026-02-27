const mongoose = require('mongoose');

const { Schema } = mongoose;

const locationSchema = new Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
    },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      /**
       * GeoJSON [longitude, latitude]
       */
      coordinates: {
        type: [Number],
        validate: {
          validator(value) {
            if (!value || value.length === 0) return true;
            return value.length === 2 && value.every((n) => typeof n === 'number' && Number.isFinite(n));
          },
          message: 'coordinates must be [lng, lat]',
        },
      },
    },
  },
  { _id: false }
);

const imageSchema = new Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },
    publicId: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const opportunitySchema = new Schema(
  {
    farmer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['job', 'equipment', 'cattle'],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 3000,
    },
    /**
     * Common commercial fields
     */
    paymentType: {
      type: String,
      enum: ['per_day', 'per_hour', 'fixed', 'per_acre', null],
      default: null,
    },
    amount: {
      type: Number,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    urgent: {
      type: Boolean,
      default: false,
      index: true,
    },
    ratingAverage: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    ratingCount: {
      type: Number,
      min: 0,
      default: 0,
    },
    applicantsCount: {
      type: Number,
      min: 0,
      default: 0,
    },
    location: {
      type: locationSchema,
      required: true,
    },
    requirements: [
      {
        type: String,
        trim: true,
        maxlength: 300,
      },
    ],
    images: {
      type: [imageSchema],
      default: [],
    },
    availabilityFrom: {
      type: Date,
    },
    availabilityTo: {
      type: Date,
    },
    /**
     * Job opportunity specific fields
     */
    workType: {
      type: String,
      enum: ['harvesting', 'planting', 'irrigation', 'labour', 'other', null],
      default: null,
    },
    workersRequired: {
      type: Number,
      min: 1,
    },
    startDate: {
      type: Date,
    },
    durationDays: {
      type: Number,
      min: 0,
    },
    durationHours: {
      type: Number,
      min: 0,
    },
    foodIncluded: {
      type: Boolean,
      default: false,
    },
    stayIncluded: {
      type: Boolean,
      default: false,
    },
    contactMethods: [
      {
        type: String,
        enum: ['call', 'whatsapp', 'chat'],
      },
    ],
    /**
     * Equipment rental specific fields
     */
    equipmentName: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    equipmentBrandModel: {
      type: String,
      trim: true,
      maxlength: 160,
    },
    equipmentCondition: {
      type: String,
      enum: ['new', 'good', 'average', null],
      default: null,
    },
    rentalUnit: {
      type: String,
      enum: ['per_hour', 'per_day', 'per_acre', null],
      default: null,
    },
    securityDeposit: {
      type: Number,
      min: 0,
    },
    deliveryAvailable: {
      type: Boolean,
      default: false,
    },
    fuelIncluded: {
      type: Boolean,
      default: false,
    },
    /**
     * Cattle rental specific fields
     */
    animalType: {
      type: String,
      enum: ['cow', 'buffalo', 'bull', 'ox', null],
      default: null,
    },
    purpose: {
      type: String,
      enum: ['ploughing', 'dairy', 'transport', 'other', null],
      default: null,
    },
    pricePerDay: {
      type: Number,
      min: 0,
    },
    healthCondition: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    vaccinated: {
      type: Boolean,
      default: false,
    },
    ageYears: {
      type: Number,
      min: 0,
      max: 40,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

opportunitySchema.index({ 'location.coordinates': '2dsphere' });
opportunitySchema.index({ type: 1, urgent: 1, createdAt: -1 });
opportunitySchema.index({ farmer: 1, createdAt: -1 });

module.exports = mongoose.model('Opportunity', opportunitySchema);

