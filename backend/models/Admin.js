const mongoose = require('mongoose');

const AdminSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    trim: true 
  },
  passwordHash: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    enum: ['SUPER_ADMIN', 'APARTMENT_ADMIN', 'PARKING_AUTHORITY', 'FLEET_MANAGER', 'MODERATOR'], 
    default: 'MODERATOR' 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  name: { 
    type: String, 
    default: '' 
  },
  mobile: { 
    type: String, 
    default: '' 
  },
  organization_type: { 
    type: String, 
    enum: ['apartment', 'fleet', 'none'], 
    default: 'none' 
  },
  organization_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    default: null 
  },
  parent_admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },
  account_type: {
    type: String,
    enum: ['PRIMARY_ORG_ADMIN', 'ORG_SUB_ADMIN', 'MODERATOR', 'OPERATIONS_STAFF', 'SUPER_ADMIN', 'PARKING_AUTHORITY', 'NONE'],
    default: 'NONE'
  },
  last_login: {
    type: Date,
    default: null
  },
  username: {
    type: String,
    unique: true,
    sparse: true
  },
  must_reset_password: {
    type: Boolean,
    default: false
  },
  approval_status: { 
    type: String, 
    enum: ['PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'SUSPENDED', 'NOT_APPLICABLE'], 
    default: 'NOT_APPLICABLE' 
  },
  approved_by: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Admin', 
    default: null 
  },
  approved_at: { 
    type: Date, 
    default: null 
  },
  two_factor_enabled: { 
    type: Boolean, 
    default: false 
  },
  backup_codes: [{ 
    type: String 
  }],
  authenticator_secret: { 
    type: String, 
    default: '' 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Admin', AdminSchema);
