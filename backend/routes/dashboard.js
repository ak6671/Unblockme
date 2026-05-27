const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Vehicle = require('../models/Vehicle');
const Notification = require('../models/Notification');
const Violation = require('../models/Violation');

// Get owner dashboard stats & vehicles
router.get('/stats', auth, async (req, res) => {
  try {
    let allVehicles = await Vehicle.find({ ownerId: req.user.id }).populate('apartment_id').populate('fleet_id');
    
    // Lazy evaluate trial expiry & temporary status expiry for dashboard load
    for (let i = 0; i < allVehicles.length; i++) {
        let v = allVehicles[i];
        if (v.temporaryStatus && v.temporaryStatus.status === 'will_return_5' && v.temporaryStatus.updatedAt) {
          const elapsed = new Date() - new Date(v.temporaryStatus.updatedAt);
          if (elapsed > 5 * 60 * 1000) {
            v.temporaryStatus = { status: 'none', customValue: '', updatedAt: new Date() };
            await v.save();
          }
        }
        allVehicles[i] = await v.evaluateTrialStatus();
    }
    
    // Convert to plain objects and filter active ones
    let activeVehicles = allVehicles.filter(v => !v.isDeleted).map(v => v.toObject());
    
    // We use all vehicle IDs for stats to retain history of deleted vehicles
    const allVehicleIds = allVehicles.map(v => v.vehicleId);

    // Get UNREAD notifications count per active vehicle
    for (let v of activeVehicles) {
      const query = { vehicleId: v.vehicleId };
      if (v.lastViewedAt) {
        query.createdAt = { $gt: v.lastViewedAt };
      }
      v.notificationCount = await Notification.countDocuments(query);
    }

    const totalNotifications = await Notification.countDocuments({ vehicleId: { $in: allVehicleIds } });
    const violationsList = await Violation.find({ vehicleId: { $in: allVehicleIds } }).populate('notificationId');
    const totalViolations = violationsList.filter(v => v.notificationId && v.notificationId.messageType !== 'headlights_on').length;

    res.json({
      vehicles: activeVehicles,
      selectedVehicleIds: activeVehicles.map(v => v.vehicleId),
      totalNotifications,
      totalViolations
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get specific vehicle violations history
router.get('/violations/:vehicleId', auth, async (req, res) => {
  try {
    const { vehicleId } = req.params;
    
    // Auth check to ensure this user owns the vehicle
    const vehicle = await Vehicle.findOne({ vehicleId, ownerId: req.user.id });
    if (!vehicle) return res.status(403).json({ error: 'Unauthorized to view this vehicle' });

    // Update lastViewedAt so notification badges clear
    await Vehicle.updateOne({ _id: vehicle._id }, { lastViewedAt: new Date() });

    const violations = await Notification.find({ vehicleId }).sort({ createdAt: -1 }).limit(50);
    // Note: We're returning Notifications as the history feed. 
    // The "Violation" model acts as the counter/threshold logic.

    const vehicleViolations = await Violation.find({ vehicleId }).populate('notificationId');
    const counts = vehicleViolations.filter(v => v.notificationId && v.notificationId.messageType !== 'headlights_on').length;

    let status = 'Good Standing';
    if (counts >= 3) status = 'Warning';
    if (counts >= 10) status = 'Frequent Offender';

    res.json({ status, count: counts, history: violations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get global notifications history (All vehicles)
router.get('/all-history', auth, async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ ownerId: req.user.id });
    const vehicleIds = vehicles.map(v => v.vehicleId);

    const history = await Notification.find({ vehicleId: { $in: vehicleIds } })
      .sort({ createdAt: -1 })
      .limit(100);

    const enrichedHistory = history.map(notif => {
      const vehicle = vehicles.find(v => v.vehicleId === notif.vehicleId);
      return {
        ...notif.toObject(),
        vehicleNumber: vehicle ? vehicle.vehicleNumber : 'Unknown',
        nickname: vehicle ? vehicle.nickname : ''
      };
    });

    res.json({ history: enrichedHistory });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
