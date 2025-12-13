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

      console.log('📤 Sending register data:', registerData);

      const response = await authService.register(registerData);

      console.log('📥 Register response:', response);

      // Xử lý thành công dựa trên status hoặc message
      const isSuccess =
        response.success === true ||
        (response.message && response.message.toLowerCase().includes('thành công'));

      if (isSuccess) {
        setSuccess('Đăng ký thành công!');
        setShowModal(true); // Hiện modal xác nhận đăng nhập
        setError('');
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
      if (
        err.message &&
        (
          err.message.toLowerCase().includes('email đã được sử dụng') ||
          err.message.toLowerCase().includes('email đã tồn tại') ||
          err.message.toLowerCase().includes('email') && err.message.toLowerCase().includes('tồn tại')
        )
      ) {
        setError('Email đã được đăng ký. Vui lòng sử dụng email khác.');
      } else if (err.message) {
        setError(err.message); // Hiển thị đúng thông báo từ backend
      } else {
        setError('Đăng ký thất bại. Vui lòng thử lại.');
      }
      console.error('❌ Register error:', err);
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
      <div className="register-card">
        <div className="register-header">
          <h1>Agrichain Market</h1>
          <p>Đăng ký tài khoản để tham gia hệ thống nông sản thông minh</p>
        </div>

        {error && (
          <div className="alert-error">
            ⚠️ {error}
          </div>
        )}
        {/* Chỉ hiển thị thông báo thành công khi modal chưa mở */}
        {success && !showModal && (
          <div className="alert-success">
            {success}
          </div>
        )}

        {/* Modal xác nhận đăng nhập */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal-box">
              <h3>Đăng ký thành công!</h3>
              <p>Bạn có muốn đăng nhập ngay không?</p>
              <div className="modal-actions">
                <button
                  className="btn-login-modal"
                  onClick={() => {
                    setShowModal(false);
                    navigate('/login');
                  }}
                >
                  Đăng nhập ngay
                </button>
                <button
                  className="btn-cancel-modal"
                  onClick={() => setShowModal(false)}
                >
                  Để sau
                </button>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Loại tài khoản *</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="consumer">Người tiêu dùng</option>
            
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Họ và tên *</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Số điện thoại *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Địa chỉ *</label>
            <input
              type="text"
              name="address"
              value={formData.address || ''}
              onChange={handleChange}
              placeholder={formData.role === 'farmer' ? 'Địa chỉ trang trại' : 'Địa chỉ của bạn'}
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
              <label>Mật khẩu *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                placeholder="Tối thiểu 6 ký tự"
              />
            </div>

            <div className="form-group">
              <label>Xác nhận mật khẩu *</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                minLength={6}
                placeholder="Nhập lại mật khẩu"
              />
            </div>
          </div>

          <label className="checkbox">
            <input type="checkbox" required />
            Tôi đồng ý với{' '}
            <a href="/terms">Điều khoản</a> và{' '}
            <a href="/privacy">Chính sách bảo mật</a>
          </label>

          <button type="submit" disabled={loading}>
            {loading ? 'Đang xử lý...' : 'Đăng ký ngay'}
          </button>
        </form>

        <div className="register-footer">
          Đã có tài khoản? <a href="/login">Đăng nhập</a>
        </div>
      </div>
    </div>
  );
}

// Thêm CSS vào Register.css:
/*
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}
.modal-box {
  background: #fff;
  padding: 24px 32px;
  border-radius: 8px;
  box-shadow: 0 2px 16px rgba(0,0,0,0.15);
  text-align: center;
}
.modal-actions {
  margin-top: 18px;
  display: flex;
  gap: 12px;
  justify-content: center;
}
.btn-login-modal {
  background: #228B22;
  color: #fff;
  border: none;
  padding: 8px 18px;
  border-radius: 4px;
  cursor: pointer;
}
.btn-cancel-modal {
  background: #eee;
  color: #333;
  border: none;
  padding: 8px 18px;
  border-radius: 4px;
  cursor: pointer;
}
*/
