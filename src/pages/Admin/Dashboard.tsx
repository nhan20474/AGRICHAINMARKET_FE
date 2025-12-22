import React, { useState, useRef, useEffect } from 'react';
import { 
    Bell, ChevronDown, Users, ShoppingCart, 
    DollarSign, BarChart, Menu, LogOut, Settings, TrendingUp, Package , ClipboardList
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/Dashboard.css';
import '../../styles/Charts.css'; // Import the new CSS file for charts

import UserManager from './UserManager';
import ProductManager from './ProductManager';
import PendingFarmers from './PendingFarmers';
import Categories from './Categories';
import BroadcastNotification from './BroadcastNotification';
import PanelManager from './PanelManager';
import DiscountManager from './DiscountManager';
import AdminReports from './AdminReports';
import AdminOrderManager from './OrderManager';
import { orderService } from '../../services/orderService';
const ORDER_COLORS = [
  '#10B981',
  '#F59E0B',
  '#EF4444',
];
const REVENUE_DATA = [
  { month: 'T1', revenue: 4000 },
  { month: 'T2', revenue: 5200 },
  { month: 'T3', revenue: 6800 },
  { month: 'T4', revenue: 5500 },
  { month: 'T5', revenue: 7200 },
  { month: 'T6', revenue: 8500 },
];


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
    const { user } = useAuth();   // ✅ LẤY USER TỪ CONTEXT
    const adminId = user?.id ? Number(user.id) : undefined;
    // Fetch dashboard stats from API
useEffect(() => {
    /* ================= DASHBOARD STATS (GIỮ NGUYÊN) ================= */
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
        .catch(() => {
            console.error('Không thể tải dữ liệu thống kê.');
        });

    /* ================= RECENT ORDERS (DÙNG SERVICE) ================= */
    if (!adminId) return;

    orderService
        .adminGetOrders(adminId, undefined, 5) // lấy 5 đơn gần nhất
        .then(data => {
            const orders = data.map((order: any) => ({
                id: order.id,
                customer: order.buyer_name,
                total: order.total_amount,
                status: order.status,
                date: order.created_at,
            }));
            setRecentOrders(orders);
        })
        .catch(err => {
            console.error('Lỗi lấy đơn hàng:', err.message);
        });

}, [adminId]);

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
                        <ResponsiveContainer width="100%" height={260}>
                            <ReBarChart data={REVENUE_DATA} className="bar-chart">
                                <XAxis 
                                    dataKey="month" 
                                    className="chart-axis"
                                />
                                <YAxis 
                                    className="chart-axis"
                                />
                                <Tooltip 
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        border: '1px solid #ccc',
                                        borderRadius: '4px',
                                        fontSize: '12px',
                                        color: '#333',
                                    }}
                                    wrapperStyle={{
                                        padding: '5px',
                                    }}
                                    formatter={(value) => {
                                        if (value === undefined) return 'N/A'; // Kiểm tra nếu value là undefined
                                        return `${value.toLocaleString('vi-VN')}đ`;
                                    }}
                                />
                                <Legend 
                                    className="chart-legend"
                                    formatter={() => 'Doanh thu'}
                                />
                                <Bar 
                                    dataKey="revenue" 
                                    fill="#3B82F6" 
                                    radius={[8, 8, 0, 0]}
                                    name="Doanh thu"
                                />
                            </ReBarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="chart-card">
                        <h3>Trạng thái đơn hàng</h3>
                        <ResponsiveContainer width="100%" height={260}>
                            <PieChart className="pie-chart">
                                <Pie
                                    data={[
                                        { name: 'Hoàn thành', value: stats.completedOrders || 0 },
                                        { name: 'Chờ xử lý', value: stats.pendingOrders || 0 },
                                        { name: 'Đã huỷ', value: stats.cancelledOrders || 0 },
                                    ]}
                                    dataKey="value"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={4}
                                    label={({ name, value }) => `${name}: ${value}`}
                                >
                                    {ORDER_COLORS.map((color, index) => (
                                        <Cell key={index} fill={color} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        border: '1px solid #ccc',
                                        borderRadius: '4px',
                                        fontSize: '12px',
                                        color: '#333',
                                    }}
                                    wrapperStyle={{
                                        padding: '5px',
                                    }}
                                    formatter={(value) => {
                                        if (value === undefined) return 'N/A'; // Kiểm tra nếu value là undefined
                                        return `${value} đơn`;
                                    }}
                                />
                                <Legend 
                                    className="chart-legend"
                                    formatter={(value) => value}
                                />
                            </PieChart>
                        </ResponsiveContainer>
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