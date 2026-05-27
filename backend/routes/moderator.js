const express = require('express');
const router = express.Router();
const Violation = require('../models/Violation');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');

function maskName(name) {
  if (!name) return '***';
  const parts = name.split(' ');
  return parts.map(part => {
    if (part.length <= 3) return part[0] + '*'.repeat(part.length - 1);
    return part.substring(0, 3) + '*'.repeat(part.length - 3);
  }).join(' ');
}

function maskPhone(phone) {
  if (!phone) return '**********';
  const phoneStr = String(phone);
  if (phoneStr.length <= 4) return '*'.repeat(phoneStr.length);
  return '*'.repeat(phoneStr.length - 4) + phoneStr.substring(phoneStr.length - 4);
}

// GET /moderator/dashboard - View-only moderation timeline logs
router.get('/dashboard', async (req, res) => {
  const { role } = req.admin;

  if (role !== 'MODERATOR' && role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Access denied: Moderator level permissions required.' });
  }

  try {
    // Return last 30 violations with masked sensitive owner information
    const violations = await Violation.find()
      .sort({ createdAt: -1 })
      .limit(30)
      .populate('notificationId');

    const results = await Promise.all(violations.map(async v => {
      if (!v.notificationId) return null;

      const vehicle = await Vehicle.findOne({ vehicleId: v.vehicleId });
      const owner = vehicle ? await User.findById(vehicle.ownerId) : null;
      
      return {
        _id: v._id,
        createdAt: v.createdAt,
        severity: v.severity,
        messageType: v.notificationId.messageType,
        message: v.notificationId.message,
        imageUrl: v.notificationId.imageUrl,
        location: v.notificationId.location,
        vehicleDetails: vehicle ? {
          vehicleId: vehicle.vehicleId,
          vehicleNumber: vehicle.vehicleNumber,
          nickname: vehicle.nickname || '',
          ownerName: owner ? maskName(owner.name) : 'Unknown Owner',
          ownerPhone: owner ? maskPhone(owner.phone) : 'N/A'
        } : null
      };
    }));

    res.json({
      role,
      violations: results.filter(r => r !== null && r.messageType !== 'headlights_on'),
      moderationRegion: 'All Regions (India)',
      totalPendingReviews: results.length
    });

  } catch (err) {
    console.error('Moderator Dashboard Error:', err);
    res.status(500).json({ error: 'Internal server error fetching moderation feed' });
  }
});

module.exports = router;
