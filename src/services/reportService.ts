const API_URL = 'http://localhost:3000/api/reports';

export interface DashboardStats {
    revenue: number;
    completed_orders: number;
    pending_orders: number;
    total_products: number;
}

export interface ChartDataPoint {
    label: string;  // Ngày (2025-10-20) hoặc Tháng (2025-10)
    revenue: number;
    orders: number;
}

export const reportService = {
    // 1. Lấy số liệu tổng quan (Realtime) cho thẻ Card trên Dashboard
    async getDashboardStats(sellerId?: number): Promise<DashboardStats> {
        const url = new URL(`${API_URL}/dashboard-stats`);
        if (sellerId) url.searchParams.append('seller_id', String(sellerId));
        
        const res = await fetch(url.toString());
        if (!res.ok) throw new Error('Lỗi tải thống kê');
        return await res.json();
    },

    // 2. Lấy dữ liệu biểu đồ (Lịch sử từ bảng Reports)
    async getChartData(params: { 
        seller_id?: number; 
        from_date?: string; 
        to_date?: string; 
        type?: 'daily' | 'monthly' 
    }): Promise<ChartDataPoint[]> {
        const url = new URL(`${API_URL}/chart`);
        if (params.seller_id) url.searchParams.append('seller_id', String(params.seller_id));
        if (params.from_date) url.searchParams.append('from_date', params.from_date);
        if (params.to_date) url.searchParams.append('to_date', params.to_date);
        if (params.type) url.searchParams.append('type', params.type);

        const res = await fetch(url.toString());
        if (!res.ok) throw new Error('Lỗi tải biểu đồ');
        const data = await res.json();
        
        // Map dữ liệu để đảm bảo đúng kiểu số
        return data.map((item: any) => ({
            label: item.label,
            revenue: Number(item.revenue),
            orders: Number(item.orders)
        }));
    },

    // 3. Kích hoạt tính toán báo cáo (Sync)
    async syncData(date?: string) {
        const res = await fetch(`${API_URL}/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date })
        });
        if (!res.ok) throw new Error('Lỗi đồng bộ dữ liệu');
        return await res.json();
    }
};