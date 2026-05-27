import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';
import { Shield, Plus, Trash2, Users, Layers, MapPin, Building, Truck, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminAssignmentManagement() {
  const [admins, setAdmins] = useState([]);
  const [targets, setTargets] = useState({ apartments: [], fleets: [], regions: [] });
  const [assignments, setAssignments] = useState({ apts: [], fleets: [], regions: [] });
  const [directoryData, setDirectoryData] = useState({ apartments: [], fleets: [], parking: [] });
  const [expandedOrgs, setExpandedOrgs] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form states
  const [selectedAdminId, setSelectedAdminId] = useState('');
  const [assignmentType, setAssignmentType] = useState('apartment');
  const [selectedTargetId, setSelectedTargetId] = useState('');

  const token = localStorage.getItem('adminToken');

  const toggleOrgExpand = (orgId) => {
    setExpandedOrgs(prev => ({
      ...prev,
      [orgId]: !prev[orgId]
    }));
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch Admins
      const adminsRes = await fetch(`${API_URL}/admin/list-admins`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const adminsData = await adminsRes.json();
      if (adminsRes.ok) setAdmins(adminsData);

      // Fetch Targets
      const targetsRes = await fetch(`${API_URL}/admin/targets`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const targetsData = await targetsRes.json();
      if (targetsRes.ok) setTargets(targetsData);

      // Fetch Active Assignments
      const assignmentsRes = await fetch(`${API_URL}/admin/assignments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const assignmentsData = await assignmentsRes.json();
      if (assignmentsRes.ok) setAssignments(assignmentsData);

      // Fetch Grouped Directory Data
      const dirRes = await fetch(`${API_URL}/admin/organizations/directory`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (dirRes.ok) {
        const dirData = await dirRes.json();
        setDirectoryData(dirData);
      }

    } catch (err) {
      console.error(err);
      setError('Failed to fetch system assignments datasets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!selectedAdminId || !selectedTargetId) {
      setError('Please select both an administrator and a target scope.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccessMsg('');

      const res = await fetch(`${API_URL}/admin/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          adminId: selectedAdminId,
          type: assignmentType,
          targetId: selectedTargetId
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Assignment failed');
      }

      setSuccessMsg('Successfully granted scope access to administrator!');
      setSelectedTargetId('');
      fetchData();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (assignmentId, type) => {
    if (!window.confirm('Are you sure you want to revoke this administrative scope assignment?')) return;

    try {
      setLoading(true);
      setError('');
      setSuccessMsg('');

      const res = await fetch(`${API_URL}/admin/revoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ assignmentId, type })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Revocation failed');
      }

      setSuccessMsg('Scope assignment successfully revoked.');
      fetchData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter target list based on assignmentType selection
  const getAvailableOptions = () => {
    if (assignmentType === 'apartment') return targets.apartments || [];
    if (assignmentType === 'fleet') return targets.fleets || [];
    if (assignmentType === 'region') return targets.regions || [];
    return [];
  };

  const getOptionLabel = (item) => {
    if (assignmentType === 'apartment') return `${item.apartment_name} (${item.city})`;
    if (assignmentType === 'fleet') return `${item.fleet_name} - ${item.company_name}`;
    if (assignmentType === 'region') return `${item.region_name} (${item.city})`;
    return '';
  };

  return (
    <div className="space-y-8 bg-slate-900/40 border border-slate-800 p-6 sm:p-8 rounded-3xl backdrop-blur-md">
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
      {/* Title block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-100 flex items-center gap-2">
            <Shield className="w-7 h-7 text-indigo-400" />
            Super Admin Scoping Board
          </h2>
          <p className="text-slate-400 text-sm mt-1">Configure role-based community, fleet, and regional access assignments dynamically.</p>
        </div>
        <button
          onClick={fetchData}
          className="text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700/60 transition"
        >
          Refresh Panel
        </button>
      </div>

      {error && (
        <div className="bg-rose-950/40 border border-rose-900/60 text-rose-350 p-4 rounded-2xl text-sm font-bold flex items-center gap-3">
          <div className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse"></div>
          {error}
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-950/40 border border-emerald-900/60 text-emerald-350 p-4 rounded-2xl text-sm font-bold flex items-center gap-3">
          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
          {successMsg}
        </div>
      )}

      {/* Grid columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Grant Scopes Form */}
        <div className="lg:col-span-1 bg-slate-950/40 border border-slate-800/80 p-6 rounded-2xl space-y-6">
          <h3 className="text-lg font-black text-slate-200 flex items-center gap-2">
            <Plus className="w-5 h-5 text-indigo-400" />
            Assign New Scope
          </h3>

          <form onSubmit={handleAssign} className="space-y-4">
            {/* Select Admin */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Select Administrator</label>
              <select
                required
                value={selectedAdminId}
                onChange={(e) => setSelectedAdminId(e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-850 rounded-xl px-4 py-3 text-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition font-medium"
              >
                <option value="">Choose Admin...</option>
                {admins.filter(a => a.role !== 'SUPER_ADMIN').map(a => (
                  <option key={a._id} value={a._id}>
                    {a.email} ({a.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Select Type */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Scope Scope Type</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'apartment', label: 'Apartment', icon: Building },
                  { value: 'fleet', label: 'Fleet', icon: Truck },
                  { value: 'region', label: 'Region', icon: MapPin }
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setAssignmentType(opt.value);
                      setSelectedTargetId('');
                    }}
                    className={`flex flex-col items-center justify-center py-2.5 rounded-xl border text-xs font-bold transition gap-1.5 ${
                      assignmentType === opt.value
                        ? 'bg-indigo-650/20 border-indigo-550 text-indigo-300'
                        : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-355'
                    }`}
                  >
                    <opt.icon className="w-4 h-4" />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Select Target */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Select Specific {assignmentType.charAt(0).toUpperCase() + assignmentType.slice(1)}
              </label>
              <select
                required
                value={selectedTargetId}
                onChange={(e) => setSelectedTargetId(e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-850 rounded-xl px-4 py-3 text-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition font-medium"
              >
                <option value="">Choose Target...</option>
                {getAvailableOptions().map(item => (
                  <option key={item._id} value={item._id}>
                    {getOptionLabel(item)}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition flex justify-center items-center gap-2 shadow-lg shadow-indigo-650/20 disabled:opacity-50 mt-4"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                'Grant Scope Access'
              )}
            </button>
          </form>
        </div>

        {/* Assignments Records Viewer */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Apartment Scopes List */}
          <div className="bg-slate-950/20 border border-slate-850 p-5 rounded-2xl">
            <h4 className="text-sm font-black text-slate-350 flex items-center gap-2 mb-3 uppercase tracking-wider">
              <Building className="w-4 h-4 text-emerald-400" />
              Apartment / Community Access History
            </h4>
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1.5 custom-scrollbar">
              {assignments.apts && assignments.apts.length > 0 ? (
                assignments.apts.map(item => (
                  <div key={item._id} className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-slate-200">{item.admin_id?.email || 'System Account'}</p>
                      <p className="text-slate-450 mt-1 font-medium">Community: <span className="text-emerald-400">{item.apartment_id?.apartment_name}</span></p>
                    </div>
                    <button
                      onClick={() => handleRevoke(item._id, 'apartment')}
                      className="text-slate-500 hover:text-rose-400 hover:bg-rose-950/20 p-2 rounded-lg transition"
                      title="Revoke Permission"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-xs py-2 italic">No active apartment assignments configured.</p>
              )}
            </div>
          </div>

          {/* Fleet Scopes List */}
          <div className="bg-slate-950/20 border border-slate-850 p-5 rounded-2xl">
            <h4 className="text-sm font-black text-slate-350 flex items-center gap-2 mb-3 uppercase tracking-wider">
              <Truck className="w-4 h-4 text-indigo-400" />
              Fleet / Logistics Manager Assignments
            </h4>
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1.5 custom-scrollbar">
              {assignments.fleets && assignments.fleets.length > 0 ? (
                assignments.fleets.map(item => (
                  <div key={item._id} className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-slate-200">{item.admin_id?.email || 'System Account'}</p>
                      <p className="text-slate-450 mt-1 font-medium">Fleet: <span className="text-indigo-400">{item.fleet_id?.fleet_name} ({item.fleet_id?.company_name})</span></p>
                    </div>
                    <button
                      onClick={() => handleRevoke(item._id, 'fleet')}
                      className="text-slate-500 hover:text-rose-400 hover:bg-rose-950/20 p-2 rounded-lg transition"
                      title="Revoke Permission"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-xs py-2 italic">No active fleet manager assignments configured.</p>
              )}
            </div>
          </div>

          {/* Regional Scopes List */}
          <div className="bg-slate-950/20 border border-slate-850 p-5 rounded-2xl">
            <h4 className="text-sm font-black text-slate-350 flex items-center gap-2 mb-3 uppercase tracking-wider">
              <MapPin className="w-4 h-4 text-rose-400" />
              Parking Authority Geographic Ward Assignments
            </h4>
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1.5 custom-scrollbar">
              {assignments.regions && assignments.regions.length > 0 ? (
                assignments.regions.map(item => (
                  <div key={item._id} className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-slate-200">{item.admin_id?.email || 'System Account'}</p>
                      <p className="text-slate-450 mt-1 font-medium">Geographic Zone: <span className="text-rose-400">{item.region_id?.region_name}</span></p>
                    </div>
                    <button
                      onClick={() => handleRevoke(item._id, 'region')}
                      className="text-slate-500 hover:text-rose-400 hover:bg-rose-950/20 p-2 rounded-lg transition"
                      title="Revoke Permission"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-xs py-2 italic">No active parking authority regional assignments configured.</p>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Account Registry overview table -> Grouped Expandable Accordion Hierarchy */}
      <div className="bg-slate-950/40 border border-slate-800/80 p-6 rounded-3xl mt-6 space-y-6">
        <div className="border-b border-slate-800 pb-4">
          <h3 className="text-lg font-black text-slate-100 flex items-center gap-2 uppercase tracking-wider">
            <Users className="w-5 h-5 text-indigo-400" />
            Administrative Directory
          </h3>
          <p className="text-slate-400 text-xs mt-1">Hierarchical organization view of administrators, sub-admins, and operational roles.</p>
        </div>

        {/* Apartment Organizations Accordion Group */}
        <div className="space-y-3">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1 mb-2">Apartment Organizations</h4>
          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1.5 custom-scrollbar">
            {directoryData.apartments.length === 0 ? (
              <p className="text-slate-550 text-xs italic pl-1">No apartment organizations registered.</p>
            ) : (
              directoryData.apartments.map(org => {
                const isExpanded = !!expandedOrgs[org.id];
                return (
                  <div key={org.id} className="border border-slate-850 rounded-2xl overflow-hidden bg-slate-900/20">
                    <button
                      onClick={() => toggleOrgExpand(org.id)}
                      className="w-full flex items-center justify-between p-4 bg-slate-950/20 hover:bg-slate-950/40 transition text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
                          <Building className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="font-extrabold text-white text-sm">{org.organization_name}</span>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-bold uppercase">
                            <span>Invite Code: <strong className="text-indigo-300">{org.invite_code}</strong></span>
                            <span>•</span>
                            <span>{org.activeAdminCount} Admins</span>
                            <span>•</span>
                            <span>{org.totalVehicles} Vehicles</span>
                          </div>
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-405" /> : <ChevronDown className="w-5 h-5 text-slate-405" />}
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-slate-850 bg-slate-950/40 overflow-hidden"
                        >
                          <div className="p-4 overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                                  <th className="py-2 px-2">Name</th>
                                  <th className="py-2 px-2">Email</th>
                                  <th className="py-2 px-2">Username</th>
                                  <th className="py-2 px-2">Account Type</th>
                                  <th className="py-2 px-2">Status</th>
                                  <th className="py-2 px-2">Last Login</th>
                                </tr>
                              </thead>
                              <tbody>
                                {org.admins.length === 0 ? (
                                  <tr>
                                    <td colSpan="6" className="py-3 px-2 text-slate-500 italic text-center">No admins listed.</td>
                                  </tr>
                                ) : (
                                  org.admins.map(adm => (
                                    <tr key={adm.id} className="border-b border-slate-855 hover:bg-slate-900/20 text-slate-300 transition">
                                      <td className="py-3 px-2 font-bold">{adm.name || 'N/A'}</td>
                                      <td className="py-3 px-2">{adm.email}</td>
                                      <td className="py-3 px-2 font-mono text-indigo-300">{adm.username || 'N/A'}</td>
                                      <td className="py-3 px-2 font-semibold text-[10px] text-indigo-400 tracking-wider uppercase">{adm.account_type}</td>
                                      <td className="py-3 px-2">
                                        <span className={`inline-flex items-center gap-1 font-bold ${adm.isActive ? 'text-emerald-450' : 'text-slate-500'}`}>
                                          <span className={`w-1.5 h-1.5 rounded-full ${adm.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`}></span>
                                          {adm.isActive ? 'ACTIVE' : 'INACTIVE'}
                                        </span>
                                      </td>
                                      <td className="py-3 px-2 text-slate-500 font-medium">{adm.last_login ? new Date(adm.last_login).toLocaleString() : 'Never'}</td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="border-t border-slate-800/60 my-2 pt-2"></div>

        {/* Fleet Organizations Accordion Group */}
        <div className="space-y-3">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1 mb-2">Fleet Organizations</h4>
          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1.5 custom-scrollbar">
            {directoryData.fleets.length === 0 ? (
              <p className="text-slate-550 text-xs italic pl-1">No fleet organizations registered.</p>
            ) : (
              directoryData.fleets.map(org => {
                const isExpanded = !!expandedOrgs[org.id];
                return (
                  <div key={org.id} className="border border-slate-855 rounded-2xl overflow-hidden bg-slate-900/20">
                    <button
                      onClick={() => toggleOrgExpand(org.id)}
                      className="w-full flex items-center justify-between p-4 bg-slate-950/20 hover:bg-slate-950/40 transition text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-500/10 rounded-xl text-orange-400">
                          <Truck className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="font-extrabold text-white text-sm">{org.organization_name}</span>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-bold uppercase">
                            <span>Invite Code: <strong className="text-orange-300">{org.invite_code}</strong></span>
                            <span>•</span>
                            <span>{org.activeAdminCount} Admins</span>
                            <span>•</span>
                            <span>{org.totalVehicles} Vehicles</span>
                          </div>
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-405" /> : <ChevronDown className="w-5 h-5 text-slate-405" />}
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-slate-850 bg-slate-950/40 overflow-hidden"
                        >
                          <div className="p-4 overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                                  <th className="py-2 px-2">Name</th>
                                  <th className="py-2 px-2">Email</th>
                                  <th className="py-2 px-2">Username</th>
                                  <th className="py-2 px-2">Account Type</th>
                                  <th className="py-2 px-2">Status</th>
                                  <th className="py-2 px-2">Last Login</th>
                                </tr>
                              </thead>
                              <tbody>
                                {org.admins.length === 0 ? (
                                  <tr>
                                    <td colSpan="6" className="py-3 px-2 text-slate-500 italic text-center">No admins listed.</td>
                                  </tr>
                                ) : (
                                  org.admins.map(adm => (
                                    <tr key={adm.id} className="border-b border-slate-855 hover:bg-slate-900/20 text-slate-300 transition">
                                      <td className="py-3 px-2 font-bold">{adm.name || 'N/A'}</td>
                                      <td className="py-3 px-2">{adm.email}</td>
                                      <td className="py-3 px-2 font-mono text-orange-300">{adm.username || 'N/A'}</td>
                                      <td className="py-3 px-2 font-semibold text-[10px] text-orange-450 tracking-wider uppercase">{adm.account_type}</td>
                                      <td className="py-3 px-2">
                                        <span className={`inline-flex items-center gap-1 font-bold ${adm.isActive ? 'text-emerald-450' : 'text-slate-500'}`}>
                                          <span className={`w-1.5 h-1.5 rounded-full ${adm.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`}></span>
                                          {adm.isActive ? 'ACTIVE' : 'INACTIVE'}
                                        </span>
                                      </td>
                                      <td className="py-3 px-2 text-slate-500 font-medium">{adm.last_login ? new Date(adm.last_login).toLocaleString() : 'Never'}</td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="border-t border-slate-800/60 my-2 pt-2"></div>

        {/* Parking Authorities Accordion Group */}
        <div className="space-y-3">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1 mb-2">Parking Authorities</h4>
          <div className="border border-slate-850 rounded-2xl overflow-hidden bg-slate-900/20">
            <button
              onClick={() => toggleOrgExpand('parking_authorities')}
              className="w-full flex items-center justify-between p-4 bg-slate-950/20 hover:bg-slate-950/40 transition text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-500/10 rounded-xl text-rose-450">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-extrabold text-white text-sm">Parking Authorities Directory</span>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-bold uppercase">
                    <span>{directoryData.parking.length} Registered Officers</span>
                  </div>
                </div>
              </div>
              {!!expandedOrgs['parking_authorities'] ? <ChevronUp className="w-5 h-5 text-slate-405" /> : <ChevronDown className="w-5 h-5 text-slate-405" />}
            </button>

            <AnimatePresence>
              {!!expandedOrgs['parking_authorities'] && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-slate-850 bg-slate-950/40 overflow-hidden"
                >
                  <div className="p-4 overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                          <th className="py-2 px-2">Name</th>
                          <th className="py-2 px-2">Email</th>
                          <th className="py-2 px-2">Username</th>
                          <th className="py-2 px-2">Role Authority</th>
                          <th className="py-2 px-2">Status</th>
                          <th className="py-2 px-2">Last Login</th>
                        </tr>
                      </thead>
                      <tbody>
                        {directoryData.parking.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="py-3 px-2 text-slate-500 italic text-center">No parking officers listed.</td>
                          </tr>
                        ) : (
                          directoryData.parking.map(adm => (
                            <tr key={adm.id} className="border-b border-slate-855 hover:bg-slate-900/20 text-slate-300 transition">
                              <td className="py-3 px-2 font-bold">{adm.name || 'N/A'}</td>
                              <td className="py-3 px-2">{adm.email}</td>
                              <td className="py-3 px-2 font-mono text-rose-350">{adm.username || 'N/A'}</td>
                              <td className="py-3 px-2 font-semibold text-[10px] text-rose-450 tracking-wider uppercase">{adm.role}</td>
                              <td className="py-3 px-2">
                                <span className={`inline-flex items-center gap-1 font-bold ${adm.isActive ? 'text-emerald-450' : 'text-slate-500'}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${adm.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`}></span>
                                  {adm.isActive ? 'ACTIVE' : 'INACTIVE'}
                                </span>
                              </td>
                              <td className="py-3 px-2 text-slate-500 font-medium">{adm.last_login ? new Date(adm.last_login).toLocaleString() : 'Never'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
