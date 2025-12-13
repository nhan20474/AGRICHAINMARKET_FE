const API_URL = 'http://localhost:3000/api/discounts';

export interface Discount {
    id: number;
    code: string;
    description?: string;
    discount_percent: number;
    start_date: string;
    end_date: string;
    usage_limit: number;
    used_count: number;
    is_active: boolean;
}

export const discountService = {
    // 1. Kiểm tra mã giảm giá (Dành cho User lúc Checkout)
    async validate(code: string): Promise<{ success: boolean; discount_percent: number; message: string; code: string }> {
        const res = await fetch(`${API_URL}/validate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
        });
        
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || 'Mã giảm giá không hợp lệ');
        }
        return data;
    },

    // 2. Lấy danh sách mã (Dành cho Admin)
    async getAll(): Promise<Discount[]> {
        const res = await fetch(API_URL);
        if (!res.ok) return [];
        return await res.json();
    },

    // 3. Tạo mã mới (Admin)
    async create(data: Partial<Discount>) {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Lỗi tạo mã');
        return await res.json();
    },

    // 4. Xóa mã (Admin)
    async remove(id: number) {
        const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Lỗi xóa mã');
        return await res.json();
    }
};