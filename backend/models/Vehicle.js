const mongoose = require('mongoose');

const VehicleSchema = new mongoose.Schema({
  vehicleId: { type: String, required: true, unique: true }, // e.g. VC1234
  vehicleNumber: { type: String, required: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  nickname: { type: String, default: '' },
  apartment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Apartment', default: null },
  fleet_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Fleet', default: null },
  region_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Region', default: null },
  lastViewedAt: { type: Date, default: null },
  qrCodeUrl: { type: String }, // To store pre-generated QR URL or data
  createdAt: { type: Date, default: Date.now },
  trial_start_date: { type: Date },
  trial_end_date: { type: Date },
  is_trial: { type: Boolean, default: true },
  status: { type: String, enum: ['active', 'expired', 'paid'], default: 'active' },
  payment_status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
  subscription_plan: { type: String, enum: ['trial', 'paid'], default: 'trial' },
  isDeleted: { type: Boolean, default: false },
  stickerOrder: {
    isActive: { type: Boolean, default: false },
    name: { type: String },
    mobile: { type: String },
    address: { type: String },
    area: { type: String },
    pincode: { type: String },
    state: { type: String },
    status: { type: String, enum: ['processing', 'dispatched', 'in_transit', 'delivered'], default: 'processing' },
    orderedAt: { type: Date }
  },
  temporaryStatus: {
    status: { type: String, enum: ['none', 'will_return_5', 'in_apartment', 'call_only_urgent'], default: 'none' },
    customValue: { type: String, default: '' },
    updatedAt: { type: Date },
    updatedAtLocal: { type: String, default: '' }
  }
});

VehicleSchema.methods.evaluateTrialStatus = async function() {
  let updated = false;
  
  if (!this.trial_start_date || !this.trial_end_date) {
    this.trial_start_date = this.createdAt || new Date();
    const endDate = new Date(this.trial_start_date);
    endDate.setDate(endDate.getDate() + 90);
    this.trial_end_date = endDate;
    updated = true;
  }

  // Check expiry
  if (new Date() > this.trial_end_date && this.status === 'active' && this.subscription_plan !== 'paid') {
    this.status = 'expired';
    updated = true;
  }

  if (updated) {
    await this.save();
  }
  return this;
};

module.exports = mongoose.model('Vehicle', VehicleSchema);
