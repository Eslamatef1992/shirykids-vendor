import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Row, Col, Statistic, Table, Tag, Spin, Empty, Typography,
  Button, Avatar, Progress,
} from 'antd';
import { ArrowLeftOutlined, DollarOutlined, QrcodeOutlined, CheckCircleOutlined, ShopOutlined } from '@ant-design/icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../api/axios';

const { Text, Title } = Typography;
const BASE = (import.meta.env.VITE_API_URL || 'https://back.sherykids.com/api/v1').replace('/api/v1', '');

export default function CouponDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/vendor/coupons/${id}/detail`)
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:400 }}>
      <Spin size="large" />
    </div>
  );

  if (!data) return <Empty description="Coupon not found" />;

  const { coupon, monthly, redemptions } = data;
  const remaining = (coupon.coupon_count || 0) - (coupon.sold || 0);
  const stockPct  = coupon.coupon_count > 0 ? Math.round((remaining / coupon.coupon_count) * 100) : 0;

  const redemptionCols = [
    { title: 'Scanner', dataIndex: 'scannerName', render: v => <Tag color="purple">{v}</Tag> },
    {
      title: 'Amount',
      dataIndex: 'purchaseAmount',
      render: v => v ? <Tag color="blue">KD {parseFloat(v).toFixed(3)}</Tag> : '—',
    },
    {
      title: 'Scan Date',
      dataIndex: 'scannedAt',
      render: v => v ? new Date(v).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : '—',
    },
  ];

  return (
    <>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/coupons')}
        style={{ marginBottom: 20, borderRadius: 8 }}
      >
        Back to Coupons
      </Button>

      {/* Header card */}
      <Card bordered={false} style={{ borderRadius: 12, marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {coupon.image
            ? <img src={`${BASE}${coupon.image}`} alt={coupon.title} style={{ width: 100, height: 100, borderRadius: 12, objectFit: 'cover' }} />
            : <Avatar shape="square" size={100} style={{ background: '#FF383C', borderRadius: 12, fontSize: 36 }} icon={<ShopOutlined />} />
          }
          <div style={{ flex: 1, minWidth: 0 }}>
            <Title level={4} style={{ margin: 0 }}>{coupon.title}</Title>
            {coupon.title_ar && <Text type="secondary">{coupon.title_ar}</Text>}
            <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Tag color="blue">KD {parseFloat(coupon.price).toFixed(3)}</Tag>
              <Tag color={coupon.status === 'active' ? 'green' : 'red'}>{coupon.status}</Tag>
              {coupon.expiry_date && (
                <Tag color={new Date(coupon.expiry_date) < new Date() ? 'red' : 'orange'}>
                  Expires {new Date(coupon.expiry_date).toLocaleDateString('en-GB')}
                </Tag>
              )}
            </div>
            <div style={{ marginTop: 10 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Stock remaining: {remaining} / {coupon.coupon_count}</Text>
              <Progress percent={stockPct} size="small" strokeColor={stockPct > 30 ? '#52c41a' : '#FF383C'} style={{ maxWidth: 200, marginTop: 4 }} />
            </div>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ borderRadius: 12 }}>
            <Statistic title="Sold" value={coupon.sold} prefix={<ShopOutlined style={{ color: '#fa8c16' }} />} valueStyle={{ color: '#fa8c16' }} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ borderRadius: 12 }}>
            <Statistic title="Redeemed" value={coupon.redeemed} prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ borderRadius: 12 }}>
            <Statistic
              title="Revenue"
              value={parseFloat(coupon.totalRevenue).toFixed(3)}
              suffix="KD"
              prefix={<DollarOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Monthly chart */}
      {monthly.length > 0 && (
        <Card bordered={false} style={{ borderRadius: 12, marginBottom: 24 }} title={<span style={{ fontWeight:700 }}>Monthly Redemptions</span>}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthly} margin={{ top:5, right:16, left:0, bottom:5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize:11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize:11 }} />
              <Tooltip formatter={(v, name) => name === 'revenue' ? `KD ${parseFloat(v).toFixed(3)}` : v} />
              <Bar dataKey="count"   fill="#FF383C" radius={[4,4,0,0]} name="Redemptions" />
              <Bar dataKey="revenue" fill="#52c41a" radius={[4,4,0,0]} name="Revenue (KD)" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Redemption history */}
      <Card bordered={false} style={{ borderRadius: 12 }} title={<span style={{ fontWeight:700 }}>Redemption History</span>}>
        {redemptions.length
          ? <Table dataSource={redemptions} columns={redemptionCols} rowKey="id" pagination={{ pageSize: 20 }} />
          : <Empty description="No redemptions yet" />
        }
      </Card>
    </>
  );
}
