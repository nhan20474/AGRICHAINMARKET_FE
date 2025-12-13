import React, { useEffect, useState } from 'react';
import { ORDER_STATUS_LABELS, getOrderStatusColor } from '../../services/orderService'; // ✅ Đổi import

interface Props {
  sellerId: number;
  onNavigateToShipping?: () => void; // ✅ Thêm callback
}

interface Order {
  id: number;
  buyer_id: number;
  total_amount: number;
  status: string;
  created_at: string;
  shipping_address?: string;
  items: any[];
}

const FarmerOrdersSection: React.FC<Props> = ({ sellerId, onNavigateToShipping }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrders();
  }, [sellerId]);

  async function fetchOrders() {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/api/orders/by-seller/${sellerId}`);
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Không thể tải đơn hàng');
      console.error(err);
    }
    setLoading(false);
  }

  const getStatusBadge = (status: string) => {
    return (
      <span style={{
        background: getOrderStatusColor(status),
        color: '#fff',
        padding: '4px 12px',
        borderRadius: 12,
        fontSize: 12,
        fontWeight: 600
      }}>
        {ORDER_STATUS_LABELS[status] || status}
      </span>
    );
  };

  if (loading) return <div style={{ padding: 24 }}>Đang tải đơn hàng...</div>;
  if (error) return <div style={{ padding: 24, color: 'red' }}>{error}</div>;

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ marginBottom: 20 }}>Đơn hàng của tôi</h2>
      
      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
          Chưa có đơn hàng nào
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {orders.map(order => (
            <div
              key={order.id}
              style={{
                background: '#fff',
                border: '1px solid #eee',
                borderRadius: 8,
                padding: 20,
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
                paddingBottom: 12,
                borderBottom: '1px solid #f5f5f5'
              }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16 }}>Đơn hàng #{order.id}</h3>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: '#888' }}>
                    {new Date(order.created_at).toLocaleString('vi-VN')}
                  </p>
                </div>
                {getStatusBadge(order.status)}
              </div>

              <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
                <strong>Người mua:</strong> #{order.buyer_id}
              </div>

              {order.shipping_address && (
                <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
                  <strong>Địa chỉ:</strong> {order.shipping_address}
                </div>
              )}

              <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
                <strong>Số sản phẩm:</strong> {order.items?.length || 0}
              </div>

              <div style={{
                marginTop: 12,
                paddingTop: 12,
                borderTop: '1px solid #f5f5f5',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: 16, color: '#666' }}>Tổng tiền:</span>
                <strong style={{ fontSize: 20, color: '#38b000' }}>
                  {Number(order.total_amount).toLocaleString('vi-VN')}đ
                </strong>
              </div>

              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                {/* ❌ XÓA navigate, ✅ DÙNG callback */}
                <button
                  onClick={() => {
                    if (onNavigateToShipping) {
                      onNavigateToShipping(); // Gọi callback để chuyển menu
                    }
                  }}
                  style={{
                    background: '#2196F3',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 600
                  }}
                >
                  Chi tiết
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FarmerOrdersSection;
