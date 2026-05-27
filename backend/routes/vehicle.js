const express = require('express');
const crypto = require('crypto');
const auth = require('../middleware/auth');
const Vehicle = require('../models/Vehicle');
const Notification = require('../models/Notification');
const Violation = require('../models/Violation');
const User = require('../models/User');
const router = express.Router();

// Register a new vehicle (Auth required)
router.post('/register', auth, async (req, res) => {
  try {
    const { vehicleNumber, nickname, apartmentId, fleetId } = req.body;

    // Check for active duplicates
    const vehicleNumberClean = vehicleNumber.trim();
    const activeVehicle = await Vehicle.findOne({ 
      vehicleNumber: { $regex: new RegExp(`^${vehicleNumberClean}$`, 'i') },
      isDeleted: { $ne: true }
    });
    if (activeVehicle) {
      const owner = await User.findById(activeVehicle.ownerId);
      const phoneStr = owner?.phone || 'unknown';
      const maskedPhone = phoneStr.length >= 4 ? phoneStr.substring(0, 2) + '******' + phoneStr.substring(phoneStr.length - 2) : '****';
      return res.status(400).json({ error: `This vehicle number is already registered with ${maskedPhone} mobile or user account` });
    }

    // Reactivate deleted vehicle to inherit tracking and history
    const existingDeletedVehicle = await Vehicle.findOne({ 
      vehicleNumber: { $regex: new RegExp(`^${vehicleNumberClean}$`, 'i') },
      isDeleted: true
    });

    if (existingDeletedVehicle) {
      existingDeletedVehicle.isDeleted = false;
      existingDeletedVehicle.ownerId = req.user.id;
      if (nickname) existingDeletedVehicle.nickname = nickname;
      existingDeletedVehicle.apartment_id = apartmentId || null;
      existingDeletedVehicle.fleet_id = fleetId || null;
      
      await existingDeletedVehicle.save();
      const reactivatedVehicle = await existingDeletedVehicle.evaluateTrialStatus();
      return res.status(200).json(reactivatedVehicle);
    }

    // Generate unique ID
    const vehicleId = 'UB' + crypto.randomUUID().split('-')[0].toUpperCase().substring(0, 4);

    let vehicle = new Vehicle({
      vehicleId,
      vehicleNumber: vehicleNumberClean,
      ownerId: req.user.id,
      nickname,
      apartment_id: apartmentId || null,
      fleet_id: fleetId || null
    });

    vehicle = await vehicle.evaluateTrialStatus(); // Sets the dates and saves
    res.status(201).json(vehicle);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin / Dashboard get vehicles list
router.get('/', auth, async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ ownerId: req.user.id, isDeleted: { $ne: true } });
    
    // Lazy evaluate trial expiry for dashboard load
    for (let v of vehicles) {
      await v.evaluateTrialStatus();
    }
    
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /vehicle/apartments - List all apartments for dropdown selects
router.get('/apartments', async (req, res) => {
  try {
    const Apartment = require('../models/Apartment');
    const list = await Apartment.find().sort({ apartment_name: 1 });
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /vehicle/fleets - List all fleets for dropdown selects
router.get('/fleets', async (req, res) => {
  try {
    const Fleet = require('../models/Fleet');
    const list = await Fleet.find().sort({ fleet_name: 1 });
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Public GET vehicle info (Masked)
router.get('/:id', async (req, res) => {
  try {
    let vehicle = await Vehicle.findOne({ vehicleId: req.params.id });
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

    // Evaluate trial limits and auto-expire if needed
    vehicle = await vehicle.evaluateTrialStatus();

    // Auto-expire and clear temporary status if it is "will_return_5" and has expired (5 minutes)
    if (vehicle.temporaryStatus && vehicle.temporaryStatus.status === 'will_return_5' && vehicle.temporaryStatus.updatedAt) {
      const elapsed = new Date() - new Date(vehicle.temporaryStatus.updatedAt);
      if (elapsed > 5 * 60 * 1000) {
        vehicle.temporaryStatus = { status: 'none', customValue: '', updatedAt: new Date() };
        await vehicle.save();
      }
    }

    // Mask the number (e.g., MH 12 AB 1234 -> MH 12 AB **34)
    const vNum = vehicle.vehicleNumber;
    const maskedNumber = vNum.length > 4 ? vNum.substring(0, vNum.length - 4) + '****' : '****';

    res.json({
      vehicleId: vehicle.vehicleId,
      vehicleNumber: maskedNumber,
      status: vehicle.status,
      temporaryStatus: vehicle.temporaryStatus || { status: 'none', customValue: '', updatedAt: null }
      // Intentionally omitting ownerId and other PII
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a vehicle (Auth required, performs Cascade delete)
router.delete('/:id', auth, async (req, res) => {
  try {
    const vehicleId = req.params.id;
    
    // Find and verify ownership
    const vehicle = await Vehicle.findOne({ vehicleId, ownerId: req.user.id });
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found or unauthorized' });
    }

    // Soft delete logic to retain history
    await Vehicle.updateOne({ _id: vehicle._id }, { isDeleted: true });

    res.json({ success: true, message: 'Vehicle deleted successfully. History retained.' });
  } catch (error) {
    console.error('[Delete Error]', error);
    res.status(500).json({ error: error.message });
  }
});

// Create sticker order
router.post('/:id/order', auth, async (req, res) => {
  try {
    const vehicleId = req.params.id;
    const { name, mobile, address, area, pincode, state } = req.body;
    
    const vehicle = await Vehicle.findOne({ vehicleId, ownerId: req.user.id });
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

    vehicle.stickerOrder = {
      isActive: true,
      name,
      mobile,
      address,
      area,
      pincode,
      state,
      status: 'processing',
      orderedAt: new Date()
    };
    
    await vehicle.save();
    res.json({ success: true, vehicle });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update sticker order mock tracking status
router.put('/:id/order/status', auth, async (req, res) => {
  try {
    const vehicleId = req.params.id;
    const { status } = req.body;
    
    const vehicle = await Vehicle.findOne({ vehicleId, ownerId: req.user.id });
    if (!vehicle || !vehicle.stickerOrder || !vehicle.stickerOrder.isActive) {
      return res.status(404).json({ error: 'Vehicle or active order not found' });
    }

    vehicle.stickerOrder.status = status;

    if (status === 'delivered') {
      vehicle.is_trial = false;
      vehicle.subscription_plan = 'paid';
      vehicle.status = 'active';
    }

    await vehicle.save();
    res.json({ success: true, vehicle });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update temporary parking status (Auth required)
router.put('/:id/temporary-status', auth, async (req, res) => {
  try {
    const vehicleId = req.params.id;
    const { status, customValue, updatedAtLocal } = req.body;

    const vehicle = await Vehicle.findOne({ vehicleId, ownerId: req.user.id });
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

    vehicle.temporaryStatus = {
      status: status || 'none',
      customValue: customValue || '',
      updatedAt: new Date(),
      updatedAtLocal: updatedAtLocal || ''
    };

    await vehicle.save();
    res.json({ success: true, vehicle });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



// POST /vehicle/:vehicleId/associate - Connect a vehicle to an apartment or fleet
router.post('/:vehicleId/associate', auth, async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { type, inviteCode, apartmentId } = req.body;

    const vehicle = await Vehicle.findOne({ vehicleId, ownerId: req.user.id });
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

    if (type === 'apartment') {
      let apartment = null;
      if (apartmentId) {
        const Apartment = require('../models/Apartment');
        apartment = await Apartment.findById(apartmentId);
      } else if (inviteCode) {
        const Apartment = require('../models/Apartment');
        apartment = await Apartment.findOne({ invite_code: inviteCode.trim().toUpperCase() });
      }

      if (!apartment) {
        return res.status(400).json({ error: 'Apartment not found or invalid invite code.' });
      }

      vehicle.apartment_id = apartment._id;
      vehicle.fleet_id = null; // Clear fleet mapping
      await vehicle.save();

      return res.json({ success: true, vehicle });
    }

    if (type === 'fleet') {
      if (!inviteCode) {
        return res.status(400).json({ error: 'Fleet invite code is required.' });
      }

      const Fleet = require('../models/Fleet');
      const fleet = await Fleet.findOne({ invite_code: inviteCode.trim().toUpperCase() });
      if (!fleet) {
        return res.status(400).json({ error: 'Invalid fleet invite code.' });
      }

      vehicle.fleet_id = fleet._id;
      vehicle.apartment_id = null; // Clear community mapping
      await vehicle.save();

      return res.json({ success: true, vehicle });
    }

    return res.status(400).json({ error: 'Invalid association type.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
