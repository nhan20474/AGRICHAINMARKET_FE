import React, { useEffect, useState } from 'react';

interface FarmerApplication {
    application_id: number;
    user_id: number;
    full_name: string;
    email: string;
    farm_address: string;
    business_license_url?: string;
    application_date?: string;
}

const API_BASE = 'http://localhost:3000/api/admin/users';

const PendingFarmers: React.FC = () => {
    const [pendingFarmers, setPendingFarmers] = useState<FarmerApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [notify, setNotify] = useState('');
    const [error, setError] = useState('');
    const [rejectId, setRejectId] = useState<number | null>(null);
    const [rejectReason, setRejectReason] = useState('');

    async function fetchPendingFarmers() {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${API_BASE}/pending-applications`);
            if (!res.ok) throw new Error('Không thể lấy danh sách đơn đăng ký farmer');
            const data = await res.json();
            setPendingFarmers(Array.isArray(data) ? data : []);
        } catch (err: any) {
            setError(err.message || 'Lỗi khi tải danh sách');
        }
        setLoading(false);
    }

    async function approveFarmer(userId: number) {
        setNotify('');
        try {
            const res = await fetch(`${API_BASE}/approve-farmer/${userId}`, { method: 'PATCH' });
            if (!res.ok) throw new Error('Duyệt đơn đăng ký thất bại');
            setNotify('Đã duyệt đơn đăng ký thành công!');
            await fetchPendingFarmers();
        } catch (err: any) {
            setNotify(err.message || 'Duyệt đơn đăng ký thất bại');
        }
        setTimeout(() => setNotify(''), 1200);
    }

    async function rejectFarmer(userId: number, reason: string) {
        setNotify('');
        try {
            const res = await fetch(`${API_BASE}/reject-application/${userId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason }),
            });
            if (!res.ok) throw new Error('Từ chối đơn đăng ký thất bại');
            setNotify('Đã từ chối đơn đăng ký!');
            setRejectId(null);
            setRejectReason('');
            await fetchPendingFarmers();
        } catch (err: any) {
            setNotify(err.message || 'Từ chối đơn đăng ký thất bại');
        }
        setTimeout(() => setNotify(''), 1200);
    }

    useEffect(() => {
        fetchPendingFarmers();
    }, []);

    return (
        <div style={{maxWidth:1000, margin:'32px auto', background:'#fff', borderRadius:8, boxShadow:'0 2px 12px rgba(0,0,0,0.08)', padding:32}}>
            <h2 style={{marginBottom:24}}>Quản lý đơn đăng ký farmer chờ duyệt</h2>
            {loading && <div>Đang tải danh sách đơn đăng ký...</div>}
            {error && <div style={{color:'red', marginBottom:16}}>{error}</div>}
            {notify && (
                <div style={{
                    position:'fixed', left:'50%', bottom:32, transform:'translateX(-50%)',
                    background:'#38b000', color:'#fff', padding:'8px 24px', borderRadius:20,
                    fontSize:15, zIndex:9999, boxShadow:'0 2px 8px rgba(0,0,0,0.15)'
                }}>
                    {notify}
                </div>
            )}
            <table style={{width:'100%', borderCollapse:'collapse', marginTop:16}}>
                <thead>
                    <tr style={{background:'#f6fff2'}}>
                        <th style={{padding:8, border:'1px solid #eee'}}>ID đơn</th>
                        <th style={{padding:8, border:'1px solid #eee'}}>ID user</th>
                        <th style={{padding:8, border:'1px solid #eee'}}>Họ tên</th>
                        <th style={{padding:8, border:'1px solid #eee'}}>Email</th>
                        <th style={{padding:8, border:'1px solid #eee'}}>Địa chỉ trang trại</th>
                        <th style={{padding:8, border:'1px solid #eee'}}>Giấy phép kinh doanh</th>
                        <th style={{padding:8, border:'1px solid #eee'}}>Ngày nộp</th>
                        <th style={{padding:8, border:'1px solid #eee'}}>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    {pendingFarmers.length === 0 ? (
                        <tr>
                            <td colSpan={8} style={{textAlign:'center', padding:24}}>Không có đơn đăng ký nào chờ duyệt.</td>
                        </tr>
                    ) : (
                        pendingFarmers.map(farmer => (
                            <tr key={farmer.application_id}>
                                <td style={{padding:8, border:'1px solid #eee'}}>{farmer.application_id}</td>
                                <td style={{padding:8, border:'1px solid #eee'}}>{farmer.user_id}</td>
                                <td style={{padding:8, border:'1px solid #eee'}}>{farmer.full_name}</td>
                                <td style={{padding:8, border:'1px solid #eee'}}>{farmer.email}</td>
                                <td style={{padding:8, border:'1px solid #eee'}}>{farmer.farm_address}</td>
                                <td style={{padding:8, border:'1px solid #eee'}}>
                                    {farmer.business_license_url ? (
                                        <a
                                            href={
                                                farmer.business_license_url.startsWith('/uploads/')
                                                    ? `http://localhost:3000${farmer.business_license_url}`
                                                    : farmer.business_license_url
                                            }
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <img
                                                src={
                                                    farmer.business_license_url.startsWith('/uploads/')
                                                        ? `http://localhost:3000${farmer.business_license_url}`
                                                        : farmer.business_license_url
                                                }
                                                alt="Giấy phép"
                                                style={{width:60, height:60, objectFit:'cover', borderRadius:6}}
                                            />
                                        </a>
                                    ) : 'Chưa có'}
                                </td>
                                <td style={{padding:8, border:'1px solid #eee'}}>
                                    {farmer.application_date ? new Date(farmer.application_date).toLocaleString('vi-VN') : ''}
                                </td>
                                <td style={{padding:8, border:'1px solid #eee'}}>
                                    <button style={{marginRight:8, background:'#38b000', color:'#fff', border:'none', borderRadius:4, padding:'6px 14px', cursor:'pointer'}}
                                        onClick={() => approveFarmer(farmer.user_id)}>
                                        Duyệt
                                    </button>
                                    <button style={{background:'#D32F2F', color:'#fff', border:'none', borderRadius:4, padding:'6px 14px', cursor:'pointer'}}
                                        onClick={() => setRejectId(farmer.user_id)}>
                                        Từ chối
                                    </button>
                                    {/* Hiển thị ô nhập lý do từ chối nếu rejectId trùng */}
                                    {rejectId === farmer.user_id && (
                                        <div style={{marginTop:8}}>
                                            <input
                                                type="text"
                                                placeholder="Lý do từ chối"
                                                value={rejectReason}
                                                onChange={e => setRejectReason(e.target.value)}
                                                style={{padding:'6px', borderRadius:4, border:'1px solid #ccc', width:'80%'}}
                                            />
                                            <button
                                                style={{marginLeft:8, background:'#D32F2F', color:'#fff', border:'none', borderRadius:4, padding:'6px 14px', cursor:'pointer'}}
                                                onClick={() => rejectFarmer(farmer.user_id, rejectReason)}
                                            >
                                                Xác nhận từ chối
                                            </button>
                                            <button
                                                style={{marginLeft:8, background:'#eee', color:'#333', border:'none', borderRadius:4, padding:'6px 14px', cursor:'pointer'}}
                                                onClick={() => { setRejectId(null); setRejectReason(''); }}
                                            >
                                                Hủy
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default PendingFarmers;
