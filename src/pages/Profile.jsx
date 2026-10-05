import React, { useEffect, useState } from 'react';
import {
  Card, Form, Input, Button, message, Typography, Divider, Avatar, Row, Col, Spin,
} from 'antd';
import { UserOutlined, LockOutlined, ShopOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';

const { Title, Text } = Typography;
const BASE = (import.meta.env.VITE_API_URL || 'https://back.sherykids.com/api/v1').replace('/api/v1', '');

export default function Profile() {
  const { admin } = useAuth();
  const [profile, setProfile]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [savingPw, setSavingPw]     = useState(false);
  const [pwForm] = Form.useForm();

  useEffect(() => {
    api.get('/vendor/profile')
      .then(r => setProfile(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const changePassword = async (vals) => {
    setSavingPw(true);
    try {
      await api.put('/vendor/profile/password', {
        currentPassword: vals.currentPassword,
        newPassword:     vals.newPassword,
      });
      message.success('Password changed successfully');
      pwForm.resetFields();
    } catch (e) {
      message.error(e.response?.data?.message || 'Error changing password');
    } finally {
      setSavingPw(false);
    }
  };

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:400 }}>
      <Spin size="large" />
    </div>
  );

  const vendor  = profile?.vendor;
  const logoUrl = vendor?.logo ? `${BASE}${vendor.logo}` : null;

  return (
    <Row gutter={[24, 24]}>
      {/* Vendor info card */}
      <Col xs={24} lg={12}>
        <Card
          bordered={false}
          style={{ borderRadius: 12 }}
          title={<span style={{ fontWeight: 700 }}><ShopOutlined style={{ marginRight: 8 }} />Vendor Info</span>}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            {logoUrl
              ? <img src={logoUrl} alt={vendor?.name} style={{ width: 72, height: 72, borderRadius: 12, objectFit: 'cover', border: '1px solid #f0f0f0' }} />
              : <Avatar size={72} style={{ background: '#FF383C', fontSize: 28, borderRadius: 12 }}>{vendor?.name?.[0]}</Avatar>
            }
            <div>
              <div style={{ fontWeight: 800, fontSize: 18 }}>{vendor?.name}</div>
              {vendor?.name_ar && <Text type="secondary">{vendor.name_ar}</Text>}
              <div style={{ marginTop: 4 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>Vendor ID: {vendor?.id}</Text>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            {vendor?.email && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <MailOutlined style={{ color: '#FF383C' }} />
                <Text>{vendor.email}</Text>
              </div>
            )}
            {vendor?.phone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <PhoneOutlined style={{ color: '#FF383C' }} />
                <Text>{vendor.phone}</Text>
              </div>
            )}
            {vendor?.description && (
              <div style={{ marginTop: 8, padding: '10px 14px', background: '#fafafa', borderRadius: 8 }}>
                <Text style={{ fontSize: 13 }}>{vendor.description}</Text>
              </div>
            )}
          </div>
        </Card>
      </Col>

      {/* Account info + change password */}
      <Col xs={24} lg={12}>
        <Card
          bordered={false}
          style={{ borderRadius: 12 }}
          title={<span style={{ fontWeight: 700 }}><UserOutlined style={{ marginRight: 8 }} />My Account</span>}
        >
          {/* Account details */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#fafafa', borderRadius: 10 }}>
              <Avatar size={46} style={{ background: '#FF383C', fontWeight: 700 }}>
                {profile?.admin?.name?.[0]}
              </Avatar>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{profile?.admin?.name}</div>
                <Text type="secondary" style={{ fontSize: 13 }}>{profile?.admin?.email}</Text>
              </div>
            </div>
          </div>

          <Divider style={{ margin: '0 0 20px' }}>
            <span style={{ fontSize: 13, color: '#666', fontWeight: 600 }}>
              <LockOutlined style={{ marginRight: 6 }} />Change Password
            </span>
          </Divider>

          <Form form={pwForm} layout="vertical" onFinish={changePassword}>
            <Form.Item
              name="currentPassword"
              label="Current Password"
              rules={[{ required: true, message: 'Enter your current password' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Current password" />
            </Form.Item>
            <Form.Item
              name="newPassword"
              label="New Password"
              rules={[{ required: true, min: 6, message: 'At least 6 characters' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="New password" />
            </Form.Item>
            <Form.Item
              name="confirmPassword"
              label="Confirm New Password"
              dependencies={['newPassword']}
              rules={[
                { required: true },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) return Promise.resolve();
                    return Promise.reject('Passwords do not match');
                  },
                }),
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Confirm new password" />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={savingPw}
                block
                style={{ background: '#FF383C', borderColor: '#FF383C', borderRadius: 8 }}
              >
                Update Password
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Col>
    </Row>
  );
}
