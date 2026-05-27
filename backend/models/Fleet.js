const mongoose = require('mongoose');

const FleetSchema = new mongoose.Schema({
  fleet_name: { type: String, required: true },
  company_name: { type: String, required: true },
  invite_code: { type: String, unique: true, sparse: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Fleet', FleetSchema);
