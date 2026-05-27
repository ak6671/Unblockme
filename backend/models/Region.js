const mongoose = require('mongoose');

const RegionSchema = new mongoose.Schema({
  region_name: { type: String, required: true },
  geo_boundary: {
    minLat: { type: Number, required: true },
    maxLat: { type: Number, required: true },
    minLng: { type: Number, required: true },
    maxLng: { type: Number, required: true }
  },
  city: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Region', RegionSchema);
