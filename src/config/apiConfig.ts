/**
 * API Configuration
 * Quản lý tập trung tất cả API URLs
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
const UPLOAD_URL = import.meta.env.VITE_UPLOAD_URL || 'http://localhost:3000/api/upload';

export const API_CONFIG = {
    BASE_URL: API_BASE_URL,
    SOCKET_URL: SOCKET_URL,
    UPLOAD_URL: UPLOAD_URL,
    
    // API Endpoints
    ORDERS: `${API_BASE_URL}/orders`,
    PRODUCTS: `${API_BASE_URL}/products`,
    SHIPPING: `${API_BASE_URL}/shipping`,
    AUTH: `${API_BASE_URL}/auth`,
    REVIEWS: `${API_BASE_URL}/reviews`,
    CATEGORIES: `${API_BASE_URL}/categories`,
    PANELS: `${API_BASE_URL}/panels`,
    REPORTS: `${API_BASE_URL}/reports`,
    USERS: `${API_BASE_URL}/admin/users`,
    SEARCH: `${API_BASE_URL}/search`,
    NOTIFICATIONS: `${API_BASE_URL}/notifications`,
};

/**
 * Fetch với timeout
 * @param url - URL để fetch
 * @param options - Fetch options
 * @param timeout - Timeout mili giây (default: 10s)
 */
export const fetchWithTimeout = async (
    url: string, 
    options: RequestInit = {}, 
    timeout = 10000
): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(timeoutId);
    }
};

/**
 * Xử lý response API an toàn
 * @param response - Response từ fetch
 * @param allowEmpty - Cho phép trả về empty object nếu response body trống
 */
export const handleApiResponse = async <T>(
    response: Response, 
    allowEmpty = false
): Promise<T> => {
    // Kiểm tra HTTP status
    if (!response.ok) {
        let errorMsg = `HTTP ${response.status}: ${response.statusText}`;
        try {
            const errorBody = await response.json();
            errorMsg = errorBody.message || errorBody.error || errorMsg;
        } catch {
            // Nếu parse JSON lỗi, giữ errorMsg mặc định
        }
        throw new Error(errorMsg);
    }
    
    // Xử lý response body
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
        if (allowEmpty) return {} as T;
        throw new Error('Invalid response content type');
    }
    
    try {
        return await response.json();
    } catch (e) {
        if (allowEmpty) return {} as T;
        throw new Error('Failed to parse response JSON');
    }
};

/**
 * Safe JSON Parse từ localStorage
 */
export const safeJsonParse = <T>(jsonString: string | null, defaultValue: T): T => {
    if (!jsonString) return defaultValue;
    try {
        return JSON.parse(jsonString) as T;
    } catch (e) {
        console.error('JSON parse error:', e);
        return defaultValue;
    }
};
