import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import api from '../api/axios';

const { Title, Text } = Typography;

export default function Login({ onLogin }) {
  const [loading, setLoading] = useState(false);

  const submit = async ({ email, password }) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/admin/login', { email, password });
      const admin = res.data.admin;
      // Only allow admins with scan_qr permission
      const perms = admin.role?.permissions || [];
      if (!perms.includes('scan_qr') && !perms.includes('*')) {
        message.error('You do not have permission to access the vendor dashboard');
        return;
      }
      localStorage.setItem('vendor_token', res.data.token);
      localStorage.setItem('vendor_admin', JSON.stringify(admin));
      onLogin(admin);
    } catch (e) {
      message.error(e.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #FF383C 0%, #ff6b6e 100%)',
    }}>
      <Card style={{ width: 380, borderRadius: 16, boxShadow: '0 8px 40px rgba(0,0,0,.15)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16, background: '#FF383C',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 16,
          }}>
            <span style={{ fontSize: 28 }}>🏪</span>
          </div>
          <Title level={3} style={{ margin: 0, color: '#FF383C' }}>Vendor Dashboard</Title>
          <Text type="secondary">Shiry Kids</Text>
        </div>

        <Form layout="vertical" onFinish={submit}>
          <Form.Item name="email" rules={[{ required: true, type: 'email' }]}>
            <Input prefix={<UserOutlined />} placeholder="Email" size="large" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Password" size="large" />
          </Form.Item>
          <Button
            type="primary" htmlType="submit" loading={loading} block size="large"
            style={{ background: '#FF383C', borderColor: '#FF383C', borderRadius: 8 }}
          >
            Sign In
          </Button>
        </Form>
      </Card>
    </div>
  );
}
