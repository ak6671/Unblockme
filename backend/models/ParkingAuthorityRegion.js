const mongoose = require('mongoose');

const ParkingAuthorityRegionSchema = new mongoose.Schema({
  admin_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
  region_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Region', required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ParkingAuthorityRegion', ParkingAuthorityRegionSchema);
