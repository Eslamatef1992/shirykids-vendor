import React, { useEffect, useState } from 'react';
import { Card, Table, Typography, Spin, Empty, Input, Tag, Avatar } from 'antd';
import { SearchOutlined, UserOutlined } from '@ant-design/icons';
import api from '../api/axios';

const { Text } = Typography;

export default function Customers() {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');

  useEffect(() => {
    api.get('/vendor/customers')
      .then(r => setData(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = data.filter(c =>
    !search ||
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      title: 'Customer',
      render: (_, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar style={{ background: '#FF383C', fontWeight: 700 }} size={38}>
            {r.name?.[0] || <UserOutlined />}
          </Avatar>
          <div>
            <div style={{ fontWeight: 600 }}>{r.name}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>{r.phone}</Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Redemptions',
      dataIndex: 'redemptionCount',
      align: 'center',
      sorter: (a, b) => a.redemptionCount - b.redemptionCount,
      render: v => <Tag color="blue">{v}</Tag>,
    },
    {
      title: 'Total Spent',
      dataIndex: 'totalSpent',
      align: 'right',
      sorter: (a, b) => a.totalSpent - b.totalSpent,
      defaultSortOrder: 'descend',
      render: v => <span style={{ fontWeight: 700, color: '#52c41a' }}>KD {parseFloat(v).toFixed(3)}</span>,
    },
    {
      title: 'First Purchase',
      dataIndex: 'firstPurchase',
      render: v => v ? new Date(v).toLocaleDateString('en-GB', { dateStyle: 'medium' }) : '—',
    },
    {
      title: 'Last Purchase',
      dataIndex: 'lastPurchase',
      render: v => v ? new Date(v).toLocaleDateString('en-GB', { dateStyle: 'medium' }) : '—',
    },
  ];

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:400 }}>
      <Spin size="large" />
    </div>
  );

  return (
    <Card
      bordered={false}
      style={{ borderRadius: 12 }}
      title={
        <span style={{ fontWeight: 700 }}>
          Customers
          <Tag color="blue" style={{ marginLeft: 10 }}>{data.length}</Tag>
        </span>
      }
      extra={
        <Input
          prefix={<SearchOutlined style={{ color: '#bbb' }} />}
          placeholder="Search by name or phone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: 240, borderRadius: 8 }}
          allowClear
          size="small"
        />
      }
    >
      {filtered.length
        ? (
          <Table
            dataSource={filtered}
            columns={columns}
            rowKey="key"
            pagination={{ pageSize: 20, showSizeChanger: false }}
          />
        )
        : <Empty description="No customer data yet" />
      }
    </Card>
  );
}
