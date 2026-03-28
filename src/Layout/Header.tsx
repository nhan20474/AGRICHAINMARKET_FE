import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, Leaf, User, Search, Bell, ChevronDown, LogOut, Settings, Package } from 'lucide-react';
import '../styles/Header.css';
import { useAuth } from '../contexts/AuthContext';
import { API_CONFIG, SOCKET_IO_OPTIONS } from '../config/apiConfig';

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
    const [unreadCount, setUnreadCount] = useState(() => {
        // Khôi phục count từ localStorage khi refresh
        const saved = localStorage.getItem('unreadCount');
        const count = saved ? Number(saved) : 0;
        return count;
    });
    const [popup, setPopup] = useState<string | null>(null);
    
    // --- State cho animation ---
    const [cartBounce, setCartBounce] = useState(false);
    const [notificationPulse, setNotificationPulse] = useState(false);
    const prevCartCount = useRef(0);
    const prevUnreadCount = useRef(-1);
    const socketRef = useRef<any>(null); // ✅ Store socket to prevent duplicates

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

    // 2. Logic cập nhật giỏ hàng - Real-time với polling backup
    useEffect(() => {
        let pollingInterval: ReturnType<typeof setInterval>;
        
        // Hàm cập nhật giỏ hàng
        const updateCartCount = async () => {
            // Nếu chưa đăng nhập, set về 0
            if (!user?.id) {
                setCartCount(0);
                localStorage.removeItem('cart');
                return;
            }

            const cartStr = localStorage.getItem('cart');
            if (cartStr) {
                try {
                    const cart = JSON.parse(cartStr);
                    if (Array.isArray(cart) && cart.length > 0) {
                        const totalQty = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
                        setCartCount(totalQty);
                    } else { setCartCount(0); }
                } catch { setCartCount(0); }
            } else { setCartCount(0); }
            
            // Đồng bộ từ API nếu user đã đăng nhập (đảm bảo chính xác)
            if (user?.id) {
                try {
                    const res = await fetch(`${API_CONFIG.CART}/${user.id}`);
                    const data = await res.json();
                    if (data.items && Array.isArray(data.items)) {
                        const totalQty = data.items.reduce((sum: number, item: any) => 
                            sum + (item.cart_quantity || 0), 0);
                        
                        // Trigger animation nếu số lượng tăng
                        if (totalQty > prevCartCount.current && prevCartCount.current > 0) {
                            setCartBounce(true);
                            setTimeout(() => setCartBounce(false), 400);
                        }
                        prevCartCount.current = totalQty;
                        
                        setCartCount(totalQty);
                        // Cập nhật localStorage để đồng bộ
                        localStorage.setItem('cart', JSON.stringify(data.items));
                    }
                } catch (err) {
                    console.error('Lỗi đồng bộ giỏ hàng:', err);
                }
            }
        };

        updateCartCount();
        
        // ✅ Lắng nghe event từ các component khác (Real-time)
        window.addEventListener('storage', updateCartCount);
        window.addEventListener('cart-updated', updateCartCount);
        
        // ✅ Polling backup mỗi 30 giây để đảm bảo đồng bộ
        pollingInterval = setInterval(updateCartCount, 30000);
        
        return () => {
            window.removeEventListener('storage', updateCartCount);
            window.removeEventListener('cart-updated', updateCartCount);
            clearInterval(pollingInterval);
        };
    }, [user]);

    // ✅ Socket.IO cho thông báo với polling backup
    useEffect(() => {
        let pollingInterval: ReturnType<typeof setInterval>;
        
        // Lấy userId từ user prop hoặc localStorage
        let userId: number | null = null;
        if (user?.id) {
            userId = user.id;
        } else {
            const userStr = localStorage.getItem('user');
            if (userStr) { 
                try { userId = Number(JSON.parse(userStr).id); } catch {} 
            }
        }
        
        // Nếu không có userId, reset count và disconnect socket
        if (!userId) {
            setUnreadCount(0);
            localStorage.removeItem('unreadCount');
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
            return;
        }
        
        const updateUnreadCount = async (e?: any) => {
            // Fetch từ API hoặc nhận từ event
            if (e && e.detail !== undefined) {
                const count = Number(e.detail);
                setUnreadCount(count);
                localStorage.setItem('unreadCount', String(count));
                if (count > prevUnreadCount.current && prevUnreadCount.current >= 0) {
                    setNotificationPulse(true);
                    setTimeout(() => setNotificationPulse(false), 1500);
                }
                prevUnreadCount.current = count;
                return;
            }
            
            // Fetch từ API
            try {
                const res = await fetch(`${API_CONFIG.NOTIFICATIONS}/user/${userId}/unread-count`, {
                    headers: { 'Cache-Control': 'no-cache' }
                });
                const data = await res.json();
                
                const newCount = data.unread_count || data.count || 0;
                
                // Trigger pulse nếu có thông báo mới
                if (newCount > prevUnreadCount.current && prevUnreadCount.current >= 0) {
                    setNotificationPulse(true);
                    setTimeout(() => setNotificationPulse(false), 1500);
                }
                
                prevUnreadCount.current = newCount;
                setUnreadCount(newCount);
                localStorage.setItem('unreadCount', String(newCount));
            } catch (err) {
                console.error('❌ Lỗi lấy số thông báo:', err);
            }
        };

        // Khởi tạo badge ngay từ đầu
        updateUnreadCount();
        window.addEventListener('notification-updated', updateUnreadCount);

        // ✅ SOCKET.IO - CHỈ TẠO MỘT LẦN
        if (!socketRef.current) {
            try {
                import('socket.io-client').then(({ io }) => {
                    const socket = io(API_CONFIG.SOCKET_URL, {
                        ...SOCKET_IO_OPTIONS,
                        reconnectionAttempts: 5,
                    });
                    
                    socketRef.current = socket;
                    socket.emit('register', userId);
                    
                    socket.on('notification', (data: any) => {
                        setPopup('Bạn có thông báo mới');
                        
                        // Delay 1 giây để backend kịp insert DB
                        setTimeout(() => {
                            updateUnreadCount();
                        }, 1000);
                        
                        setTimeout(() => setPopup(null), 2500);
                    });
                    
                    socket.on('connect', () => {
                        socket.emit('register', userId);
                    });
                    
                    socket.on('disconnect', () => {});
                });
            } catch (err) {
                console.error('❌ Socket error:', err);
            }
        }
        
        // ✅ Polling backup mỗi 30 giây
        pollingInterval = setInterval(updateUnreadCount, 30000);
        
        return () => {
            console.log('🧹 Cleanup: removing event listeners');
            window.removeEventListener('notification-updated', updateUnreadCount);
            clearInterval(pollingInterval);
            // Socket vẫn giữ nguyên trong ref để tái sử dụng
        };
    }, [user]);
    
    // ✅ Cleanup socket khi component unmount hoàn toàn
    useEffect(() => {
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
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
                    {/* Icon Chuông - Chỉ hiện khi đã đăng nhập */}
                    {user && (
                        <Link to="/notifications" style={{ textDecoration: 'none' }}>
                            <button 
                                style={{
                                    position: 'relative',
                                    background: '#fff',
                                    border: '1px solid #e5e5e5',
                                    borderRadius: '8px',
                                    padding: '10px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = '#4CAF50';
                                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = '#e5e5e5';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                <Bell size={20} color="#333" />
                                {unreadCount > 0 && (
                                    <span 
                                        className={notificationPulse ? 'pulse' : ''}
                                        style={{
                                            position: 'absolute',
                                            top: '-4px',
                                            right: '-4px',
                                            background: '#ff4444',
                                            color: '#fff',
                                            borderRadius: '10px',
                                            padding: '2px 6px',
                                            fontSize: '11px',
                                            fontWeight: '600',
                                            minWidth: '18px',
                                            textAlign: 'center'
                                        }}
                                    >
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                )}
                            </button>
                        </Link>
                    )}

                    {/* Icon Giỏ hàng */}
                    <Link to="/cart" style={{ textDecoration: 'none' }}>
                        <button 
                            style={{
                                position: 'relative',
                                background: '#fff',
                                border: '1px solid #e5e5e5',
                                borderRadius: '8px',
                                padding: '10px',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = '#4CAF50';
                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = '#e5e5e5';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            <ShoppingCart size={20} color="#333" />
                            {cartCount > 0 && (
                                <span 
                                    className={cartBounce ? 'bounce' : ''}
                                    style={{
                                        position: 'absolute',
                                        top: '-4px',
                                        right: '-4px',
                                        background: '#4CAF50',
                                        color: '#fff',
                                        borderRadius: '10px',
                                        padding: '2px 6px',
                                        fontSize: '11px',
                                        fontWeight: '600',
                                        minWidth: '18px',
                                        textAlign: 'center'
                                    }}
                                >
                                    {cartCount > 99 ? '99+' : cartCount}
                                </span>
                            )}
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