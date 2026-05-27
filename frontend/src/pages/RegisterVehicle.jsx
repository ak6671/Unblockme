import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import { CheckCircle, ShoppingCart } from 'lucide-react';
import StickerDesign from '../components/StickerDesign';
import { motion } from 'framer-motion';

export default function RegisterVehicle() {
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [newVehicle, setNewVehicle] = useState(null);
  const navigate = useNavigate();

  // Scope lists
  const [apartments, setApartments] = useState([]);

  // Association interactive states
  const [associationType, setAssociationType] = useState(null); // 'apartment' | 'fleet' | null
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

  React.useEffect(() => {
    if (!newVehicle) {
      setAptSearchQuery('');
      setAptDropdownOpen(false);
      setSelectedAptId('');
      setAssocCode('');
      setAssociationType(null);
    }
  }, [newVehicle]);

  React.useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role === 'admin') {
      navigate('/admin/dashboard');
    }
  }, [navigate]);

  React.useEffect(() => {
    // Fetch available apartments for dropdown list
    fetch(`${API_URL}/vehicle/apartments`)
      .then(res => res.json())
      .then(data => setApartments(Array.isArray(data) ? data : []))
      .catch(err => console.error('Error fetching apartments:', err));
  }, []);

  // Order sticker state
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderProcessing, setOrderProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/vehicle/register`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ vehicleNumber, nickname })
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 400 && data.error === 'Invalid token.') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/auth');
          return;
        }
        throw new Error(data.error);
      }

      setNewVehicle(data);
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAssociation = async (type) => {
    if (type === 'apartment' && !selectedAptId && !assocCode) {
      setAssocError('Please select an apartment or enter an invite code.');
      return;
    }
    if (type === 'fleet' && !assocCode) {
      setAssocError('Please enter a fleet invite code.');
      return;
    }

    try {
      setAssocLoading(true);
      setAssocError('');
      setAssocSuccess(false);

      const res = await fetch(`${API_URL}/vehicle/${newVehicle.vehicleId}/associate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          type,
          inviteCode: assocCode,
          apartmentId: selectedAptId
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to associate vehicle');

      setAssocSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      setAssocError(err.message);
    } finally {
      setAssocLoading(false);
    }
  };

  const handleOrderSticker = () => {
    setOrderProcessing(true);
    setTimeout(() => {
      setOrderProcessing(false);
      setOrderSuccess(true);
      setTimeout(() => setShowOrderModal(false), 3000);
    }, 1500);
  };

  if (success && newVehicle) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.8, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 20, stiffness: 100 }}
        className="w-full max-w-4xl mx-auto bg-white p-4 sm:p-8 rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-gray-100 text-center space-y-6 overflow-hidden relative min-w-0"
      >
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className="bg-green-50 text-green-600 w-20 h-20 mx-auto rounded-full flex items-center justify-center shadow-inner"
        >
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>
        
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <h2 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">Vehicle Registered!</h2>
          <p className="text-gray-500 text-lg">Your unique Vehicle ID is <strong className="text-brand-600 bg-brand-50 px-2 py-1 rounded">{newVehicle.vehicleId}</strong></p>
        </motion.div>
        
        <div className="py-6 border border-dashed border-gray-200 rounded-2xl bg-gray-50/80 w-full min-w-0 overflow-x-auto overflow-y-hidden flex relative group">
          {/* Scanning Animation Hologram Effect */}
          <motion.div 
            initial={{ left: "-20%", opacity: 0 }}
            animate={{ left: "120%", opacity: [0, 1, 1, 0] }}
            transition={{ duration: 2.5, ease: "easeInOut", delay: 0.6 }}
            className="absolute top-0 h-full w-12 bg-gradient-to-r from-transparent via-[#FF6B00]/40 to-transparent z-20 pointer-events-none"
          >
            <div className="h-full w-[2px] bg-[#FF6B00] shadow-[0_0_15px_#FF6B00]"></div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, filter: "blur(10px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="w-[800px] min-w-[800px] p-6 mx-auto flex-shrink-0 transform z-10"
          >
            <StickerDesign 
              vehicleId={newVehicle.vehicleId} 
              trialEndDate={newVehicle.trial_end_date}
            />
          </motion.div>
        </div>
        
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} className="text-sm font-bold text-gray-400 uppercase tracking-widest">
          Print the design above and paste it on your vehicle
        </motion.p>

        {/* Associate Vehicle Optional Section */}
        <div className="bg-gray-55 border border-gray-200 p-6 rounded-2xl text-left max-w-xl mx-auto space-y-4 shadow-sm">
          <h3 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2 leading-none">
            🔗 Associate Vehicle <span className="text-[10px] bg-gray-200 text-gray-650 px-2 py-0.5 rounded font-black tracking-widest uppercase">Optional</span>
          </h3>
          <p className="text-gray-500 text-sm font-medium leading-relaxed">
            Connect your vehicle to an apartment, gated community, or fleet organization for advanced management features.
          </p>

          {assocError && (
            <div className="bg-red-50 text-red-650 p-3.5 rounded-xl text-xs font-bold border border-red-100 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-red-650 rounded-full animate-pulse"></span>
              {assocError}
            </div>
          )}

          {assocSuccess && (
            <div className="bg-green-50 text-green-650 p-3.5 rounded-xl text-xs font-bold border border-green-100 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-green-650 rounded-full animate-pulse"></span>
              Successfully associated vehicle with organization! Redirecting...
            </div>
          )}

          {!assocSuccess && (
            <>
              {!associationType && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button 
                    onClick={() => setAssociationType('apartment')}
                    className="py-3 rounded-xl border-2 border-gray-200 hover:border-brand-500 font-bold text-sm text-gray-750 bg-white hover:bg-brand-50/10 transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    🏢 Join Apartment / Community
                  </button>
                  <button 
                    onClick={() => setAssociationType('fleet')}
                    className="py-3 rounded-xl border-2 border-gray-200 hover:border-[#FF6B00] font-bold text-sm text-gray-755 bg-white hover:bg-orange-50/10 transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    🚚 Join Fleet / Company
                  </button>
                </div>
              )}

              {associationType === 'apartment' && (
                <div className="space-y-4 pt-4 border-t border-gray-200/80 animate-in slide-in-from-top-2 duration-300">
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
                      onClick={() => { setAssociationType(null); setAssocCode(''); setSelectedAptId(''); setAptSearchQuery(''); setAssocError(''); }}
                      className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 font-bold text-xs transition cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => handleSaveAssociation('apartment')}
                      disabled={assocLoading}
                      className="flex-1 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-black text-xs transition shadow-lg shadow-brand-500/20 disabled:opacity-50 cursor-pointer"
                    >
                      {assocLoading ? 'Validating...' : 'Join Apartment'}
                    </button>
                  </div>
                </div>
              )}

              {associationType === 'fleet' && (
                <div className="space-y-4 pt-4 border-t border-gray-200/80 animate-in slide-in-from-top-2 duration-300">
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
                      onClick={() => { setAssociationType(null); setAssocCode(''); setAssocError(''); }}
                      className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 font-bold text-xs transition cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => handleSaveAssociation('fleet')}
                      disabled={assocLoading}
                      className="flex-1 py-3 rounded-xl bg-[#FF6B00] hover:bg-[#e66000] text-white font-black text-xs transition shadow-lg shadow-orange-500/20 disabled:opacity-50 cursor-pointer"
                    >
                      {assocLoading ? 'Validating...' : 'Join Fleet'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
          </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center pt-6 border-t border-gray-100"
        >
          <button 
            onClick={() => setShowOrderModal(true)}
            className="flex-1 max-w-sm flex items-center justify-center gap-2 bg-[#FF6B00] text-white font-bold py-4 rounded-xl hover:bg-[#e66000] shadow-lg shadow-orange-500/30 transition transform hover:-translate-y-1"
          >
            <ShoppingCart className="w-5 h-5" /> Order Premium PVC Sticker
          </button>
          
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex-1 max-w-sm font-bold py-4 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition transform hover:-translate-y-1"
          >
            Skip & Go to Dashboard
          </button>
        </motion.div>

        {/* Dummy Order Modal */}
        {showOrderModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl relative text-left"
            >
              {!orderSuccess ? (
                <>
                  <h3 className="text-2xl font-black text-gray-900 mb-4">Order PVC Sticker</h3>
                  <p className="text-gray-600 mb-6 font-medium">Get a weatherproof, high-quality NFC-enabled PVC sticker delivered to your address for ₹199.</p>
                  
                  <div className="space-y-4 mb-6 text-sm">
                    <div>
                      <label className="block text-gray-700 font-bold mb-2">Delivery Address</label>
                      <textarea className="w-full border-2 border-gray-200 rounded-xl p-3 focus:ring-4 focus:ring-[#FF6B00]/20 focus:border-[#FF6B00] outline-none transition-all font-medium" rows={3} placeholder="123 Example Street..."></textarea>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button 
                      onClick={() => setShowOrderModal(false)} 
                      className="flex-1 py-3.5 rounded-xl bg-gray-150 font-bold text-gray-700 hover:bg-gray-200 transition"
                      disabled={orderProcessing}
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleOrderSticker} 
                      className="flex-1 py-3.5 rounded-xl bg-[#FF6B00] font-black text-white shadow-lg shadow-orange-500/30 hover:bg-[#e66000] transition flex items-center justify-center gap-2"
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
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center py-6">
                  <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-6 drop-shadow-md" />
                  <h3 className="text-3xl font-black text-gray-900">Order Placed!</h3>
                  <p className="text-gray-500 mt-2 font-medium">Your premium sticker will arrive in 3-5 business days. Check your dashboard for tracking.</p>
                </motion.div>
              )}
            </motion.div>
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto bg-white p-8 rounded-[2rem] shadow-[0_8px_40px_rgb(0,0,0,0.06)] border border-gray-100"
    >
      <div className="bg-[#FF6B00]/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <ShoppingCart className="w-8 h-8 text-[#FF6B00]" />
      </div>
      <h2 className="text-3xl font-black text-gray-900 mb-8 text-center tracking-tight">Register New Vehicle</h2>
      
      {error && <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="bg-red-50 text-red-650 p-4 rounded-xl mb-6 text-sm font-bold flex items-center gap-3 border border-red-100">
        <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div> {error}
      </motion.div>}

      <form onSubmit={handleRegister} className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Vehicle Registration Number</label>
          <input 
            type="text" 
            required
            value={vehicleNumber}
            onChange={(e) => {
              const val = e.target.value.toUpperCase().replace(/[^A-Z0-9 ]/g, '').slice(0, 15);
              setVehicleNumber(val);
            }}
            maxLength={15}
            placeholder="e.g. MH 12 AB 1234"
            className="w-full px-5 py-4 rounded-2xl border-2 border-gray-200 focus:ring-4 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all uppercase bg-gray-50/50 font-black text-lg tracking-wider text-gray-900"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Nickname (Optional)</label>
          <input 
            type="text" 
            value={nickname}
            onChange={(e) => {
              const val = e.target.value.replace(/[^A-Za-z0-9 ]/g, '').slice(0, 30);
              setNickname(val);
            }}
            maxLength={30}
            placeholder="e.g. My Honda City"
            className="w-full px-5 py-4 rounded-2xl border-2 border-gray-200 focus:ring-4 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all bg-gray-50/50 font-bold text-gray-900"
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-brand-600 text-white font-black text-lg py-4 rounded-2xl hover:bg-brand-700 transition-[background,transform] hover:-translate-y-1 shadow-[0_10px_20px_-10px_rgba(37,99,235,0.6)] disabled:opacity-50 disabled:transform-none mt-8 flex justify-center items-center gap-2"
        >
          {loading ? <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : 'Register Vehicle'}
        </button>
      </form>
    </motion.div>
  );
}
