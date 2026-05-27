const mongoose = require('mongoose');

const ApartmentOrganizationSchema = new mongoose.Schema({
  apartment_name: { type: String, required: true },
  invite_code: { type: String, unique: true, sparse: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  total_units: { type: Number, required: true },
  parking_slots: { type: Number, required: true },
  community_type: { 
    type: String, 
    enum: ['Apartment', 'Gated Community', 'Villa Community', 'Commercial Complex'],
    required: true
  },
  website: { type: String, default: '' },
  notes: { type: String, default: '' },
  organization_status: { 
    type: String, 
    enum: ['PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'SUSPENDED'], 
    default: 'PENDING_APPROVAL' 
  },
  created_by_admin_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
  approved_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
  approved_at: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ApartmentOrganization', ApartmentOrganizationSchema);
