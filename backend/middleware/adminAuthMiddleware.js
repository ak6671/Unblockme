const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const AdminSession = require('../models/AdminSession');

module.exports = async (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader) {
    return res.status(401).json({ error: 'Access denied: No token provided.' });
  }

  try {
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Access denied: Invalid token format.' });
    }

    // 1. Verify standard JWT signature
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    } catch (jwtErr) {
      return res.status(401).json({ error: 'Unauthorized: Session signature expired or corrupt.' });
    }

    // 2. Query database for active session
    const session = await AdminSession.findOne({ token });
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized: Session revoked or logged out.' });
    }

    if (session.expiresAt < new Date()) {
      await AdminSession.deleteOne({ token });
      return res.status(401).json({ error: 'Unauthorized: Session expired.' });
    }

    // 3. Fetch administrator account status
    const admin = await Admin.findById(session.adminId);
    if (!admin) {
      return res.status(401).json({ error: 'Unauthorized: Administrator account not found.' });
    }

    if (!admin.isActive) {
      return res.status(403).json({ error: 'Access denied: Account deactivated.' });
    }

    if (admin.must_reset_password) {
      return res.status(403).json({ error: 'Access denied: You must reset your password before accessing dashboard operations.' });
    }

    // Populate details in request object
    req.admin = admin;
    req.adminSession = session;
    next();

  } catch (err) {
    console.error('Admin Auth Middleware Error:', err);
    res.status(500).json({ error: 'Internal server security validation error.' });
  }
};
