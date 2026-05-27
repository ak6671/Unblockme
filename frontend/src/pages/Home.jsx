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
          initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex-1 relative w-full max-w-lg lg:max-w-none flex justify-center"
        >
          {/* Mockup of sticker floating */}
          <div className="relative w-full max-w-md aspect-video bg-gray-900 rounded-[2rem] shadow-2xl p-6 transform rotate-2 hover:rotate-0 transition-transform duration-500 flex flex-col justify-between overflow-hidden">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#FF6B00] rounded-full blur-[100px] opacity-20"></div>
            
            <div className="flex justify-between items-start z-10">
              <div className="text-white">
                <span className="text-2xl font-black italic">Unblock<span className="text-[#FF6B00]">Me</span></span>
                <p className="text-[#FF6B00] text-xs font-bold tracking-widest mt-1">YOUR VEHICLE CODE</p>
                <div className="bg-white/10 px-3 py-1 rounded border border-white/20 mt-1 inline-block">
                  <span className="text-2xl font-mono font-black tracking-widest">UB<span className="text-[#FF6B00]">1234</span></span>
                </div>
              </div>
              <div className="bg-white p-2 rounded-xl">
                <QrCode className="w-16 h-16 text-gray-900" />
              </div>
            </div>

            <div className="z-10 mt-8 flex justify-between items-end border-t border-white/10 pt-4">
              <div className="flex items-center gap-2 text-white/80">
                <CarFront className="w-6 h-6" />
                <span className="text-sm font-medium">Scan to Contact Owner</span>
              </div>
              <div className="flex gap-2">
                <div className="bg-[#FF6B00] w-8 h-8 rounded flex items-center justify-center"><SmartphoneNfc className="w-4 h-4 text-white"/></div>
                <div className="bg-[#FF6B00] w-8 h-8 rounded flex items-center justify-center"><ScanLine className="w-4 h-4 text-white"/></div>
              </div>
            </div>
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
