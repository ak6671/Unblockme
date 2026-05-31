import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, BellRing, QrCode, ArrowRight, ScanLine, SmartphoneNfc, MessageSquare, CarFront } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  const [searchCode, setSearchCode] = useState('');
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('token');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchCode.trim()) {
      navigate(`/v/${searchCode.trim().toUpperCase()}`);
    }
  };

  return (
    <div className="flex flex-col items-center w-full">
      {/* Hero Section */}
      <section className="w-full flex flex-col lg:flex-row items-center justify-between py-12 md:py-20 lg:py-24 gap-12 px-4">
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex-1 space-y-8 max-w-2xl text-center lg:text-left mx-auto lg:mx-0"
        >
          <div className="inline-flex items-center gap-2 bg-[#FF6B00]/10 text-[#FF6B00] px-4 py-2 rounded-full font-bold text-sm tracking-wide">
            <span className="w-2 h-2 rounded-full bg-[#FF6B00] animate-pulse"></span>
            THE SMART PARKING SOLUTION
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-gray-900 tracking-tight leading-[1.1]">
            Protect your privacy.<br />
            <span className="text-[#FF6B00] italic">Stay connected.</span>
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed font-medium">
            The smartest way for others to notify you about your parked vehicle—without ever revealing your phone number to strangers.
          </p>

          <div className="pt-4 space-y-6">
            {/* Quick Report Section */}
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto lg:mx-0 bg-white p-2 rounded-2xl shadow-[0_8px_30px_-5px_rgba(0,0,0,0.08)] border border-gray-100">
              <div className="flex-1 flex items-center gap-3 px-4">
                <CarFront className="w-5 h-5 text-gray-400" />
                <input 
                  type="text" 
                  value={searchCode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase();
                    setSearchCode(val);
                  }}
                  placeholder="Enter 6-digit Code" 
                  className="w-full py-3 outline-none text-gray-900 font-bold placeholder-gray-400 uppercase tracking-widest text-lg placeholder:tracking-normal placeholder:normal-case placeholder:text-base"
                />
              </div>
              <button 
                type="submit" 
                disabled={!searchCode || searchCode.length < 3}
                className="bg-[#FF6B00] text-white px-8 py-3.5 rounded-xl font-bold hover:bg-[#e66000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center"
              >
                Report Vehicle
              </button>
            </form>

            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              {isLoggedIn ? (
                <Link to="/dashboard" className="bg-[#FF6B00] text-white px-5 py-3 rounded-xl font-bold text-sm hover:bg-[#e66000] transition-all flex items-center justify-center gap-1.5 shadow-sm hover:-translate-y-0.5">
                  Go to Dashboard <ArrowRight className="w-4 h-4"/>
                </Link>
              ) : (
                <Link to="/auth" className="bg-gray-900 text-white px-5 py-3 rounded-xl font-bold text-sm hover:bg-gray-800 transition-all flex items-center justify-center gap-1.5 shadow-sm hover:-translate-y-0.5">
                  Owner Login <ArrowRight className="w-4 h-4"/>
                </Link>
              )}
              <Link to="/admin/login" className="bg-white text-brand-600 border-2 border-brand-200 px-5 py-3 rounded-xl font-bold text-sm hover:border-brand-300 hover:bg-brand-50/50 transition-all flex items-center justify-center gap-1.5 shadow-sm hover:-translate-y-0.5">
                Partner Portal <ArrowRight className="w-4 h-4 text-brand-500" />
              </Link>
              <a href="#how-it-works" className="bg-white text-gray-850 border-2 border-gray-200 px-5 py-3 rounded-xl font-bold text-sm hover:border-gray-300 hover:bg-gray-55 transition-all flex items-center justify-center">
                Learn More
              </a>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex-1 relative w-full max-w-lg lg:max-w-none flex justify-center items-center"
        >
          {/* Ambient glow */}
          <div className="absolute w-96 h-96 bg-[#FF6B00] rounded-full blur-[150px] opacity-15 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>

          <div className="relative w-full max-w-md flex items-center gap-3">
            {/* Before - Sticky note on windshield */}
            <motion.div
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex-1 bg-white rounded-2xl shadow-lg border border-gray-200 p-3 overflow-hidden"
            >
              <div className="flex items-center gap-1.5 mb-2">
                <span className="w-2 h-2 rounded-full bg-red-400"></span>
                <span className="text-[10px] font-bold text-red-500 tracking-wide uppercase">Old Way</span>
              </div>

              {/* Windshield with sticky note */}
              <div className="relative mx-auto w-full aspect-[4/3] bg-gradient-to-b from-blue-200 via-blue-100 to-blue-50 rounded-[40%_40%_10%_10%/30%_30%_10%_10%] border-4 border-gray-700 shadow-inner overflow-hidden">
                {/* Glass reflection */}
                <div className="absolute top-0 left-0 w-1/3 h-full bg-gradient-to-r from-white/40 to-transparent skew-x-[-10deg] -translate-x-4"></div>
                <div className="absolute top-0 right-0 w-1/5 h-full bg-gradient-to-l from-white/30 to-transparent"></div>

                {/* Sticky note */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] bg-yellow-100 rotate-[-3deg] rounded-lg p-2.5 shadow-lg border border-yellow-300">
                  <p className="text-[10px] font-bold text-gray-700 mb-0.5">Sorry blocking!</p>
                  <p className="text-[13px] font-black text-gray-900">📞 98765 43210</p>
                  <div className="w-2 h-2 bg-red-500 rounded-full absolute -top-1 right-2"></div>
                </div>
              </div>

              <div className="mt-3 space-y-1.5">
                <div className="flex items-start gap-2">
                  <span className="text-red-400 text-xs mt-0.5">✕</span>
                  <p className="text-[11px] text-gray-500 font-medium">Phone number exposed to everyone</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-red-400 text-xs mt-0.5">✕</span>
                  <p className="text-[11px] text-gray-500 font-medium">Paper gets ruined by rain & wind</p>
                </div>
              </div>
            </motion.div>

            {/* VS */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, delay: 0.7, type: "spring" }}
              className="flex-shrink-0 z-10"
            >
              <div className="w-9 h-9 bg-gray-900 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white text-[11px] font-black">VS</span>
              </div>
            </motion.div>

            {/* After - UnblockMe sticker on windshield */}
            <motion.div
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="flex-1 bg-gradient-to-b from-[#FF6B00]/5 to-transparent rounded-2xl shadow-lg border border-[#FF6B00]/20 p-3 overflow-hidden ring-2 ring-[#FF6B00]/30"
            >
              <div className="flex items-center gap-1.5 mb-2">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                <span className="text-[10px] font-bold text-green-600 tracking-wide uppercase">UnblockMe Way</span>
              </div>

              {/* Windshield with UnblockMe sticker */}
              <div className="relative mx-auto w-full aspect-[4/3] bg-gradient-to-b from-blue-200 via-blue-100 to-blue-50 rounded-[40%_40%_10%_10%/30%_30%_10%_10%] border-4 border-gray-700 shadow-inner overflow-hidden">
                {/* Glass reflection */}
                <div className="absolute top-0 left-0 w-1/3 h-full bg-gradient-to-r from-white/40 to-transparent skew-x-[-10deg] -translate-x-4"></div>
                <div className="absolute top-0 right-0 w-1/5 h-full bg-gradient-to-l from-white/30 to-transparent"></div>

                {/* UnblockMe sticker */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] bg-white rounded-lg p-2.5 shadow-lg border border-[#FF6B00]/30">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-black italic text-gray-900">Unblock<span className="text-[#FF6B00]">Me</span></span>
                    <div className="bg-gray-900 p-1 rounded">
                      <QrCode className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="bg-gray-50 border border-gray-100 rounded px-2 py-0.5 inline-block">
                    <span className="text-[11px] font-mono font-black tracking-widest text-gray-900">UB<span className="text-[#FF6B00]">1234</span></span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <SmartphoneNfc className="w-3 h-3 text-[#FF6B00]" />
                    <ScanLine className="w-3 h-3 text-[#FF6B00]" />
                    <span className="text-[8px] text-gray-400 font-medium">Scan or Tap</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 space-y-1.5">
                <div className="flex items-start gap-2">
                  <span className="text-green-500 text-xs mt-0.5">✓</span>
                  <p className="text-[11px] text-gray-600 font-medium">Phone number stays hidden</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-500 text-xs mt-0.5">✓</span>
                  <p className="text-[11px] text-gray-600 font-medium">Weather-proof permanent sticker</p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="w-full py-20 border-t border-gray-100 bg-gray-50/50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4">3 Easy Ways to Connect</h2>
            <p className="text-gray-500 text-lg font-medium max-w-2xl mx-auto">No apps to download. Anyone can reach you instantly using the method they prefer.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <StepCard 
              number="1"
              icon={<ScanLine className="w-10 h-10 text-[#FF6B00]" />}
              title="Scan QR"
              description="Simply point any smartphone camera at the sticker to instantly open the secure contact page."
            />
            <StepCard 
              number="2"
              icon={<SmartphoneNfc className="w-10 h-10 text-[#FF6B00]" />}
              title="Tap (NFC)"
              description="Tap an NFC-enabled phone against the sticker for immediate access without opening the camera."
            />
            <StepCard 
              number="3"
              icon={<BellRing className="w-10 h-10 text-[#FF6B00]" />}
              title="Call IVR"
              description="Call our dedicated line and enter the vehicle code to be securely routed to the owner."
            />
          </div>
        </div>
      </section>

      {/* How the Sticker Works - Animated Flow */}
      <section id="how-sticker-works" className="w-full py-20 bg-white border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4">How the Sticker Works</h2>
            <p className="text-gray-500 text-lg font-medium max-w-2xl mx-auto">A simple sticker on your windshield replaces paper notes forever.</p>
          </div>

          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            {/* Step 1 - Park & Display */}
            <AnimatedStep
              step="1"
              delay={0}
              icon={
                <svg viewBox="0 0 80 50" className="w-16 h-auto">
                  <path d="M10 30 Q15 15 40 14 Q65 15 70 30 L75 30 L75 36 L5 36 L5 30 Z" fill="#334155" />
                  <path d="M14 31 Q25 22 40 21 Q55 22 66 31 L64 38 L16 38 Z" fill="#bfdbfe" opacity="0.8" />
                  <rect x="4" y="36" width="72" height="10" rx="3" fill="#1e293b" />
                  <rect x="65" y="33" width="8" height="3" rx="1" fill="#fef08a" />
                  <rect x="7" y="33" width="8" height="3" rx="1" fill="#fef08a" />
                </svg>
              }
              title="Park & Display"
              description="Place the UnblockMe sticker on your windshield. It stays there permanently — weather-proof and always ready."
            />

            {/* Animated connecting arrow */}
            <AnimatedConnector delay={0.4} />

            {/* Step 2 - Someone Scans */}
            <AnimatedStep
              step="2"
              delay={0.4}
              icon={
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <svg viewBox="0 0 56 56" className="w-16 h-auto">
                    <rect x="8" y="4" width="40" height="48" rx="6" fill="#1e293b" />
                    <rect x="12" y="8" width="32" height="36" rx="2" fill="white" />
                    <rect x="20" y="21" width="16" height="16" rx="1" stroke="#FF6B00" strokeWidth="2" fill="none" />
                    <line x1="20" y1="21" x2="36" y2="37" stroke="#FF6B00" strokeWidth="1" opacity="0.6" />
                    <line x1="36" y1="21" x2="20" y2="37" stroke="#FF6B00" strokeWidth="1" opacity="0.6" />
                    <motion.rect
                      x="20" y="21" width="16" height="1" fill="#FF6B00"
                      animate={{ y: [21, 36, 21] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </svg>
                </motion.div>
              }
              title="Someone Scans"
              description="Anyone parks next to you? They scan the QR code, tap NFC, or call — no app needed, instant access."
            />

            {/* Animated connecting arrow */}
            <AnimatedConnector delay={0.8} />

            {/* Step 3 - You Get Alerted */}
            <AnimatedStep
              step="3"
              delay={0.8}
              icon={
                <motion.div className="relative">
                  <svg viewBox="0 0 56 56" className="w-16 h-auto">
                    <rect x="8" y="4" width="40" height="48" rx="6" fill="#1e293b" />
                    <rect x="12" y="8" width="32" height="36" rx="2" fill="white" />
                    <circle cx="28" cy="22" r="4" fill="#FF6B00" />
                    <rect x="14" y="32" width="28" height="10" rx="2" fill="#f1f5f9" stroke="#e2e8f0" />
                    <text x="28" y="39" textAnchor="middle" fontSize="6" fontWeight="bold" fill="#334155">Blocking</text>
                  </svg>
                  <motion.div
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <span className="text-white text-[8px] font-black">!</span>
                  </motion.div>
                </motion.div>
              }
              title="You Get Alerted"
              description="Instant SMS or call notifies you. Your phone number stays completely hidden — always private."
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h2 className="text-4xl font-black text-gray-900">Why UnblockMe?</h2>
              
              <div className="space-y-6">
                <FeatureItem 
                  icon={<Shield className="w-6 h-6 text-brand-600" />}
                  title="100% Private"
                  description="Your personal phone number is completely hidden. All messages and calls are routed securely through our system."
                />
                <FeatureItem 
                  icon={<MessageSquare className="w-6 h-6 text-brand-600" />}
                  title="Pre-filled Messages"
                  description="Senders can choose from quick options like 'Blocking my way' or 'Wrong parking' with a single tap."
                />
                <FeatureItem 
                  icon={<BellRing className="w-6 h-6 text-brand-600" />}
                  title="Instant Alerts"
                  description="Receive immediate SMS or WhatsApp warnings when someone tries to contact you about your vehicle."
                />
              </div>
            </div>
            
            <div className="bg-gray-100 p-8 rounded-[2.5rem] relative overflow-hidden">
               <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-[#FF6B00]/10 to-transparent"></div>
               {/* Decorative Abstract */}
               <div className="relative z-10 bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                  <div className="flex items-center gap-4 border-b border-gray-100 pb-4 mb-4">
                     <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                        <BellRing className="w-6 h-6" />
                     </div>
                     <div>
                        <h4 className="font-bold text-gray-900">Emergency Alert!</h4>
                        <p className="text-sm text-gray-500">Just now</p>
                     </div>
                  </div>
                  <p className="font-medium text-gray-800">Alert from UnblockMe: Someone reported that your vehicle is blocking their way.</p>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="w-full py-20 bg-gray-900 text-white text-center rounded-[3rem] my-12 max-w-5xl mx-auto px-4 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#FF6B00] via-brand-500 to-[#FF6B00]"></div>
        <h2 className="text-4xl md:text-5xl font-black mb-6">Ready to upgrade your parking?</h2>
        <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto font-medium">Join thousands of smart vehicle owners helping build better parking etiquette.</p>
        <Link to={isLoggedIn ? "/dashboard" : "/auth"} className="inline-block bg-[#FF6B00] text-white px-10 py-5 rounded-2xl font-black text-xl hover:bg-[#e66000] hover:scale-105 transition-all shadow-[0_10px_30px_-10px_rgba(255,107,0,0.6)]">
          {isLoggedIn ? "Go to Dashboard" : "Get Started Now"}
        </Link>
      </section>
    </div>
  );
}

function StepCard({ number, icon, title, description }) {
  return (
    <motion.div whileHover={{ y: -8 }} className="bg-white p-8 rounded-3xl shadow-[0_4px_25px_-5px_rgba(0,0,0,0.05)] border border-gray-100 flex flex-col items-center text-center relative">
      <div className="absolute -top-5 -left-5 w-12 h-12 bg-gray-900 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg transform -rotate-12">
        {number}
      </div>
      <div className="bg-[#FF6B00]/10 p-5 rounded-full mb-6">
        {icon}
      </div>
      <h3 className="text-2xl font-black text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-500 font-medium leading-relaxed">{description}</p>
    </motion.div>
  );
}

function FeatureItem({ icon, title, description }) {
  return (
    <div className="flex items-start gap-5">
      <div className="bg-brand-50 p-4 rounded-2xl flex-shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-2 mt-1">{title}</h3>
        <p className="text-gray-600 font-medium leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function AnimatedStep({ step, delay, icon, title, description }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay }}
      className="flex flex-col items-center text-center max-w-xs"
    >
      <div className="relative mb-5">
        <div className="absolute inset-0 bg-[#FF6B00]/10 rounded-full blur-xl scale-125"></div>
        <div className="relative bg-white border border-gray-100 p-5 rounded-2xl shadow-lg">
          {icon}
        </div>
      </div>
      <h3 className="text-xl font-black text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 font-medium leading-relaxed text-sm">{description}</p>
    </motion.div>
  );
}

function AnimatedConnector({ delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, scaleX: 0 }}
      whileInView={{ opacity: 1, scaleX: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.4, delay }}
      className="hidden lg:block flex-shrink-0"
    >
      <div className="flex items-center w-16">
        <div className="flex-1 h-0.5 bg-[#FF6B00]/30 relative">
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 right-0 w-2 h-2 bg-[#FF6B00] rounded-full"
            animate={{ x: [0, 64, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay }}
          />
        </div>
        <ArrowRight className="w-4 h-4 text-[#FF6B00]" />
      </div>
    </motion.div>
  );
}
