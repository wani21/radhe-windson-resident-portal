import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1',
  withCredentials: true, // Mandates HttpOnly cookies across origins
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If backend returns 401 and it's not a login attempt, user's session expired
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      // Dispatches custom event for clean session synchronization
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    return Promise.reject(error);
  }
);
