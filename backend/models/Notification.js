const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  vehicleId: { type: String, required: true },
  messageType: { type: String, required: true }, // e.g., 'blocking', 'emergency'
  message: { type: String }, // Custom message
  imageUrl: { type: String },
  location: { type: String }, // E.g., 'Lat, Lng'
  senderIp: { type: String }, // Rate limiting or spam prevention
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', NotificationSchema);
