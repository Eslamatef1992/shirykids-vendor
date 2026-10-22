import React, { useEffect, useState, useCallback } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Spin, Empty, Typography, DatePicker, Space, Button, message } from 'antd';
import { DollarOutlined, QrcodeOutlined, CheckCircleOutlined, TrophyOutlined, FileExcelOutlined, FilePdfOutlined, MailOutlined } from '@ant-design/icons';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../api/axios';

const { RangePicker } = DatePicker;

const { Text } = Typography;
const COLORS = ['#FF383C','#1890ff','#52c41a','#fa8c16','#722ed1','#13c2c2','#eb2f96','#faad14','#2f54eb','#f5222d'];

export default function Analytics() {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [dateRange, setDateRange] = useState(null);
  const [sendingEmail, setSendingEmail] = useState(false);

  const fetchData = useCallback((range) => {
    setLoading(true);
    const params = {};
    if (range?.[0]) params.from = range[0].format('YYYY-MM-DD');
    if (range?.[1]) params.to   = range[1].format('YYYY-MM-DD');
    api.get('/vendor/analytics', { params })
      .then(r => setData(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(null); }, [fetchData]);

  const handleRangeChange = (range) => {
    setDateRange(range);
    fetchData(range);
  };

  const sendSummaryEmail = async () => {
    setSendingEmail(true);
    try {
      const res = await api.post('/vendor/email-summary');
      message.success(res.data.message || 'Summary email sent!');
    } catch (e) {
      message.error(e.response?.data?.message || 'Failed to send email');
    } finally {
      setSendingEmail(false);
    }
  };

  const exportExcel = () => {
    if (!data?.topCoupons?.length) return;
    const rows = data.topCoupons.map((c, i) => ({
      Rank: i + 1, Coupon: c.name, Scans: c.count, 'Revenue (KD)': parseFloat(c.revenue).toFixed(3),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Top Coupons');
    XLSX.writeFile(wb, `analytics-${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const exportPDF = () => {
    if (!data?.topCoupons?.length) return;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    // ── Header bar ────────────────────────────────────────────────
    doc.setFillColor(255, 56, 60);
    doc.rect(0, 0, pageW, 28, 'F');

    // Logo (top-left)
    const logoImg = new Image(); logoImg.src = '/logo.png';
    try { doc.addImage(logoImg, 'PNG', 8, 4, 20, 20); } catch (_) {}

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18); doc.setFont('helvetica', 'bold');
    doc.text('Analytics Report', 34, 13);
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    doc.text('Shiry Kids Vendor Dashboard', 34, 20);

    // Date (top-right)
    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleString('en-GB')}`, pageW - 14, 13, { align: 'right' });

    // ── Summary cards ─────────────────────────────────────────────
    const cardY = 36;
    const cards = [
      { label: 'Total Revenue', value: `KD ${parseFloat(data.totalRevenue || 0).toFixed(3)}` },
      { label: 'Valid Scans',   value: String(data.successfulScans || 0) },
      { label: 'Success Rate',  value: `${successRate}%` },
      { label: 'Top Coupon',    value: data.topCoupons[0]?.name || '—' },
    ];
    const cardW = (pageW - 28) / 4;
    cards.forEach((card, i) => {
      const x = 14 + i * (cardW + 2);
      doc.setFillColor(255, 245, 245);
      doc.roundedRect(x, cardY, cardW, 18, 3, 3, 'F');
      doc.setDrawColor(255, 56, 60); doc.setLineWidth(0.3);
      doc.roundedRect(x, cardY, cardW, 18, 3, 3, 'S');
      doc.setTextColor(255, 56, 60); doc.setFontSize(7); doc.setFont('helvetica', 'normal');
      doc.text(card.label.toUpperCase(), x + cardW / 2, cardY + 6, { align: 'center' });
      doc.setTextColor(30, 30, 30); doc.setFontSize(11); doc.setFont('helvetica', 'bold');
      doc.text(card.value, x + cardW / 2, cardY + 14, { align: 'center' });
    });

    // ── Table ─────────────────────────────────────────────────────
    doc.setTextColor(60, 60, 60); doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.text('Top Coupons Breakdown', 14, cardY + 26);

    autoTable(doc, {
      startY: cardY + 30,
      head: [['#', 'Coupon', 'Valid Scans', 'Revenue (KD)']],
      body: data.topCoupons.map((c, i) => [i + 1, c.name, c.count, parseFloat(c.revenue).toFixed(3)]),
      headStyles: { fillColor: [255, 56, 60], textColor: 255, fontStyle: 'bold', fontSize: 10 },
      bodyStyles: { fontSize: 10, textColor: [40, 40, 40] },
      alternateRowStyles: { fillColor: [255, 248, 248] },
      columnStyles: { 0: { halign: 'center', cellWidth: 14 }, 2: { halign: 'center' }, 3: { halign: 'right' } },
      margin: { left: 14, right: 14 },
      tableLineColor: [255, 200, 200], tableLineWidth: 0.1,
    });

    // ── Footer ────────────────────────────────────────────────────
    doc.setFillColor(245, 245, 245);
    doc.rect(0, pageH - 14, pageW, 14, 'F');
    doc.setDrawColor(220, 220, 220); doc.setLineWidth(0.3);
    doc.line(0, pageH - 14, pageW, pageH - 14);
    doc.setTextColor(150, 150, 150); doc.setFontSize(8); doc.setFont('helvetica', 'normal');
    doc.text('Powered by Teknulugy', pageW / 2, pageH - 5, { align: 'center' });
    doc.text(`© ${new Date().getFullYear()} Shiry Kids. All rights reserved.`, 14, pageH - 5);
    doc.text(`Page 1`, pageW - 14, pageH - 5, { align: 'right' });

    doc.save(`analytics-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:400 }}>
      <Spin size="large" />
    </div>
  );

  if (!data) return <Empty description="Could not load analytics" />;

  const successRate = data.totalScans > 0
    ? Math.round((data.successfulScans / data.totalScans) * 100)
    : 0;

  const redemptionRate = data.totalScans > 0
    ? Math.round((data.redeemedScans / data.totalScans) * 100)
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
      {/* Toolbar */}
      <Card bordered={false} style={{ borderRadius: 12, marginBottom: 20 }} bodyStyle={{ padding: '12px 20px' }}>
        <div style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'center', justifyContent:'space-between' }}>
          <Space wrap>
            <RangePicker onChange={handleRangeChange} size="small" style={{ borderRadius: 8 }} />
            <Button size="small" onClick={() => handleRangeChange(null)} style={{ borderRadius: 8 }}>
              All Time
            </Button>
          </Space>
          <Space wrap>
            <Button icon={<FileExcelOutlined />} size="small" onClick={exportExcel} disabled={!data?.topCoupons?.length}
              style={{ borderRadius: 8, borderColor:'#52c41a', color:'#52c41a' }}>Excel</Button>
            <Button icon={<FilePdfOutlined />} size="small" onClick={exportPDF} disabled={!data?.topCoupons?.length}
              style={{ borderRadius: 8, borderColor:'#FF383C', color:'#FF383C' }}>PDF</Button>
            <Button icon={<MailOutlined />} size="small" loading={sendingEmail} onClick={sendSummaryEmail}
              style={{ borderRadius: 8, borderColor:'#1890ff', color:'#1890ff' }}>Email Summary</Button>
          </Space>
        </div>
      </Card>

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
              title="Already Used Rate"
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
                  <Line type="monotone" dataKey="count"   stroke="#1890ff" strokeWidth={2} dot={{ r:4 }} name="Valid Scans" />
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
