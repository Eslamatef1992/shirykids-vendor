import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://back.sherykids.com/api/v1',
});

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('vendor_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  res => res,
  err => {
    // Only auto-logout on 401 for authenticated requests (not the login call itself)
    const url = err.config?.url || '';
    const isLoginCall = url.includes('/auth/admin/login');
    if (err.response?.status === 401 && !isLoginCall) {
      localStorage.removeItem('vendor_token');
      localStorage.removeItem('vendor_admin');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
