import React, { useState, useEffect } from "react";
import "./ProductModal.css"; 

interface Props {
    isEditing: boolean;
    formData: any;
    setFormData: any;
    onSave: (formData: FormData) => void;
    onClose: () => void;
    uploading?: boolean;
    sellers?: any[];
    currentRole: string;
    categories?: any[]; // ✅ ĐÃ THÊM DÒNG NÀY ĐỂ SỬA LỖI
}

export default function ProductModal({
    isEditing,
    formData,
    setFormData,
    onSave,
    onClose,
    uploading,
    sellers = [],
    currentRole,
    categories = [], // ✅ Nhận props categories (mặc định là mảng rỗng)
}: Props) {
    const [extraImagesPreview, setExtraImagesPreview] = useState<string[]>([]);
    const [extraImagesFiles, setExtraImagesFiles] = useState<File[]>([]);

    useEffect(() => {
        if (isEditing && formData.extra_images) {
            setExtraImagesPreview(formData.extra_images);
        }
    }, [isEditing, formData]);

    const handleMainImage = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFormData({ ...formData, image_file: file });

        setFormData((prev: any) => ({
            ...prev,
            image_url_preview: URL.createObjectURL(file),
        }));
    };

    const handleExtraImages = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const list = Array.from(files);
        setExtraImagesFiles((prev) => [...prev, ...list]);

        const previews = list.map((f) => URL.createObjectURL(f));
        setExtraImagesPreview((prev) => [...prev, ...previews]);
    };

    const deleteExtraImage = (index: number) => {
        setExtraImagesPreview((p) => p.filter((_, i) => i !== index));
        setExtraImagesFiles((p) => p.filter((_, i) => i !== index));
    };

    const handleSubmit = (e: any) => {
        e.preventDefault();
        const fd = new FormData();

        Object.keys(formData).forEach((key) => {
            if (
                key !== "image_file" &&
                key !== "image_url_preview" &&
                key !== "extra_images"
            ) {
                fd.append(key, formData[key]);
            }
        });

        if (formData.image_file) {
            fd.append("image_url", formData.image_file);
        }

        extraImagesFiles.forEach((file) => {
            fd.append("extra_images", file);
        });

        onSave(fd);
    };

    return (
        <div className="pm-overlay">
            <div className="pm-modal">
                <h2 className="pm-title">
                    {isEditing ? "Cập nhật sản phẩm" : "Thêm sản phẩm mới"}
                </h2>

                <form onSubmit={handleSubmit} className="pm-form">

                    <div className="pm-grid">
                        {/* Tên sản phẩm (Full width) */}
                        <div className="pm-group" style={{ gridColumn: '1 / -1' }}>
                            <label className="pm-label">Tên sản phẩm <span style={{color:'red'}}>*</span></label>
                            <input
                                className="pm-input"
                                value={formData.name || ""}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>

                        {/* --- CẶP GIÁ --- */}
                        <div className="pm-group">
                            <label className="pm-label">Giá gốc (VNĐ) <span style={{color:'red'}}>*</span></label>
                            <input
                                type="number"
                                className="pm-input"
                                value={formData.price || ""}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                required
                                min={0}
                            />
                        </div>

                        <div className="pm-group">
                            <label className="pm-label" style={{color: '#d32f2f'}}>Giá khuyến mãi</label>
                            <input
                                type="number"
                                className="pm-input"
                                value={formData.sale_price || ""}
                                onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                                placeholder="Để trống nếu không giảm"
                                style={{borderColor: '#d32f2f'}}
                                min={0}
                            />
                        </div>
                        {/* ---------------- */}

                        {/* Danh mục & Số lượng */}
                        <div className="pm-group">
                            <label className="pm-label">Danh mục <span style={{color:'red'}}>*</span></label>
                            <select
                                className="pm-input"
                                value={formData.category_id || ""}
                                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                required
                            >
                                <option value="">-- Chọn danh mục --</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="pm-group">
                            <label className="pm-label">Số lượng kho</label>
                            <input
                                type="number"
                                className="pm-input"
                                value={formData.quantity || ""}
                                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                required
                                min={0}
                            />
                        </div>

                        <div className="pm-group">
                            <label className="pm-label">Đơn vị tính</label>
                            <select className="pm-input" value={formData.unit || 'kg'} onChange={(e) => setFormData({ ...formData, unit: e.target.value })}>
                                <option value="kg">Kg</option>
                                <option value="gram">Gram</option>
                                <option value="trai">Trái</option>
                                <option value="bo">Bó</option>
                                <option value="hop">Hộp</option>
                                <option value="tui">Túi</option>
                            </select>
                        </div>

                        {/* Admin chọn Seller */}
                        {currentRole === "admin" && (
                            <div className="pm-group">
                                <label className="pm-label">Người bán</label>
                                <select
                                    className="pm-input"
                                    value={formData.seller_id || ""}
                                    onChange={(e) => setFormData({ ...formData, seller_id: e.target.value })}
                                >
                                    <option value="">-- Chọn người bán --</option>
                                    {sellers.map((s) => (
                                        <option key={s.id} value={s.id}>{s.full_name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Mô tả */}
                    <div className="pm-group full-width" style={{marginTop: 15}}>
                        <label className="pm-label">Mô tả chi tiết</label>
                        <textarea
                            className="pm-input"
                            rows={4}
                            value={formData.description || ""}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            style={{resize:'vertical'}}
                        />
                    </div>

                    {/* Ảnh Chính */}
                    <div className="pm-group full-width" style={{marginTop: 15}}>
                        <label className="pm-label">Ảnh đại diện</label>
                        <input type="file" onChange={handleMainImage} accept="image/*" />
                        {(formData.image_url_preview || formData.image_url) && (
                            <img
                                src={formData.image_url_preview || (formData.image_url?.startsWith('/uploads') ? `http://localhost:3000${formData.image_url}` : formData.image_url)}
                                className="pm-main-image"
                                alt="Preview"
                                onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                            />
                        )}
                    </div>

                    {/* Ảnh Phụ */}
                    <div className="pm-group full-width">
                        <label className="pm-label">Ảnh phụ (Chọn nhiều)</label>
                        <input type="file" multiple onChange={handleExtraImages} accept="image/*" />
                        <div className="pm-extra-grid">
                            {extraImagesPreview.map((img, idx) => (
                                <div key={idx} className="pm-extra-item">
                                    <img src={img.startsWith('blob:') ? img : (img.startsWith('/uploads') ? `http://localhost:3000${img}` : img)} className="pm-extra-img" alt="Extra" />
                                    <button type="button" className="pm-delete-extra" onClick={() => deleteExtraImage(idx)}>×</button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {uploading && <p className="pm-uploading">Đang lưu dữ liệu...</p>}

                    <div className="pm-footer">
                        <button type="button" className="pm-btn cancel" onClick={onClose}>Hủy</button>
                        <button type="submit" className="pm-btn submit" disabled={uploading}>
                            {uploading ? "Đang xử lý..." : (isEditing ? "Lưu thay đổi" : "Thêm sản phẩm")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}