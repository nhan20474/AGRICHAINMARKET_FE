const API_BASE_URL = 'http://localhost:3000/api/cart';

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
    const res = await fetch(`${API_BASE_URL}/${userId}`);
    if (!res.ok) throw new Error('Không thể lấy giỏ hàng');
    return await res.json();
  },

  // 2. Thêm sản phẩm (Logic cộng dồn số lượng)
  async addItem(userId: number, item: { product_id: number; quantity: number }) {
    const res = await fetch(`${API_BASE_URL}/add`, {
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
  },

  // 3. Cập nhật số lượng (Set chính xác số lượng mới)
  async updateItem(userId: number, productId: number, quantity: number) {
    const res = await fetch(`${API_BASE_URL}/update`, {
      method: 'PUT', // Backend dùng PUT cho update
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
  },

  // 4. Xóa sản phẩm
  async removeItem(userId: number, productId: number) {
    const res = await fetch(`${API_BASE_URL}/${userId}/${productId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Xóa sản phẩm thất bại');
    return res.json();
  },

  // 5. Xóa toàn bộ giỏ (Làm trống)
  async clearCart(userId: number) {
    const res = await fetch(`${API_BASE_URL}/${userId}/clear`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Xóa giỏ hàng thất bại');
    return res.json();
  },
};