import React, { useEffect, useState } from 'react';
import { Eye, Ban, Search, Filter, RefreshCw } from 'lucide-react';
import { orderService, AdminOrderDetail, OrderItem } from '../../services/orderService';
import '../../styles/AdminOrder.css';

interface AdminOrder {
  id: number;
  buyer_name: string;
  farmer_name: string;
  total_amount: number;
  status: string;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: 'Chờ xử lý', color: '#FFA500' },
  processing: { label: 'Đang xử lý', color: '#3B82F6' },
  shipped: { label: 'Đang giao hàng', color: '#8B5CF6' },
  delivered: { label: 'Đã giao hàng', color: '#10B981' },
  cancelled: { label: 'Đã hủy', color: '#EF4444' },
};

const AdminOrderManager: React.FC = () => {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<AdminOrderDetail | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [showDetail, setShowDetail] = useState(false);


const fetchOrders = async () => {
  const adminIdRaw = localStorage.getItem('userId');

    if (!adminIdRaw) {
    alert('Vui lòng đăng nhập bằng tài khoản Admin');
    setLoading(false);
    return;
  }

  const adminId = Number(adminIdRaw);

  setLoading(true);
  try {
    const data = await orderService.adminGetOrders(adminId);

    const mapped: AdminOrder[] = data.map((order: any) => ({
      id: order.id,
      buyer_name: order.buyer_name || '---',
      farmer_name: order.farmer_name || '---',
      total_amount: order.total_amount,
      status: order.status,
      created_at: order.created_at
    }));

    setOrders(mapped);
  } catch (err: any) {
    console.error('Admin load orders error:', err.message);
    alert(err.message || 'Lỗi tải đơn hàng');
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  const rawRole = localStorage.getItem('role');
  const userId = localStorage.getItem('userId');

  if (!userId) {
    alert('⚠️ Không tìm thấy userId – vui lòng đăng nhập lại');
    return;
  }

  if (!rawRole) {
    alert('⚠️ Không tìm thấy role – vui lòng đăng nhập lại');
    return;
  }

    const role = rawRole.trim().toLowerCase();

    if (role !== 'admin') {
      alert(`❌ Role hiện tại = "${rawRole}" (không phải admin)`);
      return;
    }

    fetchOrders();
  }, []);


  const handleCancelOrder = async (orderId: number) => {
    const adminId = Number(localStorage.getItem('userId'));
    if (!adminId) {
      alert('Không xác định được Admin');
      return;
    }
    if (!window.confirm(`Hủy đơn hàng #${orderId}?`)) return;
    await orderService.adminCancelOrder(adminId, orderId);
    fetchOrders();
  };

    const viewOrderDetail = async (orderId: number) => {
    const adminId = Number(localStorage.getItem('userId'));
    if (!adminId) {
      alert('Không xác định được Admin');
      return;
    }

    try {
      const res = await orderService.adminGetOrderDetail(adminId, orderId);
      setSelectedOrder(res.order);
      setOrderItems(res.items);
      setShowDetail(true);
    } catch (err) {
      alert('Không thể tải chi tiết đơn hàng');
    }
  };


    const filteredOrders = orders.filter(o => {
    const matchStatus = filterStatus === 'all' || o.status === filterStatus;
    const keyword = searchTerm.toLowerCase();

    const matchSearch =
      o.id.toString().includes(keyword) ||
      o.buyer_name.toLowerCase().includes(keyword) ||
      o.farmer_name.toLowerCase().includes(keyword);

    return matchStatus && matchSearch;
  });

  return (
    <div className="admin-order-page">
      {/* ===== HEADER ===== */}
      <div className="admin-order-header-card">
        <div className="header-content">
          <div>
            <h1 className="page-title">📦 Quản lý đơn hàng</h1>
            <p className="page-subtitle">Theo dõi và quản lý tất cả đơn hàng trên sàn</p>
          </div>
          <button className="btn-refresh-modern" onClick={fetchOrders} title="Làm mới">
            <RefreshCw size={20} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* ===== TOOLBAR ===== */}
      <div className="admin-order-toolbar-modern">
        <div className="search-box-modern">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="🔍 Tìm theo mã đơn, người mua, người bán..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-box-modern">
          <Filter size={20} className="filter-icon" />
          <select 
            value={filterStatus} 
            onChange={e => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">📋 Tất cả trạng thái</option>
            <option value="pending">⏳ Chờ xử lý</option>
            <option value="processing">⚙️ Đang xử lý</option>
            <option value="shipped">🚚 Đang giao</option>
            <option value="delivered">✅ Đã giao</option>
            <option value="cancelled">❌ Đã hủy</option>
          </select>
        </div>

        <div className="filter-info">
          {filteredOrders.length} kết quả
        </div>
      </div>

      {/* ===== TABLE ===== */}
      <div className="admin-order-table-wrapper-modern">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>Không có dữ liệu</h3>
            <p>Không tìm thấy đơn hàng phù hợp với bộ lọc của bạn</p>
          </div>
        ) : (
          <table className="admin-order-table-modern">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Người mua</th>
                <th>Người bán</th>
                <th>Ngày đặt</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => (
                <tr key={order.id} className="order-row">
                  <td className="order-id-cell">
                    <span className="order-id-badge">#{order.id}</span>
                  </td>
                  <td className="buyer-cell">{order.buyer_name}</td>
                  <td className="seller-cell">{order.farmer_name}</td>
                  <td className="date-cell">
                    {new Date(order.created_at).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="amount-cell">
                    <span className="amount-value">
                      {Number(order.total_amount).toLocaleString('vi-VN')}đ
                    </span>
                  </td>
                  <td className="status-cell">
                    <span 
                      className="status-badge-modern"
                      style={{ 
                        backgroundColor: `${STATUS_CONFIG[order.status]?.color}20`,
                        borderColor: STATUS_CONFIG[order.status]?.color,
                        color: STATUS_CONFIG[order.status]?.color
                      }}
                    >
                      {STATUS_CONFIG[order.status]?.label || order.status}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <div className="action-buttons-modern">
                      <button
                        className="btn-view-modern"
                        title="Xem chi tiết"
                        onClick={() => viewOrderDetail(order.id)}
                      >
                        <Eye size={18} />
                      </button>

                      {order.status !== 'delivered' && order.status !== 'cancelled' && (
                        <button
                          className="btn-cancel-modern"
                          title="Hủy đơn"
                          onClick={() => handleCancelOrder(order.id)}
                        >
                          <Ban size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table> 
        )}
            {showDetail && selectedOrder && (
              <div className="modal-overlay" onClick={() => setShowDetail(false)}>
                <div className="modal-modern" onClick={e => e.stopPropagation()}>
                  {/* Header */}
                  <div className="modal-header">
                    <h2 className="modal-title">📋 Chi tiết đơn hàng #{selectedOrder.id}</h2>
                    <button 
                      className="modal-close-btn"
                      onClick={() => setShowDetail(false)}
                      title="Đóng"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Content */}
                  <div className="modal-content">
                    {/* Order Info Section */}
                    <div className="info-section">
                      <h3 className="section-title">👤 Thông tin đơn hàng</h3>
                      <div className="info-grid">
                        <div className="info-item">
                          <label>Người mua</label>
                          <p className="info-value">{selectedOrder.buyer_name}</p>
                        </div>
                        <div className="info-item">
                          <label>Địa chỉ giao hàng</label>
                          <p className="info-value">{selectedOrder.shipping_address}</p>
                        </div>
                        <div className="info-item">
                          <label>Trạng thái đơn</label>
                          <span 
                            className="status-badge-detail"
                            style={{ 
                              backgroundColor: `${STATUS_CONFIG[selectedOrder.status]?.color}20`,
                              borderColor: STATUS_CONFIG[selectedOrder.status]?.color,
                              color: STATUS_CONFIG[selectedOrder.status]?.color
                            }}
                          >
                            {STATUS_CONFIG[selectedOrder.status]?.label || selectedOrder.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="modal-divider"></div>

                    {/* Products Section */}
                    <div className="info-section">
                      <h3 className="section-title">📦 Sản phẩm trong đơn</h3>
                      <div className="products-list">
                        {orderItems.length === 0 ? (
                          <p className="no-items">Không có sản phẩm nào</p>
                        ) : (
                          orderItems.map((item, index) => (
                            <div key={item.id} className="product-item">
                              <div className="product-header">
                                <span className="product-index">{index + 1}</span>
                                <h4 className="product-name">{item.product_name}</h4>
                              </div>
                              <div className="product-details">
                                <div className="detail-row">
                                  <span className="detail-label">Số lượng:</span>
                                  <span className="detail-value quantity">{item.quantity}</span>
                                </div>
                                <div className="detail-row">
                                  <span className="detail-label">Giá/SP:</span>
                                  <span className="detail-value price">
                                    {Number(item.price_per_item).toLocaleString('vi-VN')}đ
                                  </span>
                                </div>
                                <div className="detail-row subtotal">
                                  <span className="detail-label">Thành tiền:</span>
                                  <span className="detail-value total">
                                    {Number(Number(item.price_per_item) * item.quantity).toLocaleString('vi-VN')}đ
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="modal-divider"></div>

                    {/* Total Section */}
                    <div className="total-section">
                      <div className="total-row">
                        <span className="total-label">Tổng cộng:</span>
                        <span className="total-amount">
                          {Number(selectedOrder.total_amount).toLocaleString('vi-VN')}đ
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="modal-footer">
                    <button 
                      className="btn-close-modal"
                      onClick={() => setShowDetail(false)}
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              </div>
            )}
      </div>
    </div>
  );
};

export default AdminOrderManager;
