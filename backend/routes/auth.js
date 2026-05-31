const express = require('express');
const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');
const User = require('../models/User');
const router = express.Router();

// Initialize Firebase Admin if not already initialized
let firebaseInitialized = false;
function initFirebase() {
  if (firebaseInitialized) return;
  
  if (!admin.apps.length) {
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    };

    if (serviceAccount.projectId && serviceAccount.privateKey && serviceAccount.clientEmail) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      firebaseInitialized = true;
    }
  }
}

// New route for Firebase Auth token verification (used by frontend Firebase SDK)
router.post('/verify-firebase-token', async (req, res) => {
  const { firebaseToken, phone, name } = req.body;

  if (!firebaseToken) {
    return res.status(400).json({ error: 'Firebase token is required' });
  }

  try {
    initFirebase();

    if (!firebaseInitialized) {
      return res.status(500).json({ error: 'Firebase is not configured. Please contact support.' });
    }

    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
    const firebasePhone = decodedToken.phone_number;

    // Check if phone matches (if provided)
    if (phone) {
      const normalizedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
      if (firebasePhone !== normalizedPhone) {
        return res.status(400).json({ error: 'Phone number mismatch' });
      }
    }

    // Find or create user
    const phoneNumber = phone || firebasePhone;
    let user = await User.findOne({ phone: phoneNumber });

    if (!user) {
      user = new User({
        phone: phoneNumber,
        name: name || 'User',
        role: 'user'
      });
    } else if (name && user.name !== 'User' && user.name.toLowerCase() !== name.trim().toLowerCase()) {
      return res.status(400).json({ error: 'Mobile number already exist' });
    } else if (name && user.name === 'User') {
      user.name = name;
    }

    await user.save();

    // Generate app JWT
    const token = jwt.sign(
      { id: user._id, phone: user.phone, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    res.json({ token, user });
  } catch (err) {
    console.error('Firebase Token Verify Error:', err);
    if (err.code === 'auth/id-token-expired' || err.code === 'auth/id-token-revoked') {
      return res.status(401).json({ error: 'Session expired. Please login again.' });
    }
    if (err.code === 'auth/argument-error') {
      return res.status(400).json({ error: 'Invalid token format.' });
    }
    res.status(500).json({ error: 'Internal server error during verification' });
  }
});

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
