import React, { useEffect, useState } from 'react';

// --- TYPE DEFINITIONS ---
interface User {
    id: number;
    full_name: string;
    email: string;
    phone_number: string;
    role: 'consumer' | 'farmer';
    is_locked: boolean;
    created_at: string;
    // Các trường riêng của Farmer (có thể null nếu là Consumer)
    farm_address?: string;
    business_license_url?: string;
}

// Cấu hình API
const API_BASE = 'http://localhost:3000/api/admin/users';

const UserManager: React.FC = () => {
    // State quản lý Tab: chỉ có 'consumers' hoặc 'farmers'
    const [activeTab, setActiveTab] = useState<'consumers' | 'farmers'>('consumers');
    
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // --- 1. FETCH DATA ---
    useEffect(() => {
        fetchUsers();
    }, [activeTab]); // Gọi lại khi chuyển Tab

    const fetchUsers = async () => {
        setLoading(true);
        try {
            // Chọn API dựa trên Tab đang đứng
            const endpoint = activeTab === 'consumers' ? '/consumers' : '/farmers';
            
            const res = await fetch(`${API_BASE}${endpoint}`);
            if (!res.ok) throw new Error('Lỗi tải dữ liệu');
            
            const data = await res.json();
            setUsers(data);
        } catch (error) {
            console.error(error);
        }
        setLoading(false);
    };

    // --- 2. ACTIONS (HÀNH ĐỘNG) ---

    // Khóa / Mở khóa tài khoản (Dùng chung cho cả 2)
    const handleToggleLock = async (user: User) => {
        const action = user.is_locked ? 'MỞ KHÓA' : 'KHÓA';
        const reason = prompt(`Nhập lý do ${action} tài khoản này:`, "Vi phạm chính sách");
        
        if (reason === null) return; // Bấm hủy

        try {
            const res = await fetch(`${API_BASE}/${user.id}/toggle-lock`, {
                method: 'PATCH',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ 
                    is_locked: !user.is_locked,
                    reason: reason 
                })
            });

            if (res.ok) {
                alert(`Đã ${action} thành công!`);
                fetchUsers(); // Load lại danh sách để cập nhật trạng thái
            } else {
                alert("Có lỗi xảy ra.");
            }
        } catch (err) { console.error(err); }
    };

    // Hạ cấp Farmer (Chỉ dùng ở Tab Farmer)
    const handleDemote = async (userId: number) => {
        if (!window.confirm("⚠️ CẢNH BÁO: Hành động này sẽ tước quyền Nông dân và đưa tài khoản về loại Người mua thường. Bạn có chắc chắn?")) return;
        
        const reason = prompt("Nhập lý do hạ cấp:", "Gian lận sản phẩm");
        if (!reason) return;

        try {
            const res = await fetch(`${API_BASE}/${userId}/demote-farmer`, { 
                method: 'PATCH',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ reason })
            });
            
            if (res.ok) {
                alert("Đã hạ cấp thành công. User này đã bị chuyển khỏi danh sách Farmer.");
                fetchUsers(); // Load lại, user này sẽ biến mất khỏi tab Farmer
            } else {
                alert("Lỗi server.");
            }
        } catch (err) { console.error(err); }
    };

    // --- 3. CLIENT-SIDE SEARCH ---
    const filteredUsers = users.filter(u => 
        u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.phone_number && u.phone_number.includes(searchTerm))
    );

    return (
        <div style={{ padding: 30, maxWidth: 1200, margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
            <h2 style={{ marginBottom: 24, borderBottom: '2px solid #f0f0f0', paddingBottom: 10 }}>
                Quản lý người dùng hệ thống
            </h2>

            {/* --- THANH CÔNG CỤ & TABS --- */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                
                {/* Tab Switcher */}
                <div style={{ display: 'flex', background: '#f5f5f5', padding: 4, borderRadius: 8 }}>
                    <button 
                        onClick={() => setActiveTab('consumers')}
                        style={{ 
                            padding: '10px 20px', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold',
                            background: activeTab === 'consumers' ? '#fff' : 'transparent',
                            color: activeTab === 'consumers' ? '#2196F3' : '#666',
                            boxShadow: activeTab === 'consumers' ? '0 2px 5px rgba(0,0,0,0.1)' : 'none',
                            transition: 'all 0.2s'
                        }}
                    >
                        🛒 Người mua
                    </button>
                    <button 
                        onClick={() => setActiveTab('farmers')}
                        style={{ 
                            padding: '10px 20px', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold',
                            background: activeTab === 'farmers' ? '#fff' : 'transparent',
                            color: activeTab === 'farmers' ? '#4CAF50' : '#666',
                            boxShadow: activeTab === 'farmers' ? '0 2px 5px rgba(0,0,0,0.1)' : 'none',
                            transition: 'all 0.2s'
                        }}
                    >
                        👨‍🌾 Nông dân
                    </button>
                </div>

                {/* Search Box */}
                <input 
                    placeholder="🔍 Tìm theo tên, email, SĐT..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ padding: '10px 16px', width: 300, borderRadius: 20, border: '1px solid #ddd', outline: 'none' }}
                />
            </div>

            {/* --- BẢNG DỮ LIỆU --- */}
            {loading ? (
                <div style={{textAlign: 'center', padding: 20, color: '#666'}}>Đang tải dữ liệu...</div>
            ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', boxShadow: '0 1px 4px rgba(0,0,0,0.1)', borderRadius: 8, overflow: 'hidden' }}>
                    <thead style={{ background: '#f9fafb', color: '#333', textAlign: 'left' }}>
                        <tr>
                            <th style={{ padding: 16 }}>Thông tin cá nhân</th>
                            <th style={{ padding: 16 }}>Liên hệ</th>
                            {/* Cột này chỉ hiện cho Farmer */}
                            {activeTab === 'farmers' && <th style={{ padding: 16 }}>Thông tin trang trại</th>}
                            <th style={{ padding: 16 }}>Trạng thái</th>
                            <th style={{ padding: 16, textAlign: 'right' }}>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.length === 0 && (
                            <tr><td colSpan={5} style={{padding: 20, textAlign: 'center', color: '#999'}}>Không tìm thấy kết quả nào.</td></tr>
                        )}

                        {filteredUsers.map(user => (
                            <tr 
                                key={user.id} 
                                style={{ 
                                    borderBottom: '1px solid #eee', 
                                    background: user.is_locked ? '#fff5f5' : '#fff', // Tô màu đỏ nhạt nếu bị khóa
                                    opacity: user.is_locked ? 0.7 : 1 
                                }}
                            >
                                <td style={{ padding: 16 }}>
                                    <div style={{ fontWeight: 'bold', fontSize: 15 }}>{user.full_name}</div>
                                    <div style={{ fontSize: 12, color: '#888' }}>ID: #{user.id} • Tham gia: {new Date(user.created_at).toLocaleDateString('vi-VN')}</div>
                                </td>
                                <td style={{ padding: 16 }}>
                                    <div style={{marginBottom: 4}}>📧 {user.email}</div>
                                    <div>📞 {user.phone_number || 'Chưa cập nhật'}</div>
                                </td>

                                {/* Dữ liệu riêng cho Farmer */}
                                {activeTab === 'farmers' && (
                                    <td style={{ padding: 16, fontSize: 14 }}>
                                        <div style={{marginBottom:4}}>📍 {user.farm_address}</div>
                                        {user.business_license_url ? (
                                            <a href={user.business_license_url} target="_blank" rel="noreferrer" style={{ color: '#2196F3', fontSize: 13, textDecoration:'none' }}>📄 Xem giấy phép</a>
                                        ) : (
                                            <span style={{color:'#999', fontSize: 13}}>Không có giấy phép</span>
                                        )}
                                    </td>
                                )}

                                <td style={{ padding: 16 }}>
                                    {user.is_locked ? (
                                        <span style={{ background: '#FFEBEE', color: '#C62828', padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 'bold' }}>⛔ Đã khóa</span>
                                    ) : (
                                        <span style={{ background: '#E8F5E9', color: '#2E7D32', padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 'bold' }}>● Hoạt động</span>
                                    )}
                                </td>

                                <td style={{ padding: 16, textAlign: 'right' }}>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                                        
                                        {/* Nút Khóa / Mở khóa (Cho cả 2) */}
                                        <button 
                                            onClick={() => handleToggleLock(user)}
                                            style={{ 
                                                background: user.is_locked ? '#4CAF50' : '#fff', 
                                                color: user.is_locked ? '#fff' : '#F44336', 
                                                border: user.is_locked ? 'none' : '1px solid #F44336', 
                                                padding: '6px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 13
                                            }}
                                        >
                                            {user.is_locked ? 'Mở khóa' : 'Khóa'}
                                        </button>

                                        {/* Nút Hạ cấp (Chỉ cho Farmer) */}
                                        {activeTab === 'farmers' && !user.is_locked && (
                                            <button 
                                                onClick={() => handleDemote(user.id)}
                                                title="Hạ cấp xuống người dùng thường"
                                                style={{ background: '#FF9800', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}
                                            >
                                                ▼ Hạ cấp
                                            </button>
                                        )}

                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default UserManager;