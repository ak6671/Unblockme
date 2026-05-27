import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Camera, ShieldCheck, Mail, Save, X, Phone, IdCard } from 'lucide-react';

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [drivingLicense, setDrivingLicense] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');
  const [phone, setPhone] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      navigate('/auth');
      return;
    }
    const userObj = JSON.parse(userStr);
    setName(userObj.name || '');
    setDrivingLicense(userObj.drivingLicense || '');
    setProfilePhoto(userObj.profilePhoto || '');
    setPhone(userObj.phone || '');
  }, [navigate]);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400; // Small max width for profile
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
        setProfilePhoto(dataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, profilePhoto, drivingLicense })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');

      localStorage.setItem('user', JSON.stringify(data.user));
      setSuccess(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 max-w-2xl mx-auto w-full mb-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">My Profile</h1>
          <p className="text-gray-500 font-medium">Manage your personal settings</p>
        </div>
      </div>

      <motion.form 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSave}
        className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8"
      >
        <AnimatePresence mode="wait">
          {error && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-bold border border-red-100">
              {error}
            </motion.div>
          )}
          {success && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-green-50 text-green-700 p-4 rounded-xl mb-6 text-sm font-bold border border-green-100 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5"/> Profile updated successfully!
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col md:flex-row gap-8 mb-8">
          {/* Photo Section */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative group w-32 h-32 rounded-full border-4 border-gray-100 bg-gray-50 flex items-center justify-center overflow-hidden shadow-sm">
              {profilePhoto ? (
                <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-gray-300" />
              )}
              
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm"
              >
                <Camera className="w-6 h-6 text-white" />
              </div>
            </div>
            
            {profilePhoto && (
              <button 
                type="button" 
                onClick={() => setProfilePhoto('')}
                className="text-xs text-red-500 font-bold bg-red-50 px-3 py-1 rounded-full flex items-center gap-1 hover:bg-red-100 transition"
              >
                <X className="w-3 h-3" /> Remove
              </button>
            )}
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              onChange={handleImageSelect} 
              className="hidden" 
            />
          </div>

          {/* Core Info */}
          <div className="flex-1 space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 flex items-center gap-1 uppercase tracking-wider"><Phone className="w-3 h-3"/> Phone Number</label>
              <input 
                type="text" 
                value={phone}
                disabled
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-100 text-gray-500 font-medium cursor-not-allowed"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1 uppercase tracking-wider"><User className="w-3 h-3"/> Full Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex. John Doe"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20 outline-none transition font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1 uppercase tracking-wider"><IdCard className="w-3 h-3"/> Driving License</label>
              <input 
                type="text" 
                value={drivingLicense}
                onChange={(e) => setDrivingLicense(e.target.value.toUpperCase())}
                placeholder="Ex. DL-1420110012345"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20 outline-none transition font-medium uppercase"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-6 flex justify-end">
          <button 
            type="submit" 
            disabled={loading}
            className="bg-brand-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-brand-700 transition flex items-center gap-2 disabled:opacity-50 shadow-md shadow-brand-500/20"
          >
            {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </motion.form>
    </div>
  );
}
