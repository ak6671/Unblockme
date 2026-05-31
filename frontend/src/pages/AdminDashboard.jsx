import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, AlertTriangle, TrendingUp, MapPin, User, Clock, X, 
  ChevronRight, Loader2, ShieldCheck, Car, FileText, CheckCircle2, Eye, Building, Check,
  Plus, Users
} from 'lucide-react';
import AdminAssignmentManagement from '../components/AdminAssignmentManagement';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  
  // Analytics State
  const [analytics, setAnalytics] = useState({
    totalViolations: 0,
    repeatedOffendersCount: 0,
    repeatedOffenders: [],
    commonTypes: [],
    hotspots: []
  });

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Timeline State
  const [violationsTimeline, setViolationsTimeline] = useState([]);
  const [timelineLoading, setTimelineLoading] = useState(false);

  // Detail Modal / Vehicle Drawer State
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [vehicleDetails, setVehicleDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Active Image Modal
  const [activeImage, setActiveImage] = useState(null);

  const [adminProfile, setAdminProfile] = useState(null);

  // New self-onboarding states
  const [pendingOrgs, setPendingOrgs] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [activeOrgs, setActiveOrgs] = useState({ apartments: [], fleets: [] });
  const [activeOrgsLoading, setActiveOrgsLoading] = useState(false);
  const [selectedOrgRequest, setSelectedOrgRequest] = useState(null);
  const [approvedCredentials, setApprovedCredentials] = useState(null);
  const [dashboardTab, setDashboardTab] = useState('vehicles');

  // Team Members State
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamError, setTeamError] = useState('');
  const [teamSuccess, setTeamSuccess] = useState('');
  
  // Add Member Form State
  const [teamName, setTeamName] = useState('');
  const [teamEmail, setTeamEmail] = useState('');
  const [teamUsername, setTeamUsername] = useState('');
  const [teamPassword, setTeamPassword] = useState('');
  const [teamAccountType, setTeamAccountType] = useState('ORG_SUB_ADMIN');

  // Password Reset state
  const [resettingMemberId, setResettingMemberId] = useState(null);
  const [newMemberPassword, setNewMemberPassword] = useState('');

  // Check admin role
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const userStr = localStorage.getItem('adminUser');
    if (!token || !userStr) {
      navigate('/admin/login');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      const validRoles = ['SUPER_ADMIN', 'APARTMENT_ADMIN', 'PARKING_AUTHORITY', 'FLEET_MANAGER', 'MODERATOR'];
      if (!validRoles.includes(user.role)) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        navigate('/admin/login');
        return;
      }
      
      // Redirect moderator to dedicated moderator page
      if (user.role === 'MODERATOR') {
        navigate('/moderator/dashboard');
        return;
      }

      setAdminProfile(user);
      setAuthorized(true);
      fetchAnalytics(token);
      fetchTimeline(token);
      fetchInitialVehicles(token);
      if (user.role === 'SUPER_ADMIN') {
        fetchPendingOrgs(token);
        fetchActiveOrgs(token);
      }
      if (user.account_type === 'PRIMARY_ORG_ADMIN') {
        fetchTeamMembers(token);
      }
    } catch (e) {
      navigate('/admin/login');
    }
  }, [navigate]);

  const fetchTeamMembers = async (token = localStorage.getItem('adminToken')) => {
    if (!token) return;
    setTeamLoading(true);
    setTeamError('');
    try {
      const res = await fetch(`${API_URL}/admin/team`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTeamMembers(data);
      } else {
        const data = await res.json();
        setTeamError(data.error || 'Failed to fetch team members.');
      }
    } catch (err) {
      setTeamError(err.message);
    } finally {
      setTeamLoading(false);
    }
  };

  const handleAddTeamMember = async (e) => {
    e.preventDefault();
    setTeamError('');
    setTeamSuccess('');
    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch(`${API_URL}/admin/team/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: teamName,
          email: teamEmail,
          username: teamUsername,
          password: teamPassword,
          account_type: teamAccountType
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add team member.');
      }
      setTeamSuccess('Team member added successfully.');
      setTeamName('');
      setTeamEmail('');
      setTeamUsername('');
      setTeamPassword('');
      fetchTeamMembers(token);
    } catch (err) {
      setTeamError(err.message);
    }
  };

  const handleRemoveTeamMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this team member?')) return;
    setTeamError('');
    setTeamSuccess('');
    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch(`${API_URL}/admin/team/remove`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ memberId })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to remove team member.');
      }
      setTeamSuccess('Team member removed successfully.');
      fetchTeamMembers(token);
    } catch (err) {
      setTeamError(err.message);
    }
  };

  const handleResetMemberPassword = async (e) => {
    e.preventDefault();
    setTeamError('');
    setTeamSuccess('');
    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch(`${API_URL}/admin/team/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ memberId: resettingMemberId, newPassword: newMemberPassword })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password.');
      }
      setTeamSuccess('Password updated successfully.');
      setResettingMemberId(null);
      setNewMemberPassword('');
      fetchTeamMembers(token);
    } catch (err) {
      setTeamError(err.message);
    }
  };

  const fetchPendingOrgs = async (token = localStorage.getItem('adminToken')) => {
    if (!token) return;
    setPendingLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/organizations/pending`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPendingOrgs(data);
      }
    } catch (err) {
      console.error('Failed to fetch pending organizations:', err);
    } finally {
      setPendingLoading(false);
    }
  };

  const fetchActiveOrgs = async (token = localStorage.getItem('adminToken')) => {
    if (!token) return;
    setActiveOrgsLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/organizations/active`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setActiveOrgs(data);
      }
    } catch (err) {
      console.error('Failed to fetch active organizations:', err);
    } finally {
      setActiveOrgsLoading(false);
    }
  };

  const handleResolveOrg = async (adminId, action) => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/admin/organizations/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ adminId, action })
      });

      if (res.ok) {
        const data = await res.json();
        if (action === 'approve' && data.credentials && data.credentials.username && data.credentials.tempPassword) {
          setApprovedCredentials({
            username: data.credentials.username,
            tempPassword: data.credentials.tempPassword,
            orgName: data.orgName || 'Organization'
          });
        }
        fetchPendingOrgs(token);
        fetchActiveOrgs(token);
        fetchAnalytics(token); // Refresh analytics count
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to update organization request.');
      }
    } catch (err) {
      console.error('Error resolving request:', err);
    }
  };

  const handleLogout = () => {
    fetch(`${API_URL}/admin-auth/logout`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
    }).catch(err => console.error('Logout error:', err));
    
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  const fetchAnalytics = async (token = localStorage.getItem('adminToken')) => {
    try {
      const res = await fetch(`${API_URL}/admin/analytics`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      } else if (res.status === 401 || res.status === 403) {
        // Session expired or unauthorized
        handleLogout();
      }
    } catch (err) {
      console.error('Failed to fetch admin analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeline = async (token = localStorage.getItem('adminToken')) => {
    setTimelineLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/violations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setViolationsTimeline(data);
      }
    } catch (err) {
      console.error('Failed to fetch violation timeline:', err);
    } finally {
      setTimelineLoading(false);
    }
  };

  const fetchInitialVehicles = async (token = localStorage.getItem('adminToken')) => {
    if (!token) return;
    setSearchLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/search`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch (err) {
      console.error('Failed to fetch initial vehicles:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) {
      fetchInitialVehicles();
      return;
    }

    setSearchLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  const viewVehicleDetails = async (vehicleId) => {
    setSelectedVehicle(vehicleId);
    setDetailsLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/vehicle/${vehicleId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setVehicleDetails(data);
      }
    } catch (err) {
      console.error('Failed to load vehicle details:', err);
    } finally {
      setDetailsLoading(false);
    }
  };

  if (loading && !authorized) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-indigo-600">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p className="font-semibold text-gray-600">Verifying Secure Admin Session...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.2);
          border-radius: 999px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.35);
          border-radius: 999px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.65);
        }
      `}</style>
      {/* Top Banner / Dashboard Title */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-[2rem] p-6 sm:p-10 shadow-[0_15px_30px_-10px_rgba(15,23,42,0.3)] relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-brand-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="bg-amber-400/20 text-amber-300 font-extrabold text-xs uppercase tracking-widest px-3 py-1 rounded-full border border-amber-400/30 inline-flex items-center gap-1.5 shadow-inner">
                <ShieldCheck className="w-3.5 h-3.5" /> SECURE PRIVATE CONSOLE
              </span>
              {adminProfile && (
                <span className="bg-indigo-500/20 text-indigo-300 font-extrabold text-xs uppercase tracking-widest px-3 py-1 rounded-full border border-indigo-500/30 inline-flex items-center shadow-inner">
                  🔑 {adminProfile.role.replace('_', ' ')}
                </span>
              )}
              {analytics?.inviteCode && (
                <span className="bg-emerald-500/20 text-emerald-300 font-extrabold text-xs uppercase tracking-widest px-3 py-1 rounded-full border border-emerald-500/30 inline-flex items-center shadow-inner">
                  🎟️ invite code: {analytics.inviteCode}
                </span>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
              {adminProfile?.role === 'SUPER_ADMIN' && 'Super-Admin Operations Cockpit'}
              {adminProfile?.role === 'APARTMENT_ADMIN' && 'Apartment Community Dashboard'}
              {adminProfile?.role === 'PARKING_AUTHORITY' && 'Parking Authority Operations Panel'}
              {adminProfile?.role === 'FLEET_MANAGER' && 'Fleet Hub Operations Console'}
              {!adminProfile && 'Admin Operations Panel'}
            </h1>
            <p className="text-slate-300 font-medium text-sm sm:text-base mt-2">
              {adminProfile?.role === 'SUPER_ADMIN' && 'Full administrative privileges: user control, stickers, global reports, and internal systems config.'}
              {adminProfile?.role === 'APARTMENT_ADMIN' && 'Apartment violation metrics: regional vehicle lists, community violations logs, and sticker deliveries.'}
              {adminProfile?.role === 'PARKING_AUTHORITY' && 'Operations dispatch: violations hotlist, real-time feed, search registries, and hotspot statistics.'}
              {adminProfile?.role === 'FLEET_MANAGER' && 'Fleet reports and vehicle timeline management, filtered by delivery profiles.'}
              {!adminProfile && 'Oversee violations, sticker orders, user histories, and aggregate analytical mapping.'}
            </p>
            {adminProfile && (
              <p className="text-xs text-slate-400 font-bold mt-2 uppercase tracking-wide">
                Signed in as: <span className="text-indigo-300">{adminProfile.email}</span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                fetchAnalytics();
                fetchTimeline();
                fetchInitialVehicles();
              }}
              className="bg-white/10 hover:bg-white/20 text-white font-bold px-6 h-12 rounded-2xl border border-white/15 transition-all text-sm shadow-lg hover:scale-[1.02] cursor-pointer whitespace-nowrap flex items-center justify-center min-w-[130px] flex-shrink-0"
            >
              Refresh Logs
            </button>
            <button 
              onClick={handleLogout}
              className="bg-rose-600/20 hover:bg-rose-600/35 text-rose-250 border border-rose-500/20 font-bold px-6 h-12 rounded-2xl transition-all text-sm shadow-lg hover:scale-[1.02] cursor-pointer whitespace-nowrap flex items-center justify-center min-w-[130px] flex-shrink-0"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Primary Org Admin Tab Switcher */}
      {adminProfile?.account_type === 'PRIMARY_ORG_ADMIN' && (
        <div className="flex bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800/80 max-w-md">
          <button
            onClick={() => setDashboardTab('vehicles')}
            className={`flex-1 py-3 rounded-xl text-sm font-black transition-all cursor-pointer ${
              dashboardTab === 'vehicles'
                ? 'bg-indigo-650 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Vehicles & Reports
          </button>
          <button
            onClick={() => setDashboardTab('team')}
            className={`flex-1 py-3 rounded-xl text-sm font-black transition-all cursor-pointer ${
              dashboardTab === 'team'
                ? 'bg-indigo-650 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Team Members
          </button>
        </div>
      )}

      {(adminProfile?.account_type !== 'PRIMARY_ORG_ADMIN' || dashboardTab === 'vehicles') && (
        <>
          {/* Super Admin - Organization Onboarding Requests Panel */}
          {adminProfile?.role === 'SUPER_ADMIN' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
          {/* Pending Organization Requests */}
          <div className="xl:col-span-2 bg-slate-900/60 backdrop-blur-md p-6 sm:p-8 rounded-[2rem] border border-slate-800 shadow-2xl">
            <h3 className="text-xl font-black text-white mb-6 flex items-center gap-2">
              <Building className="w-5 h-5 text-indigo-400" /> Pending Organization Requests
            </h3>

            {pendingLoading ? (
              <div className="py-8 text-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
                Loading pending organizations...
              </div>
            ) : pendingOrgs.length === 0 ? (
              <div className="py-8 text-center text-slate-500 font-bold border-2 border-dashed border-slate-800 rounded-2xl text-xs uppercase tracking-wider">
                🎉 No pending onboarding requests
              </div>
            ) : (
              <div className="space-y-4">
                {pendingOrgs.map(({ admin, orgDetails }) => (
                  <div key={admin._id} className="bg-slate-950/60 p-5 rounded-2xl border border-slate-850 hover:border-slate-700 transition flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-white text-base">
                          {admin.organization_type === 'apartment' ? orgDetails?.apartment_name : orgDetails?.company_name}
                        </span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${admin.organization_type === 'apartment' ? 'bg-indigo-950 text-indigo-400 border border-indigo-900/30' : 'bg-orange-950 text-orange-400 border border-orange-900/30'}`}>
                          {admin.organization_type}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 font-bold mt-1">
                        Admin: <span className="text-indigo-305">{admin.name || admin.email}</span> • Mobile: {admin.mobile || 'N/A'}
                      </div>
                      <div className="text-xs text-slate-505 font-semibold mt-0.5">
                        Location: {orgDetails?.city || 'N/A'}, {orgDetails?.state || 'N/A'} • Capacity: {admin.organization_type === 'apartment' ? `${orgDetails?.total_units || 0} units` : `${orgDetails?.fleet_size || 0} vehicles`}
                      </div>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto">
                      <button 
                        onClick={() => setSelectedOrgRequest({ admin, orgDetails })}
                        className="flex-1 sm:flex-none text-xs font-black bg-slate-850 hover:bg-slate-800 text-slate-300 px-3.5 py-2 rounded-xl transition border border-slate-750 cursor-pointer"
                      >
                        Inspect
                      </button>
                      <button 
                        onClick={() => handleResolveOrg(admin._id, 'approve')}
                        className="flex-1 sm:flex-none text-xs font-black bg-green-950/80 hover:bg-green-900 text-green-400 px-3.5 py-2 rounded-xl border border-green-900/30 transition cursor-pointer"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => handleResolveOrg(admin._id, 'reject')}
                        className="flex-1 sm:flex-none text-xs font-black bg-rose-950/80 hover:bg-rose-900 text-rose-450 px-3.5 py-2 rounded-xl border border-rose-900/30 transition cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Invite Codes Registry */}
          <div className="bg-slate-900/60 backdrop-blur-md p-6 sm:p-8 rounded-[2rem] border border-slate-800 shadow-2xl">
            <h3 className="text-xl font-black text-white mb-6 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" /> Active Invite Codes
            </h3>
            
            {activeOrgsLoading ? (
              <div className="py-8 text-center text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-400" />
                Loading active codes...
              </div>
            ) : (activeOrgs.apartments.length === 0 && activeOrgs.fleets.length === 0) ? (
              <div className="py-8 text-center text-slate-550 font-bold border-2 border-dashed border-slate-800 rounded-2xl text-xs uppercase tracking-wider">
                No active codes registered
              </div>
            ) : (
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {activeOrgs.apartments.map(org => (
                  <div key={org._id} className="bg-slate-950/40 p-3 rounded-xl border border-slate-850 flex justify-between items-center hover:border-indigo-500/20 transition">
                    <div className="overflow-hidden pr-2">
                      <div className="text-xs font-black text-white truncate">{org.apartment_name}</div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">🏢 Apartment</div>
                    </div>
                    <span className="bg-indigo-950 text-indigo-300 border border-indigo-900/40 font-black text-xs px-2.5 py-1 rounded-lg uppercase tracking-wider">
                      {org.invite_code || 'PENDING'}
                    </span>
                  </div>
                ))}

                {activeOrgs.fleets.map(org => (
                  <div key={org._id} className="bg-slate-950/40 p-3 rounded-xl border border-slate-850 flex justify-between items-center hover:border-orange-500/20 transition">
                    <div className="overflow-hidden pr-2">
                      <div className="text-xs font-black text-white truncate">{org.company_name}</div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">🚛 Fleet Hub</div>
                    </div>
                    <span className="bg-orange-950 text-orange-300 border border-orange-900/40 font-black text-xs px-2.5 py-1 rounded-lg uppercase tracking-wider">
                      {org.invite_code || 'PENDING'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Super Admin Scoping Assignment Panel */}
      {adminProfile?.role === 'SUPER_ADMIN' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full mb-8"
        >
          <AdminAssignmentManagement />
        </motion.div>
      )}

      {/* Analytics Counters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-3xl shadow-xl border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-all">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Active Violations</p>
            <p className="text-4xl font-black text-white">{analytics.totalViolations}</p>
          </div>
          <div className="bg-rose-500/10 text-rose-400 p-4 rounded-2xl border border-rose-500/20"><AlertTriangle className="w-8 h-8"/></div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-3xl shadow-xl border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-all">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Repeat Offenders</p>
            <p className="text-4xl font-black text-indigo-400">{analytics.repeatedOffendersCount}</p>
          </div>
          <div className="bg-indigo-500/10 text-indigo-400 p-4 rounded-2xl border border-indigo-500/20"><TrendingUp className="w-8 h-8"/></div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-3xl shadow-xl border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-all">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Primary Type</p>
            <p className="text-xl font-black text-slate-200 capitalize mt-1.5">
              {analytics.commonTypes[0] ? analytics.commonTypes[0].type.replace('_', ' ') : 'N/A'}
            </p>
          </div>
          <div className="bg-amber-500/10 text-amber-400 p-4 rounded-2xl border border-amber-500/20"><FileText className="w-8 h-8"/></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Search & Results Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/60 backdrop-blur-md p-6 sm:p-8 rounded-[2rem] shadow-2xl border border-slate-800">
            <h3 className="text-xl font-black text-white mb-2 flex items-center gap-2">
              <Search className="w-5 h-5 text-indigo-400" /> Vehicle Registry Search
            </h3>
            {searchResults.length > 0 && (
              <p className="text-xs text-slate-400 font-bold mb-4 uppercase tracking-wider">
                {searchQuery ? `🔍 Search results for: "${searchQuery}"` : '🏢 Showing all associated vehicles'}
              </p>
            )}
            <form onSubmit={handleSearch} className="flex gap-3">
              <input 
                type="text" 
                placeholder="Enter Vehicle Number, Sticker ID, Nickname..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-3 rounded-2xl border-2 border-slate-800 bg-slate-950/80 outline-none focus:border-indigo-500 font-semibold text-white placeholder-slate-500"
              />
              <button 
                type="submit" 
                className="bg-indigo-650 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-2xl shadow-md transition hover:-translate-y-0.5 cursor-pointer whitespace-nowrap flex items-center justify-center min-w-[100px]"
              >
                {searchLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search'}
              </button>
            </form>

            {/* Results Table */}
            {searchResults.length > 0 && (
              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-xs">
                      <th className="py-3 px-2">Vehicle Info</th>
                      <th className="py-3 px-2">Owner Details</th>
                      <th className="py-3 px-2 text-center">Violations</th>
                      <th className="py-3 px-2">Sticker Status</th>
                      <th className="py-3 px-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchResults.map((v) => (
                      <tr key={v.vehicleId} className="border-b border-slate-850 hover:bg-slate-950/40 transition">
                        <td className="py-4 px-2">
                          <div className="font-extrabold text-white text-base">{v.vehicleNumber}</div>
                          <div className="text-xs text-slate-500 font-semibold">ID: {v.vehicleId} {v.nickname && `• ${v.nickname}`}</div>
                        </td>
                        <td className="py-4 px-2">
                          <div className="font-bold text-slate-300">{v.ownerName}</div>
                          <div className="text-xs text-slate-500 font-semibold">{v.ownerPhone}</div>
                        </td>
                        <td className="py-4 px-2 text-center">
                          <span className={`px-2.5 py-1 rounded-full font-black text-xs ${v.violationCount > 0 ? 'bg-rose-950/40 text-rose-400 border border-rose-900/30' : 'bg-green-950/40 text-green-400 border border-green-900/30'}`}>
                            {v.violationCount}
                          </span>
                        </td>
                        <td className="py-4 px-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-black uppercase tracking-wider ${v.stickerStatus === 'delivered' ? 'bg-green-950/40 text-green-400 border border-green-900/30' : v.stickerStatus === 'not_ordered' ? 'bg-slate-800 text-slate-400 border border-slate-700' : 'bg-amber-950/40 text-amber-400 border border-amber-900/30'}`}>
                            {v.stickerStatus.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-4 px-2 text-right">
                          <button 
                            onClick={() => viewVehicleDetails(v.vehicleId)}
                            className="bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 font-bold px-3 py-1.5 rounded-xl transition text-xs flex items-center gap-1 ml-auto cursor-pointer border border-indigo-500/10"
                          >
                            <Eye className="w-3.5 h-3.5" /> Inspect
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {searchResults.length === 0 && searchQuery && !searchLoading && (
              <div className="mt-6 text-center py-6 text-slate-400 bg-slate-950/50 rounded-2xl border border-dashed border-slate-800 font-medium text-sm">
                No matching vehicles found. Try searching MH12 or TN07.
              </div>
            )}
          </div>

          {/* Violation Timeline list */}
          <div className="bg-slate-900/60 backdrop-blur-md p-6 sm:p-8 rounded-[2rem] shadow-2xl border border-slate-800">
            <h3 className="text-xl font-black text-white mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-rose-450" /> Real-time Violation Feed
            </h3>

            {timelineLoading ? (
              <div className="p-12 text-center text-slate-400 flex flex-col items-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mb-4" /> Loading feed logs...
              </div>
            ) : violationsTimeline.length === 0 ? (
              <div className="p-12 text-center text-slate-400 font-medium">
                No active violations recorded.
              </div>
            ) : (
              <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {violationsTimeline.map((item) => (
                  <div key={item._id} className="border-l-4 border-rose-500 pl-4 sm:pl-6 py-1 relative">
                    <div className="absolute -left-2.5 top-2 w-4 h-4 rounded-full bg-rose-500 ring-4 ring-rose-950"></div>
                    <div className="bg-slate-950/50 p-4 sm:p-5 rounded-2xl border border-slate-900 hover:border-slate-800 transition">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-white text-lg capitalize">{item.notification.messageType.replace('_', ' ')}</span>
                            <span className="text-xs font-black bg-rose-950 border border-rose-900/30 text-rose-400 px-2 py-0.5 rounded uppercase tracking-wider">
                              {item.vehicleDetails?.vehicleNumber || 'Deleted Vehicle'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 font-semibold mt-1">
                            Reported by IP: {item.notification.reportedByIp || 'anonymous'} • Owner: <span className="text-indigo-300">{item.vehicleDetails?.ownerName || 'N/A'}</span> ({item.vehicleDetails?.ownerPhone || 'N/A'})
                          </p>
                        </div>
                        <span className="text-xs font-bold text-slate-400 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">
                          {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>

                      {item.notification.message && (
                        <p className="text-slate-200 bg-slate-950 p-3 rounded-xl border border-slate-900 shadow-inner text-sm italic mb-4">
                          "{item.notification.message}"
                        </p>
                      )}

                      {/* Flex row for action items */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        {item.notification.imageUrl && (
                          <div className="flex flex-col items-start">
                            <img 
                              src={item.notification.imageUrl} 
                              alt="Evidence" 
                              onClick={() => setActiveImage(item.notification.imageUrl)}
                              className="w-20 h-20 object-cover rounded-xl border border-slate-800 shadow-sm cursor-zoom-in hover:scale-105 transition"
                            />
                            <span className="text-[9px] text-slate-500 font-bold mt-1">🔍 Click to zoom</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 mt-auto sm:ml-auto">
                          {item.notification.location && (
                            <a 
                              href={`https://maps.google.com/?q=${item.notification.location}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-bold bg-slate-800 hover:bg-slate-750 text-slate-350 px-3.5 py-2 rounded-xl inline-flex items-center gap-1.5 border border-slate-700 transition"
                            >
                              <MapPin className="w-3.5 h-3.5 text-indigo-400" /> Map Location
                            </a>
                          )}
                          {item.vehicleDetails && (
                            <button 
                              onClick={() => viewVehicleDetails(item.vehicleDetails.vehicleId)}
                              className="text-xs font-bold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 px-3.5 py-2 rounded-xl inline-flex items-center gap-1 border border-indigo-500/10 transition cursor-pointer"
                            >
                              Profile <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Aggregate statistics / hotspots */}
        <div className="space-y-6">
          {/* Top Categories */}
          <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-[2rem] shadow-2xl border border-slate-800">
            <h4 className="font-black text-white text-lg mb-4 flex items-center gap-1.5">
              📊 Top Categories
            </h4>
            <div className="space-y-3">
              {analytics.commonTypes.map((cat, i) => (
                <div key={cat.type} className="flex justify-between items-center bg-slate-950/50 p-3 rounded-xl border border-slate-900">
                  <span className="capitalize font-bold text-slate-200 text-sm">{cat.type.replace('_', ' ')}</span>
                  <span className="font-extrabold text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700">{cat.count} reports</span>
                </div>
              ))}
              {analytics.commonTypes.length === 0 && (
                <p className="text-slate-500 text-xs py-4 text-center">No categories recorded.</p>
              )}
            </div>
          </div>

          {/* Hotspots */}
          <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-[2rem] shadow-2xl border border-slate-800">
            <h4 className="font-black text-white text-lg mb-4 flex items-center gap-1.5">
              📍 Violation Hotspots
            </h4>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1.5 custom-scrollbar">
              {analytics.hotspots.map((h, i) => (
                <div key={i} className="flex justify-between items-center bg-slate-950/50 p-3 rounded-xl border border-slate-900">
                  <div className="flex items-center gap-1.5 overflow-hidden pr-2">
                    <MapPin className="w-4 h-4 text-rose-500 flex-shrink-0" />
                    <span className="font-bold text-slate-200 text-sm truncate">{h.location}</span>
                  </div>
                  <span className="font-extrabold text-xs bg-rose-950/40 text-rose-450 border border-rose-900/30 px-2 py-0.5 rounded-md flex-shrink-0">{h.count} counts</span>
                </div>
              ))}
              {analytics.hotspots.length === 0 && (
                <p className="text-slate-500 text-xs py-4 text-center">No hotspots identified.</p>
              )}
            </div>
          </div>

          {/* Repeat Offenders */}
          <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-[2rem] shadow-2xl border border-slate-800">
            <h4 className="font-black text-white text-lg mb-4 flex items-center gap-1.5">
              🚗 Top Repeat Offenders
            </h4>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1.5 custom-scrollbar">
              {analytics.repeatedOffenders.map((offender) => (
                <div key={offender.vehicleId} className="bg-rose-950/20 p-3 rounded-xl border border-rose-900/20 flex justify-between items-center">
                  <div>
                    <div className="font-black text-rose-350 text-sm">{offender.vehicleNumber}</div>
                    <div className="text-[10px] text-slate-400 font-bold">{offender.ownerName} • {offender.ownerPhone}</div>
                  </div>
                  <span className="bg-rose-600 text-white font-black text-xs px-2.5 py-1 rounded-lg">
                    {offender.violationsCount} Violations
                  </span>
                </div>
              ))}
              {analytics.repeatedOffenders.length === 0 && (
                <p className="text-slate-500 text-xs py-4 text-center">No repeat offenders identified.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle Profile Inspection Drawer / Modal */}
      <AnimatePresence>
        {selectedVehicle && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-6 sm:p-8 max-w-2xl w-full shadow-2xl relative max-h-[90vh] flex flex-col text-left text-slate-100"
            >
              <button 
                onClick={() => {
                  setSelectedVehicle(null);
                  setVehicleDetails(null);
                }} 
                className="absolute top-6 right-6 p-2.5 bg-slate-950/60 hover:bg-slate-800 rounded-full transition text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-2">
                <Car className="w-7 h-7 text-indigo-400" /> Vehicle Inspection Profile
              </h3>

              {detailsLoading ? (
                <div className="p-12 text-center text-slate-450 flex flex-col items-center justify-center flex-1">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mb-3" />
                  <span>Fetching historical association states...</span>
                </div>
              ) : vehicleDetails ? (
                <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                  
                  {/* General Vehicle Info */}
                  <div className="bg-slate-950/50 p-4 sm:p-5 rounded-2xl border border-slate-850 flex flex-col sm:flex-row justify-between gap-4">
                    <div>
                      <div className="text-xs font-extrabold text-indigo-400 uppercase tracking-wide">Vehicle Info</div>
                      <div className="text-2xl font-black text-white mt-1">{vehicleDetails.vehicle.vehicleNumber}</div>
                      <div className="text-xs text-slate-500 font-semibold mt-1">
                        Vehicle ID: {vehicleDetails.vehicle.vehicleId} {vehicleDetails.vehicle.nickname && `• ${vehicleDetails.vehicle.nickname}`}
                      </div>
                      {vehicleDetails.vehicle.isDeleted && (
                        <div className="text-xs font-black text-rose-450 bg-rose-950/40 border border-rose-900/30 rounded-md px-2.5 py-1 mt-2 inline-block">
                          ⚠️ SOFT DELETED (Owner removed association)
                        </div>
                      )}
                    </div>

                    <div className="text-left sm:text-right">
                      <div className="text-xs font-extrabold text-indigo-400 uppercase tracking-wide">Owner Registry</div>
                      <div className="font-bold text-slate-200 mt-1">{vehicleDetails.owner?.name || 'Deleted Account'}</div>
                      <div className="text-xs text-slate-400 font-semibold mt-1">{vehicleDetails.owner?.phone || 'N/A'}</div>
                      {vehicleDetails.owner?.drivingLicense && (
                        <div className="text-[11px] text-slate-500 font-semibold mt-0.5">DL: {vehicleDetails.owner.drivingLicense}</div>
                      )}
                    </div>
                  </div>

                  {/* Sticker Order Profile */}
                  <div className="bg-slate-950/30 p-5 rounded-2xl border border-slate-850">
                    <h5 className="font-black text-white text-base mb-3 flex items-center gap-1.5">
                      <FileText className="w-5 h-5 text-amber-500" /> Sticker Order History
                    </h5>
                    {vehicleDetails.vehicle.stickerOrder && vehicleDetails.vehicle.stickerOrder.isActive ? (
                      <div className="bg-amber-950/20 p-4 rounded-xl border border-amber-900/20 space-y-2 text-sm text-slate-200">
                        <div className="flex justify-between font-bold">
                          <span className="text-amber-400">Status: {vehicleDetails.vehicle.stickerOrder.status.toUpperCase()}</span>
                          <span className="text-slate-400">{new Date(vehicleDetails.vehicle.stickerOrder.orderedAt).toLocaleDateString()}</span>
                        </div>
                        <div className="text-xs text-slate-300 font-medium leading-relaxed">
                          <strong>Delivery Name:</strong> {vehicleDetails.vehicle.stickerOrder.name} <br/>
                          <strong>Phone:</strong> {vehicleDetails.vehicle.stickerOrder.mobile} <br/>
                          <strong>Address:</strong> {vehicleDetails.vehicle.stickerOrder.address}, {vehicleDetails.vehicle.stickerOrder.area}, {vehicleDetails.vehicle.stickerOrder.pincode}, {vehicleDetails.vehicle.stickerOrder.state}
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-500 text-sm italic">No stickers ordered for this vehicle.</p>
                    )}
                  </div>

                  {/* Non-cascaded Permanent Violations history */}
                  <div className="bg-slate-950/30 p-5 rounded-2xl border border-slate-850">
                    <h5 className="font-black text-white text-base mb-3 flex items-center gap-1.5">
                      <AlertTriangle className="w-5 h-5 text-rose-500" /> Immutable Violation Logs ({vehicleDetails.violations?.length || 0})
                    </h5>
                    <div className="space-y-4">
                      {vehicleDetails.violations?.map((v) => (
                        <div key={v._id} className="bg-rose-950/10 p-4 rounded-xl border border-rose-900/10 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-extrabold text-rose-350 text-sm capitalize">{v.notificationId?.messageType.replace('_', ' ')}</span>
                            <span className="text-xs font-semibold text-slate-500">
                              {new Date(v.createdAt).toLocaleDateString()} {new Date(v.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          </div>
                          
                          {v.notificationId?.message && (
                            <p className="text-slate-300 bg-slate-950/70 p-2.5 rounded-lg border border-slate-900 text-xs italic">
                              "{v.notificationId.message}"
                            </p>
                          )}

                          <div className="flex justify-between items-center gap-2 pt-1 text-xs">
                            <span className="text-slate-500 font-semibold">Reported from IP: {v.notificationId?.reportedByIp || 'anonymous'}</span>
                            {v.notificationId?.location && (
                              <a 
                                href={`https://maps.google.com/?q=${v.notificationId.location}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-rose-450 hover:underline font-bold"
                              >
                                View Location
                              </a>
                            )}
                          </div>
                        </div>
                      ))}

                      {(!vehicleDetails.violations || vehicleDetails.violations.length === 0) && (
                        <p className="text-slate-500 text-sm italic">Clean registry. No violations on record.</p>
                      )}
                    </div>
                  </div>

                </div>
              ) : (
                <div className="text-center py-6 text-slate-500">
                  Failed to load vehicle inspection profile.
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
        </>
      )}

      {/* Primary Org Admin Team Management Section */}
      {adminProfile?.account_type === 'PRIMARY_ORG_ADMIN' && dashboardTab === 'team' && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {teamError && (
            <div className="bg-rose-950/40 border border-rose-900/60 text-rose-350 p-4 rounded-2xl text-sm font-bold flex items-center gap-3">
              <div className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse"></div>
              {teamError}
            </div>
          )}

          {teamSuccess && (
            <div className="bg-emerald-950/40 border border-emerald-900/60 text-emerald-350 p-4 rounded-2xl text-sm font-bold flex items-center gap-3">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
              {teamSuccess}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Add Team Member Form */}
            <div className="lg:col-span-1 bg-slate-900/60 backdrop-blur-md p-6 sm:p-8 rounded-[2rem] border border-slate-800 shadow-2xl space-y-6">
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" /> Add Team Member
              </h3>
              <form onSubmit={handleAddTeamMember} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Name</label>
                  <input
                    type="text"
                    required
                    placeholder="John Doe"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none transition text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="john@organization.com"
                    value={teamEmail}
                    onChange={(e) => setTeamEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none transition text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Username</label>
                  <input
                    type="text"
                    required
                    placeholder="johndoe"
                    value={teamUsername}
                    onChange={(e) => setTeamUsername(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none transition text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={teamPassword}
                    onChange={(e) => setTeamPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none transition text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Role Type</label>
                  <select
                    value={teamAccountType}
                    onChange={(e) => setTeamAccountType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none transition text-sm font-medium"
                  >
                    <option value="ORG_SUB_ADMIN">Sub-Admin</option>
                    <option value="MODERATOR">Moderator</option>
                    <option value="OPERATIONS_STAFF">Operations Staff</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-650 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition cursor-pointer"
                >
                  Create Member Account
                </button>
              </form>
            </div>

            {/* Team Members List */}
            <div className="lg:col-span-2 bg-slate-900/60 backdrop-blur-md p-6 sm:p-8 rounded-[2rem] border border-slate-800 shadow-2xl space-y-6">
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" /> Team Roster ({teamMembers.length})
              </h3>

              {teamLoading ? (
                <div className="py-12 text-center text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-400" />
                  Loading team roster...
                </div>
              ) : teamMembers.length === 0 ? (
                <div className="py-12 text-center text-slate-500 border-2 border-dashed border-slate-800 rounded-2xl font-bold uppercase text-xs">
                  No sub-admins or staff registered.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                        <th className="py-3 px-2">Name</th>
                        <th className="py-3 px-2">Email</th>
                        <th className="py-3 px-2">Username</th>
                        <th className="py-3 px-2">Role</th>
                        <th className="py-3 px-2">Status</th>
                        <th className="py-3 px-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamMembers.map(member => (
                        <tr key={member._id} className="border-b border-slate-850 hover:bg-slate-950/20 text-slate-300 transition">
                          <td className="py-4 px-2 font-bold text-white">{member.name || 'N/A'}</td>
                          <td className="py-4 px-2">{member.email}</td>
                          <td className="py-4 px-2 font-mono text-indigo-300">{member.username || 'N/A'}</td>
                          <td className="py-4 px-2 font-bold text-[10px] uppercase tracking-wider text-indigo-400">{member.account_type}</td>
                          <td className="py-4 px-2">
                            <span className="flex items-center gap-1.5 text-emerald-450 font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-550 animate-pulse"></span>
                              ACTIVE
                            </span>
                          </td>
                          <td className="py-4 px-2 text-right space-x-2">
                            <button
                              onClick={() => setResettingMemberId(member._id)}
                              className="text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl border border-slate-750 transition cursor-pointer"
                            >
                              Reset Pass
                            </button>
                            <button
                              onClick={() => handleRemoveTeamMember(member._id)}
                              className="text-xs font-bold text-rose-450 hover:text-rose-350 bg-rose-950/20 hover:bg-rose-900/40 px-3 py-1.5 rounded-xl border border-rose-900/30 transition cursor-pointer"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Reset Password Modal */}
          {resettingMemberId && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 max-w-sm w-full shadow-2xl relative text-left text-slate-100"
              >
                <button
                  onClick={() => setResettingMemberId(null)}
                  className="absolute top-6 right-6 p-2 bg-slate-950/60 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
                <h3 className="text-lg font-black text-white mb-4">Reset Member Password</h3>
                <form onSubmit={handleResetMemberPassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">New Password</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={newMemberPassword}
                      onChange={(e) => setNewMemberPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none transition text-sm font-medium"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-indigo-650 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition cursor-pointer"
                  >
                    Update Password
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </motion.div>
      )}

      {/* Credentials Approval Modal */}
      <AnimatePresence>
        {approvedCredentials && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl relative text-left text-slate-100"
            >
              <button 
                onClick={() => setApprovedCredentials(null)} 
                className="absolute top-6 right-6 p-2.5 bg-slate-950/60 hover:bg-slate-800 rounded-full transition text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-2xl font-black text-white mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-7 h-7 text-emerald-450" /> Approved Credentials
              </h3>
              <p className="text-slate-300 text-sm mb-6">
                Organization approved! Copy and share the temporary administrative credentials. They must reset their password on first login.
              </p>

              <div className="space-y-4">
                <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-850">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Generated Username</div>
                  <div className="font-mono text-white text-base select-all">{approvedCredentials.username}</div>
                </div>

                <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-850">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Temporary Password</div>
                  <div className="font-mono text-emerald-400 text-base select-all">{approvedCredentials.tempPassword}</div>
                </div>
              </div>

              <button
                onClick={() => setApprovedCredentials(null)}
                className="w-full bg-indigo-650 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition mt-6 cursor-pointer"
              >
                Done
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Organization Onboarding Inspector Modal */}
      <AnimatePresence>
        {selectedOrgRequest && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-6 sm:p-8 max-w-xl w-full shadow-2xl relative max-h-[90vh] flex flex-col text-left text-slate-100"
            >
              <button 
                onClick={() => setSelectedOrgRequest(null)} 
                className="absolute top-6 right-6 p-2.5 bg-slate-950/60 hover:bg-slate-800 rounded-full transition text-slate-400 hover:text-white cursor-pointer hover:scale-105"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-2">
                <Building className="w-7 h-7 text-indigo-400" /> Onboarding Request Audit
              </h3>

              <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                {/* Admin Details */}
                <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-850">
                  <div className="text-xs font-extrabold text-indigo-400 uppercase tracking-wide mb-2">1. Administrator Details</div>
                  <div className="space-y-1.5 text-sm text-slate-200">
                    <div><strong>Name:</strong> {selectedOrgRequest.admin.name}</div>
                    <div><strong>Email:</strong> {selectedOrgRequest.admin.email}</div>
                    <div><strong>Mobile:</strong> {selectedOrgRequest.admin.mobile}</div>
                    <div><strong>Requested Role:</strong> {selectedOrgRequest.admin.role.replace('_', ' ')}</div>
                  </div>
                </div>

                {/* Organization Details */}
                <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-850">
                  <div className="text-xs font-extrabold text-indigo-400 uppercase tracking-wide mb-2">
                    2. {selectedOrgRequest.admin.organization_type === 'apartment' ? 'Apartment Community' : 'Fleet Company'} Details
                  </div>
                  <div className="space-y-1.5 text-sm text-slate-200">
                    {selectedOrgRequest.admin.organization_type === 'apartment' ? (
                      <>
                        <div><strong>Community Name:</strong> {selectedOrgRequest.orgDetails?.apartment_name}</div>
                        <div><strong>Type:</strong> {selectedOrgRequest.orgDetails?.community_type}</div>
                        <div><strong>Total Units:</strong> {selectedOrgRequest.orgDetails?.total_units}</div>
                        <div><strong>Parking Slots:</strong> {selectedOrgRequest.orgDetails?.parking_slots}</div>
                      </>
                    ) : (
                      <>
                        <div><strong>Company Name:</strong> {selectedOrgRequest.orgDetails?.company_name}</div>
                        <div><strong>Fleet Type:</strong> {selectedOrgRequest.orgDetails?.fleet_type}</div>
                        <div><strong>Fleet Size:</strong> {selectedOrgRequest.orgDetails?.fleet_size}</div>
                        <div><strong>GST Number:</strong> {selectedOrgRequest.orgDetails?.gst_number || 'N/A'}</div>
                      </>
                    )}
                    <div><strong>Address:</strong> {selectedOrgRequest.orgDetails?.address}</div>
                    <div><strong>City:</strong> {selectedOrgRequest.orgDetails?.city}</div>
                    <div><strong>State:</strong> {selectedOrgRequest.orgDetails?.state}</div>
                    {selectedOrgRequest.orgDetails?.website && (
                      <div><strong>Website:</strong> <a href={selectedOrgRequest.orgDetails.website} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">{selectedOrgRequest.orgDetails.website}</a></div>
                    )}
                  </div>
                </div>

                {/* Special Notes */}
                {selectedOrgRequest.orgDetails?.notes && (
                  <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-850">
                    <div className="text-xs font-extrabold text-indigo-400 uppercase tracking-wide mb-2">3. Operational Notes</div>
                    <p className="text-sm italic text-slate-350">"{selectedOrgRequest.orgDetails.notes}"</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-6 border-t border-slate-800 mt-6">
                <button 
                  onClick={() => {
                    handleResolveOrg(selectedOrgRequest.admin._id, 'approve');
                    setSelectedOrgRequest(null);
                  }}
                  className="flex-1 py-3.5 rounded-xl bg-green-650 hover:bg-green-700 text-white font-black text-xs uppercase tracking-wider transition cursor-pointer text-center hover:scale-[1.01]"
                >
                  Approve & Generate Code
                </button>
                <button 
                  onClick={() => {
                    handleResolveOrg(selectedOrgRequest.admin._id, 'reject');
                    setSelectedOrgRequest(null);
                  }}
                  className="flex-1 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-wider transition cursor-pointer text-center hover:scale-[1.01]"
                >
                  Reject Request
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Zoom Modal */}
      <AnimatePresence>
        {activeImage && (
          <div 
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] flex items-center justify-center p-4 cursor-zoom-out"
            onClick={() => setActiveImage(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
            >
              <button 
                onClick={() => setActiveImage(null)} 
                className="absolute -top-12 right-0 p-2 bg-white/10 hover:bg-white/20 rounded-full transition text-white border border-white/20 shadow-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <img src={activeImage} alt="Enlarged Evidence Log" className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-white/10" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
