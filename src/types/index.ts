/**
 * Shared TypeScript Interfaces
 * Tránh dùng `any` type
 */

// ==================== AUTH ====================
export interface AuthUser {
    id: number;
    email: string;
    full_name: string;
    role: 'customer' | 'farmer' | 'admin';
    avatar?: string;
}

export interface AuthResponse {
    success: boolean;
    message?: string;
    user?: AuthUser;
    token?: string;
    error?: string;
}

// ==================== PRODUCT ====================
export interface Product {
    id: number;
    name: string;
    description?: string;
    price: number;
    quantity: number;
    image_url?: string;
    category_id?: number;
    seller_id: number;
    status: 'available' | 'out_of_stock' | 'deleted';
    created_at?: string;
    updated_at?: string;
}

export interface ProductDetail extends Product {
    images?: Array<{
        id: number;
        image_url: string;
    }>;
    seller?: {
        id: number;
        name: string;
        email: string;
    };
}

// ==================== ORDER ====================
export interface OrderItem {
    product_id: number;
    name: string;
    quantity: number;
    price_per_item: number;
    image_url?: string;
}

export interface Order {
    id: number;
    created_at: string;
    total_amount: number;
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'received' | 'cancelled';
    shipping_address?: string;
    items: OrderItem[];
}

export interface OrderResponse {
    success: boolean;
    data?: Order[];
    message?: string;
    error?: string;
}

// ==================== REVIEW ====================
export interface Review {
    id: number;
    product_id: number;
    user_id: number;
    order_id?: number;
    rating: number;
    comment?: string;
    created_at?: string;
}

export interface ReviewRequest {
    order_id: number;
    product_id: number;
    user_id: number;
    rating: number;
    comment?: string;
}

// ==================== SHIPPING ====================
export interface ShippingInfo {
    id: number;
    order_id: number;
    status: string;
    address: string;
    shipping_company?: string;
    tracking_number?: string;
    estimated_delivery?: string;
}

// ==================== CATEGORY ====================
export interface Category {
    id: number;
    name: string;
    description?: string;
}

// ==================== PANEL ====================
export interface Panel {
    id: number;
    name: string;
    description?: string;
    page: string;
    content?: any;
    images?: Array<{
        id: number;
        image_url: string;
    }>;
}

// ==================== REPORT ====================
export interface ReportStats {
    total_revenue: number;
    total_orders: number;
    pending_orders: number;
    completed_orders: number;
    cancelled_orders?: number;
}

export interface TrendData {
    date: string;
    revenue: number;
    orders: number;
}

// ==================== API RESPONSES ====================
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
    total?: number;
}

export interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    pagination?: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
    message?: string;
    error?: string;
}

// ==================== NOTIFICATION ====================
export interface Notification {
    id: number;
    user_id: number;
    type: 'order' | 'system' | 'message';
    title: string;
    message: string;
    read: boolean;
    created_at: string;
}
