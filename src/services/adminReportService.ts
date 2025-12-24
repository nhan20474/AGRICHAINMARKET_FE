import { API_CONFIG, fetchWithTimeout } from '../config/apiConfig';

export const adminReportService = {
  // Tổng quan dashboard
  async getDashboardStats() {
    try {
      const res = await fetchWithTimeout(`${API_CONFIG.REPORTS}/dashboard-stats`);
      if (!res.ok) throw new Error('Failed to get dashboard stats');
      return res.json();
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      throw error;
    }
  },
  // Biểu đồ doanh thu
  async getChart(params: { seller_id?: number, from_date?: string, to_date?: string, type?: string }) {
    try {
      const url = new URL(`${API_CONFIG.REPORTS}/chart`);
      Object.keys(params).forEach(key => {
        if (params[key as keyof typeof params] !== undefined) {
          url.searchParams.append(key, String(params[key as keyof typeof params]));
        }
      });

      const res = await fetchWithTimeout(url.toString());
      if (!res.ok) throw new Error('Failed to get chart');
      return res.json();
    } catch (error) {
      console.error('Get chart error:', error);
      throw error;
    }
  },
  // Đồng bộ báo cáo
  async syncReport(date?: string) {
    try {
      const res = await fetchWithTimeout(`${API_CONFIG.REPORTS}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(date ? { date } : {})
      });
      if (!res.ok) throw new Error('Failed to sync report');
      return res.json();
    } catch (error) {
      console.error('Sync report error:', error);
      throw error;
    }
  }
};
