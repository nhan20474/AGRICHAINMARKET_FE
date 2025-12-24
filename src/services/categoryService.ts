import { API_CONFIG, fetchWithTimeout } from '../config/apiConfig';

export interface Category {
    id: number;
    name: string;
    description?: string;
}

export const categoryService = {
    getAll: async (): Promise<Category[]> => {
        try {
            const response = await fetchWithTimeout(API_CONFIG.CATEGORIES);
            if (!response.ok) {
                throw new Error('Lỗi tải danh mục');
            }
            return response.json();
        } catch (error) {
            console.error('Get categories error:', error);
            throw error;
        }
    }
};