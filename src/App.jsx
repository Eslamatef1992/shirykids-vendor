import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import VendorLayout from './layouts/VendorLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import Coupons from './pages/Coupons';
import Reports from './pages/Reports';
import Scanners from './pages/Scanners';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';

const Protected = ({ children }) => {
  const { admin } = useAuth();
  return admin ? children : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Protected><VendorLayout /></Protected>}>
            <Route index element={<Dashboard />} />
            <Route path="analytics"     element={<Analytics />} />
            <Route path="coupons"       element={<Coupons />} />
            <Route path="reports"       element={<Reports />} />
            <Route path="scanners"      element={<Scanners />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="profile"       element={<Profile />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
