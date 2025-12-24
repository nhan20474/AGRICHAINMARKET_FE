import { API_CONFIG, fetchWithTimeout } from '../config/apiConfig';

export const notificationService = {
  async create(data: {
    user_id: number;
    type: string;
    title: string;
    message: string;
    product_id?: number;
    order_id?: number;
  }) {
    try {
      const res = await fetchWithTimeout(`${API_CONFIG.NOTIFICATIONS}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Tạo thông báo thất bại');
      return res.json();
    } catch (error) {
      console.error('Create notification error:', error);
      throw error;
    }
  },

  async getUserNotifications(userId: number, page = 1, pageSize = 10, is_read?: boolean) {
    try {
      let url = `${API_CONFIG.NOTIFICATIONS}/user/${userId}?page=${page}&pageSize=${pageSize}`;
      if (typeof is_read === 'boolean') url += `&is_read=${is_read}`;
      const res = await fetchWithTimeout(url);
      if (!res.ok) throw new Error('Không thể lấy thông báo');
      return res.json();
    } catch (error) {
      console.error('Get user notifications error:', error);
      throw error;
    }
  },

  async getOrderNotifications(userId: number) {
    try {
      const res = await fetchWithTimeout(`${API_CONFIG.NOTIFICATIONS}/orders/${userId}`);
      if (!res.ok) throw new Error('Không thể lấy thông báo đơn hàng');
      return res.json();
    } catch (error) {
      console.error('Get order notifications error:', error);
      throw error;
    }
  },

  async getProductNotifications(sellerId: number) {
    try {
      const res = await fetchWithTimeout(`${API_CONFIG.NOTIFICATIONS}/products/${sellerId}`);
      if (!res.ok) throw new Error('Không thể lấy thông báo sản phẩm');
      return res.json();
    } catch (error) {
      console.error('Get product notifications error:', error);
      throw error;
    }
  },

  async markAsRead(id: number) {
    try {
      const res = await fetchWithTimeout(`${API_CONFIG.NOTIFICATIONS}/read/${id}`, { method: 'PATCH' });
      if (!res.ok) throw new Error('Không thể đánh dấu đã đọc');
      return res.json();
    } catch (error) {
      console.error('Mark as read error:', error);
      throw error;
    }
  },

  async remove(id: number) {
    try {
      const res = await fetchWithTimeout(`${API_CONFIG.NOTIFICATIONS}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Xóa thông báo thất bại');
      return res.json();
    } catch (error) {
      console.error('Remove notification error:', error);
      throw error;
    }
  },

  async getUnreadCount(userId: number) {
    try {
      const res = await fetchWithTimeout(`${API_CONFIG.NOTIFICATIONS}/user/${userId}/unread-count`);
      if (!res.ok) throw new Error('Không thể lấy số lượng thông báo chưa đọc');
      return res.json();
    } catch (error) {
      console.error('Get unread count error:', error);
      throw error;
    }
  }
};
