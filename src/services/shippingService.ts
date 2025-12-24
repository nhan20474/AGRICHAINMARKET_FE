import { API_CONFIG, fetchWithTimeout } from '../config/apiConfig';

export interface ShippingInfo {
  order_id: number;
  shipping_company?: string;
  tracking_number?: string;
  shipping_status?: string;
  shipped_at?: string;
  delivered_at?: string;
  updated_at?: string;
}

export const shippingService = {
  // Tạo hoặc cập nhật thông tin vận chuyển cho đơn hàng
  async upsert(orderId: number, data: Partial<ShippingInfo>): Promise<ShippingInfo> {
    try {
      const res = await fetchWithTimeout(`${API_CONFIG.SHIPPING}/${orderId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || result.message || 'Cập nhật thông tin vận chuyển thất bại');
      return result.shipping || result;
    } catch (error) {
      console.error('Upsert shipping error:', error);
      throw error;
    }
  },

  // Lấy thông tin vận chuyển của đơn hàng
  async getByOrder(orderId: number): Promise<ShippingInfo | null> {
    try {
      const res = await fetchWithTimeout(`${API_CONFIG.SHIPPING}/${orderId}`);
      if (!res.ok) return null;
      return await res.json();
    } catch (error) {
      console.error('Get shipping info error:', error);
      return null;
    }
  },

  // Lấy tất cả thông tin vận chuyển của các đơn hàng (cho admin)
  async getAll(): Promise<ShippingInfo[]> {
    try {
      const res = await fetchWithTimeout(`${API_CONFIG.SHIPPING}`);
      if (!res.ok) return [];
      return await res.json();
    } catch (error) {
      console.error('Get all shipping error:', error);
      return [];
    }
  },

  // Xóa thông tin vận chuyển khi đơn hàng bị hủy
  async remove(orderId: number): Promise<ShippingInfo | null> {
    try {
      const res = await fetchWithTimeout(`${API_CONFIG.SHIPPING}/${orderId}`, {
        method: 'DELETE'
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || result.message || 'Xóa thông tin vận chuyển thất bại');
      return result.shipping || null;
    } catch (error) {
      console.error('Remove shipping error:', error);
      throw error;
    }
  }
};
