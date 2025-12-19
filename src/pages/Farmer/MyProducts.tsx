import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Search, LogOut, User, BarChart, ShoppingCart, Package, Layers, Settings, Zap, Star, ChevronDown, DollarSign, TrendingUp, AlertTriangle, ArrowRight, PlusCircle } from 'lucide-react';
import '../../styles/MyProduct.css';
import { useNavigate } from 'react-router-dom';
import { ORDER_STATUS_LABELS } from '../../services/orderService';

// --- IMPORT CÁC MODULE CHỨC NĂNG ---
import ProductManagementSection from './ProductManagementSection'; 
import FarmerOrdersSection from './FarmerOrdersSection';
import OrderShippingDetail from './OrderShippingDetail';
import FarmerReviewsSection from './FarmerReviewsSection';   
import FarmerNotifications from './FarmerNotifications';     
import FarmerReports from './FarmerReports';
import TraceabilityManager from './TraceabilityManager'; 

// -----------------------------------------------------------
// 📚 HELPERS
// -----------------------------------------------------------
const formatCurrency = (amount: number) => Number(amount).toLocaleString('vi-VN') + 'đ';

// Menu cấu hình
const farmerMenu = [
    { name: 'Tổng quan', icon: BarChart, key: 'dashboard' },
    { name: 'Sản phẩm của tôi', icon: Package, key: 'my_products' },
    { name: 'Đơn hàng', icon: ShoppingCart, key: 'orders' },
    { name: 'Mã truy xuất', icon: Zap, key: 'trace_codes' },
    { name: 'Đánh giá', icon: Star, key: 'reviews' },
    { name: 'Báo cáo', icon: DollarSign, key: 'reports' },
    { name: 'Thông báo', icon: Layers, key: 'product_notifications' },
];

// -----------------------------------------------------------
// 🌟 SUB COMPONENTS
// -----------------------------------------------------------

// 1. HEADER
const FarmerHeader: React.FC = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
    };
    const handleMenuClick = (action: string) => {
        setIsMenuOpen(false);
        if (action === 'profile') navigate('/profile');
    };

    return (
        <header className="farmer-header">
            <div className="logo-container">AgriChain <span className="brand-accent">Market</span></div>
            <div className="header-controls">
                <div className="profile-dropdown-container" onClick={() => setIsMenuOpen(v => !v)}>
                    <div className="avatar-placeholder">{user?.fullName?.[0]?.toUpperCase() || 'F'}</div>
                    <span className="username">{user?.fullName || 'Nông dân'} <ChevronDown size={16}/></span>
                    {isMenuOpen && (
                        <div className="profile-dropdown-menu">
                            <div className="dropdown-item" onClick={(e) => { e.stopPropagation(); handleMenuClick('profile'); }}>
                                <User size={18}/> Hồ sơ
                            </div>
                            <div className="dropdown-item text-danger" onClick={(e) => { e.stopPropagation(); handleLogout(); }}>
                                <LogOut size={18}/> Đăng xuất
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

// 2. STAT CARD
const StatCard: React.FC<{ icon: React.ElementType, title: string, value: string | number, color: string, trend?: string }> = ({ icon: Icon, title, value, color, trend }) => (
    <div className={`stat-card ${color}`}>
        <div className="stat-icon-bg"><Icon size={24} /></div>
        <div className="stat-content">
            <p className="stat-title">{title}</p>
            <h3 className="stat-value">{value}</h3>
            {trend && <span className="stat-trend">{trend}</span>}
        </div>
    </div>
);

// 3. OVERVIEW SECTION (LOGIC THẬT - FETCH API)
const FarmerOverviewSection: React.FC<{ sellerId: number, onNavigate: (key: string) => void }> = ({ sellerId, onNavigate }) => {
    
    // --- State dữ liệu thật ---
    const [stats, setStats] = useState({ revenue: 0, pending_orders: 0, total_products: 0, completed_orders: 0 });
    const [recentOrders, setRecentOrders] = useState<any[]>([]);
    const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // --- Fetch dữ liệu khi mount ---
    useEffect(() => {
        if (!sellerId) return;

        const fetchOverviewData = async () => {
            try {
                // 1. Lấy Thống kê tổng quan (Doanh thu, số lượng đơn)
                const statsRes = await fetch(`http://localhost:3000/api/reports/dashboard-stats?seller_id=${sellerId}`);
                const statsData = await statsRes.json();
                setStats(statsData);

                // 2. Lấy Đơn hàng gần đây (Lấy 5 đơn mới nhất)
                const ordersRes = await fetch(`http://localhost:3000/api/orders/by-seller/${sellerId}`);
                const ordersData = await ordersRes.json();
                if (Array.isArray(ordersData)) {
                    setRecentOrders(ordersData.slice(0, 5)); // Lấy top 5
                }

                // 3. Lấy Sản phẩm sắp hết hàng (< 10 đơn vị)
                const productsRes = await fetch(`http://localhost:3000/api/products?seller_id=${sellerId}`);
                const productsData = await productsRes.json();
                if (Array.isArray(productsData)) {
                    const lowStock = productsData.filter((p: any) => p.quantity <= 10 && p.status !== 'deleted');
                    setLowStockProducts(lowStock.slice(0, 5)); // Lấy top 5 cảnh báo
                }

            } catch (error) {
                console.error("Lỗi tải dữ liệu tổng quan:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchOverviewData();
    }, [sellerId]);

    // Badge trạng thái đơn hàng
    const getStatusBadge = (status: string) => {
        const badges: Record<string, JSX.Element> = {
            pending: <span className="badge badge-warning">{ORDER_STATUS_LABELS.pending}</span>,
            processing: <span className="badge badge-info">{ORDER_STATUS_LABELS.processing}</span>,
            shipped: <span className="badge badge-primary">{ORDER_STATUS_LABELS.shipped}</span>,
            delivered: <span className="badge badge-success">{ORDER_STATUS_LABELS.delivered}</span>,
            received: <span className="badge badge-secondary">{ORDER_STATUS_LABELS.received}</span>,
            cancelled: <span className="badge badge-danger">{ORDER_STATUS_LABELS.cancelled}</span>
        };
        return badges[status] || <span>{status}</span>;
    };

    if (loading) return <div className="p-8 text-center text-gray-500">⏳ Đang tải dữ liệu tổng quan...</div>;

    return (
        <div className="dashboard-overview fade-in">
            <div className="overview-header">
                <div>
                    <h2 className="overview-title">Xin chào, Nông dân! 👋</h2>
                    <p className="overview-subtitle">Đây là tình hình kinh doanh thực tế của bạn.</p>
                </div>
                <div className="overview-actions">
                    <button className="btn-primary" onClick={() => onNavigate('my_products')}>
                        <PlusCircle size={18} /> Đăng sản phẩm
                    </button>
                </div>
            </div>

            {/* Stats Grid - Dữ liệu thật */}
            <div className="stats-grid">
                <StatCard 
                    icon={DollarSign} 
                    title="Tổng Doanh thu" 
                    value={formatCurrency(stats.revenue)} 
                    color="green" 
                    trend="Đã hoàn thành" 
                />
                <StatCard 
                    icon={ShoppingCart} 
                    title="Đơn chờ xử lý" 
                    value={stats.pending_orders} 
                    color="orange" 
                    trend="Cần giao gấp" 
                />
                <StatCard 
                    icon={Package} 
                    title="Tổng sản phẩm" 
                    value={stats.total_products} 
                    color="blue" 
                />
                <StatCard 
                    icon={Zap} 
                    title="Đơn hoàn tất" 
                    value={stats.completed_orders} 
                    color="purple" 
                />
            </div>

            <div className="overview-content-split">
                {/* Đơn hàng gần đây - Dữ liệu thật */}
                <div className="card recent-orders-card">
                    <div className="card-header">
                        <h3>Đơn hàng mới nhất</h3>
                        <button className="btn-icon" onClick={() => onNavigate('orders')}><ArrowRight size={16}/></button>
                    </div>
                    <div className="order-list-mini">
                        {recentOrders.length === 0 ? (
                            <div style={{padding: 20, textAlign: 'center', color: '#999'}}>Chưa có đơn hàng nào</div>
                        ) : (
                            recentOrders.map(o => (
                                <div key={o.id} className="mini-order-item">
                                    <div className="order-info">
                                        <span className="order-id">#{o.id}</span>
                                        <span className="order-customer" title={o.shipping_address}>
                                            {o.shipping_address?.split('-')[0] || 'Khách lẻ'}
                                        </span>
                                    </div>
                                    <div className="order-meta">
                                        <span className="order-price">{formatCurrency(Number(o.total_amount))}</span>
                                        <div className="order-status-row">
                                            {getStatusBadge(o.status)}
                                            <span className="order-time">
                                                {new Date(o.created_at).toLocaleDateString('vi-VN')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Panel phải: Cảnh báo tồn kho - Dữ liệu thật */}
                <div className="overview-right-panel">
                    <div className="card alert-card">
                        <div className="card-header text-danger">
                            <h3><AlertTriangle size={20} /> Sắp hết hàng (&le;10)</h3>
                        </div>
                        <ul className="alert-list">
                            {lowStockProducts.length === 0 ? (
                                <li style={{justifyContent:'center', color:'#999'}}>Kho hàng ổn định ✅</li>
                            ) : (
                                lowStockProducts.map((p, idx) => (
                                    <li key={idx}>
                                        <span style={{maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                                            {p.name}
                                        </span>
                                        <span className="stock-count">Còn {p.quantity} {p.unit}</span>
                                    </li>
                                ))
                            )}
                        </ul>
                        {lowStockProducts.length > 0 && (
                            <button className="btn-text" onClick={() => onNavigate('my_products')}>Nhập kho ngay &rarr;</button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// -----------------------------------------------------------
// 🚀 MAIN DASHBOARD COMPONENT
// -----------------------------------------------------------
export default function FarmerDashboard() {
    const [activeMenu, setActiveMenu] = useState('dashboard');
    
    // Helper lấy userId từ localStorage
    const getUserId = () => {
        try {
            const userStr = localStorage.getItem('user');
            return userStr ? Number(JSON.parse(userStr).id) : 0;
        } catch { return 0; }
    };
    const userId = getUserId();

    // --- ROUTER SWITCHER ---
    const renderMainContent = () => {
        switch (activeMenu) {
            case 'dashboard': 
                // ✅ Truyền userId vào component thật
                return <FarmerOverviewSection sellerId={userId} onNavigate={setActiveMenu} />;
            
            case 'my_products': 
                return <ProductManagementSection />;
            
            case 'orders': 
                return <FarmerOrdersSection sellerId={userId} onNavigateToShipping={() => setActiveMenu('shipping')} />;
            
            case 'shipping': 
                return <OrderShippingDetail sellerId={userId} />;
            
            case 'trace_codes': 
                return <TraceabilityManager />;
            
            case 'reviews': 
                return <FarmerReviewsSection sellerId={userId} />;
            
            case 'reports': 
                return <FarmerReports />;
            
            case 'product_notifications': 
                return <FarmerNotifications sellerId={userId} />;
            
            default: 
                return <div className="p-4">Chức năng đang phát triển...</div>;
        }
    };

    return (
        <div className="farmer-dashboard-layout">
            <FarmerHeader />
            <div className="main-content-wrapper">
                <aside className="sidebar">
                    <div className="sidebar-header-title">AgriChain <span className="brand-accent">Market</span></div>
                    <nav className="sidebar-menu">
                        {farmerMenu.map(item => (
                            <div key={item.key} className={`menu-item ${activeMenu === item.key ? 'active' : ''}`} onClick={() => setActiveMenu(item.key)}>
                                <item.icon size={20} className="menu-icon" /><span>{item.name}</span>
                            </div>
                        ))}
                    </nav>
                </aside>
                <main className="dashboard-main">{renderMainContent()}</main>
            </div>
        </div>
    );
}