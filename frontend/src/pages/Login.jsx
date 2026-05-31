import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPhoneNumber, RecaptchaVerifier } from 'firebase/auth';
import { auth } from '../firebase';
import { API_URL } from '../config';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Smartphone, KeyRound } from 'lucide-react';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1 = phone, 2 = otp
  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const [confirmationResult, setConfirmationResult] = useState(null);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const verifierRef = useRef(null);

  const isLoggedIn = !!localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  const userObj = userStr ? JSON.parse(userStr) : null;

  useEffect(() => {
    if (import.meta.env.DEV) {
      auth.settings.appVerificationDisabledForTesting = true;
    }
    if (verifierRef.current) {
      verifierRef.current.clear();
    }
    verifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
      callback: () => {},
      'expired-callback': () => {
        setError('reCAPTCHA expired. Please try again.');
      }
    });
    verifierRef.current.render();
    return () => {
      if (verifierRef.current) {
        verifierRef.current.clear();
        verifierRef.current = null;
      }
    };
  }, []);

  const requestOTP = async (e) => {
    e.preventDefault();
    setError('');
    if (mode === 'signup' && (!name || name.trim().length < 2)) return setError('Please provide a valid full name');
    if (!phone || phone.length < 10) return setError('Invalid phone number');

    try {
      setLoading(true);

      const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;

      const verifier = verifierRef.current;
      const result = await signInWithPhoneNumber(auth, formattedPhone, verifier);
      setConfirmationResult(result);

      setStep(2);
    } catch (err) {
      console.error('Firebase OTP Error:', err);
      let errorMsg = 'Failed to send OTP. Please try again.';

      if (err.code === 'auth/invalid-phone-number') {
        errorMsg = 'Invalid phone number. Please check and try again.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMsg = 'Too many attempts. Please try again later.';
      } else if (err.code === 'auth/captcha-check-failed') {
        errorMsg = 'reCAPTCHA verification failed. Please refresh and try again.';
        if (verifierRef.current) {
          verifierRef.current.clear();
          verifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
            size: 'invisible',
            callback: () => {},
            'expired-callback': () => {
              setError('reCAPTCHA expired. Please try again.');
            }
          });
          verifierRef.current.render();
        }
      }

      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (e) => {
    e.preventDefault();
    setError('');

    if (!confirmationResult) {
      setError('Session expired. Please request a new OTP.');
      setStep(1);
      return;
    }

    try {
      setLoading(true);

      // Verify OTP with Firebase
      const userCredential = await confirmationResult.confirm(otp);
      const firebaseToken = await userCredential.user.getIdToken();

      // Send token to backend to create/session user
      const res = await fetch(`${API_URL}/auth/verify-firebase-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firebaseToken,
          phone,
          name: mode === 'signup' ? name : undefined
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      if (data.user && data.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError('');
    setOtp('');
    setStep(1);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
  };

  return (
    <div className="flex items-center justify-center flex-1 w-full py-12 px-4 relative overflow-hidden">

      {/* Decorative Background Blur */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-400 rounded-full blur-[120px] opacity-20 pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#FF6B00] rounded-full blur-[120px] opacity-10 pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", damping: 25, stiffness: 120 }}
        className="bg-white/80 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-white max-w-md w-full relative z-10"
      >
        <div id="recaptcha-container"></div>

        <div className="flex justify-center mb-6">
          <div className="bg-brand-50 p-4 rounded-2xl shadow-inner">
            <ShieldCheck className="w-10 h-10 text-brand-600" />
          </div>
        </div>

        <h2 className="text-3xl font-black text-gray-900 mb-2 text-center tracking-tight">
          {mode === 'login' ? 'Owner Login' : 'Create Account'}
        </h2>
        <p className="text-gray-500 text-center font-medium mb-6">
          {mode === 'login' ? 'Secure access to your vehicles' : 'Join UnblockMe today'}
        </p>

        {step === 1 && !isLoggedIn && (
          <div className="flex bg-gray-100 p-1 rounded-xl mb-8 relative">
            <button
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all z-10 ${mode === 'login' ? 'text-brand-700' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Login
            </button>
            <button
              onClick={() => { setMode('signup'); setError(''); }}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all z-10 ${mode === 'signup' ? 'text-brand-700' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Sign Up
            </button>
            <div
              className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-lg shadow-sm transition-all duration-300 ${mode === 'login' ? 'left-1' : 'left-[calc(50%+2px)]'}`}
            ></div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 text-sm font-bold border border-red-100 flex items-center gap-3"
            >
              <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse flex-shrink-0"></div> {error}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {isLoggedIn ? (
            <motion.div
              key="loggedin"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="bg-green-50 text-green-700 py-3 px-4 rounded-xl border border-green-200 mb-6 font-bold flex items-center justify-center gap-2">
                <ShieldCheck className="w-5 h-5" /> Active Session Found
              </div>
              <p className="text-gray-600 mb-6 font-medium">You are already securely logged in {userObj?.phone ? `as: ${userObj.phone}` : ''}</p>
              <div className="space-y-4">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full bg-brand-600 text-white font-black py-4 rounded-2xl hover:bg-brand-700 transition-[background,transform] hover:-translate-y-1 shadow-[0_10px_20px_-10px_rgba(37,99,235,0.6)]"
                >
                  Go to Dashboard
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full bg-white text-gray-700 border-2 border-gray-200 font-bold py-4 rounded-2xl hover:bg-gray-50 hover:border-gray-300 transition-colors"
                >
                  Login with a different number
                </button>
              </div>
            </motion.div>
          ) : step === 1 ? (
            <motion.form
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              onSubmit={requestOTP}
              className="space-y-6"
            >
              <div className="space-y-4">
                <AnimatePresence>
                  {mode === 'signup' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
                      animate={{ opacity: 1, height: 'auto', overflow: 'visible' }}
                      exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                    >
                      <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-gray-400" /> Full Name
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. John Doe"
                        className="w-full px-5 py-4 rounded-2xl border-2 border-gray-200 focus:ring-4 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all font-bold text-gray-900 text-lg tracking-wide bg-gray-50/50 mb-4"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-gray-400" /> Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setPhone(val);
                    }}
                    pattern="[0-9]{10}"
                    maxLength={10}
                    placeholder="e.g. 9876543210"
                    className="w-full px-5 py-4 rounded-2xl border-2 border-gray-200 focus:ring-4 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all font-bold text-gray-900 text-lg tracking-wide bg-gray-50/50"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-600 text-white font-black py-4 rounded-2xl hover:bg-brand-700 transition-[background,transform] hover:-translate-y-1 shadow-[0_10px_20px_-10px_rgba(37,99,235,0.6)] disabled:opacity-50 disabled:transform-none mt-2 flex justify-center items-center gap-2 text-lg"
              >
                {loading ? <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : 'Send Secure OTP'}
              </button>
            </motion.form>
          ) : (
            <motion.form
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              onSubmit={verifyOTP}
              className="space-y-6"
            >
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide flex justify-between">
                  <span className="flex items-center gap-2"><KeyRound className="w-4 h-4 text-gray-400"/> Enter OTP</span>
                  <span className="text-brand-600 normal-case tracking-normal">Sent to {phone.slice(0, 2)}••••{phone.slice(-4)}</span>
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtp(val);
                  }}
                  placeholder="••••••"
                  maxLength={6}
                  pattern="[0-9]{6}"
                  className="w-full px-5 py-4 rounded-2xl border-2 border-gray-200 focus:ring-4 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all text-center tracking-[1em] text-3xl font-black bg-gray-50/50 text-gray-900"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-600 text-white font-black py-4 rounded-2xl hover:bg-brand-700 transition-[background,transform] hover:-translate-y-1 shadow-[0_10px_20px_-10px_rgba(37,99,235,0.6)] disabled:opacity-50 disabled:transform-none text-lg flex justify-center items-center gap-2"
              >
                {loading ? <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : 'Verify & Access'}
              </button>

              <div className="text-center pt-2 space-y-2">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={loading}
                  className="text-sm text-brand-600 hover:text-brand-700 font-bold transition-colors disabled:opacity-50"
                >
                  Didn't receive? Resend OTP
                </button>
                <button
                  type="button"
                  onClick={() => { setStep(1); setOtp(''); setError(''); setConfirmationResult(null); }}
                  className="block mx-auto text-sm text-gray-400 hover:text-gray-800 font-bold transition-colors"
                >
                  Entered wrong number? Go back
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}