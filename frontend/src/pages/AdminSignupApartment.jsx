import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building, ShieldCheck, Mail, Lock, Phone, User, MapPin, ClipboardList, Info, Globe, HelpCircle, ArrowLeft, Check } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function AdminSignupApartment() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    mobile: '',
    apartment_name: '',
    address: '',
    city: '',
    state: '',
    total_units: '',
    parking_slots: '',
    community_type: 'Apartment',
    website: '',
    notes: '',
    authorized: false
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validations
    if (!formData.name.trim() || !formData.email.trim() || !formData.password || !formData.confirmPassword || !formData.mobile.trim() || !formData.apartment_name.trim() || !formData.address.trim() || !formData.city.trim() || !formData.state.trim() || !formData.total_units || !formData.parking_slots) {
      setError('Please fill in all required fields.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!formData.authorized) {
      setError('You must confirm that you are authorized to manage this property.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/admin-auth/signup/apartment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess('Signup request submitted successfully! Your account will be active once approved by the Super Admin.');
        setTimeout(() => {
          navigate('/admin/login');
        }, 5000);
      } else {
        setError(data.error || 'Registration failed. Please check the values and try again.');
      }
    } catch (err) {
      setError('Connection to backend failed. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-slate-100 flex flex-col justify-center py-6 sm:py-12 relative overflow-hidden">
      
      {/* Decorative Gradients */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-2xl mx-auto px-4">
        
        {/* Back Link */}
        <Link to="/admin/login" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Admin Login
        </Link>

        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl mb-4 shadow-inner">
            <Building className="w-10 h-10 text-indigo-400" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Apartment Community Onboarding
          </h2>
          <p className="text-slate-400 text-sm mt-2 font-medium max-w-md mx-auto">
            Onboard your residential society or commercial complex into the UnblockMe smart parking sticker network.
          </p>
        </div>

        {/* Card Form Wrapper */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-[2rem] p-6 sm:p-10 shadow-2xl">
          
          {error && (
            <div className="bg-rose-950/40 border border-rose-900/30 text-rose-450 p-4 rounded-2xl text-xs font-bold mb-6 flex items-center gap-2.5 animate-pulse">
              <span className="w-2 h-2 bg-rose-500 rounded-full animate-ping"></span>
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-950/40 border border-green-900/30 text-green-400 p-4 rounded-2xl text-xs font-bold mb-6 flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span>{success}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-wider">Redirecting to login...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Section 1: Admin Details */}
            <div className="space-y-5">
              <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest border-b border-slate-800 pb-2 flex items-center gap-2">
                <User className="w-4 h-4" /> 1. Administrator Account Details
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-450 mb-1.5">Full Name <span className="text-rose-550">*</span></label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950/80 outline-none focus:border-indigo-500 font-semibold text-white placeholder-slate-600 text-sm transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-450 mb-1.5">Corporate Email Address <span className="text-rose-550">*</span></label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="e.g. admin@prestige.com"
                    className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950/80 outline-none focus:border-indigo-500 font-semibold text-white placeholder-slate-600 text-sm transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-450 mb-1.5">Mobile Number <span className="text-rose-550">*</span></label>
                  <input
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    placeholder="e.g. +91 9876543210"
                    className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950/80 outline-none focus:border-indigo-500 font-semibold text-white placeholder-slate-600 text-sm transition"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-450 mb-1.5">Password <span className="text-rose-550">*</span></label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950/80 outline-none focus:border-indigo-500 font-semibold text-white placeholder-slate-600 text-sm transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-450 mb-1.5">Confirm Password <span className="text-rose-550">*</span></label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950/80 outline-none focus:border-indigo-500 font-semibold text-white placeholder-slate-600 text-sm transition"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Community Details */}
            <div className="space-y-5">
              <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest border-b border-slate-800 pb-2 flex items-center gap-2">
                <Building className="w-4 h-4" /> 2. Community & Property Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-450 mb-1.5">Apartment / Community Name <span className="text-rose-550">*</span></label>
                  <input
                    type="text"
                    name="apartment_name"
                    value={formData.apartment_name}
                    onChange={handleChange}
                    placeholder="e.g. Prestige Lakeside"
                    className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950/80 outline-none focus:border-indigo-500 font-semibold text-white placeholder-slate-600 text-sm transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-450 mb-1.5">Community Type <span className="text-rose-550">*</span></label>
                  <select
                    name="community_type"
                    value={formData.community_type}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 outline-none focus:border-indigo-500 font-semibold text-sm transition cursor-pointer"
                    required
                  >
                    <option value="Apartment">🏢 Apartment</option>
                    <option value="Gated Community">🏘️ Gated Community</option>
                    <option value="Villa Community">🏡 Villa Community</option>
                    <option value="Commercial Complex">🏢 Commercial Complex</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-450 mb-1.5">Address <span className="text-rose-550">*</span></label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="e.g. OMR Road, Near OMR Toll gate"
                  className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950/80 outline-none focus:border-indigo-500 font-semibold text-white placeholder-slate-600 text-sm transition"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-450 mb-1.5">City <span className="text-rose-550">*</span></label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="e.g. Chennai"
                    className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950/80 outline-none focus:border-indigo-500 font-semibold text-white placeholder-slate-600 text-sm transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-450 mb-1.5">State <span className="text-rose-550">*</span></label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="e.g. Tamil Nadu"
                    className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950/80 outline-none focus:border-indigo-500 font-semibold text-white placeholder-slate-600 text-sm transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-450 mb-1.5">Pincode <span className="text-rose-550">*</span></label>
                  <input
                    type="text"
                    name="pincode"
                    onChange={handleChange}
                    placeholder="e.g. 600097"
                    className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950/80 outline-none focus:border-indigo-500 font-semibold text-white placeholder-slate-600 text-sm transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-450 mb-1.5">Number of Units / Flats <span className="text-rose-550">*</span></label>
                  <input
                    type="number"
                    name="total_units"
                    value={formData.total_units}
                    onChange={handleChange}
                    placeholder="e.g. 240"
                    className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950/80 outline-none focus:border-indigo-500 font-semibold text-white placeholder-slate-600 text-sm transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-450 mb-1.5">Number of Parking Slots <span className="text-rose-550">*</span></label>
                  <input
                    type="number"
                    name="parking_slots"
                    value={formData.parking_slots}
                    onChange={handleChange}
                    placeholder="e.g. 350"
                    className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950/80 outline-none focus:border-indigo-500 font-semibold text-white placeholder-slate-600 text-sm transition"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Optional Info */}
            <div className="space-y-5">
              <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest border-b border-slate-800 pb-2 flex items-center gap-2">
                <Globe className="w-4 h-4" /> 3. Secondary Info (Optional)
              </h3>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-450 mb-1.5">Website Address</label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="e.g. https://www.prestigeheights.com"
                    className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950/80 outline-none focus:border-indigo-500 font-semibold text-white placeholder-slate-600 text-sm transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-450 mb-1.5">Special Instructions / Operational Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Provide any details about vehicle access rules, gate layouts, etc."
                    className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950/80 outline-none focus:border-indigo-500 font-semibold text-white placeholder-slate-600 text-sm transition h-24 resize-none"
                  ></textarea>
                </div>
              </div>
            </div>

            {/* Authorize Checkbox */}
            <div className="p-4 bg-indigo-950/20 border border-indigo-900/30 rounded-2xl flex items-start gap-3">
              <input
                type="checkbox"
                name="authorized"
                id="authorized"
                checked={formData.authorized}
                onChange={handleChange}
                className="mt-1 w-4 h-4 rounded text-indigo-650 bg-slate-950 border-slate-850 cursor-pointer"
                required
              />
              <label htmlFor="authorized" className="text-xs font-bold text-slate-350 leading-relaxed cursor-pointer select-none">
                I confirm that I am authorized to represent and register this residential/commercial property for operational integration.
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || success}
              className="w-full py-4 rounded-2xl bg-indigo-650 hover:bg-indigo-700 disabled:opacity-50 text-white font-black text-sm uppercase tracking-wider transition-all shadow-xl shadow-indigo-600/10 hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>Loading...</>
              ) : success ? (
                <><Check className="w-5 h-5" /> Submitted Successfully</>
              ) : (
                <>Submit Onboarding Request</>
              )}
            </button>

          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-slate-500 text-xs">
          Secure private operations onboarding portal • Powered by UnblockMe Operations Center
        </div>

      </div>
    </div>
  );
}
