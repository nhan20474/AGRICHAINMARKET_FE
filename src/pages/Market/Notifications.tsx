import React, { useEffect, useState } from 'react';
import { notificationService } from '../../services/notificationService';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

function getUserId() {
  try {
    const s = localStorage.getItem('user');
    if (!s) return null;
    return Number(JSON.parse(s).id);
  } catch { return null; }
}

type NotificationItem = {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  product_id?: number;
  order_id?: number;
  is_read?: boolean;
  created_at?: string;
};

const Notifications: React.FC = () => {
  const userId = getUserId();
  const navigate = useNavigate();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [popup, setPopup] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    if (!userId) return setError('Bạn cần đăng nhập để xem thông báo.');
    setLoading(true);
    try {
      // Gọi trực tiếp API lấy thông báo cho user
      const res = await fetch(`http://localhost:3000/api/notifications/user/${userId}?page=1&pageSize=50`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.notifications || data.items || []);
      setItems(list);
      // Đếm số lượng chưa đọc để cập nhật badge
      const unread = list.filter((n: any) => !n.is_read).length;
      setUnreadCount(unread);
      window.dispatchEvent(new CustomEvent('notification-updated', { detail: unread }));
    } catch (err: any) {
      setError(err?.message || 'Không thể tải thông báo');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();

    // Khi có thông báo mới qua socket, tăng số lượng chưa đọc ngay lập tức
    let socket: any;
    if (userId) {
      socket = io('http://localhost:3000');
      socket.emit('register', userId);
      socket.on('notification', (data: any) => {
        setPopup('Bạn có thông báo mới');
        // Tăng số lượng chưa đọc ngay lập tức
        setUnreadCount(prev => {
          const next = prev + 1;
          window.dispatchEvent(new CustomEvent('notification-updated', { detail: next }));
          return next;
        });
        fetchNotifications();
        setTimeout(() => setPopup(null), 2500);
      });
    }

    const onNew = () => fetchNotifications();
    window.addEventListener('notification-updated', onNew);

    return () => {
      window.removeEventListener('notification-updated', onNew);
      if (socket) socket.disconnect();
    };
  }, []);

  const markRead = async (id: number) => {
    try {
      await notificationService.markAsRead(id);
      setItems(prev => prev.map(i => i.id === id ? { ...i, is_read: true } : i));
      // Cập nhật badge khi đánh dấu đã đọc
      const unread = items.filter(i => i.id !== id && !i.is_read).length;
      setUnreadCount(unread);
      window.dispatchEvent(new CustomEvent('notification-updated', { detail: unread }));
    } catch {}
  };

  const remove = async (id: number) => {
    try {
      await notificationService.remove(id);
      setItems(prev => prev.filter(i => i.id !== id));
      // Cập nhật badge khi xóa
      const unread = items.filter(i => i.id !== id && !i.is_read).length;
      setUnreadCount(unread);
      window.dispatchEvent(new CustomEvent('notification-updated', { detail: unread }));
    } catch {}
  };

  return (
    <div style={{maxWidth:900, margin:'32px auto', padding:24, background:'#fff', borderRadius:8}}>
      <h2 style={{marginBottom:16}}>🔔 Thông báo</h2>
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
      {loading && <div>Đang tải thông báo...</div>}
      {error && <div style={{color:'red'}}>{error}</div>}
      {!loading && !error && items.length === 0 && (
        <div>Hiện không có thông báo.</div>
      )}
      <ul style={{listStyle:'none', padding:0, margin:0}}>
        {items.map(n => (
          <li key={n.id} style={{
            borderBottom:'1px solid #eee', padding:'12px 8px', display:'flex', justifyContent:'space-between',
            background: n.is_read ? '#fff' : '#f6fff2'
          }}>
            <div>
              <div style={{fontWeight:600, color: n.is_read ? '#333' : '#38b000'}}>{n.title}</div>
              <div style={{fontSize:15, color:'#555'}}>{n.message}</div>
              <div style={{fontSize:13, color:'#888'}}>{n.created_at ? new Date(n.created_at).toLocaleString('vi-VN') : ''}</div>
            </div>
            <div style={{display:'flex', flexDirection:'column', gap:6}}>
              {!n.is_read && (
                <button
                  style={{background:'#38b000', color:'#fff', border:'none', borderRadius:6, padding:'4px 12px', cursor:'pointer'}}
                  onClick={() => markRead(n.id)}
                >
                  Đã đọc
                </button>
              )}
              <button
                style={{background:'#D32F2F', color:'#fff', border:'none', borderRadius:6, padding:'4px 12px', cursor:'pointer'}}
                onClick={() => remove(n.id)}
              >
                Xóa
              </button>
            </div>
          </li>
        ))}
      </ul>
      <div style={{marginTop:24}}>
        
      </div>
    </div>
  );
};

export default Notifications;
