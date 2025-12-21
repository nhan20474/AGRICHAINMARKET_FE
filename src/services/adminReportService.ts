import axios from 'axios';

const API_BASE = 'http://localhost:3000/api/reports';

export const adminReportService = {
  // Tổng quan dashboard
  async getDashboardStats() {
    const res = await axios.get(`${API_BASE}/dashboard-stats`);
    return res.data;
  },
  // Biểu đồ doanh thu
  async getChart(params: { seller_id?: number, from_date?: string, to_date?: string, type?: string }) {
    const res = await axios.get(`${API_BASE}/chart`, { params });
    return res.data;
  },
  // Đồng bộ báo cáo
  async syncReport(date?: string) {
    const res = await axios.post(`${API_BASE}/sync`, date ? { date } : {});
    return res.data;
  }
};
