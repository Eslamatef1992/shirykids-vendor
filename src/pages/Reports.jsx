import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Typography, Spin, Empty, Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import api from '../api/axios';

const { Text } = Typography;

export default function Reports() {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');

  useEffect(() => {
    api.get('/vendor/redemptions')
      .then(r => setData(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = data.filter(r =>
    !search ||
    r.clientName?.toLowerCase().includes(search.toLowerCase()) ||
    r.couponName?.toLowerCase().includes(search.toLowerCase()) ||
    r.scannerName?.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      title: 'Client',
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 600 }}>{r.clientName}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>{r.clientPhone}</Text>
        </div>
      ),
    },
    {
      title: 'Coupon',
      dataIndex: 'couponName',
      render: v => <span style={{ fontWeight: 500 }}>{v || '—'}</span>,
    },
    {
      title: 'Amount',
      dataIndex: 'purchaseAmount',
      render: v => v ? <Tag color="blue">KD {parseFloat(v).toFixed(3)}</Tag> : '—',
      align: 'center',
    },
    {
      title: 'Scanner',
      dataIndex: 'scannerName',
      render: v => <Tag color="purple">{v}</Tag>,
    },
    {
      title: 'Purchase Date',
      dataIndex: 'purchasedAt',
      render: v => v ? new Date(v).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : '—',
    },
    {
      title: 'Scan Date',
      dataIndex: 'scannedAt',
      render: v => v ? new Date(v).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : '—',
    },
  ];

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
      <Spin size="large" />
    </div>
  );

  return (
    <Card
      bordered={false}
      style={{ borderRadius: 12 }}
      title={<span style={{ fontWeight: 700 }}>Scan Reports</span>}
      extra={
        <Input
          prefix={<SearchOutlined style={{ color: '#bbb' }} />}
          placeholder="Search client, coupon, scanner..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: 260, borderRadius: 8 }}
          allowClear
        />
      }
    >
      {filtered.length
        ? (
          <Table
            dataSource={filtered}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 20, showSizeChanger: false }}
          />
        )
        : <Empty description="No scan records yet" />
      }
    </Card>
  );
}
