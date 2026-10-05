import React, { useState } from 'react';
import logoImg from '../assets/logo.png';
import { Form, Input, Button, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const MAROON = '#8B1A1A';

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form]    = Form.useForm();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await login(values.email, values.password);
      navigate('/');
    } catch (e) {
      if (e.message === 'no_permission') {
        message.error('You do not have permission to access the vendor dashboard');
      } else {
        message.error(e.response?.data?.message || 'Invalid email or password');
      }
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
      flexWrap: 'wrap',
      gap: 80,
      padding: '40px 24px',
      background: 'radial-gradient(ellipse 900px 700px at 78% 45%, #fbe3df 0%, #fdf2f0 45%, #ffffff 75%)',
    }}>
      {/* Left: branding */}
      <div style={{ maxWidth: 420 }}>
        <img src={logoImg} alt="Shiry Kids" style={{ width: 110, marginBottom: 24 }} />
        <h1 style={{ fontSize: 36, fontWeight: 800, color: '#1a1a1a', margin: '0 0 16px' }}>
          Shiry Kids Fun
        </h1>
        <p style={{ fontSize: 16, color: '#888', lineHeight: 1.6, margin: 0 }}>
          Vendor dashboard for managing coupons, tracking sales, and managing scanner accounts.
        </p>
      </div>

      {/* Right: login card */}
      <div style={{ width: '100%', maxWidth: 480 }}>
        <div style={{
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 8px 40px rgba(0,0,0,0.06)',
          padding: '40px 48px',
        }}>
          <h2 style={{
            textAlign: 'center',
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: 1,
            color: MAROON,
            margin: '0 0 16px',
            textTransform: 'uppercase',
          }}>
            Vendor Dashboard
          </h2>
          <div style={{ borderBottom: '1px solid #eee', marginBottom: 28 }} />

          <Form form={form} onFinish={onFinish} layout="vertical" size="large" requiredMark={false}>
            <Form.Item
              name="email"
              label={<span style={{ fontWeight: 700, color: '#222' }}>Email</span>}
              rules={[{ required: true, type: 'email', message: 'Please enter a valid email' }]}
            >
              <Input placeholder="example@gmail.com" style={{ borderRadius: 8, height: 48 }} />
            </Form.Item>
            <Form.Item
              name="password"
              label={<span style={{ fontWeight: 700, color: '#222' }}>Password</span>}
              rules={[{ required: true, message: 'Please enter your password' }]}
            >
              <Input.Password placeholder="••••••••" style={{ borderRadius: 8, height: 48 }} />
            </Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{
                background: MAROON,
                borderColor: MAROON,
                height: 50,
                fontWeight: 700,
                fontSize: 16,
                borderRadius: 8,
                marginTop: 8,
              }}
            >
              Login
            </Button>
          </Form>
        </div>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: '#999' }}>
          All Rights Reserved By{' '}
          <a
            href="https://teknulugy.com"
            target="_blank"
            rel="noreferrer"
            style={{ color: '#999', fontWeight: 700, textDecoration: 'underline' }}
          >
            Teknulugy Company
          </a>{' '}
          @{new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}
