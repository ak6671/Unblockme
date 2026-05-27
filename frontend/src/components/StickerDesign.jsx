import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Car, Phone, SmartphoneNfc, Lock, MessageSquare, ShieldCheck, Globe, ScanLine } from 'lucide-react';
import { APP_URL } from '../config';

export default function StickerDesign({ vehicleId, trialEndDate, isExpired }) {
  const publicUrl = `${APP_URL}/v/${vehicleId}`;

  return (
    <div className="relative w-full max-w-[800px] border-2 border-gray-800 rounded-3xl overflow-hidden bg-white text-gray-900 font-sans shadow-2xl mx-auto flex flex-col">
      {/* Top Banner / Logo Area */}
      <div className="flex justify-between items-start p-6 pb-2">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-5xl font-black italic tracking-tighter text-gray-900">Unblock</span>
            <span className="text-5xl font-black italic tracking-tighter text-[#FF6B00]">Me</span>
          </div>
          <span className="text-base font-bold italic text-[#FF6B00] mt-1 tracking-wide">
            Stuck? <span className="text-gray-900">Contact instantly.</span>
          </span>
        </div>
        <div className="flex flex-col items-end">
          <h2 className="text-xl font-black text-gray-900 tracking-wide mb-1">BLOCKING SOMEONE?</h2>
          <div className="bg-[#FF6B00] text-white px-4 py-1 rounded-full text-2xl font-black tracking-wider shadow-sm transform -skew-x-6">
            <div className="skew-x-6">LET US KNOW!</div>
          </div>
        </div>
      </div>

      <div className="px-6 py-2">
        <hr className="border-t-2 border-dashed border-gray-300" />
      </div>

      {/* Main Content Area */}
      <div className="flex px-6 py-4 gap-4 items-stretch justify-between">
        
        {/* Left: Car Graphics */}
        <div className="flex-1 flex items-center justify-center relative min-w-0">
          <div className="relative w-36 h-36 flex items-center justify-center mx-auto flex-shrink-0">
            {/* Outline rings mockup */}
            <div className="absolute inset-0 border-4 border-[#FF6B00] rounded-full border-t-transparent border-r-transparent transform rotate-45"></div>
            <div className="absolute inset-2 border-4 border-[#FF6B00]/30 rounded-full"></div>
            <Car className="w-20 h-20 text-gray-900 z-10" />
            <div className="absolute top-2 right-2 text-[#FF6B00]">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12.55a11 11 0 0 1 14.08 0" />
                <path d="M1.42 9a16 16 0 0 1 21.16 0" />
                <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                <line x1="12" y1="20" x2="12" y2="20" />
              </svg>
            </div>
            {/* Arrows mockup */}
            <div className="absolute bottom-0 right-0 transform rotate-180 text-[#FF6B00]">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12l-5.657 5.657-1.414-1.414L21.172 12l-4.243-4.243 1.414-1.414L24 12zM2.828 12l4.243 4.243-1.414 1.414L0 12l5.657-5.657L7.07 7.757 2.828 12z"/></svg>
            </div>
          </div>
        </div>
        {/* Center: QR and ID */}
        <div className="flex flex-col items-center justify-center gap-3 flex-shrink-0">
          <div className="border-4 border-gray-900 rounded-xl p-2 bg-white flex items-center justify-center">
            <QRCodeSVG value={publicUrl} size={110} />
          </div>
          {trialEndDate && (
            <div className="text-[9px] font-bold text-gray-500 tracking-wider text-center bg-gray-100 px-2 py-1 rounded-md">
              Valid until: {new Date(trialEndDate).toLocaleDateString()}
              <div className="text-[#FF6B00]">Free trial: 90 days</div>
            </div>
          )}
        </div>
        
        {/* Center-Right: Call to action details */}
        <div className="flex flex-col flex-1 justify-center gap-3 min-w-[180px]">
          <div className="text-center">
            <div className="text-xs font-bold tracking-wider text-gray-800">YOUR VEHICLE CODE</div>
            <div className="border-2 border-dashed border-[#FF6B00] rounded-xl px-2 py-1 mt-1">
              <span className="text-[#FF6B00] text-3xl font-black font-mono tracking-widest">{vehicleId.substring(0, 2)}</span>
              <span className="text-gray-900 text-3xl font-black font-mono tracking-widest">{vehicleId.substring(2)}</span>
            </div>
          </div>

          <div className="bg-gray-900 text-white rounded-xl p-2 flex items-center justify-center gap-2 mt-2 shadow-md">
            <Phone className="w-6 h-6 text-white fill-current flex-shrink-0" />
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-bold text-gray-300 leading-tight">CALL THIS NUMBER</span>
              <span className="text-lg font-black tracking-wide leading-tight">080 6926 1234</span>
            </div>
          </div>
        </div>

        {/* Right: 3 Easy Ways */}
        <div className="border border-gray-300 rounded-2xl w-56 flex-shrink-0 overflow-hidden flex flex-col bg-gray-50 shadow-sm">
          <div className="bg-gray-900 text-white text-center py-2 font-bold tracking-wide text-sm">
            3 EASY WAYS
          </div>
          <div className="p-3 space-y-3 flex-1 flex flex-col justify-around bg-white">
            <div className="flex items-center gap-2">
              <div className="bg-[#FF6B00] w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-white">
                <ScanLine className="w-6 h-6" />
              </div>
              <div className="flex flex-col text-xs">
                <span className="font-primary font-bold leading-tight text-sm">1. SCAN QR</span>
                <span className="text-gray-600 leading-tight">Scan & send msg.</span>
              </div>
            </div>
            <hr className="border-dashed border-gray-300" />
            <div className="flex items-center gap-2">
              <div className="bg-[#FF6B00] w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-white">
                <Phone className="w-5 h-5 fill-current" />
              </div>
              <div className="flex flex-col text-xs">
                <span className="font-primary font-bold leading-tight text-sm">2. CALL</span>
                <span className="text-gray-600 leading-tight">Call & enter ID.</span>
              </div>
            </div>
            <hr className="border-dashed border-gray-300" />
            <div className="flex items-center gap-2">
              <div className="bg-[#FF6B00] w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-white">
                <SmartphoneNfc className="w-5 h-5" />
              </div>
              <div className="flex flex-col text-xs">
                <span className="font-primary font-bold leading-tight text-sm">3. TAP (NFC)</span>
                <span className="text-gray-600 leading-tight">Tap phone on sticker.</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      <div className="px-6 py-2">
        <hr className="border-t border-gray-300" />
      </div>

      {/* Bottom Features Row */}
      <div className="flex items-center justify-between px-8 py-3 text-sm font-bold text-gray-800">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-gray-900" />
          <div className="leading-tight">NO PHONE<br/>NUMBERS SHARED</div>
        </div>
        <div className="w-px h-8 bg-gray-300"></div>
        <div className="flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-gray-900" />
          <div className="leading-tight">PRE-FILLED<br/>MESSAGES & PHOTOS</div>
        </div>
        <div className="w-px h-8 bg-gray-300"></div>
        <div className="flex items-center gap-2">
          <Lock className="w-6 h-6 text-gray-900 fill-current" />
          <div className="leading-tight">100% PRIVACY<br/>FOR EVERYONE</div>
        </div>
        <div className="w-px h-8 bg-gray-300"></div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-semibold tracking-wider">POWERED BY</span>
          <span className="font-black italic text-lg tracking-tight">Unblock<span className="text-[#FF6B00]">Me</span></span>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-white text-center py-3 flex text-sm items-center justify-center gap-4">
        <span className="font-medium tracking-wide">HELP BUILD BETTER PARKING ETIQUETTE.</span>
        <span className="text-gray-500">|</span>
        <span className="flex items-center gap-2 font-medium tracking-wide">
          <Globe className="w-4 h-4" /> GET YOURS AT <span className="text-[#FF6B00] font-bold">unblockme.in</span>
        </span>
      </div>

      {/* Trial Expired Full Overlay */}
      {isExpired && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center overflow-hidden">
          <div className="absolute w-[150%] h-6 bg-red-600/90 transform -rotate-12 shadow-2xl pointer-events-none"></div>
          <div className="absolute w-[150%] h-6 bg-red-600/90 transform rotate-12 shadow-2xl pointer-events-none"></div>
          <div className="bg-red-600 text-white text-4xl font-black uppercase px-12 py-5 rounded-3xl shadow-[0_20px_50px_rgba(220,38,38,0.5)] z-20 whitespace-nowrap border-4 border-white">
            Order New Sticker
          </div>
        </div>
      )}
    </div>
  );
}
