import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { API_URL } from '../config';
import { Info, BellRing, PhoneCall, Camera, ShieldAlert, CheckCircle, Wifi, LockKeyhole, X, Image as ImageIcon, Clock, Home, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

export default function PublicVehicleView() {
  const { id } = useParams();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [action, setAction] = useState(null); // 'notify', 'call'
  const [msgType, setMsgType] = useState('blocking');
  const [customMsg, setCustomMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [notified, setNotified] = useState(false);
  const [showCallConfirm, setShowCallConfirm] = useState(false);

  // Photo state
  const [imageFile, setImageFile] = useState(null);
  const [imageBase64, setImageBase64] = useState('');
  const fileInputRef = React.useRef(null);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        setImageBase64(dataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    fetchVehicle();
  }, [id]);

  const fetchVehicle = async () => {
    try {
      const res = await fetch(`${API_URL}/vehicle/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setVehicle(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const notifyOwner = async (e) => {
    e.preventDefault();
    setSending(true);

    let locationData = null;

    // Helper to perform the actual fetch
    const sendRequest = async (loc) => {
      try {
        const res = await fetch(`${API_URL}/notify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vehicleId: id,
            messageType: msgType,
            message: msgType === 'other' ? customMsg : '',
            location: loc,
            imageUrl: imageBase64 // Append the highly compressed base64 string
          })
        });
        
        const responseText = await res.text();
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          throw new Error('Upload failed. The photo might be too large or your internet connection dropped.');
        }

        if (!res.ok) throw new Error(data.error || 'Failed to send notification');
        setNotified(true);
      } catch (err) {
        alert(err.message);
      } finally {
        setSending(false);
      }
    };

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          locationData = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          sendRequest(locationData);
        },
        (error) => {
          console.log('[Geolocation Denied or Failed]: ', error.message);
          sendRequest(null); // Proceed without location
        },
        { timeout: 5000, maximumAge: 60000 }
      );
    } else {
      sendRequest(null);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-12 text-brand-600 h-screen">
      <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-4"></div>
      <p className="font-bold text-gray-600 animate-pulse text-lg">Locating vehicle...</p>
    </div>
  );
  
  if (error) return (
    <div className="p-12 text-center flex flex-col items-center justify-center h-screen">
      <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
      <h2 className="text-2xl font-black text-gray-900 mb-2">Vehicle Not Found</h2>
      <p className="text-gray-500 font-medium max-w-sm mx-auto">{error}</p>
    </div>
  );

  if (notified) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md mx-auto text-center py-20 px-6">
        <div className="bg-green-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
          <CheckCircle className="w-12 h-12 text-green-500" />
        </div>
        <h2 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">Owner Alerted!</h2>
        <p className="text-gray-600 text-lg">The owner has been notified securely. They will respond shortly.</p>
        <button onClick={() => window.location.reload()} className="mt-8 text-gray-400 font-medium hover:text-gray-600 transition">
          Return to home
        </button>
      </motion.div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-[2rem] shadow-2xl shadow-brand-500/10 border border-gray-100 overflow-hidden w-full my-4 md:my-10 animate-in fade-in slide-in-from-bottom-8 duration-500">
      
      {/* Header */}
      <div className="bg-[#FF6B00] p-8 text-center text-white relative overflow-hidden">
        {/* Abstract pattern */}
        <div className="absolute top-0 right-0 opacity-10">
          <svg width="200" height="200" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12l-5.657 5.657-1.414-1.414L21.172 12l-4.243-4.243 1.414-1.414L24 12zM2.828 12l4.243 4.243-1.414 1.414L0 12l5.657-5.657L7.07 7.757 2.828 12z"/></svg>
        </div>
        <h1 className="text-sm uppercase tracking-widest font-bold opacity-90 mb-3 drop-shadow flex items-center justify-center gap-2">
          Vehicle ID <span className="bg-white/20 px-2 py-0.5 rounded text-white">{vehicle.vehicleId}</span>
        </h1>
        <div className="text-4xl font-black font-mono bg-white text-gray-900 px-6 py-3 rounded-2xl inline-block shadow-lg tracking-widest">
          {vehicle.vehicleNumber}
        </div>
      </div>
      
      <div className="p-6 space-y-6 relative">
        {vehicle.status === 'expired' && (
          <div className="absolute top-0 left-0 right-0 bottom-0 z-10 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center rounded-b-[2rem]">
            <div className="bg-red-50 p-6 rounded-3xl border border-red-100 shadow-xl max-w-sm w-full mt-4">
              <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-black text-gray-900 mb-2">🚫 This sticker has expired</h2>
              <p className="text-gray-600 font-medium mb-6">🔄 Renew to continue using UnblockMe</p>
              
              <button 
                onClick={() => window.open('/auth', '_blank')}
                className="w-full bg-[#FF6B00] text-white font-black py-4 rounded-xl shadow-lg shadow-orange-500/30 hover:bg-[#e66000] transition transform hover:-translate-y-1 block text-center"
              >
                👉 Order New Sticker
              </button>
            </div>
          </div>
        )}

        {vehicle.temporaryStatus && vehicle.temporaryStatus.status !== 'none' && !isStatusExpired(vehicle.temporaryStatus) && (
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200/50 p-5 rounded-3xl shadow-sm space-y-3 relative overflow-hidden animate-in zoom-in duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/5 rounded-bl-[100px] pointer-events-none"></div>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl flex-shrink-0 bg-white shadow-sm">
                {vehicle.temporaryStatus.status === 'will_return_5' && <Clock className="w-6 h-6 text-amber-500 animate-pulse" />}
                {vehicle.temporaryStatus.status === 'in_apartment' && <Home className="w-6 h-6 text-green-500" />}
                {vehicle.temporaryStatus.status === 'call_only_urgent' && <AlertCircle className="w-6 h-6 text-red-500 animate-bounce" />}
              </div>
              <div>
                <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Current Parking Status</span>
                <h3 className="font-black text-xl text-gray-900 leading-tight">
                  {vehicle.temporaryStatus.status === 'will_return_5' && 'Will return in 5 mins'}
                  {vehicle.temporaryStatus.status === 'in_apartment' && `In Apartment ${vehicle.temporaryStatus.customValue || 'N/A'}`}
                  {vehicle.temporaryStatus.status === 'call_only_urgent' && 'Call only if urgent'}
                </h3>
              </div>
            </div>
            {vehicle.temporaryStatus.status === 'will_return_5' && (
              <p className="text-xs text-amber-800 font-medium bg-amber-50/50 p-2.5 rounded-xl border border-amber-100">
                ⏳ The owner has marked that they'll be back in a few minutes. Please consider waiting before initiating a call or alert.
              </p>
            )}
            {vehicle.temporaryStatus.status === 'in_apartment' && (
              <p className="text-xs text-green-800 font-medium bg-green-50/50 p-2.5 rounded-xl border border-green-100">
                🏢 The owner is currently visiting apartment **{vehicle.temporaryStatus.customValue}**. If you are nearby or live in the building, you can find them there.
              </p>
            )}
            {vehicle.temporaryStatus.status === 'call_only_urgent' && (
              <p className="text-xs text-red-800 font-medium bg-red-50/50 p-2.5 rounded-xl border border-red-100 animate-pulse">
                ⚠️ The owner is in a meeting or busy. Please **alert them via message** instead, and **call only if it is an extreme emergency**.
              </p>
            )}
          </div>
        )}

        <div className={`flex items-start gap-3 bg-blue-50/50 border border-blue-100 p-4 rounded-2xl text-blue-800 text-sm ${vehicle.status === 'expired' ? 'opacity-30 pointer-events-none' : ''}`}>
          <LockKeyhole className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-600" />
          <p className="font-medium">You can securely contact the owner without revealing your identity or phone number.</p>
        </div>

        <div className={vehicle.status === 'expired' ? 'opacity-30 pointer-events-none' : ''}>
        <AnimatePresence mode="wait">
          {!action ? (
            <motion.div 
              key="buttons"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-2 gap-4 mt-6"
            >
              <button 
                onClick={() => setAction('notify')}
                className="group flex flex-col items-center justify-center p-6 bg-white hover:bg-brand-50 border-2 border-gray-100 hover:border-brand-300 rounded-3xl transition-all shadow-sm hover:shadow-md gap-3 transform hover:-translate-y-1"
              >
                <div className="bg-brand-50 p-4 rounded-full group-hover:bg-brand-100 transition-colors">
                  <BellRing className="w-8 h-8 text-brand-600" />
                </div>
                <span className="font-bold text-gray-800 tracking-wide">Send Alert</span>
              </button>
              
              <button 
                onClick={() => {
                  if (vehicle.temporaryStatus?.status === 'call_only_urgent' && !isStatusExpired(vehicle.temporaryStatus)) {
                    setShowCallConfirm(true);
                  } else {
                    alert("Call routing is currently disabled in Demo.");
                  }
                }}
                className="group flex flex-col items-center justify-center p-6 bg-white hover:bg-[#FF6B00]/10 border-2 border-gray-100 hover:border-[#FF6B00]/50 rounded-3xl transition-all shadow-sm hover:shadow-md gap-3 transform hover:-translate-y-1 relative overflow-hidden"
              >
                {vehicle.temporaryStatus?.status === 'call_only_urgent' && !isStatusExpired(vehicle.temporaryStatus) && (
                  <span className="absolute top-2 right-2 bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse shadow-sm">Urgent Only</span>
                )}
                <div className="bg-[#FF6B00]/10 p-4 rounded-full group-hover:bg-[#FF6B00]/20 transition-colors">
                  <PhoneCall className="w-8 h-8 text-[#FF6B00] fill-current" />
                </div>
                <span className="font-bold text-gray-800 tracking-wide">Call Owner</span>
              </button>
            </motion.div>
          ) : (
            <motion.form 
              key="form"
              initial={{ opacity: 0, height: 0, y: 20 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: 20 }}
              onSubmit={notifyOwner} 
              className="space-y-5"
            >
              <div className="flex justify-between items-center bg-gray-50 px-4 py-2 rounded-xl mb-4">
                <h3 className="font-black text-gray-900 tracking-wide">Select Issue</h3>
                <button type="button" onClick={() => setAction(null)} className="text-sm font-bold text-gray-400 hover:text-gray-800 transition">Go Back</button>
              </div>

              <div className="space-y-3">
                {[
                  { id: 'blocking', label: 'Blocking my way', color: 'orange', iconColor: 'text-[#FF6B00]', bgActive: 'bg-[#FF6B00]/5', borderActive: 'border-[#FF6B00]' },
                  { id: 'wrong_parking', label: 'Wrong parking', color: 'orange', iconColor: 'text-[#FF6B00]', bgActive: 'bg-[#FF6B00]/5', borderActive: 'border-[#FF6B00]' },
                  { id: 'emergency', label: 'Emergency / Accident', color: 'red', iconColor: 'text-red-600', bgActive: 'bg-red-500/5', borderActive: 'border-red-500' },
                  { id: 'headlights_on', label: 'Headlights are on', color: 'green', iconColor: 'text-green-600', bgActive: 'bg-green-500/5', borderActive: 'border-green-500' },
                  { id: 'other', label: 'Other Issue', color: 'green', iconColor: 'text-green-600', bgActive: 'bg-green-500/5', borderActive: 'border-green-500' }
                ].map(type => {
                  const isActive = msgType === type.id;
                  return (
                    <label key={type.id} className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${isActive ? `${type.bgActive} ${type.borderActive} ${type.iconColor} font-bold shadow-sm` : 'bg-white border-gray-100 hover:border-gray-200 text-gray-700'}`}>
                      <input 
                        type="radio" 
                        name="issue" 
                        value={type.id} 
                        checked={isActive}
                        onChange={(e) => setMsgType(e.target.value)}
                        className={`w-5 h-5 border-gray-300 focus:ring-2 ${isActive ? type.iconColor : 'text-gray-400'}`}
                        style={{ accentColor: type.color === 'red' ? '#ef4444' : type.color === 'orange' ? '#FF6B00' : '#22c55e' }}
                      />
                      <span>{type.label}</span>
                      {isActive && type.color === 'red' && <ShieldAlert className="w-4 h-4 ml-auto text-red-500 animate-pulse" />}
                    </label>
                  );
                })}
              </div>

              {msgType === 'other' && (
                <textarea 
                  placeholder="Describe the issue in detail..."
                  className="w-full px-5 py-4 rounded-2xl border-2 border-gray-200 focus:ring-4 focus:ring-[#FF6B00]/20 focus:border-[#FF6B00] outline-none transition-all placeholder-gray-400"
                  value={customMsg}
                  onChange={e => setCustomMsg(e.target.value)}
                  maxLength={200}
                  rows={3}
                  required
                />
              )}

              <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef} 
                onChange={handleImageSelect} 
                className="hidden" 
              />
              
              {!imageBase64 ? (
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-4 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center gap-3 text-gray-500 font-bold hover:bg-gray-50 hover:border-gray-400 transition cursor-pointer"
                >
                  <Camera className="w-6 h-6"/> Attach Photo (Optional)
                </button>
              ) : (
                <div className="relative w-full rounded-2xl border-2 border-brand-300 overflow-hidden bg-gray-50 group">
                  <img src={imageBase64} alt="Preview" className="w-full h-32 object-cover opacity-80 group-hover:opacity-100 transition" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition">
                    <button 
                      type="button" 
                      onClick={() => { setImageFile(null); setImageBase64(''); }}
                      className="bg-red-500 text-white p-2 rounded-full shadow-lg hover:scale-110 transition"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded flex items-center gap-1 backdrop-blur-sm">
                    <ImageIcon className="w-3 h-3" /> Photo Attached
                  </div>
                </div>
              )}

              <button 
                type="submit" 
                disabled={sending}
                className="w-full bg-[#FF6B00] text-white font-bold text-lg flex items-center justify-center gap-2 py-4 rounded-2xl hover:bg-[#e66000] transition-[background,transform] hover:-translate-y-1 shadow-lg shadow-orange-500/30 disabled:opacity-50 disabled:transform-none mt-2"
              >
                {sending ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Locating & Sending...
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-6 h-6" /> Notify Owner Now
                  </>
                )}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
        
        {/* Offline Support Instruction for no-action view */}
        {!action && (
          <div className="mt-8 pt-6 border-t border-gray-100">
            <h4 className="text-xs font-bold text-gray-400 tracking-widest uppercase text-center mb-4">No Internet Required</h4>
            <div className="bg-gray-900 rounded-2xl p-5 text-white flex items-center gap-4">
               <PhoneCall className="w-10 h-10 text-white fill-current opacity-80" />
               <div>
                  <p className="text-sm text-gray-400 font-medium">Alternatively, Call</p>
                  <p className="text-2xl font-black tracking-wide">080 6926 1234</p>
                  <p className="text-xs text-gray-300 mt-1">Enter your vehicle code: <span className="font-bold text-[#FF6B00] bg-white/10 px-1 py-0.5 rounded">{vehicle.vehicleId}</span></p>
               </div>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Call Confirmation Warning Modal */}
      {showCallConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl border border-red-100 relative text-left animate-in zoom-in-95 duration-300">
            <div className="bg-red-50 w-16 h-16 rounded-3xl flex items-center justify-center mb-6 border border-red-100">
              <ShieldAlert className="w-8 h-8 text-red-500 animate-pulse" />
            </div>
            
            <h3 className="text-2xl font-black text-gray-900 mb-2">Are you sure?</h3>
            <p className="text-gray-600 font-medium mb-6 text-sm leading-relaxed">
              The vehicle owner has set their status to <strong className="text-red-600 font-bold">"Call only if urgent"</strong> because they are busy. 
              Please consider sending an alert message first, as it is less intrusive.
            </p>
            
            <div className="flex flex-col gap-3">
              <button 
                type="button"
                onClick={() => {
                  setShowCallConfirm(false);
                  setAction('notify');
                }}
                className="w-full bg-brand-600 text-white font-black py-4 rounded-xl shadow-lg shadow-brand-500/20 hover:bg-brand-700 transition text-center text-sm"
              >
                💬 Send Message Alert (Recommended)
              </button>
              
              <button 
                type="button"
                onClick={() => {
                  setShowCallConfirm(false);
                  alert("Call routing is currently disabled in Demo.");
                }}
                className="w-full bg-gray-100 text-gray-700 font-bold py-3.5 rounded-xl hover:bg-gray-200 transition text-center text-sm border border-gray-200"
              >
                📞 Yes, Call Owner Anyway
              </button>
              
              <button 
                type="button"
                onClick={() => setShowCallConfirm(false)}
                className="w-full text-gray-400 font-bold py-2 hover:text-gray-600 transition text-center text-xs"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
