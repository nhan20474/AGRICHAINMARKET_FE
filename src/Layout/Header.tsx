import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, Leaf, User, Search, Bell, ChevronDown, LogOut, Settings, Package } from 'lucide-react';
import '../styles/Header.css';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
    searchTerm: string;
    onSearchChange: (term: string) => void;
}

const Header: React.FC<HeaderProps> = ({ searchTerm, onSearchChange }) => {
    const location = useLocation();
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // --- State quản lý dữ liệu ---
    const [cartCount, setCartCount] = useState(0);
    const [unreadCount, setUnreadCount] = useState(0);
    const [popup, setPopup] = useState<string | null>(null);

    // --- State quản lý Dropdown Menu ---
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // 1. Xử lý click ra ngoài để đóng menu
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // 2. Logic cập nhật giỏ hàng (Giữ nguyên)
    useEffect(() => {
        // Hàm cập nhật giỏ hàng
        const updateCartCount = () => {
            const cartStr = localStorage.getItem('cart');
            if (cartStr) {
                try {
                    const cart = JSON.parse(cartStr);
                    if (Array.isArray(cart) && cart.length > 0) {
                        setCartCount(cart.reduce((sum, item) => sum + (item.quantity || 1), 0));
                    } else { setCartCount(0); }
                } catch { setCartCount(0); }
            } else { setCartCount(0); }
        };

        updateCartCount();
        
        // ✅ Lắng nghe event từ các component khác
        window.addEventListener('storage', updateCartCount);
        window.addEventListener('cart-updated', updateCartCount); // ← QUAN TRỌNG!
        
        return () => {
            window.removeEventListener('storage', updateCartCount);
            window.removeEventListener('cart-updated', updateCartCount);
        };
    }, []);

    // ✅ Socket.IO cho thông báo (đã có)
    useEffect(() => {
        const updateUnreadCount = (e?: any) => {
            // Fetch từ API hoặc nhận từ event
            if (e && e.detail !== undefined) {
                setUnreadCount(Number(e.detail));
                return;
            }
            
            const userStr = localStorage.getItem('user');
            let userId: number | null = null;
            if (userStr) { 
                try { userId = Number(JSON.parse(userStr).id); } catch {} 
            }
            
            if (userId) {
                fetch(`http://localhost:3000/api/notifications/user/${userId}/unread-count`)
                    .then(res => res.json())
                    .then(data => setUnreadCount(data.count || 0))
                    .catch(() => setUnreadCount(0));
            } else { setUnreadCount(0); }
        };

        updateUnreadCount();
        window.addEventListener('notification-updated', updateUnreadCount);

        // ✅ SOCKET.IO - Lắng nghe thông báo realtime
        let socket: any;
        const userStr = localStorage.getItem('user');
        let userId: number | null = null;
        if (userStr) { 
            try { userId = Number(JSON.parse(userStr).id); } catch {} 
        }
        
        if (userId) {
            try {
                import('socket.io-client').then(({ io }) => {
                    socket = io('http://localhost:3000');
                    socket.emit('register', userId);
                    
                    socket.on('notification', (data: any) => {
                        console.log('🔔 Nhận thông báo mới:', data);
                        setPopup('Bạn có thông báo mới');
                        updateUnreadCount(); // Cập nhật số badge
                        setTimeout(() => setPopup(null), 2500);
                    });
                });
            } catch (err) {
                console.error('Socket error:', err);
            }
        }
        
        return () => {
            window.removeEventListener('notification-updated', updateUnreadCount);
            if (socket) socket.disconnect?.();
        };
    }, []);

    const isActive = (path: string) => location.pathname === path ? 'active' : '';

    return (
        <>
            {/* 🔹 HEADER TOP */}
            <header className="market-header-top">
                <div className="logo-container">
                    <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                        <Leaf size={32} color="#4CAF50" />
                        <span className="logo-text">
                            <span className="blue">AgriChain</span> <span className="green">Market</span>
                        </span>
                    </Link>
                </div>

                <div className="header-actions-right">
                    {/* Icon Chuông */}
                    <Link to="/notifications" className="icon-btn-wrapper">
                        <button className="action-btn icon-only">
                            <Bell size={22} />
                            {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
                        </button>
                    </Link>

                    {/* Icon Giỏ hàng */}
                    <Link to="/cart" className="icon-btn-wrapper">
                        <button className="action-btn icon-only">
                            <ShoppingCart size={22} />
                            {cartCount > 0 && <span className="badge">{cartCount}</span>}
                        </button>
                    </Link>

                    {/* --- PHẦN USER DROPDOWN (ĐÃ CẬP NHẬT) --- */}
                    {user ? (
                        <div className="user-dropdown-container" ref={dropdownRef}>
                            {/* Nút bấm mở menu */}
                            <button 
                                className={`user-toggle-btn ${isDropdownOpen ? 'active' : ''}`} 
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            >
                                <User size={20} />
                                <span className="user-name">{user.fullName || user.email}</span>
                                <ChevronDown size={16} className={`chevron ${isDropdownOpen ? 'rotate' : ''}`} />
                            </button>

                            {/* Menu thả xuống */}
                            {isDropdownOpen && (
                                <div className="dropdown-menu">
                                    <div className="dropdown-header-info">
                                        <strong>{user.fullName || "Khách hàng"}</strong>
                                        <span>{user.email}</span>
                                    </div>
                                    <div className="dropdown-divider"></div>
                                    
                                    <Link 
                                        to="/profile" 
                                        className="dropdown-item" 
                                        onClick={() => setIsDropdownOpen(false)}
                                    >
                                        <Settings size={16} /> Hồ sơ cá nhân
                                    </Link>
                                    
                                    <Link 
                                        to="/order-history" 
                                        className="dropdown-item" 
                                        onClick={() => setIsDropdownOpen(false)}
                                    >
                                        <Package size={16} /> Đơn mua
                                    </Link>

                                    <div className="dropdown-divider"></div>
                                    
                                    <button 
                                        className="dropdown-item text-red"
                                        onClick={() => {
                                            logout();
                                            setIsDropdownOpen(false);
                                            navigate('/login');
                                        }}
                                    >
                                        <LogOut size={16} /> Đăng xuất
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="auth-buttons">
                            <Link to="/login">
                                <button className="action-btn-auth">Đăng nhập</button>
                            </Link>
                            <Link to="/register">
                                <button className="action-btn-auth secondary">Đăng ký</button>
                            </Link>
                        </div>
                    )}
                </div>
            </header>
            
            {/* 🔹 NAVIGATION BAR */}
            <nav className="market-navbar">
                <div className="nav-links">
                    <Link to="/shop" className={isActive('/shop')}>Trang chủ</Link>
                    <Link to="/products" className={isActive('/products')}>Sản phẩm</Link>
                    <Link to="/order-history" className={isActive('/order-history')}>Lịch sử mua hàng</Link>
                    <Link to="/shipping-list" className={isActive('/shipping-list')}>Vận chuyển</Link>
                </div>
                <div className="navbar-search">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm nông sản..."
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>
            </nav>

            {popup && (
                <div className="notify-bottom show">
                    <span className="notify-icon">✔</span>
                    <span className="notify-text">{popup}</span>
                </div>
            )}
        </>
    );
};

export default Header;