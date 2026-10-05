import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Spin, Empty, Typography } from 'antd';
import { DollarOutlined, QrcodeOutlined, CheckCircleOutlined, TrophyOutlined } from '@ant-design/icons';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts';
import api from '../api/axios';

const { Text } = Typography;
const COLORS = ['#FF383C','#1890ff','#52c41a','#fa8c16','#722ed1','#13c2c2','#eb2f96','#faad14','#2f54eb','#f5222d'];

export default function Analytics() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/vendor/analytics')
      .then(r => setData(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:400 }}>
      <Spin size="large" />
    </div>
  );

  if (!data) return <Empty description="Could not load analytics" />;

  const successRate = data.totalScans > 0
    ? Math.round((data.successfulScans / data.totalScans) * 100)
    : 0;

  const redemptionRate = data.successfulScans > 0
    ? Math.round((data.redeemedScans / data.successfulScans) * 100)
    : 0;

  const topCouponsForChart = data.topCoupons.slice(0, 8).map(c => ({
    name:  c.name.length > 18 ? c.name.slice(0, 18) + '…' : c.name,
    Scans: c.count,
    Revenue: parseFloat(c.revenue.toFixed(3)),
  }));

  const topCouponsCols = [
    { title: '#', render: (_, __, i) => <Text type="secondary">{i + 1}</Text>, width: 40 },
    {
      title: 'Coupon',
      dataIndex: 'name',
      render: (v, _, i) => (
        <span>
          {i === 0 && <TrophyOutlined style={{ color: '#FFD700', marginRight: 6 }} />}
          {v}
        </span>
      ),
    },
    { title: 'Scans',   dataIndex: 'count',   align: 'center', render: v => <Tag color="blue">{v}</Tag> },
    { title: 'Revenue', dataIndex: 'revenue',  align: 'right',  render: v => `KD ${parseFloat(v).toFixed(3)}` },
  ];

  return (
    <>
      {/* Summary cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 12 }}>
            <Statistic
              title="Total Revenue"
              value={data.totalRevenue.toFixed(3)}
              prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
              suffix="KD"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 12 }}>
            <Statistic
              title="Total Scans"
              value={data.totalScans}
              prefix={<QrcodeOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 12 }}>
            <Statistic
              title="Scan Success Rate"
              value={successRate}
              suffix="%"
              prefix={<CheckCircleOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 12 }}>
            <Statistic
              title="Redemption Rate"
              value={redemptionRate}
              suffix="%"
              prefix={<CheckCircleOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {/* Monthly revenue chart */}
        <Col xs={24} lg={14}>
          <Card bordered={false} style={{ borderRadius: 12 }} title={<span style={{ fontWeight:700 }}>Monthly Revenue (KD)</span>}>
            {data.monthlyRevenue.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={data.monthlyRevenue} margin={{ top:5, right:16, left:0, bottom:5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize:11 }} />
                  <YAxis tick={{ fontSize:11 }} />
                  <Tooltip formatter={(v) => `KD ${parseFloat(v).toFixed(3)}`} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#FF383C" strokeWidth={2} dot={{ r:4 }} name="Revenue (KD)" />
                  <Line type="monotone" dataKey="count"   stroke="#1890ff" strokeWidth={2} dot={{ r:4 }} name="Redemptions" />
                </LineChart>
              </ResponsiveContainer>
            ) : <Empty description="No revenue data yet" />}
          </Card>
        </Col>

        {/* Top coupons bar chart */}
        <Col xs={24} lg={10}>
          <Card bordered={false} style={{ borderRadius: 12 }} title={<span style={{ fontWeight:700 }}>Top Coupons by Scans</span>}>
            {topCouponsForChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={topCouponsForChart} layout="vertical" margin={{ top:5, right:16, left:0, bottom:5 }}>
                  <XAxis type="number" tick={{ fontSize:11 }} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize:10 }} width={110} />
                  <Tooltip />
                  <Bar dataKey="Scans" radius={[0,4,4,0]}>
                    {topCouponsForChart.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <Empty description="No data yet" />}
          </Card>
        </Col>
      </Row>

      {/* Top coupons table */}
      <Card
        bordered={false}
        style={{ borderRadius: 12 }}
        title={<span style={{ fontWeight:700 }}>Top Coupons Breakdown</span>}
      >
        {data.topCoupons.length > 0
          ? <Table dataSource={data.topCoupons} columns={topCouponsCols} rowKey="name" pagination={false} />
          : <Empty description="No redemptions yet" />
        }
      </Card>
    </>
  );
}
