import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Avatar, Space, Spin, Empty, Typography } from 'antd';
import { ShopOutlined, ShoppingCartOutlined, QrcodeOutlined } from '@ant-design/icons';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import api from '../api/axios';

const { Text } = Typography;
const BASE = (import.meta.env.VITE_API_URL || 'https://back.sherykids.com/api/v1').replace('/api/v1', '');

export default function Dashboard() {
  const [stats, setStats]         = useState(null);
  const [activity, setActivity]   = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/vendor/stats'),
      api.get('/vendor/daily-activity'),
    ])
      .then(([s, a]) => {
        setStats(s.data);
        setActivity(
          (a.data.data || []).map(r => ({
            day:      r.day?.slice(5) || '',   // MM-DD
            Scanned:  parseInt(r.scanned  || 0, 10),
            Redeemed: parseInt(r.redeemed || 0, 10),
          }))
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const couponCols = [
    {
      title: 'Coupon',
      render: (_, r) => (
        <Space>
          {r.image && <Avatar src={`${BASE}${r.image}`} shape="square" size={36} />}
          <div>
            <div style={{ fontWeight: 600 }}>{r.title}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>KD {parseFloat(r.price || 0).toFixed(3)}</Text>
          </div>
        </Space>
      ),
    },
    { title: 'Quantity', dataIndex: 'coupon_count', align: 'center' },
    { title: 'Sold',     dataIndex: 'sold', align: 'center', render: v => <Tag color="blue">{v}</Tag> },
    {
      title: 'Status',
      dataIndex: 'status',
      render: s => (
        <Tag color={s === 'active' ? 'green' : s === 'expired' ? 'red' : 'orange'}>{s}</Tag>
      ),
    },
  ];

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
      <Spin size="large" />
    </div>
  );

  return (
    <>
      {/* Stats */}
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

      {/* Daily activity chart */}
      {activity.length > 0 && (
        <Card
          bordered={false}
          style={{ borderRadius: 12, marginBottom: 24 }}
          title={<span style={{ fontWeight: 700 }}>Daily Scan Activity (Last 30 Days)</span>}
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={activity} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Scanned"  fill="#1890ff" radius={[4,4,0,0]} />
              <Bar dataKey="Redeemed" fill="#52c41a" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Coupons table */}
      <Card
        bordered={false}
        style={{ borderRadius: 12 }}
        title={<span style={{ fontWeight: 700 }}>Coupons</span>}
      >
        {stats?.coupons?.length
          ? <Table dataSource={stats.coupons} columns={couponCols} rowKey="id" pagination={false} />
          : <Empty description="No coupons yet" />
        }
      </Card>
    </>
  );
}
