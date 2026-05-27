const mongoose = require('mongoose');

const OrganizationSchema = new mongoose.Schema({
  organization_name: { 
    type: String, 
    required: true 
  },
  organization_type: { 
    type: String, 
    enum: ['apartment', 'fleet', 'none'], 
    default: 'none' 
  },
  invite_code: { 
    type: String, 
    unique: true, 
    sparse: true 
  },
  primary_admin_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Admin', 
    default: null 
  },
  status: { 
    type: String, 
    enum: ['PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'SUSPENDED'], 
    default: 'PENDING_APPROVAL' 
  },
  created_at: { 
    type: Date, 
    default: Date.now 
  },
  approved_at: { 
    type: Date, 
    default: null 
  }
});

module.exports = mongoose.model('Organization', OrganizationSchema);
