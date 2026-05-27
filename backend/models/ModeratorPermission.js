const mongoose = require('mongoose');

const ModeratorPermissionSchema = new mongoose.Schema({
  moderatorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Admin', 
    required: true 
  },
  access_scope: { 
    type: String, 
    required: true 
  }, // e.g., 'view_only', 'edit_violations'
  allowed_regions: [{ 
    type: String 
  }] // e.g., ['MH-12', 'DL-01', 'Zone-A']
});

module.exports = mongoose.model('ModeratorPermission', ModeratorPermissionSchema);
