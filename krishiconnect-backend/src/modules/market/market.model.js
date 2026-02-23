const mongoose = require('mongoose');

const marketPriceSchema = new mongoose.Schema(
  {
    state: { type: String, required: true, index: true },
    district: { type: String, required: true },
    market: { type: String, required: true },
    commodity: { type: String, required: true, index: true },
    variety: String,
    grade: String,
    minPrice: { type: Number, required: true },
    maxPrice: { type: Number, required: true },
    modalPrice: { type: Number, required: true },
    arrivals: Number,
    priceDate: { type: Date, required: true, index: true },
    source: { type: String, default: 'Agmarknet' },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

marketPriceSchema.index({ state: 1, commodity: 1, priceDate: -1 });
marketPriceSchema.index({ market: 1, commodity: 1, priceDate: -1 });

module.exports = mongoose.model('MarketPrice', marketPriceSchema);
