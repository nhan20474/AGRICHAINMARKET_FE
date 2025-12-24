import { API_CONFIG, fetchWithTimeout } from '../config/apiConfig';

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
    try {
      const res = await fetchWithTimeout(`${API_CONFIG.REVIEWS}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Không thể tạo đánh giá');
      }
      return res.json();
    } catch (error) {
      console.error('Create review error:', error);
      throw error;
    }
  },

  // 2. Lấy danh sách đánh giá của 1 sản phẩm (GET /api/reviews/product/:productId)
  async getByProduct(productId: number): Promise<Review[]> {
    try {
      const res = await fetchWithTimeout(`${API_CONFIG.REVIEWS}/product/${productId}`);
      if (!res.ok) return [];
      return res.json();
    } catch (error) {
      console.error('Get product reviews error:', error);
      return [];
    }
  },

  // 3. Lấy thống kê sao trung bình (GET /api/reviews/product/:productId/summary)
  async getSummary(productId: number): Promise<ReviewSummary> {
    try {
      const res = await fetchWithTimeout(`${API_CONFIG.REVIEWS}/product/${productId}/summary`);
      if (!res.ok) return { total: 0, avg_rating: 0 };
      return res.json();
    } catch (error) {
      console.error('Get review summary error:', error);
      return { total: 0, avg_rating: 0 };
    }
  },

  // 4. Lấy đánh giá của User (GET /api/reviews/user/:userId)
  async getByUser(userId: number): Promise<Review[]> {
    try {
      const res = await fetchWithTimeout(`${API_CONFIG.REVIEWS}/user/${userId}`);
      if (!res.ok) return [];
      return res.json();
    } catch (error) {
      console.error('Get user reviews error:', error);
      return [];
    }
  },

  // 5. Lấy đánh giá theo Seller (GET /api/reviews/seller/:sellerId)
  async getBySeller(sellerId: number): Promise<Review[]> {
    try {
      const res = await fetchWithTimeout(`${API_CONFIG.REVIEWS}/seller/${sellerId}`);
      if (!res.ok) return [];
      return res.json();
    } catch (error) {
      console.error('Get seller reviews error:', error);
      return [];
    }
  },

  // 6. Cập nhật đánh giá (PUT /api/reviews/:id)
  async update(id: number, data: { rating: number; comment?: string }): Promise<Review> {
    try {
      const res = await fetchWithTimeout(`${API_CONFIG.REVIEWS}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Cập nhật thất bại');
      }
      return res.json();
    } catch (error) {
      console.error('Update review error:', error);
      throw error;
    }
  },

  // 7. Xóa đánh giá (DELETE /api/reviews/:id)
  async remove(id: number): Promise<{ message: string; id: number }> {
    try {
      const res = await fetchWithTimeout(`${API_CONFIG.REVIEWS}/${id}`, { method: 'DELETE' });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Xóa thất bại');
      }
      return res.json();
    } catch (error) {
      console.error('Remove review error:', error);
      throw error;
    }
  }
};