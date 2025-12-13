const API_URL = 'http://localhost:3000/api/blockchain';

export interface TraceLog {
    action: string;
    location: string;
    date: string;
    notes?: string;
    tx_hash?: string;
    explorer_url?: string;
}

export const blockchainService = {
    
    // 1. Lấy lịch sử Blockchain của sản phẩm
    async getHistory(productId: number): Promise<TraceLog[]> {
        try {
            const res = await fetch(`${API_URL}/${productId}`);
            if (!res.ok) return [];
            return await res.json();
        } catch (error) {
            console.error("Lỗi lấy nhật ký blockchain:", error);
            return [];
        }
    },

    // 2. Ghi nhật ký mới
    async addLog(data: { 
        product_id: number; 
        action: string; 
        location: string; 
        notes?: string;
        image_url?: string;
    }) {
        // --- QUAN TRỌNG: MAP TÊN BIẾN CHO KHỚP BACKEND ---
        // Backend đang đợi 'productId', nhưng Frontend đang dùng 'product_id'
        const payload = {
            productId: data.product_id, // Chuyển đổi ở đây
            action: data.action,
            location: data.location,
            notes: data.notes,
            image_url: data.image_url
        };

        const res = await fetch(`${API_URL}/add-log`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload) // Gửi payload đã sửa tên
        });

        const result = await res.json();

        if (!res.ok) {
            throw new Error(result.error || 'Ghi nhật ký thất bại');
        }

        return result; 
    }
};