import React, { useState, useEffect } from 'react';
import { Leaf, Image as ImageIcon, Loader, X } from 'lucide-react';
import "../styles/AddLogModal.css";

interface AddLogModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    isSubmitting: boolean;
}

const AddLogModal: React.FC<AddLogModalProps> = ({ isOpen, onClose, onSubmit, isSubmitting }) => {
    const [formData, setFormData] = useState({ action: '', location: '', notes: '', image_url: '' });
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (isOpen) setFormData({ action: '', location: '', notes: '', image_url: '' });
    }, [isOpen]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);

        try {
            const fd = new FormData();
            fd.append('file', file);

            const res = await fetch('http://localhost:3000/api/upload', { method: 'POST', body: fd });
            const data = await res.json();

            const url = data.fileUrl || data.url;
            if (url) setFormData(prev => ({ ...prev, image_url: url }));
        } catch (err) {
            alert("Lỗi upload ảnh");
        }
        setUploading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="modal-backdrop">
            <div className="modal-container">

                <button onClick={onClose} className="modal-close-btn">
                    <X size={24}/>
                </button>

                <h3 className="modal-title">
                    <Leaf size={24}/> Ghi nhật ký canh tác
                </h3>

                <p className="modal-desc">
                    * Dữ liệu sẽ được ghi vĩnh viễn lên Blockchain.
                </p>

                <div className="modal-body">

                    {/* Action */}
                    <div>
                        <label className="label">Hoạt động <span className="required">*</span></label>
                        <input
                            type="text"
                            placeholder="VD: Gieo hạt, Bón phân..."
                            value={formData.action}
                            onChange={e => setFormData({ ...formData, action: e.target.value })}
                            className="input"
                        />
                    </div>

                    {/* Location */}
                    <div>
                        <label className="label">Địa điểm <span className="required">*</span></label>
                        <input
                            type="text"
                            placeholder="VD: Nông trại A..."
                            value={formData.location}
                            onChange={e => setFormData({ ...formData, location: e.target.value })}
                            className="input"
                        />
                    </div>

                    {/* Upload image */}
                    <div>
                        <label className="label">Hình ảnh bằng chứng</label>

                        <div className="img-upload-box">

                            {formData.image_url ? (
                                <div className="img-preview-wrapper">
                                    <img
                                        src={formData.image_url.startsWith('http') ? formData.image_url : `http://localhost:3000${formData.image_url}`}
                                        alt="Preview"
                                        className="img-preview"
                                    />

                                    <button
                                        onClick={() => setFormData({ ...formData, image_url: '' })}
                                        className="remove-img-btn"
                                    >
                                        <X size={14}/>
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <input type="file" id="log-upload" hidden onChange={handleUpload} accept="image/*" />
                                    <label htmlFor="log-upload" className="upload-label">
                                        <div className="upload-icon">
                                            <ImageIcon size={24}/>
                                        </div>
                                        <span>{uploading ? 'Đang tải lên...' : 'Tải ảnh lên'}</span>
                                    </label>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="label">Ghi chú</label>
                        <textarea
                            placeholder="Chi tiết quy trình..."
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            className="textarea"
                        />
                    </div>
                </div>

                <div className="modal-footer">
                    <button onClick={onClose} disabled={isSubmitting} className="btn-cancel">
                        Hủy bỏ
                    </button>

                    <button
                        onClick={() => onSubmit(formData)}
                        disabled={isSubmitting || !formData.action || !formData.location || uploading}
                        className={`btn-submit ${isSubmitting || uploading ? 'disabled' : ''}`}
                    >
                        {isSubmitting ? <><Loader size={16} className="spin" /> Đang xử lý...</> : 'Xác nhận ghi'}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default AddLogModal;
