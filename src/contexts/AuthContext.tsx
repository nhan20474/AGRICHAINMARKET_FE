import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'farmer' | 'consumer' | 'admin';
  is_locked?: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Helper: Parse user từ localStorage
  const getUserFromStorage = () => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        return {
          id: parsedUser.id,
          email: parsedUser.email,
          fullName: parsedUser.full_name || parsedUser.fullName,
          role: parsedUser.role,
          is_locked: parsedUser.is_locked || false
        } as User;
      } catch (error) {
        console.error('Error parsing stored user:', error);
        return null;
      }
    }
    return null;
  };

  // 1. Khôi phục user khi App khởi động
  useEffect(() => {
    const userData = getUserFromStorage();
    if (userData && localStorage.getItem('token')) {
      setUser(userData);
    }
  }, []);

  // 2. [QUAN TRỌNG] Kiểm tra trạng thái tài khoản ĐỊNH KỲ
  useEffect(() => {
    const verifyUserStatus = async () => {
      const token = localStorage.getItem('token');
      const currentUser = getUserFromStorage();

      if (!token || !currentUser) return;

      try {
        // Gọi API lấy thông tin mới nhất của user (Dựa vào ID trong localStorage)
        // Lưu ý: Đảm bảo Backend có API này: /api/profile/:id hoặc /api/users/:id
        const response = await fetch(`http://localhost:3000/api/profile/${currentUser.id}`, {
          headers: { 
            'Authorization': token, // Backend cần check token này
            'Content-Type': 'application/json' 
          }
        });

        if (response.ok) {
          const data = await response.json();
          // Kiểm tra cờ is_locked từ dữ liệu mới nhất
          // API getProfile thường trả về { success: true, data: { ...user } } hoặc trực tiếp user
          const latestUser = data.user || data.data || data; 

          if (latestUser.is_locked) {
            console.log("⛔ Phát hiện tài khoản bị khóa -> Đăng xuất!");
            alert('Tài khoản của bạn đã bị khóa bởi quản trị viên.');
            logout();
          }
        } else if (response.status === 401 || response.status === 403) {
          // Token hết hạn hoặc không hợp lệ
          logout();
        }
      } catch (error) {
        // Lỗi mạng thì bỏ qua, chờ lần check sau
        // console.error('Background check error:', error);
      }
    };

    // Chạy ngay lập tức khi mount
    verifyUserStatus();

    // Thiết lập Interval: Chạy lại mỗi 10 giây (10000ms)
    const intervalId = setInterval(() => {
        verifyUserStatus();
    }, 10000);

    // Dọn dẹp interval khi component unmount
    return () => clearInterval(intervalId);
  }, []); // Empty dependency array: Chỉ chạy khi mount App, nhưng setInterval sẽ duy trì nó

  const login = async (email: string, password: string, role: string) => {
    const userData = getUserFromStorage();
    if (userData) {
      setUser(userData);
    } else {
      setUser(null);
    }
  };

const logout = () => {
    setUser(null);
    
    // 1. Xóa thông tin đăng nhập
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('buyerId'); // Xóa luôn ID người mua (để fix lỗi shipping)

    // 2. Xóa giỏ hàng của người dùng cũ
    localStorage.removeItem('cart'); 
    // Nếu bạn lưu giỏ hàng với tên khác (VD: 'cartItems'), hãy sửa lại cho đúng tên key

    // 3. Cập nhật UI ngay lập tức (để số trên Header về 0)
    window.dispatchEvent(new Event('cart-updated'));

    // 4. Chuyển hướng
    window.location.href = '/'; 
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        login, 
        logout, 
        isAuthenticated: !!user 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}