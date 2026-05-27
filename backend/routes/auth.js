const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

const rateLimit = require('express-rate-limit');

// Mock OTP storage. In production use Redis.
const otpStore = {};

const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // Limit each IP to 5 OTP requests per windowMs
  message: { error: 'Too many OTP requests from this IP, please try again after 10 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/send-otp', otpLimiter, async (req, res) => {
  const { phone, mode, name } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone is required' });

  // Pre-validate for signup mode to prevent sending OTP if number exists
  let user = await User.findOne({ phone });
  if (mode === 'signup') {
    if (user && user.name !== 'User' && name && user.name.toLowerCase() !== name.trim().toLowerCase()) {
      return res.status(400).json({ error: 'Mobile number already exist' });
    }
  } else if (mode === 'login') {
    if (!user) {
      return res.status(404).json({ error: 'You’re new here! Taking you to sign up…', redirectToSignup: true });
    }
  }

  // Generate mock 4 digit OTP
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  otpStore[phone] = otp;
  
  // MOCK: Send OTP via SMS
  console.log(`[Mock SMS] Sending OTP ${otp} to ${phone}`);

  res.json({ message: 'OTP sent successfully', mock_otp: otp }); // returning OTP for easy testing
});

router.post('/verify-otp', async (req, res) => {
  const { phone, otp, name } = req.body;

  try {
    if (otpStore[phone] !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    delete otpStore[phone]; // Consume OTP

    let user = await User.findOne({ phone });
    if (!user) {
      user = new User({ 
        phone, 
        name: name || 'User',
        role: phone === '9999999999' ? 'admin' : 'user'
      });
    } else if (name && user.name !== 'User' && user.name.toLowerCase() !== name.trim().toLowerCase()) {
      return res.status(400).json({ error: 'Mobile number already exist' });
    } else if (name && user.name === 'User') {
      user.name = name; // Graceful overwrite for existing blanks
    }
    
    // Auto-escalate mock number to admin
    if (phone === '9999999999' && user.role !== 'admin') {
      user.role = 'admin';
    }
    
    await user.save();

    const token = jwt.sign({ id: user._id, phone: user.phone, role: user.role }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '7d' });
    res.json({ token, user });
  } catch (error) {
    console.error('Verify OTP Error:', error);
    res.status(500).json({ error: 'Internal server error during verification' });
  }
});

// Update Profile info
router.put('/profile', require('../middleware/auth'), async (req, res) => {
  try {
    const { name, profilePhoto, drivingLicense } = req.body;
    let user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    if (name) user.name = name;
    if (profilePhoto !== undefined) user.profilePhoto = profilePhoto;
    if (drivingLicense !== undefined) user.drivingLicense = drivingLicense;

    await user.save();
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;
