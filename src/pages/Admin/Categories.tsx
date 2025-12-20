import React, { useEffect, useState } from 'react';

interface Category {
    id: number;
    name: string;
    description?: string;
}

const API_BASE = 'http://localhost:3000/api/categories';

const Categories: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [notify, setNotify] = useState('');
    const [form, setForm] = useState({ name: '', description: '' });
    const [editId, setEditId] = useState<number | null>(null);

    async function fetchCategories() {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(API_BASE);
            if (!res.ok) throw new Error('Không thể lấy danh mục');
            const data = await res.json();
            setCategories(Array.isArray(data) ? data : []);
        } catch (err: any) {
            setError(err.message || 'Lỗi khi tải danh mục');
        }
        setLoading(false);
    }

    async function addCategory(e: React.FormEvent) {
        e.preventDefault();
        setNotify('');
        try {
            const res = await fetch(API_BASE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            if (!res.ok) throw new Error('Thêm danh mục thất bại');
            setNotify('Thêm danh mục thành công!');
            setForm({ name: '', description: '' });
            await fetchCategories();
        } catch (err: any) {
            setNotify(err.message || 'Thêm danh mục thất bại');
        }
        setTimeout(() => setNotify(''), 1200);
    }

    async function updateCategory(e: React.FormEvent) {
        e.preventDefault();
        if (!editId) return;
        setNotify('');
        try {
            const res = await fetch(`${API_BASE}/${editId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            if (!res.ok) throw new Error('Cập nhật danh mục thất bại');
            setNotify('Cập nhật danh mục thành công!');
            setForm({ name: '', description: '' });
            setEditId(null);
            await fetchCategories();
        } catch (err: any) {
            setNotify(err.message || 'Cập nhật danh mục thất bại');
        }
        setTimeout(() => setNotify(''), 1200);
    }

    async function deleteCategory(id: number) {
        if (!window.confirm('Bạn có chắc chắn muốn xóa danh mục này không?')) return;

        setNotify('');
        try {
            const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
            const data = await res.json();

            if (!res.ok) {
                // 🔴 Có sản phẩm trong danh mục
                if (data?.error?.includes('Không thể xóa')) {
                    setNotify(`⚠️ ${data.error}`);
                    return;
                }
                throw new Error(data.error || 'Xóa danh mục thất bại');
            }

            setNotify('✅ Xóa danh mục thành công!');
            await fetchCategories();

        } catch (err: any) {
            setNotify(err.message || 'Xóa danh mục thất bại');
        }

        setTimeout(() => setNotify(''), 2000);
    }

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const startEdit = (cat: Category) => {
        setEditId(cat.id);
        setForm({ name: cat.name, description: cat.description || '' });
    };

    return (
        <div style={{maxWidth:700, margin:'32px auto', background:'#fff', borderRadius:8, boxShadow:'0 2px 12px rgba(0,0,0,0.08)', padding:32}}>
            <h2 style={{marginBottom:24}}>Quản lý danh mục sản phẩm</h2>
            {loading && <div>Đang tải danh mục...</div>}
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

            <form onSubmit={editId ? updateCategory : addCategory} style={{marginBottom:24}}>
                <h3>{editId ? 'Cập nhật danh mục' : 'Thêm mới danh mục'}</h3>
                <div style={{marginBottom:12}}>
                    <label>Tên danh mục *</label>
                    <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        required
                        style={{width:'100%', padding:'8px', borderRadius:4, border:'1px solid #ccc'}}
                    />
                </div>
                <div style={{marginBottom:12}}>
                    <label>Mô tả</label>
                    <textarea
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        style={{width:'100%', padding:'8px', borderRadius:4, border:'1px solid #ccc'}}
                    />
                </div>
                <button
                    type="submit"
                    style={{background:'#38b000', color:'#fff', border:'none', borderRadius:6, padding:'10px 24px', fontWeight:600, cursor:'pointer'}}
                >
                    {editId ? 'Cập nhật' : 'Thêm mới'}
                </button>
                {editId && (
                    <button
                        type="button"
                        style={{marginLeft:12, background:'#eee', color:'#333', border:'none', borderRadius:6, padding:'10px 24px', cursor:'pointer'}}
                        onClick={() => { setEditId(null); setForm({ name: '', description: '' }); }}
                    >
                        Hủy
                    </button>
                )}
            </form>

            <table style={{width:'100%', borderCollapse:'collapse'}}>
                <thead>
                    <tr style={{background:'#f6fff2'}}>
                        <th style={{padding:8, border:'1px solid #eee'}}>ID</th>
                        <th style={{padding:8, border:'1px solid #eee'}}>Tên danh mục</th>
                        <th style={{padding:8, border:'1px solid #eee'}}>Mô tả</th>
                        <th style={{padding:8, border:'1px solid #eee'}}>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    {categories.length === 0 ? (
                        <tr>
                            <td colSpan={4} style={{textAlign:'center', padding:24}}>Không có danh mục nào.</td>
                        </tr>
                    ) : (
                        [...categories]
                            .sort((a, b) => a.id - b.id)
                            .map(cat => (
                                <tr key={cat.id}>
                                    <td style={{padding:8, border:'1px solid #eee'}}>{cat.id}</td>
                                    <td style={{padding:8, border:'1px solid #eee'}}>{cat.name}</td>
                                    <td style={{padding:8, border:'1px solid #eee'}}>{cat.description}</td>
                                    <td style={{padding:8, border:'1px solid #eee'}}>
                                        <button
                                            style={{marginRight:8, background:'#1976d2', color:'#fff', border:'none', borderRadius:4, padding:'6px 14px', cursor:'pointer'}}
                                            onClick={() => startEdit(cat)}
                                        >
                                            Sửa
                                        </button>
                                        <button
                                            style={{background:'#D32F2F', color:'#fff', border:'none', borderRadius:4, padding:'6px 14px', cursor:'pointer'}}
                                            onClick={() => deleteCategory(cat.id)}
                                        >
                                            Xóa
                                        </button>
                                    </td>
                                </tr>
                            ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default Categories;
