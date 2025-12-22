const API_URL = 'http://localhost:3000/api/reports';

export interface DashboardStats {
    revenue: number;
    completed_orders: number;
    pending_orders: number;
    total_products: number;
}

export interface ChartDataPoint {
    label: string;      // 2025-10-20 hoặc 2025-10
    revenue: number;
    orders: number;
}

export const reportService = {

    // =============================
    // 1. DASHBOARD STATS (REALTIME)
    // =============================
    async getDashboardStats(sellerId?: number): Promise<DashboardStats> {
        const url = new URL(`${API_URL}/dashboard-stats`);

        if (sellerId !== undefined && sellerId !== null) {
            url.searchParams.append('seller_id', String(sellerId));
        }

        const res = await fetch(url.toString());
        if (!res.ok) throw new Error('Lỗi tải thống kê dashboard');

        return await res.json();
    },

    // =============================
    // 2. CHART DATA (FROM REPORTS)
    // =============================
    async getChartData(params: { 
        seller_id?: number; 
        from_date?: string; 
        to_date?: string; 
        type?: 'daily' | 'monthly';
    }): Promise<ChartDataPoint[]> {

        const url = new URL(`${API_URL}/chart`);

        if (params.seller_id !== undefined && params.seller_id !== null) {
            url.searchParams.append('seller_id', String(params.seller_id));
        }

        if (params.from_date) {
            url.searchParams.append('from_date', params.from_date);
        }

        if (params.to_date) {
            url.searchParams.append('to_date', params.to_date);
        }

        if (params.type) {
            url.searchParams.append('type', params.type);
        }

        const res = await fetch(url.toString());
        if (!res.ok) throw new Error('Lỗi tải dữ liệu biểu đồ');

        const data = await res.json();

        return data.map((item: any) => ({
            label: item.label,
            revenue: Number(item.revenue || 0),
            orders: Number(item.orders || 0)
        }));
    },

    // =============================
    // 3. SYNC REPORT DATA
    // =============================
    async syncData(date?: string) {
        const res = await fetch(`${API_URL}/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: date ? JSON.stringify({ date }) : JSON.stringify({})
        });

        if (!res.ok) throw new Error('Lỗi đồng bộ dữ liệu báo cáo');

        return await res.json();
    }
};
