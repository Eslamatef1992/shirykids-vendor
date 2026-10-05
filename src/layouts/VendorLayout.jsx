import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import logoImg from '../assets/logo.png';
import { Layout, Menu, Avatar, Dropdown, Button, ConfigProvider, Badge } from 'antd';
import {
  DashboardOutlined, QrcodeOutlined, LogoutOutlined,
  UserOutlined, BarChartOutlined, BellOutlined,
  ShopOutlined, LineChartOutlined, SettingOutlined, TeamOutlined, ScanOutlined,
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState } from 'react';
import api from '../api/axios';

const { Sider, Header, Content } = Layout;
const SIDER_BG = '#1A1A2E';
const PRIMARY   = '#FF383C';
const BASE = (import.meta.env.VITE_API_URL || 'https://back.sherykids.com/api/v1').replace('/api/v1', '');

export default function VendorLayout() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { admin, logout } = useAuth();
  const [notifCount, setNotifCount] = useState(0);

  const vendor    = admin?.vendor;
  const vendorLogo = vendor?.logo ? `${BASE}${vendor.logo}` : null;

  // Load notification count
  useEffect(() => {
    api.get('/vendor/notifications')
      .then(r => setNotifCount(r.data.data?.length || 0))
      .catch(() => {});
  }, []);

  const menuItems = [
    { key: '/',               icon: <DashboardOutlined />,  label: 'Dashboard' },
    { key: '/analytics',      icon: <LineChartOutlined />,  label: 'Analytics' },
    { key: '/coupons',        icon: <ShopOutlined />,       label: 'Coupons' },
    { key: '/customers',      icon: <TeamOutlined />,       label: 'Customers' },
    { key: '/reports',        icon: <BarChartOutlined />,   label: 'Reports' },
    { key: '/scanners',       icon: <QrcodeOutlined />,     label: 'Scanners' },
    { key: '/qr-scanner',     icon: <ScanOutlined />,       label: 'QR Scanner' },
    {
      key: '/notifications',
      icon: (
        <Badge count={notifCount} size="small" offset={[6, -2]} style={{ background: PRIMARY }}>
          <BellOutlined />
        </Badge>
      ),
      label: (
        <span>
          Notifications
          {notifCount > 0 && (
            <Badge count={notifCount} size="small" style={{ background: PRIMARY, marginLeft: 8 }} />
          )}
        </span>
      ),
    },
    { key: '/profile',        icon: <SettingOutlined />,    label: 'Profile' },
  ];

  const userMenu = {
    items: [
      { key: 'profile', icon: <UserOutlined />, label: 'Profile' },
      { type: 'divider' },
      { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', danger: true },
    ],
    onClick: ({ key }) => {
      if (key === 'logout') { logout(); navigate('/login'); }
      if (key === 'profile') navigate('/profile');
    },
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={240} style={{ background: SIDER_BG }} breakpoint="lg" collapsedWidth={60}>
        {/* Logo + vendor branding */}
        <div style={{ padding: '20px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <img src={logoImg} alt="Shiry Kids" style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 8 }} />
            <div>
              <div style={{ color: '#fff', fontSize: 15, fontWeight: 800, lineHeight: 1.1 }}>Shiry Kids</div>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>Vendor Dashboard</div>
            </div>
          </div>

          {/* Vendor card */}
          {vendor && (
            <div style={{
              background: 'rgba(255,255,255,0.06)',
              borderRadius: 10,
              padding: '12px 14px',
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}>
              {vendorLogo
                ? <img src={vendorLogo} alt={vendor.name} style={{ width: 38, height: 38, borderRadius: 8, objectFit: 'cover', background: '#fff' }} />
                : <Avatar size={38} style={{ background: PRIMARY, fontSize: 18, fontWeight: 700 }}>{vendor.name?.[0]}</Avatar>
              }
              <div style={{ overflow: 'hidden' }}>
                <div style={{ color: '#fff', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{vendor.name}</div>
                <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>Welcome back 👋</div>
              </div>
            </div>
          )}
        </div>

        <ConfigProvider theme={{ components: { Menu: {
          darkItemBg:           SIDER_BG,
          darkItemSelectedBg:   PRIMARY,
          darkItemSelectedColor:'#fff',
          darkItemHoverBg:      'rgba(255,56,60,0.15)',
          darkItemColor:        'rgba(255,255,255,0.65)',
          darkGroupTitleColor:  'rgba(255,255,255,0.35)',
          itemBorderRadius:     10,
          itemMarginInline:     12,
        } } }}>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={({ key }) => navigate(key)}
            style={{ borderRight: 0, fontSize: 13, background: 'transparent' }}
          />
        </ConfigProvider>
      </Sider>

      <Layout>
        <Header style={{
          background: '#fff', padding: '0 24px',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: 16,
          borderBottom: '1px solid #f0f0f0',
        }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>
            {vendor?.name ? `Welcome, ${vendor.name}` : 'Vendor Dashboard'}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Bell icon shortcut */}
            <div
              style={{ cursor: 'pointer', position: 'relative' }}
              onClick={() => navigate('/notifications')}
            >
              <Badge count={notifCount} size="small" style={{ background: PRIMARY }}>
                <BellOutlined style={{ fontSize: 18, color: '#666' }} />
              </Badge>
            </div>

            <Dropdown menu={userMenu}>
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar style={{ background: PRIMARY }} icon={<UserOutlined />}>
                  {admin?.name?.[0]}
                </Avatar>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{admin?.name}</span>
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content style={{ padding: 24, background: '#f5f6fa' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
