import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

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
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId'); // Lấy orderId từ URL
  const [list, setList] = useState<ShippingInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notify, setNotify] = useState('');
  const navigate = useNavigate();

  const [buyerId, setBuyerId] = useState<number | null>(null);
  const [resolvingBuyer, setResolvingBuyer] = useState(true);

// Hàm xác định buyerId - Đơn giản hóa, chỉ dùng localStorage
  const resolveBuyerId = useCallback(async () => {
    setResolvingBuyer(true);
    let found: number | null = null;

    // Lấy từ localStorage
    const userRaw = localStorage.getItem('user');
    if (userRaw) {
        try {
            const u = JSON.parse(userRaw);
            const cand = u?.id ?? u?.buyer_id ?? u?.user_id;
            if (typeof cand === 'number') found = cand;
        } catch {}
    }

    if (found) {
        setBuyerId(found);
        setError('');
    } else {
        setBuyerId(null);
        setError('Vui lòng đăng nhập để xem thông tin vận chuyển.');
    }
    setResolvingBuyer(false);
  }, []);

  // Hàm lấy shipping theo user (thay cho fetch orders + từng shipping)
  const fetchShippingByUser = useCallback(async () => {
    if (!buyerId) return;
    setLoading(true);
    console.log('🔍 Fetching shipping for buyerId:', buyerId, 'orderId:', orderId);
    try {
      const res = await fetch(`${API_BASE}/shipping/by-user/${buyerId}`);
      const data = await res.json().catch(() => []);
      console.log('📦 API Response:', data);
      if (!res.ok || !Array.isArray(data)) {
        setError('Không thể tải danh sách vận chuyển của bạn.');
        setList([]);
      } else {
        // Loại bỏ đơn trùng lặp dựa trên order_id
        const uniqueOrders = data.reduce((acc: ShippingInfo[], current: ShippingInfo) => {
          const exists = acc.find(item => item.order_id === current.order_id);
          if (!exists) {
            acc.push(current);
          }
          return acc;
        }, []);
        
        console.log('📋 Unique orders:', uniqueOrders);
        
        // Nếu có orderId trong URL, chỉ hiển thị đơn đó
        if (orderId) {
          const filtered = uniqueOrders.filter(order => order.order_id === Number(orderId));
          console.log('✅ Filtered for orderId', orderId, ':', filtered);
          setList(filtered);
        } else {
          console.log('✅ Showing all orders');
          setList(uniqueOrders);
        }
      }
    } catch {
      setError('Lỗi mạng khi tải vận chuyển.');
      setList([]);
    }
    setLoading(false);
  }, [buyerId, orderId]);

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
        padding: '28px 32px',
        borderRadius: '12px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        border: '1px solid #f0f0f0'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ margin: 0, color: '#1a1a1a', fontSize: '24px', fontWeight: '600', letterSpacing: '-0.5px' }}>
              {orderId ? `Chi tiết vận chuyển đơn #${orderId}` : 'Theo dõi vận chuyển'}
            </h2>
            <p style={{ margin: '6px 0 0', color: '#666', fontSize: '14px' }}>
              {orderId ? (
                list.length > 0 ? 'Thông tin vận chuyển chi tiết' : 'Không tìm thấy thông tin vận chuyển'
              ) : (
                `${list.length} đơn hàng đang được theo dõi`
              )}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {orderId && (
              <button
                onClick={() => navigate('/shipping-list')}
                style={{
                  background: '#fff',
                  color: '#666',
                  border: '1px solid #e0e0e0',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#f5f5f5';
                  e.currentTarget.style.borderColor = '#999';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = '#fff';
                  e.currentTarget.style.borderColor = '#e0e0e0';
                }}
              >
                ← Quay lại
              </button>
            )}
            <button
              onClick={handleReload}
              style={{
                background: '#fff',
                color: '#666',
                border: '1px solid #e0e0e0',
                padding: '10px 20px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = '#fafafa';
                e.currentTarget.style.borderColor = '#4CAF50';
                e.currentTarget.style.color = '#4CAF50';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = '#fff';
                e.currentTarget.style.borderColor = '#e0e0e0';
                e.currentTarget.style.color = '#666';
              }}
            >
              ↻ Làm mới
            </button>
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
                  padding: '24px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                  border: '1px solid #f0f0f0',
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                  e.currentTarget.style.borderColor = '#e0e0e0';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';
                  e.currentTarget.style.borderColor = '#f0f0f0';
                }}
              >
                {/* Header Card */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #f5f5f5' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#1a1a1a'
                    }}>
                      Đơn hàng #{info.order_id}
                    </span>
                    <span style={{
                      background: statusColor + '15',
                      color: statusColor,
                      padding: '4px 12px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '500'
                    }}>
                      {statusLabels[info.shipping_status || ''] || info.shipping_status}
                    </span>
                  </div>
                </div>

                {/* Info Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '16px'
                }}>
                  {/* Đơn vị vận chuyển */}
                  <div>
                    <div style={{ fontSize: '12px', color: '#999', marginBottom: '6px', fontWeight: '500' }}>
                      Đơn vị vận chuyển
                    </div>
                    <div style={{ fontSize: '15px', color: '#1a1a1a', fontWeight: '500' }}>
                      {info.shipping_company || '---'}
                    </div>
                  </div>

                  {/* Mã vận đơn */}
                  <div>
                    <div style={{ fontSize: '12px', color: '#999', marginBottom: '6px', fontWeight: '500' }}>
                      Mã vận đơn
                    </div>
                    <div style={{
                      fontSize: '15px',
                      color: '#4CAF50',
                      fontWeight: '600',
                      fontFamily: 'monospace'
                    }}>
                      {info.tracking_number || '---'}
                    </div>
                  </div>

                  {/* Ngày giao */}
                  <div>
                    <div style={{ fontSize: '12px', color: '#999', marginBottom: '6px', fontWeight: '500' }}>
                      Ngày giao hàng
                    </div>
                    <div style={{ fontSize: '14px', color: '#1a1a1a', fontWeight: '500' }}>
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
                    <div style={{ fontSize: '12px', color: '#999', marginBottom: '6px', fontWeight: '500' }}>
                      Ngày nhận hàng
                    </div>
                    <div style={{ fontSize: '14px', color: '#1a1a1a', fontWeight: '500' }}>
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
