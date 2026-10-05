import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import logoImg from '../assets/logo.png';
import { Layout, Menu, Avatar, Dropdown, Button, ConfigProvider } from 'antd';
import {
  DashboardOutlined, QrcodeOutlined, LogoutOutlined, UserOutlined,
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';

const { Sider, Header, Content } = Layout;
const SIDER_BG = '#1A1A2E';
const PRIMARY   = '#FF383C';

export default function VendorLayout() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { admin, logout } = useAuth();

  const menuItems = [
    { key: '/',         icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: '/scanners', icon: <QrcodeOutlined />,    label: 'Scanners' },
  ];

  const userMenu = {
    items: [{ key: 'logout', icon: <LogoutOutlined />, label: 'Logout', danger: true }],
    onClick: ({ key }) => { if (key === 'logout') { logout(); navigate('/login'); } },
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={240} style={{ background: SIDER_BG }} breakpoint="lg" collapsedWidth={60}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '20px 20px 16px' }}>
          <img src={logoImg} alt="Shiry Kids" style={{ width: 38, height: 38, objectFit: 'contain', borderRadius: 8 }} />
          <div>
            <div style={{ color: '#fff', fontSize: 17, fontWeight: 800, lineHeight: 1.1 }}>Shiry Kids</div>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 2 }}>Vendor Dashboard</div>
          </div>
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
            {admin?.vendor?.name || 'Vendor Dashboard'}
          </div>

          <Dropdown menu={userMenu}>
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar style={{ background: PRIMARY }} icon={<UserOutlined />}>
                {admin?.name?.[0]}
              </Avatar>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{admin?.name}</span>
            </div>
          </Dropdown>
        </Header>

        <Content style={{ padding: 24, background: '#f5f6fa' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
