import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Avatar, Space, Spin, Empty, Typography, Alert, Badge } from 'antd';
import { ShopOutlined, ShoppingCartOutlined, QrcodeOutlined, ReloadOutlined, WarningOutlined } from '@ant-design/icons';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import api from '../api/axios';

const { Text } = Typography;
const BASE = (import.meta.env.VITE_API_URL || 'https://back.sherykids.com/api/v1').replace('/api/v1', '');
const REFRESH_INTERVAL = 30_000; // 30 seconds

export default function Dashboard() {
  const [stats, setStats]         = useState(null);
  const [activity, setActivity]   = useState([]);
  const [revenue, setRevenue]     = useState(null);
  const [lowStock, setLowStock]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const timerRef = useRef(null);

  const fetchAll = useCallback((silent = false) => {
    if (!silent) setLoading(true);
    Promise.all([
      api.get('/vendor/stats'),
      api.get('/vendor/daily-activity'),
      api.get('/vendor/analytics'),
      api.get('/vendor/coupons/low-stock'),
    ])
      .then(([s, a, r, ls]) => {
        setStats(s.data);
        setRevenue(r.data.data);
        setActivity(
          (a.data.data || []).map(row => ({
            day:      row.day?.slice(5) || '',
            Scanned:  parseInt(row.scanned  || 0, 10),
            Redeemed: parseInt(row.redeemed || 0, 10),
          }))
        );
        setLowStock(ls.data.data || []);
        setLastUpdated(new Date());
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchAll();
    timerRef.current = setInterval(() => fetchAll(true), REFRESH_INTERVAL);
    return () => clearInterval(timerRef.current);
  }, [fetchAll]);

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
      {/* Header bar: last updated + live indicator */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ color: '#888', fontSize: 13 }}>
          <Badge status="processing" color="#52c41a" />
          {' '}Live · refreshes every 30s
        </span>
        {lastUpdated && (
          <span style={{ color: '#aaa', fontSize: 12 }}>
            <ReloadOutlined /> Last updated {lastUpdated.toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Low stock alert */}
      {lowStock.length > 0 && (
        <Alert
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          style={{ marginBottom: 16, borderRadius: 10 }}
          message={`Low Stock Warning — ${lowStock.length} coupon${lowStock.length > 1 ? 's' : ''} running low`}
          description={
            <div style={{ marginTop: 4 }}>
              {lowStock.map(c => (
                <Tag key={c.id} color="orange" style={{ marginBottom: 4 }}>
                  {c.title} — {c.stock} left
                </Tag>
              ))}
            </div>
          }
        />
      )}

      {/* Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 12 }}>
            <Statistic
              title="Total Coupons"
              value={stats?.summary?.totalCoupons ?? 0}
              prefix={<ShopOutlined style={{ color: '#FF383C' }} />}
              valueStyle={{ color: '#FF383C' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 12 }}>
            <Statistic
              title="Sold"
              value={stats?.summary?.totalSold ?? 0}
              prefix={<ShoppingCartOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
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
