import React, { useState, useEffect } from 'react';
import { API_CONFIG } from '../../config/apiConfig';

// --- GIẢ LẬP QUYỀN HẠN ---
// Hãy thử đổi thành 'staff' hoặc 'seller' để thấy nút Xóa và nút Cài đặt biến mất
const CURRENT_USER_ROLE = 'admin'; 

// --- TYPE DEFINITION ---
interface NotificationItem {
    id: number;
    type: string; 
    title: string;
    message: string;
    created_at: string;
    is_read: boolean;
    product_id?: number;
    order_id?: number;
}

// --- API HELPER ---
async function sendBroadcastNotification(data: any) {
    const res = await fetch(`${API_CONFIG.NOTIFICATIONS}/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Gửi thất bại');
    return await res.json();
}

const NotificationCenter: React.FC = () => {
    // --- STATE ---
    const [activeTab, setActiveTab] = useState('all'); 
    const [filterRead, setFilterRead] = useState('all');
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const pageSize = 10;

    // Modal & Form State
    const [showSendForm, setShowSendForm] = useState(false);
    const [showSettings, setShowSettings] = useState(false); // Modal Cài đặt
    const [autoDeleteDays, setAutoDeleteDays] = useState(30); // Mặc định 30 ngày

    const [broadcastForm, setBroadcastForm] = useState({ title: '', message: '' });
    const [notifyToast, setNotifyToast] = useState('');

    // --- FETCH DATA ---
    useEffect(() => {
        fetchNotifications();
    }, [page, activeTab, filterRead]);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            // Logic filter API (giả lập filter client nếu backend chưa hỗ trợ full param)
            let url = `${API_CONFIG.NOTIFICATIONS}/user/1?page=${page}&pageSize=${pageSize}`;
            if (filterRead === 'read') url += '&is_read=true';
            if (filterRead === 'unread') url += '&is_read=false';

            const res = await fetch(url);
            const data = await res.json();
            
            let list = Array.isArray(data) ? data : (data.notifications || []);
            const totalCount = data.total || list.length;

            setNotifications(list);
            setTotal(totalCount);
        } catch (error) { console.error(error); }
        setLoading(false);
    };

    // --- HANDLERS ---

    // 1. Gửi thông báo hệ thống
    const handleSendBroadcast = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await sendBroadcastNotification({ type: 'system', ...broadcastForm });
            setNotifyToast('✅ Đã gửi thông báo toàn hệ thống!');
            setShowSendForm(false);
            setBroadcastForm({ title: '', message: '' });
            fetchNotifications(); 
        } catch (err) { setNotifyToast('❌ Gửi thất bại'); }
        setTimeout(() => setNotifyToast(''), 3000);
    };

    // 2. Đánh dấu đã đọc
    const markAsRead = async (id: number) => {
        try {
            await fetch(`${API_CONFIG.NOTIFICATIONS}/read/${id}`, { method: 'PATCH' });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (err) { console.error(err); }
    };

    // 3. Xóa thông báo (CHỈ ADMIN)
    const handleDelete = async (id: number) => {
        if (CURRENT_USER_ROLE !== 'admin') {
            alert("⛔ Bạn không có quyền xóa thông báo.");
            return;
        }
        if (!window.confirm("Bạn chắc chắn muốn xóa vĩnh viễn thông báo này?")) return;

        try {
            const res = await fetch(`${API_CONFIG.NOTIFICATIONS}/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setNotifications(prev => prev.filter(n => n.id !== id));
                setNotifyToast("🗑️ Đã xóa thành công");
            }
        } catch (err) { console.error(err); }
        setTimeout(() => setNotifyToast(''), 2000);
    };

    // 4. Chạy dọn dẹp tự động (CHỈ ADMIN)
    const handleCleanup = async () => {
        if (CURRENT_USER_ROLE !== 'admin') return;
        if (!window.confirm(`Hành động này sẽ xóa vĩnh viễn các thông báo cũ hơn ${autoDeleteDays} ngày. Tiếp tục?`)) return;

        try {
            const res = await fetch(`${API_CONFIG.NOTIFICATIONS}/cleanup?days=${autoDeleteDays}`, { method: 'DELETE' });
            const data = await res.json();
            if (res.ok) {
                setNotifyToast(`🧹 ${data.message}. Đã xóa ${data.deleted_count} dòng.`);
                fetchNotifications();
                setShowSettings(false);
            } else {
                alert(data.error);
            }
        } catch (err) { console.error(err); }
        setTimeout(() => setNotifyToast(''), 3000);
    };

    // --- UI HELPERS ---
    const getIconAndColor = (type: string) => {
        switch (type) {
            case 'system': return { icon: '⚙️', color: '#607D8B', label: 'HỆ THỐNG' };
            case 'security': return { icon: '🔐', color: '#D32F2F', label: 'BẢO MẬT' };
            case 'product_approval': return { icon: '👨‍🌾', color: '#4CAF50', label: 'FARMER' };
            case 'seller_update': return { icon: '🧾', color: '#795548', label: 'HỒ SƠ' };
            case 'inventory_warning': return { icon: '📦', color: '#FF9800', label: 'KHO HÀNG' };
            case 'quality_report': return { icon: '⚠️', color: '#F44336', label: 'CHẤT LƯỢNG' };
            case 'order_tracking': return { icon: '🛒', color: '#2196F3', label: 'ĐƠN HÀNG' };
            case 'payment_fail': return { icon: '💰', color: '#9C27B0', label: 'THANH TOÁN' };
            default: return { icon: '🔔', color: '#9E9E9E', label: 'KHÁC' };
        }
    };

    const filteredList = notifications.filter(n => {
        if (activeTab === 'system') return ['system', 'security'].includes(n.type);
        if (activeTab === 'seller') return ['product_approval', 'seller_update', 'product_rejected'].includes(n.type);
        if (activeTab === 'inventory') return ['inventory_warning', 'quality_report'].includes(n.type);
        if (activeTab === 'order') return ['order_tracking', 'payment_fail'].includes(n.type);
        return true;
    });

    return (
        <div style={{ padding: 20, fontFamily: 'Arial, sans-serif', maxWidth: 1000, margin: '0 auto' }}>
            
            {/* HEADER & BUTTONS */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ margin: 0 }}>Trung tâm thông báo</h2>
                <div style={{ display: 'flex', gap: 10 }}>
                    {/* Nút Cài đặt (Chỉ Admin thấy) */}
                    {CURRENT_USER_ROLE === 'admin' && (
                        <button 
                            onClick={() => setShowSettings(true)}
                            title="Cài đặt dọn dẹp dữ liệu"
                            style={{ background: '#fff', border: '1px solid #ddd', padding: '10px', borderRadius: 4, cursor: 'pointer', fontSize: 16 }}
                        >
                            ⚙️
                        </button>
                    )}
                    
                    <button 
                        onClick={() => setShowSendForm(!showSendForm)}
                        style={{ background: '#333', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        {showSendForm ? 'Đóng form' : '+ Tạo thông báo'}
                    </button>
                </div>
            </div>

            {/* --- MODAL CÀI ĐẶT --- */}
            {showSettings && (
                <div style={{ 
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
                    background: 'rgba(0,0,0,0.5)', zIndex: 999, 
                    display: 'flex', justifyContent: 'center', alignItems: 'center' 
                }}>
                    <div style={{ background: '#fff', padding: 24, borderRadius: 8, width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                        <h3 style={{ marginTop: 0 }}>⚙️ Quản lý dọn dẹp</h3>
                        <p style={{ color: '#666', fontSize: 14 }}>Xóa các thông báo cũ để giải phóng bộ nhớ.</p>
                        
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>Xóa cũ hơn:</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <input 
                                    type="number" 
                                    value={autoDeleteDays} 
                                    onChange={e => setAutoDeleteDays(Number(e.target.value))}
                                    style={{ padding: 8, width: 80, borderRadius: 4, border: '1px solid #ddd' }}
                                />
                                <span>ngày</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                            <button onClick={() => setShowSettings(false)} style={{ background: '#f5f5f5', border: 'none', padding: '8px 16px', borderRadius: 4, cursor: 'pointer' }}>Đóng</button>
                            <button 
                                onClick={handleCleanup}
                                style={{ background: '#D32F2F', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                🧹 Dọn dẹp ngay
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* FORM GỬI */}
            {showSendForm && (
                <div style={{ background: '#f9f9f9', padding: 20, borderRadius: 8, marginBottom: 20, border: '1px solid #ddd' }}>
                    <h4 style={{marginTop:0}}>Soạn thông báo broadcast</h4>
                    <form onSubmit={handleSendBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <input placeholder="Tiêu đề" value={broadcastForm.title} onChange={e => setBroadcastForm({...broadcastForm, title: e.target.value})} required style={{ padding: 8 }} />
                        <textarea placeholder="Nội dung thông báo..." value={broadcastForm.message} onChange={e => setBroadcastForm({...broadcastForm, message: e.target.value})} required style={{ padding: 8, minHeight: 80 }} />
                        <button type="submit" style={{ background: '#4CAF50', color: '#fff', border: 'none', padding: '8px', cursor: 'pointer' }}>Gửi ngay</button>
                    </form>
                </div>
            )}

            {/* FILTER BAR */}
            <div style={{ background: '#f5f5f5', padding: 10, borderRadius: 8, marginBottom: 20, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', border: '1px solid #eee' }}>
                <div style={{ display: 'flex', gap: 5 }}>
                    {['all', 'system', 'inventory', 'order'].map(tab => (
                        <button 
                            key={tab} onClick={() => setActiveTab(tab)}
                            style={{ 
                                padding: '8px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', fontWeight: 600,
                                background: activeTab === tab ? '#333' : '#fff', 
                                color: activeTab === tab ? '#fff' : '#333',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                            }}
                        >
                            {tab === 'all' ? 'Tất cả' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>
                <div style={{ height: 20, width: 1, background: '#ccc', margin: '0 10px' }}></div>
                <select value={filterRead} onChange={(e) => setFilterRead(e.target.value)} style={{ padding: '6px', borderRadius: 4, border: '1px solid #ddd' }}>
                    <option value="all">Tất cả trạng thái</option>
                    <option value="unread">Chưa đọc</option>
                    <option value="read">Đã đọc</option>
                </select>
            </div>

            {/* ============================ LIST NOTICES ======================= */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                {loading ? <p>Đang tải...</p> : filteredList.length === 0 ? <p style={{textAlign:'center', color:'#888'}}>Không có thông báo nào.</p> : null}

                {filteredList.map(item => {
                    const ui = getIconAndColor(item.type);
                    const isUnread = !item.is_read; // Biến kiểm tra chưa đọc

                    return (
                        <div 
                            key={item.id} 
                            // Nếu chưa đọc thì nền trắng sáng, nếu đã đọc thì nền xám nhạt
                            style={{ 
                                display: 'flex', 
                                background: isUnread ? '#ffffff' : '#f9f9f9',
                                border: isUnread ? `1px solid #2196F3` : '1px solid #eee', // Viền xanh nếu chưa đọc
                                borderLeft: `4px solid ${ui.color}`,
                                borderRadius: 8,
                                boxShadow: isUnread ? '0 4px 8px rgba(33, 150, 243, 0.1)' : 'none',
                                padding: 15,
                                position: 'relative',
                                transition: 'all 0.2s'
                            }}
                        >
                            {/* CHẤM XANH (Chỉ hiện khi chưa đọc) */}
                            {isUnread && (
                                <div style={{
                                    position: 'absolute', top: 12, right: 12,
                                    width: 10, height: 10, borderRadius: '50%',
                                    background: '#2196F3', boxShadow: '0 0 4px #2196F3'
                                }} title="Chưa đọc"></div>
                            )}

                            {/* ICON BOX */}
                            <div style={{ marginRight: 15, display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 60 }}>
                                <span style={{ fontSize: 24 }}>{ui.icon}</span>
                                <span style={{ fontSize: 10, fontWeight: 'bold', color: ui.color, marginTop: 4 }}>{ui.label}</span>
                            </div>

                            {/* CONTENT */}
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                    <h3 style={{ 
                                        margin: 0, fontSize: 16, color: '#333',
                                        fontWeight: isUnread ? 700 : 500 // Đậm nếu chưa đọc
                                    }}>
                                        {item.title}
                                    </h3>
                                    <span style={{ fontSize: 12, color: '#999', marginRight: 20 }}>
                                        {new Date(item.created_at).toLocaleString('vi-VN')}
                                    </span>
                                </div>
                                
                                <p style={{ margin: '0 0 10px 0', color: '#555', fontSize: 14, lineHeight: '1.5' }}>
                                    {item.message}
                                </p>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    
                                    {/* ACTION BUTTONS (Contextual) */}
                                    <div style={{ display: 'flex', gap: 10 }}>
                                        {item.type === 'inventory_warning' && (
                                            <button style={{ background: ui.color, color: '#fff', border: 'none', padding: '5px 10px', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}>📦 Nhập hàng ngay</button>
                                        )}
                                        {item.type === 'product_approval' && (
                                            <>
                                                <button style={{ background: '#4CAF50', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}>Duyệt</button>
                                                <button style={{ background: '#F44336', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}>Từ chối</button>
                                            </>
                                        )}
                                    </div>

                                    {/* SYSTEM ACTIONS (Đánh dấu đọc / Xóa) */}
                                    <div style={{ display: 'flex', gap: 10 }}>
                                        {/* Nút Đánh dấu đã đọc (Chỉ hiện khi chưa đọc) */}
                                        {isUnread && (
                                            <button 
                                                onClick={() => markAsRead(item.id)}
                                                style={{ background: 'transparent', border: '1px solid #2196F3', color: '#2196F3', padding: '4px 8px', borderRadius: 4, fontSize: 11, cursor: 'pointer' }}
                                            >
                                                ✓ Đã đọc
                                            </button>
                                        )}

                                        {/* Nút Xóa (CHỈ ADMIN MỚI THẤY) */}
                                        {CURRENT_USER_ROLE === 'admin' && (
                                            <button 
                                                onClick={() => handleDelete(item.id)}
                                                title="Chỉ Admin mới xóa được"
                                                style={{ background: 'transparent', border: '1px solid #ef9a9a', color: '#c62828', padding: '4px 8px', borderRadius: 4, fontSize: 11, cursor: 'pointer' }}
                                            >
                                                🗑️ Xóa
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* PAGINATION */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 30, gap: 5 }}>
                <button disabled={page === 1} onClick={() => setPage(page - 1)} style={{ padding: '5px 10px', cursor: 'pointer' }}>&lt; Trước</button>
                <span style={{ padding: '5px 10px', background: '#eee', borderRadius: 4 }}>Trang {page}</span>
                <button disabled={filteredList.length < pageSize} onClick={() => setPage(page + 1)} style={{ padding: '5px 10px', cursor: 'pointer' }}>Sau &gt;</button>
            </div>

            {/* TOAST */}
            {notifyToast && (
                <div style={{ position: 'fixed', bottom: 20, right: 20, background: '#333', color: '#fff', padding: '10px 20px', borderRadius: 8 }}>
                    {notifyToast}
                </div>
            )}
        </div>
    );
};

export default NotificationCenter;