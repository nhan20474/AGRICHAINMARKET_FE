import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Leaf, MapPin, Calendar, CheckCircle, ExternalLink, Package, Truck, ArrowRight } from 'lucide-react';
import { productService } from '../../services/productService';
import { blockchainService } from '../../services/blockchainService';
import '../../styles/TracePage.css';

const TracePage: React.FC = () => {
    const { id } = useParams();
    const [product, setProduct] = useState<any>(null);
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            setLoading(true);
            try {
                const productId = Number(id);

                // --- 1. SỬA LỖI TẠI ĐÂY: GỌI API LẤY 1 SẢN PHẨM ---
                // Thay vì getAll().find(), ta gọi thẳng getById()
                const productData = await productService.getById(productId);
                setProduct(productData);

                // --- 2. Lấy nhật ký Blockchain ---
                const history = await blockchainService.getHistory(productId);
                setLogs(history);

            } catch (err) {
                console.error(err);
                setError('Không tìm thấy thông tin sản phẩm hoặc lỗi kết nối.');
            }
            setLoading(false);
        };
        fetchData();
    }, [id]);

    if (loading) return <div className="trace-loading">Scanning Blockchain Data...</div>;
    
    if (error || !product) {
        return (
            <div className="trace-page-wrapper" style={{display:'flex', justifyContent:'center', alignItems:'center'}}>
                <div style={{textAlign:'center', padding: 20}}>
                    <div style={{fontSize: 40, marginBottom: 10}}>⚠️</div>
                    <h3>{error || 'Sản phẩm không tồn tại'}</h3>
                </div>
            </div>
        );
    }

    return (
        <div className="trace-page-wrapper">
            {/* HERO SECTION */}
            <div className="trace-header">
                <img 
                    src={product.image_url || '/img/default.jpg'} 
                    alt={product.name} 
                    className="header-bg-img"
                    onError={(e) => (e.target as HTMLImageElement).src = '/img/default.jpg'}
                />
                <div className="header-overlay">
                    <div className="verified-badge">
                        <CheckCircle size={16} fill="#fff" color="#28a745"/>
                        <span>Đã xác thực Blockchain</span>
                    </div>
                    <h1>{product.name}</h1>
                    <p>Mã sản phẩm: #{product.id}</p>
                </div>
            </div>

            {/* TIMELINE */}
            <div className="trace-body">
                <div className="intro-box">
                    <h3>📖 Câu chuyện sản phẩm</h3>
                    <p>{product.description}</p>
                    <div style={{marginTop: 10, fontSize: 13, color: '#555'}}>
                        <strong>Nguồn gốc:</strong> {product.origin || 'Việt Nam'}
                    </div>
                </div>

                <div className="timeline-container">
                    <h3 className="section-label">Nhật ký canh tác & Vận chuyển</h3>
                    
                    {logs.length === 0 ? (
                        <div className="empty-log" style={{textAlign:'center', color:'#999', padding: 30, border:'1px dashed #ddd', borderRadius: 8}}>
                            <Leaf size={32} style={{marginBottom:10, opacity:0.5}}/>
                            <p>Chưa có nhật ký nào được ghi nhận.</p>
                        </div>
                    ) : (
                        <div className="steps-list">
                            {logs.map((log, idx) => (
                                <div key={idx} className="step-card fade-in-up">
                                    {/* Cột mốc bên trái */}
                                    <div className="step-marker">
                                        <div className="line"></div>
                                        <div className="icon-circle">
                                            {/* Logic chọn icon theo hành động */}
                                            {log.action.toLowerCase().includes('thu hoạch') ? <Package size={18}/> : 
                                             log.action.toLowerCase().includes('vận chuyển') ? <Truck size={18}/> :
                                             <Leaf size={18}/>}
                                        </div>
                                    </div>

                                    {/* Nội dung bên phải */}
                                    <div className="step-detail">
                                        <div className="step-time">
                                            <Calendar size={12}/> {new Date(log.date).toLocaleString('vi-VN')}
                                        </div>
                                        <h4 className="step-title">{log.action}</h4>
                                        <div className="step-location">
                                            <MapPin size={14}/> {log.location}
                                        </div>

                                        {/* Hiển thị ảnh bằng chứng */}
                                        {log.image_url && (
                                            <div className="step-evidence-img">
                                                <img 
                                                    src={log.image_url.startsWith('http') ? log.image_url : `http://localhost:3000${log.image_url}`} 
                                                    alt="Bằng chứng" 
                                                    onError={(e) => e.currentTarget.style.display = 'none'}
                                                />
                                            </div>
                                        )}

                                        {log.notes && <p className="step-note">{log.notes}</p>}

                                        {/* Link Blockchain Proof */}
                                        {log.tx_hash && (
                                            <a 
                                                href={`https://amoy.polygonscan.com/tx/${log.tx_hash}`} 
                                                target="_blank" rel="noreferrer"
                                                className="blockchain-proof-link"
                                            >
                                                🔗 Proof Hash: {log.tx_hash.substring(0, 10)}...{log.tx_hash.substring(log.tx_hash.length - 5)}
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="trace-footer">
                    <p>Minh bạch hóa bởi <strong>AgriChain Blockchain</strong></p>
                </div>
            </div>
        </div>
    );
};

export default TracePage;