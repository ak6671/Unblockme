const mongoose = require('mongoose');

const ViolationSchema = new mongoose.Schema({
  vehicleId: { type: String, required: true },
  notificationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Notification' },
  severity: { type: Number, default: 1 }, 
  status: { type: String, enum: ['active', 'resolved'], default: 'active' },
  region_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Region', default: null },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Violation', ViolationSchema);
