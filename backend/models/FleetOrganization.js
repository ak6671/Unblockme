const mongoose = require('mongoose');

const FleetOrganizationSchema = new mongoose.Schema({
  company_name: { type: String, required: true },
  invite_code: { type: String, unique: true, sparse: true },
  fleet_type: { 
    type: String, 
    enum: ['Delivery', 'Logistics', 'Rental', 'Taxi', 'Corporate Transport'], 
    required: true 
  },
  fleet_size: { type: Number, required: true },
  operating_city: { type: String, required: true },
  address: { type: String, required: true },
  gst_number: { type: String, default: '' },
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

module.exports = mongoose.model('FleetOrganization', FleetOrganizationSchema);
