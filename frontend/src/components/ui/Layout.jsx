import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, LayoutDashboard, User } from 'lucide-react';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  const adminToken = localStorage.getItem('adminToken');
  const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');

  const isAdminPath = location.pathname.startsWith('/admin') || location.pathname.startsWith('/moderator');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/auth');
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/admin/login');
  };

  // If we are in administrative or moderator route, render the highly premium dark operational portal layout
  if (isAdminPath) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
        <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
          <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link to={adminToken ? (adminUser.role === 'MODERATOR' ? '/moderator/dashboard' : '/admin/dashboard') : '/admin/login'} className="flex items-center gap-2 text-white font-bold text-2xl tracking-tight">
              <img src="/logo.png" alt="UnblockMe Logo" className="w-8 h-8 object-contain object-center scale-[1.35] brightness-110" />
              <span className="italic font-black">Unblock<span className="text-[#FF6B00]">Me</span></span>
            </Link>

            <nav className="flex items-center gap-4">
              {adminToken ? (
                <>
                  <span className="text-xs font-black bg-indigo-500/15 text-indigo-400 border border-indigo-500/35 px-3 py-1.5 rounded-xl uppercase tracking-widest hidden sm:inline-block">
                    🛡️ Ops Portal
                  </span>
                  <button 
                    onClick={handleAdminLogout}
                    className="text-slate-400 hover:text-rose-400 flex items-center gap-1.5 font-bold transition-all bg-slate-805 border border-slate-700 px-3.5 py-1.5 rounded-xl shadow-sm text-xs hover:scale-[1.02] cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-rose-400" /> <span className="hidden sm:inline">Sign Out</span>
                  </button>
                </>
              ) : (
                <Link to="/auth" className="text-slate-400 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors">
                  Owner Portal
                </Link>
              )}
            </nav>
          </div>
        </header>

        <main className="flex-1 w-full min-w-0 max-w-5xl mx-auto px-4 py-8 flex flex-col justify-center">
          <Outlet />
        </main>

        <footer className="bg-slate-900 border-t border-slate-850 py-6 text-center text-slate-500 text-sm">
          <p>&copy; {new Date().getFullYear()} UnblockMe (India) • Secure Operational Console • All rights reserved.</p>
        </footer>
      </div>
    );
  }

  // Otherwise, standard consumer owner portal layout (light theme)
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-gray-900 font-bold text-2xl tracking-tight">
            <img src="/logo.png" alt="UnblockMe Logo" className="w-8 h-8 object-contain object-center scale-[1.35]" />
            <span className="italic font-black">Unblock<span className="text-[#FF6B00]">Me</span></span>
          </Link>

          <nav className="flex items-center gap-4">
            {token && !adminToken ? (
              <>
                <Link to="/dashboard" className="text-gray-600 hover:text-brand-600 flex items-center gap-1 font-medium transition-colors">
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
                <Link to="/profile" className="text-gray-600 hover:text-brand-600 flex items-center gap-1 font-medium transition-colors">
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">Profile</span>
                </Link>
                <button 
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-red-600 flex items-center gap-1 font-medium transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <Link to="/admin/login" className="text-gray-600 hover:text-brand-600 font-bold text-xs uppercase tracking-wider transition-colors mr-1">
                  Partner Portal
                </Link>
                <Link to="/auth" className="bg-brand-600 text-white px-4 py-2 rounded-full font-medium hover:bg-brand-700 transition-colors shadow-sm animate-pulse-slow">
                  Owner Login
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 w-full min-w-0 max-w-5xl mx-auto px-4 py-8 flex flex-col">
        <Outlet />
      </main>

      <footer className="bg-white border-t py-6 text-center text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} UnblockMe (India). All rights reserved.</p>
      </footer>
    </div>
  );
}
