import React, { useEffect, useState, useRef } from 'react';
import { Card, Table, Tag, Typography, Spin, Empty, Input, Button, Modal, Space, DatePicker } from 'antd';
import { SearchOutlined, QrcodeOutlined, DownloadOutlined, FileExcelOutlined } from '@ant-design/icons';
import QRCode from 'qrcode';
import * as XLSX from 'xlsx';
import api from '../api/axios';

const { Text } = Typography;
const { RangePicker } = DatePicker;

function QrModal({ record, onClose }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (record?.qrCode && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, record.qrCode, {
        width: 260,
        margin: 2,
        color: { dark: '#1A1A2E', light: '#ffffff' },
      });
    }
  }, [record]);

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `qr-${record.couponName || record.id}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <Modal
      open={!!record}
      onCancel={onClose}
      footer={null}
      title={<span style={{ fontWeight: 700 }}>QR Code — {record?.couponName}</span>}
      centered
      width={340}
    >
      <div style={{ textAlign: 'center', padding: '16px 0' }}>
        <canvas ref={canvasRef} style={{ borderRadius: 8, border: '1px solid #f0f0f0' }} />
        <div style={{ marginTop: 12, fontSize: 13, color: '#666' }}>
          <div><strong>Client:</strong> {record?.clientName} · {record?.clientPhone}</div>
          <div><strong>Amount:</strong> {record?.purchaseAmount ? `KD ${parseFloat(record.purchaseAmount).toFixed(3)}` : '—'}</div>
          <div><strong>Scanned:</strong> {record?.scannedAt ? new Date(record.scannedAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}</div>
        </div>
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={download}
          style={{ marginTop: 16, background: '#FF383C', borderColor: '#FF383C', borderRadius: 8 }}
          block
        >
          Download QR
        </Button>
      </div>
    </Modal>
  );
}

export default function Reports() {
  const [data, setData]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [selected, setSelected]   = useState(null);
  const [dateRange, setDateRange] = useState(null);  // [dayjs, dayjs] | null

  useEffect(() => {
    api.get('/vendor/redemptions')
      .then(r => setData(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = data.filter(r => {
    if (search && !(
      r.clientName?.toLowerCase().includes(search.toLowerCase()) ||
      r.couponName?.toLowerCase().includes(search.toLowerCase()) ||
      r.scannerName?.toLowerCase().includes(search.toLowerCase())
    )) return false;

    if (dateRange && dateRange[0] && dateRange[1]) {
      const scanDate = new Date(r.scannedAt);
      if (scanDate < dateRange[0].startOf('day').toDate()) return false;
      if (scanDate > dateRange[1].endOf('day').toDate()) return false;
    }

    return true;
  });

  const exportExcel = () => {
    const rows = filtered.map(r => ({
      'Client Name':    r.clientName  || '—',
      'Client Phone':   r.clientPhone || '—',
      'Coupon':         r.couponName  || '—',
      'Amount (KD)':    r.purchaseAmount ? parseFloat(r.purchaseAmount).toFixed(3) : '—',
      'Scanner':        r.scannerName || '—',
      'Purchase Date':  r.purchasedAt ? new Date(r.purchasedAt).toLocaleString('en-GB') : '—',
      'Scan Date':      r.scannedAt   ? new Date(r.scannedAt).toLocaleString('en-GB')   : '—',
      'QR Code':        r.qrCode || '—',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Scan Reports');
    XLSX.writeFile(wb, `scan-reports-${new Date().toISOString().slice(0,10)}.xlsx`);
  };

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
    {
      title: 'QR',
      align: 'center',
      render: (_, r) => r.qrCode ? (
        <Button
          icon={<QrcodeOutlined />}
          size="small"
          onClick={() => setSelected(r)}
          style={{ borderColor: '#FF383C', color: '#FF383C' }}
        >
          View
        </Button>
      ) : '—',
    },
  ];

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
      <Spin size="large" />
    </div>
  );

  return (
    <>
      <Card
        bordered={false}
        style={{ borderRadius: 12 }}
        title={<span style={{ fontWeight: 700 }}>Scan Reports</span>}
        extra={
          <Space wrap>
            <RangePicker
              onChange={range => setDateRange(range)}
              size="small"
              style={{ borderRadius: 8 }}
            />
            <Input
              prefix={<SearchOutlined style={{ color: '#bbb' }} />}
              placeholder="Search client, coupon, scanner..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: 220, borderRadius: 8 }}
              allowClear
              size="small"
            />
            <Button
              icon={<FileExcelOutlined />}
              size="small"
              onClick={exportExcel}
              disabled={!filtered.length}
              style={{ borderRadius: 8, borderColor: '#52c41a', color: '#52c41a' }}
            >
              Export Excel
            </Button>
          </Space>
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

      <QrModal record={selected} onClose={() => setSelected(null)} />
    </>
  );
}
