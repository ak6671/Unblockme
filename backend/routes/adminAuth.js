const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const AdminSession = require('../models/AdminSession');
const ModeratorPermission = require('../models/ModeratorPermission');
const ApartmentOrganization = require('../models/ApartmentOrganization');
const FleetOrganization = require('../models/FleetOrganization');

// Helper to hash password using SHA-256
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// POST /admin-auth/signup/apartment
router.post('/signup/apartment', async (req, res) => {
  const { 
    name, email, password, confirmPassword, mobile,
    apartment_name, address, city, state, total_units, parking_slots, community_type,
    website, notes
  } = req.body;

  if (!name || !email || !password || !confirmPassword || !mobile || !apartment_name || !address || !city || !state || !total_units || !parking_slots || !community_type) {
    return res.status(400).json({ error: 'All required fields must be filled' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }

  try {
    const existing = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ error: 'This email is already registered as an administrator.' });
    }

    const passwordHash = hashPassword(password);
    const admin = await Admin.create({
      email: email.toLowerCase().trim(),
      passwordHash,
      role: 'APARTMENT_ADMIN',
      isActive: false,
      name,
      mobile,
      organization_type: 'apartment',
      approval_status: 'PENDING_APPROVAL'
    });

    const org = await ApartmentOrganization.create({
      apartment_name,
      address,
      city,
      state,
      total_units: Number(total_units),
      parking_slots: Number(parking_slots),
      community_type,
      website: website || '',
      notes: notes || '',
      organization_status: 'PENDING_APPROVAL',
      created_by_admin_id: admin._id
    });

    admin.organization_id = org._id;
    await admin.save();

    res.status(201).json({ success: true, message: 'Apartment signup request submitted successfully. It is pending approval by the Super Admin.' });
  } catch (err) {
    console.error('Apartment Signup Error:', err);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
});

// POST /admin-auth/signup/fleet
router.post('/signup/fleet', async (req, res) => {
  const { 
    name, email, password, confirmPassword, mobile,
    company_name, fleet_type, fleet_size, operating_city, address,
    gst_number, website, notes
  } = req.body;

  if (!name || !email || !password || !confirmPassword || !mobile || !company_name || !fleet_type || !fleet_size || !operating_city || !address) {
    return res.status(400).json({ error: 'All required fields must be filled' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }

  try {
    const existing = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ error: 'This email is already registered as an administrator.' });
    }

    const passwordHash = hashPassword(password);
    const admin = await Admin.create({
      email: email.toLowerCase().trim(),
      passwordHash,
      role: 'FLEET_MANAGER',
      isActive: false,
      name,
      mobile,
      organization_type: 'fleet',
      approval_status: 'PENDING_APPROVAL'
    });

    const org = await FleetOrganization.create({
      company_name,
      fleet_type,
      fleet_size: Number(fleet_size),
      operating_city,
      address,
      gst_number: gst_number || '',
      website: website || '',
      notes: notes || '',
      organization_status: 'PENDING_APPROVAL',
      created_by_admin_id: admin._id
    });

    admin.organization_id = org._id;
    await admin.save();

    res.status(201).json({ success: true, message: 'Fleet signup request submitted successfully. It is pending approval by the Super Admin.' });
  } catch (err) {
    console.error('Fleet Signup Error:', err);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
});

// POST /admin-auth/login - Email/Username + Password Admin Sign In
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Validation
  if (!email || !password) {
    return res.status(400).json({ error: 'Email/Username and password are required' });
  }

  try {
    const inputClean = email.toLowerCase().trim();
    let admin;
    if (inputClean.includes('@')) {
      admin = await Admin.findOne({ email: inputClean });
    } else {
      admin = await Admin.findOne({ username: inputClean });
    }

    if (!admin) {
      return res.status(401).json({ error: 'Invalid email/username or password' });
    }

    if (admin.approval_status === 'PENDING_APPROVAL') {
      return res.status(403).json({ error: 'Your account is pending review by a Super Admin. You will be notified via email once approved.' });
    }

    if (admin.approval_status === 'REJECTED') {
      return res.status(403).json({ error: 'Your registration request has been rejected.' });
    }

    if (admin.approval_status === 'SUSPENDED') {
      return res.status(403).json({ error: 'Your administrator account has been suspended.' });
    }

    if (!admin.isActive) {
      return res.status(403).json({ error: 'Secure access denied: Account deactivated' });
    }

    const hashedInput = hashPassword(password);
    if (admin.passwordHash !== hashedInput) {
      return res.status(401).json({ error: 'Invalid email/username or password' });
    }

    // Update last login
    admin.last_login = new Date();
    await admin.save();

    // Generate JWT
    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: admin.role, salt: crypto.randomBytes(16).toString('hex') },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );

    // Save Active Session in DB
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await AdminSession.create({
      token,
      adminId: admin._id,
      expiresAt
    });

    res.json({
      token,
      admin: {
        id: admin._id,
        email: admin.email,
        username: admin.username,
        role: admin.role,
        account_type: admin.account_type,
        name: admin.name,
        mobile: admin.mobile,
        organization_type: admin.organization_type,
        organization_id: admin.organization_id,
        two_factor_enabled: admin.two_factor_enabled,
        must_reset_password: admin.must_reset_password
      }
    });

  } catch (err) {
    console.error('Admin Login Error:', err);
    res.status(500).json({ error: 'Internal server error during authentication' });
  }
});

// POST /admin-auth/reset-temp-password - Reset temporary password on first login
router.post('/reset-temp-password', async (req, res) => {
  const { emailOrUsername, currentPassword, newPassword, confirmPassword } = req.body;

  if (!emailOrUsername || !currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match.' });
  }

  try {
    const inputClean = emailOrUsername.toLowerCase().trim();
    let admin;
    if (inputClean.includes('@')) {
      admin = await Admin.findOne({ email: inputClean });
    } else {
      admin = await Admin.findOne({ username: inputClean });
    }

    if (!admin) {
      return res.status(404).json({ error: 'Administrator account not found.' });
    }

    const hashedInput = hashPassword(currentPassword);
    if (admin.passwordHash !== hashedInput) {
      return res.status(401).json({ error: 'Invalid current password.' });
    }

    // Validate password strength if needed (e.g. min 6 chars)
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    admin.passwordHash = hashPassword(newPassword);
    admin.must_reset_password = false;
    await admin.save();

    res.json({ success: true, message: 'Password has been successfully updated. You can now log in.' });
  } catch (err) {
    console.error('Password Reset Error:', err);
    res.status(500).json({ error: 'Internal server error during password reset.' });
  }
});

// POST /admin-auth/logout - Revoke active DB session
router.post('/logout', async (req, res) => {
  const authHeader = req.header('Authorization');
  if (!authHeader) {
    return res.status(400).json({ error: 'No authorization header provided' });
  }

  try {
    const token = authHeader.split(' ')[1];
    if (token) {
      await AdminSession.deleteOne({ token });
    }
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error during logout' });
  }
});

module.exports = router;
