import React, { useState } from 'react';
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
      const loginPayload = {
        email: formData.email,
        password: formData.password,
      };

      const response = await authService.login(loginPayload);

      // --- [MỚI] KIỂM TRA KHÓA TÀI KHOẢN ---
      if (response.user && response.user.is_locked) {
          setError('⛔ Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Quản trị viên.');
          setLoading(false);
          return;
      }
      // -------------------------------------

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
    } catch (err: any) {
      console.error('Login error:', err);
      
      // --- [MỚI] BẮT LỖI KHÓA TỪ BACKEND (NẾU CÓ) ---
      const errorMsg = err.response?.data?.message || err.message || '';
      
      if (errorMsg.toLowerCase().includes('khóa') || errorMsg.toLowerCase().includes('locked')) {
          setError('⛔ Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin.');
      } else {
          // Fallback lỗi chung như cũ
          setError(errorMsg !== '' ? errorMsg : 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
      }
      // ----------------------------------------------
      
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
        {/* Left Panel - Brand Section */}
        <div className="login-left">
          <div className="brand-content">
            <div className="logo-circle">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h1 className="brand-name">AgriChain</h1>
            <p className="brand-slogan">Kết nối nông sản - Xây dựng niềm tin</p>
            <div className="decorative-circles">
              <div className="circle circle-1"></div>
              <div className="circle circle-2"></div>
              <div className="circle circle-3"></div>
            </div>
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="login-right">
          <div className="login-card">
            <div className="login-header">
              <h2>Chào mừng trở lại</h2>
              <p>Đăng nhập để tiếp tục</p>
            </div>

            {error && (
              <div className="alert alert-error">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                </svg>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-form">
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
                <label className="checkbox-wrapper">
                  <input type="checkbox" />
                  <span className="checkbox-label">Ghi nhớ đăng nhập</span>
                </label>
                <a href="/forgot-password" className="forgot-link">
                  Quên mật khẩu?
                </a>
              </div>

              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Đang kiểm tra...
                  </>
                ) : (
                  'Đăng nhập'
                )}
              </button>

              <div className="divider">
                <span>Hoặc đăng nhập bằng</span>
              </div>

              <div className="social-buttons">
                <button type="button" className="btn-social">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.2 0C4.6 0 0 4.4 0 10c0 4.4 2.9 8.2 6.8 9.5.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.3-3.4-1.3-.5-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.6.3-1.1.6-1.3-2.2-.3-4.6-1.1-4.6-4.9 0-1.1.4-2 1-2.7-.1-.2-.4-1.2.1-2.5 0 0 .8-.3 2.7 1 .8-.2 1.6-.3 2.5-.3.8 0 1.7.1 2.5.3 1.9-1.3 2.7-1 2.7-1 .5 1.3.2 2.3.1 2.5.6.7 1 1.6 1 2.7 0 3.8-2.3 4.7-4.6 4.9.4.3.7.9.7 1.9v2.8c0 .3.2.6.7.5 4-1.3 6.8-5.1 6.8-9.5 0-5.6-4.6-10-10.2-10z"/>
                  </svg>
                  <span>GitHub</span>
                </button>
                <button type="button" className="btn-social">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="#4285F4">
                    <path d="M19.6 10.2c0-.7-.1-1.4-.2-2H10v3.8h5.4c-.2 1.2-1 2.2-2 2.9v2.5h3.2c1.9-1.7 3-4.3 3-7.2z"/>
                    <path fill="#34A853" d="M10 20c2.7 0 4.9-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H1v2.6C2.7 17.9 6.1 20 10 20z"/>
                    <path fill="#FBBC05" d="M4.4 12c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V5.4H1C.4 6.6 0 8.3 0 10s.4 3.4 1 4.6l3.4-2.6z"/>
                    <path fill="#EA4335" d="M10 4c1.5 0 2.8.5 3.8 1.5l2.9-2.9C14.9 1 12.7 0 10 0 6.1 0 2.7 2.1 1 5.4l3.4 2.6C5.2 5.8 7.4 4 10 4z"/>
                  </svg>
                  <span>Google</span>
                </button>
              </div>

              <div className="login-footer">
                <p>Chưa có tài khoản? <a href="/register">Đăng ký ngay</a></p>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Success notification */}
      {showSnackbar && (
        <div className="notification-success">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill="#10b981"/>
            <path d="M8 12L11 15L16 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Đăng nhập thành công!</span>
        </div>
      )}
    </>
  );
}