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

    // Thêm vào object orderService
    adminGetAll: async () => {
        const response = await fetch(`${API_BASE}/admin/all`, {
            headers: {
                'Authorization': localStorage.getItem('token') || '',
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) throw new Error('Không thể tải danh sách đơn hàng');
        return response.json();
    },

    adminCancelOrder: async (orderId: number) => {
        const response = await fetch(`${API_BASE}/admin/cancel/${orderId}`, {
            method: 'PUT',
            headers: {
                'Authorization': localStorage.getItem('token') || '',
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) throw new Error('Hủy đơn thất bại');
        return response.json();
    }
};