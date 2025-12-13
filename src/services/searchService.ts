const API_URL = 'http://localhost:3000/api/search';

export interface SearchParams {
    keyword?: string;
    minPrice?: number;
    maxPrice?: number;
    categoryId?: number;
    location?: string;
    sortBy?: string;
}

export const searchService = {
    search: async (params: SearchParams) => {
        // 1. Lọc bỏ các giá trị undefined/null để tạo query string sạch
        const cleanParams: any = {};
        Object.keys(params).forEach(key => {
            const value = (params as any)[key];
            if (value !== undefined && value !== null && value !== '') {
                cleanParams[key] = value.toString();
            }
        });

        // 2. Tạo query string (ví dụ: ?keyword=tao&minPrice=5000)
        const queryString = new URLSearchParams(cleanParams).toString();
        
        // 3. Gọi API
        const response = await fetch(`${API_URL}?${queryString}`);
        
        if (!response.ok) {
            throw new Error('Lỗi tìm kiếm');
        }
        return response.json();
    }
};