import React, { useEffect, useState } from 'react';
import {
  Card, Table, Button, Modal, Form, Input, Tag, Popconfirm,
  message, Typography, Empty, Space, Radio,
} from 'antd';
import { PlusOutlined, DeleteOutlined, UserOutlined, QrcodeOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';

const { Text } = Typography;

export default function Scanners() {
  const { admin } = useAuth();
  const [scanners, setScanners]   = useState([]);
  const [logs, setLogs]           = useState([]);
  const [loadingScanners, setLoadingScanners] = useState(true);
  const [loadingLogs, setLoadingLogs]         = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [filter, setFilter]       = useState('all');  // all | scanned | redeemed
  const [form] = Form.useForm();

  const loadScanners = () =>
    api.get('/vendor/scanners')
      .then(r => setScanners(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoadingScanners(false));

  const loadLogs = () =>
    api.get('/vendor/scan-logs')
      .then(r => setLogs(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoadingLogs(false));

  useEffect(() => { loadScanners(); loadLogs(); }, []);

  const createScanner = async (vals) => {
    setSaving(true);
    try {
      await api.post('/vendor/scanners', vals);
      message.success('Scanner account created');
      setModalOpen(false);
      form.resetFields();
      loadScanners();
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
    } catch (e) {
      message.error(e.response?.data?.message || 'Error removing scanner');
    }
  };

  const scannerCols = [
    { title: 'Name',  dataIndex: 'name',  key: 'name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
      title: 'Status',
      dataIndex: 'status',
      render: s => <Tag color={s === 'active' ? 'green' : 'red'}>{s}</Tag>,
    },
    {
      title: 'Actions',
      render: (_, r) =>
        r.id === admin?.id
          ? <Text type="secondary">You</Text>
          : (
            <Popconfirm title="Remove this scanner?" onConfirm={() => removeScanner(r.id)}>
              <Button icon={<DeleteOutlined />} size="small" danger />
            </Popconfirm>
          ),
    },
  ];

  // Filter logs based on selected tab
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
        s === 'valid'     ? <Tag color="blue"   icon={<QrcodeOutlined />}>Scanned</Tag>
        : s === 'used'    ? <Tag color="green"  icon={<CheckCircleOutlined />}>Redeemed</Tag>
        : <Tag color="red">Not Found</Tag>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'scannedAt',
      render: v => v ? new Date(v).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : '—',
    },
  ];

  return (
    <>
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
    </>
  );
}
