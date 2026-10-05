import React, { useEffect, useRef, useState } from 'react';
import { Card, Result, Tag, Typography, Button, Spin, Alert, Space } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, CameraOutlined, ReloadOutlined } from '@ant-design/icons';
import jsQR from 'jsqr';
import api from '../api/axios';

const { Text, Title } = Typography;

const STATUS_COLORS = { success: '#52c41a', error: '#FF383C', idle: '#1890ff' };

export default function QrScanner() {
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);
  const lastCode  = useRef(null);
  const cooldown  = useRef(false);

  const [started,  setStarted]  = useState(false);
  const [scanning, setScanning] = useState(false);
  const [result,   setResult]   = useState(null);   // { status, coupon, message, scannedBy }
  const [error,    setError]    = useState(null);
  const [loading,  setLoading]  = useState(false);

  const stopCamera = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setStarted(false);
    setScanning(false);
  };

  const startCamera = async () => {
    setError(null);
    setResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setStarted(true);
      setScanning(true);
      scanLoop();
    } catch (e) {
      setError('Camera access denied. Please allow camera permission and try again.');
    }
  };

  const scanLoop = () => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const ctx = canvas.getContext('2d');

    const tick = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width  = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });

        if (code && code.data && code.data !== lastCode.current && !cooldown.current) {
          lastCode.current = code.data;
          cooldown.current = true;
          redeemCode(code.data);
          setTimeout(() => { cooldown.current = false; lastCode.current = null; }, 4000);
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const redeemCode = async (code) => {
    setLoading(true);
    setResult(null);
    try {
      const res = await api.post('/qr/redeem', { code });
      setResult({
        status:    'success',
        coupon:    res.data.coupon || res.data.redemption?.coupon_name,
        message:   res.data.message || 'Coupon redeemed successfully',
        amount:    res.data.redemption?.purchase_amount,
      });
    } catch (e) {
      const msg = e.response?.data?.message || 'Scan failed';
      // Already redeemed is a special case
      const isUsed = msg.toLowerCase().includes('already') || msg.toLowerCase().includes('used');
      setResult({
        status:  isUsed ? 'used' : 'error',
        message: msg,
      });
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    lastCode.current = null;
    cooldown.current = false;
  };

  useEffect(() => () => stopCamera(), []);

  return (
    <div style={{ maxWidth: 520, margin: '0 auto' }}>
      <Card
        bordered={false}
        style={{ borderRadius: 12, marginBottom: 16 }}
        title={<span style={{ fontWeight: 700 }}><CameraOutlined style={{ marginRight: 8, color: '#FF383C' }} />QR Code Scanner</span>}
      >
        {!started ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>📷</div>
            <p style={{ color: '#666', marginBottom: 24 }}>
              Point your camera at a Shiry Kids QR code to redeem it instantly.
            </p>
            <Button
              type="primary"
              size="large"
              icon={<CameraOutlined />}
              onClick={startCamera}
              style={{ background: '#FF383C', borderColor: '#FF383C', borderRadius: 10, paddingInline: 32 }}
            >
              Start Camera
            </Button>
            {error && <Alert message={error} type="error" style={{ marginTop: 16, borderRadius: 8 }} />}
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            <video
              ref={videoRef}
              style={{ width: '100%', borderRadius: 10, display: 'block', background: '#000' }}
              playsInline
              muted
            />
            {/* Scanning overlay */}
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none',
            }}>
              <div style={{
                width: 200, height: 200, border: '3px solid #FF383C',
                borderRadius: 12, boxShadow: '0 0 0 2000px rgba(0,0,0,0.35)',
              }} />
            </div>
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text type="secondary" style={{ fontSize: 13 }}>
                {loading ? <><Spin size="small" style={{ marginRight: 8 }} />Processing…</> : '● Scanning…'}
              </Text>
              <Button size="small" danger onClick={stopCamera} style={{ borderRadius: 8 }}>
                Stop Camera
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Result card */}
      {result && (
        <Card bordered={false} style={{ borderRadius: 12 }}>
          {result.status === 'success' ? (
            <Result
              icon={<CheckCircleOutlined style={{ color: '#52c41a', fontSize: 56 }} />}
              title={<span style={{ color: '#52c41a' }}>Redeemed!</span>}
              subTitle={
                <Space direction="vertical" size={4}>
                  <div>{result.message}</div>
                  {result.coupon && <Tag color="green" style={{ fontSize: 14, padding: '4px 12px' }}>{result.coupon}</Tag>}
                  {result.amount && <div style={{ fontWeight: 700, color: '#52c41a', fontSize: 16 }}>KD {parseFloat(result.amount).toFixed(3)}</div>}
                </Space>
              }
              extra={[
                <Button key="again" type="primary" onClick={reset} icon={<ReloadOutlined />}
                  style={{ background: '#FF383C', borderColor: '#FF383C', borderRadius: 8 }}>
                  Scan Another
                </Button>,
              ]}
            />
          ) : (
            <Result
              icon={<CloseCircleOutlined style={{ color: '#FF383C', fontSize: 56 }} />}
              title={<span style={{ color: '#FF383C' }}>{result.status === 'used' ? 'Already Redeemed' : 'Scan Failed'}</span>}
              subTitle={result.message}
              extra={[
                <Button key="again" onClick={reset} icon={<ReloadOutlined />} style={{ borderRadius: 8 }}>
                  Try Again
                </Button>,
              ]}
            />
          )}
        </Card>
      )}
    </div>
  );
}
