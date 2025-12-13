import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const FarmerNotifications: React.FC<{ sellerId: number }> = ({ sellerId }) => {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [popup, setPopup] = useState<string | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        setLoading(true);
        fetch(`http://localhost:3000/api/notifications/user/${sellerId}`)
            .then(async res => {
                const data = await res.json();
                let list = Array.isArray(data) ? data : (data.notifications || []);
                // Chỉ lấy thông báo của user đang đăng nhập
                list = list.filter((n: any) => n.user_id === sellerId);
                setNotifications(list);
                setUnreadCount(list.filter((n: any) => !n.is_read).length);
            })
            .catch(() => setNotifications([]))
            .finally(() => setLoading(false));
    }, [sellerId]);

    useEffect(() => {
        let socket: any;
        if (sellerId && sellerId > 0) {
            socket = io('http://localhost:3000');
            // Đăng ký lại mỗi lần reload/mount
            socket.emit('register', sellerId);
            socket.on('notification', (data: any) => {
                console.log('Nhận event notification:', data); // Thêm log kiểm tra
                fetch(`http://localhost:3000/api/notifications/user/${sellerId}`)
                    .then(async res => {
                        const data = await res.json();
                        let list = Array.isArray(data) ? data : (data.notifications || []);
                        list = list.filter((n: any) => n.user_id === sellerId);
                        setNotifications(list);
                        setUnreadCount(list.filter((n: any) => !n.is_read).length);
                    });
                setPopup('Bạn có thông báo mới');
                setTimeout(() => setPopup(null), 2500);
            });
        }
        return () => {
            if (socket) socket.disconnect();
        };
    }, [sellerId]);

    // Đánh dấu đã đọc
    const markRead = async (id: number) => {
        try {
            await fetch(`http://localhost:3000/api/notifications/read/${id}`, { method: 'PATCH' });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(notifications.filter(n => n.id !== id && !n.is_read).length);
        } catch {}
    };

    // Xóa thông báo (chỉ xóa của user đang đăng nhập)
    const remove = async (id: number) => {
        try {
            await fetch(`http://localhost:3000/api/notifications/${id}`, { method: 'DELETE' });
            setNotifications(prev => prev.filter(n => n.id !== id));
            setUnreadCount(notifications.filter(n => n.id !== id && !n.is_read).length);
        } catch {}
    };

    return (
        <div className="dashboard-card full-width" style={{marginTop:24}}>
            <h2>
                Thông báo của bạn
                {unreadCount > 0 && (
                    <span style={{
                        background:'#38b000', color:'#fff', borderRadius:12, padding:'2px 10px', marginLeft:8, fontSize:13
                    }}>{unreadCount}</span>
                )}
            </h2>
            {popup && (
                <div className="notify-bottom show" style={{
                    background:'#38b000',
                    color:'#fff',
                    position:'fixed',
                    right:32,
                    bottom:32,
                    zIndex:9999,
                    borderRadius:24,
                    padding:'12px 32px',
                    fontSize:16,
                    fontWeight:500,
                    boxShadow:'0 4px 16px rgba(56,176,0,0.18)'
                }}>
                    <span className="notify-icon">✔</span>
                    <span className="notify-text">{popup}</span>
                </div>
            )}
            {loading ? (
                <div>Đang tải thông báo...</div>
            ) : notifications.length === 0 ? (
                <div style={{color:'#888'}}>Không có thông báo nào.</div>
            ) : (
                <ul style={{listStyle:'none', padding:0, margin:0}}>
                    {notifications.map((item, idx) => (
                        <li key={item.id || idx} style={{
                            borderBottom:'1px solid #eee', padding:'12px 8px', display:'flex', justifyContent:'space-between',
                            background: item.is_read ? '#fff' : '#f6fff2'
                        }}>
                            <div>
                                <div style={{fontWeight:600, color: item.is_read ? '#333' : '#38b000'}}>{item.title}</div>
                                <div style={{fontSize:15, color:'#555'}}>{item.message}</div>
                                <div style={{fontSize:13, color:'#888'}}>{item.created_at ? new Date(item.created_at).toLocaleString('vi-VN') : ''}</div>
                            </div>
                            <div style={{display:'flex', flexDirection:'column', gap:6}}>
                                {!item.is_read && (
                                    <button
                                        style={{background:'#38b000', color:'#fff', border:'none', borderRadius:6, padding:'4px 12px', cursor:'pointer'}}
                                        onClick={() => markRead(item.id)}
                                    >
                                        Đã đọc
                                    </button>
                                )}
                                <button
                                    style={{background:'#D32F2F', color:'#fff', border:'none', borderRadius:6, padding:'4px 12px', cursor:'pointer'}}
                                    onClick={() => remove(item.id)}
                                >
                                    Xóa
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default FarmerNotifications;
