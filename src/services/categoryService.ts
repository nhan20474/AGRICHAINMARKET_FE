const API_URL = 'http://localhost:3000/api/categories'; 

export interface Category {
    id: number;
    name: string;
    description?: string;
}

export const categoryService = {
    getAll: async (): Promise<Category[]> => {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error('Lỗi tải danh mục');
        }
        return response.json();
    }
};