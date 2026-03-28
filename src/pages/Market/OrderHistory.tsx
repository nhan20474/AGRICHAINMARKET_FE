import React, { useEffect, useState } from 'react';
import { ORDER_STATUS_LABELS, getOrderStatusColor } from '../../services/orderService'; // ✅ KIỂM TRA
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import { API_CONFIG, API_ORIGIN, SOCKET_IO_OPTIONS } from '../../config/apiConfig';

// Định nghĩa kiểu dữ liệu đơn hàng và sản phẩm trong đơn
interface OrderItem {
    product_id: number;
    name: string;
    quantity: number;
    price_per_item: number | string;
    image_url?: string;
}

interface Order {
    id: number;
    created_at: string;
    total_amount: number | string;
    status: string;
    shipping_address?: string;
    items: OrderItem[];
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

const OrderHistory: React.FC = () => {
    const userId = getUserId();
    const navigate = useNavigate();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showReviewForm, setShowReviewForm] = useState<{[key: string]: boolean}>({});
    const [filterStatus, setFilterStatus] = useState('all');

    // ✅ Hàm fetch orders (tách ra để tái sử dụng)
    const fetchOrders = async () => {
        if (!userId) {
            setLoading(false);
            setError('Bạn cần đăng nhập để xem lịch sử mua hàng.');
            return;
        }
        
        try {
            const res = await fetch(`${API_CONFIG.ORDERS}/history/${userId}`);
            const data = await res.json();
            
            const ordersMap = new Map<number, Order>();
            
            if (Array.isArray(data)) {
                data.forEach((row: any) => {
                    const orderId = row.order?.id;
                    if (!orderId) return;
                    
                    if (!ordersMap.has(orderId)) {
                        ordersMap.set(orderId, {
                            id: orderId,
                            created_at: row.order?.created_at,
                            total_amount: row.order?.total_amount,
                            status: row.order?.status,
                            shipping_address: row.order?.shipping_address,
                            items: []
                        });
                    }
                    
                    const order = ordersMap.get(orderId)!;
                    if (Array.isArray(row.items)) {
                        row.items.forEach((item: any) => {
                            const exists = order.items.some(i => i.product_id === item.product_id);
                            if (!exists) {
                                order.items.push({
                                    product_id: item.product_id,
                                    name: item.name,
quantity: item.quantity,
                                    price_per_item: item.price_per_item,
                                    image_url: item.image_url
                                });
                            }
                        });
                    }
                });
            }
            
            const uniqueOrders = Array.from(ordersMap.values()).sort((a, b) => 
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            
            setOrders(uniqueOrders);
            setLoading(false);
        } catch (err) {
            console.error('❌ Error:', err);
            setError('Không thể tải lịch sử đơn hàng.');
            setLoading(false);
        }
    };

    // ✅ GIỮ NGUYÊN: Buyer dùng API PUT /api/orders/:orderId/status
    const handleConfirmReceived = async (orderId: number) => {
        if (!window.confirm('Xác nhận bạn đã nhận được hàng?')) return;

        try {
            // ✅ ĐÚNG: Gọi API shipping route
            const res = await fetch(`${API_CONFIG.SHIPPING}/${orderId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'received' })
            });

            if (res.ok) {
                alert('✅ Đã xác nhận nhận hàng thành công!');
                fetchOrders(); // Reload danh sách
            } else {
                const data = await res.json();
                alert('❌ Lỗi: ' + (data.message || data.error || 'Không thể cập nhật'));
            }
        } catch (err) {
            console.error('❌ Error:', err);
            alert('Không thể kết nối đến server');
        }
    };

    useEffect(() => {
        fetchOrders();

        // ✅ SOCKET: Lắng nghe cập nhật trạng thái đơn hàng realtime
        let socket: any;
        if (userId) {
            socket = io(API_CONFIG.SOCKET_URL, { ...SOCKET_IO_OPTIONS });
            socket.emit('register', userId);
            
            // Khi nhận thông báo cập nhật đơn hàng
            socket.on('notification', (data: any) => {
                console.log('🔔 Nhận thông báo:', data);
                
                // Nếu là thông báo về đơn hàng, reload orders
                if (data.type === 'order_tracking' && data.order_id) {
                    console.log('📦 Cập nhật đơn hàng #', data.order_id);
                    fetchOrders(); // Reload danh sách
                }
            });
        }

        return () => {
            if (socket) socket.disconnect();
        };
    }, [userId]);

    // ✅ Lọc orders theo status
    const filteredOrders = orders.filter(o => 
        filterStatus === 'all' || o.status === filterStatus
    );

    // ✅ THÊM: Hàm kiểm tra sản phẩm còn tồn tại trước khi đánh giá
    const handleReviewProduct = async (productId: number, productName: string) => {
        try {
// Kiểm tra sản phẩm có còn tồn tại không
            const res = await fetch(`${API_CONFIG.PRODUCTS}/${productId}`);
            
            if (!res.ok) {
                if (res.status === 404) {
                    alert(`❌ Sản phẩm "${productName}" đã bị xóa khỏi hệ thống.\n\nBạn không thể đánh giá sản phẩm này nữa.`);
                    return;
                }
                throw new Error('Không thể kiểm tra sản phẩm');
            }
            
            const product = await res.json();
            
            // Kiểm tra trạng thái sản phẩm
            if (product.status === 'deleted') {
                alert(`❌ Sản phẩm "${productName}" đã bị xóa khỏi hệ thống.\n\nBạn không thể đánh giá sản phẩm này nữa.`);
                return;
            }
            
            // Sản phẩm còn tồn tại → Navigate đến trang chi tiết
            navigate(`/product/${productId}`, { 
                state: { activeTab: 'review' } 
            });
            
        } catch (error) {
            console.error('❌ Check product error:', error);
            alert('❌ Không thể kiểm tra sản phẩm. Vui lòng thử lại sau.');
        }
    };

    { /* Thêm helper trạng thái (đặt ngay trong component, trước return) */ }
const STATUS_FLOW = ['pending', 'processing', 'shipped', 'delivered', 'received', 'cancelled'];
function canConfirmReceived(status: string) {
	// Cho phép buyer xác nhận khi đã ở giai đoạn giao vận (shipped) hoặc delivered, nhưng không khi đã received hoặc cancelled
	if (!status) return false;
	if (status === 'received' || status === 'cancelled') return false;
	const idx = STATUS_FLOW.indexOf(status);
	return idx >= STATUS_FLOW.indexOf('shipped') && idx < STATUS_FLOW.indexOf('received');
}
function canShowReview(status: string) {
	// Chỉ cho review khi đã "received"
	return status === 'received';
}

    return (
        <div style={{maxWidth:900, margin:'32px auto', background:'#fff', borderRadius:8, boxShadow:'0 2px 12px rgba(0,0,0,0.08)', padding:32}}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{margin: 0}}>🧾 Lịch sử mua hàng</h2>
                {/* ✅ Filter dropdown */}
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)} 
                    style={{
                        padding: '8px 16px',
                        borderRadius: 6,
                        border: '1px solid #e0e0e0',
                        fontSize: 14,
                        background: 'rgba(0,0,0,0.05)'
                    }}
                >
                    <option value="all">Tất cả đơn hàng</option>
                    <option value="pending">Chờ xử lý</option>
                    <option value="processing">Đang xử lý</option>
                    <option value="shipped">Đã giao vận chuyển</option>
                    <option value="delivered">Đã giao hàng</option>
                    <option value="received">Đã nhận</option>
                    <option value="cancelled">Đã hủy</option>
                </select>
            </div>
            {loading && <div>Đang tải lịch sử đơn hàng...</div>}
            {error && <div style={{color:'red', marginBottom:16}}>{error}</div>}  
            {!loading && !error && filteredOrders.length === 0 && (
                <div style={{textAlign:'center', padding:24}}>Bạn chưa có đơn hàng nào.</div>
            )}
            {!loading && !error && filteredOrders.length > 0 && (
                <div className="order-history-page">
{filteredOrders.map((order, orderIndex) => (
                        <div key={`order-${order.id || orderIndex}`} style={{ 
                            marginBottom: 32,
                            padding: 16,
                            borderRadius: 8,
                            background: '#fff', 
                            border: '1px solid #e0e0e0',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                        }}>
                            {/* Header đơn hàng */}
                            <div style={{ 
                                marginBottom: 16, 
                                paddingBottom: 12, 
                                borderBottom: '2px solid #f5f5f5',
                                fontSize: 14, color: '#666'
                            }}>
                                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                    <div>
                                        <h3 style={{margin: 0, fontSize: 18}}>Đơn hàng #{order.id}</h3>
                                        <p style={{margin: '4px 0 0', fontSize: 13, color: '#888'}}>
                                            {new Date(order.created_at).toLocaleString('vi-VN')}
                                        </p>
                                    </div>
                                    {/* ✅ Badge trạng thái với màu */}
                                    <div style={{display: 'flex', gap: 12, alignItems: 'center'}}>
                                        <div style={{
                                            background: getOrderStatusColor(order.status),
                                            color: '#fff',
                                            padding: '6px 16px',
                                            borderRadius: 20,
                                            fontSize: 13,
                                        }}>
                                            {ORDER_STATUS_LABELS[order.status] || order.status}
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Địa chỉ giao hàng */}
                                {order.shipping_address && (
                                    <div style={{marginTop: 8, fontSize: 14, color: '#666'}}>
                                        <strong>📍 Giao tới:</strong> {order.shipping_address}
                                    </div>
                                )}
                            </div>

                            {/* Danh sách sản phẩm */}
                            {order.items && order.items.length > 0 ? (
                                order.items.map((item, idx) => (
                                    <div key={`${order.id}-${item.product_id}-${idx}`} style={{ 
display: 'flex',
                                        padding: '12px 0',
                                        borderBottom: '1px solid #eee',
                                        alignItems: 'center'
                                    }}>
                                        <img 
                                            src={item.image_url ? `${API_ORIGIN}${item.image_url}` : '/img/default.jpg'} 
                                            alt={item.name} 
                                            style={{ 
                                                width: 60, 
                                                height: 60, 
                                                borderRadius: 6,
                                                objectFit: 'cover',
                                                border: '1px solid #eee'
                                            }}
                                        />
                                        <div style={{flex: 1, marginLeft: 12}}>
                                            <strong style={{ fontSize: 15, color: '#333' }}>{item.name}</strong>
                                            <div style={{ fontSize: 14, color: '#666', marginTop: 4 }}>
                                                Số lượng: <strong>{item.quantity}</strong> × {Number(item.price_per_item).toLocaleString('vi-VN')}đ
                                            </div>
                                        </div>
                                        
                                        {/* ✅ THÊM: Timeline trạng thái */}
                                        <div style={{
                                            background: '#f9f9f9',
                                            padding: 8,
                                            borderRadius: 6,
                                            marginLeft: 12,
                                            fontSize: 13,
                                            display: 'flex',
                                            gap: 8,
                                            alignItems: 'center'
                                        }}>
                                            <strong style={{ color: '#38b000' }}>
                                                {ORDER_STATUS_LABELS[order.status]}
                                            </strong>
                                            {['pending', 'processing', 'shipped', 'delivered', 'received'].map((s, idx) => {
                                                const isActive = ['pending', 'processing', 'shipped', 'delivered', 'received'].indexOf(order.status) >= idx;
                                                const isCurrent = order.status === s;
                                                return (
                                                    <React.Fragment key={s}>
<div style={{ 
                                                            width: 8, 
                                                            height: 8, 
                                                            borderRadius: '50%',
                                                            background: isActive ? getOrderStatusColor(s) : '#ddd',
                                                            position: 'relative',
                                                            flexShrink: 0
                                                        }}>
                                                            {isCurrent && (
                                                                <div style={{ 
                                                                    position: 'absolute',
                                                                    top: '50%',
                                                                    left: '50%',
                                                                    transform: 'translate(-50%, -50%)',
                                                                    width: 12,
                                                                    height: 12,
                                                                    borderRadius: '50%',
                                                                    border: `3px solid #fff`,
                                                                    background: getOrderStatusColor(s),
                                                                    boxShadow: `0 0 0 2px ${getOrderStatusColor(s)}`
                                                                }} />
                                                            )}
                                                        </div>
                                                        {idx < 4 && (
                                                            <div style={{
                                                                width: 40,
                                                                height: 2,
                                                                background: isActive ? getOrderStatusColor(s) : '#ddd',
                                                                borderRadius: 6,
                                                                marginTop: 8
                                                            }} />
                                                        )}
                                                    </React.Fragment>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div style={{color:'#888', padding:12}}>Không có sản phẩm trong đơn hàng này.</div>
)}

                            {/* Tổng tiền */}
                            <div style={{
                                marginTop: 16,
                                paddingTop: 16,
                                borderTop: '2px solid #f5f5f5',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: 16
                            }}>
                                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                    {/* ✅ Nút xác nhận đã nhận hàng (khi status = delivered) */}
                                    {canConfirmReceived(order.status) && (
                                        <button
                                            onClick={() => handleConfirmReceived(order.id)}
                                            style={{
                                                background: '#38b000',
                                                color: '#fff',
                                                border: 'none',
                                                padding: '10px 20px',
                                                borderRadius: 6,
                                                cursor: 'pointer',
                                                fontSize: 14,
                                                fontWeight: 600,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 8,
                                                transition: 'all 0.3s'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = '#2d8f00';
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = '#38b000';
                                                e.currentTarget.style.transform = 'translateY(0)';
                                            }}
                                        >
                                            ✅ Đã nhận hàng
                                        </button>
                                    )}

                                    {/* ✅ SỬA: Thêm kiểm tra sản phẩm trước khi navigate */}
                                    {canShowReview(order.status) && order.items && order.items.length > 0 && (
<div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                                            <div style={{ fontSize: 13, color: '#666', fontWeight: 600, marginBottom: 4 }}>
                                                📝 Đánh giá sản phẩm:
                                            </div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                                {order.items.map((item, idx) => (
                                                    <button
                                                        key={`${order.id}-${item.product_id}-${idx}`}
                                                        onClick={() => handleReviewProduct(item.product_id, item.name)}
                                                        style={{
                                                            background: 'linear-gradient(135deg, #FF6B35 0%, #ff5722 100%)',
                                                            color: '#fff',
                                                            border: 'none',
                                                            padding: '8px 16px',
                                                            borderRadius: 6,
                                                            cursor: 'pointer',
                                                            fontSize: 13,
                                                            fontWeight: 600,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 6,
                                                            transition: 'all 0.3s',
                                                            boxShadow: '0 2px 8px rgba(255,107,53,0.3)'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.background = 'linear-gradient(135deg, #ff5722 0%, #f4511e 100%)';
                                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(255,107,53,0.4)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.background = 'linear-gradient(135deg, #FF6B35 0%, #ff5722 100%)';
                                                            e.currentTarget.style.transform = 'translateY(0)';
                                                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(255,107,53,0.3)';
}}
                                                        title={`Đánh giá: ${item.name}`}
                                                    >
                                                        ⭐ {item.name.substring(0, 15)}{item.name.length > 15 ? '...' : ''}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div style={{textAlign: 'right'}}>
                                    <span style={{fontSize: 16, color: '#666'}}>Tổng cộng: </span>
                                    <strong style={{fontSize: 20, color: '#38b000'}}>
                                        {Number(order.total_amount).toLocaleString('vi-VN')}đ
                                    </strong>
                                </div>
                            </div>
                            {/* ✅ Nút "Chi tiết" luôn hiện (chuyển tới danh sách vận chuyển với query) */}
                            <button
                                onClick={() => navigate(`/shipping-list?orderId=${order.id}`)}
                                style={{
                                    background: '#1976d2',
                                    color: '#fff',
                                    border: 'none',
                                    padding: '10px 16px',
                                    borderRadius: 6,
                                    cursor: 'pointer',
                                    fontSize: 14,
                                    fontWeight: 600,
                                    transition: 'all 0.3s',
                                    willChange: 'transform'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#155a9c';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = '#1976d2';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                                title="Xem chi tiết vận chuyển"
                            >
                                🚚 Chi tiết vận chuyển
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default OrderHistory;