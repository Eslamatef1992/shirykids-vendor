import React, { useEffect, useState } from 'react';
import {
  Card, Table, Button, Modal, Form, Input, Tag, Popconfirm,
  message, Typography, Empty, Space, Radio, Switch, Progress, Row, Col, Statistic,
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, UserOutlined, QrcodeOutlined,
  CheckCircleOutlined, LockOutlined, BarChartOutlined, EditOutlined,
} from '@ant-design/icons';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';

const { Text } = Typography;

const COLORS = ['#FF383C','#1890ff','#52c41a','#fa8c16','#722ed1','#13c2c2'];

export default function Scanners() {
  const { admin } = useAuth();
  const [scanners, setScanners]         = useState([]);
  const [scannerStats, setScannerStats] = useState([]);
  const [logs, setLogs]                 = useState([]);
  const [loadingScanners, setLoadingScanners] = useState(true);
  const [loadingLogs, setLoadingLogs]         = useState(true);

  // Add scanner modal
  const [modalOpen, setModalOpen]   = useState(false);
  const [saving, setSaving]         = useState(false);
  const [form] = Form.useForm();

  // Reset password modal
  const [resetTarget, setResetTarget] = useState(null);
  const [resetForm]                   = Form.useForm();
  const [resetting, setResetting]     = useState(false);

  // Edit scanner modal
  const [editTarget, setEditTarget]   = useState(null);
  const [editForm]                    = Form.useForm();
  const [editing, setEditing]         = useState(false);

  const [filter, setFilter] = useState('all');  // all | scanned | redeemed

  // ── Load data ──────────────────────────────────────────────────────────────

  const loadScanners = () =>
    api.get('/vendor/scanners')
      .then(r => setScanners(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoadingScanners(false));

  const loadStats = () =>
    api.get('/vendor/scanner-stats')
      .then(r => setScannerStats(r.data.data || []))
      .catch(() => {});

  const loadLogs = () =>
    api.get('/vendor/scan-logs')
      .then(r => setLogs(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoadingLogs(false));

  useEffect(() => { loadScanners(); loadStats(); loadLogs(); }, []);

  // ── Actions ────────────────────────────────────────────────────────────────

  const createScanner = async (vals) => {
    setSaving(true);
    try {
      await api.post('/vendor/scanners', vals);
      message.success('Scanner account created');
      setModalOpen(false);
      form.resetFields();
      loadScanners();
      loadStats();
    } catch (e) {
      message.error(e.response?.data?.message || 'Error creating scanner');
    } finally {
      setSaving(false);
    }
  };

  const removeScanner = async (id) => {
    try {
      await api.delete(`/vendor/scanners/${id}`);
      message.success('Scanner removed');
      loadScanners();
      loadStats();
    } catch (e) {
      message.error(e.response?.data?.message || 'Error removing scanner');
    }
  };

  const toggleStatus = async (scanner) => {
    try {
      const res = await api.put(`/vendor/scanners/${scanner.id}/status`);
      message.success(`Scanner ${res.data.status === 'active' ? 'enabled' : 'disabled'}`);
      loadScanners();
    } catch (e) {
      message.error(e.response?.data?.message || 'Error updating status');
    }
  };

  const doEditScanner = async (vals) => {
    setEditing(true);
    try {
      await api.put(`/vendor/scanners/${editTarget.id}`, { name: vals.name, email: vals.email });
      message.success('Scanner updated');
      setEditTarget(null);
      editForm.resetFields();
      loadScanners();
    } catch (e) {
      message.error(e.response?.data?.message || 'Error updating scanner');
    } finally {
      setEditing(false);
    }
  };

  const doResetPassword = async (vals) => {
    setResetting(true);
    try {
      await api.put(`/vendor/scanners/${resetTarget.id}/password`, { password: vals.password });
      message.success('Password updated successfully');
      setResetTarget(null);
      resetForm.resetFields();
    } catch (e) {
      message.error(e.response?.data?.message || 'Error updating password');
    } finally {
      setResetting(false);
    }
  };

  // ── Columns ────────────────────────────────────────────────────────────────

  const scannerCols = [
    { title: 'Name',  dataIndex: 'name',  key: 'name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
      title: 'Last Login',
      dataIndex: 'last_login_at',
      render: v => v ? new Date(v).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : <Text type="secondary">Never</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (s, r) =>
        r.id === admin?.id
          ? <Tag color="green">{s}</Tag>
          : (
            <Switch
              checked={s === 'active'}
              checkedChildren="Active"
              unCheckedChildren="Off"
              size="small"
              onChange={() => toggleStatus(r)}
            />
          ),
    },
    {
      title: 'Actions',
      render: (_, r) =>
        r.id === admin?.id
          ? <Text type="secondary">You</Text>
          : (
            <Space>
              <Button
                icon={<EditOutlined />}
                size="small"
                onClick={() => { setEditTarget(r); editForm.setFieldsValue({ name: r.name, email: r.email }); }}
                title="Edit scanner"
              />
              <Button
                icon={<LockOutlined />}
                size="small"
                onClick={() => { setResetTarget(r); resetForm.resetFields(); }}
                title="Reset password"
              />
              <Popconfirm title="Remove this scanner?" onConfirm={() => removeScanner(r.id)}>
                <Button icon={<DeleteOutlined />} size="small" danger />
              </Popconfirm>
            </Space>
          ),
    },
  ];

  const filteredLogs = logs.filter(l => {
    if (filter === 'scanned')  return l.status === 'valid';
    if (filter === 'redeemed') return l.status === 'used';
    return true;
  });

  const logCols = [
    {
      title: 'Scanner',
      dataIndex: 'scannerName',
      render: v => <Tag color="purple">{v}</Tag>,
    },
    {
      title: 'QR Code',
      dataIndex: 'qrCode',
      render: v => <Text style={{ fontFamily: 'monospace', fontSize: 12 }}>{v?.slice(0, 20)}…</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: s => (
        s === 'valid'  ? <Tag color="blue"  icon={<QrcodeOutlined />}>Scanned</Tag>
        : s === 'used' ? <Tag color="green" icon={<CheckCircleOutlined />}>Redeemed</Tag>
        : <Tag color="red">Not Found</Tag>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'scannedAt',
      render: v => v ? new Date(v).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : '—',
    },
  ];

  // ── Per-scanner breakdown chart ────────────────────────────────────────────

  const chartData = scannerStats.map(s => ({
    name:     s.name,
    Scanned:  s.scanned,
    Redeemed: s.redeemed,
  }));

  return (
    <>
      {/* Per-scanner stats chart */}
      {chartData.length > 0 && (
        <Card
          bordered={false}
          style={{ borderRadius: 12, marginBottom: 24 }}
          title={<span style={{ fontWeight: 700 }}><BarChartOutlined /> Per-Scanner Performance</span>}
        >
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            {scannerStats.map((s, i) => (
              <Col key={s.id} xs={12} sm={8} md={6}>
                <Card size="small" bordered style={{ borderRadius: 8, borderColor: COLORS[i % COLORS.length] }}>
                  <div style={{ fontWeight: 600, marginBottom: 4, color: COLORS[i % COLORS.length] }}>{s.name}</div>
                  <div style={{ fontSize: 12, color: '#555' }}>
                    <div>Scanned: <strong>{s.scanned}</strong></div>
                    <div>Redeemed: <strong>{s.redeemed}</strong></div>
                    <div>Total: <strong>{s.total}</strong></div>
                  </div>
                  {s.total > 0 && (
                    <Progress
                      percent={Math.round((s.redeemed / s.total) * 100)}
                      size="small"
                      strokeColor={COLORS[i % COLORS.length]}
                      style={{ marginTop: 6 }}
                    />
                  )}
                </Card>
              </Col>
            ))}
          </Row>

          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="Scanned"  fill="#1890ff" radius={[4,4,0,0]} />
              <Bar dataKey="Redeemed" fill="#52c41a" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Scanner accounts */}
      <Card
        bordered={false}
        style={{ borderRadius: 12, marginBottom: 24 }}
        title={<span style={{ fontWeight: 700 }}>Scanner Accounts</span>}
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            style={{ background: '#FF383C', borderColor: '#FF383C', borderRadius: 8 }}
            onClick={() => { form.resetFields(); setModalOpen(true); }}
          >
            Add Scanner
          </Button>
        }
      >
        {scanners.length
          ? <Table dataSource={scanners} columns={scannerCols} rowKey="id" pagination={false} loading={loadingScanners} />
          : <Empty description="No scanner accounts yet" />
        }
      </Card>

      {/* Scan activity */}
      <Card
        bordered={false}
        style={{ borderRadius: 12 }}
        title={<span style={{ fontWeight: 700 }}>Scan Activity</span>}
        extra={
          <Radio.Group value={filter} onChange={e => setFilter(e.target.value)} buttonStyle="solid" size="small">
            <Radio.Button value="all">All</Radio.Button>
            <Radio.Button value="scanned">Scanned</Radio.Button>
            <Radio.Button value="redeemed">Redeemed</Radio.Button>
          </Radio.Group>
        }
      >
        {filteredLogs.length
          ? <Table dataSource={filteredLogs} columns={logCols} rowKey="id" loading={loadingLogs} pagination={{ pageSize: 15, showSizeChanger: false }} />
          : <Empty description="No activity yet" />
        }
      </Card>

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
          This account will only be able to scan coupons from your vendor.
        </Text>
      </Modal>

      {/* Edit scanner modal */}
      <Modal
        title={`Edit Scanner — ${editTarget?.name}`}
        open={!!editTarget}
        onCancel={() => { setEditTarget(null); editForm.resetFields(); }}
        onOk={() => editForm.submit()}
        confirmLoading={editing}
        okButtonProps={{ style: { background: '#FF383C', borderColor: '#FF383C' } }}
        okText="Save Changes"
      >
        <Form form={editForm} layout="vertical" onFinish={doEditScanner}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input prefix={<UserOutlined />} placeholder="Scanner's name" />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input placeholder="Login email" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Reset password modal */}
      <Modal
        title={`Reset Password — ${resetTarget?.name}`}
        open={!!resetTarget}
        onCancel={() => { setResetTarget(null); resetForm.resetFields(); }}
        onOk={() => resetForm.submit()}
        confirmLoading={resetting}
        okButtonProps={{ style: { background: '#FF383C', borderColor: '#FF383C' } }}
        okText="Update Password"
      >
        <Form form={resetForm} layout="vertical" onFinish={doResetPassword}>
          <Form.Item
            name="password"
            label="New Password"
            rules={[{ required: true, min: 6, message: 'At least 6 characters' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="New password" />
          </Form.Item>
          <Form.Item
            name="confirm"
            label="Confirm Password"
            dependencies={['password']}
            rules={[
              { required: true },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) return Promise.resolve();
                  return Promise.reject('Passwords do not match');
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Confirm new password" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
