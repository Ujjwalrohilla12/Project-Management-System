import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_BASEURL,
  withCredentials: true,
});

// ── Request interceptor: inject Clerk JWT ──────────────────
api.interceptors.request.use(async (config) => {
  try {
    const token = await window.Clerk?.session?.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // Clerk not ready yet — request proceeds without token
  }
  return config;
});

// ── Response interceptor: handle auth errors ───────────────
let sessionExpiredToastShown = false;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const message = error?.response?.data?.message || error.message || 'Something went wrong';

    if (status === 401) {
      // Session expired or invalid token
      if (!sessionExpiredToastShown) {
        sessionExpiredToastShown = true;
        toast.error('Your session has expired. Please sign in again.', {
          id: 'session-expired',
          duration: 4000,
        });
        setTimeout(() => {
          sessionExpiredToastShown = false;
          // Redirect to sign-in preserving current path
          window.location.href = `/sign-in?redirect=${encodeURIComponent(window.location.pathname)}`;
        }, 1500);
      }
      return Promise.reject(new Error('Session expired'));
    }

    if (status === 403) {
      return Promise.reject(new Error(message || 'You do not have permission to perform this action'));
    }

    if (status === 429) {
      toast.error('Too many requests. Please slow down.', { id: 'rate-limit' });
      return Promise.reject(new Error('Rate limit exceeded'));
    }

    return Promise.reject(new Error(message));
  }
);

export default api;
