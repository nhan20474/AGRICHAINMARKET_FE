const API_BASE = 'http://localhost:3000/api/reviews'; // Đã trỏ thẳng vào /reviews để code gọn hơn

export interface Review {
  id: number;
  order_id: number;
  product_id: number;
  user_id: number;
  rating: number;
  comment?: string;
  created_at: string;
  updated_at?: string | null;
  // Các trường bổ sung từ JOIN (Backend trả về)
  user_name?: string;
  product_name?: string;
}

export interface ReviewSummary {
  total: number;
  avg_rating: number | string; // Postgres có thể trả về string cho số thập phân
}

export const reviewService = {
  
  // 1. Tạo review mới (POST /api/reviews)
  async create(data: { 
    order_id: number; 
    product_id: number; 
    user_id: number; 
    rating: number; 
    comment?: string 
  }): Promise<Review> {
    const res = await fetch(`${API_BASE}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Không thể tạo đánh giá');
    }
    return res.json();
  },

  // 2. Lấy danh sách đánh giá của 1 sản phẩm (GET /api/reviews/product/:productId)
  async getByProduct(productId: number): Promise<Review[]> {
    const res = await fetch(`${API_BASE}/product/${productId}`);
    if (!res.ok) return [];
    return res.json();
  },

  // 3. Lấy thống kê sao trung bình (GET /api/reviews/product/:productId/summary)
  async getSummary(productId: number): Promise<ReviewSummary> {
    const res = await fetch(`${API_BASE}/product/${productId}/summary`);
    if (!res.ok) return { total: 0, avg_rating: 0 };
    return res.json();
  },

  // 4. Lấy đánh giá của User (GET /api/reviews/user/:userId)
  async getByUser(userId: number): Promise<Review[]> {
    const res = await fetch(`${API_BASE}/user/${userId}`);
    if (!res.ok) return [];
    return res.json();
  },

  // 5. Lấy đánh giá theo Seller (GET /api/reviews/seller/:sellerId)
  async getBySeller(sellerId: number): Promise<Review[]> {
    const res = await fetch(`${API_BASE}/seller/${sellerId}`);
    if (!res.ok) return [];
    return res.json();
  },

  // 6. Cập nhật đánh giá (PUT /api/reviews/:id)
  async update(id: number, data: { rating: number; comment?: string }): Promise<Review> {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Cập nhật thất bại');
    }
    return res.json();
  },

  // 7. Xóa đánh giá (DELETE /api/reviews/:id)
  async remove(id: number): Promise<{ message: string; id: number }> {
    const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
    
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Xóa thất bại');
    }
    return res.json();
  }
};