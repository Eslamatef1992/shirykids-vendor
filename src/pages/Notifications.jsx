import React, { useEffect, useState } from 'react';
import { Card, List, Tag, Typography, Spin, Empty, Badge } from 'antd';
import { CheckCircleOutlined, BellOutlined } from '@ant-design/icons';
import api from '../api/axios';

const { Text } = Typography;

function timeAgo(date) {
  const now  = new Date();
  const diff = Math.floor((now - new Date(date)) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(date).toLocaleDateString('en-GB', { dateStyle: 'medium' });
}

export default function Notifications() {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/vendor/notifications')
      .then(r => setItems(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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
          <BellOutlined style={{ marginRight: 8, color: '#FF383C' }} />
          Notifications
          {items.length > 0 && (
            <Badge count={items.length} style={{ background: '#FF383C', marginLeft: 10, fontSize: 11 }} />
          )}
        </span>
      }
    >
      {items.length > 0 ? (
        <List
          dataSource={items}
          renderItem={item => (
            <List.Item
              style={{
                padding: '14px 16px',
                borderRadius: 10,
                marginBottom: 8,
                background: '#fafafa',
                border: '1px solid #f0f0f0',
                alignItems: 'flex-start',
                gap: 12,
              }}
            >
              <div style={{
                width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                background: 'rgba(255,56,60,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 18 }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#1a1a1a', marginBottom: 2 }}>
                  {item.title}
                </div>
                <div style={{ fontSize: 13, color: '#666' }}>{item.body}</div>
              </div>
              <Text type="secondary" style={{ fontSize: 11, flexShrink: 0, whiteSpace: 'nowrap' }}>
                {timeAgo(item.createdAt)}
              </Text>
            </List.Item>
          )}
          pagination={{ pageSize: 20, showSizeChanger: false }}
        />
      ) : (
        <Empty
          image={<BellOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />}
          description="No notifications yet"
        />
      )}
    </Card>
  );
}
