import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { API_URL } from '../config';
import { Car, Plus, AlertCircle, Printer, X, Bell, Loader2, MapPin, CalendarClock, Trash2, ShieldAlert, ShoppingCart, CheckCircle, Package, Truck, Box, Check, Clock, Home } from 'lucide-react';
import StickerDesign from '../components/StickerDesign';
import { motion } from 'framer-motion';

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", 
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", 
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", 
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", 
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", 
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", 
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];
const isStatusExpired = (tempStatus) => {
  if (!tempStatus || tempStatus.status !== 'will_return_5') return false;
  if (!tempStatus.updatedAt) return false;
  
  let dateStr = tempStatus.updatedAt;
  if (typeof dateStr === 'string' && !dateStr.endsWith('Z') && !dateStr.includes('+') && !dateStr.includes('-')) {
    dateStr = dateStr + 'Z';
  }
  
  const updatedAt = new Date(dateStr);
  const now = new Date();
  
  return (now - updatedAt) > 5 * 60 * 1000;
};

const formatStatusTime = (dateStr) => {
  if (!dateStr) return '';
  
  let parsedStr = dateStr;
  if (typeof dateStr === 'string' && !dateStr.endsWith('Z') && !dateStr.includes('+') && !dateStr.includes('-')) {
    parsedStr = dateStr + 'Z';
  }
  
  const date = new Date(parsedStr);
  if (isNaN(date.getTime())) return '';
  
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase();
};

export default function OwnerDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin';
  
  // Notification history state
  const [expandedVehicle, setExpandedVehicle] = useState(null);
  const [notificationsParams, setNotificationsParams] = useState({ loading: false, data: [] });


  // Print sticker modal state
  const [printVehicleId, setPrintVehicleId] = useState(null);

  // Zoomed notification image state
  const [activeImage, setActiveImage] = useState(null);

  // Order sticker modal state
  const [orderVehicleId, setOrderVehicleId] = useState(null);
  const [orderProcessing, setOrderProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderForm, setOrderForm] = useState({ name: '', mobile: '', address: '', area: '', pincode: '', state: '' });

  // Track sticker modal state
  const [trackVehicleId, setTrackVehicleId] = useState(null);
  const [trackingProcessing, setTrackingProcessing] = useState(false);

  // Temporary parking status editor state
  const [editingStatusId, setEditingStatusId] = useState(null);
  const [selectedPreset, setSelectedPreset] = useState('none');
  const [customValue, setCustomValue] = useState('');
  const [statusSaving, setStatusSaving] = useState(false);

  const handleSaveStatus = async (vehicleId) => {
    setStatusSaving(true);
    try {
      const now = new Date();
      const localTimeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase();

      const res = await fetch(`${API_URL}/vehicle/${vehicleId}/temporary-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          status: selectedPreset,
          customValue: selectedPreset === 'in_apartment' ? customValue : '',
          updatedAtLocal: localTimeStr
        })
      });
      if (res.ok) {
        setEditingStatusId(null);
        fetchStats();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update status');
      }
    } catch (e) {
      console.error(e);
      alert('Network error');
    } finally {
      setStatusSaving(false);
    }
  };

  const handleOrderSticker = async () => {
    if (!orderForm.name || !orderForm.mobile || !orderForm.address || !orderForm.area || !orderForm.pincode || !orderForm.state) {
      return alert('Please fill all required fields');
    }
    setOrderProcessing(true);
    try {
      const res = await fetch(`${API_URL}/vehicle/${orderVehicleId}/order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(orderForm)
      });
      if (res.ok) {
        setOrderSuccess(true);
        fetchStats();
        setTimeout(() => {
          setOrderVehicleId(null);
          setOrderSuccess(false);
          setOrderForm({ name: '', mobile: '', address: '', area: '', pincode: '', state: '' });
        }, 3000);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to place order');
      }
    } catch (e) {
      console.error(e);
      alert('Network error');
    } finally {
      setOrderProcessing(false);
    }
  };

  const handleUpdateTracking = async (newStatus) => {
    setTrackingProcessing(true);
    try {
      const res = await fetch(`${API_URL}/vehicle/${trackVehicleId}/order/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchStats();
        if (newStatus === 'delivered') {
           setTimeout(() => setTrackVehicleId(null), 1500);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTrackingProcessing(false);
    }
  };

  // Global Notification Modal state
  const [showGlobalModal, setShowGlobalModal] = useState(false);
  const [globalHistory, setGlobalHistory] = useState({ loading: false, data: [] });
  const prevNotifCountRef = useRef(null);

  // Association interactive states
  const [apartments, setApartments] = useState([]);
  const [assocVehicleId, setAssocVehicleId] = useState(null);
  const [assocType, setAssocType] = useState(null); // 'apartment' | 'fleet' | null
  const [assocCode, setAssocCode] = useState('');
  const [selectedAptId, setSelectedAptId] = useState('');
  const [assocError, setAssocError] = useState('');
  const [assocSuccess, setAssocSuccess] = useState(false);
  const [assocLoading, setAssocLoading] = useState(false);

  const [aptSearchQuery, setAptSearchQuery] = useState('');
  const [aptDropdownOpen, setAptDropdownOpen] = useState(false);

  const filteredApartments = apartments.filter(apt =>
    apt.apartment_name?.toLowerCase().includes(aptSearchQuery.toLowerCase()) ||
    apt.city?.toLowerCase().includes(aptSearchQuery.toLowerCase())
  );

  const handleAptSearchChange = (val) => {
    setAptSearchQuery(val);
    if (!val) {
      setSelectedAptId('');
    }
  };

  useEffect(() => {
    if (!assocVehicleId) {
      setAptSearchQuery('');
      setAptDropdownOpen(false);
      setSelectedAptId('');
      setAssocCode('');
      setAssocType(null);
    }
  }, [assocVehicleId]);

  useEffect(() => {
    fetchStats();

    // Fetch apartments list for late association modal
    fetch(`${API_URL}/vehicle/apartments`)
      .then(res => res.json())
      .then(data => setApartments(Array.isArray(data) ? data : []))
      .catch(err => console.error('Error fetching apartments:', err));
    
    // Auto-refresh stats every 10 seconds to catch new notifications
    const interval = setInterval(() => {
      fetchStats();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleSaveAssociation = async (vehicleId) => {
    if (assocType === 'apartment' && !selectedAptId && !assocCode) {
      return alert('Please select an apartment or enter an invite code.');
    }
    if (assocType === 'fleet' && !assocCode) {
      return alert('Please enter a fleet invite code.');
    }

    setAssocLoading(true);
    setAssocError('');
    setAssocSuccess(false);

    try {
      const res = await fetch(`${API_URL}/vehicle/${vehicleId}/associate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          type: assocType,
          inviteCode: assocCode,
          apartmentId: selectedAptId
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to associate vehicle');

      setAssocSuccess(true);
      fetchStats(); // Refresh dashboard
      setTimeout(() => {
        setAssocVehicleId(null);
        setAssocType(null);
        setAssocCode('');
        setSelectedAptId('');
        setAssocSuccess(false);
      }, 1500);
    } catch (err) {
      setAssocError(err.message);
    } finally {
      setAssocLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/dashboard/stats`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 400 && data.error === 'Invalid token.') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/auth';
          return;
        }
        throw new Error(data.error || 'Failed to fetch stats');
      }
      setStats(data);
      
      const unreadCount = data?.vehicles?.reduce((acc, v) => acc + (v.notificationCount || 0), 0) || 0;
      
      // Play sound if notification count increased
      if (prevNotifCountRef.current !== null && unreadCount > prevNotifCountRef.current) {
         try {
           const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
           audio.volume = 0.5;
           const playPromise = audio.play();
           if (playPromise !== undefined) {
             playPromise.catch(error => console.log('Audio autoplay blocked by browser'));
           }
         } catch (e) { console.error('Audio error', e); }
      }
      prevNotifCountRef.current = unreadCount;
      
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleExpandNotifications = async (vehicleId) => {
    if (expandedVehicle === vehicleId) {
      setExpandedVehicle(null);
      return;
    }
    
    setExpandedVehicle(vehicleId);
    setNotificationsParams({ loading: true, data: [] });

    try {
      const res = await fetch(`${API_URL}/dashboard/violations/${vehicleId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setNotificationsParams({ loading: false, data: data.history });

      // Clear the local unread badge badge for this vehicle dynamically
      setStats(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          vehicles: prev.vehicles.map(v => 
            v.vehicleId === vehicleId ? { ...v, notificationCount: 0 } : v
          )
        };
      });

    } catch (e) {
      console.error(e);
      setNotificationsParams({ loading: false, data: [] });
    }
  };

  const handleDeleteVehicle = async (vehicleId) => {
    if (!window.confirm('Do you really want to permanently delete this vehicle? All its notification history will be erased.')) return;
    try {
      const res = await fetch(`${API_URL}/vehicle/${vehicleId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        setExpandedVehicle(null);
        fetchStats(); // Refresh the list
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openGlobalHistory = async () => {
    setShowGlobalModal(true);
    setGlobalHistory({ loading: true, data: [] });
    try {
      const res = await fetch(`${API_URL}/dashboard/all-history`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setGlobalHistory({ loading: false, data: data.history });
    } catch (e) {
      console.error(e);
      setGlobalHistory({ loading: false, data: [] });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-brand-600">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p className="font-semibold text-gray-600">Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100/50">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Overview</h1>
          <p className="text-gray-500 font-medium">Manage your registered vehicles and alerts.</p>
        </div>
        {!isAdmin && (
          <Link to="/dashboard/register" className="bg-brand-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-brand-700 shadow-[0_8px_20px_-8px_rgba(37,99,235,0.6)] hover:-translate-y-0.5 transition-all flex items-center gap-2">
            <Plus className="w-5 h-5" /> Add New Vehicle
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 flex items-center justify-between hover:shadow-lg transition-shadow">
          <div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Total Vehicles</p>
            <p className="text-4xl font-black text-gray-900">{stats?.vehicles?.length || 0}</p>
          </div>
          <div className="bg-blue-50 text-blue-600 p-4 rounded-2xl"><Car className="w-8 h-8"/></div>
        </div>
        <div 
          onClick={openGlobalHistory}
          className="bg-white p-6 rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 flex items-center justify-between hover:shadow-lg transition-all cursor-pointer hover:-translate-y-1"
        >
          <div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Alerts & Notifications</p>
            <p className="text-4xl font-black text-gray-900">{stats?.vehicles?.reduce((acc, v) => acc + (v.notificationCount || 0), 0) || 0}</p>
          </div>
          <div className="bg-orange-50 text-orange-600 p-4 rounded-2xl"><Bell className="w-8 h-8"/></div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 px-2">My Vehicles</h2>
        {stats?.vehicles?.length === 0 ? (
          <div className="bg-white p-16 rounded-3xl border border-dashed border-gray-300 text-center text-gray-500 shadow-sm">
            <Car className="w-20 h-20 mx-auto mb-4 text-gray-300" />
            <p className="text-xl font-medium text-gray-600">
              {isAdmin ? "No vehicles registered under this account." : "You haven't registered any vehicles yet."}
            </p>
            {!isAdmin && (
              <p className="text-sm text-gray-400 mt-2">Add your first vehicle to get your unblockme sticker.</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {stats?.vehicles?.map(v => {
              const hasAlerts = v.notificationCount > 0;
              const trialEndDate = new Date(v.trial_end_date);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const end = new Date(trialEndDate);
              end.setHours(0, 0, 0, 0);
              const remainingDays = Math.round((end - today) / (1000 * 60 * 60 * 24));
              const isExpired = remainingDays <= 0 || v.status === 'expired';
              const showTrialWarning = remainingDays > 0 && remainingDays <= 7;
              
              return (
                <div key={v.vehicleId} className={`bg-white rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden transition-all duration-300 border-2 ${hasAlerts ? 'border-orange-400/50 relative' : 'border-gray-100'}`}>
                  {hasAlerts && (
                    <div className="absolute top-0 right-0 w-20 h-20 bg-orange-400/10 rounded-bl-[100px] pointer-events-none"></div>
                  )}
                  <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-gray-50/50" onClick={() => handleExpandNotifications(v.vehicleId)}>
                    <div className="flex items-center gap-4">
                      <div className={`p-4 rounded-2xl ${hasAlerts ? 'bg-orange-50 text-orange-600 shadow-inner' : 'bg-gray-100 text-gray-500'}`}>
                        <Car className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-2xl text-gray-900 tracking-tight leading-none mb-1">{v.vehicleNumber}</h3>
                          {hasAlerts && <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest shadow-sm animate-pulse">{v.notificationCount} New</span>}
                        </div>
                        <div className="text-sm text-gray-500 font-medium tracking-wide mt-1 flex flex-col sm:flex-row sm:items-center gap-2">
                          <span>ID: <span className="text-brand-600 bg-brand-50 px-1 rounded">{v.vehicleId}</span> • {v.nickname}</span>
                          {v.subscription_plan === 'paid' ? (
                            <span className="text-xs bg-gradient-to-r from-amber-200 to-yellow-400 text-yellow-900 font-black px-2 py-0.5 rounded-md inline-flex items-center gap-1 w-fit shadow-sm">⭐ Premium</span>
                          ) : isExpired ? (
                            <span className="text-xs bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-md inline-flex items-center gap-1 w-fit">❌ Trial expired</span>
                          ) : (
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-md inline-flex items-center gap-1 w-fit ${showTrialWarning ? 'bg-orange-100 text-orange-700 animate-pulse' : 'bg-green-100 text-green-700'}`}>⏳ {remainingDays} days left in free trial</span>
                          )}
                        </div>

                        {/* Association Status badge */}
                        <div className="mt-2 flex flex-wrap gap-2 items-center" onClick={(e) => e.stopPropagation()}>
                          {v.apartment_id ? (
                            <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1">
                              🏢 Apartment: {v.apartment_id.apartment_name}
                            </span>
                          ) : v.fleet_id ? (
                            <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center gap-1">
                              🚚 Fleet: {v.fleet_id.fleet_name}
                            </span>
                          ) : (
                            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 border border-gray-200/80 flex items-center gap-1">
                              Standalone Vehicle
                            </span>
                          )}

                          {!v.apartment_id && !v.fleet_id && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setAssocVehicleId(v.vehicleId);
                                setAssocType(null);
                                setAssocCode('');
                                setSelectedAptId('');
                                setAssocError('');
                                setAssocSuccess(false);
                              }}
                              className="text-[10px] font-black text-brand-600 hover:text-brand-700 hover:underline uppercase tracking-wider bg-brand-50 px-2 py-0.5 rounded transition cursor-pointer"
                            >
                              + Associate Vehicle
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {v.stickerOrder?.isActive ? (
                        v.stickerOrder?.status !== 'delivered' && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); setTrackVehicleId(v.vehicleId); }} 
                            className="text-white border-2 shadow-sm px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition bg-blue-600 border-blue-600 hover:bg-blue-700"
                          >
                            <Package className="w-4 h-4"/> Track Sticker
                          </button>
                        )
                      ) : (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setOrderVehicleId(v.vehicleId); }} 
                          className={`text-white border-2 shadow-sm px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition ${isExpired ? 'bg-red-600 border-red-600 hover:bg-red-700 hover:border-red-700 animate-bounce' : 'bg-[#FF6B00] border-[#FF6B00] hover:bg-[#e66000] hover:border-[#e66000]'}`}
                        >
                          <ShoppingCart className="w-4 h-4"/> {isExpired ? 'Renew / Order' : 'Order Sticker'}
                        </button>
                      )}
                      <button 
                        onClick={(e) => { e.stopPropagation(); setPrintVehicleId(v.vehicleId); }} 
                        className="text-gray-700 bg-white border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition"
                      >
                        <Printer className="w-4 h-4"/> Print Sticker
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleExpandNotifications(v.vehicleId); }} 
                        className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition ${expandedVehicle === v.vehicleId || hasAlerts ? 'bg-orange-100 text-orange-700' : 'bg-orange-50 text-orange-600 hover:bg-orange-100'}`}
                      >
                        <Bell className="w-4 h-4"/> Activity
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteVehicle(v.vehicleId); }} 
                        className="p-2.5 rounded-xl border-2 border-gray-100 hover:border-red-200 text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
                        title="Delete Vehicle forever"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Temporary Parking Status Panel */}
                  <div className="bg-gray-50/50 border-t border-gray-100 px-6 py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 text-sm" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-gray-500 uppercase tracking-wider text-xs">Parking Status:</div>
                      {!v.temporaryStatus || v.temporaryStatus.status === 'none' || isStatusExpired(v.temporaryStatus) ? (
                        <div className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-semibold">
                          <span className="w-2 h-2 rounded-full bg-gray-400"></span> Available / Normal
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2 items-center">
                          {v.temporaryStatus.status === 'will_return_5' && (
                            <span className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1 rounded-full font-bold shadow-sm animate-pulse">
                              <Clock className="w-3.5 h-3.5" /> Will return in 5 mins
                            </span>
                          )}
                          {v.temporaryStatus.status === 'in_apartment' && (
                            <span className="inline-flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-800 px-3 py-1 rounded-full font-bold shadow-sm">
                              <Home className="w-3.5 h-3.5" /> In Apartment {v.temporaryStatus.customValue || 'N/A'}
                            </span>
                          )}
                          {v.temporaryStatus.status === 'call_only_urgent' && (
                            <span className="inline-flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-800 px-3 py-1 rounded-full font-bold shadow-sm">
                              <AlertCircle className="w-3.5 h-3.5 text-red-600" /> Call only if urgent
                            </span>
                          )}
                          <span className="text-xs text-gray-400">
                            Set {v.temporaryStatus.updatedAtLocal || formatStatusTime(v.temporaryStatus.updatedAt)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div>
                      {editingStatusId === v.vehicleId ? (
                        <button 
                          onClick={() => setEditingStatusId(null)}
                          className="text-gray-500 hover:text-gray-800 font-bold transition px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100"
                        >
                          Cancel
                        </button>
                      ) : (
                        <button 
                          onClick={() => {
                            setEditingStatusId(v.vehicleId);
                            setSelectedPreset(v.temporaryStatus?.status || 'none');
                            setCustomValue(v.temporaryStatus?.customValue || '');
                          }}
                          className="bg-brand-50 hover:bg-brand-100 text-brand-700 px-4 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 shadow-sm border border-brand-100"
                        >
                          Change Status
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Temporary Parking Status Editor Form */}
                  {editingStatusId === v.vehicleId && (
                    <div className="bg-white border-t border-gray-100 p-6 flex flex-col gap-4 animate-in slide-in-from-top-2 duration-300" onClick={(e) => e.stopPropagation()}>
                      <h4 className="font-bold text-gray-800 text-base flex items-center gap-2">
                        🚀 Set Temporary Status for {v.vehicleNumber}
                      </h4>
                      <p className="text-xs text-gray-400 -mt-2">
                        Setting a status updates the public sticker view instantly. This helps other drivers understand your parking situation and avoids unnecessary calls.
                      </p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-1">
                        {[
                          { id: 'none', label: 'Clear / None', desc: 'Standard view', colorClass: 'border-gray-200 hover:border-gray-300 active:bg-gray-50' },
                          { id: 'will_return_5', label: 'Return in 5 mins', desc: 'Will return soon', colorClass: 'border-amber-200 hover:border-amber-300 bg-amber-50/20' },
                          { id: 'in_apartment', label: 'In apartment...', desc: 'Flat code', colorClass: 'border-green-200 hover:border-green-300 bg-green-50/20' },
                          { id: 'call_only_urgent', label: 'Call only if urgent', desc: 'Limit calls', colorClass: 'border-red-200 hover:border-red-300 bg-red-50/20' }
                        ].map((preset) => {
                          const isSelected = selectedPreset === preset.id;
                          return (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() => setSelectedPreset(preset.id)}
                              className={`flex flex-col text-left p-3.5 rounded-2xl border-2 transition-all shadow-sm ${isSelected ? 'border-brand-600 bg-brand-50/30 font-bold scale-[1.02] ring-2 ring-brand-600/10' : preset.colorClass}`}
                            >
                              <span className="text-sm font-bold text-gray-800">{preset.label}</span>
                              <span className="text-xs text-gray-400 font-medium mt-0.5">{preset.desc}</span>
                            </button>
                          );
                        })}
                      </div>

                      {selectedPreset === 'in_apartment' && (
                        <div className="animate-in slide-in-from-top-2 duration-300 max-w-sm">
                          <label className="block text-gray-700 font-bold text-xs uppercase tracking-wider mb-2">Apartment / Flat Number</label>
                          <input 
                            type="text" 
                            value={customValue} 
                            onChange={(e) => setCustomValue(e.target.value.slice(0, 30))} 
                            maxLength={30}
                            placeholder="e.g. A-302" 
                            className="w-full border-2 border-gray-200 rounded-xl p-3 focus:ring-4 focus:ring-brand-500/20 focus:border-brand-600 outline-none transition-all font-medium text-sm"
                          />
                        </div>
                      )}

                      <div className="flex gap-3 justify-end mt-2 pt-4 border-t border-gray-100">
                        <button
                          type="button"
                          onClick={() => setEditingStatusId(null)}
                          className="px-5 py-2.5 rounded-xl bg-gray-100 font-bold text-gray-600 hover:bg-gray-200 transition"
                          disabled={statusSaving}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveStatus(v.vehicleId)}
                          className="px-6 py-2.5 rounded-xl bg-brand-600 font-black text-white shadow-lg shadow-brand-500/20 hover:bg-brand-700 transition flex items-center justify-center gap-2"
                          disabled={statusSaving || (selectedPreset === 'in_apartment' && !customValue.trim())}
                        >
                          {statusSaving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            'Save Status'
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Notifications Expandable Area */}
                {expandedVehicle === v.vehicleId && (
                  <div className="bg-gray-50 border-t border-gray-100 p-6 animate-in slide-in-from-top-2 duration-300">
                    <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <Bell className="w-5 h-5 text-gray-500" /> Recent Notifications for {v.vehicleNumber}
                    </h4>
                    
                    {notificationsParams.loading ? (
                      <div className="p-8 text-center text-gray-500 flex flex-col items-center">
                        <Loader2 className="w-6 h-6 animate-spin mb-2" /> Loading history...
                      </div>
                    ) : notificationsParams.data.length === 0 ? (
                      <div className="p-8 text-center text-gray-500 bg-white rounded-2xl border border-dashed border-gray-300">
                        No notifications found! Your parking etiquette is perfect.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {notificationsParams.data.map(notif => (
                          <div key={notif._id} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-start gap-4">
                            <div className={`p-3 rounded-full flex-shrink-0 ${notif.messageType === 'emergency' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>
                              <AlertCircle className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start mb-1">
                                <h5 className="font-bold text-gray-900 capitalize text-lg">{notif.messageType.replace('_', ' ')}</h5>
                                <span className="text-xs font-semibold text-gray-400 flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-lg">
                                  <CalendarClock className="w-3 h-3"/> {new Date(notif.createdAt).toLocaleDateString()} {new Date(notif.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                              </div>
                              {notif.message && <p className="text-gray-600 text-sm mb-2">"{notif.message}"</p>}
                              
                              {notif.imageUrl && (
                                <div className="mb-2 mt-2 flex flex-col items-start">
                                  <img 
                                    src={notif.imageUrl} 
                                    alt="Violation" 
                                    onClick={() => setActiveImage(notif.imageUrl)}
                                    className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-xl border border-gray-200 shadow-sm cursor-zoom-in hover:scale-105 hover:shadow-md transition-all duration-300" 
                                  />
                                  <span className="text-[10px] text-gray-400 font-semibold mt-1 bg-gray-100 px-1.5 py-0.5 rounded">🔍 Click to zoom</span>
                                </div>
                              )}

                              {notif.location && (
                                <a 
                                  href={`https://maps.google.com/?q=${notif.location}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-xs text-brand-600 hover:text-white bg-brand-50 hover:bg-brand-600 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold transition-colors mt-2"
                                >
                                  <MapPin className="w-3 h-3" /> View on Map
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Print Modal */}
      {printVehicleId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[2rem] p-8 max-w-5xl w-full shadow-2xl relative my-8 text-left">
            <button onClick={() => setPrintVehicleId(null)} className="absolute top-6 right-6 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition text-gray-600">
              <X className="w-6 h-6" />
            </button>
            
            <h3 className="text-2xl font-black text-gray-900 mb-6">Print Sticker Option</h3>
            
             {/* Print Styles for ATM Card Size */}
             <style>{`
               @media print {
                 /* Hide all page content */
                 body * {
                   visibility: hidden !important;
                 }
                 
                 /* Reveal only the sticker wrapper and all of its descendants */
                 .print-sticker-wrapper,
                 .print-sticker-wrapper * {
                   visibility: visible !important;
                 }
                 
                 /* Constrain the HTML/Body size to prevent multi-page printing */
                 html, body {
                   width: 85.6mm !important;
                   height: 53.98mm !important;
                   overflow: hidden !important;
                   margin: 0 !important;
                   padding: 0 !important;
                 }

                 /* Precise ATM Card Dimensions (85.6mm x 53.98mm) */
                 .print-sticker-wrapper {
                   position: absolute !important;
                   left: 0 !important;
                   top: 0 !important;
                   width: 85.6mm !important;
                   height: 53.98mm !important;
                   margin: 0 !important;
                   padding: 0 !important;
                   overflow: hidden !important;
                   background: white !important;
                   border: none !important;
                   z-index: 9999999 !important;
                   box-shadow: none !important;
                 }

                 .sticker-design-inner {
                   width: 800px !important;
                   height: 504px !important;
                   transform: scale(0.4044) !important;
                   transform-origin: top left !important;
                   margin: 0 !important;
                   padding: 0 !important;
                 }

                 .sticker-design-inner > div {
                   height: 100% !important;
                   border-width: 3px !important;
                 }
                 
                 /* Force browsers to print background colors and images */
                 * {
                   -webkit-print-color-adjust: exact !important;
                   print-color-adjust: exact !important;
                   color-adjust: exact !important;
                 }

                 @page {
                   size: auto;
                   margin: 0;
                 }
               }
             `}</style>

             <div className="py-8 overflow-x-auto border border-dashed border-gray-300 rounded-2xl bg-gray-50 flex justify-center items-center shadow-inner">
                <div className="min-w-[800px] p-2 sm:scale-100 transform origin-top print-sticker-wrapper">
                  <div className="sticker-design-inner">
                    <StickerDesign 
                      vehicleId={printVehicleId} 
                      trialEndDate={stats?.vehicles?.find(v => v.vehicleId === printVehicleId)?.trial_end_date}
                      isExpired={(() => {
                        const v = stats?.vehicles?.find(v => v.vehicleId === printVehicleId);
                        if (!v) return false;
                        if (v.subscription_plan === 'paid') return false;
                        const end = new Date(v.trial_end_date);
                        end.setHours(0, 0, 0, 0);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return Math.round((end - today) / (1000 * 60 * 60 * 24)) <= 0 || v.status === 'expired';
                      })()}
                    />
                  </div>
                </div>
             </div>

            <div className="flex gap-4 mt-8 justify-center">
              <button 
                onClick={() => window.print()}
                className="bg-gray-900 text-white font-bold py-4 px-8 rounded-xl hover:bg-gray-800 transition flex items-center gap-2 shadow-lg"
              >
                <Printer className="w-5 h-5" /> Print Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Sticker Modal */}
      {orderVehicleId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[2rem] p-8 max-w-lg w-full shadow-2xl relative text-left">
            {!orderSuccess ? (
              <>
                <h3 className="text-2xl font-black text-gray-900 mb-2">Order PVC Sticker</h3>
                <p className="text-gray-600 mb-6 font-medium">Get a weatherproof, high-quality NFC-enabled PVC sticker delivered to your address for ₹199.</p>
                
                <div className="space-y-4 mb-6 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 font-bold mb-2">Full Name</label>
                      <input type="text" value={orderForm.name} onChange={e => setOrderForm({...orderForm, name: e.target.value.slice(0, 50)})} maxLength={50} className="w-full border-2 border-gray-200 rounded-xl p-3 focus:ring-4 focus:ring-[#FF6B00]/20 focus:border-[#FF6B00] outline-none transition-all font-medium" placeholder="John Doe" />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-bold mb-2">Mobile Number</label>
                      <input type="tel" value={orderForm.mobile} onChange={e => setOrderForm({...orderForm, mobile: e.target.value.replace(/\D/g, '').slice(0, 10)})} maxLength={10} pattern="[0-9]{10}" className="w-full border-2 border-gray-200 rounded-xl p-3 focus:ring-4 focus:ring-[#FF6B00]/20 focus:border-[#FF6B00] outline-none transition-all font-medium" placeholder="9876543210" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-700 font-bold mb-2">Complete Address</label>
                    <textarea value={orderForm.address} onChange={e => setOrderForm({...orderForm, address: e.target.value.slice(0, 150)})} maxLength={150} className="w-full border-2 border-gray-200 rounded-xl p-3 focus:ring-4 focus:ring-[#FF6B00]/20 focus:border-[#FF6B00] outline-none transition-all font-medium" rows={2} placeholder="House/Flat No., Building Name..."></textarea>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-1">
                      <label className="block text-gray-700 font-bold mb-2">Area</label>
                      <input type="text" value={orderForm.area} onChange={e => setOrderForm({...orderForm, area: e.target.value.slice(0, 50)})} maxLength={50} className="w-full border-2 border-gray-200 rounded-xl p-3 focus:ring-4 focus:ring-[#FF6B00]/20 focus:border-[#FF6B00] outline-none transition-all font-medium" placeholder="Locality" />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-gray-700 font-bold mb-2">Pincode</label>
                      <input type="text" value={orderForm.pincode} onChange={e => setOrderForm({...orderForm, pincode: e.target.value.replace(/\D/g, '').slice(0, 6)})} maxLength={6} pattern="[0-9]{6}" className="w-full border-2 border-gray-200 rounded-xl p-3 focus:ring-4 focus:ring-[#FF6B00]/20 focus:border-[#FF6B00] outline-none transition-all font-medium" placeholder="000000" />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-gray-700 font-bold mb-2">State</label>
                      <select value={orderForm.state} onChange={e => setOrderForm({...orderForm, state: e.target.value})} className="w-full border-2 border-gray-200 rounded-xl p-3 focus:ring-4 focus:ring-[#FF6B00]/20 focus:border-[#FF6B00] outline-none transition-all font-medium bg-white">
                        <option value="" disabled>Select State</option>
                        {INDIAN_STATES.map(state => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-8">
                  <button 
                    onClick={() => { setOrderVehicleId(null); setOrderSuccess(false); }} 
                    className="flex-1 py-3.5 rounded-xl bg-gray-100 font-bold text-gray-600 hover:bg-gray-200 transition"
                    disabled={orderProcessing}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleOrderSticker} 
                    className="flex-[2] py-3.5 rounded-xl bg-[#FF6B00] font-black text-white shadow-lg shadow-orange-500/30 hover:bg-[#e66000] transition flex items-center justify-center gap-2"
                    disabled={orderProcessing}
                  >
                    {orderProcessing ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    ) : (
                      'Pay ₹199 Now'
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-6 animate-in zoom-in duration-300">
                <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-6 drop-shadow-md" />
                <h3 className="text-3xl font-black text-gray-900">Order Placed!</h3>
                <p className="text-gray-500 mt-2 font-medium">Your premium sticker will arrive in 3-5 business days. Check your dashboard for tracking.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Track Sticker Modal */}
      {trackVehicleId && (() => {
        const currentVehicle = stats?.vehicles?.find(v => v.vehicleId === trackVehicleId);
        const currentStatus = currentVehicle?.stickerOrder?.status || 'processing';
        const statuses = ['processing', 'dispatched', 'in_transit', 'delivered'];
        const currentIndex = statuses.indexOf(currentStatus);

        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl relative text-left">
              <button onClick={() => setTrackVehicleId(null)} className="absolute top-6 right-6 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition text-gray-600">
                <X className="w-6 h-6" />
              </button>
              <h3 className="text-2xl font-black text-gray-900 mb-6">Track Sticker</h3>
              <div className="flex flex-col gap-4 relative">
                <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-gray-200 -z-10"></div>
                {statuses.map((status, idx) => {
                  const isCompleted = currentIndex >= idx;
                  const isActive = currentStatus === status;
                  return (
                    <div key={status} className={`flex items-center gap-4 p-2 rounded-xl transition ${isActive ? 'bg-blue-50/50 -rotate-1' : ''}`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 border-4 border-white ${isCompleted ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-400'}`}>
                        {status === 'processing' && <Package className="w-4 h-4"/>}
                        {status === 'dispatched' && <Box className="w-4 h-4"/>}
                        {status === 'in_transit' && <Truck className="w-4 h-4"/>}
                        {status === 'delivered' && <Check className="w-4 h-4"/>}
                      </div>
                      <div>
                        <p className={`font-bold capitalize transition ${isActive ? 'text-blue-600 text-lg' : isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>{status.replace('_', ' ')}</p>
                        {isActive && <p className="text-xs text-blue-500 font-medium">Current Status</p>}
                      </div>
                    </div>
                  )
                })}
              </div>
              
              {currentIndex < 3 && (
                <div className="mt-8 p-5 bg-blue-50 border border-blue-100 rounded-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Truck className="w-16 h-16"/>
                  </div>
                  <p className="text-xs font-bold text-blue-800 mb-3 uppercase tracking-wider relative z-10">🚀 Mock Developer Tools</p>
                  <div className="grid grid-cols-1 gap-2 relative z-10">
                    {currentIndex === 0 && (
                      <button onClick={() => handleUpdateTracking('dispatched')} disabled={trackingProcessing} className="bg-white text-blue-700 py-2.5 border border-blue-200 rounded-lg text-sm font-bold shadow-sm hover:bg-blue-600 hover:text-white transition">Dispatch Order</button>
                    )}
                    {currentIndex === 1 && (
                      <button onClick={() => handleUpdateTracking('in_transit')} disabled={trackingProcessing} className="bg-white text-blue-700 py-2.5 border border-blue-200 rounded-lg text-sm font-bold shadow-sm hover:bg-blue-600 hover:text-white transition">Mark In Transit</button>
                    )}
                    {currentIndex === 2 && (
                      <button onClick={() => handleUpdateTracking('delivered')} disabled={trackingProcessing} className="bg-[#FF6B00] text-white py-2.5 border-none rounded-lg text-sm font-black shadow-md hover:bg-[#e66000] transition">Mark Delivered (Auto-Upgrade)</button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Global Notifications Modal */}
      {showGlobalModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[2rem] p-6 sm:p-8 max-w-2xl w-full shadow-2xl relative my-8 text-left max-h-[90vh] flex flex-col">
            <button onClick={() => setShowGlobalModal(false)} className="absolute top-6 right-6 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition text-gray-600">
              <X className="w-6 h-6" />
            </button>
            
            <h3 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-3">
              <Bell className="w-7 h-7 text-brand-600 animate-pulse" /> Alerts & Notifications History
            </h3>
            
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {globalHistory.loading ? (
                <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                  <Loader2 className="w-8 h-8 animate-spin mb-4 text-brand-500" /> Fetching history...
                </div>
              ) : globalHistory.data.length === 0 ? (
                <div className="p-12 text-center text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                  <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  No notifications or alerts yet!
                </div>
              ) : (
                globalHistory.data.map(notif => (
                  <div key={notif._id} className="bg-gray-50 p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-start gap-4 hover:shadow-md transition">
                    <div className="p-4 rounded-2xl flex-shrink-0 flex items-center justify-center bg-orange-50 text-orange-600">
                      <Bell className="w-8 h-8" />
                    </div>
                    <div className="flex-1 w-full">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-2">
                        <div className="flex items-center gap-2">
                          <h5 className="font-black text-gray-900 capitalize text-lg tracking-tight">{notif.messageType.replace('_', ' ')}</h5>
                          <span className="text-xs font-bold bg-brand-100 text-brand-800 px-2 py-0.5 rounded uppercase tracking-wider">{notif.vehicleNumber || notif.vehicleId}{notif.nickname ? ` - ${notif.nickname}` : ''}</span>
                        </div>
                        <span className="text-xs font-semibold text-gray-500 flex items-center gap-1">
                          <CalendarClock className="w-3.5 h-3.5"/> {new Date(notif.createdAt).toLocaleDateString()} {new Date(notif.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                      
                      {notif.message && <p className="text-gray-700 text-sm mb-3 bg-white p-3 rounded-xl border border-gray-100 shadow-inner block">"{notif.message}"</p>}
                      
                      {notif.imageUrl && (
                        <div className="mb-3 flex flex-col items-start">
                          <img 
                            src={notif.imageUrl} 
                            alt="Notification Log" 
                            onClick={() => setActiveImage(notif.imageUrl)}
                            className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-xl border border-gray-200 shadow-sm cursor-zoom-in hover:scale-105 hover:shadow-md transition-all duration-300" 
                          />
                          <span className="text-[10px] text-gray-400 font-semibold mt-1 bg-gray-100 px-1.5 py-0.5 rounded">🔍 Click to zoom</span>
                        </div>
                      )}

                      {notif.location && (
                        <a 
                          href={`https://maps.google.com/?q=${notif.location}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-brand-600 hover:text-white bg-brand-50 hover:bg-brand-600 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-colors"
                        >
                          <MapPin className="w-3.5 h-3.5" /> View on Map
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Image Zoom Modal */}
      {activeImage && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-300"
          onClick={() => setActiveImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button 
              onClick={() => setActiveImage(null)} 
              className="absolute -top-12 right-0 p-2 bg-white/10 hover:bg-white/20 rounded-full transition text-white border border-white/20 shadow-md"
            >
              <X className="w-6 h-6" />
            </button>
            <img 
              src={activeImage} 
              alt="Violation Zoomed" 
              className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-white/10 animate-in zoom-in-95 duration-300" 
              onClick={(e) => e.stopPropagation()} 
            />
          </div>
        </div>
      )}

      {/* Associate Vehicle Modal */}
      {assocVehicleId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setAssocVehicleId(null)}>
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl relative text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setAssocVehicleId(null)}
              className="absolute top-6 right-6 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">Associate Vehicle</h3>
            <p className="text-gray-500 text-sm font-medium mb-6">Connect your vehicle to an apartment, gated community, or fleet organization for advanced management features.</p>

            {assocError && (
              <div className="bg-red-50 text-red-600 p-3.5 rounded-xl text-xs font-bold border border-red-100 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-red-650 rounded-full animate-pulse"></span>
                {assocError}
              </div>
            )}

            {assocSuccess && (
              <div className="bg-green-50 text-green-600 p-3.5 rounded-xl text-xs font-bold border border-green-100 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-green-600 rounded-full animate-pulse"></span>
                Successfully connected vehicle! Closing...
              </div>
            )}

            {!assocSuccess && (
              <>
                {!assocType && (
                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={() => setAssocType('apartment')}
                      className="w-full py-3.5 rounded-xl border-2 border-gray-200 hover:border-brand-500 font-bold text-sm text-gray-750 bg-white hover:bg-brand-50/10 transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      🏢 Join Apartment / Community
                    </button>
                    <button 
                      onClick={() => setAssocType('fleet')}
                      className="w-full py-3.5 rounded-xl border-2 border-gray-200 hover:border-[#FF6B00] font-bold text-sm text-gray-755 bg-white hover:bg-orange-50/10 transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      🚚 Join Fleet / Company
                    </button>
                  </div>
                )}

                {assocType === 'apartment' && (
                  <div className="space-y-4 pt-2 animate-in slide-in-from-top-2 duration-300">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Select Apartment</label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Search by Name..."
                            value={aptSearchQuery}
                            onChange={(e) => handleAptSearchChange(e.target.value)}
                            onFocus={() => setAptDropdownOpen(true)}
                            onBlur={() => setTimeout(() => setAptDropdownOpen(false), 250)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none bg-white font-bold text-sm text-gray-900 focus:ring-4 focus:ring-brand-500/10 transition"
                          />
                          {aptDropdownOpen && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                              {filteredApartments.length > 0 ? (
                                filteredApartments.map(apt => (
                                  <div
                                    key={apt._id}
                                    onClick={() => {
                                      setSelectedAptId(apt._id);
                                      setAptSearchQuery(`${apt.apartment_name} (${apt.city})`);
                                      setAptDropdownOpen(false);
                                      setAssocCode('');
                                    }}
                                    className={`px-4 py-2.5 hover:bg-brand-50 hover:text-brand-700 cursor-pointer font-bold text-sm transition-colors ${
                                      selectedAptId === apt._id ? 'bg-brand-50 text-brand-700 font-extrabold' : 'text-gray-800'
                                    }`}
                                  >
                                    {apt.apartment_name} ({apt.city})
                                  </div>
                                ))
                              ) : (
                                <div className="px-4 py-2.5 text-xs text-gray-400 font-bold">No apartments found</div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-center text-xs font-black text-gray-400 py-1 uppercase tracking-widest">— OR —</div>

                      <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Enter Apartment Invite Code</label>
                        <input
                          type="text"
                          placeholder="e.g. PRESTIGE-443"
                          value={assocCode}
                          onChange={(e) => {
                            setAssocCode(e.target.value.toUpperCase());
                            if (e.target.value) {
                              setSelectedAptId('');
                              setAptSearchQuery('');
                            }
                          }}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none bg-white font-black text-sm uppercase tracking-wider text-gray-900 placeholder-gray-400 focus:ring-4 focus:ring-[#FF6B00]/10"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => { setAssocType(null); setAssocCode(''); setSelectedAptId(''); setAptSearchQuery(''); setAssocError(''); }}
                        className="flex-1 py-3.5 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 font-bold text-xs transition cursor-pointer"
                      >
                        Back
                      </button>
                      <button
                        onClick={() => handleSaveAssociation(assocVehicleId)}
                        disabled={assocLoading}
                        className="flex-1 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-black text-xs transition shadow-lg shadow-brand-500/20 disabled:opacity-50 cursor-pointer"
                      >
                        {assocLoading ? 'Validating...' : 'Join Apartment'}
                      </button>
                    </div>
                  </div>
                )}

                {assocType === 'fleet' && (
                  <div className="space-y-4 pt-2 animate-in slide-in-from-top-2 duration-300">
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Enter Fleet / Company Invite Code</label>
                      <input
                        type="text"
                        placeholder="e.g. SWIGGY-OMR-22"
                        value={assocCode}
                        onChange={(e) => setAssocCode(e.target.value.toUpperCase())}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none bg-white font-black text-sm uppercase tracking-wider text-gray-900 placeholder-gray-400 focus:ring-4 focus:ring-[#FF6B00]/10"
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => { setAssocType(null); setAssocCode(''); setAssocError(''); }}
                        className="flex-1 py-3.5 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 font-bold text-xs transition cursor-pointer"
                      >
                        Back
                      </button>
                      <button
                        onClick={() => handleSaveAssociation(assocVehicleId)}
                        disabled={assocLoading}
                        className="flex-1 py-3.5 rounded-xl bg-[#FF6B00] hover:bg-[#e66000] text-white font-black text-xs transition shadow-lg shadow-orange-500/20 disabled:opacity-50 cursor-pointer"
                      >
                        {assocLoading ? 'Validating...' : 'Join Fleet'}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
