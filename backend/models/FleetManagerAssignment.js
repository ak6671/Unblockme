const mongoose = require('mongoose');

const FleetManagerAssignmentSchema = new mongoose.Schema({
  admin_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
  fleet_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Fleet', required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('FleetManagerAssignment', FleetManagerAssignmentSchema);
