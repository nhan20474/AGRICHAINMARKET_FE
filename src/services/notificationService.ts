const API_BASE = 'http://localhost:3000/api/notifications';

export const notificationService = {
  async create(data: {
    user_id: number;
    type: string;
    title: string;
    message: string;
    product_id?: number;
    order_id?: number;
  }) {
    const res = await fetch(`${API_BASE}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Tạo thông báo thất bại');
    return res.json();
  },

  async getUserNotifications(userId: number, page = 1, pageSize = 10, is_read?: boolean) {
    let url = `${API_BASE}/user/${userId}?page=${page}&pageSize=${pageSize}`;
    if (typeof is_read === 'boolean') url += `&is_read=${is_read}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Không thể lấy thông báo');
    return res.json();
  },

  async getOrderNotifications(userId: number) {
    const res = await fetch(`${API_BASE}/orders/${userId}`);
    if (!res.ok) throw new Error('Không thể lấy thông báo đơn hàng');
    return res.json();
  },

  async getProductNotifications(sellerId: number) {
    const res = await fetch(`${API_BASE}/products/${sellerId}`);
    if (!res.ok) throw new Error('Không thể lấy thông báo sản phẩm');
    return res.json();
  },

  async markAsRead(id: number) {
    const res = await fetch(`${API_BASE}/read/${id}`, { method: 'PATCH' });
    if (!res.ok) throw new Error('Không thể đánh dấu đã đọc');
    return res.json();
  },

  async remove(id: number) {
    const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Xóa thông báo thất bại');
    return res.json();
  },

  async getUnreadCount(userId: number) {
    const res = await fetch(`${API_BASE}/user/${userId}/unread-count`);
    if (!res.ok) throw new Error('Không thể lấy số lượng thông báo chưa đọc');
    return res.json();
  }
};
