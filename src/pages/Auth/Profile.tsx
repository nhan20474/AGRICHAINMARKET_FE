import React, { useEffect, useState } from 'react';
import { authService } from '../../services/authService';
import { uploadService } from '../../services/uploadService';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react'; // ✅ THÊM icon

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
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
                    Đang tải thông tin...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                maxWidth: '600px',
                margin: '60px auto',
                padding: '40px',
                background: '#fff',
                borderRadius: '12px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                textAlign: 'center'
            }}>
                <div style={{ fontSize: '64px', marginBottom: '24px' }}>⚠️</div>
                <h2 style={{ color: '#f44336', marginBottom: '16px' }}>Có lỗi xảy ra</h2>
                <p style={{ color: '#666' }}>{error}</p>
            </div>
        );
    }

    if (!profile) return null;

    const getRoleBadge = (role: string) => {
        const styles: Record<string, { bg: string; text: string; icon: string }> = {
            consumer: { bg: '#e3f2fd', text: '#1976d2', icon: '👤' },
            farmer: { bg: '#e8f5e9', text: '#388e3c', icon: '🌾' },
            admin: { bg: '#fff3e0', text: '#f57c00', icon: '⭐' }
        };
        const config = styles[role] || styles.consumer;
        return (
            <span style={{
                background: config.bg,
                color: config.text,
                padding: '6px 16px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '600',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
            }}>
                <span>{config.icon}</span>
                {role === 'consumer' ? 'Người tiêu dùng' : role === 'farmer' ? 'Nông dân' : 'Quản trị viên'}
            </span>
        );
    };

    return (
        <div style={{
            maxWidth: '800px',
            margin: '32px auto',
            padding: '24px'
        }}>
            {/* ✅ THÊM: Nút Back */}
            <button
                onClick={() => navigate(-1)}
                style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#667eea',
                    cursor: 'pointer',
                    fontSize: '15px',
                    fontWeight: '600',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 0',
                    transition: 'all 0.3s'
                }}
                onMouseOver={(e) => e.currentTarget.style.color = '#764ba2'}
                onMouseOut={(e) => e.currentTarget.style.color = '#667eea'}
            >
                <ArrowLeft size={20} />
                Quay lại
            </button>

            {/* Profile Card */}
            <div style={{
                background: '#fff',
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                overflow: 'hidden'
            }}>
                {/* Header with gradient */}
                <div style={{
                    background: 'linear-gradient(135deg, #38b000 0%, #2d8f00 100%)',
                    padding: '32px',
                    color: '#fff',
                    position: 'relative'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '20px',
                        flexWrap: 'wrap'
                    }}>
                        {/* Avatar */}
                        <div style={{
                            width: '100px',
                            height: '100px',
                            borderRadius: '50%',
                            background: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '48px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                        }}>
                            👤
                        </div>
                        <div style={{ flex: 1 }}>
                            <h1 style={{
                                margin: 0,
                                fontSize: '28px',
                                fontWeight: '700',
                                marginBottom: '8px'
                            }}>
                                {profile.full_name}
                            </h1>
                            <div style={{ marginTop: '12px' }}>
                                {getRoleBadge(profile.role)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Profile Info */}
                <div style={{ padding: '32px' }}>
                    <h3 style={{
                        fontSize: '18px',
                        fontWeight: '600',
                        color: '#333',
                        marginBottom: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        📋 Thông tin cá nhân
                    </h3>

                    <div style={{
                        display: 'grid',
                        gap: '20px'
                    }}>
                        {/* Email */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '16px',
                            padding: '16px',
                            background: '#f8f9fa',
                            borderRadius: '12px'
                        }}>
                            <div style={{
                                fontSize: '24px',
                                minWidth: '32px',
                                textAlign: 'center'
                            }}>📧</div>
                            <div style={{ flex: 1 }}>
                                <div style={{
                                    fontSize: '12px',
                                    color: '#666',
                                    fontWeight: '500',
                                    marginBottom: '4px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>
                                    Email
                                </div>
                                <div style={{
                                    fontSize: '15px',
                                    color: '#333',
                                    fontWeight: '500'
                                }}>
                                    {profile.email}
                                </div>
                            </div>
                        </div>

                        {/* Phone */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '16px',
                            padding: '16px',
                            background: '#f8f9fa',
                            borderRadius: '12px'
                        }}>
                            <div style={{ fontSize: '24px', minWidth: '32px', textAlign: 'center' }}>📱</div>
                            <div style={{ flex: 1 }}>
                                <div style={{
                                    fontSize: '12px',
                                    color: '#666',
                                    fontWeight: '500',
                                    marginBottom: '4px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>
                                    Số điện thoại
                                </div>
                                <div style={{ fontSize: '15px', color: '#333', fontWeight: '500' }}>
                                    {profile.phone_number}
                                </div>
                            </div>
                        </div>

                        {/* Address */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '16px',
                            padding: '16px',
                            background: '#f8f9fa',
                            borderRadius: '12px'
                        }}>
                            <div style={{ fontSize: '24px', minWidth: '32px', textAlign: 'center' }}>📍</div>
                            <div style={{ flex: 1 }}>
                                <div style={{
                                    fontSize: '12px',
                                    color: '#666',
                                    fontWeight: '500',
                                    marginBottom: '4px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>
                                    Địa chỉ
                                </div>
                                <div style={{ fontSize: '15px', color: '#333', fontWeight: '500' }}>
                                    {profile.address}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pending Application Alert */}
                    {isPendingApplication && (
                        <div style={{
                            marginTop: '24px',
                            padding: '16px',
                            background: '#fff3cd',
                            border: '1px solid #ffc107',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            color: '#856404'
                        }}>
                            <span style={{ fontSize: '24px' }}>⏳</span>
                            <div>
                                <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                                    Đơn đang chờ duyệt
                                </div>
                                <div style={{ fontSize: '14px' }}>
                                    Đơn đăng ký farmer của bạn đang chờ admin xác nhận. Vui lòng đợi!
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Apply Farmer Button */}
                    {profile.role === 'consumer' && !isPendingApplication && (
                        <div style={{ marginTop: '32px', textAlign: 'center' }}>
                            <button
                                style={{
                                    background: 'linear-gradient(135deg, #38b000 0%, #2d8f00 100%)',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '12px',
                                    padding: '14px 32px',
                                    fontWeight: '600',
                                    fontSize: '16px',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    boxShadow: '0 4px 12px rgba(56, 176, 0, 0.3)',
                                    transition: 'all 0.3s'
                                }}
                                onClick={() => setShowApplyForm(v => !v)}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(56, 176, 0, 0.4)';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(56, 176, 0, 0.3)';
                                }}
                            >
                                <span>🌾</span>
                                Đăng ký làm nông dân
                            </button>
                        </div>
                    )}

                    {/* Change Password Button */}
                    <div style={{ marginTop: '16px', textAlign: 'center' }}>
                        <button
                            style={{
                                background: '#fff',
                                color: '#667eea',
                                border: '2px solid #667eea',
                                borderRadius: '12px',
                                padding: '12px 28px',
                                fontWeight: '600',
                                fontSize: '15px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                transition: 'all 0.3s'
                            }}
                            onClick={() => navigate('/change-password')}
                            onMouseOver={(e) => {
                                e.currentTarget.style.background = '#667eea';
                                e.currentTarget.style.color = '#fff';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.background = '#fff';
                                e.currentTarget.style.color = '#667eea';
                            }}
                        >
                            <span>🔐</span>
                            Đổi mật khẩu
                        </button>
                    </div>
                </div>
            </div>

            {/* Application Form */}
            {showApplyForm && !isPendingApplication && (
                <div style={{
                    marginTop: '24px',
                    background: '#fff',
                    borderRadius: '16px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    padding: '32px'
                }}>
                    <form onSubmit={handleApplySubmit}>
                        <h3 style={{
                            fontSize: '20px',
                            fontWeight: '600',
                            marginBottom: '24px',
                            color: '#333',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <span>📝</span>
                            Đăng ký làm nông dân
                        </h3>

                        {applyError && (
                            <div style={{
                                padding: '12px 16px',
                                background: '#ffebee',
                                border: '1px solid #f44336',
                                borderRadius: '8px',
                                color: '#c62828',
                                marginBottom: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <span>❌</span>
                                {applyError}
                            </div>
                        )}

                        {applySuccess && (
                            <div style={{
                                padding: '12px 16px',
                                background: '#e8f5e9',
                                border: '1px solid #38b000',
                                borderRadius: '8px',
                                color: '#2d8f00',
                                marginBottom: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <span>✅</span>
                                {applySuccess}
                            </div>
                        )}

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontWeight: '600',
                                color: '#333',
                                fontSize: '14px'
                            }}>
                                🏡 Địa chỉ trang trại *
                            </label>
                            <input
                                type="text"
                                name="farm_address"
                                value={applyForm.farm_address}
                                onChange={handleApplyChange}
                                required
                                placeholder="Nhập địa chỉ trang trại của bạn"
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    borderRadius: '8px',
                                    border: '2px solid #e0e0e0',
                                    fontSize: '15px',
                                    outline: 'none',
                                    transition: 'all 0.3s',
                                    boxSizing: 'border-box'
                                }}
                                onFocus={(e) => e.currentTarget.style.borderColor = '#38b000'}
                                onBlur={(e) => e.currentTarget.style.borderColor = '#e0e0e0'}
                            />
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontWeight: '600',
                                color: '#333',
                                fontSize: '14px'
                            }}>
                                📄 Ảnh giấy phép kinh doanh *
                            </label>
                            <div style={{
                                position: 'relative',
                                border: '2px dashed #e0e0e0',
                                borderRadius: '8px',
                                padding: '24px',
                                textAlign: 'center',
                                background: '#fafafa',
                                cursor: 'pointer'
                            }}>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    required
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        opacity: 0,
                                        cursor: 'pointer'
                                    }}
                                />
                                <div style={{ fontSize: '48px', marginBottom: '8px' }}>📎</div>
                                {applyForm.business_license_file ? (
                                    <div style={{ color: '#38b000', fontWeight: '500' }}>
                                        ✓ {applyForm.business_license_file.name}
                                    </div>
                                ) : (
                                    <div style={{ color: '#666' }}>
                                        Nhấn để chọn ảnh giấy phép
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button
                                type="button"
                                style={{
                                    background: '#f5f5f5',
                                    color: '#333',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '12px 24px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    fontSize: '15px',
                                    transition: 'all 0.3s'
                                }}
                                onClick={() => setShowApplyForm(false)}
                                onMouseOver={(e) => e.currentTarget.style.background = '#e0e0e0'}
                                onMouseOut={(e) => e.currentTarget.style.background = '#f5f5f5'}
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                disabled={applyLoading}
                                style={{
                                    background: applyLoading ? '#ccc' : 'linear-gradient(135deg, #38b000 0%, #2d8f00 100%)',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '12px 32px',
                                    fontWeight: '600',
                                    cursor: applyLoading ? 'not-allowed' : 'pointer',
                                    fontSize: '15px',
                                    transition: 'all 0.3s'
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
                    background: applySuccess ? '#38b000' : '#f44336',
                    color: '#fff',
                    padding: '16px 24px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    zIndex: 1000,
                    animation: 'slideIn 0.3s ease'
                }}>
                    <span style={{ fontSize: '20px' }}>{applySuccess ? '✔' : '✖'}</span>
                    <span style={{ fontWeight: '500' }}>{applySuccess || applyError}</span>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;
