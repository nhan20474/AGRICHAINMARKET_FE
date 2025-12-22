const API_BASE = 'http://localhost:3000/api/orders';

// --- 1. Constants & Helpers ---
export const ORDER_STATUS_LABELS: Record<string, string> = {
    pending: 'Chờ xử lý',
    processing: 'Đang xử lý',
    shipped: 'Đang giao hàng',
    delivered: 'Đã giao hàng',
    received: 'Khách đã nhận',
    cancelled: 'Đã hủy'
};

export const ADMIN_ORDER_ACTIONS = {
    cancel: 'cancelled',
    processing: 'processing',
    shipped: 'shipped',
    delivered: 'delivered'
};

export function getOrderStatusColor(status: string): string {
    const colors: Record<string, string> = {
        pending: '#FF9800',     // Cam
        processing: '#2196F3',  // Xanh dương
        shipped: '#9C27B0',     // Tím
        delivered: '#4CAF50',   // Xanh lá
        received: '#388E3C',    // Xanh đậm
        cancelled: '#F44336'    // Đỏ
    };
    return colors[status] || '#9E9E9E';
}

// --- 2. Interfaces ---
export interface OrderItem {
    id?: number;
    product_id: number;
    name: string;         // Tên sản phẩm (Lưu cứng lúc mua)
    product_name?: string; // Tên sản phẩm (Join bảng)
    image_url?: string;
    product_image_url?: string;
    quantity: number;
    price_per_item: number;
    seller_id?: number;
}

export interface Order {
    id: number;
    buyer_id: number;
    seller_id: number;       // Quan trọng để phân biệt đơn của ai
    total_amount: number;
    
    // Thông tin giảm giá
    discount_amount?: number;
    discount_code?: string;

    shipping_address: string;
    status: string;
    created_at: string;
    
    // Quan hệ
    items: OrderItem[];
    buyer?: {               // Thông tin người mua (cho Farmer xem)
        full_name: string;
        phone_number: string;
        address: string;
    };
    payment?: {             // Thông tin thanh toán
        payment_method: string;
        payment_status: string;
    };
}

export interface AdminOrder {
  id: number;
  buyer_name: string;
  farmer_name: string;
  total_amount: number;
  status: string;
  created_at: string;
}

export interface AdminOrderDetail extends AdminOrder {
  shipping_address: string;
  discount_amount: number;
  discount_code?: string;
}

// --- 3. Service Methods ---
export const orderService = {
    
    // 1. Tạo đơn hàng mới (Có hỗ trợ mã giảm giá)
    async create(userId: number, data: { 
        shipping_address: string; 
        payment_method: string; 
        discount_code?: string; // Optional
        items?: any[] 
    }): Promise<{ message: string, order_id: number, orders: Order[] }> {
        
        const res = await fetch(`${API_BASE}/${userId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await res.json();
        
        if (!res.ok) {
            throw new Error(result.error || 'Tạo đơn hàng thất bại');
        }
        return result;
    },

    // 2. Lấy danh sách đơn hàng của User (Người mua)
    async getByUser(userId: number): Promise<Order[]> {
        const res = await fetch(`${API_BASE}/${userId}`);
        if (!res.ok) throw new Error('Không thể lấy danh sách đơn hàng');
        return await res.json();
    },

    // 3. Lấy chi tiết đơn hàng
    async getDetail(orderId: number): Promise<{ order: Order, items: OrderItem[] }> {
        const res = await fetch(`${API_BASE}/detail/${orderId}`);
        if (!res.ok) throw new Error('Không thể lấy chi tiết đơn hàng');
        return await res.json();
    },

    // 4. Lấy lịch sử mua hàng (Đã chuẩn hóa cấu trúc)
    async getHistory(userId: number): Promise<Order[]> {
        const res = await fetch(`${API_BASE}/history/${userId}`);
        if (!res.ok) throw new Error('Không thể lấy lịch sử mua hàng');
        
        const data = await res.json();
        
        // Chuẩn hóa dữ liệu nếu Backend trả về dạng lồng nhau
        if (Array.isArray(data) && data.length > 0 && data[0].order) {
            return data.map((item: any) => ({
                ...item.order,
                items: item.items
            }));
        }
        return data;
    },

    // 5. Xóa đơn hàng (Hủy đơn)
    async remove(orderId: number): Promise<{ message: string }> {
        const res = await fetch(`${API_BASE}/${orderId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Xóa đơn hàng thất bại');
        return await res.json();
    },

    // 6. Lấy tất cả đơn hàng (Admin)
    async getAll(): Promise<Order[]> {
        const res = await fetch(`${API_BASE}`);
        if (!res.ok) throw new Error('Không thể lấy danh sách tất cả đơn hàng');
        return await res.json();
    },

    // 7. Lấy đơn hàng theo Seller (Farmer Dashboard)
    async getBySeller(sellerId: number): Promise<Order[]> {
        const res = await fetch(`${API_BASE}/by-seller/${sellerId}`);
        if (!res.ok) throw new Error('Không thể lấy đơn hàng của nông dân');
        return await res.json();
    },

    // 8. Cập nhật trạng thái đơn hàng (Farmer/Admin)
    // API Backend mới: PUT /api/orders/:orderId/product/:productId/status
    // Hoặc PUT /api/orders/:orderId/status (Cho Admin/Buyer hủy)
    async updateStatus(
        orderId: number, 
        status: string, 
        sellerId?: number, // Optional: Nếu là Farmer cập nhật
        productId?: number // Optional: Nếu cập nhật từng món
    ): Promise<any> {
        
        let url = `${API_BASE}/${orderId}/status`;
        let body: any = { status };

        // Nếu là Farmer cập nhật trạng thái món hàng
        if (sellerId && productId) {
            url = `${API_BASE}/${orderId}/product/${productId}/status`;
            body.seller_id = sellerId;
        } 
        // Nếu là Buyer hủy đơn hoặc xác nhận nhận hàng
        else if (status === 'cancelled' || status === 'received') {
             // Có thể cần truyền buyer_id nếu backend yêu cầu xác thực chặt
        }

        const res = await fetch(url, {
            method: 'PUT', // Backend dùng PUT
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Cập nhật trạng thái thất bại');
        
        return result;
    },

    // 9. Admin: Lấy danh sách đơn hàng
    async adminGetOrders(adminId: number, status?: string, limit?: number): Promise<Order[]> {
        let url = `http://localhost:3000/api/admin/orders?admin_id=${adminId}`;
        if (status) url += `&status=${status}`;
        if (limit) url += `&limit=${limit}`; // Thêm tham số `limit` nếu được truyền vào

        const token = localStorage.getItem('token'); // Lấy token từ localStorage

        if (!token) {
            throw new Error('Không tìm thấy token. Vui lòng đăng nhập lại.');
        }

        const res = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`, // Gửi token trong header
                'Content-Type': 'application/json'
            }
        });

        if (!res.ok) {
            const text = await res.text();
            console.error('Admin orders API error:', text);
            throw new Error('Không thể tải đơn hàng (Admin)');
        }

        return await res.json();
    },

    // 10. Admin: Xem chi tiết đơn hàng
    async adminGetOrderDetail(
    adminId: number,
    orderId: number
    ): Promise<{
    order: AdminOrderDetail;
    items: OrderItem[];
    }> {
    const res = await fetch(
        `http://localhost:3000/api/admin/orders/${orderId}?admin_id=${adminId}`
    );

    const contentType = res.headers.get('content-type');
        if (!res.ok) {
        const text = await res.text();
        throw new Error(`Không thể lấy chi tiết đơn hàng: ${text}`);
        }
        if (contentType && contentType.includes('application/json')) {
        return await res.json();
        } else {
        const text = await res.text();
        throw new Error(`Response không phải JSON: ${text}`);
        }
    },

    // 11. Admin: Hủy đơn hàng
    async adminCancelOrder(
    adminId: number,
    orderId: number
    ): Promise<{ message: string }> {
    const res = await fetch(
        `http://localhost:3000/api/admin/orders/${orderId}/cancel`,
        {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_id: adminId })
        }
    );

    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Admin hủy đơn thất bại');

    return result;
    },

    // 12. Admin: Hủy 1 sản phẩm trong đơn
    async adminCancelOrderItem(
    adminId: number,
    orderItemId: number
    ): Promise<{ message: string }> {
    const res = await fetch(
        `http://localhost:3000/api/admin/order-items/${orderItemId}/cancel`,
        {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_id: adminId })
        }
    );

    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Không thể hủy sản phẩm');

    return result;
    },

    // 13. Admin: Thống kê đơn hàng
    async adminStatistics(adminId: number): Promise<{
    total_orders: number;
    success_orders: number;
    cancelled_orders: number;
    revenue: number;
    }> {
    const res = await fetch(
        `http://localhost:3000/api/admin/orders/statistics?admin_id=${adminId}`
    );

    if (!res.ok) throw new Error('Không thể lấy thống kê đơn hàng');
    return await res.json();
    },



};