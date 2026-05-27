const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');
const Notification = require('../models/Notification');
const Violation = require('../models/Violation');
const User = require('../models/User');

// Helper to mask owner name dynamically
function maskName(name) {
  if (!name) return '***';
  const parts = name.split(' ');
  return parts.map(part => {
    if (part.length <= 3) return part[0] + '*'.repeat(part.length - 1);
    return part.substring(0, 3) + '*'.repeat(part.length - 3);
  }).join(' ');
}

// Helper to mask owner phone dynamically
function maskPhone(phone) {
  if (!phone) return '**********';
  const phoneStr = String(phone);
  if (phoneStr.length <= 4) return '*'.repeat(phoneStr.length);
  return '*'.repeat(phoneStr.length - 4) + phoneStr.substring(phoneStr.length - 4);
}

// Helper to filter vehicle datasets based on role restrictions dynamically from DB
const getRoleVehicleFilter = async (admin) => {
  if (admin.role === 'SUPER_ADMIN' || admin.role === 'PARKING_AUTHORITY' || admin.role === 'MODERATOR') {
    return {}; // Full platform vehicle access (filtered on violation or masked on detailed views)
  }
  if (admin.role === 'APARTMENT_ADMIN') {
    const ApartmentAdminAssignment = require('../models/ApartmentAdminAssignment');
    const assignments = await ApartmentAdminAssignment.find({ admin_id: admin._id });
    const apartmentIds = assignments.map(a => a.apartment_id);
    
    if (admin.organization_id && !apartmentIds.some(id => id.toString() === admin.organization_id.toString())) {
      apartmentIds.push(admin.organization_id);
    }
    
    return { apartment_id: { $in: apartmentIds } };
  }
  if (admin.role === 'FLEET_MANAGER') {
    const FleetManagerAssignment = require('../models/FleetManagerAssignment');
    const assignments = await FleetManagerAssignment.find({ admin_id: admin._id });
    const fleetIds = assignments.map(a => a.fleet_id);
    
    if (admin.organization_id && !fleetIds.some(id => id.toString() === admin.organization_id.toString())) {
      fleetIds.push(admin.organization_id);
    }
    
    return { fleet_id: { $in: fleetIds } };
  }
  return { _id: null }; // Deactivated/unknown role has zero access
};

// GET /admin/analytics - Aggregated violation metrics
router.get('/analytics', async (req, res) => {
  const { role } = req.admin;

  // Access limits check
  if (role === 'MODERATOR') {
    return res.status(403).json({ error: 'Access denied: Analytics restricted for this administrative role.' });
  }

  try {
    const roleFilter = await getRoleVehicleFilter(req.admin);
    const targetVehicles = await Vehicle.find(roleFilter);
    const targetVehicleIds = targetVehicles.map(v => v.vehicleId);

    // Fetch violations and filter based on allowed vehicles
    let violations = await Violation.find().populate('notificationId');
    let activeViolations = violations.filter(v => 
      v.notificationId && 
      v.notificationId.messageType !== 'headlights_on'
    );

    // If role is restricted, filter violations to their vehicle subset or regions
    if (role === 'APARTMENT_ADMIN' || role === 'FLEET_MANAGER') {
      activeViolations = activeViolations.filter(v => targetVehicleIds.includes(v.vehicleId));
    } else if (role === 'PARKING_AUTHORITY') {
      const ParkingAuthorityRegion = require('../models/ParkingAuthorityRegion');
      const assignments = await ParkingAuthorityRegion.find({ admin_id: req.admin._id });
      const regionIds = assignments.map(a => a.region_id.toString());
      activeViolations = activeViolations.filter(v => v.region_id && regionIds.includes(v.region_id.toString()));
    }

    // 1. Calculate most common violation types
    const typeCounts = {};
    activeViolations.forEach(v => {
      const type = v.notificationId.messageType || 'other';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
    const commonTypes = Object.entries(typeCounts).map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);

    // 2. Hotspot locations
    const locationCounts = {};
    activeViolations.forEach(v => {
      const loc = v.notificationId.location;
      if (loc) {
        locationCounts[loc] = (locationCounts[loc] || 0) + 1;
      }
    });
    const hotspots = Object.entries(locationCounts).map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count).slice(0, 10);

    // 3. Repeated Offenders (Vehicles with >= 2 violations)
    const vehicleCounts = {};
    activeViolations.forEach(v => {
      if (v.vehicleId) {
        vehicleCounts[v.vehicleId] = (vehicleCounts[v.vehicleId] || 0) + 1;
      }
    });

    const offenderIds = Object.keys(vehicleCounts).filter(id => vehicleCounts[id] > 1);
    const repeatedOffenders = await Promise.all(offenderIds.map(async id => {
      const vehicle = await Vehicle.findOne({ vehicleId: id });
      if (!vehicle) return null;
      
      const owner = await User.findById(vehicle.ownerId);
      return {
        vehicleId: id,
        vehicleNumber: vehicle.vehicleNumber,
        nickname: vehicle.nickname || '',
        violationsCount: vehicleCounts[id],
        ownerName: role === 'MODERATOR' ? maskName(owner?.name) : (owner?.name || 'Unknown Owner'),
        ownerPhone: role === 'MODERATOR' ? maskPhone(owner?.phone) : (owner?.phone || 'N/A')
      };
    }));
    
    const sortedOffenders = repeatedOffenders
      .filter(o => o !== null)
      .sort((a, b) => b.violationsCount - a.violationsCount);

    let inviteCode = null;
    let organizationName = null;
    if (req.admin.organization_id) {
      const Organization = require('../models/Organization');
      const org = await Organization.findById(req.admin.organization_id);
      if (org) {
        if (!org.invite_code) {
          const cleanName = org.organization_name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10).toUpperCase();
          org.invite_code = `${cleanName}-${Math.floor(100 + Math.random() * 900)}`;
          await org.save();
        }
        inviteCode = org.invite_code;
        organizationName = org.organization_name;

        // Sync invite code to legacy records if they exist
        if (req.admin.role === 'APARTMENT_ADMIN') {
          const Apartment = require('../models/Apartment');
          await Apartment.findByIdAndUpdate(org._id, { invite_code: org.invite_code });
        } else if (req.admin.role === 'FLEET_MANAGER') {
          const Fleet = require('../models/Fleet');
          await Fleet.findByIdAndUpdate(org._id, { invite_code: org.invite_code });
        }
      }
    }

    res.json({
      totalViolations: activeViolations.length,
      repeatedOffendersCount: sortedOffenders.length,
      repeatedOffenders: sortedOffenders,
      commonTypes,
      hotspots,
      inviteCode,
      organizationName
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /admin/search - Search vehicles with role constraints
router.get('/search', async (req, res) => {
  const { role } = req.admin;
  
  try {
    const { q } = req.query;
    const roleFilter = await getRoleVehicleFilter(req.admin);
    let searchFilter = roleFilter;

    if (q) {
      const queryClean = q.trim();
      searchFilter = {
        $and: [
          roleFilter,
          {
            $or: [
              { vehicleNumber: { $regex: queryClean, $options: 'i' } },
              { vehicleId: { $regex: queryClean, $options: 'i' } },
              { nickname: { $regex: queryClean, $options: 'i' } }
            ]
          }
        ]
      };
    }

    const vehicles = await Vehicle.find(searchFilter);

    const results = await Promise.all(vehicles.map(async v => {
      const owner = await User.findById(v.ownerId);
      const violations = await Violation.find({ vehicleId: v.vehicleId }).populate('notificationId');
      const violationCount = violations.filter(vi => vi.notificationId && vi.notificationId.messageType !== 'headlights_on').length;

      // Mask details if user is a Moderator (View-only moderation bounds)
      const shouldMask = role === 'MODERATOR';
      return {
        vehicleId: v.vehicleId,
        vehicleNumber: v.vehicleNumber,
        nickname: v.nickname,
        isDeleted: v.isDeleted || false,
        ownerName: shouldMask ? maskName(owner?.name) : (owner?.name || 'Unknown'),
        ownerPhone: shouldMask ? maskPhone(owner?.phone) : (owner?.phone || 'N/A'),
        violationCount,
        stickerStatus: v.stickerOrder?.isActive ? v.stickerOrder.status : 'not_ordered'
      };
    }));

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /admin/violations - Timeline log feed filtered by role bounds
router.get('/violations', async (req, res) => {
  const { role } = req.admin;

  try {
    const roleFilter = await getRoleVehicleFilter(req.admin);
    const targetVehicles = await Vehicle.find(roleFilter);
    const targetVehicleIds = targetVehicles.map(v => v.vehicleId);

    const violations = await Violation.find().sort({ createdAt: -1 }).populate('notificationId');
    
    // If role is PARKING_AUTHORITY, filter by assigned regions
    let regionIds = [];
    if (role === 'PARKING_AUTHORITY') {
      const ParkingAuthorityRegion = require('../models/ParkingAuthorityRegion');
      const assignments = await ParkingAuthorityRegion.find({ admin_id: req.admin._id });
      regionIds = assignments.map(a => a.region_id.toString());
    }

    const results = await Promise.all(violations.map(async v => {
      if (!v.notificationId) return null;
      
      // Filter by vehicles for Apartment / Fleet
      if (role === 'APARTMENT_ADMIN' || role === 'FLEET_MANAGER') {
        if (!targetVehicleIds.includes(v.vehicleId)) return null;
      }
      // Filter by regions for Parking Authority
      if (role === 'PARKING_AUTHORITY') {
        if (!v.region_id || !regionIds.includes(v.region_id.toString())) return null;
      }

      const vehicle = await Vehicle.findOne({ vehicleId: v.vehicleId });
      const owner = vehicle ? await User.findById(vehicle.ownerId) : null;
      const shouldMask = role === 'MODERATOR';

      return {
        _id: v._id,
        severity: v.severity,
        createdAt: v.createdAt,
        notification: v.notificationId,
        vehicleDetails: vehicle ? {
          vehicleId: vehicle.vehicleId,
          vehicleNumber: vehicle.vehicleNumber,
          nickname: vehicle.nickname,
          ownerName: shouldMask ? maskName(owner?.name) : (owner?.name || 'Unknown Owner'),
          ownerPhone: shouldMask ? maskPhone(owner?.phone) : (owner?.phone || 'N/A')
        } : null
      };
    }));

    res.json(results.filter(r => r !== null && r.notification.messageType !== 'headlights_on'));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /admin/vehicle/:vehicleId - Detail inspection view with RBAC filters
router.get('/vehicle/:vehicleId', async (req, res) => {
  const { role } = req.admin;
  const { vehicleId } = req.params;

  try {
    const vehicle = await Vehicle.findOne({ vehicleId });
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

    // Validate role bounds
    const roleFilter = await getRoleVehicleFilter(req.admin);
    const isAuthorized = await Vehicle.findOne({ $and: [{ vehicleId }, roleFilter] });
    if (!isAuthorized) {
      return res.status(403).json({ error: 'Access denied: This vehicle details are out of your assigned scope.' });
    }

    const owner = await User.findById(vehicle.ownerId);
    const violations = await Violation.find({ vehicleId }).populate('notificationId').sort({ createdAt: -1 });
    const notifications = await Notification.find({ vehicleId }).sort({ createdAt: -1 });

    const shouldMask = role === 'MODERATOR';

    res.json({
      vehicle,
      owner: owner ? {
        name: shouldMask ? maskName(owner.name) : owner.name,
        phone: shouldMask ? maskPhone(owner.phone) : owner.phone,
        profilePhoto: shouldMask ? '' : owner.profilePhoto,
        drivingLicense: shouldMask ? '**********' : owner.drivingLicense
      } : null,
      violations: violations.filter(v => v.notificationId && v.notificationId.messageType !== 'headlights_on'),
      notifications
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /admin/assignments - Fetch all assignments for Super Admin Scope Panel
router.get('/assignments', async (req, res) => {
  if (req.admin.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Super Admin permissions required.' });
  }
  try {
    const ApartmentAdminAssignment = require('../models/ApartmentAdminAssignment');
    const FleetManagerAssignment = require('../models/FleetManagerAssignment');
    const ParkingAuthorityRegion = require('../models/ParkingAuthorityRegion');

    const apts = await ApartmentAdminAssignment.find().populate('apartment_id').populate('admin_id');
    const fleets = await FleetManagerAssignment.find().populate('fleet_id').populate('admin_id');
    const regions = await ParkingAuthorityRegion.find().populate('region_id').populate('admin_id');

    res.json({ apts, fleets, regions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /admin/list-admins - List all system admin accounts
router.get('/list-admins', async (req, res) => {
  if (req.admin.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Super Admin permissions required.' });
  }
  try {
    const Admin = require('../models/Admin');
    const list = await Admin.find({}, { passwordHash: 0, backup_codes: 0, authenticator_secret: 0 }).sort({ email: 1 });
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /admin/assign - Create dynamic scope assignment
router.post('/assign', async (req, res) => {
  if (req.admin.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Super Admin permissions required.' });
  }
  const { adminId, type, targetId } = req.body;
  try {
    if (type === 'apartment') {
      const ApartmentAdminAssignment = require('../models/ApartmentAdminAssignment');
      const exists = await ApartmentAdminAssignment.findOne({ admin_id: adminId, apartment_id: targetId });
      if (!exists) {
        await ApartmentAdminAssignment.create({ admin_id: adminId, apartment_id: targetId });
      }
    } else if (type === 'fleet') {
      const FleetManagerAssignment = require('../models/FleetManagerAssignment');
      const exists = await FleetManagerAssignment.findOne({ admin_id: adminId, fleet_id: targetId });
      if (!exists) {
        await FleetManagerAssignment.create({ admin_id: adminId, fleet_id: targetId });
      }
    } else if (type === 'region') {
      const ParkingAuthorityRegion = require('../models/ParkingAuthorityRegion');
      const exists = await ParkingAuthorityRegion.findOne({ admin_id: adminId, region_id: targetId });
      if (!exists) {
        await ParkingAuthorityRegion.create({ admin_id: adminId, region_id: targetId });
      }
    } else {
      return res.status(400).json({ error: 'Invalid assignment type' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /admin/revoke - Revoke scope assignment
router.post('/revoke', async (req, res) => {
  if (req.admin.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Super Admin permissions required.' });
  }
  const { assignmentId, type } = req.body;
  try {
    if (type === 'apartment') {
      const ApartmentAdminAssignment = require('../models/ApartmentAdminAssignment');
      await ApartmentAdminAssignment.findByIdAndDelete(assignmentId);
    } else if (type === 'fleet') {
      const FleetManagerAssignment = require('../models/FleetManagerAssignment');
      await FleetManagerAssignment.findByIdAndDelete(assignmentId);
    } else if (type === 'region') {
      const ParkingAuthorityRegion = require('../models/ParkingAuthorityRegion');
      await ParkingAuthorityRegion.findByIdAndDelete(assignmentId);
    } else {
      return res.status(400).json({ error: 'Invalid revocation type' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /admin/targets - Fetch all apartments, fleets, and regions for dropdown selections
router.get('/targets', async (req, res) => {
  if (req.admin.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Super Admin permissions required.' });
  }
  try {
    const Apartment = require('../models/Apartment');
    const Fleet = require('../models/Fleet');
    const Region = require('../models/Region');

    const apartments = await Apartment.find().sort({ apartment_name: 1 });
    const fleets = await Fleet.find().sort({ fleet_name: 1 });
    const regions = await Region.find().sort({ region_name: 1 });

    res.json({ apartments, fleets, regions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Non-sequential unique invite code generator
function generateInviteCode(name, type) {
  const cleanName = name.toUpperCase().replace(/[^A-Z0-9\s-]/g, '').trim();
  const words = cleanName.split(/\s+/);
  
  if (type === 'apartment') {
    // e.g. PRESTIGE-443
    const prefix = words[0] || 'COMMUNITY';
    const rand = Math.floor(100 + Math.random() * 900); // 3-digit
    return `${prefix}-${rand}`;
  } else {
    // e.g. SWIGGY-OMR-22 or QUICK-TRANS-88
    let prefix = words.slice(0, 2).join('-');
    if (!prefix) prefix = 'FLEET';
    const rand = Math.floor(10 + Math.random() * 90); // 2-digit
    return `${prefix}-${rand}`;
  }
}

// GET /admin/organizations/pending - Retrieve pending approval requests (SUPER_ADMIN only)
router.get('/organizations/pending', async (req, res) => {
  if (req.admin.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Super Admin permissions required.' });
  }

  try {
    const ApartmentOrganization = require('../models/ApartmentOrganization');
    const FleetOrganization = require('../models/FleetOrganization');
    const Admin = require('../models/Admin');
    
    // Find admins with pending approval
    const pendingAdmins = await Admin.find({ approval_status: 'PENDING_APPROVAL' }).select('-passwordHash');
    
    const results = [];
    for (let admin of pendingAdmins) {
      let orgDetails = null;
      if (admin.organization_type === 'apartment') {
        orgDetails = await ApartmentOrganization.findById(admin.organization_id);
      } else if (admin.organization_type === 'fleet') {
        orgDetails = await FleetOrganization.findById(admin.organization_id);
      }

      results.push({
        admin,
        orgDetails
      });
    }

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /admin/organizations/active - Retrieve all approved organizations for dashboard analytics
router.get('/organizations/active', async (req, res) => {
  if (req.admin.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Super Admin permissions required.' });
  }

  try {
    const ApartmentOrganization = require('../models/ApartmentOrganization');
    const FleetOrganization = require('../models/FleetOrganization');

    const aptOrgs = await ApartmentOrganization.find().populate('created_by_admin_id', 'name email mobile');
    const fleetOrgs = await FleetOrganization.find().populate('created_by_admin_id', 'name email mobile');

    res.json({
      apartments: aptOrgs,
      fleets: fleetOrgs
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /admin/organizations/resolve - Approve / Reject / Suspend onboarding requests
router.post('/organizations/resolve', async (req, res) => {
  if (req.admin.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Super Admin permissions required.' });
  }

  const { adminId, action } = req.body;
  if (!adminId || !action) {
    return res.status(400).json({ error: 'Admin ID and action are required.' });
  }

  const validActions = ['approve', 'reject', 'suspend'];
  if (!validActions.includes(action.toLowerCase())) {
    return res.status(400).json({ error: 'Invalid action. Must be approve, reject, or suspend.' });
  }

  try {
    const ApartmentOrganization = require('../models/ApartmentOrganization');
    const FleetOrganization = require('../models/FleetOrganization');
    const Admin = require('../models/Admin');
    const Apartment = require('../models/Apartment');
    const Fleet = require('../models/Fleet');
    const ApartmentAdminAssignment = require('../models/ApartmentAdminAssignment');
    const FleetManagerAssignment = require('../models/FleetManagerAssignment');

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({ error: 'Administrator account not found.' });
    }

    let org = null;
    if (admin.organization_type === 'apartment') {
      org = await ApartmentOrganization.findById(admin.organization_id);
    } else if (admin.organization_type === 'fleet') {
      org = await FleetOrganization.findById(admin.organization_id);
    }

    if (!org) {
      return res.status(404).json({ error: 'Associated organization profile not found.' });
    }

    const actionClean = action.toLowerCase();
    
    if (actionClean === 'approve') {
      // Generate unique invite code if not already generated
      let code = org.invite_code;
      if (!code) {
        let isUnique = false;
        // Loop to ensure uniqueness
        while (!isUnique) {
          code = generateInviteCode(
            admin.organization_type === 'apartment' ? org.apartment_name : org.company_name,
            admin.organization_type
          );
          
          const aptCodeExists = await ApartmentOrganization.findOne({ invite_code: code });
          const fleetCodeExists = await FleetOrganization.findOne({ invite_code: code });
          if (!aptCodeExists && !fleetCodeExists) {
            isUnique = true;
          }
        }
        org.invite_code = code;
      }

      org.organization_status = 'APPROVED';
      org.approved_by = req.admin._id;
      org.approved_at = new Date();
      await org.save();

      // Create new unified Organization record
      const Organization = require('../models/Organization');
      const orgName = admin.organization_type === 'apartment' ? org.apartment_name : org.company_name;
      let newOrg = await Organization.findById(org._id);
      if (!newOrg) {
        newOrg = await Organization.create({
          _id: org._id,
          organization_name: orgName,
          organization_type: admin.organization_type,
          invite_code: code,
          primary_admin_id: admin._id,
          status: 'APPROVED',
          created_at: org.createdAt || new Date(),
          approved_at: new Date()
        });
      } else {
        newOrg.invite_code = code;
        newOrg.status = 'APPROVED';
        newOrg.primary_admin_id = admin._id;
        newOrg.approved_at = new Date();
        await newOrg.save();
      }

      // Generate organization login credentials
      const baseUsername = orgName.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      let username = `${baseUsername}_admin`;
      let isUsernameUnique = false;
      let suffix = 0;
      while (!isUsernameUnique) {
        const checkUsername = suffix === 0 ? username : `${baseUsername}_admin${suffix}`;
        const checkExists = await Admin.findOne({ username: checkUsername });
        if (!checkExists) {
          username = checkUsername;
          isUsernameUnique = true;
        } else {
          suffix++;
        }
      }

      const initials = orgName.split(' ').map(w => w[0]).join('').toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 3);
      const paddedInitials = initials + (initials.length < 3 ? 'X'.repeat(3 - initials.length) : '');
      const tempPassword = `${paddedInitials}#${Math.floor(1000 + Math.random() * 9000)}`;

      const crypto = require('crypto');
      const tempPasswordHash = crypto.createHash('sha256').update(tempPassword).digest('hex');

      admin.username = username;
      admin.passwordHash = tempPasswordHash;
      admin.must_reset_password = true;
      admin.account_type = 'PRIMARY_ORG_ADMIN';
      admin.approval_status = 'APPROVED';
      admin.isActive = true;
      admin.approved_by = req.admin._id;
      admin.approved_at = new Date();
      admin.organization_id = newOrg._id;
      await admin.save();

      // Auto-assign legacy DB mirror entities & assign legacy scopes so old filters continue seamlessly
      if (admin.organization_type === 'apartment') {
        const legacyApt = await Apartment.findById(org._id);
        if (!legacyApt) {
          await Apartment.create({
            _id: org._id,
            apartment_name: org.apartment_name,
            location: org.address,
            city: org.city,
            invite_code: org.invite_code
          });
        }
        
        const legacyAssignment = await ApartmentAdminAssignment.findOne({ admin_id: admin._id, apartment_id: org._id });
        if (!legacyAssignment) {
          await ApartmentAdminAssignment.create({
            admin_id: admin._id,
            apartment_id: org._id
          });
        }
      } else if (admin.organization_type === 'fleet') {
        const legacyFleet = await Fleet.findById(org._id);
        if (!legacyFleet) {
          await Fleet.create({
            _id: org._id,
            fleet_name: org.company_name,
            company_name: org.company_name,
            invite_code: org.invite_code
          });
        }

        const legacyAssignment = await FleetManagerAssignment.findOne({ admin_id: admin._id, fleet_id: org._id });
        if (!legacyAssignment) {
          await FleetManagerAssignment.create({
            admin_id: admin._id,
            fleet_id: org._id
          });
        }
      }

      // Add a mock system notification log
      const Notification = require('../models/Notification');
      await Notification.create({
        vehicleId: 'SYSTEM',
        messageType: 'custom',
        reportedByIp: req.ip,
        location: org.city || 'Chennai',
        message: `APPROVED: ${admin.organization_type.toUpperCase()} organization "${orgName}" has been successfully approved! Generated credentials - Username: ${username}, Temp Password: ${tempPassword}`
      });

      return res.json({ 
        success: true, 
        message: `Request successfully approved.`,
        credentials: {
          username,
          tempPassword
        }
      });

    } else if (actionClean === 'reject') {
      admin.approval_status = 'REJECTED';
      admin.isActive = false;
      await admin.save();

      org.organization_status = 'REJECTED';
      await org.save();

      const Organization = require('../models/Organization');
      await Organization.findByIdAndUpdate(org._id, { status: 'REJECTED' });
    } else if (actionClean === 'suspend') {
      admin.approval_status = 'SUSPENDED';
      admin.isActive = false;
      await admin.save();

      org.organization_status = 'SUSPENDED';
      await org.save();

      const Organization = require('../models/Organization');
      await Organization.findByIdAndUpdate(org._id, { status: 'SUSPENDED' });
    }

    res.json({ success: true, message: `Request successfully ${actionClean}d.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /admin/organizations/directory - Super Admin organization hierarchy view
router.get('/organizations/directory', async (req, res) => {
  if (req.admin.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Super Admin permissions required.' });
  }

  try {
    const Organization = require('../models/Organization');
    const Admin = require('../models/Admin');
    const Vehicle = require('../models/Vehicle');

    const orgs = await Organization.find({});
    const apartments = [];
    const fleets = [];

    for (const org of orgs) {
      const admins = await Admin.find({ organization_id: org._id });
      const activeAdminCount = admins.filter(a => a.isActive && a.approval_status === 'APPROVED').length;
      
      let totalVehicles = 0;
      if (org.organization_type === 'apartment') {
        totalVehicles = await Vehicle.countDocuments({ apartment_id: org._id });
      } else if (org.organization_type === 'fleet') {
        totalVehicles = await Vehicle.countDocuments({ fleet_id: org._id });
      }

      const orgData = {
        id: org._id,
        organization_name: org.organization_name,
        organization_type: org.organization_type,
        invite_code: org.invite_code || 'N/A',
        status: org.status,
        created_at: org.created_at,
        approved_at: org.approved_at,
        activeAdminCount,
        totalVehicles,
        admins: admins.map(a => ({
          id: a._id,
          name: a.name,
          email: a.email,
          username: a.username,
          role: a.role,
          account_type: a.account_type,
          isActive: a.isActive,
          approval_status: a.approval_status,
          last_login: a.last_login
        }))
      };

      if (org.organization_type === 'apartment') {
        apartments.push(orgData);
      } else if (org.organization_type === 'fleet') {
        fleets.push(orgData);
      }
    }

    // Fetch Parking Authorities
    const parkingAdmins = await Admin.find({ role: 'PARKING_AUTHORITY' });
    const parking = parkingAdmins.map(a => ({
      id: a._id,
      name: a.name || 'Parking Operator',
      email: a.email,
      username: a.username,
      role: a.role,
      account_type: a.account_type,
      isActive: a.isActive,
      approval_status: a.approval_status,
      last_login: a.last_login
    }));

    res.json({ apartments, fleets, parking });
  } catch (error) {
    console.error('Directory Fetch Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /admin/team - Get all sub-admins of the logged-in admin's organization
router.get('/team', async (req, res) => {
  if (req.admin.account_type !== 'PRIMARY_ORG_ADMIN') {
    return res.status(403).json({ error: 'Only Primary Organization Administrators can manage team members.' });
  }

  try {
    const Admin = require('../models/Admin');
    const team = await Admin.find({
      organization_id: req.admin.organization_id,
      _id: { $ne: req.admin._id }
    });
    res.json(team);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /admin/team/add - Create a new sub-admin or operations staff
router.post('/team/add', async (req, res) => {
  if (req.admin.account_type !== 'PRIMARY_ORG_ADMIN') {
    return res.status(403).json({ error: 'Only Primary Organization Administrators can manage team members.' });
  }

  const { name, email, username, password, account_type } = req.body;
  if (!name || !email || !username || !password || !account_type) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    const Admin = require('../models/Admin');
    const emailExists = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (emailExists) {
      return res.status(400).json({ error: 'An admin account with this email already exists.' });
    }

    const usernameExists = await Admin.findOne({ username: username.toLowerCase().trim() });
    if (usernameExists) {
      return res.status(400).json({ error: 'An admin account with this username already exists.' });
    }

    const crypto = require('crypto');
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

    const newSub = await Admin.create({
      name,
      email: email.toLowerCase().trim(),
      username: username.toLowerCase().trim(),
      passwordHash,
      role: req.admin.role, // Inherit base operational role (APARTMENT_ADMIN / FLEET_MANAGER)
      account_type,
      parent_admin: req.admin._id,
      organization_id: req.admin.organization_id,
      organization_type: req.admin.organization_type,
      isActive: true,
      approval_status: 'APPROVED',
      must_reset_password: false
    });

    res.status(201).json({ success: true, message: 'Team member added successfully.', teamMember: newSub });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /admin/team/remove - Remove a team member
router.post('/team/remove', async (req, res) => {
  if (req.admin.account_type !== 'PRIMARY_ORG_ADMIN') {
    return res.status(403).json({ error: 'Only Primary Organization Administrators can manage team members.' });
  }

  const { memberId } = req.body;
  if (!memberId) {
    return res.status(400).json({ error: 'Member ID is required.' });
  }

  try {
    const Admin = require('../models/Admin');
    const member = await Admin.findOne({ _id: memberId, organization_id: req.admin.organization_id });
    if (!member) {
      return res.status(404).json({ error: 'Team member not found or access denied.' });
    }

    await Admin.findByIdAndDelete(memberId);
    res.json({ success: true, message: 'Team member successfully removed.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /admin/team/reset-password - Reset a sub-admin's password
router.post('/team/reset-password', async (req, res) => {
  if (req.admin.account_type !== 'PRIMARY_ORG_ADMIN') {
    return res.status(403).json({ error: 'Only Primary Organization Administrators can manage team members.' });
  }

  const { memberId, newPassword } = req.body;
  if (!memberId || !newPassword) {
    return res.status(400).json({ error: 'Member ID and new password are required.' });
  }

  try {
    const Admin = require('../models/Admin');
    const member = await Admin.findOne({ _id: memberId, organization_id: req.admin.organization_id });
    if (!member) {
      return res.status(404).json({ error: 'Team member not found or access denied.' });
    }

    const crypto = require('crypto');
    const passwordHash = crypto.createHash('sha256').update(newPassword).digest('hex');

    member.passwordHash = passwordHash;
    await member.save();

    res.json({ success: true, message: 'Team member password successfully updated.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
