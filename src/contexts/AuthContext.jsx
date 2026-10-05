import React, { createContext, useContext, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(() => {
    try { return JSON.parse(localStorage.getItem('vendor_admin')); }
    catch { return null; }
  });

  const login = async (email, password) => {
    const res = await api.post('/auth/admin/login', { email, password });
    const a = res.data.admin;
    const perms = a.role?.permissions || [];
    if (!perms.includes('scan_qr') && !perms.includes('*')) {
      throw new Error('no_permission');
    }
    localStorage.setItem('vendor_token', res.data.token);
    localStorage.setItem('vendor_admin', JSON.stringify(a));
    setAdmin(a);
    return a;
  };

  const logout = () => {
    localStorage.removeItem('vendor_token');
    localStorage.removeItem('vendor_admin');
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
