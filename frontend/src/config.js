let rawApiUrl = import.meta.env.VITE_API_URL || 'https://backend-two-ivory-53.vercel.app';
let rawAppUrl = import.meta.env.VITE_APP_URL || 'https://unblockmeapp.vercel.app';

if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
  // If deployed but pointing to localhost, override to production backend
  if (rawApiUrl.includes('localhost') || rawApiUrl.includes('127.0.0.1')) {
    rawApiUrl = 'https://backend-two-ivory-53.vercel.app';
  }
  // Prevent mixed content errors by enforcing HTTPS in production
  if (rawApiUrl.startsWith('http://')) {
    rawApiUrl = rawApiUrl.replace('http://', 'https://');
  }
}

// Strip any accidental trailing slashes to prevent 308 redirects that drop CORS headers
export const API_URL = rawApiUrl.trim().replace(/\/+$/, '');
export const APP_URL = rawAppUrl.trim().replace(/\/+$/, '');
