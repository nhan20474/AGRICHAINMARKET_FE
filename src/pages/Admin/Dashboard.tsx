import React, { useState, useRef, useEffect } from 'react';
import { 
    Bell, ChevronDown, Users, ShoppingCart, 
    DollarSign, BarChart, Menu, LogOut, Settings, TrendingUp, Package , ClipboardList
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/Dashboard.css';

import UserManager from './UserManager';
import ProductManager from './ProductManager';
import PendingFarmers from './PendingFarmers';
import Categories from './Categories';
import BroadcastNotification from './BroadcastNotification';
import PanelManager from './PanelManager';
import DiscountManager from './DiscountManager';
import AdminReports from './AdminReports';
import AdminOrderManager from './OrderManager';

interface Stats {
    totalUsers: number;
    totalFarmers: number;
    totalConsumers: number;
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
    pendingOrders: number;
    activeProducts: number;
    completedOrders?: number;
    cancelledOrders?: number;
    lowStockProducts?: number;
}

interface Order { 
    id: string, 
    customer: string, 
    total: number, 
    status: 'pending' | 'completed' | 'shipping', 
    date: string 
}

const initialStats: Stats = {
    totalUsers: 0,
    totalFarmers: 0,
    totalConsumers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    activeProducts: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    lowStockProducts: 0,
};

const formatCurrency = (amount: number) => amount.toLocaleString('vi-VN') + 'đ';

const menuItems = [
    { name: 'Tổng quan', icon: BarChart, key: 'dashboard' },
    { name: 'Quản lý người dùng', icon: Users, key: 'users_list' },
    { name: 'Danh mục', icon: Package, key: 'categories' },
    { name: 'Quản lý sản phẩm', icon: ShoppingCart, key: 'product_list' },
    { name: 'Quản lý đơn hàng', icon: ClipboardList, key: 'order_manager' },
    { name: 'Quản lý Panels', icon: Settings, key: 'panel_manager' },
    { name: 'Khuyến mãi', icon: TrendingUp, key: 'discounts' },
    { name: 'Báo cáo', icon: DollarSign, key: 'revenue_chart' },
    { name: 'Thông báo', icon: Bell, key: 'broadcast' },
];

export default function AdminDashboard() {
    const [activeMenu, setActiveMenu] = useState('dashboard');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [stats, setStats] = useState<Stats>(initialStats);
    const [recentOrders, setRecentOrders] = useState<Order[]>([]);
    const navigate = useNavigate();

    // Fetch dashboard stats from API
    useEffect(() => {
        fetch('http://localhost:3000/api/reports/admin/dashboard')
            .then(res => res.json())
            .then(data => {
                setStats({
                    totalUsers: data.total_users,
                    totalFarmers: data.total_sellers,
                    totalConsumers: data.total_buyers,
                    totalProducts: data.total_products,
                    totalOrders: data.total_orders,
                    totalRevenue: data.total_revenue,
                    pendingOrders: data.pending_orders,
                    activeProducts: data.total_products - (data.low_stock_products || 0),
                    completedOrders: data.completed_orders,
                    cancelledOrders: data.cancelled_orders,
                    lowStockProducts: data.low_stock_products,
                });
            })
            .catch(() => {});
    }, []);

    const renderMainContent = () => {
        if (activeMenu === 'users_list') return <UserManager />;
        if (activeMenu === 'categories') return <Categories />;
        if (activeMenu === 'product_list') return <ProductManager />;
        if (activeMenu === 'order_manager') return <AdminOrderManager />;
        if (activeMenu === 'panel_manager') return <PanelManager />;
        if (activeMenu === 'broadcast') return <BroadcastNotification />;
        if (activeMenu === 'discounts') return <DiscountManager />;
        if (activeMenu === 'revenue_chart') return <AdminReports />;
        
        return (
            <div className="dashboard-grid">
                <div className="stats-grid">
                    <StatCard 
                        icon={Users} 
                        title="Tổng người dùng" 
                        value={stats.totalUsers} 
                        bgColor="#3B82F6"
                    />
                    <StatCard 
                        icon={ShoppingCart} 
                        title="Sản phẩm" 
                        value={stats.activeProducts} 
                        bgColor="#10B981"
                    />
                    <StatCard 
                        icon={Package} 
                        title="Đơn hàng chờ" 
                        value={stats.pendingOrders} 
                        bgColor="#F59E0B"
                    />
                    <StatCard 
                        icon={DollarSign} 
                        title="Doanh thu tháng" 
                        value={(stats.totalRevenue / 1000000).toFixed(1)} 
                        suffix="M"
                        bgColor="#EF4444"
                    />
                </div>

                <div className="charts-section">
                    <div className="chart-card">
                        <h3>Doanh thu 6 tháng</h3>
                        <div className="chart-placeholder">
                            <BarChart size={40} />
                            <p>Biểu đồ cột</p>
                        </div>
                    </div>
                    <div className="chart-card">
                        <h3>Trạng thái đơn hàng</h3>
                        <div className="chart-placeholder">
                            {/* Show order status summary */}
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                <li>Hoàn thành: {stats.completedOrders}</li>
                                <li>Đã huỷ: {stats.cancelledOrders}</li>
                                <li>Chờ xử lý: {stats.pendingOrders}</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="orders-card">
                    <h3>Đơn hàng gần đây</h3>
                    <RecentOrdersTable orders={recentOrders} />
                </div>
            </div>
        );
    };

    return (
        <div className={`admin-container ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
            <AdminSidebar 
                activeMenu={activeMenu}
                setActiveMenu={setActiveMenu}
                sidebarCollapsed={sidebarCollapsed}
                setSidebarCollapsed={setSidebarCollapsed}
            />

            <div className="admin-main">
                <AdminHeader 
                    sidebarCollapsed={sidebarCollapsed}
                    toggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
                />

                <main className="admin-content">
                    <div className="content-header">
                        <h1>{menuItems.find(i => i.key === activeMenu)?.name || 'Dashboard'}</h1>
                    </div>
                    {renderMainContent()}
                </main>
            </div>
        </div>
    );
}

const AdminSidebar: React.FC<{ activeMenu: string; setActiveMenu: (key: string) => void; sidebarCollapsed: boolean; setSidebarCollapsed: (collapsed: boolean) => void }> = 
({ activeMenu, setActiveMenu, sidebarCollapsed, setSidebarCollapsed }) => (
    <aside className={`admin-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
            <div className="logo">
                {!sidebarCollapsed && <span>AgriChain Admin</span>}
            </div>
            <button 
                className="collapse-btn"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
                <Menu size={20} />
            </button>
        </div>

        <nav className="sidebar-nav">
            {menuItems.map(item => (
                <button
                    key={item.key}
                    className={`nav-item ${activeMenu === item.key ? 'active' : ''}`}
                    onClick={() => setActiveMenu(item.key)}
                    title={item.name}
                >
                    <item.icon size={22} />
                    {!sidebarCollapsed && <span>{item.name}</span>}
                </button>
            ))}
        </nav>
    </aside>
);

const AdminHeader: React.FC<{ sidebarCollapsed: boolean; toggleSidebar: () => void }> = 
({ sidebarCollapsed, toggleSidebar }) => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

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
                <button className="menu-toggle" onClick={toggleSidebar}>
                    <Menu size={24} />
                </button>
            </div>

            <div className="header-right">
                <button className="notification-btn">
                    <Bell size={20} />
                    <span className="dot"></span>
                </button>

                <div className="user-menu" ref={dropdownRef}>
                    <button 
                        className="user-btn"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                        <div className="user-avatar">{user?.fullName?.charAt(0) || 'A'}</div>
                        {!sidebarCollapsed && (
                            <>
                                <div className="user-info">
                                    <span className="user-name">{user?.fullName || 'Admin'}</span>
                                </div>
                                <ChevronDown size={16} />
                            </>
                        )}
                    </button>

                    {isDropdownOpen && (
                        <div className="dropdown-menu">
                            <div className="menu-item" onClick={() => navigate('/profile')}>
                                <Settings size={16} /> Hồ sơ
                            </div>
                            <div className="menu-divider"></div>
                            <div 
                                className="menu-item logout"
                                onClick={() => {
                                    logout();
                                    navigate('/login');
                                }}
                            >
                                <LogOut size={16} /> Đăng xuất
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

const StatCard: React.FC<{ icon: React.ElementType; title: string; value: number | string; suffix?: string; bgColor: string }> = 
({ icon: Icon, title, value, suffix, bgColor }) => (
    <div className="stat-card" style={{ borderTopColor: bgColor }}>
        <div className="stat-icon" style={{ backgroundColor: bgColor }}>
            <Icon size={28} />
        </div>
        <div className="stat-content">
            <p className="stat-title">{title}</p>
            <h2 className="stat-value">
                {typeof value === 'number' ? value.toLocaleString('vi-VN') : value}
                {suffix && <span className="stat-suffix">{suffix}</span>}
            </h2>
        </div>
    </div>
);

const RecentOrdersTable: React.FC<{ orders: Order[] }> = ({ orders }) => (
    <div className="table-wrapper">
        <table className="data-table">
            <thead>
                <tr>
                    <th>Mã đơn</th>
                    <th>Khách hàng</th>
                    <th>Tổng tiền</th>
                    <th>Trạng thái</th>
                    <th>Ngày</th>
                </tr>
            </thead>
            <tbody>
                {orders.length === 0 ? (
                    <tr>
                        <td colSpan={5} style={{ textAlign: 'center', color: '#888', padding: 24 }}>Không có dữ liệu</td>
                    </tr>
                ) : (
                    orders.map(order => (
                        <tr key={order.id}>
                            <td className="bold">{order.id}</td>
                            <td>{order.customer}</td>
                            <td>{formatCurrency(order.total)}</td>
                            <td>
                                <span className={`status-badge ${order.status}`}>
                                    {order.status === 'pending' ? 'Chờ xử lý' :
                                    order.status === 'shipping' ? 'Đang giao' : 'Hoàn thành'}
                                </span>
                            </td>
                            <td>{order.date}</td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
    </div>
);