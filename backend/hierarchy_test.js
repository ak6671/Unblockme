const assert = require('assert');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const API_URL = 'http://localhost:5000';

// Import models to clean up / verify directly
const Admin = require('./models/Admin');
const Organization = require('./models/Organization');
const ApartmentOrganization = require('./models/ApartmentOrganization');

async function runTests() {
  console.log('🚀 Starting Programmatic Integration Tests for Hierarchy & Onboarding Flow...');

  // Connect to DB for verification & cleanup
  await mongoose.connect(process.env.MONGO_URI);
  console.log('📦 Connected to MongoDB');

  // Pre-test cleanup: delete previous test runs if any
  await Admin.deleteMany({ email: { $in: ['test_admin@test.com', 'sub_test@test.com'] } });
  await Admin.deleteMany({ username: { $in: ['test_admin_org', 'subtest'] } });
  await Organization.deleteMany({ name: 'Test Apartment Org' });
  await ApartmentOrganization.deleteMany({ apartment_name: 'Test Apartment Org' });
  console.log('🧹 Cleaned up old test records from Database');

  let superAdminToken = '';
  let generatedUsername = '';
  let generatedTempPassword = '';
  let testAdminId = '';
  let tempToken = '';
  let resetToken = '';

  try {
    // 1. Self-Onboarding Signup
    console.log('\n--- Step 1: Self-Onboarding Signup ---');
    const signupPayload = {
      name: 'Test Admin',
      email: 'test_admin@test.com',
      password: 'password123',
      confirmPassword: 'password123',
      mobile: '1234567890',
      apartment_name: 'Test Apartment Org',
      address: '123 Main St',
      city: 'Test City',
      state: 'Tamil Nadu',
      total_units: 100,
      parking_slots: 100,
      community_type: 'Apartment'
    };

    const signupRes = await fetch(`${API_URL}/admin-auth/signup/apartment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(signupPayload)
    });

    const signupData = await signupRes.json();
    if (signupRes.status !== 201) {
      console.error('DEBUG - Signup Failed with status:', signupRes.status, 'Response:', signupData);
    }
    assert.strictEqual(signupRes.status, 201, 'Signup should succeed');
    assert.ok(signupData.message.includes('successfully submitted') || signupData.message.includes('success') || signupData.message.includes('created'), 'Message should show submission');
    
    // Verify admin is created with inactive state
    const createdAdmin = await Admin.findOne({ email: 'test_admin@test.com' });
    assert.ok(createdAdmin, 'Admin should exist in DB');
    assert.strictEqual(createdAdmin.isActive, false, 'Self-onboarded admin must be inactive');
    testAdminId = createdAdmin._id.toString();
    console.log('✅ Signup request created successfully. Admin is inactive.');

    // 2. Super Admin Login & Resolve (Approve)
    console.log('\n--- Step 2: Super Admin Login & Resolution ---');
    const superAdminLoginRes = await fetch(`${API_URL}/admin-auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'super@unblockme.com', password: 'SuperAdmin123!' })
    });
    const superAdminLoginData = await superAdminLoginRes.json();
    assert.strictEqual(superAdminLoginRes.status, 200, 'Super admin login should succeed');
    superAdminToken = superAdminLoginData.token;
    assert.ok(superAdminToken, 'Super admin token must be present');

    // Approve organization request
    const approveRes = await fetch(`${API_URL}/admin/organizations/resolve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({ adminId: testAdminId, action: 'approve' })
    });
    const approveData = await approveRes.json();
    assert.strictEqual(approveRes.status, 200, 'Approval should succeed');
    assert.ok(approveData.credentials, 'Should return credentials object');
    assert.ok(approveData.credentials.username, 'Should return generated username');
    assert.ok(approveData.credentials.tempPassword, 'Should return temporary password');
    generatedUsername = approveData.credentials.username;
    generatedTempPassword = approveData.credentials.tempPassword;
    console.log(`✅ Organization approved. Generated credentials: Username: ${generatedUsername}, Temp Password: ${generatedTempPassword}`);

    // 3. Attempt login with old self-signup credentials (must fail/be blocked)
    console.log('\n--- Step 3: Login with old credentials block check ---');
    const oldLoginRes = await fetch(`${API_URL}/admin-auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test_admin@test.com', password: 'password123' })
    });
    assert.strictEqual(oldLoginRes.status, 401, 'Login with old signup credentials should fail');
    const oldLoginData = await oldLoginRes.json();
    assert.ok(oldLoginData.error.includes('credentials') || oldLoginData.error.includes('password'), 'Error must indicate invalid credentials');
    console.log('✅ Blocked login attempt with old credentials.');

    // 4. Login with generated credentials (username and tempPassword)
    console.log('\n--- Step 4: Login with generated credentials ---');
    const tempLoginRes = await fetch(`${API_URL}/admin-auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: generatedUsername, password: generatedTempPassword })
    });
    const tempLoginData = await tempLoginRes.json();
    if (tempLoginRes.status !== 200) {
      console.error('DEBUG - Login Failed with status:', tempLoginRes.status, 'Response:', tempLoginData);
    }
    assert.strictEqual(tempLoginRes.status, 200, 'Login with generated temp credentials should succeed');
    assert.strictEqual(tempLoginData.admin.must_reset_password, true, 'must_reset_password must be true');
    assert.ok(tempLoginData.token, 'Token must be returned');
    tempToken = tempLoginData.token;
    console.log('✅ Temporary credentials login successful. must_reset_password: true returned.');

    // 5. Attempt to access protected team list before resetting temporary password (must be blocked)
    console.log('\n--- Step 5: Access block check before password reset ---');
    const teamBlockRes = await fetch(`${API_URL}/admin/team`, {
      headers: { 'Authorization': `Bearer ${tempToken}` }
    });
    assert.strictEqual(teamBlockRes.status, 403, 'Access to protected endpoints must be blocked for accounts requiring reset');
    const teamBlockData = await teamBlockRes.json();
    assert.ok(teamBlockData.error.includes('must reset your password'), 'Error must specify password reset is required');
    console.log('✅ Access to protected API endpoints successfully blocked.');

    // 6. Reset password
    console.log('\n--- Step 6: Reset password ---');
    const resetRes = await fetch(`${API_URL}/admin-auth/reset-temp-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emailOrUsername: generatedUsername,
        currentPassword: generatedTempPassword,
        newPassword: 'new_password123',
        confirmPassword: 'new_password123'
      })
    });
    const resetData = await resetRes.json();
    assert.strictEqual(resetRes.status, 200, 'Password reset should succeed');
    assert.ok(resetData.message.includes('successfully'), 'Message should show success');
    console.log('✅ Password successfully reset.');

    // 7. Login with new password
    console.log('\n--- Step 7: Login with new password ---');
    const finalLoginRes = await fetch(`${API_URL}/admin-auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: generatedUsername, password: 'new_password123' })
    });
    const finalLoginData = await finalLoginRes.json();
    assert.strictEqual(finalLoginRes.status, 200, 'Final login should succeed');
    assert.strictEqual(finalLoginData.admin.must_reset_password, false, 'must_reset_password must now be false');
    assert.ok(finalLoginData.token, 'Should return active token');
    resetToken = finalLoginData.token;
    console.log('✅ Login with new password successful.');

    // 8. Sub-admin invitation & organization scoping inheritance
    console.log('\n--- Step 8: Sub-admin invitation ---');
    const addTeamRes = await fetch(`${API_URL}/admin/team/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resetToken}`
      },
      body: JSON.stringify({
        name: 'Sub Admin Test',
        email: 'sub_test@test.com',
        username: 'subtest',
        password: 'subpassword123',
        account_type: 'ORG_SUB_ADMIN'
      })
    });
    const addTeamData = await addTeamRes.json();
    assert.strictEqual(addTeamRes.status, 201, 'Team member addition should succeed');
    assert.ok(addTeamData.message.includes('added successfully'), 'Should return success message');

    // Retrieve team list
    const teamRes = await fetch(`${API_URL}/admin/team`, {
      headers: { 'Authorization': `Bearer ${resetToken}` }
    });
    const teamData = await teamRes.json();
    assert.strictEqual(teamRes.status, 200, 'Get team should succeed');
    const subAdmin = teamData.find(t => t.username === 'subtest');
    assert.ok(subAdmin, 'Sub-admin should be listed in team');
    assert.strictEqual(subAdmin.account_type, 'ORG_SUB_ADMIN', 'Role type should be correct');

    // Verify inheritance of organization_id in Database
    const dbSubAdmin = await Admin.findOne({ username: 'subtest' });
    const dbPrimaryAdmin = await Admin.findOne({ username: generatedUsername });
    assert.ok(dbSubAdmin.organization_id, 'Sub-admin must have organization_id');
    assert.strictEqual(
      dbSubAdmin.organization_id.toString(),
      dbPrimaryAdmin.organization_id.toString(),
      'Sub-admin must inherit organization_id from primary administrator'
    );
    console.log('✅ Team member added successfully. Sub-admin correctly inherited organization scoping from primary admin.');

    console.log('\n🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉');

  } catch (err) {
    console.error('\n❌ Test Failure:', err);
    process.exitCode = 1;
  } finally {
    // Direct Database Cleanup
    await Admin.deleteMany({ email: { $in: ['test_admin@test.com', 'sub_test@test.com'] } });
    await Admin.deleteMany({ username: { $in: ['test_admin_org', 'subtest'] } });
    await Organization.deleteMany({ name: 'Test Apartment Org' });
    await ApartmentOrganization.deleteMany({ apartment_name: 'Test Apartment Org' });
    console.log('\n🧹 Cleaned up test records from Database');
    
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit();
  }
}

runTests();
