import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import '../../styles/Login.css';

interface LoginForm {
  email: string;
  password: string;
}

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState<LoginForm>({
    email: '',
    password: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const loginPayload: any = {
        email: formData.email,
        password: formData.password,
      };
      // Nếu backend yêu cầu role, truyền thêm
      // loginPayload.role = formData.role || '';

      const response = await authService.login(loginPayload);

      const isSuccess =
        (response.token && response.user) ||
        (response.message && response.message.toLowerCase().includes('thanh cong'));

      if (isSuccess) {
        localStorage.setItem('token', response.token ?? '');
        if (response.user) {
          localStorage.setItem('user', JSON.stringify(response.user));
        }
        await login(
          response.user?.email || formData.email,
          formData.password,
          response.user?.role || ''
        );

        setShowSnackbar(true);

        // Điều hướng theo role sau khi hiện snackbar
        setTimeout(() => {
          setShowSnackbar(false);
          const role = response.user?.role;
          if (role === 'admin') {
            navigate('/admin/dashboard', { replace: true });
          } else if (role === 'farmer') {
            navigate('/farmer/products', { replace: true });
          } else {
            navigate('/shop', { replace: true });
          }
        }, 1500);
      } else {
        setError(response.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';
      setError(errorMessage);
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <>
      <div className="login-container">
        {/* Khu vực trái - Logo và mô tả */}
        <div className="login-left">
          <div className="brand-box">
            <img src="/images/logo-agrichain.png" alt="AgriChain Market" className="brand-logo" />
            <h1 className="brand-title">AgriChain Market</h1>
            <p className="brand-subtitle">Kết nối công nghệ & nông nghiệp thông minh</p>
          </div>
        </div>

        {/* Khu vực phải - Form đăng nhập */}
        <div className="login-right">
          <div className="login-card">
            <h2>Đăng nhập tài khoản</h2>
            <p className="welcome-text">Chào mừng bạn trở lại!</p>

            {error && <div className="alert-error">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="example@email.com"
                  required
                />
              </div>

              <div className="form-group">
                <label>Mật khẩu</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="form-options">
                <label className="checkbox">
                  <input type="checkbox" /> Ghi nhớ đăng nhập
                </label>
                {/* ✅ THÊM link Quên mật khẩu */}
                <a href="/forgot-password" className="forgot-link">
                  Quên mật khẩu?
                </a>
              </div>

              <button type="submit" className="btn-login" disabled={loading}>
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </button>

              <div className="divider">
                <span>Hoặc đăng nhập bằng</span>
              </div>

              <div className="social-buttons">
                <button type="button" className="btn-social google">
                  <img src="/icons/google.svg" alt="Google" /> Google
                </button>
                <button type="button" className="btn-social facebook">
                  <img src="/icons/facebook.svg" alt="Facebook" /> Facebook
                </button>
              </div>

              <p className="register-text">
                Chưa có tài khoản? <a href="/register">Đăng ký ngay</a>
              </p>
            </form>
          </div>
        </div>
      </div>

      {/* Thông báo hiệu ứng dưới màn hình, nằm ngoài login-container */}
      {showSnackbar && (
        <div className="notify-bottom show">
          <span className="notify-icon">✔</span>
          <span className="notify-text">Đăng nhập thành công!</span>
        </div>
      )}
    </>
  );
}

// Thêm vào Login.css:
/*
.notify-bottom {
  position: fixed;
  left: 50%;
  bottom: 24px;
  transform: translateX(-50%) translateY(100px);
  background: #38b000;
  color: #fff;
  padding: 12px 32px;
  border-radius: 24px;
  font-size: 16px;
  font-weight: 500;
  z-index: 9999;
  box-shadow: 0 4px 16px rgba(0,0,0,0.18);
  display: flex;
  align-items: center;
  gap: 8px;
  opacity: 0;
  pointer-events: none;
  transition: all 0.4s cubic-bezier(.4,0,.2,1);
}
.notify-bottom.show {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
  pointer-events: auto;
}
.notify-icon {
  font-size: 20px;
  font-weight: bold;
}
.notify-text {
  font-size: 16px;
}
*/
