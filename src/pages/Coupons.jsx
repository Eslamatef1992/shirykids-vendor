import React, { useEffect, useState } from 'react';
import {
  Card, Table, Tag, Avatar, Space, Spin, Empty, Typography, Input, Progress, Tooltip,
} from 'antd';
import { SearchOutlined, ShopOutlined } from '@ant-design/icons';
import api from '../api/axios';

const { Text } = Typography;
const BASE = (import.meta.env.VITE_API_URL || 'https://back.sherykids.com/api/v1').replace('/api/v1', '');

export default function Coupons() {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');

  useEffect(() => {
    api.get('/vendor/coupons')
      .then(r => setData(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = data.filter(c =>
    !search ||
    c.title?.toLowerCase().includes(search.toLowerCase()) ||
    c.title_ar?.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      title: 'Coupon',
      render: (_, r) => (
        <Space>
          {r.image
            ? <Avatar src={`${BASE}${r.image}`} shape="square" size={44} style={{ borderRadius: 8 }} />
            : <Avatar shape="square" size={44} style={{ background: '#FF383C', borderRadius: 8 }} icon={<ShopOutlined />} />
          }
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{r.title}</div>
            {r.title_ar && <Text type="secondary" style={{ fontSize: 12 }}>{r.title_ar}</Text>}
          </div>
        </Space>
      ),
    },
    {
      title: 'Price',
      dataIndex: 'price',
      align: 'center',
      render: (v, r) => (
        <div>
          <div style={{ fontWeight: 700, color: '#FF383C' }}>KD {parseFloat(v).toFixed(3)}</div>
          {r.original_price && (
            <Text delete type="secondary" style={{ fontSize: 11 }}>KD {parseFloat(r.original_price).toFixed(3)}</Text>
          )}
        </div>
      ),
    },
    {
      title: 'Stock',
      align: 'center',
      render: (_, r) => {
        const pct = r.coupon_count > 0 ? Math.round(((r.coupon_count - r.sold) / r.coupon_count) * 100) : 0;
        return (
          <Tooltip title={`${r.coupon_count - r.sold} remaining of ${r.coupon_count}`}>
            <div style={{ minWidth: 90 }}>
              <div style={{ fontSize: 12, marginBottom: 4 }}>
                <strong>{r.coupon_count - r.sold}</strong>
                <Text type="secondary"> / {r.coupon_count}</Text>
              </div>
              <Progress percent={pct} size="small" strokeColor={pct > 30 ? '#52c41a' : '#FF383C'} showInfo={false} />
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: 'Sold',
      dataIndex: 'sold',
      align: 'center',
      render: v => <Tag color="blue">{v}</Tag>,
    },
    {
      title: 'Redeemed',
      dataIndex: 'redeemed',
      align: 'center',
      render: v => <Tag color="green">{v}</Tag>,
    },
    {
      title: 'Expiry',
      dataIndex: 'expiry_date',
      render: v => {
        if (!v) return <Text type="secondary">No expiry</Text>;
        const expired = new Date(v) < new Date();
        return <Tag color={expired ? 'red' : 'orange'}>{new Date(v).toLocaleDateString('en-GB')}</Tag>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: s => (
        <Tag color={s === 'active' ? 'green' : s === 'expired' ? 'red' : 'orange'}>
          {s.charAt(0).toUpperCase() + s.slice(1)}
        </Tag>
      ),
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
      title={<span style={{ fontWeight: 700 }}>Your Coupons</span>}
      extra={
        <Input
          prefix={<SearchOutlined style={{ color: '#bbb' }} />}
          placeholder="Search coupon..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: 220, borderRadius: 8 }}
          allowClear
          size="small"
        />
      }
    >
      {filtered.length
        ? <Table dataSource={filtered} columns={columns} rowKey="id" pagination={{ pageSize: 15, showSizeChanger: false }} />
        : <Empty description="No coupons yet" />
      }
    </Card>
  );
}
