interface LoginRequest {
  email: string;
  password: string;
  role?: string;
}

interface RegisterRequest {
  full_name: string;
  email: string;
  phone_number: string;
  password: string;
  role: string;
  address?: string;
  farm_name?: string;
}

interface AuthResponse {
  success: boolean;
  token?: string;
  user?: {
    id: number;
    email: string;
    role: string;
    full_name?: string;
    is_locked?: boolean;
  };
  message?: string;
}

import { API_CONFIG, fetchWithTimeout } from '../config/apiConfig';
import { safeSetJSON, safeGetJSON, safeSetItem, safeGetItem, safeRemoveItem } from '../utils/storageUtils';

export const authService = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await fetchWithTimeout(`${API_CONFIG.AUTH}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || result.error || 'Đăng nhập thất bại');
      }

      return result;
    } catch (error) {
      if (import.meta.env.DEV && error instanceof Error) {
        console.error('Login error:', error.message);
      }
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Không thể kết nối đến máy chủ');
    }
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await fetchWithTimeout(`${API_CONFIG.AUTH}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        if (import.meta.env.DEV) {
          console.error('Failed to parse register response');
        }
        throw new Error('Server trả về dữ liệu không hợp lệ');
      }

      if (!response.ok) {
        // Xử lý các loại lỗi cụ thể
        if (response.status === 400) {
          throw new Error(result.message || 'Dữ liệu không hợp lệ');
        } else if (response.status === 409) {
          throw new Error('Email đã được sử dụng');
        } else if (response.status === 500) {
          throw new Error('Lỗi server. Vui lòng thử lại sau');
        } else {
          throw new Error(result.message || 'Đăng ký thất bại');
        }
      }

      return result;
    } catch (error) {
      if (import.meta.env.DEV && error instanceof Error) {
        console.error('Register error:', error.message);
      }
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
    }
  },

  async getProfile(id: number): Promise<any> {
    try {
      const response = await fetchWithTimeout(`${API_CONFIG.BASE_URL}/profile/${id}`);
      if (!response.ok) throw new Error('Không thể lấy thông tin người dùng');
      return await response.json();
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  },

  changePassword: async (userId: number, oldPassword: string, newPassword: string) => {
    try {
      const response = await fetchWithTimeout(`${API_CONFIG.AUTH}/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          old_password: oldPassword,
          new_password: newPassword
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Đổi mật khẩu thất bại');
      }

      return response.json();
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  },

  forgotPassword: async (email: string) => {
    try {
      const response = await fetchWithTimeout(`${API_CONFIG.AUTH}/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Gửi yêu cầu thất bại');
      }

      return result;
    } catch (error) {
      console.error('Forgot password error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Không thể kết nối đến máy chủ');
    }
  },

  // ✅ THÊM LẠI hàm resetPassword
  resetPassword: async (token: string, newPassword: string) => {
    try {
      const response = await fetchWithTimeout(`${API_CONFIG.AUTH}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          token, 
          new_password: newPassword 
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Đặt lại mật khẩu thất bại');
      }

      return result;
    } catch (error) {
      console.error('Reset password error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Không thể kết nối đến máy chủ');
    }
  },

  /**
   * Cập nhật thông tin cá nhân
   * @param id ID người dùng
   * @param data Thông tin cập nhật: { full_name, phone_number, address }
   */
  async updateUser(id: string, data: { full_name: string; phone_number: string; address: string }): Promise<any> {
    try {
      const response = await fetchWithTimeout(`${API_CONFIG.BASE_URL}/profile/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || result.message || 'Cập nhật thông tin thất bại');
      }
      return result;
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  },
};
