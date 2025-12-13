import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Plus, Layers, X, Save, Upload, Image as ImageIcon, AlertCircle, Monitor, Type, Link as LinkIcon, Tag } from 'lucide-react';
import { panelService, Panel } from '../../services/panelService';
import { categoryService, Category } from '../../services/categoryService'; // 1. Import Category Service
import '../../styles/PanelManager.css';

const defaultForm = {
    name: '',
    type: 'banner', // banner | slider | categories | product_list | ads
    status: 'active',
    
    // Các trường nội dung
    title: '',
    subtitle: '',
    buttonText: '',
    buttonLink: '',
    categoryId: '', 
};

const PanelManager: React.FC = () => {
    const [panels, setPanels] = useState<Panel[]>([]);
    const [categories, setCategories] = useState<Category[]>([]); // 2. State lưu danh mục
    const [loading, setLoading] = useState(true);
    
    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState<number | null>(null);
    
    // Form & Image State
    const [formData, setFormData] = useState(defaultForm);
    const [existingImages, setExistingImages] = useState<string[]>([]);
    const [newFiles, setNewFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Load dữ liệu ban đầu
    useEffect(() => {
        fetchPanels();
        fetchCategories(); // Gọi hàm lấy danh mục
    }, []);

    const fetchPanels = async () => {
        setLoading(true);
        try {
            const data = await panelService.getAll();
            setPanels(data);
        } catch (error) { console.error(error); }
        setLoading(false);
    };

    // Hàm lấy danh mục
    const fetchCategories = async () => {
        try {
            const data = await categoryService.getAll();
            setCategories(data);
        } catch (error) { console.error("Lỗi lấy danh mục:", error); }
    };

    // Mở Modal
    const handleOpenModal = (panel?: Panel) => {
        setNewFiles([]);
        setPreviewUrls([]);
        
        if (panel) {
            setIsEditing(true);
            setCurrentId(panel.id);
            setExistingImages(panel.images || []);
            
            const content = panel.content || {};
            
            setFormData({
                name: panel.name,
                type: panel.page,
                status: 'active',
                title: content.title || '',
                subtitle: content.subtitle || '',
                buttonText: content.button_text || '',
                buttonLink: content.button_link || '',
                categoryId: content.category_id ? String(content.category_id) : '',
            });
        } else {
            setIsEditing(false);
            setCurrentId(null);
            setExistingImages([]);
            setFormData(defaultForm);
        }
        setShowModal(true);
    };

    // Xử lý file ảnh
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const filesArray = Array.from(e.target.files);
            setNewFiles(prev => [...prev, ...filesArray]);
            const newPreviews = filesArray.map(file => URL.createObjectURL(file));
            setPreviewUrls(prev => [...prev, ...newPreviews]);
        }
    };

    const handleRemoveExistingImage = (imgUrl: string) => {
        setExistingImages(prev => prev.filter(img => img !== imgUrl));
    };

    const handleRemoveNewFile = (index: number) => {
        setNewFiles(prev => prev.filter((_, i) => i !== index));
        setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    };

    // Xử lý Lưu
    // 4. XỬ LÝ LƯU (Đã sửa lỗi lưu ảnh)
    const handleSubmit = async () => {
        if (!formData.name.trim()) return alert("Vui lòng nhập tên Panel");
        
        setIsSubmitting(true);
        try {
            // A. Gom dữ liệu vào cấu trúc JSON content
            let contentJson: any = {};

            if (formData.type === 'categories' || formData.type === 'product_list') {
                contentJson.category_id = formData.categoryId ? Number(formData.categoryId) : null;
                if(formData.title) contentJson.title = formData.title;
            } 
            else {
                contentJson = {
                    title: formData.title,
                    subtitle: formData.subtitle,
                    button_text: formData.buttonText,
                    button_link: formData.buttonLink
                };
            }

            // B. Gọi API (Xử lý riêng cho Create và Update để khớp định dạng Service)
            if (isEditing && currentId) {
                // --- CẬP NHẬT ---
                await panelService.update(currentId, {
                    name: formData.name,
                    page: formData.type,
                    description: `Loại: ${formData.type}`,
                    content: contentJson,
                    old_images: existingImages, // Danh sách ảnh cũ giữ lại
                    new_files: newFiles         // Ảnh mới upload (Service dùng key: new_files)
                });
                alert("Cập nhật thành công!");
            } else {
                // --- TẠO MỚI ---
                await panelService.create({
                    name: formData.name,
                    page: formData.type,
                    description: `Loại: ${formData.type}`,
                    content: contentJson,
                    files: newFiles             // QUAN TRỌNG: Service create dùng key 'files', không phải 'new_files'
                });
                alert("Thêm mới thành công!");
            }

            setShowModal(false);
            fetchPanels(); // Refresh list
        } catch (error: any) {
            console.error(error);
            alert("Lỗi: " + (error.message || "Không thể lưu panel"));
        }
        setIsSubmitting(false);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Bạn chắc chắn muốn xóa Panel này?")) return;
        try {
            await panelService.remove(id);
            setPanels(prev => prev.filter(p => p.id !== id));
        } catch (error) { alert("Xóa thất bại"); }
    };

    return (
        <div className="panel-manager">
            {/* Header */}
            <div className="pm-header">
                <div className="pm-title"><Layers size={28} color="#28a745" /> Quản lý Giao diện</div>
                <button className="btn-primary" onClick={() => handleOpenModal()}><Plus size={20} /> Thêm Panel</button>
            </div>

            {/* Table */}
            <div className="panel-table-container">
                <table className="panel-table">
                    <thead>
                        <tr>
                            <th>#ID</th>
                            <th>Tên Panel</th>
                            <th>Loại</th>
                            <th>Ảnh</th>
                            <th>Nội dung (Preview)</th>
                            <th style={{textAlign:'center'}}>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? <tr><td colSpan={6} style={{textAlign:'center'}}>Đang tải...</td></tr> : 
                         panels.length === 0 ? <tr><td colSpan={6} style={{textAlign:'center'}}>Chưa có panel nào.</td></tr> : (
                            panels.map(p => (
                                <tr key={p.id}>
                                    <td>#{p.id}</td>
                                    <td>
                                        <strong>{p.name}</strong>
                                        <div style={{fontSize:12, color:'#888', marginTop:4}}>{p.description}</div>
                                    </td>
                                    <td><span className="type-badge">{p.page}</span></td>
                                    <td>
                                        <div style={{display:'flex', gap:5}}>
                                            {p.images && p.images.slice(0, 3).map((img, i) => (
                                                <img key={i} src={img.startsWith('http') ? img : `http://localhost:3000${img}`} alt="" style={{width:40, height:40, objectFit:'cover', borderRadius:4, border:'1px solid #eee'}} />
                                            ))}
                                            {p.images && p.images.length > 3 && <span style={{fontSize:12, alignSelf:'center', color:'#666'}}>+{p.images.length - 3}</span>}
                                        </div>
                                    </td>
                                    <td style={{fontSize:13, color:'#555', maxWidth:250}}>
                                        {(p.page === 'categories' || p.page === 'product_list') ? (
                                            <div style={{display:'flex', alignItems:'center', gap:5}}>
                                                <Tag size={12}/> Cat ID: <b>{p.content?.category_id}</b>
                                            </div>
                                        ) : (
                                            <div>
                                                <div style={{fontWeight:600}}>{p.content?.title}</div>
                                                <div style={{color:'#888'}}>{p.content?.subtitle}</div>
                                            </div>
                                        )}
                                    </td>
                                    <td style={{textAlign:'center'}}>
                                        <button className="btn-icon edit" onClick={() => handleOpenModal(p)}><Edit size={18} /></button>
                                        <button className="btn-icon delete" onClick={() => handleDelete(p.id)}><Trash2 size={18} /></button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* MODAL FORM */}
            {showModal && (
                <div className="modal-backdrop">
                    <div className="modal-container">
                        
                        <div className="modal-header">
                            <h3 className="modal-title">
                                {isEditing ? <Edit size={22} color="#28a745"/> : <Plus size={22} color="#28a745"/>} 
                                {isEditing ? 'Chỉnh sửa Panel' : 'Tạo Panel Mới'}
                            </h3>
                            <button className="modal-close-btn" onClick={() => setShowModal(false)}><X size={24}/></button>
                        </div>

                        <div className="modal-body">
                            <div className="form-section-title"><Monitor size={18}/> Cấu hình chung</div>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">Tên Panel <span className="required">*</span></label>
                                    <input className="form-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="VD: Banner Trang Chủ..." />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Loại Panel</label>
                                    <select className="form-select" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                                        <option value="banner">Banner Chính</option>
                                        <option value="slider">Slider Chạy</option>
                                        <option value="categories">Danh mục nổi bật</option>
                                        <option value="product_list">Danh sách sản phẩm</option>
                                        <option value="ads">Quảng cáo nhỏ</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-divider"></div>

                            <div className="form-section-title"><Type size={18}/> Nội dung hiển thị</div>
                            
                            {/* 3. FORM CHỌN DANH MỤC (DROPDOWN) */}
                            {(formData.type === 'categories' || formData.type === 'product_list') ? (
                                <div className="form-group">
                                    <label className="form-label">Chọn Danh Mục</label>
                                    <select 
                                        className="form-select" 
                                        value={formData.categoryId} 
                                        onChange={e => setFormData({...formData, categoryId: e.target.value})}
                                    >
                                        <option value="">-- Chọn danh mục hiển thị --</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.name} (ID: {cat.id})
                                            </option>
                                        ))}
                                    </select>
                                    
                                    {formData.type === 'product_list' && (
                                        <div style={{marginTop: 15}}>
                                             <label className="form-label">Tiêu đề danh sách</label>
                                             <input className="form-input" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="VD: Rau củ tươi ngon..." />
                                        </div>
                                    )}
                                </div>
                            ) : (
                                // Form cho Banner/Slider/Ads
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label className="form-label">Tiêu đề lớn</label>
                                        <input className="form-input" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="VD: Khuyến mãi Tết 2025" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Phụ đề (Subtitle)</label>
                                        <input className="form-input" value={formData.subtitle} onChange={e => setFormData({...formData, subtitle: e.target.value})} placeholder="VD: Giảm giá đến 50%" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Chữ trên nút</label>
                                        <input className="form-input" value={formData.buttonText} onChange={e => setFormData({...formData, buttonText: e.target.value})} placeholder="VD: Mua ngay" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Link liên kết</label>
                                        <div style={{position:'relative'}}>
                                            <input className="form-input" value={formData.buttonLink} onChange={e => setFormData({...formData, buttonLink: e.target.value})} placeholder="VD: /khuyen-mai" style={{paddingLeft: 36}} />
                                            <LinkIcon size={16} style={{position:'absolute', left:12, top:12, color:'#999'}}/>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="form-divider"></div>

                            {/* Upload Ảnh */}
                            <div className="form-section-title"><ImageIcon size={18}/> Hình ảnh</div>
                            <div className="img-upload-box">
                                <input type="file" id="panel-imgs" multiple hidden onChange={handleFileChange} accept="image/*" />
                                <label htmlFor="panel-imgs" className="upload-label">
                                    <div className="upload-icon-wrapper"><Upload size={24}/></div>
                                    <span className="upload-text">Nhấn để tải ảnh lên</span>
                                    <span className="upload-hint">(Hỗ trợ JPG, PNG, WebP)</span>
                                </label>
                            </div>

                            <div className="img-grid">
                                {existingImages.map((img, idx) => (
                                    <div key={`old-${idx}`} className="img-preview-wrapper">
                                        <img src={img.startsWith('http') ? img : `http://localhost:3000${img}`} className="img-preview" alt="old" />
                                        <button className="remove-img-btn" onClick={() => handleRemoveExistingImage(img)}><X size={14}/></button>
                                        <div className="img-tag">Đã lưu</div>
                                    </div>
                                ))}
                                {previewUrls.map((url, idx) => (
                                    <div key={`new-${idx}`} className="img-preview-wrapper" style={{borderColor: '#28a745'}}>
                                        <img src={url} className="img-preview" alt="new" />
                                        <button className="remove-img-btn" onClick={() => handleRemoveNewFile(idx)}><X size={14}/></button>
                                        <div className="img-tag" style={{background: 'rgba(40, 167, 69, 0.8)'}}>Mới</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setShowModal(false)}>Hủy bỏ</button>
                            <button className="btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
                                {isSubmitting ? 'Đang lưu...' : <><Save size={18}/> Lưu thay đổi</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PanelManager;