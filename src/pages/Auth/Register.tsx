import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import '../../styles/Register.css';

type UserRole = 'farmer' | 'consumer';

interface RegisterForm {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
  address?: string;
  farmName?: string;
}

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<RegisterForm>({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'consumer',
    address: '' // Thêm giá trị mặc định
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const validateEmail = (email: string) => {
    // Email không chứa khoảng trắng, đúng định dạng, không ký tự đặc biệt ngoài @ và .
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim());
  };

  const validatePhone = (phone: string) => {
    // Số điện thoại bắt đầu bằng 0, có 10 hoặc 11 số, không ký tự đặc biệt
    return /^0\d{9,10}$/.test(phone.trim());
  };

  const validateFullName = (name: string) => {
    // Họ tên chỉ chứa chữ cái và khoảng trắng, không số, không ký tự đặc biệt
    return /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸỳỵỷỹ\s]+$/.test(name.trim());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setShowModal(false);

    // Validation
    if (!formData.fullName.trim()) {
      setError('Vui lòng nhập họ và tên');
      return;
    }

    if (!formData.phone.trim()) {
      setError('Vui lòng nhập số điện thoại');
      return;
    }

    if (!validatePhone(formData.phone.trim())) {
      setError('Số điện thoại phải bắt đầu bằng số 0, gồm 10 hoặc 11 số và không chứa ký tự đặc biệt');
      return;
    }

    if (!formData.email.trim()) {
      setError('Vui lòng nhập email');
      return;
    }

    if (!validateEmail(formData.email.trim())) {
      setError('Email không hợp lệ. Vui lòng nhập đúng định dạng, không chứa khoảng trắng hoặc ký tự đặc biệt');
      return;
    }

    if (!formData.address?.trim()) {
      setError('Vui lòng nhập địa chỉ');
      return;
    }

    if (formData.role === 'farmer' && !formData.farmName?.trim()) {
      setError('Vui lòng nhập tên trang trại/hợp tác xã');
      return;
    }

    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (!validateFullName(formData.fullName.trim())) {
      setError('Họ và tên không hợp lệ. Vui lòng chỉ nhập chữ cái và khoảng trắng.');
      return;
    }

    setLoading(true);

    try {
      const registerData: any = {
        full_name: formData.fullName.trim(),
        email: formData.email.trim(),
        phone_number: formData.phone.trim(),
        password: formData.password,
        role: formData.role,
        address: formData.address.trim()
      };

      if (formData.role === 'farmer') {
        registerData.farm_name = formData.farmName ? formData.farmName.trim() : '';
      }

      const response = await authService.register(registerData);

      // Xử lý thành công dựa trên status hoặc message
      const isSuccess =
        response.success === true ||
        response.user || // Nếu có user thì là thành công
        (response.message && (
          response.message.toLowerCase().includes('thành công') ||
          response.message.toLowerCase().includes('thanh cong')
        ));

      if (isSuccess) {
        setError(''); // Clear error trước
        setSuccess('Đăng ký thành công!');
        setShowModal(true); // Hiện modal xác nhận đăng nhập
      } else {
        // Nếu có lỗi email đã tồn tại
        if (
          response.message &&
          (
            response.message.toLowerCase().includes('email đã được sử dụng') ||
            response.message.toLowerCase().includes('email đã tồn tại') ||
            (response.message.toLowerCase().includes('email') && response.message.toLowerCase().includes('tồn tại'))
          )
        ) {
          setError('Email đã được đăng ký. Vui lòng sử dụng email khác.');
        } else if (response.message) {
          setError(response.message); // Hiển thị đúng thông báo từ backend
        } else {
          setError('Đăng ký thất bại. Vui lòng thử lại.');
        }
        setSuccess('');
      }
    } catch (err: any) {
      console.error('❌ Register error:', err);
      
      // Kiểm tra xem error message có chứa "thành công" không
      const errorMsg = err.message || err.toString() || '';
      const isSuccessMessage = errorMsg.toLowerCase().includes('thành công') || 
                               errorMsg.toLowerCase().includes('thanh cong');
      
      if (isSuccessMessage) {
        // Nếu message có "thành công" thì coi như đăng ký thành công
        setError(''); // Clear error
        setSuccess('Đăng ký thành công!');
        setShowModal(true); // Hiện modal
      } else {
        setSuccess(''); // Clear success message
        if (
          errorMsg &&
          (
            errorMsg.toLowerCase().includes('email đã được sử dụng') ||
            errorMsg.toLowerCase().includes('email đã tồn tại') ||
            errorMsg.toLowerCase().includes('email') && errorMsg.toLowerCase().includes('tồn tại')
          )
        ) {
          setError('Email đã được đăng ký. Vui lòng sử dụng email khác.');
        } else if (errorMsg) {
          setError(errorMsg); // Hiển thị đúng thông báo từ backend
        } else {
          setError('Đăng ký thất bại. Vui lòng thử lại.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="register-page">
      {/* Left Panel - Brand Section */}
      <div className="register-left">
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

      {/* Right Panel - Register Form */}
      <div className="register-right">
        <div className="register-container">
          <div className="register-header">
            <h2>Tạo tài khoản mới</h2>
            <p>Bắt đầu hành trình của bạn với chúng tôi</p>
          </div>

          {error && (
            <div className="alert alert-error">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
              </svg>
              <span>{error}</span>
            </div>
          )}

          {success && !showModal && (
            <div className="alert alert-success">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              <span>{success}</span>
            </div>
          )}

          {/* Modal xác nhận đăng nhập */}
          {showModal && (
            <div className="modal-overlay">
              <div className="modal-box">
                <div className="modal-icon">
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                    <circle cx="24" cy="24" r="24" fill="#10b981" fillOpacity="0.1"/>
                    <path d="M16 24L22 30L32 18" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3>Đăng ký thành công!</h3>
                <p>Bạn có muốn đăng nhập ngay không?</p>
                <div className="modal-actions">
                  <button
                    className="btn-primary"
                    onClick={() => {
                      setShowModal(false);
                      navigate('/login');
                    }}
                  >
                    Đăng nhập ngay
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Để sau
                  </button>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="register-form">
            <div className="form-group">
              <label>Loại tài khoản</label>
              <div className="select-wrapper">
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                >
                  <option value="consumer">Người tiêu dùng</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Họ và tên</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Nguyễn Văn A"
                  required
                />
              </div>

              <div className="form-group">
                <label>Số điện thoại</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="0123456789"
                  required
                />
              </div>
            </div>

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
              <label>Địa chỉ</label>
              <input
                type="text"
                name="address"
                value={formData.address || ''}
                onChange={handleChange}
                placeholder={formData.role === 'farmer' ? 'Địa chỉ trang trại' : 'Số nhà, đường, quận/huyện, tỉnh/thành'}
                required
              />
            </div>

            {formData.role === 'farmer' && (
              <div className="form-group">
                <label>Tên trang trại / Hợp tác xã</label>
                <input
                  type="text"
                  name="farmName"
                  value={formData.farmName || ''}
                  onChange={handleChange}
                  placeholder="VD: Trang trại XYZ"
                />
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label>Mật khẩu</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  placeholder="••••••••"
                />
              </div>

              <div className="form-group">
                <label>Xác nhận mật khẩu</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  minLength={6}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <label className="checkbox-wrapper">
              <input type="checkbox" required />
              <span className="checkbox-label">
                Tôi đồng ý với <a href="/terms">Điều khoản dịch vụ</a> và <a href="/privacy">Chính sách bảo mật</a>
              </span>
            </label>

            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Đang xử lý...
                </>
              ) : (
                'Tạo tài khoản'
              )}
            </button>
          </form>

          <div className="register-footer">
            <p>Đã có tài khoản? <a href="/login">Đăng nhập ngay</a></p>
          </div>
        </div>
      </div>
    </div>
  );
}
