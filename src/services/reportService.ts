// ==========================================
// CONFIGURATION
// ==========================================
const API_URL = 'http://localhost:3000/api/reports'; // Đổi lại port của bạn nếu khác

// ==========================================
// HELPER FUNCTION (Thay thế Axios)
// ==========================================
async function get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
  // 1. Xử lý Query String bằng URLSearchParams
  const url = new URL(`${API_URL}${endpoint}`);
  
  if (params) {
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, String(params[key]));
      }
    });
  }

  // 2. Gọi Fetch
  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      // 'Authorization': `Bearer ${token}` // Thêm token nếu cần
    },
  });

  // 3. Xử lý lỗi HTTP (Fetch không tự throw lỗi khi gặp 4xx, 5xx)
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || `HTTP error! status: ${response.status}`);
  }

  // 4. Trả về JSON
  return await response.json();
}

// ==========================================
// INTERFACES (Kiểu dữ liệu)
// ==========================================

export interface AdminDashboardStats {
  total_revenue: number;
  total_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  pending_orders: number;
  total_users: number;
  total_sellers: number;
  total_buyers: number;
  total_products: number;
  low_stock_products: number;
}

export interface SalesTrendItem {
  label: string;
  total_orders: string | number; 
  total_revenue: string | number;
  total_quantity?: string | number; 
}

export interface TopProductItem {
  product_id: number;
  total_sold: string | number;
  revenue: string | number;
}

export interface FarmerAllTimeStats {
  total_orders: string | number;
  total_quantity: string | number;
  total_revenue: string | number;
  total_discount: string | number;
  average_order_value: string | number;
  pending_orders: string | number;
  cancelled_orders: string | number;
}

// Các interface phản hồi từ Server (dựa trên res.json của backend)
interface TrendResponse {
  success: boolean;
  trend: SalesTrendItem[];
}
interface TopProductResponse {
  success: boolean;
  top_products: TopProductItem[];
}
interface FarmerStatsResponse {
  success: boolean;
  seller_id: number;
  data: FarmerAllTimeStats;
}

// ==========================================
// SERVICE METHODS
// ==========================================

export const ReportService = {
  
  // --- ADMIN ---

  /**
   * GET /api/reports/admin/dashboard
   */
  getAdminDashboard: async (): Promise<AdminDashboardStats> => {
    // Backend trả về trực tiếp object, không có wrapper { success: true }
    return await get<AdminDashboardStats>('/admin/dashboard');
  },

  /**
   * GET /api/reports/admin/trend
   */
  getAdminTrend: async (
    type: 'daily' | 'monthly', 
    from?: string, 
    to?: string
  ): Promise<SalesTrendItem[]> => {
    const data = await get<TrendResponse>('/admin/trend', { type, from, to });
    return data.trend;
  },

  /**
   * GET /api/reports/admin/top-products
   */
  getAdminTopProducts: async (limit: number = 5): Promise<TopProductItem[]> => {
    const data = await get<TopProductResponse>('/admin/top-products', { limit });
    return data.top_products;
  },

  // --- FARMER ---

  /**
   * GET /api/reports/farmer/:sellerId/all-time
   */
  getFarmerAllTimeStats: async (sellerId: number): Promise<FarmerAllTimeStats> => {
    const data = await get<FarmerStatsResponse>(`/farmer/${sellerId}/all-time`);
    return data.data;
  },

  /**
   * GET /api/reports/farmer/:sellerId/trend
   */
  getFarmerTrend: async (
    sellerId: number,
    type: 'daily' | 'monthly',
    from?: string,
    to?: string
  ): Promise<SalesTrendItem[]> => {
    const data = await get<TrendResponse>(`/farmer/${sellerId}/trend`, { type, from, to });
    return data.trend;
  },

  /**
   * GET /api/reports/farmer/:sellerId/top-products
   */
  getFarmerTopProducts: async (sellerId: number, limit: number = 5): Promise<TopProductItem[]> => {
    const data = await get<TopProductResponse>(`/farmer/${sellerId}/top-products`, { limit });
    return data.top_products;
  }
};