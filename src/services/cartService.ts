import { API_CONFIG, fetchWithTimeout } from '../config/apiConfig';

export interface CartItem {
  id: number;           // cart_id
  product_id: number;
  name: string;
  price: number;        // current_price (giá sau khi so sánh sale)
  quantity: number;     // cart_quantity
  image_url: string;
  unit: string;
  current_stock: number;
  product_status: string;
  
  // --- CÁC TRƯỜNG MỚI ---
  original_price: number; // Giá gốc
  sale_price: number | null; // Giá khuyến mãi
}

export const cartService = {
  
  // 1. Lấy giỏ hàng (Backend trả về { items: [], total: 0 })
  async getCart(userId: number): Promise<{ items: any[], total: number }> {
    try {
      const res = await fetchWithTimeout(`${API_CONFIG.BASE_URL}/cart/${userId}`);
      if (!res.ok) throw new Error('Không thể lấy giỏ hàng');
      return await res.json();
    } catch (error) {
      console.error('Get cart error:', error);
      throw error;
    }
  },

  // 2. Thêm sản phẩm (Logic cộng dồn số lượng)
  async addItem(userId: number, item: { product_id: number; quantity: number }) {
    try {
      const res = await fetchWithTimeout(`${API_CONFIG.BASE_URL}/cart/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: userId, 
          product_id: item.product_id, 
          quantity: item.quantity 
        }),
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw {
          status: res.status,
          message: err.error || 'Thêm sản phẩm thất bại'
        };
      }
      return res.json();
    } catch (error) {
      console.error('Add item error:', error);
      throw error;
    }
  },

  // 3. Cập nhật số lượng (Set chính xác số lượng mới)
  async updateItem(userId: number, productId: number, quantity: number) {
    try {
      const res = await fetchWithTimeout(`${API_CONFIG.BASE_URL}/cart/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: userId, 
          product_id: productId, 
          quantity: quantity 
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Cập nhật số lượng thất bại');
      }
      return res.json();
    } catch (error) {
      console.error('Update item error:', error);
      throw error;
    }
  },

  // 4. Xóa sản phẩm
  async removeItem(userId: number, productId: number) {
    try {
      const res = await fetchWithTimeout(`${API_CONFIG.BASE_URL}/cart/${userId}/${productId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Xóa sản phẩm thất bại');
      return res.json();
    } catch (error) {
      console.error('Remove item error:', error);
      throw error;
    }
  },

  // 5. Xóa toàn bộ giỏ (Làm trống)
  async clearCart(userId: number) {
    try {
      const res = await fetchWithTimeout(`${API_CONFIG.BASE_URL}/cart/${userId}/clear`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Xóa giỏ hàng thất bại');
      return res.json();
    } catch (error) {
      console.error('Clear cart error:', error);
      throw error;
    }
  },
};