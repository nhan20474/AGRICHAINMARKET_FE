import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// Khai báo ShippingInfo (nếu chưa import từ service)
interface ShippingInfo {
  order_id?: number;
  shipping_company?: string;
  tracking_number?: string;
  shipping_status?: string;
  shipped_at?: string;
  delivered_at?: string;
  updated_at?: string; // thêm nếu backend trả về
}

const statusLabels: Record<string, string> = {
  pending: 'Chờ xử lý',
  processing: 'Đang xử lý',
  shipped: 'Đã giao cho đơn vị vận chuyển',
  delivered: 'Đã giao hàng',
  received: 'Khách đã nhận',
  cancelled: 'Đã hủy'
};

const API_BASE = 'http://localhost:3000/api'; // bổ sung nếu chưa có

const ShippingList: React.FC = () => {
  const [list, setList] = useState<ShippingInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notify, setNotify] = useState('');
  const navigate = useNavigate();

  const [buyerId, setBuyerId] = useState<number | null>(null);
  const [resolvingBuyer, setResolvingBuyer] = useState(true);

  // Hàm xác định buyerId
  const resolveBuyerId = useCallback(async () => {
    setResolvingBuyer(true);
    let found: number | null = null;

    // 1. Thử key trực tiếp
    const raw = localStorage.getItem('buyerId');
    if (raw) {
      const n = parseInt(raw, 10);
      if (!isNaN(n)) found = n;
    }

    // 2. Thử đối tượng user chung
    if (!found) {
      const userRaw = localStorage.getItem('user');
      if (userRaw) {
        try {
          const u = JSON.parse(userRaw);
          const cand = u?.buyer_id ?? u?.id ?? u?.user_id;
          if (typeof cand === 'number') found = cand;
        } catch {}
      }
    }

    // 3. Thử gọi /api/auth/me nếu vẫn chưa
    if (!found) {
      try {
        const r = await fetch(`${API_BASE}/auth/me`, { credentials: 'include' });
        if (r.ok) {
          const me = await r.json().catch(() => ({}));
          const cand = me?.buyer_id ?? me?.id ?? me?.user_id;
          if (typeof cand === 'number') found = cand;
        }
      } catch {}
    }

    if (found) {
      setBuyerId(found);
      localStorage.setItem('buyerId', String(found));
      setError('');
    } else {
      setBuyerId(null);
      setError('Chưa xác định được tài khoản người mua (buyerId). Vui lòng đăng nhập.');
    }
    setResolvingBuyer(false);
  }, []);

  // Hàm lấy shipping theo user (thay cho fetch orders + từng shipping)
  const fetchShippingByUser = useCallback(async () => {
    if (!buyerId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/shipping/by-user/${buyerId}`);
      const data = await res.json().catch(() => []);
      if (!res.ok || !Array.isArray(data)) {
        setError('Không thể tải danh sách vận chuyển của bạn.');
        setList([]);
      } else {
        setList(data);
      }
    } catch {
      setError('Lỗi mạng khi tải vận chuyển.');
      setList([]);
    }
    setLoading(false);
  }, [buyerId]);

  // Load shipping khi có buyerId
  useEffect(() => {
    resolveBuyerId();
  }, [resolveBuyerId]);

  useEffect(() => {
    if (!resolvingBuyer && buyerId) {
      fetchShippingByUser();
    }
  }, [resolvingBuyer, buyerId, fetchShippingByUser]);

  // Nút tải lại
  function handleReload() {
    setError('');
    setNotify('');
    if (!buyerId) resolveBuyerId();
    else fetchShippingByUser();
  }

  if (resolvingBuyer) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
        fontSize: '16px',
        color: '#666'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔄</div>
          Đang xác định người dùng...
        </div>
      </div>
    );
  }

  if (!buyerId) {
    return (
      <div style={{
        maxWidth: '600px',
        margin: '60px auto',
        padding: '40px',
        background: '#fff',
        borderRadius: '12px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '64px', marginBottom: '24px' }}>📦</div>
        <h2 style={{ marginBottom: '16px', color: '#333' }}>Danh sách vận chuyển</h2>
        <p style={{ color: '#666', marginBottom: '24px', lineHeight: '1.6' }}>
          {error || 'Vui lòng đăng nhập để xem thông tin vận chuyển.'}
        </p>
        <button
          style={{
            background: '#38b000',
            color: '#fff',
            border: 'none',
            padding: '12px 32px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '500',
            transition: 'all 0.3s'
          }}
          onClick={handleReload}
          onMouseOver={(e) => e.currentTarget.style.background = '#2d8f00'}
          onMouseOut={(e) => e.currentTarget.style.background = '#38b000'}
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '24px'
    }}>
      {/* Header */}
      <div style={{
        background: '#fff',
        padding: '24px',
        borderRadius: '12px',
        marginBottom: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ margin: 0, color: '#333', fontSize: '24px', fontWeight: '600' }}>
              📦 Danh sách vận chuyển
            </h2>
            <p style={{ margin: '8px 0 0', color: '#666', fontSize: '14px' }}>
              Theo dõi tình trạng giao hàng của bạn
            </p>
          </div>
         
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          background: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px',
          color: '#856404',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style={{ fontSize: '24px' }}>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && list.length === 0 && (
        <div style={{
          background: '#fff',
          borderRadius: '12px',
          padding: '60px 24px',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📭</div>
          <h3 style={{ color: '#666', fontWeight: '500', marginBottom: '8px' }}>
            Chưa có đơn hàng nào
          </h3>
          <p style={{ color: '#999', fontSize: '14px' }}>
            Bạn chưa có bản ghi vận chuyển nào. Hãy đặt hàng để bắt đầu!
          </p>
        </div>
      )}

      {/* Shipping Cards */}
      {!loading && list.length > 0 && (
        <div style={{ display: 'grid', gap: '16px' }}>
          {list.map((info, idx) => {
            const statusColor = 
              info.shipping_status === 'delivered' || info.shipping_status === 'received' ? '#38b000' :
              info.shipping_status === 'shipped' ? '#1890ff' :
              info.shipping_status === 'cancelled' ? '#f44336' :
              '#ff9800';

            return (
              <div
                key={`${info.order_id ?? 'noid'}-${idx}`}
                style={{
                  background: '#fff',
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  border: '1px solid #f0f0f0',
                  transition: 'all 0.3s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* Header Card */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      background: '#f5f5f5',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontWeight: '600',
                      color: '#333'
                    }}>
                      Đơn hàng #{info.order_id}
                    </div>
                    <div style={{
                      background: statusColor,
                      color: '#fff',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '500'
                    }}>
                      {statusLabels[info.shipping_status || ''] || info.shipping_status}
                    </div>
                  </div>
                </div>

                {/* Info Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '16px'
                }}>
                  {/* Đơn vị vận chuyển */}
                  <div>
                    <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px', fontWeight: '500' }}>
                      🚚 ĐƠN VỊ VẬN CHUYỂN
                    </div>
                    <div style={{ fontSize: '15px', color: '#333', fontWeight: '500' }}>
                      {info.shipping_company || '---'}
                    </div>
                  </div>

                  {/* Mã vận đơn */}
                  <div>
                    <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px', fontWeight: '500' }}>
                      📋 MÃ VẬN ĐƠN
                    </div>
                    <div style={{
                      fontSize: '15px',
                      color: '#1890ff',
                      fontWeight: '600',
                      fontFamily: 'monospace'
                    }}>
                      {info.tracking_number || '---'}
                    </div>
                  </div>

                  {/* Ngày giao */}
                  <div>
                    <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px', fontWeight: '500' }}>
                      📅 NGÀY GIAO HÀNG
                    </div>
                    <div style={{ fontSize: '14px', color: '#333' }}>
                      {info.shipped_at ? new Date(info.shipped_at).toLocaleString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : '---'}
                    </div>
                  </div>

                  {/* Ngày nhận */}
                  <div>
                    <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px', fontWeight: '500' }}>
                      ✅ NGÀY NHẬN HÀNG
                    </div>
                    <div style={{ fontSize: '14px', color: '#333' }}>
                      {info.delivered_at ? new Date(info.delivered_at).toLocaleString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : '---'}
                    </div>
                  </div>
                </div>

                {/* Footer - Last update */}
                {info.updated_at && (
                  <div style={{
                    marginTop: '16px',
                    paddingTop: '16px',
                    borderTop: '1px solid #f0f0f0',
                    fontSize: '12px',
                    color: '#999'
                  }}>
                    Cập nhật lần cuối: {new Date(info.updated_at).toLocaleString('vi-VN')}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div style={{
          background: '#fff',
          borderRadius: '12px',
          padding: '60px 24px',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <p style={{ color: '#666', fontSize: '16px' }}>Đang tải thông tin vận chuyển...</p>
        </div>
      )}

      {/* Notification */}
      {notify && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: notify.includes('thành công') ? '#38b000' : '#f44336',
          color: '#fff',
          padding: '16px 24px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          zIndex: 1000,
          animation: 'slideIn 0.3s ease'
        }}>
          <span style={{ fontSize: '20px' }}>{notify.includes('thành công') ? '✔' : '✖'}</span>
          <span style={{ fontWeight: '500' }}>{notify}</span>
        </div>
      )}
    </div>
  );
};

export default ShippingList;
