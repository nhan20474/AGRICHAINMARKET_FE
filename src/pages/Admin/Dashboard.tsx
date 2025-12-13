import React, { useState, useRef, useEffect } from 'react'; // Thêm useRef, useEffect
import { 
    Search, Bell, ChevronDown, Users, Box, ShoppingCart, 
    DollarSign, Clock, Settings, BarChart, Menu, LogOut, User , Layers, Tag
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/Dashboard.css'; 

// --- IMPORTS CÁC COMPONENT CON ---
import UserManager from './UserManager';
import ProductManager from './ProductManager';
import PendingFarmers from './PendingFarmers';
import Categories from './Categories';
import BroadcastNotification from './BroadcastNotification';
import PanelManager from './PanelManager';
import DiscountManager from './DiscountManager';
import AdminReports from './AdminReports';

// -----------------------------------------------------------
// 📚 INTERFACES CHUNG
// -----------------------------------------------------------

interface Stats {
    totalUsers: number;
    totalFarmers: number;
    totalConsumers: number;
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
    pendingOrders: number;
    activeProducts: number;
}

interface Order { 
    id: string, 
    customer: string, 
    total: number, 
    status: 'pending' | 'completed' | 'shipping', 
    date: string 
}

// -----------------------------------------------------------
// DỮ LIỆU KHỞI TẠO
// -----------------------------------------------------------

const initialStats: Stats = {
    totalUsers: 245,
    totalFarmers: 112,
    totalConsumers: 133,
    totalProducts: 320,
    totalOrders: 2340,
    totalRevenue: 125000000, 
    pendingOrders: 12,
    activeProducts: 300
};

const initialRecentOrders: Order[] = [
    { id: 'ORD001', customer: 'Nguyễn Văn A', total: 350000, status: 'pending', date: '2025-07-15' },
    { id: 'ORD002', customer: 'Trần Thị B', total: 520000, status: 'completed', date: '2025-07-15' },
    { id: 'ORD003', customer: 'Lê Văn C', total: 180000, status: 'shipping', date: '2025-07-14' },
    { id: 'ORD004', customer: 'Phạm Thị D', total: 95000, status: 'completed', date: '2025-07-14' },
];

const formatCurrency = (amount: number) => amount.toLocaleString('vi-VN') + 'đ';

// Cấu trúc menu Sidebar
const menuItems = [
    { name: 'Tổng quan', icon: BarChart, key: 'dashboard', sub: null },
    { name: 'Quản lý người dùng', icon: Users, key: 'users', sub: [
        { name: 'Danh sách người dùng', key: 'users_list' },
        { name: 'Phân quyền người dùng', key: 'roles' },
    ]},
    { name: 'Quản lý sản phẩm', icon: ShoppingCart, key: 'products', sub: [
        { name: 'Danh mục sản phẩm', key: 'categories' },
        { name: 'Danh sách sản phẩm', key: 'product_list' },
    ]},
    { name: 'Quản lý đơn hàng', icon: Box, key: 'orders', sub: [
        { name: 'Đơn hàng đang chờ', key: 'pending_orders' },
        { name: 'Đơn hàng đã xử lý', key: 'processed_orders' },
    ]},
    { name: 'Quản lý khuyến mãi', icon: Tag, key: 'discounts', sub: null },
    { name: 'Giao diện & Panels', icon: Layers, key: 'ui_settings', sub: [
        { name: 'Quản lý Panels', key: 'panel_manager' },
    ]},
    { name: 'Doanh thu & Báo cáo', icon: DollarSign, key: 'reports', sub: [
        { name: 'Biểu đồ doanh thu', key: 'revenue_chart' },
    ]},
    { name: 'Gửi thông báo hệ thống', icon: Bell, key: 'broadcast', sub: null }, 
];

export default function AdminDashboard() {
    const [activeMenu, setActiveMenu] = useState('dashboard');
    const [openSubMenu, setOpenSubMenu] = useState<string | null>(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    
    const [stats] = useState<Stats>(initialStats);
    const [recentOrders] = useState<Order[]>(initialRecentOrders);
    const navigate = useNavigate();
    
    const toggleSubMenu = (key: string) => {
        setOpenSubMenu(openSubMenu === key ? null : key);
    };
    
    // RENDER LOGIC
    const renderSidebarMenu = () => (
        <nav className="sidebar-menu">
            {menuItems.map(item => (
                <React.Fragment key={item.key}>
                    <div 
                        className={`menu-item ${activeMenu === item.key || (item.sub && openSubMenu === item.key) ? 'active' : ''} ${item.sub ? 'has-submenu' : ''}`}
                        onClick={() => {
                            if (item.sub) {
                                toggleSubMenu(item.key);
                            } else {
                                setActiveMenu(item.key);
                                setOpenSubMenu(null);
                            }
                        }}
                    >
                        <item.icon size={20} className="menu-icon" />
                        <span className="menu-text">{item.name}</span>
                        {item.sub && <ChevronDown size={16} className={`chevron ${openSubMenu === item.key ? 'open' : ''}`} />}
                    </div>

                    {item.sub && (
                        <div className={`submenu ${openSubMenu === item.key ? 'open' : ''}`}>
                            {item.sub.map(subItem => (
                                <div 
                                    key={subItem.key}
                                    className={`submenu-item ${activeMenu === subItem.key ? 'active' : ''}`}
                                    onClick={() => setActiveMenu(subItem.key)}
                                >
                                    <span className="menu-text">{subItem.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </React.Fragment>
            ))}
        </nav>
    );

    const renderMainContent = () => {
        if (activeMenu === 'users_list') return <UserManager />;
        if (activeMenu === 'categories') return <Categories />;
        if (activeMenu === 'product_list') return <ProductManager />;
        if (activeMenu === 'roles') return <PendingFarmers />;
        if (activeMenu === 'broadcast') return <BroadcastNotification />;
        if (activeMenu === 'panel_manager') return <PanelManager />;
        if (activeMenu === 'discounts') return <DiscountManager />;
        if (activeMenu === 'revenue_chart' || activeMenu === 'transaction_report') {
            return <AdminReports />;
        }
        if (activeMenu !== 'dashboard') {
             const menuItem = menuItems.find(i => i.key === activeMenu) || menuItems.flatMap(i => i.sub || []).find(i => i.key === activeMenu);
             return (
                <div className="dashboard-content-placeholder">
                    <h2>{menuItem?.name || 'Trang không xác định'}</h2>
                    <p>Đây là khu vực quản lý **{menuItem?.name || 'Chức năng'}**. Nội dung chi tiết sẽ được phát triển tại đây.</p>
                </div>
            );
        }

        return (
            <div className="dashboard-content-grid">
                <div className="main-stats-grid">
                    <StatCard icon={Users} title="Tổng người dùng" value={stats.totalUsers.toLocaleString('vi-VN')} color="blue" />
                    <StatCard icon={Box} title="Sản phẩm đang bán" value={stats.activeProducts.toLocaleString('vi-VN')} color="orange" />
                    <StatCard icon={Clock} title="Đơn hàng chờ xử lý" value={stats.pendingOrders.toLocaleString('vi-VN')} color="red" />
                    <StatCard icon={DollarSign} title="Doanh thu (tháng)" value={`${(stats.totalRevenue / 1000000).toFixed(1)} Triệu`} color="green" />
                </div>
                
                <div className="charts-container">
                    <div className="dashboard-card chart-placeholder">
                        <h2>Doanh thu 6 tháng gần nhất</h2>
                        <p className="chart-type">(Placeholder: Biểu đồ cột)</p>
                    </div>
                    <div className="dashboard-card chart-placeholder small-chart">
                        <h2>Tỷ lệ đơn hàng</h2>
                        <p className="chart-type">(Placeholder: Biểu đồ tròn)</p>
                    </div>
                </div>

                <div className="dashboard-card full-width">
                    <h2>Đơn hàng gần đây</h2>
                    <RecentOrdersTable orders={recentOrders} />
                </div>
            </div>
        );
    };
    
    return (
        <div className={`admin-layout ${sidebarCollapsed ? 'collapsed' : ''}`}>
            {/* HEADER ĐÃ CẬP NHẬT */}
            <AdminHeader 
                sidebarCollapsed={sidebarCollapsed} 
                toggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
            />

            <div className="main-body-wrapper">
                <aside className="sidebar">
                    <button className="toggle-btn" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
                        {sidebarCollapsed ? '▶️' : '◀️'}
                    </button>
                    <div className="sidebar-logo">
                        <h3>MENU HỆ THỐNG</h3>
                    </div>
                    {renderSidebarMenu()}
                </aside>

                <main className="dashboard-main-content">
                    <h1>{menuItems.find(i => i.key === activeMenu)?.name || 
                         menuItems.flatMap(i => i.sub || []).find(i => i.key === activeMenu)?.name || 'Tổng quan'}
                    </h1>
                    <p className="subtitle">Chào mừng trở lại, Admin!</p>
                    
                    {renderMainContent()}
                </main>
            </div>
        </div>
    );
}

// -----------------------------------------------------------
// 📚 ADMIN HEADER COMPONENT (FIXED DROPDOWN)
// -----------------------------------------------------------

const AdminHeader: React.FC<{ sidebarCollapsed: boolean, toggleSidebar: () => void }> = ({ toggleSidebar }) => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    
    // State quản lý dropdown
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Xử lý click ra ngoài để đóng menu
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="admin-header">
            <div className="header-left">
                <div className="logo-container">
                    <span className="logo-text">
                        AgriChain <span className="brand-accent">Admin</span>
                    </span>
                </div>
                <button className="icon-btn menu-toggle-btn" onClick={toggleSidebar}>
                    <Menu size={20} />
                </button>
            </div>

            <div className="header-controls">
                <div className="search-bar">
                    <Search size={18} className="search-icon" />
                    <input type="text" placeholder="Tìm kiếm..." />
                </div>

                <button className="icon-btn" title="Thông báo">
                    <Bell size={20} />
                    <span className="badge-dot"></span>
                </button>

                {/* --- USER DROPDOWN --- */}
                <div className="admin-user-dropdown" ref={dropdownRef}>
                    <button 
                        className={`admin-profile-btn ${isDropdownOpen ? 'active' : ''}`}
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                        <div className="admin-avatar">
                            <User size={18} />
                        </div>
                        <div className="admin-info">
                            <span className="admin-name">{user?.fullName || 'Admin'}</span>
                            <span className="admin-role">Quản trị viên</span>
                        </div>
                        <ChevronDown size={16} className={`chevron ${isDropdownOpen ? 'rotate' : ''}`} />
                    </button>

                    {isDropdownOpen && (
                        <div className="admin-dropdown-menu">
                            <div className="menu-header">
                                <strong>{user?.fullName}</strong>
                                <span>{user?.email}</span>
                            </div>
                            <div className="menu-divider"></div>
                            
                            <button className="menu-item" onClick={() => { setIsDropdownOpen(false); navigate('/profile'); }}>
                                <Settings size={16} /> Thiết lập tài khoản
                            </button>
                            
                            <div className="menu-divider"></div>

                            <button 
                                className="menu-item text-red"
                                onClick={() => {
                                    setIsDropdownOpen(false);
                                    logout();
                                    navigate('/login');
                                }}
                            >
                                <LogOut size={16} /> Đăng xuất
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

const StatCard: React.FC<{ icon: React.ElementType, title: string, value: string, color: string }> = ({ icon: Icon, title, value, color }) => (
    <div className={`stat-card ${color}`}>
        <div className="card-content">
            <div className="icon-wrapper">
                <Icon size={30} />
            </div>
            <p className="stat-title">{title}</p>
            <h3 className="stat-value">{value}</h3>
        </div>
    </div>
);

const RecentOrdersTable: React.FC<{ orders: Order[] }> = ({ orders }) => (
    <table className="data-table">
        <thead>
            <tr>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
                <th>Ngày</th>
                <th>Thao tác</th>
            </tr>
        </thead>
        <tbody>
            {orders.map(order => (
                <tr key={order.id}>
                    <td><strong>{order.id}</strong></td>
                    <td>{order.customer}</td>
                    <td>{formatCurrency(order.total)}</td>
                    <td>
                        <span className={`badge ${order.status}`}>
                            {order.status === 'pending' ? 'Chờ xử lý' :
                             order.status === 'shipping' ? 'Đang giao' : 'Hoàn thành'}
                        </span>
                    </td>
                    <td>{order.date}</td>
                    <td><button className="action-btn">Chi tiết</button></td>
                </tr>
            ))}
        </tbody>
    </table>
);