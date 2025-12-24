import { API_CONFIG, fetchWithTimeout } from '../config/apiConfig';
import { safeGetItem } from '../utils/storageUtils';

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
        pending: '#FF9800',
        processing: '#2196F3',
        shipped: '#9C27B0',
        delivered: '#4CAF50',
        received: '#388E3C',
        cancelled: '#F44336'
    };
    return colors[status] || '#9E9E9E';
}

// --- 2. Interfaces ---
export interface OrderItem {
    id?: number;
    product_id: number;
    name: string;
    product_name?: string;
    image_url?: string;
    product_image_url?: string;
    quantity: number;
    price_per_item: number;
    seller_id?: number;
}

export interface Order {
    id: number;
    buyer_id: number;
    seller_id: number;
    total_amount: number;
    discount_amount?: number;
    discount_code?: string;
    shipping_address: string;
    status: string;
    created_at: string;
    items: OrderItem[];
    buyer?: {
        full_name: string;
        phone_number: string;
        address: string;
    };
    payment?: {
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
    
    // 1. Tạo đơn hàng mới
    async create(userId: number, data: { 
        shipping_address: string; 
        payment_method: string; 
        discount_code?: string;
        items?: any[] 
    }): Promise<{ message: string, order_id: number, orders: Order[] }> {
        try {
            const res = await fetchWithTimeout(`${API_CONFIG.ORDERS}/${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            const result = await res.json();
            if (!res.ok) {
                throw new Error(result.error || 'Tạo đơn hàng thất bại');
            }
            return result;
        } catch (error) {
            console.error('Order create error:', error);
            throw error;
        }
    },

    // 2. Lấy danh sách đơn hàng của User
    async getByUser(userId: number): Promise<Order[]> {
        try {
            const res = await fetchWithTimeout(`${API_CONFIG.ORDERS}/${userId}`);
            if (!res.ok) throw new Error('Không thể lấy danh sách đơn hàng');
            return await res.json();
        } catch (error) {
            console.error('Get orders error:', error);
            throw error;
        }
    },

    // 3. Lấy chi tiết đơn hàng
    async getDetail(orderId: number): Promise<{ order: Order, items: OrderItem[] }> {
        try {
            const res = await fetchWithTimeout(`${API_CONFIG.ORDERS}/detail/${orderId}`);
            if (!res.ok) throw new Error('Không thể lấy chi tiết đơn hàng');
            return await res.json();
        } catch (error) {
            console.error('Get order detail error:', error);
            throw error;
        }
    },

    // 4. Lấy lịch sử mua hàng
    async getHistory(userId: number): Promise<Order[]> {
        try {
            const res = await fetchWithTimeout(`${API_CONFIG.ORDERS}/history/${userId}`);
            if (!res.ok) throw new Error('Không thể lấy lịch sử mua hàng');
            
            const data = await res.json();
            
            if (Array.isArray(data) && data.length > 0 && data[0].order) {
                return data.map((item: any) => ({
                    ...item.order,
                    items: item.items
                }));
            }
            return data;
        } catch (error) {
            console.error('Get order history error:', error);
            throw error;
        }
    },

    // 5. Xóa đơn hàng (Hủy đơn)
    async remove(orderId: number): Promise<{ message: string }> {
        try {
            const res = await fetchWithTimeout(`${API_CONFIG.ORDERS}/${orderId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Xóa đơn hàng thất bại');
            return await res.json();
        } catch (error) {
            console.error('Remove order error:', error);
            throw error;
        }
    },

    // 6. Lấy tất cả đơn hàng (Admin)
    async getAll(): Promise<Order[]> {
        try {
            const res = await fetchWithTimeout(`${API_CONFIG.ORDERS}`);
            if (!res.ok) throw new Error('Không thể lấy danh sách tất cả đơn hàng');
            return await res.json();
        } catch (error) {
            console.error('Get all orders error:', error);
            throw error;
        }
    },

    // 7. Lấy đơn hàng theo Seller (Farmer Dashboard)
    async getBySeller(sellerId: number): Promise<Order[]> {
        try {
            const res = await fetchWithTimeout(`${API_CONFIG.ORDERS}/by-seller/${sellerId}`);
            if (!res.ok) throw new Error('Không thể lấy đơn hàng của nông dân');
            return await res.json();
        } catch (error) {
            console.error('Get seller orders error:', error);
            throw error;
        }
    },

    // 8. Cập nhật trạng thái đơn hàng
    async updateStatus(
        orderId: number, 
        status: string, 
        sellerId?: number,
        productId?: number
    ): Promise<any> {
        try {
            let url = `${API_CONFIG.ORDERS}/${orderId}/status`;
            let body: any = { status };

            if (sellerId && productId) {
                url = `${API_CONFIG.ORDERS}/${orderId}/product/${productId}/status`;
                body.seller_id = sellerId;
            }

            const res = await fetchWithTimeout(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.error || 'Cập nhật trạng thái thất bại');
            
            return result;
        } catch (error) {
            console.error('Update order status error:', error);
            throw error;
        }
    },

    // 9. Admin: Lấy danh sách đơn hàng
    async adminGetOrders(adminId: number, status?: string, limit?: number): Promise<Order[]> {
        try {
            const params = new URLSearchParams({ admin_id: String(adminId) });
            if (status) params.append('status', status);
            if (limit) params.append('limit', String(limit));

            const token = safeGetItem('token');

            if (!token) {
                throw new Error('Không tìm thấy token. Vui lòng đăng nhập lại.');
            }

            const res = await fetchWithTimeout(`${API_CONFIG.BASE_URL}/admin/orders?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!res.ok) {
                const text = await res.text();
                console.error('Admin orders API error:', text);
                throw new Error('Không thể tải đơn hàng (Admin)');
            }

            return await res.json();
        } catch (error) {
            console.error('Admin get orders error:', error);
            throw error;
        }
    },

    // 10. Admin: Xem chi tiết đơn hàng
    async adminGetOrderDetail(
        adminId: number,
        orderId: number
    ): Promise<{
        order: AdminOrderDetail;
        items: OrderItem[];
    }> {
        try {
            const res = await fetchWithTimeout(
                `${API_CONFIG.BASE_URL}/admin/orders/${orderId}?admin_id=${adminId}`
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
        } catch (error) {
            console.error('Admin get order detail error:', error);
            throw error;
        }
    },

    // 11. Admin: Hủy đơn hàng
    async adminCancelOrder(
        adminId: number,
        orderId: number
    ): Promise<{ message: string }> {
        try {
            const res = await fetchWithTimeout(
                `${API_CONFIG.BASE_URL}/admin/orders/${orderId}/cancel`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ admin_id: adminId })
                }
            );

            const result = await res.json();
            if (!res.ok) throw new Error(result.error || 'Admin hủy đơn thất bại');

            return result;
        } catch (error) {
            console.error('Admin cancel order error:', error);
            throw error;
        }
    },

    // 12. Admin: Hủy 1 sản phẩm trong đơn
    async adminCancelOrderItem(
        adminId: number,
        orderItemId: number
    ): Promise<{ message: string }> {
        try {
            const res = await fetchWithTimeout(
                `${API_CONFIG.BASE_URL}/admin/order-items/${orderItemId}/cancel`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ admin_id: adminId })
                }
            );

            const result = await res.json();
            if (!res.ok) throw new Error(result.error || 'Không thể hủy sản phẩm');

            return result;
        } catch (error) {
            console.error('Admin cancel order item error:', error);
            throw error;
        }
    },

    // 13. Admin: Thống kê đơn hàng
    async adminStatistics(adminId: number): Promise<{
        total_orders: number;
        success_orders: number;
        cancelled_orders: number;
        revenue: number;
    }> {
        try {
            const res = await fetchWithTimeout(
                `${API_CONFIG.BASE_URL}/admin/orders/statistics?admin_id=${adminId}`
            );

            if (!res.ok) throw new Error('Không thể lấy thống kê đơn hàng');
            return await res.json();
        } catch (error) {
            console.error('Admin statistics error:', error);
            throw error;
        }
    }
};