import { API_CONFIG, fetchWithTimeout } from '../config/apiConfig';

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
        try {
            const res = await fetchWithTimeout(`${API_CONFIG.BASE_URL}/discounts/validate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code })
            });
            
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Mã giảm giá không hợp lệ');
            }
            return data;
        } catch (error) {
            console.error('Validate discount error:', error);
            throw error;
        }
    },

    // 2. Lấy danh sách mã (Dành cho Admin)
    async getAll(): Promise<Discount[]> {
        try {
            const res = await fetchWithTimeout(`${API_CONFIG.BASE_URL}/discounts`);
            if (!res.ok) return [];
            return await res.json();
        } catch (error) {
            console.error('Get all discounts error:', error);
            return [];
        }
    },

    // 3. Tạo mã mới (Admin)
    async create(data: Partial<Discount>) {
        try {
            const res = await fetchWithTimeout(`${API_CONFIG.BASE_URL}/discounts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error('Lỗi tạo mã');
            return await res.json();
        } catch (error) {
            console.error('Create discount error:', error);
            throw error;
        }
    },

    // 4. Xóa mã (Admin)
    async remove(id: number) {
        try {
            const res = await fetchWithTimeout(`${API_CONFIG.BASE_URL}/discounts/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Lỗi xóa mã');
            return await res.json();
        } catch (error) {
            console.error('Remove discount error:', error);
            throw error;
        }
    }
};