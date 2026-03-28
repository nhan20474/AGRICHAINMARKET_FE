import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client'; // ✅ THÊM import
import { API_CONFIG, API_ORIGIN, SOCKET_IO_OPTIONS } from '../../config/apiConfig';

interface ShippingInfo {
    shipping_company?: string;
    tracking_number?: string;
    shipping_status?: string;
    shipped_at?: string;
    delivered_at?: string;
}

interface OrderItem {
    id: number;
    order_id: number;
    product_id: number;
    quantity: number;
    price_per_item: number;
    name: string;
    image_url: string;
    seller_id: number;
    unit?: string; // ✅ THÊM - Đơn vị tính (kg, trái, bó...)
}

interface Order {
    order_id?: number;
    id?: number;
    created_at: string;
    buyer_id: number;
    total_amount: number;
    shipping_address: string;
    status: string;
    items: OrderItem[];
    buyer?: { // ✅ THÊM
        id: number;
        full_name: string;
        email: string;
        phone_number: string;
        address: string;
    };
    payment?: { // ✅ THÊM
        payment_method: string;
        payment_status: string;
        amount: string;
        transaction_id?: string;
        paid_at?: string; // ✅ THÊM - Thời gian thanh toán
    };
}

interface Props {
    sellerId: number;
}

const statusLabels: Record<string, string> = {
    pending: 'Chờ xử lý',
    processing: 'Đang xử lý',
    shipped: 'Đã giao cho đơn vị vận chuyển',
    delivered: 'Đã giao hàng',
    received: 'Đã nhận hàng', // ✅ THÊM
    cancelled: 'Đã hủy'
};

const shippingStatusOptions = [
    { value: 'pending', label: 'Chờ xử lý' },
    { value: 'processing', label: 'Đang xử lý' },
    { value: 'shipped', label: 'Đã giao cho đơn vị vận chuyển' },
    { value: 'delivered', label: 'Đã giao hàng' },
    { value: 'cancelled', label: 'Đã hủy' }
];

const API_BASE = API_CONFIG.BASE_URL;

const shippingCompanies = [
    'Viettel Post',
    'Giao Hàng Nhanh',
    'Giao Hàng Tiết Kiệm',
    'J&T Express',
    'Best Express',
    'Ninja Van',
    'VNPost'
];

// Hàm tạo mã vận đơn ngẫu nhiên
function generateTrackingNumber(orderId: number) {
    const prefix = 'VN';
    const random = Math.floor(100000 + Math.random() * 900000);
    return `${prefix}${orderId}${random}`;
}

// Helper lấy id an toàn
function getOrderId(o: any): number | undefined {
    return o?.order_id ?? o?.id;
}

// Helper chọn product_id dùng cho shipping (ưu tiên sản phẩm của seller hiện tại)
function getProductIdForOrder(order: Order, sellerId: number): number | undefined {
	const sellerItems = order.items.filter(i => i.seller_id === sellerId);
	const fallback = order.items[0];
	return (sellerItems[0] ?? fallback)?.product_id;
}

// Sửa lại hàm postShippingAttempts - THÊM product_id
async function postShippingAttempts(orderId: number, body: any, order?: Order, sellerId?: number) {
    const statusValue = body.shipping_status || body.status || 'pending';
    
    // ✅ LẤY product_id TỪ ORDER
    let productId = body.product_id;
    if (!productId && order && sellerId) {
        productId = getProductIdForOrder(order, sellerId);
    }
    
    if (!productId) {
        throw new Error('❌ Không tìm thấy product_id cho đơn hàng này');
    }

    const payload: any = {
        order_id: orderId,
        product_id: productId, // ✅ BẮT BUỘC
        shipping_status: statusValue,
        status: statusValue,
        shipping_company: body.shipping_company || shippingCompanies[0],
        tracking_number: body.tracking_number || generateTrackingNumber(orderId),
        ...(body.shipped_at ? { shipped_at: body.shipped_at } : {}),
        ...(body.delivered_at ? { delivered_at: body.delivered_at } : {})
    };

    try {
        const res = await fetch(`${API_BASE}/shipping/${orderId}`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'Accept': 'application/json' 
            },
            body: JSON.stringify(payload)
        });

        const raw = await res.text();
        console.log('📡 Backend response:', res.status, raw);

        let parsed: any = {};
        try { parsed = raw ? JSON.parse(raw) : {}; } catch { parsed = { error: 'Invalid JSON response' }; }

        if (!res.ok) {
            const errorMsg = parsed.message || parsed.error || `HTTP ${res.status}`;
            console.error('❌ API Error:', errorMsg, parsed);
            // thêm chi tiết parsed vào message để hiển thị/ghi log rõ ràng ở frontend
            const details = (typeof parsed === 'object') ? JSON.stringify(parsed) : String(parsed);
            throw new Error(`${errorMsg} | details: ${details}`);
        }

        return parsed.shipping || parsed;
    } catch (e: any) {
        console.error('❌ Fetch error:', e);
        throw new Error(e.message || 'Không thể kết nối server');
    }
}

// Sửa hàm createShippingDefault
async function createShippingDefault(orderId: number, order: Order, sellerId: number): Promise<ShippingInfo> {
    try {
        const productId = getProductIdForOrder(order, sellerId);
        if (!productId) throw new Error('Không tìm thấy product_id');
        
        const payload = {
            product_id: productId, // ✅ THÊM
            shipping_company: shippingCompanies[0],
            tracking_number: generateTrackingNumber(orderId),
            shipping_status: 'pending'
        };
        const data = await postShippingAttempts(orderId, payload, order, sellerId);
        return data;
    } catch (e) {
        throw e;
    }
}

// ✅ THÊM: Hàm trích xuất tỉnh/thành phố từ địa chỉ
function extractProvince(address?: string): string {
  if (!address) return '';
  const lower = address.toLowerCase();
  const provinces = [
    'hà nội','hồ chí minh','hcm','đà nẵng','hải phòng','cần thơ','bình dương','đồng nai','bà rịa - vũng tàu',
    'bắc ninh','bắc giang','hưng yên','hải dương','thái nguyên','quảng ninh','thanh hóa','nghệ an','hà tĩnh',
    'thừa thiên huế','quảng nam','quảng ngãi','bình định','phú yên','khánh hòa','ninh thuận','bình thuận',
    'lâm đồng','đắk lắk','đắk nông','gia lai','kon tum','long an','tiền giang','bến tre','trà vinh','vĩnh long',
    'đồng tháp','an giang','kiên giang','hậu giang','sóc trăng','bạc liêu','cà mau','tây ninh','bình phước',
    'phú thọ','vĩnh phúc','nam định','ninh bình','thái bình','hà nam','quảng bình','quảng trị','bắc kạn',
    'cao bằng','lạng sơn','tuyên quang','yên bái','lào cai','điện biên','sơn la','lai châu','hoà bình'
  ];
  
  const found = provinces.find(p => lower.includes(p));
  if (found === 'hồ chí minh' || found === 'hcm') return 'hồ chí minh';
  return found || lower;
}

// ✅ THÊM: Xác định vùng miền (Bắc/Trung/Nam)
function regionOfProvince(province: string): 'north'|'central'|'south' {
  const north = ['hà nội','hải phòng','bắc ninh','bắc giang','hưng yên','hải dương','thái nguyên','quảng ninh','phú thọ','vĩnh phúc','nam định','ninh bình','thái bình','hà nam','bắc kạn','cao bằng','lạng sơn','tuyên quang','yên bái','lào cai','điện biên','sơn la','lai châu','hoà bình'];
  const central = ['đà nẵng','thừa thiên huế','quảng bình','quảng trị','quảng nam','quảng ngãi','bình định','phú yên','khánh hòa','ninh thuận','bình thuận','nghệ an','hà tĩnh','gia lai','kon tum','đắk lắk','đắk nông','lâm đồng'];
  const south = ['hồ chí minh','cần thơ','bình dương','đồng nai','bà rịa - vũng tàu','long an','tiền giang','bến tre','trà vinh','vĩnh long','đồng tháp','an giang','kiên giang','hậu giang','sóc trăng','bạc liêu','cà mau','tây ninh','bình phước'];
  
  const p = province.toLowerCase();
  if (north.includes(p)) return 'north';
  if (central.includes(p)) return 'central';
  if (south.includes(p)) return 'south';
  
  // Fallback
  if (p.includes('hà nội')) return 'north';
  if (p.includes('hồ chí minh') || p.includes('hcm')) return 'south';
  return 'central';
}

// ✅ THÊM: Tính số ngày giao hàng dự kiến
function estimateDeliveryDays(origin?: string, dest?: string): number {
  const op = extractProvince(origin);
  const dp = extractProvince(dest);
  
  if (!op || !dp) return 3; // Mặc định 3 ngày nếu không xác định được
  
  // Cùng tỉnh/thành phố -> 1-2 ngày
  if (op === dp) return 1;
  
  const or = regionOfProvince(op);
  const dr = regionOfProvince(dp);
  
  // Cùng vùng miền (Bắc-Bắc, Nam-Nam, Trung-Trung) -> 2-3 ngày
  if (or === dr) return 3;
  
  // Khác vùng miền (Bắc-Nam, Bắc-Trung, Nam-Trung) -> 4-5 ngày
  return 5;
}

// ✅ THÊM: Tính toán shipped_at và delivered_at dựa trên trạng thái
function computeTimestampsForStatus(
  current: ShippingInfo | undefined, 
  status: string, 
  origin?: string, 
  dest?: string
) {
  const now = new Date();
  const nowIso = now.toISOString();
  
  let shipped_at = current?.shipped_at;
  let delivered_at = current?.delivered_at;
  
  // Nếu chưa có shipped_at và đang ở trạng thái cần giao hàng
  const needShip = ['processing','shipped','delivered','received'].includes(status);
  const needDeliveredEstimate = ['processing','shipped'].includes(status);
  const deliveredNow = ['delivered','received'].includes(status);
  
  if (!shipped_at && needShip) {
    shipped_at = nowIso;
  }
  
  if (!delivered_at) {
    if (deliveredNow) {
      // Đã giao -> Đặt ngày hiện tại
      delivered_at = nowIso;
    } else if (needDeliveredEstimate) {
      // Đang giao -> Tính dự kiến
      const days = estimateDeliveryDays(origin, dest);
      const eta = new Date();
      eta.setDate(eta.getDate() + days);
      delivered_at = eta.toISOString();
    }
  }
  
  return { shipped_at, delivered_at };
}

const FarmerOrderShippingDetail: React.FC<Props> = ({ sellerId }) => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [shippingMap, setShippingMap] = useState<Record<string, ShippingInfo | null>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [notify, setNotify] = useState('');
    const [sellerAddress, setSellerAddress] = useState(''); // ✅ THÊM

    // --- NEW: per-product state maps ---
    const [productStatusMap, setProductStatusMap] = useState<Record<string, string>>({});
    const [shippingMapByProduct, setShippingMapByProduct] = useState<Record<string, ShippingInfo | null>>({});
    // Chỉ cho phép hiển thị chi tiết của 1 đơn hàng tại một thời điểm
    const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

    function toggleDetails(orderId: number) {
        setSelectedOrderId(prev => (prev === orderId ? null : orderId));
        // đóng tất cả form khi chuyển chọn
        setShowCreateForm(() => ({}));
    }

    // ✅ THÊM: Lấy địa chỉ người bán (warehouse/farm location)
    useEffect(() => {
        let mounted = true;
        (async () => {
            // Thử lấy từ nhiều endpoint (sellers, users, products...)
            const endpoints = [
                `${API_BASE}/sellers/${sellerId}`,
                `${API_BASE}/users/${sellerId}`
            ];
            
            for (const ep of endpoints) {
                try {
                    const r = await fetch(ep);
                    if (!r.ok) continue;
                    const data = await r.json();
                    const addr = data?.address || data?.shipping_address || data?.warehouse_address;
                    if (addr && mounted) {
                        setSellerAddress(String(addr));
                        break;
                    }
                } catch {}
            }
        })();
        return () => { mounted = false; };
    }, [sellerId]);

    // ✅ THÊM: Hàm fetch orders (tách ra để tái sử dụng)
    const fetchOrdersAndShipping = async (): Promise<{ orders: Order[]; shippingMap: Record<string, ShippingInfo | null> }> => {
        setLoading(true);
        let list: Order[] = [];
        const map: Record<string, ShippingInfo | null> = {};
        try {
            const res = await fetch(`${API_BASE}/orders/by-seller/${sellerId}`);
            const data = await res.json();
            list = Array.isArray(data) ? data : [];
            setOrders(list);

            const results = await Promise.all(
                list.map(async (o) => {
                    const oid = getOrderId(o);
                    if (oid === undefined) return [null, null] as [number | null, ShippingInfo | null];
                    try {
                        const shipRes = await fetch(`${API_BASE}/shipping/${oid}`);
                        if (shipRes.status === 404) return [oid, null] as [number, null];
                        const shipData = await shipRes.json().catch(() => null);
                        return [oid, shipRes.ok ? (shipData.shipping || shipData) : null] as [number, ShippingInfo | null];
                    } catch {
                        return [oid, null] as [number, ShippingInfo | null];
                    }
                })
            );

            results.forEach(([oid, info]) => {
                if (oid !== null) map[String(oid)] = info;
            });
            setShippingMap(map);
        } catch (e: any) {
            console.error('❌ fetchOrdersAndShipping error:', e);
            setError(e?.message || 'Không thể tải đơn hàng hoặc vận chuyển');
        } finally {
            setLoading(false);
        }
        return { orders: list, shippingMap: map };
    };

    useEffect(() => {
        fetchOrdersAndShipping();

        // ✅ SOCKET: Lắng nghe cập nhật từ buyer realtime
        let socket: any;
        if (sellerId) {
            socket = io(API_CONFIG.SOCKET_URL, { ...SOCKET_IO_OPTIONS });
            socket.emit('register', sellerId);
            
            // Khi nhận thông báo cập nhật đơn hàng
            socket.on('notification', (data: any) => {
                console.log('🔔 Farmer nhận thông báo:', data);
                
                // Nếu là thông báo về đơn hàng (buyer xác nhận đã nhận), reload orders
                if (data.type === 'order_tracking' && data.order_id) {
                    console.log('📦 Buyer đã cập nhật đơn hàng #', data.order_id);
                    fetchOrdersAndShipping(); // ✅ Reload danh sách
                    setNotify(`🔔 ${data.title || 'Có cập nhật mới!'}`);
                    setTimeout(() => setNotify(''), 3000);
                }
            });
        }

        return () => {
            if (socket) socket.disconnect();
        };
    }, [sellerId]);

    // ✅ THÊM: Hàm cập nhật trạng thái sản phẩm (API mới)
    async function updateProductStatus(orderId: number, productId: number, newStatus: string) {
        const endpoint = `${API_BASE}/orders/${orderId}/product/${productId}/status`;
        const sellerPayload = { seller_id: sellerId };

        // Một vài biến thể key mà backend có thể chấp nhận
        const candidateKeys = [
            'status',
            'shipping_status',
            'product_status',
            'order_status'
        ];

        // Map một số giá trị sang dạng backend có thể dùng (thay đổi nếu backend yêu cầu khác)
        const statusMap: Record<string, string> = {
            pending: 'pending',
            processing: 'processing',
            shipped: 'shipping',    // backend có thể dùng 'shipping'
            delivered: 'delivered',
            received: 'received',
            cancelled: 'cancelled'
        };

        // chuẩn hóa value
        const mappedValue = (statusMap[newStatus] || newStatus);

        // thử các payload khác nhau: ưu tiên gửi nhiều trường để tăng khả năng trúng
        const payloadVariants: any[] = [
            // full: nhiều trường cùng lúc
            { status: newStatus, shipping_status: newStatus, order_status: newStatus, product_status: newStatus, ...sellerPayload },
            // mapped single-key variants
            ...candidateKeys.map((k) => ({ [k]: mappedValue, ...sellerPayload })),
            // fallback: chỉ status gốc
            { status: newStatus, ...sellerPayload }
        ];

        // Loại bỏ duplicate variants (JSON string)
        const uniq: any[] = [];
        const seen = new Set<string>();
        for (const p of payloadVariants) {
            const s = JSON.stringify(p);
            if (!seen.has(s)) { seen.add(s); uniq.push(p); }
        }

        let lastError: any = null;
        for (const payload of uniq) {
            try {
                console.log('📤 updateProductStatus try payload:', endpoint, payload);
                const res = await fetch(endpoint, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const text = await res.text();
                let json: any = {};
                try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }

                console.log('📡 updateProductStatus response:', res.status, json);

                if (res.ok) {
                    return json;
                } else {
                    // Nếu backend trả lỗi rõ ràng về trạng thái, lưu lại để thông báo
                    const errMsg = json?.message || json?.error || `HTTP ${res.status}`;
                    lastError = new Error(errMsg);
                    // Nếu message cho biết "Trạng thái không hợp lệ", thử variant tiếp theo
                    // nếu lỗi khác (ví dụ quyền, not found), có thể dừng hoặc tiếp tục để thử variants khác
                    if (res.status >= 500) {
                        // lỗi server, dừng và ném
                        throw lastError;
                    }
                    // continue to next variant
                }
            } catch (e: any) {
                console.warn('⚠️ updateProductStatus attempt failed:', e?.message || e);
                lastError = e;
                // nếu là network/server error thì bỏ tiếp, thử next; cuối cùng sẽ throw
            }
        }

        // Nếu hết variant mà vẫn lỗi → throw error chi tiết
        throw lastError || new Error('Không thể cập nhật trạng thái sản phẩm');
    }

    // Hàm cập nhật trạng thái vận chuyển
    async function handleShippingStatusChange(orderIdRaw: number, newStatus: string) {
        const orderId = orderIdRaw;
        setNotify('');
        if (!newStatus) {
            setNotify('Vui lòng chọn trạng thái');
            setTimeout(() => setNotify(''), 1200);
            return;
        }

        const order = orders.find(o => getOrderId(o) === orderId);
        if (!order) {
            setNotify('❌ Không tìm thấy đơn hàng');
            setTimeout(() => setNotify(''), 1500);
            return;
        }

        let info = shippingMap[String(orderId)];

        if (!info) {
            try {
                const created = await createShippingDefault(orderId, order, sellerId);
                setShippingMap(prev => ({ ...prev, [String(orderId)]: created }));
                info = created;
            } catch (e: any) {
                setNotify('❌ ' + (e.message || 'Không thể tạo vận chuyển'));
                setTimeout(() => setNotify(''), 2000);
                return;
            }
        }
        
        try {
            const productId = getProductIdForOrder(order, sellerId);
            if (!productId) {
                setNotify('❌ Không tìm thấy product_id');
                setTimeout(() => setNotify(''), 2000);
                return;
            }

            const auto = computeTimestampsForStatus(
                info,
                newStatus,
                sellerAddress,
                order.shipping_address
            );

            const payload = {
                product_id: productId,
                shipping_company: info.shipping_company || shippingCompanies[0],
                tracking_number: info.tracking_number || generateTrackingNumber(orderId),
                shipping_status: newStatus,
                ...(auto.shipped_at ? { shipped_at: auto.shipped_at } : {}),
                ...(auto.delivered_at ? { delivered_at: auto.delivered_at } : {})
            };

            console.log('📤 Payload shipping:', payload);
            
            // optimistic UI
            setShippingMap(prev => ({ ...prev, [String(orderId)]: { ...(prev[String(orderId)] || {}), ...payload } }));
            setProductStatusMap(prev => ({ ...prev, [`${orderId}-${productId}`]: newStatus }));
            
            // 1) update shipping
            const shipResult = await postShippingAttempts(orderId, payload, order, sellerId);
            console.log('✅ Shipping updated:', shipResult);
            
            // 2) update product status
            const prodRes = await updateProductStatus(orderId, productId, newStatus).catch(e => {
                console.warn('updateProductStatus failed', e);
                return null;
            });

            // 3) reload fresh data from backend and use it
            const { orders: latestOrders, shippingMap: latestShippingMap } = await fetchOrdersAndShipping();

            // use latest shipping info and order status to sync UI
            const latestShip = latestShippingMap[String(orderId)];
            if (latestShip) {
                setShippingMap(prev => ({ ...prev, [String(orderId)]: latestShip }));
            }

            // set product status from backend response if provided
            const backendProductStatus = prodRes && typeof prodRes === 'object'
                ? (prodRes.product_status || prodRes.status || prodRes.shipping_status)
                : undefined;
            const finalProductStatus = backendProductStatus || latestShip?.shipping_status || newStatus;
            setProductStatusMap(prev => ({ ...prev, [`${orderId}-${productId}`]: finalProductStatus }));

            // set notify based on actual backend shipping status
            const notifyLabel = statusLabels[latestShip?.shipping_status || finalProductStatus] || (latestShip?.shipping_status || finalProductStatus);
            setNotify(`✅ Đã cập nhật: ${notifyLabel}`);
        } catch (err: any) {
            // rollback & refresh
            await fetchOrdersAndShipping();
            console.error('❌ Update error:', err);
            setNotify('❌ ' + (err.message || 'Lỗi cập nhật thông tin vận chuyển'));
        }
        setTimeout(() => setNotify(''), 3000);
    }

    // --- NEW: Handle per-product status change ---
    async function handleProductStatusChange(orderIdRaw: number, productId: number, newStatus: string) {
        const orderId = orderIdRaw;
        setNotify('');
        if (!newStatus) {
            setNotify('Vui lòng chọn trạng thái sản phẩm');
            setTimeout(() => setNotify(''), 1200);
            return;
        }

        const order = orders.find(o => getOrderId(o) === orderId);
        if (!order) {
            setNotify('❌ Không tìm thấy đơn hàng');
            setTimeout(() => setNotify(''), 1500);
            return;
        }

        try {
            const currentShip = shippingMapByProduct[`${orderId}-${productId}`] || shippingMap[String(orderId)] || undefined;
            const auto = computeTimestampsForStatus(currentShip || undefined, newStatus, sellerAddress, order.shipping_address);

            const payload = {
                product_id: productId,
                shipping_company: currentShip?.shipping_company || shippingCompanies[0],
                tracking_number: currentShip?.tracking_number || generateTrackingNumber(orderId),
                shipping_status: newStatus,
                ...(auto.shipped_at ? { shipped_at: auto.shipped_at } : {}),
                ...(auto.delivered_at ? { delivered_at: auto.delivered_at } : {})
            };

            // optimistic
            setShippingMapByProduct(prev => ({ ...prev, [`${orderId}-${productId}`]: { ...(prev[`${orderId}-${productId}`] || {}), ...payload } }));
            setProductStatusMap(prev => ({ ...prev, [`${orderId}-${productId}`]: newStatus }));

            const shipResult = await postShippingAttempts(orderId, payload, order, sellerId);
            console.log('✅ Shipping per-product updated:', shipResult);

            const prodRes = await updateProductStatus(orderId, productId, newStatus).catch(e => {
                console.warn('updateProductStatus failed', e);
                return null;
            });

            // reload authoritative data
            const { orders: latestOrders, shippingMap: latestShippingMap } = await fetchOrdersAndShipping();

            const latestShipForProduct = latestShippingMap[String(orderId)];
            if (latestShipForProduct) {
                setShippingMapByProduct(prev => ({ ...prev, [`${orderId}-${productId}`]: latestShipForProduct }));
                setShippingMap(prev => ({ ...prev, [String(orderId)]: latestShipForProduct }));
            }

            const backendProductStatus = prodRes && typeof prodRes === 'object'
                ? (prodRes.product_status || prodRes.status || prodRes.shipping_status)
                : undefined;
            const finalProductStatus = backendProductStatus || latestShipForProduct?.shipping_status || newStatus;
            setProductStatusMap(prev => ({ ...prev, [`${orderId}-${productId}`]: finalProductStatus }));

            setNotify(`✅ Trạng thái sản phẩm: ${statusLabels[finalProductStatus] || finalProductStatus}`);
        } catch (e: any) {
            await fetchOrdersAndShipping();
            console.error('❌ handleProductStatusChange error:', e);
            setProductStatusMap(prev => ({ ...prev, [`${orderId}-${productId}`]: '' }));
            setNotify('❌ ' + (e?.message || 'Lỗi khi cập nhật trạng thái sản phẩm'));
        }
        setTimeout(() => setNotify(''), 3000);
    }

    // Thêm form tạo vận chuyển cho đơn hàng nếu chưa có
    const [showCreateForm, setShowCreateForm] = useState<{ [orderId: number]: boolean }>({});
    const [createForm, setCreateForm] = useState<{
        [orderId: number]: {
            shipping_company: string;
            tracking_number: string;
            shipping_status: string;
            shipped_at: string;
            delivered_at: string;
        }
    }>({});

    // Hàm mở form tạo vận chuyển
    function openCreateForm(orderIdRaw: number) {
        const orderId = orderIdRaw;
        // Mở form chỉ cho order được chọn và chọn order đó làm 'selected'
        setShowCreateForm(() => ({ [orderId]: true }));
        setSelectedOrderId(orderId);
        setCreateForm(f => ({
            ...f,
            [orderId]: {
                shipping_company: shippingCompanies[0],
                tracking_number: generateTrackingNumber(orderId),
                shipping_status: 'pending',
                shipped_at: '',
                delivered_at: ''
            }
        }));
    }

    // Hàm xử lý thay đổi form
    function handleCreateFormChange(orderId: number, field: string, value: string) {
        setCreateForm(f => ({
            ...f,
            [orderId]: {
                ...f[orderId],
                [field]: value
            }
        }));
    }

    // Hàm submit tạo vận chuyển (form chi tiết)
    async function handleSubmitCreateShipping(orderId: number) {
        setNotify('');
        const formData = createForm[orderId];
        
        // ✅ TÌM ORDER
        const order = orders.find(o => getOrderId(o) === orderId);
        if (!order) {
            setNotify('❌ Không tìm thấy đơn hàng');
            setTimeout(() => setNotify(''), 1500);
            return;
        }

        const productId = getProductIdForOrder(order, sellerId);
        if (!productId) {
            setNotify('❌ Không tìm thấy product_id');
            setTimeout(() => setNotify(''), 1500);
            return;
        }

        try {
            // ✅ TÍNH TOÁN timestamps
            const auto = computeTimestampsForStatus(
                undefined,
                formData.shipping_status,
                sellerAddress,
                order.shipping_address
            );

            const payload = {
                product_id: productId,
                shipping_company: formData.shipping_company,
                tracking_number: formData.tracking_number,
                shipping_status: formData.shipping_status,
                ...(auto.shipped_at ? { shipped_at: new Date(auto.shipped_at).toISOString() } : {}),
                ...(auto.delivered_at ? { delivered_at: new Date(auto.delivered_at).toISOString() } : {})
            };
            
            const result = await postShippingAttempts(orderId, payload, order, sellerId);
            setNotify('✅ Tạo vận chuyển thành công! Ngày giao đã được ước tính tự động.');
            setShippingMap(prev => ({
                ...prev,
                [`${orderId}`]: result
            }));
            setShowCreateForm(f => ({ ...f, [orderId]: false }));
            // Đóng detail sau khi tạo xong (chỉ hiển thị chi tiết khi có selected)
            setSelectedOrderId(null);
        } catch (err: any) {
            setNotify(err.message || 'Tạo thông tin vận chuyển thất bại');
        }
        setTimeout(() => setNotify(''), 1500);
    }

    /* Thêm bộ quy tắc trạng thái và helper (đặt gần đầu file hoặc trong component) */
    const STATUS_FLOW_GLOBAL = ['pending', 'processing', 'shipped', 'delivered', 'received'];
    function getAllowedNextStatuses(current?: string) {
        // Trả về các trạng thái hợp lệ để chuyển sang (không cho lùi), luôn cho phép 'cancelled'
        const fallback = ['pending', 'processing', 'shipped', 'delivered', 'received'];
        if (!current) return [...fallback, 'cancelled'];
        const idx = STATUS_FLOW_GLOBAL.indexOf(current);
        if (idx === -1) return [...fallback, 'cancelled'];
        const next = STATUS_FLOW_GLOBAL.slice(idx + 1);
        // nếu đã ở cuối (received) thì không có next, chỉ allow cancelled => trả về [] hoặc ['cancelled']
        return [...next, 'cancelled'];
    }

    // ✅ Hàm lấy màu trạng thái
    function getOrderStatusColor(status: string): string {
        const colors: Record<string, string> = {
            'pending': '#ff9800',
            'processing': '#2196f3',
            'shipped': '#9c27b0',
            'delivered': '#4caf50',
            'received': '#38b000',
            'cancelled': '#f44336'
        };
        return colors[status] || '#757575';
    }

    // ✅ Hàm format payment method
    function formatPaymentMethod(method?: string): string {
        const labels: Record<string, string> = {
            'cod': '💵 Thanh toán khi nhận hàng (COD)',
            'momo': '📱 Ví MoMo',
            'bank_transfer': '🏦 Chuyển khoản ngân hàng',
            'vnpay': '💳 VNPay'
        };
        return labels[method || ''] || method || 'Chưa xác định';
    }

    // ✅ Parse địa chỉ shipping (có ghi chú)
    function parseShippingAddress(address: string): { main: string; note?: string } {
        const match = address.match(/^(.+?)\s*\(Ghi chú:\s*(.+?)\)\s*$/);
        if (match) {
            return { main: match[1].trim(), note: match[2].trim() };
        }
        return { main: address };
    }

    // helper xác định notify là success
    function isSuccessNotify(msg?: string) {
        if (!msg) return false;
        const s = msg.toString().toLowerCase();
        return msg.includes('✅') || s.includes('thành công') || s.includes('cập nhật') && s.includes('đã') || s.includes('đã cập nhật') || s.includes('success');
    }

    if (loading) return <div>Đang tải đơn hàng...</div>;
    if (error) return <div style={{color:'red'}}>{error}</div>;
    if (!orders.length) return <div style={{padding:24}}>Không có đơn hàng nào.</div>;

    return (
        <div style={{ padding: '8px 12px' }}>
            <h2 style={{ marginBottom: 24 }}>Đơn hàng của bạn</h2>
            
            {notify && (
                <div style={{
                    background: isSuccessNotify(notify) ? '#38b000' : '#D32F2F',
                    color: '#fff',
                    padding: '10px 16px',
                    borderRadius: 8,
                    marginBottom: 16,
                    display: 'inline-flex',
                    gap: 8
                }}>
                    <span>{isSuccessNotify(notify) ? '✔' : '✖'}</span>
                    <span>{notify}</span>
                </div>
            )}

            {orders.map(order => {
                const oid = getOrderId(order);
                if (oid === undefined) return null;

                // Nếu đã có order được chọn và không phải order hiện tại -> render gọn
                if (selectedOrderId !== null && selectedOrderId !== oid) {
                    return (
                        <div key={oid} style={{
                            marginBottom: 12,
                            background: '#fff',
                            borderRadius: 8,
                            boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
                            padding: 12,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div>
                                <strong style={{ color: '#38b000' }}>📦 Đơn hàng #{oid}</strong>
                                <div style={{ fontSize: 13, color: '#666' }}>
                                    {order.created_at ? new Date(order.created_at).toLocaleString('vi-VN') : ''}
                                </div>
                            </div>
                            <div>
                                <button
                                    style={{
                                        background: '#1976d2',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: 6,
                                        padding: '8px 12px',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => toggleDetails(oid)}
                                >
                                    Xem chi tiết
                                </button>
                            </div>
                        </div>
                    );
                }

                return (
                    <div key={oid} style={{
                        marginBottom: 32,
                        background: '#fff',
                        borderRadius: 8,
                        boxShadow: '0 2px 12px rgba(56,176,0,0.08)',
                        padding: 24
                    }}>
                        {/* Header đơn hàng */}
                        <h3 style={{ marginBottom: 16, fontSize: 20, color: '#38b000' }}>📦 Đơn hàng #{oid}</h3>
                        
                        {/* ✅ THÔNG TIN NGƯỜI MUA */}
                        {order.buyer && (
                            <div style={{
                                background: '#f0f8ff',
                                padding: 14,
                                borderRadius: 8,
                                marginBottom: 12,
                                border: '1px solid #b3d9ff'
                            }}>
                                <h4 style={{ margin: '0 0 10px 0', fontSize: 15, color: '#1976d2', fontWeight: 600 }}>
                                    👤 Thông tin người mua
                                </h4>
                                <div style={{ marginBottom: 6, fontSize: 14 }}>
                                    <strong>Họ tên:</strong> <span style={{ color: '#333' }}>{order.buyer.full_name}</span>
                                </div>
                                <div style={{ marginBottom: 6, fontSize: 14 }}>
                                    <strong>📞 SĐT:</strong>{' '}
                                    <a 
                                        href={`tel:${order.buyer.phone_number}`} 
                                        style={{ 
                                            color: '#1976d2', 
                                            textDecoration: 'none', 
                                            fontWeight: 600,
                                            padding: '2px 8px',
                                            background: '#e3f2fd',
                                            borderRadius: 4
                                        }}
                                    >
                                        {order.buyer.phone_number}
                                    </a>
                                </div>
                                <div style={{ marginBottom: 6, fontSize: 14 }}>
                                    <strong>📧 Email:</strong> <span style={{ color: '#555' }}>{order.buyer.email}</span>
                                </div>
                                <div style={{ fontSize: 14 }}>
                                    <strong>🏠 Địa chỉ:</strong> <span style={{ color: '#555' }}>{order.buyer.address}</span>
                                </div>
                            </div>
                        )}

                        {/* ✅ THÔNG TIN ĐỊA CHỈ GIAO HÀNG */}
                        <div style={{ marginBottom: 8, fontSize: 14 }}>
                            <strong>📅 Ngày đặt:</strong>{' '}
                            <span style={{ color: '#666' }}>
                                {order.created_at ? new Date(order.created_at).toLocaleString('vi-VN') : ''}
                            </span>
                        </div>
                        <div style={{ marginBottom: 8, fontSize: 14 }}>
                            <strong>📍 Thông tin giao hàng:</strong>{' '}
                            <span style={{ color: '#d32f2f', fontWeight: 600 }}>
                                {parseShippingAddress(order.shipping_address).main}
                            </span>
                        </div>
                        
                        {/* ✅ GHI CHÚ TỪ KHÁCH HÀNG */}
                        {(() => {
                            const parsed = parseShippingAddress(order.shipping_address);
                            return parsed.note ? (
                                <div style={{
                                    marginBottom: 12,
                                    padding: 10,
                                    background: '#fff3cd',
                                    borderLeft: '4px solid #ffc107',
                                    borderRadius: 6,
                                    fontSize: 14
                                }}>
                                    <strong>📝 Ghi chú từ khách:</strong>{' '}
                                    <em style={{ color: '#856404' }}>"{parsed.note}"</em>
                                </div>
                            ) : null;
                        })()}
                        
                        {/* ✅ THÔNG TIN THANH TOÁN - THÊM PAYMENT_STATUS */}
                        {order.payment && (
                            <div style={{
                                background: '#f0f8ff',
                                padding: 12,
                                borderRadius: 8,
                                marginBottom: 12,
                                border: '1px solid #b3e5fc'
                            }}>
                                <h4 style={{ margin: '0 0 10px 0', fontSize: 15, color: '#0288d1', fontWeight: 600 }}>
                                    💳 Thông tin thanh toán
                                </h4>
                                
                                {/* ✅ THÊM: Trạng thái thanh toán */}
                                <div style={{ marginBottom: 8, fontSize: 14 }}>
                                    <strong>Trạng thái:</strong>{' '}
                                    <span style={{
                                        background: order.payment.payment_status === 'paid' ? '#e8f5e9' : order.payment.payment_status === 'pending' ? '#fff3cd' : '#ffebee',
                                        color: order.payment.payment_status === 'paid' ? '#2e7d32' : order.payment.payment_status === 'pending' ? '#f57c00' : '#c62828',
                                        padding: '4px 12px',
                                        borderRadius: 12,
                                        fontSize: 13,
                                        fontWeight: 600
                                    }}>
                                        {order.payment.payment_status === 'paid' ? '✅ Đã thanh toán' : 
                                         order.payment.payment_status === 'pending' ? '⏳ Chờ thanh toán' : 
                                         order.payment.payment_status === 'failed' ? '❌ Thanh toán thất bại' : 
                                         order.payment.payment_status}
                                    </span>
                                </div>
                                
                                <div style={{ marginBottom: 6, fontSize: 14 }}>
                                    <strong>Phương thức:</strong>{' '}
                                    <span style={{
                                        background: order.payment.payment_status === 'paid' ? '#e8f5e9' : '#fff3cd',
                                        color: order.payment.payment_status === 'paid' ? '#2e7d32' : '#f57c00',
                                        padding: '4px 12px',
                                        borderRadius: 12,
                                        fontSize: 13,
                                        fontWeight: 600
                                    }}>
                                        {formatPaymentMethod(order.payment.payment_method)}
                                    </span>
                                </div>
                                <div style={{ marginBottom: 6, fontSize: 14 }}>
                                    <strong>Số tiền:</strong>{' '}
                                    <span style={{ color: '#38b000', fontWeight: 600 }}>
                                        {Number(order.payment.amount).toLocaleString('vi-VN')}đ
                                    </span>
                                </div>
                                {order.payment.transaction_id && (
                                    <div style={{ marginBottom: 6, fontSize: 14 }}>
                                        <strong>Mã giao dịch:</strong>{' '}
                                        <code style={{ 
                                            background: '#f5f5f5', 
                                            padding: '2px 6px', 
                                            borderRadius: 4,
                                            fontSize: 12,
                                            color: '#d32f2f'
                                        }}>
                                            {order.payment.transaction_id}
                                        </code>
                                    </div>
                                )}
                                {order.payment.paid_at && (
                                    <div style={{ fontSize: 14 }}>
                                        <strong>Thời gian thanh toán:</strong>{' '}
                                        <span style={{ color: '#666' }}>
                                            {new Date(order.payment.paid_at).toLocaleString('vi-VN')}
                                        </span>
                                    </div>
                                )}
                                
                                {/* ✅ THÊM: Cảnh báo nếu chưa thanh toán */}
                                {order.payment.payment_status !== 'paid' && (
                                    <div style={{
                                        marginTop: 10,
                                        padding: 8,
                                        background: '#fff3cd',
                                        border: '1px solid #ffc107',
                                        borderRadius: 6,
                                        fontSize: 13,
                                        color: '#856404'
                                    }}>
                                        ⚠️ <em>Khách hàng chưa thanh toán. Vui lòng theo dõi!</em>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        <div style={{ marginBottom: 8, fontSize: 14 }}>
                            <strong>📊 Trạng thái:</strong>{' '}
                            <span style={{
                                background: getOrderStatusColor(order.status),
                                color: '#fff',
                                padding: '5px 14px',
                                borderRadius: 14,
                                fontSize: 13,
                                fontWeight: 600,
                                display: 'inline-block'
                            }}>
                                {statusLabels[order.status] || order.status}
                            </span>
                        </div>
                        
                        <div style={{ 
                            marginBottom: 16, 
                            paddingTop: 12, 
                            borderTop: '2px solid #f0f0f0',
                            fontSize: 14 
                        }}>
                            <strong style={{ fontSize: 15 }}>💰 Tổng tiền:</strong>{' '}
                            <span style={{ fontSize: 22, color: '#38b000', fontWeight: 700 }}>
                                {Number(order.total_amount).toLocaleString('vi-VN')}đ
                            </span>
                        </div>

                        {/* Bảng sản phẩm - THÊM CỘT ĐƠN VỊ */}
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}>
                            <thead>
                                <tr style={{ background: '#f6fff2' }}>
                                    <th style={{ padding: 8, textAlign: 'left' }}>Ảnh</th>
                                    <th style={{ padding: 8, textAlign: 'left' }}>Sản phẩm</th>
                                    <th style={{ padding: 8, textAlign: 'center' }}>Số lượng</th>
                                    <th style={{ padding: 8, textAlign: 'center' }}>Đơn vị</th>
                                    <th style={{ padding: 8, textAlign: 'center' }}>Trạng thái SP</th>
                                    <th style={{ padding: 8, textAlign: 'right' }}>Đơn giá</th>
                                    <th style={{ padding: 8, textAlign: 'right' }}>Thành tiền</th>
                                </tr>
                            </thead>
                            <tbody>
                                {order.items.map(item => (
                                    <tr key={item.id ?? `${item.product_id}-${oid}`}>
                                        <td style={{ padding: 8 }}>
                                            <img
                                                src={item.image_url ? `${API_ORIGIN}${item.image_url}` : '/img/default.jpg'}
                                                alt={item.name}
                                                style={{ width: 48, height: 48, borderRadius: 6, objectFit: 'cover' }}
                                            />
                                        </td>
                                        <td style={{ padding: 8 }}>{item.name}</td>
                                        <td style={{ padding: 8, textAlign: 'center' }}>{item.quantity}</td>
                                        <td style={{ padding: 8, textAlign: 'center' }}>
                                            <span style={{ 
                                                background: '#e8f5e9', 
                                                color: '#2e7d32', 
                                                padding: '2px 8px', 
                                                borderRadius: 12, 
                                                fontSize: 12,
                                                fontWeight: 600
                                            }}>
                                                {item.unit || 'kg'}
                                            </span>
                                        </td>

                                        {/* Trạng thái sản phẩm: chỉ cho các item của seller hiện tại cho phép cập nhật */}
                                        <td style={{ padding: 8, textAlign: 'center' }}>
                                            {item.seller_id === sellerId ? (
                                                (() => {
                                                    const key = `${oid}-${item.product_id}`;
                                                    const current = productStatusMap[key] || ''; // nếu chưa có optimistic value
                                                    const options = getAllowedNextStatuses(current || order.status || 'pending');
                                                    return (
                                                        <select
                                                            value={current || ''}
                                                            onChange={(e) => {
                                                                const nv = e.target.value;
                                                                // validate chọn có nằm trong allowed
                                                                if (!options.includes(nv)) {
                                                                    setNotify('Trạng thái không hợp lệ');
                                                                    setTimeout(() => setNotify(''), 1500);
                                                                    return;
                                                                }
                                                                handleProductStatusChange(oid, item.product_id, nv);
                                                            }}
                                                            style={{
                                                                padding: '6px 10px',
                                                                borderRadius: 6,
                                                                border: '1px solid #ccc',
                                                                minWidth: 160,
                                                                fontSize: 13,
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            <option value="">-- Cập nhật trạng thái --</option>
                                                            {options.map(opt => (
                                                                <option key={opt} value={opt}>
                                                                    {shippingStatusOptions.find(s => s.value === opt)?.label || opt}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    );
                                                })()
                                            ) : (
                                                <span style={{ color: '#666', fontSize: 13 }}>Không phải sản phẩm của bạn</span>
                                            )}
                                        </td>

                                        <td style={{ padding: 8, textAlign: 'right' }}>
                                            {Number(item.price_per_item).toLocaleString('vi-VN')}đ
                                        </td>
                                        <td style={{ padding: 8, textAlign: 'right' }}>
                                            {(Number(item.price_per_item) * item.quantity).toLocaleString('vi-VN')}đ
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Phần vận chuyển */}
                        {shippingMap[String(oid)] ? (
                            // ĐÃ CÓ THÔNG TIN VẬN CHUYỂN
                            <div style={{
                                background: '#f6fff2',
                                borderRadius: 8,
                                padding: 12,
                                marginTop: 16,
                                boxShadow: '0 1px 4px rgba(56,176,0,0.08)'
                            }}>
                                <div style={{ marginBottom: 6 }}>
                                    <strong>Đơn vị vận chuyển:</strong>{' '}
                                    <span>{shippingMap[String(oid)]?.shipping_company || 'Chưa cập nhật'}</span>
                                </div>
                                <div style={{ marginBottom: 6 }}>
                                    <strong>Mã vận đơn:</strong>{' '}
                                    <span>{shippingMap[String(oid)]?.tracking_number || 'Chưa cập nhật'}</span>
                                </div>
                                <div style={{ marginBottom: 6 }}>
                                    <strong>Trạng thái:</strong>{' '}
                                    <span>
                                        {statusLabels[shippingMap[String(oid)]?.shipping_status || ''] ||
                                            shippingMap[String(oid)]?.shipping_status}
                                    </span>
                                </div>
                                <div style={{ marginBottom: 6 }}>
                                    <strong>Ngày giao:</strong>{' '}
                                    <span>
                                        {shippingMap[String(oid)]?.shipped_at
                                            ? new Date(shippingMap[String(oid)]!.shipped_at!).toLocaleString('vi-VN')
                                            : 'Chưa giao'}
                                    </span>
                                </div>
                                <div>
                                    <strong>Ngày nhận:</strong>{' '}
                                    <span>
                                        {shippingMap[String(oid)]?.delivered_at
                                            ? new Date(shippingMap[String(oid)]!.delivered_at!).toLocaleString('vi-VN')
                                            : 'Chưa nhận'}
                                    </span>
                                </div>

                                {/* Dropdown cập nhật trạng thái */}
                                {/* ✅ CHỈ HIỂN thị dropdown NẾU chưa delivered hoặc received */}
                                {!['delivered', 'received'].includes(shippingMap[String(oid)]?.shipping_status || '') ? (
                                    <div style={{ marginTop: 12 }}>
                                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
                                            Cập nhật trạng thái vận chuyển:
                                        </label>
                                        <select
                                            value={shippingMap[String(oid)]?.shipping_status || ''}
                                            onChange={(e) => handleShippingStatusChange(oid, e.target.value)}
                                            style={{
                                                padding: '8px 12px',
                                                borderRadius: 6,
                                                border: '1px solid #ccc',
                                                minWidth: 250,
                                                fontSize: 14,
                                                cursor: 'pointer',
                                                background: '#fff'
                                            }}
                                        >
                                            <option value="">-- Chọn trạng thái --</option>
                                            {shippingStatusOptions.map((opt) => (
                                                <option key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                ) : (
                                    <div style={{
                                        marginTop: 12,
                                        padding: '12px 16px',
                                        background: '#e8f5e9',
                                        borderRadius: 6,
                                        color: '#2e7d32',
                                        fontSize: 14,
                                        fontWeight: 600
                                    }}>
                                        {shippingMap[String(oid)]?.shipping_status === 'received' ? (
                                            <>✅ Khách hàng đã xác nhận nhận hàng</>
                                        ) : (
                                            <>📦 Đơn hàng đã giao - Chờ khách hàng xác nhận</>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            // CHƯA CÓ THÔNG TIN VẬN CHUYỂN - HIỆN NÚT TẠO
                            <div style={{ marginTop: 24, textAlign: 'center' }}>
                                <button
                                    style={{
                                        background: '#38b000',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: 6,
                                        padding: '14px 36px',
                                        fontWeight: 700,
                                        fontSize: 16,
                                        cursor: 'pointer',
                                        boxShadow: '0 2px 8px rgba(56,176,0,0.12)'
                                    }}
                                    onClick={() => openCreateForm(oid)}
                                >
                                    + Chi tiết đơn hàng
                                </button>

                                {/* Form tạo vận chuyển chi tiết */}
                                {showCreateForm[oid] && (
                                    <form
                                        style={{
                                            marginTop: 16,
                                            background: '#f6fff2',
                                            padding: 20,
                                            borderRadius: 10,
                                            maxWidth: 480,
                                            margin: '16px auto 0',
                                            boxShadow: '0 2px 8px rgba(56,176,0,0.10)'
                                        }}
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            handleSubmitCreateShipping(oid);
                                        }}
                                    >
                                        <h4 style={{ marginBottom: 16, color: '#38b000' }}>
                                            Tạo thông tin vận chuyển
                                        </h4>

                                        {/* Đơn vị vận chuyển */}
                                        <div style={{ marginBottom: 12 }}>
                                            <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>
                                                Đơn vị vận chuyển
                                            </label>
                                            <select
                                                value={createForm[oid]?.shipping_company || ''}
                                                onChange={(e) =>
                                                    handleCreateFormChange(oid, 'shipping_company', e.target.value)
                                                }
                                                required
                                                style={{
                                                    width: '100%',
                                                    padding: '10px',
                                                    borderRadius: 6,
                                                    border: '1px solid #ccc'
                                                }}
                                            >
                                                {shippingCompanies.map((company) => (
                                                    <option key={company} value={company}>
                                                        {company}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Mã vận đơn */}
                                        <div style={{ marginBottom: 12 }}>
                                            <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>
                                                Mã vận đơn
                                            </label>
                                            <input
                                                type="text"
                                                value={createForm[oid]?.tracking_number || ''}
                                                onChange={(e) =>
                                                    handleCreateFormChange(oid, 'tracking_number', e.target.value)
                                                }
                                                required
                                                style={{
                                                    width: '100%',
                                                    padding: '10px',
                                                    borderRadius: 6,
                                                    border: '1px solid #ccc'
                                                }}
                                            />
                                            <button
                                                type="button"
                                                style={{
                                                    marginTop: 8,
                                                    background: '#eee',
                                                    color: '#333',
                                                    border: 'none',
                                                    borderRadius: 6,
                                                    padding: '6px 18px',
                                                    cursor: 'pointer'
                                                }}
                                                onClick={() =>
                                                    setCreateForm((f) => ({
                                                        ...f,
                                                        [oid]: {
                                                            ...f[oid],
                                                            tracking_number: generateTrackingNumber(oid)
                                                        }
                                                    }))
                                                }
                                            >
                                                Tạo mã tự động
                                            </button>
                                        </div>

                                        {/* Trạng thái */}
                                        <div style={{ marginBottom: 12 }}>
                                            <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>
                                                Trạng thái vận chuyển
                                            </label>
                                            <select
                                                value={createForm[oid]?.shipping_status || 'pending'}
                                                onChange={(e) =>
                                                    handleCreateFormChange(oid, 'shipping_status', e.target.value)
                                                }
                                                required
                                                style={{
                                                    width: '100%',
                                                    padding: '10px',
                                                    borderRadius: 6,
                                                    border: '1px solid #ccc'
                                                }}
                                            >
                                                {shippingStatusOptions.map((opt) => (
                                                    <option key={opt.value} value={opt.value}>
                                                        {opt.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Buttons */}
                                        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                                            <button
                                                type="submit"
                                                style={{
                                                    background: '#38b000',
                                                    color: '#fff',
                                                    border: 'none',
                                                    borderRadius: 6,
                                                    padding: '12px 28px',
                                                    fontWeight: 600,
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Tạo vận chuyển
                                            </button>
                                            <button
                                                type="button"
                                                style={{
                                                    background: '#eee',
                                                    color: '#333',
                                                    border: 'none',
                                                    borderRadius: 6,
                                                    padding: '12px 28px',
                                                    cursor: 'pointer'
                                                }}
                                                onClick={() => {
                                                    setShowCreateForm((f) => ({ ...f, [oid]: false }));
                                                    setSelectedOrderId(null);
                                                }}
                                            >
                                                Hủy
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default FarmerOrderShippingDetail;
