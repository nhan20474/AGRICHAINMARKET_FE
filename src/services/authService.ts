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

const API_BASE_URL = 'http://localhost:3000/api';

export const authService = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      console.log('Login request:', data);
      
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      console.log('Login response:', result);

      if (!response.ok) {
        throw new Error(result.message || result.error || 'Đăng nhập thất bại');
      }

      return result;
    } catch (error) {
      console.error('Login error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Không thể kết nối đến máy chủ');
    }
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      console.log('🚀 API Request URL:', `${API_BASE_URL}/auth/register`);
      console.log('📦 Request Data:', JSON.stringify(data, null, 2));
      
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      console.log('📊 Response Status:', response.status);
      
      let result;
      try {
        result = await response.json();
        console.log('📄 Response Data:', JSON.stringify(result, null, 2));
      } catch (parseError) {
        console.error('❌ Failed to parse response:', parseError);
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
      console.error('💥 Register error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
    }
  },

  async getProfile(id: number): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/profile/${id}`);
      if (!response.ok) throw new Error('Không thể lấy thông tin người dùng');
      return await response.json();
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  },

  changePassword: async (userId: number, oldPassword: string, newPassword: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
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
  },

  forgotPassword: async (email: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
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
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
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
      const response = await fetch(`${API_BASE_URL}/profile/${id}`, {
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
