import React, { useState } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

export default function App() {
  const [admin, setAdmin] = useState(() => {
    try { return JSON.parse(localStorage.getItem('vendor_admin')); }
    catch { return null; }
  });

  if (!admin) return <Login onLogin={setAdmin} />;
  return <Dashboard admin={admin} onLogout={() => setAdmin(null)} />;
}
