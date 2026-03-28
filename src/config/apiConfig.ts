/**
 * API Configuration
 * Quản lý tập trung tất cả API URLs
 */

/** Socket.IO nhận origin dạng http(s):// — không dùng ws(s)://; thư viện tự chọn polling/WebSocket. */
function normalizeSocketUrl(raw: string | undefined): string {
    let u = (raw ?? '').trim();
    if (!u) return 'http://localhost:3000';
    if (u.startsWith('wss://')) u = `https://${u.slice(6)}`;
    else if (u.startsWith('ws://')) u = `http://${u.slice(5)}`;
    return u.replace(/\/+$/, '');
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const SOCKET_URL = normalizeSocketUrl(import.meta.env.VITE_SOCKET_URL);
const UPLOAD_URL = import.meta.env.VITE_UPLOAD_URL || 'http://localhost:3000/api/upload';

/** Origin không có /api — dùng ghép URL ảnh /uploads */
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '') || 'http://localhost:3000';

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
    CART: `${API_BASE_URL}/cart`,
    PAYMENTS: `${API_BASE_URL}/payments`,
};

/**
 * Tùy chọn Socket.IO client — path mặc định /socket.io/ (khớp Nginx proxy),
 * ưu tiên WebSocket rồi polling (ổn định sau reverse proxy).
 */
export const SOCKET_IO_OPTIONS = {
    path: '/socket.io/',
    transports: ['websocket', 'polling'] as string[],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
    timeout: 20000,
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
