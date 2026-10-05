import React, { useEffect, useState } from 'react';
import {
  Row, Col, Card, Statistic, Table, Button, Modal, Form, Input,
  Tag, Popconfirm, message, Avatar, Typography, Space, Spin, Empty,
} from 'antd';
import {
  ShopOutlined, ShoppingCartOutlined, QrcodeOutlined,
  PlusOutlined, DeleteOutlined, LogoutOutlined, UserOutlined,
} from '@ant-design/icons';
import api from '../api/axios';

const { Title, Text } = Typography;
const BASE = (import.meta.env.VITE_API_URL || 'https://back.sherykids.com/api/v1').replace('/api/v1', '');

export default function Dashboard({ admin, onLogout }) {
  const [stats, setStats]         = useState(null);
  const [scanners, setScanners]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [form] = Form.useForm();

  const loadStats = () =>
    api.get('/vendor/stats').then(r => setStats(r.data)).catch(() => {});

  const loadScanners = () =>
    api.get('/vendor/scanners').then(r => setScanners(r.data.data || [])).catch(() => {});

  useEffect(() => {
    Promise.all([loadStats(), loadScanners()]).finally(() => setLoading(false));
  }, []);

  const createScanner = async (vals) => {
    setSaving(true);
    try {
      await api.post('/vendor/scanners', vals);
      message.success('Scanner account created');
      setModalOpen(false);
      form.resetFields();
      loadScanners();
    } catch (e) {
      message.error(e.response?.data?.message || 'Error');
    } finally {
      setSaving(false);
    }
  };

  const removeScanner = async (id) => {
    try {
      await api.delete(`/vendor/scanners/${id}`);
      message.success('Removed');
      loadScanners();
    } catch (e) {
      message.error(e.response?.data?.message || 'Error');
    }
  };

  const scannerCols = [
    { title: 'Name',   dataIndex: 'name',  key: 'name' },
    { title: 'Email',  dataIndex: 'email', key: 'email' },
    { title: 'Status', dataIndex: 'status', render: s => <Tag color={s === 'active' ? 'green' : 'red'}>{s}</Tag> },
    {
      title: 'Actions', render: (_, r) => (
        // Prevent deleting yourself
        r.id === admin.id ? <Text type="secondary">You</Text> :
        <Popconfirm title="Remove this scanner?" onConfirm={() => removeScanner(r.id)}>
          <Button icon={<DeleteOutlined />} size="small" danger />
        </Popconfirm>
      ),
    },
  ];

  const couponCols = [
    {
      title: 'Coupon', render: (_, r) => (
        <Space>
          {r.image && <Avatar src={`${BASE}${r.image}`} shape="square" size={36} />}
          <div>
            <div style={{ fontWeight: 600 }}>{r.title}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>KD {parseFloat(r.price).toFixed(3)}</Text>
          </div>
        </Space>
      ),
    },
    { title: 'Quantity', dataIndex: 'coupon_count', align: 'center' },
    { title: 'Sold',     dataIndex: 'sold',         align: 'center', render: v => <Tag color="blue">{v}</Tag> },
    { title: 'Status',   dataIndex: 'status',       render: s => <Tag color={s === 'active' ? 'green' : s === 'expired' ? 'red' : 'orange'}>{s}</Tag> },
  ];

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <Spin size="large" />
    </div>
  );

  const vendor = stats?.vendor;

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* Header */}
      <div style={{
        background: '#FF383C', padding: '16px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 2px 8px rgba(255,56,60,.3)',
      }}>
        <Space align="center">
          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 20 }}>🏪</span>
          </div>
          <div>
            <Title level={5} style={{ color: '#fff', margin: 0 }}>
              {vendor?.name || 'Vendor Dashboard'}
            </Title>
            <Text style={{ color: 'rgba(255,255,255,.8)', fontSize: 12 }}>Shiry Kids</Text>
          </div>
        </Space>
        <Space>
          <Text style={{ color: '#fff' }}>{admin.name}</Text>
          <Button
            icon={<LogoutOutlined />} type="text" style={{ color: '#fff' }}
            onClick={() => {
              localStorage.removeItem('vendor_token');
              localStorage.removeItem('vendor_admin');
              onLogout();
            }}
          >
            Logout
          </Button>
        </Space>
      </div>

      <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
        {/* Summary cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={8}>
            <Card bordered={false} style={{ borderRadius: 12 }}>
              <Statistic
                title="Total Coupons"
                value={stats?.summary?.totalCoupons ?? 0}
                prefix={<ShopOutlined style={{ color: '#FF383C' }} />}
                valueStyle={{ color: '#FF383C' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card bordered={false} style={{ borderRadius: 12 }}>
              <Statistic
                title="Sold"
                value={stats?.summary?.totalSold ?? 0}
                prefix={<ShoppingCartOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card bordered={false} style={{ borderRadius: 12 }}>
              <Statistic
                title="Scanned"
                value={stats?.summary?.totalScanned ?? 0}
                prefix={<QrcodeOutlined style={{ color: '#1890ff' }} />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Coupons table */}
        <Card
          bordered={false}
          style={{ borderRadius: 12, marginBottom: 24 }}
          title={<span style={{ fontWeight: 700 }}>Coupons</span>}
        >
          {stats?.coupons?.length
            ? <Table dataSource={stats.coupons} columns={couponCols} rowKey="id" pagination={false} />
            : <Empty description="No coupons yet" />
          }
        </Card>

        {/* Scanner accounts */}
        <Card
          bordered={false}
          style={{ borderRadius: 12 }}
          title={<span style={{ fontWeight: 700 }}>Scanner Accounts</span>}
          extra={
            <Button
              type="primary" icon={<PlusOutlined />}
              style={{ background: '#FF383C', borderColor: '#FF383C', borderRadius: 8 }}
              onClick={() => { form.resetFields(); setModalOpen(true); }}
            >
              Add Scanner
            </Button>
          }
        >
          {scanners.length
            ? <Table dataSource={scanners} columns={scannerCols} rowKey="id" pagination={false} />
            : <Empty description="No scanner accounts yet" />
          }
        </Card>
      </div>

      {/* Create scanner modal */}
      <Modal
        title="Create Scanner Account"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={saving}
        okButtonProps={{ style: { background: '#FF383C', borderColor: '#FF383C' } }}
      >
        <Form form={form} layout="vertical" onFinish={createScanner}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input prefix={<UserOutlined />} placeholder="Scanner's name" />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input placeholder="Login email" />
          </Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true, min: 6 }]}>
            <Input.Password placeholder="At least 6 characters" />
          </Form.Item>
        </Form>
        <Text type="secondary" style={{ fontSize: 12 }}>
          This account will be limited to scanning coupons from your vendor only.
        </Text>
      </Modal>
    </div>
  );
}
