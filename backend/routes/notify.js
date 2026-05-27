const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Violation = require('../models/Violation');

const rateLimit = require('express-rate-limit');

// MOCK Provider Logic
const sendWhatsAppMessage = (phone, text) => {
  console.log(`[Mock WhatsApp -> ${phone}]: ${text}`);
};
const sendSMS = (phone, text) => {
  console.log(`[Mock SMS -> ${phone}]: ${text}`);
};

const notifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 notification requests per window
  message: { error: 'You are sending notifications too fast. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public Notify API
router.post('/', notifyLimiter, async (req, res) => {
  const { vehicleId, messageType, message, imageUrl, location } = req.body;
  const senderIp = req.ip;

  try {
    let vehicle = await Vehicle.findOne({ vehicleId }).populate('ownerId');
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

    // Lazy evaluate trial
    vehicle = await vehicle.evaluateTrialStatus();
    
    if (vehicle.status === 'expired') {
      return res.status(403).json({ error: 'Sticker expired. Please renew to continue.' });
    }

    const owner = vehicle.ownerId; // The User object

    // Convert location object to string for DB storage
    let dbLocation = null;
    if (location && typeof location === 'object' && location.lat) {
      dbLocation = `${location.lat},${location.lng}`;
    } else if (location) {
      dbLocation = String(location);
    }

    // Save Notification log
    const notification = new Notification({
      vehicleId,
      messageType,
      message,
      imageUrl,
      location: dbLocation,
      senderIp
    });
    await notification.save();

    // Also Log as Violation if not a friendly headlights alert
    if (messageType !== 'headlights_on') {
      let detectedRegionId = null;
      if (location && typeof location === 'object' && location.lat && location.lng) {
        const lat = Number(location.lat);
        const lng = Number(location.lng);
        const Region = require('../models/Region');
        const region = await Region.findOne({
          'geo_boundary.minLat': { $lte: lat },
          'geo_boundary.maxLat': { $gte: lat },
          'geo_boundary.minLng': { $lte: lng },
          'geo_boundary.maxLng': { $gte: lng }
        });
        if (region) {
          detectedRegionId = region._id;
        }
      } else if (dbLocation) {
        const parts = dbLocation.split(',');
        if (parts.length === 2) {
          const lat = Number(parts[0]);
          const lng = Number(parts[1]);
          if (!isNaN(lat) && !isNaN(lng)) {
            const Region = require('../models/Region');
            const region = await Region.findOne({
              'geo_boundary.minLat': { $lte: lat },
              'geo_boundary.maxLat': { $gte: lat },
              'geo_boundary.minLng': { $lte: lng },
              'geo_boundary.maxLng': { $gte: lng }
            });
            if (region) {
              detectedRegionId = region._id;
            }
          }
        }
      }

      const violation = new Violation({
        vehicleId,
        notificationId: notification._id,
        severity: messageType === 'emergency' ? 3 : 1,
        region_id: detectedRegionId
      });
      await violation.save();
    }

    // Build Maps link if location exists
    let locationString = '';
    if (location) {
      // Expecting location to be an object from frontend { lat, lng } or a string.
      if (typeof location === 'object' && location.lat) {
        locationString = ` Location: https://maps.google.com/?q=${location.lat},${location.lng}`;
      } else {
        locationString = ` Location: ${location}`; // Fallback if string
      }
    }

    // Trigger Notifications
    const alertText = `Alert from VC System! Your vehicle (${vehicle.vehicleNumber}) received a "${messageType}" notification. ${message ? 'Message: '+message : ''}${locationString}`;
    
    sendWhatsAppMessage(owner.phone, alertText);
    // fallback or parallel SMS
    // sendSMS(owner.phone, alertText);

    res.json({ success: true, message: 'Owner notified successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Incoming IVR/Call endpoint (Webhook for Exotel/Twilio)
router.post('/ivr/input', async (req, res) => {
  const { dtmf_input, caller_id } = req.body;
  // dtmf_input could correspond to the numeric mapping of vehicleId if IVR asks for it.
  console.log(`[Mock IVR] Received input: ${dtmf_input} from ${caller_id}`);
  res.json({ success: true, message: 'IVR input processed' });
});

module.exports = router;
