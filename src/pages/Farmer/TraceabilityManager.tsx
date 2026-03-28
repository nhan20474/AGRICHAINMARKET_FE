import React, { useState, useEffect } from 'react';
import {
    Search, Leaf, MapPin, Plus, ExternalLink, CheckCircle, QrCode
} from 'lucide-react';
import { productService, Product } from '../../services/productService';
import { blockchainService } from '../../services/blockchainService';

import AddLogModal from '../../components/AddLogModal';
import QRCodeModal from '../../components/QRCodeModal';

import '../../styles/TraceabilityManager.css';
import { API_ORIGIN } from '../../config/apiConfig';

const TraceabilityManager: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [logs, setLogs] = useState<any[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isQROpen, setIsQROpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [sellerId, setSellerId] = useState<number | null>(null);

    useEffect(() => {
        try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const parsed = JSON.parse(userStr);
                if (parsed?.id) {
                    setSellerId(Number(parsed.id));
                }
            }
        } catch (e) {
            console.error('Lỗi parse user từ localStorage:', e);
        }
    }, []);

    useEffect(() => {
        const fetchMyProducts = async () => {
            if (!sellerId) return;
            try {
                const data = await productService.getAll({ seller_id: sellerId });

                const myProducts = data.filter((p: any) => {
                    const isOwner = Number(p.seller_id) === Number(sellerId);
                    const isApproved =
                        p.status === 'available' || p.status === 'out_of_stock';
                    return isOwner && isApproved;
                });

                setProducts(myProducts);
                if (myProducts.length > 0 && !selectedProduct) {
                    handleSelectProduct(myProducts[0]);
                }
            } catch (error) {
                console.error('Lỗi tải sản phẩm:', error);
            }
        };

        fetchMyProducts();
    }, [sellerId]);

    const handleSelectProduct = async (prod: Product) => {
        setSelectedProduct(prod);
        setLoadingLogs(true);
        try {
            const history = await blockchainService.getHistory(prod.id);
            setLogs(history || []);
        } catch (error) {
            console.error('Lỗi tải lịch sử blockchain:', error);
            setLogs([]);
        } finally {
            setLoadingLogs(false);
        }
    };

    const submitWrapper = async (formData: any) => {
        if (!selectedProduct) return;

        setIsSubmitting(true);
        try {
            await blockchainService.addLog({
                product_id: selectedProduct.id,
                action: formData.action,
                location: formData.location,
                notes: formData.notes,
                image_url: formData.image_url,
            });

            alert('✅ Ghi nhật ký thành công!');
            setIsModalOpen(false);
            await handleSelectProduct(selectedProduct);
        } catch (e: any) {
            alert('❌ Lỗi: ' + (e?.message || 'Không thể ghi nhật ký'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredProducts = products.filter((p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!sellerId) {
        return <div className="center-text">Vui lòng đăng nhập lại.</div>;
    }

    return (
        <div className="trace-manager">

            {/* LEFT COLUMN */}
            <div className="left-column">
                <div className="left-header">
                    <h3>📦 Sản phẩm của tôi</h3>

                    <div className="search-bar">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Tìm nhanh..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="product-list">
                    {products.length === 0 ? (
                        <p className="empty-text">Bạn chưa có sản phẩm nào được duyệt.</p>
                    ) : (
                        filteredProducts.map((p) => (
                            <div
                                key={p.id}
                                onClick={() => handleSelectProduct(p)}
                                className={
                                    selectedProduct?.id === p.id
                                        ? 'product-item active'
                                        : 'product-item'
                                }
                            >
                                <div className="product-name">{p.name}</div>
                                <div className="product-id">ID: #{p.id}</div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="right-column">
                {selectedProduct ? (
                    <>
                        {/* HEADER */}
                        <div className="right-header">
                            <div>
                                <h2>{selectedProduct.name}</h2>
                                <p className="sub-title">
                                    <CheckCircle size={14} /> Quản lý nhật ký
                                </p>
                            </div>

                            <div className="header-buttons">
                                <button className="btn-qr" onClick={() => setIsQROpen(true)}>
                                    <QrCode size={18} /> Mã QR
                                </button>
                                <button className="btn-add" onClick={() => setIsModalOpen(true)}>
                                    <Plus size={18} /> Ghi nhật ký
                                </button>
                            </div>
                        </div>

                        {/* HISTORY */}
                        <div className="timeline-wrapper">
                            {loadingLogs ? (
                                <div className="loading">Đang tải...</div>
                            ) : logs.length === 0 ? (
                                <div className="no-logs">Chưa có nhật ký.</div>
                            ) : (
                                <div className="timeline">
                                    {logs.map((log, index) => (
                                        <div key={index} className="timeline-item">
                                            <div className="timeline-icon">
                                                <Leaf size={16} />
                                            </div>

                                            <div className="timeline-content">
                                                <div className="timeline-title">
                                                    <h4>{log.action}</h4>
                                                    <span>
                                                        {log.date
                                                            ? new Date(log.date).toLocaleString()
                                                            : ''}
                                                    </span>
                                                </div>

                                                <p className="location">
                                                    <MapPin size={16} /> {log.location}
                                                </p>

                                                {log.image_url && (
                                                    <img
                                                        src={
                                                            log.image_url.startsWith('http')
                                                                ? log.image_url
                                                                : `${API_ORIGIN}${log.image_url}`
                                                        }
                                                        alt="Proof"
                                                        className="timeline-img"
                                                    />
                                                )}

                                                {log.notes && (
                                                    <div className="notes">{log.notes}</div>
                                                )}

                                                {log.tx_hash && (
                                                    <div className="tx-section">
                                                        <a
                                                            href={`https://amoy.polygonscan.com/tx/${log.tx_hash}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="tx-link"
                                                        >
                                                            <ExternalLink size={14} /> Xem xác thực Blockchain
                                                        </a>

                                                        <div className="verified">
                                                            <CheckCircle size={12} /> Đã xác thực
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="select-product-text">Chọn sản phẩm để xem</div>
                )}
            </div>

            {/* MODALS */}
            <AddLogModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={submitWrapper}
                isSubmitting={isSubmitting}
            />
            <QRCodeModal
                isOpen={isQROpen}
                onClose={() => setIsQROpen(false)}
                product={selectedProduct}
            />
        </div>
    );
};

export default TraceabilityManager;
