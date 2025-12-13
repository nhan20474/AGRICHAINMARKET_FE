import React, { useState } from 'react';
import { Search, LogOut, User, BarChart, ShoppingCart, Package, Layers, Settings, Zap, Star, ChevronDown, DollarSign, TrendingUp, AlertTriangle, ArrowRight } from 'lucide-react';
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
import TraceabilityManager from './TraceabilityManager'; // <--- IMPORT MODULE THẬT

// -----------------------------------------------------------
// 📚 DỮ LIỆU & INTERFACE
// -----------------------------------------------------------
interface FarmerStats {
    totalProducts: number;
    traceableBatches: number; 
    pendingOrders: number;
    totalRevenue: number;
}

const farmerStats: FarmerStats = {
    totalProducts: 24,
    traceableBatches: 8,
    pendingOrders: 5,
    totalRevenue: 45000000, 
};

const formatCurrency = (amount: number) => amount.toLocaleString('vi-VN') + 'đ';

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
    const user = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } })();

    const handleLogout = () => { localStorage.clear(); window.location.href = '/login'; };

    const handleMenuClick = (action: string) => {
        setIsMenuOpen(false);
        if (action === 'profile') navigate('/profile');
    };

    return (
        <header className="farmer-header">
            <div className="logo-container">AgriChain <span className="brand-accent">Market</span></div>
            <div className="header-controls">
                <div className="search-bar">
                    <Search size={20} className="search-icon" />
                    <input type="text" placeholder="Tìm kiếm..." />
                </div>
                <div className="profile-dropdown-container" onClick={() => setIsMenuOpen(v => !v)}>
                    <div className="avatar-placeholder">{user?.full_name?.[0]?.toUpperCase() || 'F'}</div>
                    <span className="username">{user?.full_name || 'Nông dân'} <ChevronDown size={16}/></span>
                    {isMenuOpen && (
                        <div className="profile-dropdown-menu">
                            <div className="dropdown-item" onClick={(e) => { e.stopPropagation(); handleMenuClick('profile'); }}>
                                <User size={18}/> Hồ sơ
                            </div>
                            <div className="dropdown-item"><Settings size={18}/> Cài đặt</div>
                            <div style={{height:1, background:'#eee', margin:'4px 0'}}></div>
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

// 3. OVERVIEW SECTION (GIỮ NGUYÊN NHƯ YÊU CẦU)
const FarmerOverviewSection: React.FC<{ stats: FarmerStats, onNavigate: (key: string) => void }> = ({ stats, onNavigate }) => {
    const recentOrders = [
        { id: '#ORD-7829', customer: 'Nguyễn Văn A', total: 500000, status: 'pending', date: '2 phút trước' },
        { id: '#ORD-7830', customer: 'Trần Thị B', total: 1200000, status: 'shipping', date: '15 phút trước' },
    ];
    const lowStock = [{ name: 'Cà chua bi', stock: 5 }, { name: 'Rau cải xanh', stock: 2 }];
    
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

    return (
        <div className="dashboard-overview fade-in">
            <div className="overview-header">
                <div><h2 className="overview-title">Xin chào, Nông trại Xanh! 👋</h2><p className="overview-subtitle">Tổng quan tình hình kinh doanh hôm nay.</p></div>
            </div>
            <div className="stats-grid">
                <StatCard icon={DollarSign} title="Doanh thu tháng" value={formatCurrency(stats.totalRevenue)} color="green" trend="+12% tăng trưởng" />
                <StatCard icon={ShoppingCart} title="Đơn hàng mới" value={stats.pendingOrders} color="orange" trend="Cần xử lý ngay" />
                <StatCard icon={Package} title="Sản phẩm" value={stats.totalProducts} color="blue" />
                <StatCard icon={Zap} title="Lô truy xuất" value={stats.traceableBatches} color="purple" />
            </div>
            <div className="overview-content-split">
                <div className="card chart-card">
                    <div className="card-header"><h3><TrendingUp size={20} /> Biểu đồ doanh thu</h3></div>
                    <div className="chart-placeholder">
                        <div className="bar-chart">
                            {[40, 65, 30, 80, 55, 90, 70].map((h, i) => (
                                <div key={i} className="bar-column"><div className="bar" style={{ height: `${h}%` }}></div><span className="bar-label">T{i+2}</span></div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="overview-right-panel">
                    {lowStock.length > 0 && (
                        <div className="card alert-card">
                            <div className="card-header text-danger"><h3><AlertTriangle size={20} /> Cảnh báo tồn kho</h3></div>
                            <ul className="alert-list">{lowStock.map((p, idx) => (<li key={idx}><span>{p.name}</span><span className="stock-count">Còn {p.stock}</span></li>))}</ul>
                            <button className="btn-text" onClick={() => onNavigate('my_products')}>Quản lý kho &rarr;</button>
                        </div>
                    )}
                    <div className="card recent-orders-card">
                        <div className="card-header"><h3>Đơn vừa qua</h3><button className="btn-icon" onClick={() => onNavigate('orders')}><ArrowRight size={16}/></button></div>
                        <div className="order-list-mini">
                            {recentOrders.map(o => (
                                <div key={o.id} className="mini-order-item">
                                    <div className="order-info"><span className="order-id">{o.id}</span><span className="order-customer">{o.customer}</span></div>
                                    <div className="order-meta"><span className="order-price">{formatCurrency(o.total)}</span><div className="order-status-row">{getStatusBadge(o.status)}</div></div>
                                </div>
                            ))}
                        </div>
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
                return <FarmerOverviewSection stats={farmerStats} onNavigate={setActiveMenu} />;
            
            case 'my_products': 
                return <ProductManagementSection />;
            
            case 'orders': 
                return <FarmerOrdersSection sellerId={userId} onNavigateToShipping={() => setActiveMenu('shipping')} />;
            
            case 'shipping': 
                return <OrderShippingDetail sellerId={userId} />;
            
            // ✅ GỌI MODULE THẬT - KHÔNG DÙNG BẢNG GIẢ NỮA
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