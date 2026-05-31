require('dotenv').config();

if (!process.env.MONGO_URI) {
  process.env.MONGO_URI = "mongodb://aravindh694_db_user:Chennai%4098412@ac-fxknmap-shard-00-00.xkcuewo.mongodb.net:27017,ac-fxknmap-shard-00-01.xkcuewo.mongodb.net:27017,ac-fxknmap-shard-00-02.xkcuewo.mongodb.net:27017/vc_system?ssl=true&replicaSet=atlas-pwtm4p-shard-0&authSource=admin&retryWrites=true&w=majority&appName=UNBLOCKME";
}
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "your_super_secret_jwt_key";
}

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const vehicleRoutes = require('./routes/vehicle');
const notifyRoutes = require('./routes/notify');
const dashboardRoutes = require('./routes/dashboard');
const adminMiddleware = require('./middleware/admin');
const authMiddleware = require('./middleware/auth');
const adminRoutes = require('./routes/admin');
const adminAuthRoutes = require('./routes/adminAuth');
const moderatorRoutes = require('./routes/moderator');
const adminAuthMiddleware = require('./middleware/adminAuthMiddleware');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

let isConnected = false;
const connectDB = async () => {
  if (isConnected) return;
  try {
    if (!process.env.MONGO_URI) throw new Error("Missing URI");
    const db = await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    isConnected = db.connections[0].readyState === 1;
    console.log('MongoDB Hooked Up safely in Vercel Context');

    // Seed default admin accounts if they do not exist
    const Admin = require('./models/Admin');
    const crypto = require('crypto');
    const Organization = require('./models/Organization');

    let prestigeOrg = await Organization.findOne({ organization_name: 'Prestige Heights' });
    if (!prestigeOrg) {
      prestigeOrg = await Organization.create({
        organization_name: 'Prestige Heights',
        organization_type: 'apartment',
        invite_code: 'PRESTIGE-443',
        status: 'APPROVED',
        created_at: new Date()
      });
    }

    let quicktransOrg = await Organization.findOne({ organization_name: 'QuickTrans Logistics' });
    if (!quicktransOrg) {
      quicktransOrg = await Organization.create({
        organization_name: 'QuickTrans Logistics',
        organization_type: 'fleet',
        invite_code: 'QUICK-TRANS-88',
        status: 'APPROVED',
        created_at: new Date()
      });
    }

    const defaultAdmins = [
      { email: 'super@unblockme.com', password: 'SuperAdmin123!', role: 'SUPER_ADMIN', account_type: 'SUPER_ADMIN', username: 'super_admin' },
      { email: 'apartment@unblockme.com', password: 'ApartmentAdmin123!', role: 'APARTMENT_ADMIN', account_type: 'PRIMARY_ORG_ADMIN', username: 'apartment_admin', organization_type: 'apartment', organization_id: prestigeOrg._id },
      { email: 'parking@unblockme.com', password: 'ParkingAuth123!', role: 'PARKING_AUTHORITY', account_type: 'PARKING_AUTHORITY', username: 'parking_admin' },
      { email: 'fleet@unblockme.com', password: 'FleetManager123!', role: 'FLEET_MANAGER', account_type: 'PRIMARY_ORG_ADMIN', username: 'fleet_admin', organization_type: 'fleet', organization_id: quicktransOrg._id },
      { email: 'moderator@unblockme.com', password: 'Moderator123!', role: 'MODERATOR', account_type: 'MODERATOR', username: 'moderator_admin' }
    ];

    for (const item of defaultAdmins) {
      const exists = await Admin.findOne({ email: item.email });
      if (!exists) {
        const passwordHash = crypto.createHash('sha256').update(item.password).digest('hex');
        const newAdmin = await Admin.create({
          email: item.email,
          passwordHash,
          role: item.role,
          account_type: item.account_type,
          username: item.username,
          organization_type: item.organization_type || 'none',
          organization_id: item.organization_id || null,
          isActive: true,
          approval_status: 'APPROVED'
        });
        
        if (item.account_type === 'PRIMARY_ORG_ADMIN' && item.organization_id) {
          await Organization.findByIdAndUpdate(item.organization_id, { primary_admin_id: newAdmin._id });
        }
        console.log(`[Seed] Seeded admin account: ${item.email} with role ${item.role}`);
      } else {
        // Ensure updates to account_type/organization for legacy seed profiles
        let updated = false;
        if (!exists.account_type || exists.account_type === 'NONE') {
          exists.account_type = item.account_type;
          updated = true;
        }
        if (!exists.username) {
          exists.username = item.username;
          updated = true;
        }
        if (item.organization_id && !exists.organization_id) {
          exists.organization_id = item.organization_id;
          exists.organization_type = item.organization_type;
          updated = true;
        }
        if (updated) {
          await exists.save();
          if (exists.account_type === 'PRIMARY_ORG_ADMIN' && exists.organization_id) {
            await Organization.findByIdAndUpdate(exists.organization_id, { primary_admin_id: exists._id });
          }
        }
      }
    }

    // Seed default apartments, fleets, and regions
    const Apartment = require('./models/Apartment');
    const Fleet = require('./models/Fleet');
    const Region = require('./models/Region');

    const defaultApartments = [
      { apartment_name: 'Prestige Heights', location: 'T Nagar', city: 'Chennai', invite_code: 'PRESTIGE-443' },
      { apartment_name: 'DLF Gardencity', location: 'OMR Semmancheri', city: 'Chennai', invite_code: 'DLF-102' },
      { apartment_name: 'Sobha Elanza', location: 'Whitefield', city: 'Bangalore', invite_code: 'SOBHA-889' }
    ];
    for (const apt of defaultApartments) {
      const exists = await Apartment.findOne({ apartment_name: apt.apartment_name });
      if (!exists) {
        await Apartment.create(apt);
        console.log(`[Seed] Seeded apartment: ${apt.apartment_name}`);
      } else {
        await Apartment.updateOne({ apartment_name: apt.apartment_name }, { $set: { invite_code: apt.invite_code } });
      }
    }

    const defaultFleets = [
      { fleet_name: 'QuickTrans Logistics', company_name: 'QuickTrans Pvt Ltd', invite_code: 'QUICK-TRANS-88' },
      { fleet_name: 'ZoomCabs India', company_name: 'ZoomCabs Enterprises', invite_code: 'ZOOMCABS-10' },
      { fleet_name: 'CityExpress Cargo', company_name: 'CityExpress Services', invite_code: 'CITYEXP-99' }
    ];
    for (const flt of defaultFleets) {
      const exists = await Fleet.findOne({ fleet_name: flt.fleet_name });
      if (!exists) {
        await Fleet.create(flt);
        console.log(`[Seed] Seeded fleet: ${flt.fleet_name}`);
      } else {
        await Fleet.updateOne({ fleet_name: flt.fleet_name }, { $set: { invite_code: flt.invite_code } });
      }
    }

    const defaultRegions = [
      { region_name: 'T Nagar Municipal Region', geo_boundary: { minLat: 13.03, maxLat: 13.05, minLng: 80.22, maxLng: 80.25 }, city: 'Chennai' },
      { region_name: 'Adyar Traffic Ward', geo_boundary: { minLat: 12.99, maxLat: 13.02, minLng: 80.24, maxLng: 80.27 }, city: 'Chennai' },
      { region_name: 'Whitefield Zone B', geo_boundary: { minLat: 12.95, maxLat: 12.98, minLng: 77.72, maxLng: 77.76 }, city: 'Bangalore' }
    ];
    for (const reg of defaultRegions) {
      const exists = await Region.findOne({ region_name: reg.region_name });
      if (!exists) {
        await Region.create(reg);
        console.log(`[Seed] Seeded region: ${reg.region_name}`);
      }
    }
  } catch (err) {
    console.error('MongoDB Connection Error:', err);
  }
};

// Ensure database connects strictly before accepting queries in Vercel
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// Routes
app.use('/auth', authRoutes);
app.use('/vehicle', vehicleRoutes);
app.use('/notify', notifyRoutes);
app.use('/dashboard', dashboardRoutes);

// Decoupled admin authentication
app.use('/admin-auth', adminAuthRoutes);

// Isolated secure admin operational cockpit (protected by active session checks)
app.use('/admin', adminAuthMiddleware, adminRoutes);

// Decoupled moderator view panel
app.use('/moderator', adminAuthMiddleware, moderatorRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'full-app-ok', time: new Date() });
});

if (require.main === module) {
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
