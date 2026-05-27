const mongoose = require('mongoose');

const ApartmentAdminAssignmentSchema = new mongoose.Schema({
  admin_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
  apartment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Apartment', required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ApartmentAdminAssignment', ApartmentAdminAssignmentSchema);
