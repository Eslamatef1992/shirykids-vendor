import React, { useEffect, useState } from 'react';
import {
  Card, Table, Button, Modal, Form, Input, Tag, Popconfirm, message, Typography, Empty,
} from 'antd';
import { PlusOutlined, DeleteOutlined, UserOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';

const { Text } = Typography;

export default function Scanners() {
  const { admin } = useAuth();
  const [scanners, setScanners]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [form] = Form.useForm();

  const load = () =>
    api.get('/vendor/scanners')
      .then(r => setScanners(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const createScanner = async (vals) => {
    setSaving(true);
    try {
      await api.post('/vendor/scanners', vals);
      message.success('Scanner account created');
      setModalOpen(false);
      form.resetFields();
      load();
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
      load();
    } catch (e) {
      message.error(e.response?.data?.message || 'Error removing scanner');
    }
  };

  const columns = [
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

  return (
    <>
      <Card
        bordered={false}
        style={{ borderRadius: 12 }}
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
          ? <Table dataSource={scanners} columns={columns} rowKey="id" pagination={false} loading={loading} />
          : <Empty description="No scanner accounts yet" />
        }
      </Card>

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
