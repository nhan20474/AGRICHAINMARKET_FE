import React, { useEffect, useState } from 'react';
import { authService } from '../../services/authService';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const ProfilePage: React.FC = () => {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showApplyForm, setShowApplyForm] = useState(false);
    const [applyLoading, setApplyLoading] = useState(false);
    const [applyError, setApplyError] = useState('');
    const [applySuccess, setApplySuccess] = useState('');
    const [applyForm, setApplyForm] = useState({
        farm_address: '',
        business_license_file: null as File | null
    });
    const [uploading, setUploading] = useState(false);
    const navigate = useNavigate();

    // State cho chỉnh sửa thông tin
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        full_name: '',
        phone_number: '',
        address: ''
    });
    const [updateLoading, setUpdateLoading] = useState(false);
    const [updateSuccess, setUpdateSuccess] = useState('');
    const [updateError, setUpdateError] = useState('');

    useEffect(() => {
        // Lấy id từ localStorage user
        const userStr = localStorage.getItem('user');
        let userId: number | null = null;
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                userId = Number(user.id);
            } catch {}
        }
        if (!userId) {
            setError('Không tìm thấy thông tin người dùng.');
            setLoading(false);
            return;
        }
        authService.getProfile(userId)
            .then(data => {
                setProfile(data);
                setEditForm({
                    full_name: data.full_name || '',
                    phone_number: data.phone_number || '',
                    address: data.address || ''
                });
                setLoading(false);
            })
            .catch(() => {
                setError('Không thể tải thông tin cá nhân.');
                setLoading(false);
            });
    }, []);

    const handleApplyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setApplyForm({ ...applyForm, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setApplyForm(f => ({ ...f, business_license_file: file }));
    };

    const handleApplySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setApplyError('');
        setApplySuccess('');
        setApplyLoading(true);
        if (!applyForm.farm_address.trim() || !applyForm.business_license_file) {
            setApplyError('Vui lòng nhập địa chỉ và chọn ảnh giấy phép.');
            setApplyLoading(false);
            return;
        }
        try {
            const userStr = localStorage.getItem('user');
            let userId: number | null = null;
            if (userStr) {
                const user = JSON.parse(userStr);
                userId = Number(user.id);
            }
            const formData = new FormData();
            formData.append('farm_address', applyForm.farm_address);
            formData.append('business_license', applyForm.business_license_file);

            const res = await fetch(`http://localhost:3000/api/profile/${userId}/apply-farmer`, {
                method: 'POST',
                body: formData
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message || 'Nộp đơn thất bại');
            setApplySuccess('Nộp đơn đăng ký farmer thành công!');
            setShowApplyForm(false);
        } catch (err: any) {
            setApplyError(err.message || 'Nộp đơn thất bại');
        }
        setApplyLoading(false);
    };

    // Xử lý cập nhật thông tin cá nhân
    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setEditForm({ ...editForm, [e.target.name]: e.target.value });
    };

    const handleUpdateProfile = async () => {
        setUpdateError('');
        setUpdateSuccess('');
        setUpdateLoading(true);
        try {
            const userStr = localStorage.getItem('user');
            let userId: string | null = null;
            if (userStr) {
                const user = JSON.parse(userStr);
                userId = user.id;
            }
            if (!userId) throw new Error('Không tìm thấy thông tin người dùng');
            // Gọi service cập nhật user
            const result = await authService.updateUser(userId, editForm);
            setProfile((prev: any) => ({
                ...prev,
                full_name: result.full_name,
                phone_number: result.phone_number,
                address: result.address
            }));
            // Cập nhật localStorage
            if (userStr) {
                const user = JSON.parse(userStr);
                user.full_name = result.full_name;
                localStorage.setItem('user', JSON.stringify(user));
            }
            setUpdateSuccess('Cập nhật thông tin thành công!');
            setIsEditing(false);
            setTimeout(() => setUpdateSuccess(''), 3000);
        } catch (err: any) {
            setUpdateError(err.message || 'Cập nhật thất bại');
        }
        setUpdateLoading(false);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditForm({
            full_name: profile.full_name || '',
            phone_number: profile.phone_number || '',
            address: profile.address || ''
        });
        setUpdateError('');
        setUpdateSuccess('');
    };

    // Kiểm tra trạng thái đơn đăng ký farmer
    const isPendingApplication = profile?.farmer_application_status === 'pending';

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '400px',
                fontSize: '16px',
                color: '#666'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '40px', marginBottom: '12px' }}>⏳</div>
                    Đang tải thông tin...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                maxWidth: '420px',
                margin: '60px auto',
                padding: '32px',
                background: '#fff',
                borderRadius: '14px',
                border: '1px solid #eee',
                textAlign: 'center'
            }}>
                <div style={{ fontSize: '48px', marginBottom: '18px' }}>⚠️</div>
                <h2 style={{ color: '#d32f2f', marginBottom: '10px', fontWeight: 600 }}>Có lỗi xảy ra</h2>
                <p style={{ color: '#666' }}>{error}</p>
            </div>
        );
    }

    if (!profile) return null;

    const getRoleBadge = (role: string) => {
        const styles: Record<string, { bg: string; text: string; icon: string }> = {
            consumer: { bg: '#f4f6fb', text: '#1a237e', icon: '👤' },
            farmer: { bg: '#f4fbf6', text: '#1b5e20', icon: '🌾' },
            admin: { bg: '#fdf6f0', text: '#b26a00', icon: '⭐' }
        };
        const config = styles[role] || styles.consumer;
        return (
            <span style={{
                background: config.bg,
                color: config.text,
                padding: '4px 14px',
                borderRadius: '16px',
                fontSize: '13px',
                fontWeight: 500,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
            }}>
                <span>{config.icon}</span>
                {role === 'consumer' ? 'Người tiêu dùng' : role === 'farmer' ? 'Nông dân' : 'Quản trị viên'}
            </span>
        );
    };

    return (
        <div style={{
            maxWidth: '420px',
            margin: '40px auto',
            padding: '0 8px'
        }}>
            {/* Nút Back */}
            <button
                onClick={() => navigate(-1)}
                style={{
                    background: 'none',
                    border: 'none',
                    color: '#1a237e',
                    cursor: 'pointer',
                    fontSize: '15px',
                    fontWeight: 500,
                    marginBottom: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                    padding: 0
                }}
            >
                <ArrowLeft size={18} />
                Quay lại
            </button>

            {/* Profile Card */}
            <div style={{
                background: '#fff',
                borderRadius: '18px',
                border: '1px solid #e5e7eb',
                overflow: 'hidden',
                padding: '32px 28px 24px 28px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
            }}>
                {/* Avatar + Name */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    marginBottom: '18px'
                }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: '#f4f6fb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '38px',
                        marginBottom: '10px'
                    }}>
                        👤
                    </div>
                    <div style={{
                        fontSize: '22px',
                        fontWeight: 700,
                        color: '#222',
                        marginBottom: '6px',
                        textAlign: 'center'
                    }}>
                        {profile.full_name}
                    </div>
                    <div>
                        {getRoleBadge(profile.role)}
                    </div>
                </div>

                {/* Profile Info */}
                <div style={{ marginBottom: '18px' }}>
                    {/* Email */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        marginBottom: '10px'
                    }}>
                        <span style={{ fontSize: '20px' }}>📧</span>
                        <span style={{ color: '#444', fontWeight: 500 }}>{profile.email}</span>
                    </div>
                    {/* Phone */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        marginBottom: '10px'
                    }}>
                        <span style={{ fontSize: '20px' }}>📱</span>
                        <span style={{ color: '#444', fontWeight: 500 }}>{profile.phone_number}</span>
                    </div>
                    {/* Address */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}>
                        <span style={{ fontSize: '20px' }}>📍</span>
                        <span style={{ color: '#444', fontWeight: 500 }}>{profile.address}</span>
                    </div>
                </div>

                {/* Chỉnh sửa thông tin */}
                {!isEditing ? (
                    <div style={{ textAlign: 'center', marginTop: '18px' }}>
                        <button
                            style={{
                                background: '#1a237e',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '7px',
                                padding: '8px 22px',
                                fontWeight: 600,
                                fontSize: '15px',
                                cursor: 'pointer'
                            }}
                            onClick={() => setIsEditing(true)}
                        >
                            ✏️ Chỉnh sửa
                        </button>
                    </div>
                ) : (
                    <form
                        onSubmit={e => { e.preventDefault(); handleUpdateProfile(); }}
                        style={{ marginTop: '10px' }}
                    >
                        <div style={{ marginBottom: '12px' }}>
                            <input
                                type="text"
                                name="full_name"
                                value={editForm.full_name}
                                onChange={handleEditChange}
                                required
                                placeholder="Họ và tên"
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    borderRadius: '6px',
                                    border: '1.2px solid #d1d5db',
                                    fontSize: '15px',
                                    marginBottom: '8px'
                                }}
                            />
                            <input
                                type="text"
                                name="phone_number"
                                value={editForm.phone_number}
                                onChange={handleEditChange}
                                required
                                placeholder="Số điện thoại"
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    borderRadius: '6px',
                                    border: '1.2px solid #d1d5db',
                                    fontSize: '15px',
                                    marginBottom: '8px'
                                }}
                            />
                            <textarea
                                name="address"
                                value={editForm.address}
                                onChange={handleEditChange}
                                required
                                rows={2}
                                placeholder="Địa chỉ"
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    borderRadius: '6px',
                                    border: '1.2px solid #d1d5db',
                                    fontSize: '15px',
                                    resize: 'vertical'
                                }}
                            />
                        </div>
                        {updateError && <div style={{ color: '#d32f2f', marginBottom: '8px', fontWeight: 500 }}>{updateError}</div>}
                        {updateSuccess && <div style={{ color: '#388e3c', marginBottom: '8px', fontWeight: 500 }}>{updateSuccess}</div>}
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button
                                type="button"
                                style={{
                                    background: '#f5f5f5',
                                    color: '#222',
                                    border: 'none',
                                    borderRadius: '7px',
                                    padding: '8px 18px',
                                    fontWeight: 500,
                                    fontSize: '15px',
                                    cursor: 'pointer'
                                }}
                                onClick={handleCancelEdit}
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                disabled={updateLoading}
                                style={{
                                    background: updateLoading ? '#bdbdbd' : '#1a237e',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '7px',
                                    padding: '8px 22px',
                                    fontWeight: 600,
                                    fontSize: '15px',
                                    cursor: updateLoading ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {updateLoading ? '⏳ Lưu...' : 'Lưu'}
                            </button>
                        </div>
                    </form>
                )}

                {/* Pending Application Alert */}
                {isPendingApplication && (
                    <div style={{
                        marginTop: '22px',
                        padding: '12px',
                        background: '#f9fbe7',
                        border: '1px solid #e6ee9c',
                        borderRadius: '10px',
                        color: '#827717',
                        fontSize: '15px',
                        textAlign: 'center'
                    }}>
                        <span style={{ fontSize: '20px', marginRight: 6 }}>⏳</span>
                        Đơn đăng ký farmer của bạn đang chờ xác nhận.
                    </div>
                )}

                {/* Apply Farmer Button */}
                {profile.role === 'consumer' && !isPendingApplication && (
                    <div style={{ marginTop: '28px', textAlign: 'center' }}>
                        <button
                            style={{
                                background: '#1b5e20',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '10px',
                                padding: '12px 28px',
                                fontWeight: 600,
                                fontSize: '15px',
                                cursor: 'pointer'
                            }}
                            onClick={() => setShowApplyForm(v => !v)}
                        >
                            🌾 Đăng ký làm nông dân
                        </button>
                    </div>
                )}

                {/* Change Password Button */}
                <div style={{ marginTop: '18px', textAlign: 'center' }}>
                    <button
                        style={{
                            background: '#fff',
                            color: '#1a237e',
                            border: '1.5px solid #1a237e',
                            borderRadius: '10px',
                            padding: '10px 24px',
                            fontWeight: 600,
                            fontSize: '15px',
                            cursor: 'pointer'
                        }}
                        onClick={() => navigate('/change-password')}
                    >
                        🔐 Đổi mật khẩu
                    </button>
                </div>
            </div>

            {/* Application Form */}
            {showApplyForm && !isPendingApplication && (
                <div style={{
                    marginTop: '24px',
                    background: '#fff',
                    borderRadius: '14px',
                    border: '1px solid #e5e7eb',
                    padding: '28px'
                }}>
                    <form onSubmit={handleApplySubmit}>
                        <h3 style={{
                            fontSize: '17px',
                            fontWeight: 600,
                            marginBottom: '18px',
                            color: '#222',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '7px'
                        }}>
                            <span>📝</span>
                            Đăng ký làm nông dân
                        </h3>

                        {applyError && (
                            <div style={{
                                padding: '10px 14px',
                                background: '#ffebee',
                                border: '1px solid #f44336',
                                borderRadius: '7px',
                                color: '#c62828',
                                marginBottom: '12px',
                                fontSize: '14px'
                            }}>
                                {applyError}
                            </div>
                        )}

                        {applySuccess && (
                            <div style={{
                                padding: '10px 14px',
                                background: '#e8f5e9',
                                border: '1px solid #388e3c',
                                borderRadius: '7px',
                                color: '#2d8f00',
                                marginBottom: '12px',
                                fontSize: '14px'
                            }}>
                                {applySuccess}
                            </div>
                        )}

                        <div style={{ marginBottom: '14px' }}>
                            <input
                                type="text"
                                name="farm_address"
                                value={applyForm.farm_address}
                                onChange={handleApplyChange}
                                required
                                placeholder="Địa chỉ trang trại *"
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    borderRadius: '6px',
                                    border: '1.2px solid #d1d5db',
                                    fontSize: '15px'
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '18px' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: '7px',
                                fontWeight: 500,
                                color: '#333',
                                fontSize: '14px'
                            }}>
                                Ảnh giấy phép kinh doanh *
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                required
                                style={{
                                    width: '100%',
                                    fontSize: '15px'
                                }}
                            />
                            {applyForm.business_license_file && (
                                <div style={{ color: '#388e3c', fontWeight: 500, marginTop: '6px', fontSize: '14px' }}>
                                    ✓ {applyForm.business_license_file.name}
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button
                                type="button"
                                style={{
                                    background: '#f5f5f5',
                                    color: '#222',
                                    border: 'none',
                                    borderRadius: '7px',
                                    padding: '10px 18px',
                                    fontWeight: 500,
                                    fontSize: '15px',
                                    cursor: 'pointer'
                                }}
                                onClick={() => setShowApplyForm(false)}
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                disabled={applyLoading}
                                style={{
                                    background: applyLoading ? '#bdbdbd' : '#1b5e20',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '7px',
                                    padding: '10px 24px',
                                    fontWeight: 600,
                                    fontSize: '15px',
                                    cursor: applyLoading ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {applyLoading ? '⏳ Đang gửi...' : '✓ Nộp đơn'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Fixed Notification */}
            {(applySuccess || applyError) && (
                <div style={{
                    position: 'fixed',
                    bottom: '24px',
                    right: '24px',
                    background: applySuccess ? '#388e3c' : '#d32f2f',
                    color: '#fff',
                    padding: '12px 20px',
                    borderRadius: '7px',
                    fontWeight: 500,
                    fontSize: '15px',
                    zIndex: 1000
                }}>
                    {applySuccess || applyError}
                </div>
            )}
        </div>
    );
};

export default ProfilePage;
