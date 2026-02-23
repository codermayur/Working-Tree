const mongoose = require('mongoose');

const weatherSchema = new mongoose.Schema(
  {
    location: {
      state: String,
      district: String,
      coordinates: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], index: '2dsphere' },
      },
    },
    current: {
      temperature: Number,
      feelsLike: Number,
      humidity: Number,
      windSpeed: Number,
      rainfall: Number,
      condition: String,
      icon: String,
    },
    forecast: [
      {
        date: Date,
        tempMin: Number,
        tempMax: Number,
        humidity: Number,
        rainfall: Number,
        condition: String,
        icon: String,
      },
    ],
    alerts: [
      {
        type: {
          type: String,
          enum: ['heavy-rain', 'drought', 'heatwave', 'frost', 'storm'],
        },
        severity: { type: String, enum: ['low', 'medium', 'high', 'severe'] },
        message: String,
        validFrom: Date,
        validTo: Date,
      },
    ],
    cropAdvice: String,
    source: { type: String, default: 'OpenWeatherMap' },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

weatherSchema.index({ 'location.state': 1, 'location.district': 1 });

module.exports = mongoose.model('Weather', weatherSchema);
