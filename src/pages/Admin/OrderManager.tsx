import React, { useEffect, useState } from 'react';
import { Eye, Ban, Search, Filter, RefreshCw } from 'lucide-react';
import { orderService } from '../../services/orderService';
import '../../styles/AdminOrder.css'; // Tạo file css này ở bước 4

interface AdminOrder {
  id: number;
  buyer_name: string;
  seller_name: string;
  total_amount: number;
  status: string;
  created_at: string;
}

const statusMap: any = {
  pending: { label: 'Chờ xác nhận', color: '#ff9800', bg: '#fff7e6' },
  confirmed: { label: 'Đã xác nhận', color: '#2196f3', bg: '#e3f2fd' },
  shipping: { label: 'Đang giao', color: '#10b981', bg: '#d1fae5' },
  delivered: { label: 'Thành công', color: '#38b000', bg: '#f6ffed' },
  cancelled: { label: 'Đã hủy', color: '#ef4444', bg: '#fee2e2' },
};

const AdminOrderManager: React.FC = () => {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await orderService.adminGetAll();
      setOrders(data);
    } catch (error) {
      console.error(error);
      alert('Lỗi tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Xử lý Hủy đơn (Quyền Admin)
  const handleCancelOrder = async (id: number) => {
    if (window.confirm(`Bạn có chắc chắn muốn hủy đơn hàng #${id} không? Hành động này không thể hoàn tác.`)) {
      try {
        await orderService.adminCancelOrder(id);
        alert('Đã hủy đơn hàng thành công!');
        fetchOrders(); // Load lại dữ liệu
      } catch (error) {
        alert('Có lỗi xảy ra khi hủy đơn.');
      }
    }
  };

  // Logic lọc dữ liệu
  const filteredOrders = orders.filter(order => {
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    const matchesSearch = 
      order.buyer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.seller_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toString().includes(searchTerm);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="admin-order-page">
      <div className="page-header">
        <h2>Quản lý Đơn hàng (Toàn sàn)</h2>
        <button className="btn-refresh" onClick={fetchOrders}><RefreshCw size={18} /> Làm mới</button>
      </div>

      {/* --- THANH CÔNG CỤ (FILTER & SEARCH) --- */}
      <div className="toolbar">
        <div className="search-box">
          <Search size={18} color="#666" />
          <input 
            type="text" 
            placeholder="Tìm theo Mã đơn, Tên người mua/bán..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-box">
          <Filter size={18} color="#666" />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Chờ xác nhận</option>
            <option value="confirmed">Đã xác nhận</option>
            <option value="shipping">Đang giao hàng</option>
            <option value="delivered">Giao thành công</option>
            <option value="cancelled">Đã hủy</option>
          </select>
        </div>
      </div>

      {/* --- BẢNG DỮ LIỆU --- */}
      <div className="table-container">
        {loading ? (
          <div className="loading-text">Đang tải dữ liệu...</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Người mua</th>
                <th>Người bán (Farmer)</th>
                <th>Ngày đặt</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length > 0 ? (
                filteredOrders.map(order => {
                  const statusInfo = statusMap[order.status] || { label: order.status, color: '#333', bg: '#eee' };
                  return (
                    <tr key={order.id}>
                      <td><span className="order-id">#{order.id}</span></td>
                      <td>
                        <div className="user-info">
                          <span className="user-name">{order.buyer_name}</span>
                        </div>
                      </td>
                      <td>
                        <div className="user-info">
                          <span className="shop-name">{order.seller_name}</span>
                        </div>
                      </td>
                      <td>{new Date(order.created_at).toLocaleDateString('vi-VN')}</td>
                      <td style={{ fontWeight: 'bold', color: '#d32f2f' }}>
                        {Number(order.total_amount).toLocaleString('vi-VN')}đ
                      </td>
                      <td>
                        <span 
                          className="status-badge" 
                          style={{ color: statusInfo.color, backgroundColor: statusInfo.bg }}
                        >
                          {statusInfo.label}
                        </span>
                      </td>
                      <td>
                        <div className="actions">
                          {/* Nút Xem chi tiết (Bạn có thể link tới trang detail nếu muốn) */}
                          <button className="btn-icon view" title="Xem chi tiết">
                            <Eye size={18} />
                          </button>
                          
                          {/* Nút Hủy đơn (Chỉ hiện khi đơn chưa hoàn thành/đã hủy) */}
                          {order.status !== 'delivered' && order.status !== 'cancelled' && (
                            <button 
                              className="btn-icon cancel" 
                              title="Hủy đơn hàng này"
                              onClick={() => handleCancelOrder(order.id)}
                            >
                              <Ban size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="no-data">Không tìm thấy đơn hàng nào.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminOrderManager;