import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, Loader2, MapPin, Eye, X, AlertOctagon, Clock, LogOut, RefreshCw 
} from 'lucide-react';
import { API_URL } from '../config';

export default function ModeratorDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [moderatorEmail, setModeratorEmail] = useState('');
  
  // Dashboard states
  const [timeline, setTimeline] = useState([]);
  const [totalPending, setTotalPending] = useState(0);
  const [activeImage, setActiveImage] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const userStr = localStorage.getItem('adminUser');
    if (!token || !userStr) {
      navigate('/admin/login');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      if (user.role !== 'MODERATOR' && user.role !== 'SUPER_ADMIN') {
        navigate('/admin/login');
        return;
      }

      setModeratorEmail(user.email);
      setAuthorized(true);
      fetchModeratorData(token);
    } catch (e) {
      navigate('/admin/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    fetch(`${API_URL}/admin-auth/logout`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
    }).catch(err => console.error('Logout error:', err));

    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  const fetchModeratorData = async (token = localStorage.getItem('adminToken')) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/moderator/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTimeline(data.violations || []);
        setTotalPending(data.totalPendingReviews || 0);
      } else if (res.status === 401 || res.status === 403) {
        handleLogout();
      }
    } catch (err) {
      console.error('Failed to load moderator feed:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !authorized) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-indigo-600 bg-slate-950 min-h-screen">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p className="font-semibold text-slate-400">Verifying secure moderator credentials...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 w-full text-slate-100 min-h-[calc(100vh-14rem)] relative">
      {/* Abstract Background Highlights */}
      <div className="absolute top-0 right-1/4 w-80 h-80 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl relative">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-indigo-500/20 text-indigo-300 font-extrabold text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border border-indigo-500/30 inline-flex items-center gap-1 shadow-inner">
              <ShieldCheck className="w-3.5 h-3.5" /> SECURE MODERATOR FEED
            </span>
            <span className="bg-slate-800 text-slate-300 font-bold text-[10px] uppercase tracking-wider px-3 py-1 rounded-full border border-slate-700">
              VIEW-ONLY RIGHTS
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white uppercase">Moderator Operations Dashboard</h1>
          <p className="text-slate-400 font-medium text-sm mt-2">
            Inspect anonymous parking violation reports and evaluate digital evidence logs securely.
          </p>
          <p className="text-xs text-slate-500 font-bold mt-2 uppercase tracking-wide">
            Session active: <span className="text-indigo-400">{moderatorEmail}</span>
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-center">
          <button 
            onClick={() => fetchModeratorData()}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-3 rounded-2xl border border-slate-800 transition flex items-center gap-2 text-sm cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" /> Refresh Feed
          </button>
          <button 
            onClick={handleLogout}
            className="bg-rose-950/30 hover:bg-rose-900/40 text-rose-300 border border-rose-900/30 font-bold px-5 py-3 rounded-2xl transition text-sm flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>

      {/* Primary Timeline & Details view */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Timeline List column */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-slate-900/40 border border-slate-900 p-6 sm:p-8 rounded-[2rem] shadow-2xl">
            <h3 className="text-xl font-black text-white mb-6 flex items-center gap-2 uppercase tracking-wide">
              <Clock className="w-5 h-5 text-indigo-400" /> Active Moderation Timeline ({timeline.length})
            </h3>

            {loading ? (
              <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-4" /> Syncing secure timeline feeds...
              </div>
            ) : timeline.length === 0 ? (
              <div className="p-12 text-center text-slate-500 bg-slate-900/20 rounded-2xl border border-dashed border-slate-800 font-medium">
                No active parking violations require moderation.
              </div>
            ) : (
              <div className="space-y-6">
                {timeline.map((item) => (
                  <div key={item._id} className="border-l-4 border-indigo-500/70 pl-4 sm:pl-6 py-1 relative">
                    <div className="absolute -left-2 top-2 w-3 h-3 rounded-full bg-indigo-500 ring-4 ring-indigo-950"></div>
                    <div className="bg-slate-900/75 p-5 rounded-2xl border border-slate-800 hover:border-slate-700/60 hover:bg-slate-900 transition-all shadow-lg">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-white text-lg capitalize">{item.messageType.replace('_', ' ')}</span>
                            <span className="text-xs font-black bg-indigo-950 border border-indigo-800 text-indigo-400 px-2 py-0.5 rounded uppercase tracking-wider">
                              {item.vehicleDetails?.vehicleNumber || 'Protected'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 font-bold mt-1">
                            Reported IP: {item.reportedByIp || 'anonymous'} • Owner Name: <span className="text-indigo-300/80">{item.vehicleDetails?.ownerName || 'Protected'}</span>
                          </p>
                        </div>
                        <span className="text-[11px] font-black text-slate-400 bg-slate-800 border border-slate-750 px-2.5 py-1 rounded-lg">
                          {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>

                      {item.message && (
                        <p className="text-slate-300 bg-slate-950 p-4 rounded-xl border border-slate-900 text-sm italic mb-4">
                          "{item.message}"
                        </p>
                      )}

                      {/* Attachment Zoom details */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        {item.imageUrl ? (
                          <div className="flex flex-col items-start">
                            <img 
                              src={item.imageUrl} 
                              alt="Evidence" 
                              onClick={() => setActiveImage(item.imageUrl)}
                              className="w-24 h-24 object-cover rounded-xl border border-slate-800 shadow-md cursor-zoom-in hover:scale-102 hover:border-indigo-500/50 transition duration-300"
                            />
                            <span className="text-[9px] text-slate-500 font-bold mt-1">🔍 Click to zoom evidence</span>
                          </div>
                        ) : (
                          <div className="text-xs text-slate-500 italic bg-slate-950 px-3 py-2 rounded-lg border border-slate-900">
                            No photo attached
                          </div>
                        )}

                        <div className="flex items-center gap-2 mt-auto sm:ml-auto">
                          {item.location && (
                            <a 
                              href={`https://maps.google.com/?q=${item.location}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-bold bg-slate-800 hover:bg-slate-750 text-slate-300 px-4 py-2.5 rounded-xl inline-flex items-center gap-1.5 border border-slate-750 transition"
                            >
                              <MapPin className="w-3.5 h-3.5 text-indigo-400" /> Verify Location
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Info Column */}
        <div className="space-y-6">
          {/* Moderation Metrics */}
          <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-3xl text-left">
            <h4 className="font-black text-white text-base mb-4 uppercase tracking-wider flex items-center gap-1.5">
              📈 Operations Load
            </h4>
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-900 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Reports Loaded</p>
                  <p className="text-3xl font-black text-white mt-1">{totalPending}</p>
                </div>
                <div className="bg-indigo-500/10 text-indigo-400 p-3 rounded-xl border border-indigo-500/20">
                  <AlertOctagon className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 text-xs text-slate-400 space-y-2 leading-relaxed font-semibold">
                <p>🔒 <strong>Data Anonymization Active:</strong> Sensitive fields like owner numbers and license papers are masked under Moderator privileges.</p>
                <p>💼 <strong>Moderator Scopes:</strong> You have view-only access to search tools and violation feed streams to identify parking hotspots.</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Interactive enlarged image modal */}
      <AnimatePresence>
        {activeImage && (
          <div 
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 cursor-zoom-out"
            onClick={() => setActiveImage(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
            >
              <button 
                onClick={() => setActiveImage(null)} 
                className="absolute -top-12 right-0 p-2 bg-slate-800 hover:bg-slate-700 rounded-full transition text-white border border-slate-700 shadow-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <img src={activeImage} alt="Moderation Zoom evidence" className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-slate-800" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
