const API_BASE_URL = "http://localhost:3000/api/products";

export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  sale_price?: number; // Mới thêm
  quantity: number;
  unit: string;
  image_url?: string;
  extra_images?: string[];
  status: string;
  seller_id: number;
  category_id?: number;
  created_at?: string;
  updated_at?: string;
  
  // Các trường thống kê (optional)
  rating?: number;
  review_count?: number;
  sold_count?: number;
  seller_name?: string;
  category_name?: string;
}

export interface ProductSearchParams {
  seller_id?: number;
  keyword?: string;
  minPrice?: number | string;
  maxPrice?: number | string;
  categoryId?: number | null;
  location?: string;
  sortBy?: string;
}

// Helper Parse JSON
const parseJSONSafe = async (res: Response) => {
  const text = await res.text();
  try { return text ? JSON.parse(text) : {}; } 
  catch { return { error: text || res.statusText }; }
};

// Helper Query String
const toQueryString = (params?: ProductSearchParams) => {
  if (!params) return "";
  const q = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== "") {
      q.append(key, String(val));
    }
  });
  return q.toString() ? `?${q.toString()}` : "";
};

// ===================================================================
// 🌟 PRODUCT SERVICE CHÍNH (CODE MỚI DÙNG CÁI NÀY)
// ===================================================================
export const productService = {
  
  // 1. Lấy danh sách (Hỗ trợ lọc)
  async getAll(params?: ProductSearchParams): Promise<Product[]> {
    const res = await fetch(`${API_BASE_URL}${toQueryString(params)}`);
    if (!res.ok) throw new Error("Không thể lấy danh sách sản phẩm");
    return res.json();
  },

  // 2. Lấy chi tiết
  async getById(id: number): Promise<Product> {
    const res = await fetch(`${API_BASE_URL}/${id}`);
    if (!res.ok) throw new Error("Không tìm thấy sản phẩm");
    return res.json();
  },

  // 3. Tạo mới (Hỗ trợ FormData cho ảnh)
  async create(formData: FormData): Promise<Product> {
    const res = await fetch(API_BASE_URL, {
      method: "POST",
      body: formData,
    });
    const json = await parseJSONSafe(res);
    if (!res.ok) throw new Error(json.error || "Lỗi tạo sản phẩm");
    return json;
  },

  // 4. Cập nhật
  async update(id: number, formData: FormData): Promise<Product> {
    const res = await fetch(`${API_BASE_URL}/${id}`, {
      method: "PUT",
      body: formData,
    });
    const json = await parseJSONSafe(res);
    if (!res.ok) throw new Error(json.error || "Lỗi cập nhật sản phẩm");
    return json;
  },

  // 5. Xóa mềm
  async remove(id: number) {
    const res = await fetch(`${API_BASE_URL}/${id}`, { method: "DELETE" });
    const json = await parseJSONSafe(res);
    if (!res.ok) throw new Error(json.error || "Không thể xóa sản phẩm");
    return json;
  },

  // 6. Xóa vĩnh viễn
  async hardDelete(id: number) {
    const res = await fetch(`${API_BASE_URL}/${id}/permanent`, { method: "DELETE" });
    const json = await parseJSONSafe(res);
    if (!res.ok) throw new Error(json.error || "Xóa thất bại");
    return json;
  },
  
  // 7. Upload ảnh phụ
  async uploadExtraImages(id: number, files: File[]) {
    const form = new FormData();
    files.forEach((f) => form.append("extra_images", f));
    const res = await fetch(`${API_BASE_URL}/${id}/extra-images`, { method: "POST", body: form });
    return parseJSONSafe(res);
  },

  // 8. Xóa ảnh phụ
  async deleteExtraImage(id: number, index: number) {
    const res = await fetch(`${API_BASE_URL}/${id}/extra-images/${index}`, { method: "DELETE" });
    return parseJSONSafe(res);
  }
};

// ===================================================================
// ⚠️ VÙNG TƯƠNG THÍCH NGƯỢC (BACKWARD COMPATIBILITY)
// Giữ lại các hàm này để các file cũ không bị lỗi Import
// ===================================================================

export async function fetchProductsApi() {
  return productService.getAll();
}

export async function deleteProductApi(id: number) {
  return productService.remove(id);
}

// Hàm này map logic cũ sang logic mới
export async function saveProductApi(data: any, isEditing: boolean) {
  // Chuyển data object thường thành FormData để gọi hàm mới
  const fd = new FormData();
  Object.entries(data).forEach(([key, val]) => {
      if (val !== undefined && val !== null) fd.append(key, String(val));
  });

  if (isEditing && data.id) {
      return productService.update(data.id, fd);
  } else {
      return productService.create(fd);
  }
}

export async function uploadImageApi(file: File) {
    const fd = new FormData();
    fd.append("file", file); // Lưu ý: Backend của bạn dùng key là 'file' hay 'image' cần check lại api/upload
    const res = await fetch("http://localhost:3000/api/upload", { method: "POST", body: fd });
    return res.json();
}