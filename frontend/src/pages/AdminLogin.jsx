import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, AlertTriangle, Eye, EyeOff, Building, Truck } from 'lucide-react';
import { API_URL } from '../config';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [onboardType, setOnboardType] = useState('apartment');

  // Password reset states
  const [mustReset, setMustReset] = useState(false);
  const [resetEmailOrUsername, setResetEmailOrUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const navigate = useNavigate();

  // If already logged in, redirect straight to dashboard
  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
    if (adminToken) {
      if (adminUser.role === 'MODERATOR') {
        navigate('/moderator/dashboard');
      } else {
        navigate('/admin/dashboard');
      }
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/admin-auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Access Denied: Invalid credentials.');
      }

      if (data.admin.must_reset_password) {
        setResetEmailOrUsername(email);
        setCurrentPassword(password);
        setMustReset(true);
        setLoading(false);
        return;
      }

      // Isolate admin states from standard owner localstorage tokens
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('adminUser', JSON.stringify(data.admin));

      if (data.admin.role === 'MODERATOR') {
        navigate('/moderator/dashboard');
      } else {
        navigate('/admin/dashboard');
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');
    setResetLoading(true);

    try {
      const res = await fetch(`${API_URL}/admin-auth/reset-temp-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailOrUsername: resetEmailOrUsername,
          currentPassword,
          newPassword,
          confirmPassword
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Password reset failed.');
      }
      
      setResetSuccess('Password updated! Auto-authenticating...');

      // Auto login
      const loginRes = await fetch(`${API_URL}/admin-auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmailOrUsername, password: newPassword })
      });
      const loginData = await loginRes.json();
      if (!loginRes.ok) {
        throw new Error(loginData.error || 'Auto login failed.');
      }

      localStorage.setItem('adminToken', loginData.token);
      localStorage.setItem('adminUser', JSON.stringify(loginData.admin));

      if (loginData.admin.role === 'MODERATOR') {
        navigate('/moderator/dashboard');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (err) {
      setResetError(err.message);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 justify-center items-center py-12 px-4 w-full relative min-h-[calc(100vh-14rem)]">
      {/* Background Abstract Gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/5 rounded-full blur-[100px] pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-slate-900/60 backdrop-blur-md border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl relative z-10"
      >
        <div className="text-center mb-8">
          <div className="bg-indigo-500/15 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-500/20 shadow-inner">
            <ShieldCheck className="w-9 h-9 text-indigo-400" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight uppercase">
            {mustReset ? 'Reset Temp Password' : 'Secure Admin Access'}
          </h2>
          <p className="text-slate-400 text-xs mt-1 uppercase tracking-widest font-black">
            {mustReset ? 'Password Update Required' : 'Authorized Personnel Only'}
          </p>
        </div>

        {error && !mustReset && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }} 
            animate={{ opacity: 1, x: 0 }}
            className="bg-red-950/40 text-red-400 p-4 rounded-xl mb-6 text-sm font-bold flex items-center gap-3 border border-red-900/30"
          >
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        {resetError && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }} 
            animate={{ opacity: 1, x: 0 }}
            className="bg-red-950/40 text-red-400 p-4 rounded-xl mb-6 text-sm font-bold flex items-center gap-3 border border-red-900/30"
          >
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>{resetError}</span>
          </motion.div>
        )}

        {resetSuccess && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }} 
            animate={{ opacity: 1, x: 0 }}
            className="bg-emerald-950/40 text-emerald-400 p-4 rounded-xl mb-6 text-sm font-bold flex items-center gap-3 border border-emerald-900/30"
          >
            <span>{resetSuccess}</span>
          </motion.div>
        )}

        {mustReset ? (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div>
              <label className="block text-xs font-black text-slate-300 mb-2 uppercase tracking-wider">New Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-5 h-5" />
                </span>
                <input 
                  type="password" 
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-5 py-4 rounded-2xl border-2 border-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/70 outline-none transition-all bg-slate-950/50 font-bold text-white placeholder-slate-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-300 mb-2 uppercase tracking-wider">Confirm New Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-5 h-5" />
                </span>
                <input 
                  type="password" 
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-5 py-4 rounded-2xl border-2 border-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/70 outline-none transition-all bg-slate-950/50 font-bold text-white placeholder-slate-600"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                type="button" 
                onClick={() => setMustReset(false)}
                className="w-1/3 bg-slate-850 text-slate-300 font-bold text-sm py-4 rounded-2xl hover:bg-slate-800 transition outline-none cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={resetLoading}
                className="flex-1 bg-indigo-600 text-white font-black text-md py-4 rounded-2xl hover:bg-indigo-700 transition-[background,transform] hover:-translate-y-0.5 shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:transform-none flex justify-center items-center gap-2 cursor-pointer"
              >
                {resetLoading ? (
                  <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  'Update & Sign In'
                )}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-black text-slate-300 mb-2 uppercase tracking-wider">Corporate Email or Username</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-5 h-5" />
                </span>
                <input 
                  type="text" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@unblockme.com or username"
                  className="w-full pl-11 pr-5 py-4 rounded-2xl border-2 border-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/70 outline-none transition-all bg-slate-950/50 font-bold text-white placeholder-slate-600"
                />
              </div>
            </div>

          <div>
            <label className="block text-xs font-black text-slate-300 mb-2 uppercase tracking-wider">Access Token / Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-5 h-5" />
              </span>
              <input 
                type={showPassword ? "text" : "password"} 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-11 pr-12 py-4 rounded-2xl border-2 border-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/70 outline-none transition-all bg-slate-950/50 font-bold text-white placeholder-slate-600"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-indigo-600 text-white font-black text-lg py-4 rounded-2xl hover:bg-indigo-700 transition-[background,transform] hover:-translate-y-0.5 shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:transform-none mt-8 flex justify-center items-center gap-2 cursor-pointer"
          >
            {loading ? (
              <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              'Verify & Access Portal'
            )}
          </button>
        </form>
      )}

        <div className="mt-8 text-center border-t border-slate-800 pt-6">
          <p className="text-[10px] text-slate-650 font-bold uppercase tracking-widest leading-relaxed">
            All attempts to access this area are logged and monitored.<br />
            Security Shield Active 🛡️
          </p>
        </div>
      </motion.div>

      {/* Onboarding Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="w-full max-w-md mt-6 relative z-10"
      >
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 p-6 sm:p-8 rounded-[2.5rem] shadow-2xl space-y-6 text-center">
          <div>
            <h3 className="text-xs font-black text-slate-350 uppercase tracking-widest">
              Partnership & Self-Onboarding
            </h3>
            <p className="text-[11px] text-slate-500 font-bold uppercase mt-1">
              Select your organization type to register
            </p>
          </div>

          {/* Toggle Switch */}
          <div className="flex bg-slate-950/80 p-1.5 rounded-2xl border border-slate-850 max-w-sm mx-auto relative overflow-hidden">
            {/* Animated background pill */}
            <motion.div
              className={`absolute top-1.5 bottom-1.5 rounded-xl z-0 ${
                onboardType === 'apartment' ? 'bg-indigo-600 shadow-[0_4px_12px_rgba(79,70,229,0.3)]' : 'bg-orange-600 shadow-[0_4px_12px_rgba(234,88,12,0.3)]'
              }`}
              animate={{
                left: onboardType === 'apartment' ? '6px' : '50%',
                width: 'calc(50% - 12px)'
              }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
            />

            <button
              type="button"
              onClick={() => setOnboardType('apartment')}
              className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer z-10 ${
                onboardType === 'apartment'
                  ? 'text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Building className="w-4 h-4" />
              Apartment
            </button>
            <button
              type="button"
              onClick={() => setOnboardType('fleet')}
              className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer z-10 ${
                onboardType === 'fleet'
                  ? 'text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Truck className="w-4 h-4" />
              Fleet Hub
            </button>
          </div>

          {/* Active Choice Details Card */}
          <div className="min-h-[185px] flex flex-col justify-between">
            <AnimatePresence mode="wait">
              {onboardType === 'apartment' ? (
                <motion.div
                  key="apartment-info"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-5 flex flex-col flex-1 justify-between"
                >
                  <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-850/80 text-left shadow-inner flex-1 flex items-center">
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">
                      Onboard your apartment association, housing society, or gated community. Residents will be able to order smart stickers and get notified securely when a vehicle blocks theirs.
                    </p>
                  </div>
                  <Link
                    to="/admin/signup/apartment"
                    className="block w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider py-4 rounded-xl shadow-lg hover:shadow-indigo-600/10 transition-all hover:-translate-y-0.5 cursor-pointer"
                  >
                    Onboard Apartment Community
                  </Link>
                </motion.div>
              ) : (
                <motion.div
                  key="fleet-info"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-5 flex flex-col flex-1 justify-between"
                >
                  <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-850/80 text-left shadow-inner flex-1 flex items-center">
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">
                      Register your logistics hub, commercial fleet, or distribution center. Manage vehicles, track active parking status, and enforce region-wide sticker parking policies.
                    </p>
                  </div>
                  <Link
                    to="/admin/signup/fleet"
                    className="block w-full text-center bg-orange-600 hover:bg-orange-700 text-white font-black text-xs uppercase tracking-wider py-4 rounded-xl shadow-lg hover:shadow-orange-600/10 transition-all hover:-translate-y-0.5 cursor-pointer"
                  >
                    Onboard Fleet/Logistics Hub
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
