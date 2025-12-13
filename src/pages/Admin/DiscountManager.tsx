import React, { useState, useEffect } from 'react';
import { Ticket, Plus, Edit, Trash2, X, Save, Calendar, Percent, Users } from 'lucide-react';
import { discountService, Discount } from '../../services/discountService';
import '../../styles/DiscountManager.css';

// Định dạng ngày cho input type="date" (YYYY-MM-DD)
const formatDateInput = (isoString: string) => {
    if (!isoString) return '';
    return new Date(isoString).toISOString().split('T')[0];
};

// Định dạng ngày hiển thị (DD/MM/YYYY)
const formatDateDisplay = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('vi-VN');
};

const defaultForm = {
    code: '',
    description: '',
    discount_percent: 0,
    start_date: new Date().toISOString().split('T')[0], // Hôm nay
    end_date: '',
    usage_limit: 100,
    is_active: true
};

const DiscountManager: React.FC = () => {
    const [discounts, setDiscounts] = useState<Discount[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Modal & Form
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState<number | null>(null);
    const [formData, setFormData] = useState(defaultForm);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => { fetchDiscounts(); }, []);

    const fetchDiscounts = async () => {
        setLoading(true);
        try {
            const data = await discountService.getAll();
            setDiscounts(data);
        } catch (error) { console.error(error); }
        setLoading(false);
    };

    // Mở Modal
    const handleOpenModal = (discount?: Discount) => {
        if (discount) {
            setIsEditing(true);
            setCurrentId(discount.id);
            setFormData({
                code: discount.code,
                description: discount.description || '',
                discount_percent: discount.discount_percent,
                start_date: formatDateInput(discount.start_date),
                end_date: formatDateInput(discount.end_date),
                usage_limit: discount.usage_limit,
                is_active: discount.is_active
            });
        } else {
            setIsEditing(false);
            setCurrentId(null);
            setFormData(defaultForm);
        }
        setShowModal(true);
    };

    // Submit
    const handleSubmit = async () => {
        if (!formData.code || !formData.discount_percent || !formData.end_date) {
            return alert("Vui lòng nhập đủ thông tin bắt buộc (*)");
        }
        
        setIsSubmitting(true);
        try {
            const payload = {
                ...formData,
                discount_percent: Number(formData.discount_percent),
                usage_limit: Number(formData.usage_limit)
            };

            if (isEditing && currentId) {
                // API update chưa được viết trong discountRoutes (nếu chưa có thì cần bổ sung PUT)
                // Ở đây giả sử bạn đã có hoặc dùng logic create đè lên
                // Nếu chưa có API PUT thì chỉ Create được thôi.
                // Nhưng với backend tôi gửi trước đó thì chưa có PUT, bạn cần thêm PUT vào backend nếu muốn sửa.
                alert("Chức năng cập nhật đang phát triển (Cần API PUT)");
            } else {
                await discountService.create(payload);
                alert("Tạo mã thành công!");
            }
            setShowModal(false);
            fetchDiscounts();
        } catch (error: any) {
            alert("Lỗi: " + (error.message || "Không thành công"));
        }
        setIsSubmitting(false);
    };

    // Xóa
    const handleDelete = async (id: number) => {
        if (!confirm("Bạn chắc chắn muốn xóa mã này?")) return;
        try {
            await discountService.remove(id);
            setDiscounts(prev => prev.filter(d => d.id !== id));
        } catch { alert("Xóa thất bại"); }
    };

    // Helper check trạng thái
    const getStatus = (discount: Discount) => {
        const now = new Date();
        const end = new Date(discount.end_date);
        if (!discount.is_active) return <span className="status-badge inactive">Đã khóa</span>;
        if (now > end) return <span className="status-badge expired">Hết hạn</span>;
        if (discount.used_count >= discount.usage_limit) return <span className="status-badge expired">Hết lượt</span>;
        return <span className="status-badge active">Đang chạy</span>;
    };

    return (
        <div className="discount-manager">
            <div className="dm-header">
                <div className="dm-title"><Ticket size={28} color="#e67e22" /> Quản lý Mã Giảm Giá</div>
                <button className="btn-primary" onClick={() => handleOpenModal()}><Plus size={20} /> Tạo Mã Mới</button>
            </div>

            <div className="dm-table-container">
                <table className="dm-table">
                    <thead>
                        <tr>
                            <th>Mã Code</th>
                            <th>Mức giảm</th>
                            <th>Thời gian áp dụng</th>
                            <th>Lượt dùng</th>
                            <th>Trạng thái</th>
                            <th style={{textAlign:'center'}}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? <tr><td colSpan={6} style={{textAlign:'center'}}>Đang tải...</td></tr> : 
                         discounts.length === 0 ? <tr><td colSpan={6} style={{textAlign:'center', padding:30, color:'#999'}}>Chưa có mã giảm giá nào.</td></tr> :
                         discounts.map(d => (
                            <tr key={d.id}>
                                <td>
                                    <span className="code-badge">{d.code}</span>
                                    <div style={{fontSize:12, color:'#666', marginTop:4}}>{d.description}</div>
                                </td>
                                <td style={{fontWeight:700, color:'#28a745'}}>{d.discount_percent}%</td>
                                <td>
                                    <div style={{fontSize:13, color:'#444'}}>{formatDateDisplay(d.start_date)}</div>
                                    <div style={{fontSize:12, color:'#999'}}>đến {formatDateDisplay(d.end_date)}</div>
                                </td>
                                <td>
                                    <div style={{fontSize:13, fontWeight:600}}>{d.used_count} / {d.usage_limit}</div>
                                    <div className="usage-bar">
                                        <div className="usage-fill" style={{width: `${Math.min((d.used_count/d.usage_limit)*100, 100)}%`}}></div>
                                    </div>
                                </td>
                                <td>{getStatus(d)}</td>
                                <td style={{textAlign:'center'}}>
                                    <button className="btn-icon edit" onClick={() => handleOpenModal(d)}><Edit size={18}/></button>
                                    <button className="btn-icon delete" onClick={() => handleDelete(d.id)}><Trash2 size={18}/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* MODAL */}
            {showModal && (
                <div className="modal-backdrop">
                    <div className="modal-container">
                        <div className="modal-header">
                            <h3 style={{margin:0, display:'flex', alignItems:'center', gap:8, color:'#2c3e50'}}>
                                {isEditing ? <Edit size={20}/> : <Plus size={20}/>}
                                {isEditing ? 'Chỉnh sửa Mã' : 'Tạo Mã Mới'}
                            </h3>
                            <button className="btn-icon" onClick={() => setShowModal(false)}><X size={20}/></button>
                        </div>
                        <div className="modal-body">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">Mã Code <span style={{color:'red'}}>*</span></label>
                                    <input 
                                        className="form-input" 
                                        placeholder="VD: TET2025"
                                        value={formData.code}
                                        // Tự động viết hoa
                                        onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
                                        disabled={isEditing} // Không cho sửa mã khi đang edit
                                        style={{fontWeight:'bold', letterSpacing:1}}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Mức giảm (%) <span style={{color:'red'}}>*</span></label>
                                    <div style={{position:'relative'}}>
                                        <input 
                                            type="number" className="form-input" 
                                            value={formData.discount_percent}
                                            onChange={e => setFormData({...formData, discount_percent: Number(e.target.value)})}
                                            min={1} max={100}
                                        />
                                        <Percent size={16} style={{position:'absolute', right:10, top:12, color:'#999'}}/>
                                    </div>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Mô tả</label>
                                <textarea 
                                    className="form-textarea" 
                                    placeholder="VD: Giảm giá cho khách hàng mới..."
                                    value={formData.description}
                                    onChange={e => setFormData({...formData, description: e.target.value})}
                                    style={{minHeight:60, resize:'vertical'}}
                                />
                            </div>

                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">Ngày bắt đầu <span style={{color:'red'}}>*</span></label>
                                    <div style={{position:'relative'}}>
                                        <input 
                                            type="date" className="form-input" 
                                            value={formData.start_date}
                                            onChange={e => setFormData({...formData, start_date: e.target.value})}
                                        />
                                        <Calendar size={16} style={{position:'absolute', right:10, top:12, color:'#999', pointerEvents:'none'}}/>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Ngày kết thúc <span style={{color:'red'}}>*</span></label>
                                    <div style={{position:'relative'}}>
                                        <input 
                                            type="date" className="form-input" 
                                            value={formData.end_date}
                                            onChange={e => setFormData({...formData, end_date: e.target.value})}
                                        />
                                        <Calendar size={16} style={{position:'absolute', right:10, top:12, color:'#999', pointerEvents:'none'}}/>
                                    </div>
                                </div>
                            </div>

                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">Giới hạn lượt dùng</label>
                                    <div style={{position:'relative'}}>
                                        <input 
                                            type="number" className="form-input" 
                                            value={formData.usage_limit}
                                            onChange={e => setFormData({...formData, usage_limit: Number(e.target.value)})}
                                        />
                                        <Users size={16} style={{position:'absolute', right:10, top:12, color:'#999'}}/>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Trạng thái</label>
                                    <select 
                                        className="form-select"
                                        value={formData.is_active ? 'true' : 'false'}
                                        onChange={e => setFormData({...formData, is_active: e.target.value === 'true'})}
                                    >
                                        <option value="true">Kích hoạt</option>
                                        <option value="false">Tạm khóa</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setShowModal(false)}>Hủy</button>
                            <button className="btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
                                {isSubmitting ? 'Đang lưu...' : <><Save size={18}/> Lưu Mã</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DiscountManager;