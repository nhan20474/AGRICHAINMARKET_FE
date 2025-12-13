const API_BASE_URL = 'http://localhost:3000/api/panels'; // Điều chỉnh port nếu cần

export interface Panel {
  id: number;
  name: string;
  description?: string;
  page: string;        // 'home', 'about', 'contact'...
  content?: any;       // JSON object tùy ý
  images: string[];    // Mảng URL ảnh
  created_at?: string;
  updated_at?: string;
}

// Helper function để xử lý lỗi
const handleResponse = async (res: Response) => {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Lỗi không xác định');
  }
  return res.json();
};

export const panelService = {
  
  // 1. Lấy tất cả Panel
  async getAll(): Promise<Panel[]> {
    const res = await fetch(API_BASE_URL);
    return handleResponse(res);
  },

  // 2. Lấy chi tiết Panel
  async getById(id: number): Promise<Panel> {
    const res = await fetch(`${API_BASE_URL}/${id}`);
    return handleResponse(res);
  },

  // 3. Tạo mới Panel (Có upload ảnh)
  async create(data: { 
    name: string; 
    description?: string; 
    page: string; 
    content?: any;
    files?: File[]; 
  }): Promise<Panel> {
    const formData = new FormData();
    formData.append('name', data.name);
    if (data.description) formData.append('description', data.description);
    formData.append('page', data.page);
    
    // Chuyển content object thành string để gửi qua FormData
    if (data.content) {
      formData.append('content', JSON.stringify(data.content));
    }

    // Append file ảnh (nếu có)
    if (data.files && data.files.length > 0) {
      data.files.forEach((file) => {
        formData.append('images', file);
      });
    }

    const res = await fetch(API_BASE_URL, {
      method: 'POST',
      body: formData, // Không cần set Content-Type, browser tự làm
    });
    return handleResponse(res);
  },

  // 4. Cập nhật Panel (Có upload ảnh mới & giữ ảnh cũ)
  async update(id: number, data: { 
    name: string; 
    description?: string; 
    page: string; 
    content?: any;
    old_images?: string[]; // Danh sách URL ảnh cũ muốn giữ lại
    new_files?: File[];    // Ảnh mới muốn thêm vào
  }): Promise<Panel> {
    const formData = new FormData();
    formData.append('name', data.name);
    if (data.description) formData.append('description', data.description);
    formData.append('page', data.page);

    if (data.content) {
      formData.append('content', JSON.stringify(data.content));
    }

    // Gửi danh sách ảnh cũ (Backend sẽ parse JSON string này)
    if (data.old_images && data.old_images.length > 0) {
      formData.append('old_images', JSON.stringify(data.old_images));
    }

    // Gửi ảnh mới
    if (data.new_files && data.new_files.length > 0) {
      data.new_files.forEach((file) => {
        formData.append('images', file);
      });
    }

    const res = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'PUT',
      body: formData,
    });
    return handleResponse(res);
  },

  // 5. Xóa Panel
  async remove(id: number): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },

  // 6. Xóa 1 ảnh lẻ trong Panel
  async removeImage(id: number, imageUrl: string): Promise<{ message: string; images: string[] }> {
    const res = await fetch(`${API_BASE_URL}/${id}/image`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl }),
    });
    return handleResponse(res);
  },
};