const mongoose = require('mongoose');

const ApartmentSchema = new mongoose.Schema({
  apartment_name: { type: String, required: true },
  location: { type: String },
  city: { type: String },
  invite_code: { type: String, unique: true, sparse: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Apartment', ApartmentSchema);
