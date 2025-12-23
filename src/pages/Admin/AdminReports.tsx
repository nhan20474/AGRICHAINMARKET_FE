import React, { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Calendar, TrendingUp, Users, Package, AlertTriangle } from 'lucide-react';
import { 
  ReportService, 
  AdminDashboardStats, 
  SalesTrendItem, 
  TopProductItem 
} from '../../services/reportService'; 
import SimpleBarChart from '../../components/SimpleBarChart'; 
import '../../styles/AdminReports.css';

const AdminReports: React.FC = () => {
  // --- State ---
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [trend, setTrend] = useState<SalesTrendItem[]>([]);
  const [topProducts, setTopProducts] = useState<TopProductItem[]>([]);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [trendType, setTrendType] = useState<'daily' | 'monthly'>('daily');
  
  // Mặc định lấy dữ liệu tháng hiện tại
  const [dateFilter, setDateFilter] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], // Ngày 1 tháng này
    to: new Date().toISOString().split('T')[0] // Hôm nay
  });

  // --- Helpers ---
  const formatCurrency = (value: number | string) => {
    return Number(value).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
  };

  // --- Fetch Data ---
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // Gọi song song để tiết kiệm thời gian
      const [dashboardData, topProdData] = await Promise.all([
        ReportService.getAdminDashboard(),
        ReportService.getAdminTopProducts(5)
      ]);

      setStats(dashboardData);
      setTopProducts(topProdData);
    } catch (error) {
      console.error("Lỗi tải dashboard:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTrendData = useCallback(async () => {
    try {
      const trendData = await ReportService.getAdminTrend(trendType, dateFilter.from, dateFilter.to);
      setTrend(trendData);
    } catch (error) {
      console.error("Lỗi tải biểu đồ:", error);
    }
  }, [trendType, dateFilter]);

  // --- Effects ---
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    fetchTrendData();
  }, [fetchTrendData]);

  // --- Handlers ---
  const handleRefresh = () => {
    fetchDashboardData();
    fetchTrendData();
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateFilter(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  if (loading && !stats) {
    return <div className="loading-screen">Đang tải dữ liệu báo cáo...</div>;
  }

  return (
    <div className="admin-reports-container">
      {/* 1. Header & Toolbar */}
      <div className="reports-header">
        <h1 className="page-title">Báo Cáo Thống Kê</h1>
        <button onClick={handleRefresh} className="btn-refresh">
          <RefreshCw size={18} /> Cập nhật
        </button>
      </div>

      {/* 2. Dashboard Cards Overview */}
      {stats && (
        <div className="stats-grid">
          {/* Doanh thu */}
          <div className="stat-card revenue">
            <div className="stat-icon"><TrendingUp /></div>
            <div className="stat-info">
              <h3>Tổng Doanh Thu</h3>
              <p className="stat-value">{formatCurrency(stats.total_revenue)}</p>
              <span className="stat-sub">Đã hoàn thành</span>
            </div>
          </div>

          {/* Đơn hàng */}
          <div className="stat-card orders">
            <div className="stat-icon"><Package /></div>
            <div className="stat-info">
              <h3>Đơn Hàng</h3>
              <p className="stat-value">{stats.total_orders}</p>
              <div className="stat-details">
                <span className="success">{stats.completed_orders} Thành công</span>
                <span className="warning">{stats.pending_orders} Chờ xử lý</span>
              </div>
            </div>
          </div>

          {/* Người dùng */}
          <div className="stat-card users">
            <div className="stat-icon"><Users /></div>
            <div className="stat-info">
              <h3>Người Dùng</h3>
              <p className="stat-value">{stats.total_users}</p>
              <div className="stat-details">
                <span>{stats.total_buyers} Mua</span> / <span>{stats.total_sellers} Bán</span>
              </div>
            </div>
          </div>

          {/* Cảnh báo tồn kho */}
          <div className="stat-card warning">
            <div className="stat-icon"><AlertTriangle /></div>
            <div className="stat-info">
              <h3>Cảnh Báo Kho</h3>
              <p className="stat-value">{stats.low_stock_products}</p>
              <span className="stat-sub">Sản phẩm sắp hết</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Main Content: Chart & Top Products */}
      <div className="reports-content-grid">
        
        {/* Left Column: Chart */}
        <div className="chart-section">
          <div className="section-header">
            <h2>Biểu Đồ Doanh Thu</h2>
            <div className="chart-controls">
              <select 
                value={trendType} 
                onChange={(e) => setTrendType(e.target.value as 'daily' | 'monthly')}
                className="select-input"
              >
                <option value="daily">Theo Ngày</option>
                <option value="monthly">Theo Tháng</option>
              </select>
              <div className="date-inputs">
                <input 
                  type="date" 
                  name="from" 
                  value={dateFilter.from} 
                  onChange={handleDateChange} 
                />
                <span>—</span>
                <input 
                  type="date" 
                  name="to" 
                  value={dateFilter.to} 
                  onChange={handleDateChange} 
                />
              </div>
            </div>
          </div>
          
          <div className="chart-container">
            {/* Component SimpleBarChart của bạn */}
            {/* Giả sử nó nhận data, labelKey và valueKey */}
                <SimpleBarChart 
                    data={trend.map(item => ({
                    label: item.label,
                    value: Number(item.total_revenue), // Chuyển đổi 'total_revenue' thành 'value'
                    tooltip: `Doanh thu: ${Number(item.total_revenue).toLocaleString('vi-VN')}đ` // Tạo tooltip
                    }))}
                    // Vì SimpleBarChart của bạn đang fix cứng kiểu dữ liệu đầu vào
                    // nên có thể không cần props xAxisKey hay barKey nữa (tùy code component của bạn)
                    color="#4CAF50"
                />
            {trend.length === 0 && <p className="no-data">Không có dữ liệu trong khoảng thời gian này.</p>}
          </div>
        </div>

        {/* Right Column: Top Products */}
        <div className="top-products-section">
          <h2>Top 5 Sản Phẩm Bán Chạy</h2>
          <div className="products-list">
            {topProducts.length > 0 ? (
              <table className="products-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th className="text-right">Đã bán</th>
                    <th className="text-right">Doanh thu</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((prod) => (
                    <tr key={prod.product_id}>
                      <td>#{prod.product_id}</td>
                      <td className="text-right">{prod.total_sold}</td>
                      <td className="text-right revenue-text">
                        {formatCurrency(prod.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="no-data">Chưa có dữ liệu sản phẩm.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminReports;