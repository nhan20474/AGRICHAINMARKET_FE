import React, { useEffect, useState } from 'react';
import { Trash2, Plus, Minus, ArrowLeft, AlertTriangle, ShoppingBag } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import '../../styles/Cart.css';
import { cartService } from '../../services/cartService';

// Interface khớp với dữ liệu Backend trả về
interface CartItem {
    id: number; 
    product_id: number;
    name: string;
    image_url: string;
    quantity: number; 
    current_stock: number; 
    unit?: string;
    product_status: string; // 'available', 'out_of_stock'...
    
    // --- CÁC TRƯỜNG GIÁ MỚI ---
    price: number;           // Giá hiện tại (đã chọn min giữa gốc và sale)
    original_price: number;  // Giá gốc
    sale_price: number | null; // Giá sale (nếu có)
}

function getUserId() {
    try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            return Number(user.id);
        }
    } catch {}
    return null;
}

const CartPage: React.FC = () => {
    const userId = getUserId();
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [notify, setNotify] = useState('');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // --- 1. TẢI GIỎ HÀNG ---
    useEffect(() => {
        if (userId) {
            fetchCart();
        } else {
            setLoading(false);
        }
    }, [userId]);

    const fetchCart = async () => {
        try {
            // Gọi API lấy giỏ hàng (đã có logic giá sale từ backend)
            const res = await fetch(`http://localhost:3000/api/cart/${userId}`);
            const data = await res.json();
            
            const items = Array.isArray(data.items) ? data.items.map((item: any) => ({
                id: item.cart_id,
                product_id: item.product_id,
                name: item.name,
                image_url: item.image_url,
                quantity: item.cart_quantity,
                current_stock: item.current_stock,
                unit: item.unit,
                product_status: item.product_status,
                
                // Map giá tiền
                price: Number(item.current_price),       // Giá bán cuối cùng
                original_price: Number(item.original_price), // Giá gốc
                sale_price: item.sale_price ? Number(item.sale_price) : null
            })) : [];

            setCartItems(items);
            
            // Đồng bộ localStorage để hiển thị badge số lượng trên Header (nếu có)
            localStorage.setItem('cart', JSON.stringify(items));
            window.dispatchEvent(new Event('cart-updated'));

        } catch (err) {
            console.error(err);
            setCartItems([]);
        }
        setLoading(false);
    };

    // --- 2. CẬP NHẬT SỐ LƯỢNG ---
    const updateQuantity = async (productId: number, newQty: number) => {
        if (!userId) return;
        if (newQty < 1) return;

        // Kiểm tra tồn kho phía Client trước khi gọi API
        const item = cartItems.find(i => i.product_id === productId);
        if (item && newQty > item.current_stock) {
            setNotify(`Kho chỉ còn ${item.current_stock} sản phẩm!`);
            setTimeout(() => setNotify(''), 2000);
            return;
        }

        try {
            // Gọi API PUT update số lượng trực tiếp (Gọn hơn cách cộng dồn cũ)
            await fetch('http://localhost:3000/api/cart/update', { 
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ user_id: userId, product_id: productId, quantity: newQty })
            });
            
            // Load lại giỏ hàng để cập nhật tổng tiền chính xác
            fetchCart();
            
            // ✅ Dispatch event để Header cập nhật ngay
            window.dispatchEvent(new Event('cart-updated'));
        } catch (err) {
            console.error(err);
        }
    };

    // --- 3. XÓA SẢN PHẨM ---
    const removeItem = async (productId: number) => {
        if (!userId) return;
        if (!window.confirm("Bạn chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?")) return;
        
        try {
            await fetch(`http://localhost:3000/api/cart/${userId}/${productId}`, { method: 'DELETE' });
            fetchCart();
            
            // ✅ Dispatch event để Header cập nhật ngay
            window.dispatchEvent(new Event('cart-updated'));
            
            setNotify('Đã xóa sản phẩm!');
            setTimeout(() => setNotify(''), 1500);
        } catch (err) {
            console.error(err);
        }
    };

    // --- 4. TÍNH TOÁN & VALIDATION ---
    const safeCartItems = Array.isArray(cartItems) ? cartItems : [];
    
    // Lọc ra các sản phẩm lỗi (hết hàng, quá số lượng)
    const invalidItems = safeCartItems.filter(item => 
        item.quantity > item.current_stock || item.product_status !== 'available'
    );
    const isCartInvalid = invalidItems.length > 0;

    // Tính tổng tiền (Chỉ tính sản phẩm hợp lệ)
    const totalAmount = safeCartItems.reduce((sum, item) => {
        if (item.product_status === 'available' && item.quantity <= item.current_stock) {
            return sum + (item.price * item.quantity); // Dùng item.price (đã là giá tốt nhất)
        }
        return sum;
    }, 0);

    // --- 5. CHUYỂN HƯỚNG THANH TOÁN ---
    const handleCheckout = () => {
        if (safeCartItems.length === 0) {
            setNotify('Giỏ hàng trống.');
            return;
        }
        if (isCartInvalid) {
            setNotify('Vui lòng xóa hoặc giảm số lượng các sản phẩm báo lỗi.');
            return;
        }
        navigate('/checkout');
    };

    // --- RENDER ---
    if (!userId) {
        return (
            <div className="market-page">
                <main className="content-wrapper cart-page-content">
                    <h2 className="section-title">🛒 Giỏ hàng của bạn</h2>
                    <div className="empty-cart">
                        <ShoppingBag size={64} color="#ccc" />
                        <p>Bạn cần đăng nhập để xem giỏ hàng.</p>
                        <Link to="/login" className="continue-shopping-btn">Đăng nhập ngay</Link>
                    </div>
                </main>
            </div>
        );
    }

    if (loading) return <div className="p-8 text-center">Đang tải giỏ hàng...</div>;

    // Nếu chưa đăng nhập, hiển thị yêu cầu đăng nhập
    if (!userId) {
        return (
            <div className="market-page">
                <main className="content-wrapper cart-page-content">
                    <h2 className="section-title">🛒 Giỏ hàng của bạn</h2>
                    <div className="empty-cart">
                        <ShoppingBag size={64} color="#eee" style={{marginBottom: 15}}/>
                        <p>Bạn cần đăng nhập để xem giỏ hàng.</p>
                        <button 
                            onClick={() => navigate('/login')}
                            style={{
                                background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
                                color: '#fff',
                                border: 'none',
                                padding: '14px 32px',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                fontSize: '16px',
                                fontWeight: '600',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '10px',
                                boxShadow: '0 4px 15px rgba(76, 175, 80, 0.3)',
                                transition: 'all 0.3s ease',
                                marginTop: '20px'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 6px 20px rgba(76, 175, 80, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 15px rgba(76, 175, 80, 0.3)';
                            }}
                        >
                            Đăng nhập ngay
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="market-page">
            <main className="content-wrapper cart-page-content">
                <h2 className="section-title">🛒 Giỏ hàng của bạn</h2>
                
                {/* Thông báo Toast */}
                {notify && (
                    <div className="cart-notify" style={{
                        background: notify.includes('Vui lòng') || notify.includes('Kho') ? '#fff3cd' : '#d4edda', 
                        color: notify.includes('Vui lòng') || notify.includes('Kho') ? '#856404' : '#155724'
                    }}>
                        {notify}
                    </div>
                )}
                
                {safeCartItems.length === 0 ? (
                    <div className="empty-cart">
                        <ShoppingBag size={64} color="#eee" style={{marginBottom: 15}}/>
                        <p>Giỏ hàng của bạn đang trống.</p>
                        <button 
                            onClick={() => navigate('/products')}
                            style={{
                                background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
                                color: '#fff',
                                border: 'none',
                                padding: '14px 32px',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                fontSize: '16px',
                                fontWeight: '600',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '10px',
                                boxShadow: '0 4px 15px rgba(76, 175, 80, 0.3)',
                                transition: 'all 0.3s ease',
                                marginTop: '20px'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 6px 20px rgba(76, 175, 80, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 15px rgba(76, 175, 80, 0.3)';
                            }}
                        >
                            <ArrowLeft size={20} /> Tiếp tục mua sắm
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Bảng Sản Phẩm */}
                        <div className="cart-table-container">
                            <table className="cart-table">
                                <thead>
                                    <tr>
                                        <th>Sản phẩm</th>
                                        <th>Đơn giá</th>
                                        <th>Số lượng</th>
                                        <th>Thành tiền</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {safeCartItems.map((item) => {
                                        // Check trạng thái lỗi
                                        const isOutOfStock = item.current_stock === 0 || item.product_status === 'out_of_stock';
                                        const isNotEnough = item.quantity > item.current_stock;
                                        
                                        // Check có Sale không
                                        const isSale = item.sale_price && item.sale_price < item.original_price;

                                        return (
                                            <tr key={item.id} style={{background: (isOutOfStock || isNotEnough) ? '#fff5f5' : 'inherit'}}>
                                                {/* Cột 1: Thông tin */}
                                                <td className="product-col">
                                                    <div className="cart-product-info">
                                                        <img 
                                                            src={item.image_url && item.image_url.startsWith('/uploads') ? `http://localhost:3000${item.image_url}` : (item.image_url || '/img/default.jpg')} 
                                                            alt={item.name} 
                                                            className="cart-img" 
                                                            onError={e => { (e.target as HTMLImageElement).src = '/img/default.jpg'; }} 
                                                            style={{opacity: isOutOfStock ? 0.5 : 1}}
                                                        />
                                                        <div>
                                                            <p className="cart-item-name">{item.name}</p>
                                                            <span className="cart-item-unit">Đơn vị: {item.unit || 'kg'}</span>
                                                            
                                                            {/* Cảnh báo lỗi */}
                                                            {isOutOfStock && (
                                                                <div style={{color: '#dc3545', fontSize: 12, marginTop: 4, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 4}}>
                                                                    <AlertTriangle size={12}/> Hết hàng
                                                                </div>
                                                            )}
                                                            {!isOutOfStock && isNotEnough && (
                                                                <div style={{color: '#e65100', fontSize: 12, marginTop: 4, fontWeight: 'bold'}}>
                                                                    Chỉ còn {item.current_stock} sản phẩm
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                
                                                {/* Cột 2: Đơn giá (Có hiển thị Sale) */}
                                                <td className="price-col">
                                                    {isSale ? (
                                                        <div>
                                                            <div style={{color: '#d32f2f', fontWeight: 'bold'}}>{item.price.toLocaleString('vi-VN')}đ</div>
                                                            <div style={{textDecoration: 'line-through', color: '#999', fontSize: 12}}>{item.original_price.toLocaleString('vi-VN')}đ</div>
                                                        </div>
                                                    ) : (
                                                        <div>{item.price.toLocaleString('vi-VN')}đ</div>
                                                    )}
                                                </td>

                                                {/* Cột 3: Số lượng */}
                                                <td className="quantity-col">
                                                    <div className="quantity-controls">
                                                        <button onClick={() => updateQuantity(item.product_id, item.quantity - 1)} disabled={item.quantity <= 1}>
                                                            <Minus size={14} />
                                                        </button>
                                                        <span>{item.quantity}</span>
                                                        <button onClick={() => updateQuantity(item.product_id, item.quantity + 1)} disabled={isOutOfStock || item.quantity >= item.current_stock}>
                                                            <Plus size={14} />
                                                        </button>
                                                    </div>
                                                </td>

                                                {/* Cột 4: Thành tiền */}
                                                <td className="total-col">
                                                    <strong>{(item.price * item.quantity).toLocaleString('vi-VN')}đ</strong>
                                                </td>

                                                {/* Cột 5: Xóa */}
                                                <td className="action-col">
                                                    <button className="remove-btn" onClick={() => removeItem(item.product_id)}>
                                                        <Trash2 size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        
                        {/* Footer Tổng kết */}
                        <div className="cart-summary-footer">
                            <div className="cart-total">
                                <span>Tổng cộng:</span>
                                <span className="total-price">{totalAmount.toLocaleString('vi-VN')}đ</span>
                            </div>
                            
                            <button 
                                className="checkout-btn" 
                                onClick={handleCheckout} 
                                disabled={isCartInvalid} 
                                style={{
                                    opacity: isCartInvalid ? 0.6 : 1, 
                                    cursor: isCartInvalid ? 'not-allowed' : 'pointer', 
                                    backgroundColor: isCartInvalid ? '#999' : '#28a745'
                                }}
                            >
                                {isCartInvalid ? 'Vui lòng sửa lỗi' : 'Tiến hành thanh toán'}
                            </button>
                        </div>
                        
                        {isCartInvalid && (
                            <p style={{textAlign: 'right', color: '#dc3545', marginTop: 10, fontSize: 14}}>
                                * Vui lòng xóa sản phẩm hết hàng hoặc giảm số lượng để tiếp tục.
                            </p>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};

export default CartPage;