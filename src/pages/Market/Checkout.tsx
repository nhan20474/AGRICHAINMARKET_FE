import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cartService } from '../../services/cartService';
import { discountService } from '../../services/discountService';
import { API_CONFIG } from '../../config/apiConfig';

function getUserId() {
    try {
        const userStr = localStorage.getItem('user');
        if (userStr) return Number(JSON.parse(userStr).id);
    } catch {}
    return null;
}

const CheckoutPage: React.FC = () => {
    const navigate = useNavigate();
    const userId = getUserId();
    
    const [cartItems, setCartItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- STATE CHO MÃ GIẢM GIÁ ---
    const [discountCode, setDiscountCode] = useState(''); // Mã người dùng nhập
    const [appliedDiscount, setAppliedDiscount] = useState<{ code: string, percent: number } | null>(null); // Mã đã áp dụng thành công
    const [discountError, setDiscountError] = useState('');
    // -----------------------------
    
    // ✅ THÊM: State cho payment method
    const [paymentMethod, setPaymentMethod] = useState<'cod' | 'momo' | 'vnpay'>('cod');
    
    // ✅ THÊM: State cho QR modal
    const [showQrModal, setShowQrModal] = useState(false);
    const [qrImage, setQrImage] = useState('');
    const [currentOrderId, setCurrentOrderId] = useState<number | null>(null);
    const [tempOrderId, setTempOrderId] = useState<number | null>(null); // ✅ Lưu orderId tạm

    const [form, setForm] = useState({
        name: '',
        phone: '',
        address: '', // Địa chỉ nhà riêng (nếu cần lưu user profile)
        note: '',
        shipping_address: '' // Địa chỉ giao hàng thực tế (quan trọng)
    });

    // ✅ THÊM: State cho validation errors từng field
    const [fieldErrors, setFieldErrors] = useState({
        name: '',
        phone: '',
        shipping_address: ''
    });

    // 1. Tải giỏ hàng khi vào trang
    useEffect(() => {
        if (!userId) { setLoading(false); return; }
        
        fetch(`${API_CONFIG.BASE_URL}/cart/${userId}`)
            .then(res => res.json())
            .then(data => {
                // ✅ SỬA LỖI: Xử lý đúng cấu trúc { items: [], total: 0 }
                const itemsList = data.items || (Array.isArray(data) ? data : []);

                if (itemsList.length > 0) {
                    const items = itemsList.map((item: any) => ({
                        id: item.cart_id,
                        product_id: item.product_id,
                        name: item.name,
                        price: Number(item.current_price || item.price), // Lấy giá chính xác
                        quantity: item.cart_quantity,
                        unit: item.unit,
                        image_url: item.image_url
                    }));
                    setCartItems(items);
                } else {
                    // Không set error ở đây để tránh hiện lỗi đỏ khi giỏ hàng thực sự trống (do người dùng chưa mua)
                    // Chỉ set items rỗng
                    setCartItems([]);
                }
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setError('Lỗi tải giỏ hàng.');
                setLoading(false);
            });
    }, [userId]);

    // Listen for messages from payment popup (postMessage) to update UI in-place
    useEffect(() => {
        const handler = (ev: MessageEvent) => {
            try {
                if (!ev.data || ev.origin !== window.location.origin) return;
                const { type, status, orderId } = ev.data as any;
                if (type !== 'payment_result') return;
                if (status === 'success') {
                    setSuccess(`✅ Thanh toán thành công cho đơn #${orderId}`);
                    setCartItems([]);
                    localStorage.removeItem('cart');
                    sessionStorage.removeItem('pending_payment_order');
                    sessionStorage.removeItem('pending_payment_amount');
                    window.dispatchEvent(new Event('cart-updated'));
                } else if (status === 'failed') {
                    setError(`❌ Thanh toán thất bại cho đơn #${orderId}.`);
                } else if (status === 'pending') {
                    setError(`⏳ Thanh toán đang xử lý cho đơn #${orderId}. Vui lòng kiểm tra Lịch sử đơn hàng.`);
                }
            } catch (e) { console.error('payment message handler error', e); }
        };
        window.addEventListener('message', handler);
        return () => window.removeEventListener('message', handler);
    }, []);

    const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // ✅ THÊM: Tính giảm giá
    const discountAmount = appliedDiscount ? Math.floor(totalAmount * appliedDiscount.percent / 100) : 0;
    const finalAmount = totalAmount - discountAmount;

    // ✅ HÀM: Tạo QR code demo
    const createDemoQR = async (orderId: number) => {
        try {
            const res = await fetch(`${API_CONFIG.BASE_URL}/payments/demo/create-qr`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order_id: orderId })
            });
            const data = await res.json();
            setQrImage(data.qrCodeDataURL);
            setCurrentOrderId(orderId);
            setShowQrModal(true);
        } catch (err) {
            alert('❌ Lỗi tạo QR code. Vui lòng thử lại.');
        }
    };

    // --- HÀM XỬ LÝ MÃ GIẢM GIÁ ---
    const handleApplyDiscount = async () => {
        if (!discountCode.trim()) return;
        setDiscountError('');
        
        try {
            // Gọi API kiểm tra mã
            const res = await discountService.validate(discountCode);
            if (res.success) {
                setAppliedDiscount({ code: res.code, percent: res.discount_percent });
                setDiscountCode(''); // ✅ Clear input sau khi áp dụng thành công
                alert(`🎉 ${res.message}`);
            }
        } catch (err: any) {
            setDiscountError(err.message || 'Mã không hợp lệ');
            setAppliedDiscount(null);
        }
    };

    // ✅ THÊM: Hàm xóa mã giảm giá
    const handleRemoveDiscount = () => {
        setAppliedDiscount(null);
        setDiscountCode('');
        setDiscountError('');
    };

    // ✅ HÀM MỚI: Xác nhận thanh toán (TẠO ĐƠN LÚC NÀY)
    const confirmDemoPayment = async () => {
        const pendingData = sessionStorage.getItem('pendingOrder');
        if (!pendingData) return alert('Lỗi: Không tìm thấy dữ liệu đơn hàng');
        
        const orderPayload = JSON.parse(pendingData);
        
        try {
            // TẠO ĐƠN HÀNG SAU KHI THANH TOÁN
            const orderRes = await fetch(`${API_CONFIG.BASE_URL}/orders/${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderPayload)
            });

            const orderData = await orderRes.json();

            // Robust extraction of order id from various backend shapes
            const orderIdRaw =
                orderData?.order_id ??
                orderData?.id ??
                orderData?.order?.id ??
                orderData?.orderId ??
                orderData?.data?.order_id ??
                null;
            const orderId = orderIdRaw != null ? Number(orderIdRaw) : NaN;
            if (!orderId || isNaN(orderId)) {
                throw new Error('Backend không trả về order_id hợp lệ');
            }

            if (orderRes.ok) {
                // Gọi API xác nhận thanh toán
                await fetch(`${API_CONFIG.BASE_URL}/payments/demo/confirm-payment`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ order_id: orderId })
                });
                
                setCartItems([]);
                localStorage.removeItem('cart');
                sessionStorage.removeItem('pendingOrder');
                window.dispatchEvent(new Event('cart-updated'));
                
                setShowQrModal(false);
                setSuccess(`✅ Thanh toán thành công! Mã đơn: #${orderId}\n💳 Đã thanh toán qua ${paymentMethod.toUpperCase()}`);
            } else {
                alert(`❌ Lỗi tạo đơn hàng: ${orderData.error}`);
            }
        } catch (err) {
            alert('❌ Lỗi xác nhận thanh toán.');
        }
    };

    // ✅ SỬA: Hủy modal (KHÔNG XÓA ĐƠN HÀNG)
    const cancelPayment = () => {
        setShowQrModal(false);
        setQrImage('');
        setCurrentOrderId(null);
        // ❌ KHÔNG gọi API DELETE orders
        // Đơn hàng vẫn tồn tại với payment_status = 'pending'
        // User có thể vào Order History để thanh toán lại
    };

    // ✅ ĐẢM BẢO: Khi thanh toán MoMo, chỉ cần truyền đúng số tiền tổng cộng (finalAmount) và orderId đầu tiên (test/demo)
    const createMomoPayment = async (orderId: number, totalAmount: number) => {
        // Kiểm tra dữ liệu đầu vào
        if (!orderId || isNaN(Number(orderId))) {
            alert('❌ orderId không hợp lệ!');
            setIsSubmitting(false);
            return;
        }
        if (isNaN(totalAmount) || totalAmount < 1000 || totalAmount > 50000000) {
            alert('❌ Số tiền thanh toán không hợp lệ!');
            setIsSubmitting(false);
            return;
        }
        // Log giá trị truyền đi để debug
        console.log('Gửi MoMo:', { orderId, totalAmount, type_orderId: typeof orderId, type_totalAmount: typeof totalAmount });
        try {
            const res = await fetch(`${API_CONFIG.BASE_URL}/payments/momo/create-payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    order_id: Number(orderId), 
                    total_amount: Math.round(Number(totalAmount)) 
                })
            });
            let data = null;
            try {
                data = await res.json();
            } catch (jsonErr) {
                console.error('Lỗi parse JSON MoMo:', jsonErr);
            }
            if (!res.ok) {
                // Log chi tiết lỗi trả về từ backend
                console.error('MoMo API trả về lỗi:', data);
                throw new Error((data && data.error) ? data.error : `HTTP ${res.status}`);
            }
            if (data && data.success && data.payUrl) {
                sessionStorage.setItem('pending_payment_order', orderId.toString());
                const newWin = window.open(data.payUrl, '_blank');
                if (newWin) {
                    try { newWin.focus(); } catch {}
                    alert('Thanh toán đã mở ở tab mới. Sau khi hoàn tất, đóng tab và quay lại trang này để kiểm tra trạng thái đơn hàng.');
                } else {
                    // Popup blocked -> perform full redirect
                    window.location.href = data.payUrl;
                }
                return;
            }
            if (data && data.qrCodeUrl) {
                setCurrentOrderId(orderId);
                setQrImage(data.qrCodeUrl);
                setShowQrModal(true);
                return;
            }
            throw new Error((data && data.error) ? data.error : 'Không nhận được URL thanh toán từ MoMo');
        } catch (err: any) {
            alert(`❌ Lỗi kết nối MoMo: ${err.message}`);
            setIsSubmitting(false);
        }
    };

    // ✅ THÊM: Hàm tạo payment VNPay (giống MoMo)
    const createVnPayPayment = async (orderId: number, totalAmount: number) => {
        // input validation
        if (!orderId || isNaN(Number(orderId))) {
            alert('❌ orderId không hợp lệ!');
            setIsSubmitting(false);
            return;
        }
        if (isNaN(totalAmount) || totalAmount < 1000 || totalAmount > 50000000) {
            alert('❌ Số tiền thanh toán không hợp lệ!');
            setIsSubmitting(false);
            return;
        }

        console.log('Gửi VNPay:', { orderId, totalAmount });

        try {
            const res = await fetch(`${API_CONFIG.BASE_URL}/payments/vnpay/create-payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order_id: Number(orderId), total_amount: Math.round(Number(totalAmount)) })
            });

            let data: any = null;
            try { data = await res.json(); } catch (e) { data = null; }

            // Handle HTTP errors
            if (!res.ok) {
                console.error('VNPay API trả lỗi:', data);
                throw new Error((data && (data.error || data.message)) ? (data.error || data.message) : `HTTP ${res.status}`);
            }

            // Standard success with redirect URL
            if (data && (data.success || data.payUrl)) {
                const payUrl = data.payUrl || data.paymentUrl || data.url || data.redirectUrl;
                if (payUrl) {
                    sessionStorage.setItem('pending_payment_order', String(orderId));
                    if (data.txnRef) sessionStorage.setItem('pending_txnRef', String(data.txnRef));
                    sessionStorage.setItem('pending_payment_amount', String(Math.round(Number(totalAmount))));
                    const newWin = window.open(payUrl, '_blank');
                    if (newWin) {
                        try { newWin.focus(); } catch {}
                        alert('Thanh toán đã mở ở tab mới. Sau khi hoàn tất, đóng tab và quay lại trang này để kiểm tra trạng thái đơn hàng.');

                        // Start background polling to detect payment status even if the payment page
                        // shows raw JSON or doesn't postMessage back. This updates the current UI.
                        (async () => {
                            const timeoutMs = 2 * 60 * 1000; // 2 minutes
                            const interval = 3000;
                            const start = Date.now();
                            try {
                                while (Date.now() - start < timeoutMs) {
                                    try {
                                        const r = await fetch(`${API_CONFIG.BASE_URL}/payments/status/${orderId}`);
                                        if (r.ok) {
                                            const jr = await r.json().catch(() => null);
                                            if (jr) {
                                                if (jr.isPaid || jr.payment_status === 'paid') {
                                                    setSuccess(`✅ Thanh toán thành công cho đơn #${orderId}`);
                                                    sessionStorage.removeItem('pending_payment_order');
                                                    sessionStorage.removeItem('pending_payment_amount');
                                                    sessionStorage.removeItem('pending_txnRef');
                                                    setCartItems([]); localStorage.removeItem('cart'); window.dispatchEvent(new Event('cart-updated'));
                                                    try { newWin.close(); } catch {}
                                                    return;
                                                }
                                                if (jr.payment_status === 'failed') {
                                                    setError(`❌ Thanh toán đơn #${orderId} thất bại.`);
                                                    sessionStorage.removeItem('pending_payment_order');
                                                    sessionStorage.removeItem('pending_payment_amount');
                                                    try { newWin.close(); } catch {}
                                                    return;
                                                }
                                            }
                                        }
                                    } catch (e) { /* ignore and retry */ }
                                    await new Promise(res => setTimeout(res, interval));
                                }
                                // timeout
                                setError('Giao dịch đang được xử lý. Vui lòng kiểm tra Lịch sử đơn hàng sau vài phút.');
                            } catch (e) {
                                console.error('Background payment poller error', e);
                            } finally {
                                setIsSubmitting(false);
                            }
                        })();

                    } else {
                        window.location.href = payUrl;
                    }
                    return;
                }
            }

            // If backend returned QR
            if (data && data.qrCodeUrl) {
                setCurrentOrderId(orderId);
                setQrImage(data.qrCodeUrl);
                setShowQrModal(true);
                sessionStorage.setItem('pending_payment_order', String(orderId));
                sessionStorage.setItem('pending_payment_amount', String(Math.round(Number(totalAmount))));
                return;
            }

            // If response contains raw URL field
            const possibleUrl = data && (data.payUrl || data.paymentUrl || data.url || data.redirectUrl || (data.data && data.data.url));
            if (possibleUrl) {
                sessionStorage.setItem('pending_payment_order', String(orderId));
                sessionStorage.setItem('pending_payment_amount', String(Math.round(Number(totalAmount))));
                const newWin = window.open(possibleUrl, '_blank');
                if (newWin) {
                    try { newWin.focus(); } catch {}
                    alert('Thanh toán đã mở ở tab mới. Sau khi hoàn tất, đóng tab và quay lại trang này để kiểm tra trạng thái đơn hàng.');
                } else {
                    window.location.href = possibleUrl;
                }
                return;
            }

            throw new Error((data && (data.error || data.message)) ? (data.error || data.message) : 'Không nhận được URL thanh toán từ VNPay');
        } catch (err: any) {
            console.error('❌ createVnPayPayment error:', err);
            alert(`❌ Lỗi kết nối VNPay: ${err?.message || err}`);
            setIsSubmitting(false);
        }
    };

    // ✅ CẬP NHẬT: Hàm handleSubmit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (!userId) return setError('Bạn cần đăng nhập.');
        if (fieldErrors.name || fieldErrors.phone || fieldErrors.shipping_address) {
            setError('Vui lòng sửa các lỗi trên form trước khi tiếp tục');
            return;
        }
        if (cartItems.length === 0) return setError('Giỏ hàng trống.');
        setIsSubmitting(true);

        try {
            // ✅ Tạo 1 đơn hàng duy nhất cho tất cả sản phẩm (test/demo)
            const orderPayload = {
                shipping_address: `${form.name} - ${form.phone} - ${form.shipping_address}${form.note ? ` (Ghi chú: ${form.note})` : ''}`,
                items: cartItems.map(item => ({
                    product_id: item.product_id,
                    quantity: item.quantity,
                    price: item.price
                })),
                payment_method: paymentMethod,
                discount_code: appliedDiscount ? appliedDiscount.code : null
            };

            const orderRes = await fetch(`${API_CONFIG.BASE_URL}/orders/${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderPayload)
            });

            if (!orderRes.ok) {
                const errorData = await orderRes.json();
                throw new Error(errorData.error || `HTTP ${orderRes.status}`);
            }

            const orderData = await orderRes.json();
            // Robust extraction of order id from various backend shapes
            const orderIdRaw =
                orderData?.order_id ??
                orderData?.id ??
                orderData?.order?.id ??
                orderData?.orderId ??
                orderData?.data?.order_id ??
                null;
            const orderId = orderIdRaw != null ? Number(orderIdRaw) : NaN;
            if (!orderId || isNaN(orderId)) {
                throw new Error('Backend không trả về order_id hợp lệ');
            }

            if (paymentMethod === 'cod') {
                setSuccess(
                    `✅ Đặt hàng thành công!\n` +
                    `📦 Mã đơn: #${orderId}\n` +
                    `💵 Thanh toán khi nhận hàng`
                );
                setCartItems([]);
                localStorage.removeItem('cart');
                window.dispatchEvent(new Event('cart-updated'));
            } else if (paymentMethod === 'momo') {
                // Kiểm tra dữ liệu trước khi gọi MoMo
                if (!orderId || isNaN(Number(orderId))) {
                    alert('❌ orderId không hợp lệ!');
                    setIsSubmitting(false);
                    return;
                }
                if (isNaN(finalAmount) || finalAmount < 1000 || finalAmount > 50000000) {
                    alert('❌ Số tiền thanh toán không hợp lệ!');
                    setIsSubmitting(false);
                    return;
                }
                // Chỉ truyền orderId đầu tiên và số tiền tổng cộng (finalAmount)
                await createMomoPayment(orderId, finalAmount);
            } else if (paymentMethod === 'vnpay') {
                // Gọi API tạo payment VNPay
                await createVnPayPayment(orderId, finalAmount);
            }
        } catch (err: any) {
            setError(`❌ ${err.message || 'Lỗi kết nối server'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- RENDER ---

    if (loading) return <div className="checkout-page"><main className="checkout-content"><p>Đang tải...</p></main></div>;

    if (!userId) {
        return (
            <div className="checkout-page">
                <main className="checkout-content">
                    <div className="alert-error">Bạn cần đăng nhập để thanh toán.</div>
                    <button className="back-btn" onClick={() => navigate('/login')}><ArrowLeft size={18} /> Đăng nhập</button>
                </main>
            </div>
        );
    }

    if (cartItems.length === 0 && !success) {
        return (
            <div className="checkout-page">
                <main className="checkout-content">
                    <div className="alert-error">Giỏ hàng trống.</div>
                    <button className="back-btn" onClick={() => navigate('/products')}><ArrowLeft size={18} /> Mua sắm ngay</button>
                </main>
            </div>
        );
    }

    // Giao diện thành công
    if (success) {
        return (
            <div className="checkout-page">
                <main className="checkout-content success-view" style={{textAlign:'center', padding: 40}}>
                    <CheckCircle size={64} color="#28a745" style={{marginBottom: 20}} />
                    <h2 style={{color: '#28a745'}}>Đặt hàng thành công!</h2>
                    <p>{success}</p>
                    <div style={{marginTop: 30, display:'flex', gap: 15, justifyContent:'center', flexWrap: 'wrap'}}>
                        <button 
                            onClick={() => navigate('/products')}
                            style={{
                                background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
                                color: '#fff',
                                border: 'none',
                                padding: '14px 28px',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                fontSize: '15px',
                                fontWeight: '600',
                                boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 6px 18px rgba(76, 175, 80, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.3)';
                            }}
                        >
                            Tiếp tục mua sắm
                        </button>
                        <button 
                            onClick={() => navigate('/order-history')}
                            style={{
                                background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
                                color: '#fff',
                                border: 'none',
                                padding: '14px 28px',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                fontSize: '15px',
                                fontWeight: '600',
                                boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 6px 18px rgba(33, 150, 243, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(33, 150, 243, 0.3)';
                            }}
                        >
                            Xem đơn hàng
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    // ✅ SỬA: handleChange với real-time validation
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
        
        // ✅ THÊM: Clear error message chung khi user đang nhập
        setError('');
        
        // ✅ THÊM: Real-time validation cho từng field
        switch(name) {
            case 'name':
                if (!value.trim()) {
                    setFieldErrors(prev => ({ ...prev, name: 'Vui lòng nhập họ tên' }));
                } else if (value.trim().length < 3) {
                    setFieldErrors(prev => ({ ...prev, name: 'Họ tên phải có ít nhất 3 ký tự' }));
                } else if (value.trim().length > 50) {
                    setFieldErrors(prev => ({ ...prev, name: 'Họ tên tối đa 50 ký tự' }));
                } else {
                    setFieldErrors(prev => ({ ...prev, name: '' }));
                }
                break;
                
            case 'phone':
                const phoneClean = value.replace(/\s/g, '');
                const phoneRegex = /^(0|\+84)(3[2-9]|5[6|8|9]|7[0|6-9]|8[1-9]|9[0-9])[0-9]{7}$/;
                
                if (!value.trim()) {
                    setFieldErrors(prev => ({ ...prev, phone: 'Vui lòng nhập số điện thoại' }));
                } else if (!phoneRegex.test(phoneClean)) {
                    setFieldErrors(prev => ({ ...prev, phone: 'Số điện thoại không hợp lệ (VD: 0901234567)' }));
                } else if (phoneClean.startsWith('0') && phoneClean.length !== 10) {
                    setFieldErrors(prev => ({ ...prev, phone: 'Số điện thoại phải có đúng 10 số' }));
                } else if (phoneClean.startsWith('+84') && phoneClean.length !== 12) {
                    setFieldErrors(prev => ({ ...prev, phone: 'Số điện thoại phải có đúng 12 ký tự khi dùng +84' }));
                } else {
                    setFieldErrors(prev => ({ ...prev, phone: '' }));
                }
                break;
                
            case 'shipping_address':
                if (!value.trim()) {
                    setFieldErrors(prev => ({ ...prev, shipping_address: 'Vui lòng nhập địa chỉ giao hàng' }));
                } else if (value.trim().length < 10) {
                    setFieldErrors(prev => ({ ...prev, shipping_address: 'Địa chỉ quá ngắn (tối thiểu 10 ký tự)' }));
                } else {
                    setFieldErrors(prev => ({ ...prev, shipping_address: '' }));
                }
                break;
                
            default:
                break;
        }
    };

    return (
        <div className="checkout-page">
            <main className="checkout-content" style={{
                maxWidth: '1400px',
                margin: '0 auto',
                padding: '32px 24px'
            }}>
                {/* ✅ SỬA: Nút Quay lại đẹp hơn */}
                <button 
                    className="back-btn" 
                    onClick={() => navigate('/cart')}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 24px',
                        background: '#fff',
                        border: '2px solid #e0e0e0',
                        borderRadius: '12px',
                        color: '#333',
                        fontSize: '15px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        marginBottom: '24px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.background = '#f8f9fa';
                        e.currentTarget.style.borderColor = '#38b000';
                        e.currentTarget.style.color = '#38b000';
                        e.currentTarget.style.transform = 'translateX(-4px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(56,176,0,0.15)';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.background = '#fff';
                        e.currentTarget.style.borderColor = '#e0e0e0';
                        e.currentTarget.style.color = '#333';
                        e.currentTarget.style.transform = 'translateX(0)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                    }}
                >
                    <ArrowLeft size={20} />
                    Quay lại giỏ hàng
                </button>
                
                <h2 className="section-title" style={{
                    textAlign: 'center',
                    fontSize: '28px',
                    fontWeight: '700',
                    color: '#333',
                    marginBottom: '8px'
                }}>
                    💳 Thanh toán đơn hàng
                </h2>
                <p style={{
                    textAlign: 'center',
                    color: '#666',
                    marginBottom: '32px',
                    fontSize: '15px'
                }}>
                    Vui lòng điền đầy đủ thông tin để hoàn tất đơn hàng
                </p>
                
                <div className="checkout-layout" style={{
                    display: 'grid',
                    gridTemplateColumns: '1.2fr 1fr',
                    gap: 40,
                    maxWidth: '1200px',
                    margin: '0 auto'
                }}>
                    {/* CỘT TRÁI: THÔNG TIN GIAO HÀNG */}
                    <form className="checkout-form" onSubmit={handleSubmit} style={{
                        background: '#fff',
                        borderRadius: '16px',
                        padding: '32px',
                        boxShadow: '0 2px 16px rgba(0,0,0,0.08)'
                    }}>
                        <h3 style={{
                            fontSize: '20px',
                            fontWeight: '700',
                            color: '#333',
                            marginBottom: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            📦 Thông tin nhận hàng
                        </h3>
                        
                        {/* Error tổng quát */}
                        {error && (
                            <div style={{
                                marginBottom: 20,
                                padding: '14px 16px',
                                background: '#ffebee',
                                border: '1px solid #f44336',
                                borderRadius: 8,
                                color: '#c62828',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                fontSize: 14
                            }}>
                                <AlertCircle size={20}/>
                                <span>{error}</span>
                            </div>
                        )}
                        
                        {/* ✅ Họ và tên - THÊM ERROR MESSAGE */}
                        <div className="form-group" style={{ marginBottom: '24px' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontWeight: '600',
                                color: '#333',
                                fontSize: '14px'
                            }}>
                                👤 Họ và tên người nhận <span style={{color: '#f44336'}}>*</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                required
                                minLength={3}
                                maxLength={50}
                                placeholder="Nguyễn Văn A"
                                style={{
                                    width: '100%',
                                    padding: '14px 16px',
                                    borderRadius: '10px',
                                    border: `2px solid ${fieldErrors.name ? '#f44336' : '#e0e0e0'}`,
                                    fontSize: '15px',
                                    outline: 'none',
                                    transition: 'all 0.3s',
                                    boxSizing: 'border-box'
                                }}
                                onFocus={(e) => {
                                    if (!fieldErrors.name) {
                                        e.currentTarget.style.borderColor = '#38b000';
                                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(56,176,0,0.1)';
                                    }
                                }}
                                onBlur={(e) => {
                                    if (!fieldErrors.name) {
                                        e.currentTarget.style.borderColor = '#e0e0e0';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }
                                }}
                            />
                            {/* ✅ THÊM: Error message real-time */}
                            {fieldErrors.name ? (
                                <small style={{
                                    fontSize: '12px',
                                    color: '#f44336',
                                    marginTop: '4px',
                                    display: 'block',
                                    fontWeight: '600'
                                }}>
                                    ❌ {fieldErrors.name}
                                </small>
                            ) : (
                                <small style={{
                                    fontSize: '12px',
                                    color: '#999',
                                    marginTop: '4px',
                                    display: 'block'
                                }}>
                                    Nhập đầy đủ họ và tên (3-50 ký tự)
                                </small>
                            )}
                        </div>

                        {/* ✅ Số điện thoại - THÊM ERROR MESSAGE */}
                        <div className="form-group" style={{ marginBottom: '24px' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontWeight: '600',
                                color: '#333',
                                fontSize: '14px'
                            }}>
                                📞 Số điện thoại <span style={{color: '#f44336'}}>*</span>
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                value={form.phone}
                                onChange={handleChange}
                                required
                                placeholder="0901234567"
                                maxLength={12}
                                style={{
                                    width: '100%',
                                    padding: '14px 16px',
                                    borderRadius: '10px',
                                    border: `2px solid ${fieldErrors.phone ? '#f44336' : '#e0e0e0'}`,
                                    fontSize: '15px',
                                    outline: 'none',
                                    transition: 'all 0.3s',
                                    boxSizing: 'border-box'
                                }}
                                onFocus={(e) => {
                                    if (!fieldErrors.phone) {
                                        e.currentTarget.style.borderColor = '#38b000';
                                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(56,176,0,0.1)';
                                    }
                                }}
                                onBlur={(e) => {
                                    if (!fieldErrors.phone) {
                                        e.currentTarget.style.borderColor = '#e0e0e0';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }
                                }}
                            />
                            {/* ✅ THÊM: Error message real-time */}
                            {fieldErrors.phone ? (
                                <small style={{
                                    fontSize: '12px',
                                    color: '#f44336',
                                    marginTop: '4px',
                                    display: 'block',
                                    fontWeight: '600'
                                }}>
                                    ❌ {fieldErrors.phone}
                                </small>
                            ) : (
                                <small style={{
                                    fontSize: '12px',
                                    color: '#999',
                                    marginTop: '4px',
                                    display: 'block'
                                }}>
                                    Nhập đúng 10 số, bắt đầu bằng 03, 05, 07, 08, 09 (VD: 0901234567, 0987654321)
                                </small>
                            )}
                        </div>

                        {/* ✅ Địa chỉ giao hàng - THÊM ERROR MESSAGE */}
                        <div className="form-group" style={{ marginBottom: '24px' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontWeight: '600',
                                color: '#333',
                                fontSize: '14px'
                            }}>
                                🏠 Địa chỉ giao hàng <span style={{color: '#f44336'}}>*</span>
                            </label>
                            <input
                                type="text"
                                name="shipping_address"
                                value={form.shipping_address}
                                onChange={handleChange}
                                required
                                minLength={10}
                                maxLength={200}
                                placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
                                style={{
                                    width: '100%',
                                    padding: '14px 16px',
                                    borderRadius: '10px',
                                    border: `2px solid ${fieldErrors.shipping_address ? '#f44336' : '#e0e0e0'}`,
                                    fontSize: '15px',
                                    outline: 'none',
                                    transition: 'all 0.3s',
                                    boxSizing: 'border-box'
                                }}
                                onFocus={(e) => {
                                    if (!fieldErrors.shipping_address) {
                                        e.currentTarget.style.borderColor = '#38b000';
                                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(56,176,0,0.1)';
                                    }
                                }}
                                onBlur={(e) => {
                                    if (!fieldErrors.shipping_address) {
                                        e.currentTarget.style.borderColor = '#e0e0e0';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }
                                }}
                            />
                            {/* ✅ THÊM: Error message real-time */}
                            {fieldErrors.shipping_address ? (
                                <small style={{
                                    fontSize: '12px',
                                    color: '#f44336',
                                    marginTop: '4px',
                                    display: 'block',
                                    fontWeight: '600'
                                }}>
                                    ❌ {fieldErrors.shipping_address}
                                </small>
                            ) : (
                                <small style={{
                                    fontSize: '12px',
                                    color: '#999',
                                    marginTop: '4px',
                                    display: 'block'
                                }}>
                                    Nhập đầy đủ địa chỉ chi tiết để giao hàng (tối thiểu 10 ký tự)
                                </small>
                            )}
                        </div>

                        {/* ✅ Ghi chú - Không cần validation */}
                        <div className="form-group" style={{ marginBottom: '28px' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontWeight: '600',
                                color: '#333',
                                fontSize: '14px'
                            }}>
                                📝 Ghi chú cho người bán <span style={{fontSize: '12px', color: '#999', fontWeight: 'normal'}}>(Tùy chọn)</span>
                            </label>
                            <textarea
                                name="note"
                                value={form.note}
                                onChange={handleChange}
                                maxLength={500}
                                placeholder="VD: Giao hàng giờ hành chính, gọi trước 15 phút..."
                                rows={3}
                                style={{
                                    width: '100%',
                                    padding: '14px 16px',
                                    borderRadius: '10px',
                                    border: '2px solid #e0e0e0',
                                    fontSize: '15px',
                                    outline: 'none',
                                    transition: 'all 0.3s',
                                    boxSizing: 'border-box',
                                    resize: 'vertical',
                                    fontFamily: 'inherit'
                                }}
                                onFocus={(e) => {
                                    e.currentTarget.style.borderColor = '#38b000';
                                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(56,176,0,0.1)';
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.borderColor = '#e0e0e0';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            />
                            <small style={{
                                fontSize: '12px',
                                color: '#999',
                                marginTop: '4px',
                                display: 'block'
                            }}>
                                {form.note.length}/500 ký tự
                            </small>
                        </div>

                        {/* ✅ THÊM: SECTION MÃ GIẢM GIÁ - Trước payment method */}
                        <div className="form-group" style={{ marginBottom: '28px', paddingBottom: '24px', borderBottom: '2px solid #e0e0e0' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: '12px',
                                fontWeight: '600',
                                color: '#333',
                                fontSize: '14px'
                            }}>
                                🎁 Mã giảm giá <span style={{fontSize: '12px', color: '#999', fontWeight: 'normal'}}>(Tùy chọn)</span>
                            </label>

                            {/* ✅ Hiển thị mã đã áp dụng */}
                            {appliedDiscount ? (
                                <div style={{
                                    background: '#e8f5e9',
                                    border: '2px solid #4caf50',
                                    borderRadius: '10px',
                                    padding: '16px',
                                    marginBottom: '12px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div>
                                        <div style={{
                                            fontWeight: '700',
                                            color: '#2e7d32',
                                            fontSize: '16px'
                                        }}>
                                            ✅ Mã: <span style={{color: '#1b5e20', fontFamily: 'monospace', fontSize: '18px'}}>{appliedDiscount.code.toUpperCase()}</span>
                                        </div>
                                        <div style={{
                                            fontSize: '14px',
                                            color: '#558b2f',
                                            marginTop: '6px'
                                        }}>
                                            Giảm {appliedDiscount.percent}% = -{discountAmount.toLocaleString('vi-VN')}đ
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleRemoveDiscount}
                                        style={{
                                            background: '#f44336',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '8px',
                                            padding: '10px 16px',
                                            cursor: 'pointer',
                                            fontSize: '13px',
                                            fontWeight: '700',
                                            transition: 'all 0.3s',
                                            whiteSpace: 'nowrap'
                                        }}
                                        onMouseOver={(e) => e.currentTarget.style.background = '#d32f2f'}
                                        onMouseOut={(e) => e.currentTarget.style.background = '#f44336'}
                                    >
                                        ❌ Xóa mã
                                    </button>
                                </div>
                            ) : (
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '12px',
                                    marginBottom: '12px'
                                }}>
                                    <input
                                        type="text"
                                        value={discountCode}
                                        onChange={(e) => {
                                            setDiscountCode(e.target.value.toUpperCase());
                                            setDiscountError('');
                                        }}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                handleApplyDiscount();
                                            }
                                        }}
                                        placeholder="VD: SAVE20, SUMMER50..."
                                        style={{
                                            width: '100%',
                                            padding: '18px 20px',
                                            borderRadius: '12px',
                                            border: `3px solid ${discountError ? '#f44336' : '#e0e0e0'}`,
                                            fontSize: '18px',
                                            outline: 'none',
                                            transition: 'all 0.3s',
                                            boxSizing: 'border-box',
                                            textTransform: 'uppercase',
                                            fontWeight: '700',
                                            letterSpacing: '1px'
                                        }}
                                        onFocus={(e) => {
                                            if (!discountError) {
                                                e.currentTarget.style.borderColor = '#38b000';
                                                e.currentTarget.style.boxShadow = '0 0 0 4px rgba(56,176,0,0.15)';
                                            }
                                        }}
                                        onBlur={(e) => {
                                            if (!discountError) {
                                                e.currentTarget.style.borderColor = '#e0e0e0';
                                                e.currentTarget.style.boxShadow = 'none';
                                            }
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleApplyDiscount}
                                        disabled={!discountCode.trim()}
                                        style={{
                                            width: '100%',
                                            padding: '16px 24px',
                                            borderRadius: '12px',
                                            border: 'none',
                                            background: discountCode.trim() ? '#38b000' : '#ccc',
                                            color: '#fff',
                                            fontSize: '16px',
                                            fontWeight: '700',
                                            cursor: discountCode.trim() ? 'pointer' : 'not-allowed',
                                            transition: 'all 0.3s',
                                            whiteSpace: 'nowrap'
                                        }}
                                        onMouseOver={(e) => {
                                            if (discountCode.trim()) {
                                                e.currentTarget.style.background = '#2d8f00';
                                                e.currentTarget.style.boxShadow = '0 4px 16px rgba(56,176,0,0.3)';
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                            }
                                        }}
                                        onMouseOut={(e) => {
                                            if (discountCode.trim()) {
                                                e.currentTarget.style.background = '#38b000';
                                                e.currentTarget.style.boxShadow = 'none';
                                                e.currentTarget.style.transform = 'translateY(0)';
                                            }
                                        }}
                                    >
                                        ✓ Áp dụng mã giảm giá
                                    </button>
                                </div>
                            )}

                            {/* ✅ Hiển thị lỗi giảm giá */}
                            {discountError && (
                                <small style={{
                                    fontSize: '13px',
                                    color: '#f44336',
                                    display: 'block',
                                    fontWeight: '600'
                                }}>
                                    ❌ {discountError}
                                </small>
                            )}
                        </div>

                        {/* ✅ CHỌN PHƯƠNG THỨC THANH TOÁN */}
                        <div className="form-group" style={{ marginTop: 20 }}>
                            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 10 }}>
                                💳 Phương thức thanh toán *
                            </label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {/* COD */}
                                <label style={{
                                    display: 'flex', alignItems: 'center', gap: 10, padding: 12, 
                                    border: `2px solid ${paymentMethod === 'cod' ? '#28a745' : '#ddd'}`,
                                    borderRadius: 8, cursor: 'pointer', background: paymentMethod === 'cod' ? '#f0fff4' : '#fff'
                                }}>
                                    <input 
                                        type="radio" 
                                        name="payment_method" 
                                        value="cod" 
                                        checked={paymentMethod === 'cod'} 
                                        onChange={(e) => setPaymentMethod(e.target.value as any)}
                                    />
                                    <span style={{ fontWeight: 600 }}>💵 Thanh toán khi nhận hàng (COD)</span>
                                </label>

                                {/* MoMo */}
                                <label style={{
                                    display: 'flex', alignItems: 'center', gap: 10, padding: 12,
                                    border: `2px solid ${paymentMethod === 'momo' ? '#A50064' : '#ddd'}`,
                                    borderRadius: 8, cursor: 'pointer', background: paymentMethod === 'momo' ? '#fff0f6' : '#fff'
                                }}>
                                    <input 
                                        type="radio" 
                                        name="payment_method" 
                                        value="momo" 
                                        checked={paymentMethod === 'momo'} 
                                        onChange={(e) => setPaymentMethod(e.target.value as any)}
                                    />
                                    <span style={{ fontWeight: 600 }}>📱 MoMo</span>
                                </label>

                                {/* VNPay */}
                                <label style={{
                                    display: 'flex', alignItems: 'center', gap: 10, padding: 12,
                                    border: `2px solid ${paymentMethod === 'vnpay' ? '#0066CC' : '#ddd'}`,
                                    borderRadius: 8, cursor: 'pointer', background: paymentMethod === 'vnpay' ? '#e6f2ff' : '#fff'
                                }}>
                                    <input 
                                        type="radio" 
                                        name="payment_method" 
                                        value="vnpay" 
                                        checked={paymentMethod === 'vnpay'} 
                                        onChange={(e) => setPaymentMethod(e.target.value as any)}
                                    />
                                    <span style={{ fontWeight: 600 }}>🏦 VNPay</span>
                                </label>

                                {/* ZaloPay removed */}
                            </div>
                        </div>

                        {/* ✅ NÚT SUBMIT - Disable nếu có lỗi */}
                        <button
                            type="submit"
                            className="confirm-btn"
                            disabled={isSubmitting || !!(fieldErrors.name || fieldErrors.phone || fieldErrors.shipping_address)}
                            style={{
                                width: '100%',
                                padding: '16px',
                                borderRadius: '12px',
                                border: 'none',
                                background: (isSubmitting || fieldErrors.name || fieldErrors.phone || fieldErrors.shipping_address) 
                                    ? '#ccc' 
                                    : 'linear-gradient(135deg, #38b000 0%, #2d8f00 100%)',
                                color: '#fff',
                                fontSize: '17px',
                                fontWeight: '700',
                                cursor: (isSubmitting || fieldErrors.name || fieldErrors.phone || fieldErrors.shipping_address) 
                                    ? 'not-allowed' 
                                    : 'pointer',
                                marginTop: 32,
                                boxShadow: (isSubmitting || fieldErrors.name || fieldErrors.phone || fieldErrors.shipping_address)
                                    ? 'none' 
                                    : '0 4px 16px rgba(56,176,0,0.3)',
                                transition: 'all 0.3s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            {isSubmitting ? (
                                <>
                                    <div style={{
                                        width: 20,
                                        height: 20,
                                        border: '3px solid rgba(255,255,255,0.3)',
                                        borderTop: '3px solid #fff',
                                        borderRadius: '50%',
                                        animation: 'spin 1s linear infinite'
                                    }}></div>
                                    Đang xử lý...
                                </>
                            ) : (
                                <>
                                    <CheckCircle size={20} />
                                    XÁC NHẬN ĐẶT HÀNG
                                </>
                            )}
                        </button>

                        <div style={{
                            marginTop: 16,
                            padding: 12,
                            background: '#fff3cd',
                            borderRadius: 8,
                            fontSize: 13,
                            color: '#856404',
                            textAlign: 'center'
                        }}>
                            🔒 Thông tin của bạn được bảo mật tuyệt đối
                        </div>
                    </form>

                    {/* CỘT PHẢI: TÓM TẮT ĐƠN HÀNG */}
                    <div className="checkout-summary" style={{background: '#f9f9f9', padding: 20, borderRadius: 8, height: 'fit-content'}}>
                        <h3 style={{marginTop:0}}>Đơn hàng của bạn</h3>
                        <ul style={{listStyle:'none', padding:0}}>
                            {cartItems.map(item => (
                                <li key={item.id} style={{display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid #eee'}}>
                                    <div>
                                        <div style={{fontWeight:600}}>{item.name}</div>
                                        <div style={{fontSize:13, color:'#666'}}>x {item.quantity} {item.unit}</div>
                                    </div>
                                    <div style={{fontWeight:600}}>
                                        {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                                    </div>
                                </li>
                            ))}
                        </ul>

                        {/* ✅ THÊM: Hiển thị giá, giảm giá, tổng cuối */}
                        <div style={{marginTop: 20, paddingTop: 20, borderTop: '2px solid #ddd'}}>
                            <div style={{display:'flex', justifyContent:'space-between', marginBottom: 10, fontSize: 15}}>
                                <span>Tổng tiền hàng:</span>
                                <span style={{fontWeight: 600}}>{totalAmount.toLocaleString('vi-VN')}đ</span>
                            </div>
                            
                            {appliedDiscount && (
                                <div style={{display:'flex', justifyContent:'space-between', marginBottom: 10, fontSize: 15, color: '#4caf50'}}>
                                    <span>Giảm giá ({appliedDiscount.percent}%):</span>
                                    <span style={{fontWeight: 600}}>-{discountAmount.toLocaleString('vi-VN')}đ</span>
                                </div>
                            )}

                            <div className="checkout-total" style={{marginTop: appliedDiscount ? 16 : 0, fontSize: 18, fontWeight:'bold', display:'flex', justifyContent:'space-between', color: '#d32f2f', paddingTop: 16, borderTop: '2px solid #ddd'}}>
                                <span>Tổng cộng:</span>
                                <span>{finalAmount.toLocaleString('vi-VN')}đ</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* ✅ MODAL QR CODE */}
            {showQrModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.75)', zIndex: 9999,
                    display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}>
                    <div style={{
                        background: '#fff', padding: 32, borderRadius: 12,
                        maxWidth: 450, width: '90%', textAlign: 'center',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                    }}>
                        <h3 style={{ marginTop: 0, fontSize: 20, color: '#333' }}>
                            {paymentMethod === 'momo' && '📱 Quét mã MoMo'}
                            {paymentMethod === 'vnpay' && '🏦 Quét mã VNPay'}
                            {/* ZaloPay removed */}
                        </h3>
                        
                        <p style={{ color: '#666', fontSize: 14, marginBottom: 20 }}>
                            Mở app <strong>{paymentMethod.toUpperCase()}</strong> và quét mã QR bên dưới để thanh toán
                        </p>

                        {qrImage && (
                            <div style={{
                                background: '#f5f5f5',
                                padding: 16,
                                borderRadius: 8,
                                marginBottom: 16
                            }}>
                                <img 
                                    src={qrImage} 
                                    alt="QR Code" 
                                    style={{
                                        width: 250,
                                        height: 250,
                                        border: '2px solid #ddd',
                                        borderRadius: 8
                                    }}
                                />
                            </div>
                        )}

                        <div style={{
                            background: '#fff3cd',
                            padding: 12,
                            borderRadius: 6,
                            marginBottom: 20,
                            border: '1px solid #ffc107'
                        }}>
                            <div style={{ fontSize: 15, color: '#856404' }}>
                                💰 Tổng thanh toán: <strong style={{ color: '#D32F2F', fontSize: 18 }}>
                                    {totalAmount.toLocaleString('vi-VN')}đ
                                </strong>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                            <button 
                                onClick={confirmDemoPayment}
                                style={{
                                    background: '#28a745',
                                    color: '#fff',
                                    border: 'none',
                                    padding: '12px 24px',
                                    borderRadius: 6,
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    fontSize: 14
                                }}
                            >
                                ✅ Đã thanh toán
                            </button>
                            
                            {/* ✅ NÚT HỦY MỚI - Chỉ đóng modal */}
                            <button 
                                onClick={cancelPayment}
                                style={{
                                    background: '#6c757d',
                                    color: '#fff',
                                    border: 'none',
                                    padding: '12px 24px',
                                    borderRadius: 6,
                                    cursor: 'pointer'
                                }}
                            >
                                ❌ Đóng
                            </button>
                        </div>

                        <p style={{
                            fontSize: 12,
                            color: '#999',
                            marginTop: 20,
                            fontStyle: 'italic'
                        }}>
                            💡 <em>Đơn hàng đã được tạo. Bạn có thể thanh toán sau trong mục "Đơn hàng của tôi".</em>
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CheckoutPage;