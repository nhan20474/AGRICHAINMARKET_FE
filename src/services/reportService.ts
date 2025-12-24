// ==========================================
// CONFIGURATION
// ==========================================
import { API_CONFIG, fetchWithTimeout } from '../config/apiConfig';

// ==========================================
// HELPER FUNCTION (Thay thế Axios)
// ==========================================
async function get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
  try {
    // 1. Xử lý Query String bằng URLSearchParams
    const url = new URL(`${API_CONFIG.REPORTS}${endpoint}`);
    
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          url.searchParams.append(key, String(params[key]));
        }
      });
    }

    // 2. Gọi Fetch
    const response = await fetchWithTimeout(url.toString(), {
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
  } catch (error) {
    console.error('Get request error:', error);
    throw error;
  }
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
  total_orders: number;
  total_revenue: number;
  total_quantity?: number;
}

export interface TopProductItem {
  product_id: number;
  name: string;
  image_url: string;
  price: number;
  total_sold: number;
  revenue: number;
  order_count: number;
}

export interface FarmerAllTimeStats {
  total_orders: number;
  total_revenue: number;
  total_discount: number;
  average_order_value: number;
  pending_orders: number;
  cancelled_orders: number;
  completed_orders: number;
}

export interface SyncReportRequest {
  date?: string; // YYYY-MM-DD format
}

export interface SyncReportResponse {
  success: boolean;
  message: string;
  data: {
    date: string;
    sellers_updated: number;
    admin_updated: number;
  };
}

// Các interface phản hồi từ Server
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
// HELPER FUNCTION POST (Thay thế Axios)
// ==========================================
async function post<T>(
  endpoint: string,
  body?: Record<string, any>
): Promise<T> {
  try {
    const url = `${API_CONFIG.REPORTS}${endpoint}`;
    
    const response = await fetchWithTimeout(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Post request error:', error);
    throw error;
  }
}

// ==========================================
// SERVICE METHODS
// ==========================================

export const ReportService = {
  
  // --- ADMIN ---

  /**
   * GET /api/reports/admin/dashboard
   * Lấy overview dashboard (revenue, orders, users, products)
   */
  getAdminDashboard: async (): Promise<AdminDashboardStats> => {
    try {
      return await get<AdminDashboardStats>('/admin/dashboard');
    } catch (error) {
      console.error('Failed to get admin dashboard:', error);
      throw error;
    }
  },

  /**
   * GET /api/reports/admin/trend
   * Lấy sales trend theo ngày hoặc tháng
   */
  getAdminTrend: async (
    type: 'daily' | 'monthly' = 'daily',
    from?: string,
    to?: string
  ): Promise<SalesTrendItem[]> => {
    try {
      const data = await get<TrendResponse>('/admin/trend', { type, from, to });
      return data.trend;
    } catch (error) {
      console.error('Failed to get admin trend:', error);
      throw error;
    }
  },

  /**
   * GET /api/reports/admin/top-products
   * Lấy top products bán chạy nhất
   */
  getAdminTopProducts: async (limit: number = 5): Promise<TopProductItem[]> => {
    try {
      const data = await get<TopProductResponse>('/admin/top-products', { limit });
      return data.top_products;
    } catch (error) {
      console.error('Failed to get admin top products:', error);
      throw error;
    }
  },

  /**
   * POST /api/reports/sync
   * Đồng bộ report data (cache builder)
   */
  syncReports: async (date?: string): Promise<SyncReportResponse> => {
    try {
      return await post<SyncReportResponse>('/sync', { date });
    } catch (error) {
      console.error('Failed to sync reports:', error);
      throw error;
    }
  },

  // --- FARMER ---

  /**
   * GET /api/reports/farmer/:sellerId/all-time
   * Lấy thống kê tổng thể của farmer
   */
  getFarmerAllTimeStats: async (sellerId: number): Promise<FarmerAllTimeStats> => {
    try {
      if (!sellerId || isNaN(sellerId)) {
        throw new Error('Invalid sellerId');
      }
      const data = await get<FarmerStatsResponse>(`/farmer/${sellerId}/all-time`);
      return data.data;
    } catch (error) {
      console.error('Failed to get farmer all-time stats:', error);
      throw error;
    }
  },

  /**
   * GET /api/reports/farmer/:sellerId/trend
   * Lấy sales trend của farmer
   */
  getFarmerTrend: async (
    sellerId: number,
    type: 'daily' | 'monthly' = 'daily',
    from?: string,
    to?: string
  ): Promise<SalesTrendItem[]> => {
    try {
      if (!sellerId || isNaN(sellerId)) {
        throw new Error('Invalid sellerId');
      }
      const data = await get<TrendResponse>(`/farmer/${sellerId}/trend`, { type, from, to });
      return data.trend;
    } catch (error) {
      console.error('Failed to get farmer trend:', error);
      throw error;
    }
  },

  /**
   * GET /api/reports/farmer/:sellerId/top-products
   * Lấy top products của farmer
   */
  getFarmerTopProducts: async (sellerId: number, limit: number = 5): Promise<TopProductItem[]> => {
    try {
      if (!sellerId || isNaN(sellerId)) {
        throw new Error('Invalid sellerId');
      }
      const data = await get<TopProductResponse>(`/farmer/${sellerId}/top-products`, { limit });
      return data.top_products;
    } catch (error) {
      console.error('Failed to get farmer top products:', error);
      throw error;
    }
  }
};