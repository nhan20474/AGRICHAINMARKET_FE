import React, { useState, useEffect } from 'react';
import { Search, PlusCircle, Edit, Trash2, Image as ImageIcon, X, AlertCircle } from 'lucide-react';
import { productService, Product } from '../../services/productService';
import { categoryService, Category } from '../../services/categoryService';

// Form mặc định (Tất cả đều là string để dễ bind vào input)
const extendedDefaultForm = {
    name: '', 
    description: '', 
    price: '', 
    sale_price: '',   
    sale_percent: '', 
    quantity: '', 
    unit: 'kg', 
    image_url: '', 
    category_id: ''
};

const ProductManagementSection: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<number | null>(null);

    // State UI
    const [filterTerm, setFilterTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [form, setForm] = useState(extendedDefaultForm);
    const [uploading, setUploading] = useState(false);
    const [notify, setNotify] = useState('');

    // 1. INIT DATA
    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const uid = Number(JSON.parse(userStr).id);
            setUserId(uid);
            loadData(uid);
        }
    }, []);

    const loadData = async (id: number) => {
        setLoading(true);
        try {
            const [prods, cats] = await Promise.all([
                productService.getAll({ seller_id: id }),
                categoryService.getAll()
            ]);
            // Lọc sản phẩm của seller (để chắc chắn) và chưa bị xóa
            const myProds = prods.filter(p => Number(p.seller_id) === id && p.status !== 'deleted');
            setProducts(myProds);
            setCategories(cats);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    // 2. LOGIC TÍNH GIÁ THÔNG MINH
    // Khi nhập Giá Gốc
    const handlePriceChange = (val: string) => {
        const original = Number(val);
        const percent = Number(form.sale_percent) || 0;
        
        let newSalePrice = original;
        if (percent > 0) {
            newSalePrice = original * (1 - percent / 100);
        }

        setForm({ 
            ...form, 
            price: val, 
            sale_price: String(Math.round(newSalePrice)) 
        });
    };

    // Khi nhập % Giảm
    const handlePercentChange = (val: string) => {
        const percent = Number(val);
        const original = Number(form.price) || 0;
        
        const sale = original * (1 - percent / 100);

        setForm({ 
            ...form, 
            sale_percent: val,
            sale_price: String(Math.round(sale))
        });
    };

    // Khi nhập Giá Bán trực tiếp
    const handleSalePriceChange = (val: string) => {
        const sale = Number(val);
        const original = Number(form.price) || 0;
        
        let percent = 0;
        if (original > 0 && sale < original) {
            percent = Math.round(((original - sale) / original) * 100);
        }

        setForm({ 
            ...form, 
            sale_price: val,
            sale_percent: percent > 0 ? String(percent) : ''
        });
    };

    // 3. UPLOAD ẢNH
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append('file', file);
            const res = await fetch('http://localhost:3000/api/upload', { method: 'POST', body: fd });
            const data = await res.json();
            const url = data.fileUrl || data.url;
            if (url) setForm(prev => ({ ...prev, image_url: url }));
        } catch { alert("Lỗi upload ảnh"); }
        setUploading(false);
    };

    // 4. SUBMIT FORM
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId) return;

        const fd = new FormData();
        fd.append('name', form.name);
        fd.append('description', form.description);
        fd.append('price', String(form.price));
        fd.append('sale_price', String(form.sale_price ? form.sale_price : form.price));
        fd.append('quantity', String(form.quantity));
        fd.append('unit', form.unit || 'kg');
        fd.append('category_id', String(form.category_id));
        fd.append('seller_id', String(userId));
        fd.append('image_url', form.image_url);

        try {
            if (editId) {
                await productService.update(editId, fd);
                setNotify("Cập nhật thành công!");
            } else {
                await productService.create(fd);
                setNotify("Thêm sản phẩm thành công!");
            }
            setShowForm(false);
            setForm(extendedDefaultForm);
            setEditId(null);
            loadData(userId);
        } catch (err: any) {
            alert("Lỗi: " + (err.message || "Không thành công"));
        }
        setTimeout(() => setNotify(''), 3000);
    };

    // 5. MỞ FORM EDIT
    const openEdit = (prod: any) => {
        const price = Number(prod.price);
        const sale = Number(prod.sale_price || prod.price);
        let percent = '';
        
        if (price > 0 && sale < price) {
            percent = String(Math.round(((price - sale) / price) * 100));
        }

        setForm({
            name: prod.name,
            description: prod.description || '',
            price: String(prod.price),
            sale_price: String(prod.sale_price || prod.price),
            sale_percent: percent, 
            quantity: String(prod.quantity),
            unit: prod.unit || 'kg',
            image_url: prod.image_url || '',
            category_id: String(prod.category_id || '')
        });
        setEditId(prod.id);
        setShowForm(true);
    };

    // 6. XÓA
    const handleDelete = async (id: number) => {
        if (!confirm("Bạn chắc chắn muốn xóa sản phẩm này?")) return;
        try {
            await productService.remove(id);
            if(userId) loadData(userId);
            setNotify("Đã xóa sản phẩm!");
            setTimeout(() => setNotify(''), 3000);
        } catch (e) { alert("Lỗi xóa sản phẩm"); }
    };

    const filteredList = products.filter(p => p.name.toLowerCase().includes(filterTerm.toLowerCase()));

    const getStatusBadge = (status: string) => {
        switch(status) {
            case 'available': return <span style={{background:'#d4edda', color:'#155724', padding:'4px 10px', borderRadius:20, fontSize:12, fontWeight:600}}>Đang bán</span>;
            case 'pending_approval': return <span style={{background:'#fff3cd', color:'#856404', padding:'4px 10px', borderRadius:20, fontSize:12, fontWeight:600}}>Chờ duyệt</span>;
            case 'out_of_stock': return <span style={{background:'#f8d7da', color:'#721c24', padding:'4px 10px', borderRadius:20, fontSize:12, fontWeight:600}}>Hết hàng</span>;
            case 'rejected': return <span style={{background:'#e2e3e5', color:'#383d41', padding:'4px 10px', borderRadius:20, fontSize:12, fontWeight:600}}>Từ chối</span>;
            default: return <span style={{background:'#eee', padding:'4px 10px', borderRadius:20, fontSize:12}}>{status}</span>;
        }
    };

    const formatPrice = (price: any) => Number(price).toLocaleString('vi-VN') + 'đ';

    return (
        <div className="product-management-section fade-in">
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:20}}>
                <h2 className="section-title" style={{margin:0, fontSize:24, color:'#2c3e50'}}>📦 Kho sản phẩm của bạn</h2>
            </div>

            {/* TOOLBAR */}
            <div className="product-filter-bar" style={{background:'#fff', padding:15, borderRadius:12, display:'flex', gap:10, marginBottom:20, boxShadow:'0 2px 8px rgba(0,0,0,0.05)'}}>
                <div style={{position:'relative', flex:1}}>
                    <Search size={18} style={{position:'absolute', left:12, top:10, color:'#999'}}/>
                    <input type="text" placeholder="Tìm kiếm theo tên..." value={filterTerm} onChange={e=>setFilterTerm(e.target.value)} style={{width:'100%', padding:'10px 10px 10px 38px', borderRadius:8, border:'1px solid #ddd', outline:'none'}}/>
                </div>
                <button onClick={()=>{setEditId(null); setForm(extendedDefaultForm); setShowForm(true)}} style={{background:'#28a745', color:'#fff', border:'none', padding:'0 20px', borderRadius:8, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6}}>
                    <PlusCircle size={18}/> Thêm Mới
                </button>
            </div>

            {/* NOTIFY */}
            {notify && <div style={{padding:10, background:'#e8f5e9', color:'#2e7d32', borderRadius:6, marginBottom:15, fontWeight:500, border:'1px solid #c3e6cb'}}>{notify}</div>}

            {/* TABLE */}
            <div style={{overflowX:'auto', background:'#fff', borderRadius:12, border:'1px solid #eee'}}>
                <table style={{width:'100%', borderCollapse:'collapse', fontSize:14}}>
                    <thead style={{background:'#f8f9fa', color:'#555'}}>
                        <tr>
                            <th style={{padding:15, textAlign:'left'}}>Sản phẩm</th>
                            <th style={{padding:15, textAlign:'left'}}>Danh mục</th>
                            <th style={{padding:15, textAlign:'right'}}>Giá bán</th>
                            <th style={{padding:15, textAlign:'center'}}>Kho</th>
                            <th style={{padding:15, textAlign:'center'}}>Trạng thái</th>
                            <th style={{padding:15, textAlign:'right'}}>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? <tr><td colSpan={6} style={{textAlign:'center', padding:30}}>Đang tải dữ liệu...</td></tr> : 
                         filteredList.length === 0 ? <tr><td colSpan={6} style={{textAlign:'center', padding:30, color:'#999'}}>Chưa có sản phẩm nào.</td></tr> :
                         filteredList.map(p => (
                            <tr key={p.id} style={{borderBottom:'1px solid #eee'}}>
                                <td style={{padding:15}}>
                                    <div style={{display:'flex', alignItems:'center', gap:12}}>
                                        <img src={p.image_url && p.image_url.startsWith('/uploads') ? `http://localhost:3000${p.image_url}` : (p.image_url || '/img/default.jpg')} alt="" style={{width:48, height:48, borderRadius:6, objectFit:'cover', border:'1px solid #eee'}} onError={e => (e.target as HTMLImageElement).src='/img/default.jpg'}/>
                                        <div>
                                            <div style={{fontWeight:600}}>{p.name}</div>
                                            <div style={{fontSize:12, color:'#888'}}>Mã SP: #{p.id}</div>
                                        </div>
                                    </div>
                                </td>
                                <td style={{padding:15}}>{categories.find(c => c.id === p.category_id)?.name || '---'}</td>
                                <td style={{padding:15, textAlign:'right'}}>
                                    {p.sale_price && Number(p.sale_price) < Number(p.price) ? (
                                        <div>
                                            <div style={{color:'#d32f2f', fontWeight:700}}>{formatPrice(p.sale_price)}</div>
                                            <div style={{textDecoration:'line-through', color:'#999', fontSize:12}}>{formatPrice(p.price)}</div>
                                        </div>
                                    ) : (
                                        <div style={{fontWeight:600}}>{formatPrice(p.price)}</div>
                                    )}
                                </td>
                                <td style={{padding:15, textAlign:'center'}}>
                                    <span style={{color: Number(p.quantity)===0?'red':'#333', fontWeight:600}}>{p.quantity}</span> <small>{p.unit}</small>
                                </td>
                                <td style={{padding:15, textAlign:'center'}}>
                                    {getStatusBadge(p.status)}
                                </td>
                                <td style={{padding:15, textAlign:'right'}}>
                                    <div style={{display:'flex', justifyContent:'flex-end', gap:8}}>
                                        <button onClick={() => openEdit(p)} title="Sửa" style={{background:'#e3f2fd', color:'#1976d2', border:'none', padding:8, borderRadius:6, cursor:'pointer'}}><Edit size={16}/></button>
                                        <button onClick={() => handleDelete(p.id)} title="Xóa" style={{background:'#ffebee', color:'#c62828', border:'none', padding:8, borderRadius:6, cursor:'pointer'}}><Trash2 size={16}/></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* MODAL FORM (THÊM/SỬA) */}
            {showForm && (
                <div className="modal-backdrop" style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1100}}>
                    <div className="modal-container" style={{background:'#fff', padding:30, borderRadius:12, width:750, maxWidth:'95%', maxHeight:'90vh', overflowY:'auto', boxShadow:'0 10px 40px rgba(0,0,0,0.2)', position:'relative'}}>
                        
                        <button onClick={() => setShowForm(false)} style={{position: 'absolute', top: 15, right: 15, background: 'transparent', border: 'none', cursor: 'pointer', color: '#999'}}><X size={24} /></button>
                        
                        <h3 style={{marginTop: 0, marginBottom: 20, color: '#2c3e50', fontSize: 20}}>{editId ? '✏️ Cập nhật sản phẩm' : '✨ Thêm sản phẩm mới'}</h3>
                        
                        <form onSubmit={handleSubmit}>
                            <div style={{display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 24}}>
                                {/* Cột Trái: Thông tin chính */}
                                <div style={{display: 'flex', flexDirection: 'column', gap: 16}}>
                                    <div className="form-group">
                                        <label style={{fontWeight: 600, fontSize: 14, display: 'block', marginBottom: 6, color:'#444'}}>Tên sản phẩm <span style={{color: 'red'}}>*</span></label>
                                        <input className="form-control" required value={form.name} onChange={e=>setForm({...form, name:e.target.value})} style={{width:'100%', padding:10, border:'1px solid #ddd', borderRadius:6}} placeholder="Ví dụ: Cà chua bi Đà Lạt" />
                                    </div>
                                    
                                    {/* KHU VỰC GIÁ THÔNG MINH */}
                                    <div style={{background: '#f8f9fa', padding: 15, borderRadius: 8, border: '1px solid #eee'}}>
                                        <div style={{fontWeight: 600, fontSize: 14, marginBottom: 10, color: '#28a745', display:'flex', alignItems:'center', gap:5}}>💲 Thiết lập giá bán</div>
                                        <div style={{display: 'grid', gridTemplateColumns: '1fr 0.6fr 1fr', gap: 10, alignItems: 'end'}}>
                                            <div className="form-group">
                                                <label style={{fontWeight: 600, fontSize: 13, display: 'block', marginBottom: 4}}>Giá Niêm Yết</label>
                                                <input type="number" value={form.price} onChange={e => handlePriceChange(e.target.value)} required min={0} style={{width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ddd'}} placeholder="0" />
                                            </div>
                                            <div className="form-group">
                                                <label style={{fontWeight: 600, fontSize: 13, display: 'block', marginBottom: 4}}>Giảm (%)</label>
                                                <input type="number" value={form.sale_percent} onChange={e => handlePercentChange(e.target.value)} min={0} max={100} style={{width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ddd', textAlign:'center'}} placeholder="0%" />
                                            </div>
                                            <div className="form-group">
                                                <label style={{fontWeight: 600, fontSize: 13, display: 'block', marginBottom: 4, color: '#d32f2f'}}>Giá Bán Ra</label>
                                                <input type="number" value={form.sale_price} onChange={e => handleSalePriceChange(e.target.value)} min={0} style={{width: '100%', padding: 8, borderRadius: 6, border: '1px solid #d32f2f', fontWeight: 'bold', color: '#d32f2f'}} placeholder="0" />
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{display: 'flex', gap: 15}}>
                                        <div style={{flex:1}}><label style={{fontWeight: 600, fontSize: 14, display: 'block', marginBottom: 6, color:'#444'}}>Số lượng <span style={{color: 'red'}}>*</span></label>
                                        <input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} required min={0} style={{width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ddd'}} /></div>
                                        <div style={{width:100}}><label style={{fontWeight: 600, fontSize: 14, display: 'block', marginBottom: 6, color:'#444'}}>Đơn vị</label>
                                            <select value={form.unit || 'kg'} onChange={e => setForm({ ...form, unit: e.target.value })} style={{width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ddd', background:'#fff'}}>
                                                <option value="kg">Kg</option><option value="gram">Gram</option><option value="trai">Trái</option><option value="bo">Bó</option><option value="hop">Hộp</option><option value="tui">Túi</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label style={{fontWeight: 600, fontSize: 14, display: 'block', marginBottom: 6, color:'#444'}}>Danh mục <span style={{color: 'red'}}>*</span></label>
                                        <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} required style={{width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ddd', background:'#fff'}}>
                                            <option value="">-- Chọn danh mục --</option>
                                            {categories.map((cat: any) => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                                        </select>
                                    </div>
                                </div>

                                {/* Cột Phải: Ảnh & Mô tả */}
                                <div style={{display: 'flex', flexDirection: 'column', gap: 16}}>
                                    <div className="form-group">
                                        <label style={{fontWeight: 600, fontSize: 14, display: 'block', marginBottom: 6, color:'#444'}}>Hình ảnh sản phẩm</label>
                                        <div style={{border: '1px dashed #ccc', padding: 20, borderRadius: 8, textAlign:'center', background:'#fafafa'}}>
                                            {form.image_url ? (
                                                <div style={{position:'relative', display:'inline-block'}}>
                                                    <img src={form.image_url.startsWith('/uploads') ? `http://localhost:3000${form.image_url}` : form.image_url} alt="Preview" style={{maxHeight: 180, maxWidth: '100%', borderRadius: 4, border:'1px solid #ddd'}} onError={(e) => e.currentTarget.style.display = 'none'} />
                                                    <button type="button" onClick={() => setForm({...form, image_url: ''})} style={{position:'absolute', top:-10, right:-10, background:'red', color:'white', border:'none', borderRadius:'50%', width:24, height:24, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center'}}><X size={14}/></button>
                                                </div>
                                            ) : (
                                                <>
                                                    <ImageIcon size={48} color="#ccc" style={{marginBottom: 10}} />
                                                    <br/>
                                                    <label htmlFor="file-upload" style={{display: 'inline-block', padding: '8px 16px', background: '#e3f2fd', borderRadius: 6, cursor: 'pointer', fontSize: 13, color: '#007bff', fontWeight: 600}}>📂 Chọn ảnh</label>
                                                    <input type="file" accept="image/*" id="file-upload" onChange={handleImageUpload} style={{display: 'none'}} />
                                                </>
                                            )}
                                            {uploading && <div style={{color: '#28a745', fontSize: 12, marginTop:5}}>⏳ Đang tải lên...</div>}
                                            <p style={{fontSize: 11, color: '#888', margin: 0}}>Hỗ trợ: JPG, PNG (Max 2MB)</p>
                                        </div>
                                    </div>
                                    <div className="form-group" style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
                                        <label style={{fontWeight: 600, fontSize: 14, display: 'block', marginBottom: 6, color:'#444'}}>Mô tả chi tiết</label>
                                        <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{flex: 1, width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ddd', resize: 'vertical', fontFamily: 'inherit'}} placeholder="Mô tả về nguồn gốc, chất lượng, quy trình canh tác..." />
                                    </div>
                                </div>
                            </div>

                            <div style={{marginTop: 30, display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 20, borderTop: '1px solid #eee'}}>
                                <button type="button" onClick={() => setShowForm(false)} style={{background: '#fff', border: '1px solid #ddd', padding: '10px 24px', borderRadius: 6, cursor: 'pointer', color: '#555', fontWeight: 600}}>Hủy bỏ</button>
                                <button type="submit" disabled={uploading} style={{background: uploading ? '#ccc' : '#28a745', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 6, cursor: uploading ? 'not-allowed' : 'pointer', fontWeight: 600, boxShadow: '0 2px 6px rgba(40, 167, 69, 0.3)'}}>
                                    {editId ? 'Lưu thay đổi' : 'Tạo sản phẩm'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductManagementSection;