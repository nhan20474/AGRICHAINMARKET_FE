import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom'; 
import { 
    ShoppingCart, Star, Leaf, User, Edit2, Trash2, ShieldCheck, 
    Truck, MapPin, ChevronRight, CheckCircle, Image as ImageIcon,
    ChevronLeft, ChevronDown
} from 'lucide-react';
import { productService } from '../../services/productService';
import { cartService } from '../../services/cartService';
import { reviewService, Review } from '../../services/reviewService';
import { orderService } from '../../services/orderService';
import { blockchainService } from '../../services/blockchainService';
import '../../styles/ProductDetail.css';
import { flyToCart } from '../../utils/cartAnimation';
import { API_CONFIG, API_ORIGIN } from '../../config/apiConfig';

const ProductDetail: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // --- STATE ---
    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'desc' | 'review' | 'blockchain'>('desc');
    const [quantity, setQuantity] = useState(1);
    const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
    const [galleryImages, setGalleryImages] = useState<string[]>([]);
    const [mainImageIndex, setMainImageIndex] = useState(0);

    // Reviews
    const [reviews, setReviews] = useState<Review[]>([]);
    const [newComment, setNewComment] = useState('');
    const [newRating, setNewRating] = useState(5);
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
    const [editContent, setEditContent] = useState('');
    const [editRatingData, setEditRatingData] = useState(5);

    // Permission
    const [canReview, setCanReview] = useState(false);
    const [validOrderId, setValidOrderId] = useState<number | null>(null);

    // Blockchain
    const [blockchainLogs, setBlockchainLogs] = useState<any[]>([]);
    const [loadingBlockchain, setLoadingBlockchain] = useState(false);

    const getUserId = () => {
        try {
            const userStr = localStorage.getItem('user');
            return userStr ? Number(JSON.parse(userStr).id) : null;
        } catch { return null; }
    };
    const currentUserId = getUserId();

    // --- HELPER: XỬ LÝ URL ẢNH ---
    const getImageUrl = (url?: string) => {
        if (!url) return '/img/default.jpg'; // Ảnh mặc định nếu null
        if (url.startsWith('http')) return url; // Ảnh online
        if (url.startsWith('/uploads')) return `${API_ORIGIN}${url}`; // Ảnh từ server nodejs
        return url;
    };
    

    // --- LOGIC FETCH DATA ---
    useEffect(() => {
        window.scrollTo(0, 0);
        if (!id) return;
        fetchData();
    }, [id]);

    // ✅ THÊM: Keyboard navigation cho gallery
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') {
                setMainImageIndex(prev => (prev - 1 + galleryImages.length) % galleryImages.length);
            } else if (e.key === 'ArrowRight') {
                setMainImageIndex(prev => (prev + 1) % galleryImages.length);
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [galleryImages.length]);

    // ✅ THÊM: Hàm navigation
    const handlePrevImage = () => {
        setMainImageIndex(prev => (prev - 1 + galleryImages.length) % galleryImages.length);
    };

    const handleNextImage = () => {
        setMainImageIndex(prev => (prev + 1) % galleryImages.length);
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const productId = Number(id);

            // 1. Lấy sản phẩm
            const allProducts = await productService.getAll();
            const found = allProducts.find((p: any) => p.id === productId);
            if (!found) {
                console.error('❌ Không tìm thấy sản phẩm');
                setProduct(null);
                setRelatedProducts([]);
                return;
            }
            setProduct(found);
            setRelatedProducts(
                allProducts
                    .filter(p =>
                        p.id !== productId &&
                        p.status === 'available' &&
                        p.category_id === found.category_id
                    )
                    .slice(0, 4)
            );


            // ✅ CẬP NHẬT: Lấy gallery images từ product_images hoặc extra_images
            if (found && found.id) {
                try {
                    // ✅ CÁCH 1: Thử lấy từ API product_images endpoint
                    const imagesRes = await fetch(`${API_CONFIG.BASE_URL}/product-images/${found.id}`);
                    const imagesData = await imagesRes.json();
                    const images = imagesData.data || [];
                    
                    console.log('📸 API product-images response:', imagesData); // DEBUG
                    
                    if (images.length > 0) {
                        const imageUrls = images.map((img: any) => img.image_url);
                        console.log('✅ Gallery images từ API:', imageUrls); // DEBUG
                        setGalleryImages(imageUrls);
                    } else {
                        // ✅ CÁCH 2: Thử lấy từ extra_images field của product
                        console.log('⚠️ Không có dữ liệu từ API, kiểm tra extra_images'); // DEBUG
                        console.log('📦 Product object:', found); // DEBUG
                        
                        let extraImages: string[] = [];
                        
                        if (found.extra_images) {
                            // Nếu extra_images là string JSON, parse nó
                            if (typeof found.extra_images === 'string') {
                                try {
                                    extraImages = JSON.parse(found.extra_images);
                                    console.log('✅ Parsed extra_images from JSON:', extraImages); // DEBUG
                                } catch (e) {
                                    // Nếu không phải JSON, coi nó là string đơn
                                    extraImages = [found.extra_images];
                                    console.log('⚠️ extra_images không phải JSON, dùng string:', extraImages); // DEBUG
                                }
                            } else if (Array.isArray(found.extra_images)) {
                                // Nếu extra_images đã là array
                                extraImages = found.extra_images;
                                console.log('✅ extra_images từ array:', extraImages); // DEBUG
                            }
                        }
                        
                        // ✅ CÁCH 3: Kết hợp ảnh chính + ảnh phụ
                        const allImages = [];
                        if (found.image_url) allImages.push(found.image_url);
                        if (extraImages.length > 0) allImages.push(...extraImages);
                        
                        console.log('🖼️ Tất cả ảnh (chính + phụ):', allImages); // DEBUG
                        setGalleryImages(allImages.length > 0 ? allImages : [found.image_url || '/img/default.jpg']);
                    }
                } catch (err) {
                    console.error('❌ Lỗi tải gallery:', err);
                    
                    // ✅ FALLBACK: Dùng extra_images nếu API fail
                    let extraImages: string[] = [];
                    if (found.extra_images) {
                        if (typeof found.extra_images === 'string') {
                            try {
                                extraImages = JSON.parse(found.extra_images);
                            } catch {
                                extraImages = [found.extra_images];
                            }
                        } else if (Array.isArray(found.extra_images)) {
                            extraImages = found.extra_images;
                        }
                    }
                    
                    const allImages = [];
                    if (found.image_url) allImages.push(found.image_url);
                    if (extraImages.length > 0) allImages.push(...extraImages);
                    
                    setGalleryImages(allImages.length > 0 ? allImages : [found.image_url || '/img/default.jpg']);
                }
            }

            // 2. Lấy Review
            try {
                const realReviews = await reviewService.getByProduct(productId);
                setReviews(realReviews);
            } catch { setReviews([]); }

            // 3. Lấy Blockchain logs
            setLoadingBlockchain(true);
            try {
                const logs = await blockchainService.getHistory(productId);
                setBlockchainLogs(logs || []);
            } catch (err) {
                console.error(err);
                setBlockchainLogs([]);
            }
            setLoadingBlockchain(false);

        } catch (error) {
            console.error(error);
        }
        setLoading(false);
    };

    // --- CHECK QUYỀN REVIEW ---
    useEffect(() => {
        const checkReviewPermission = async () => {
            if (!currentUserId || !product) return;
            try {
                const history = await orderService.getHistory(currentUserId);
                const foundOrder = history.find((h: any) => {
                    const items = h.items || (h.order && h.order.items) || [];
                    const status = h.status || (h.order && h.order.status);
                    const hasProduct = items.some((item: any) => item.product_id === Number(id));
                    const allowedStatuses = ['delivered', 'received'];
                    return hasProduct && allowedStatuses.includes(status);
                });

                if (foundOrder) {
                    const orderData = foundOrder as any;
                    const realId = orderData.id || (orderData.order && orderData.order.id);
                    setValidOrderId(realId);
                    const hasReviewed = reviews.some(r => Number(r.user_id) === Number(currentUserId));
                    setCanReview(!hasReviewed);
                } else {
                    setCanReview(false);
                    setValidOrderId(null);
                }
            } catch (err) { console.error(err); }
        };
        if (reviews && product) checkReviewPermission();
    }, [id, reviews, product, currentUserId]);

    const averageRating = reviews.length > 0 
        ? (reviews.reduce((acc, r) => acc + Number(r.rating), 0) / reviews.length).toFixed(1)
        : "5.0";

    // --- ACTIONS ---
    const handleAddToCart = async (event?: React.MouseEvent<HTMLButtonElement>) => {
        if (product.status === 'out_of_stock') return alert("Sản phẩm đã hết hàng!");
        if (!currentUserId) return navigate('/login');
        
        try {
            await cartService.addItem(currentUserId, { product_id: Number(id), quantity });
            
            // Hiệu ứng bay vào giỏ hàng
            if (event) {
                const imageUrl = product.image_url || galleryImages[0] || '/img/default.jpg';
                flyToCart(event.currentTarget, imageUrl);
            }
            
            // Dispatch event sau 100ms
            setTimeout(() => {
                window.dispatchEvent(new Event('cart-updated'));
            }, 100);
            
            alert("Đã thêm vào giỏ hàng!");
        } catch (error: any) {
            console.error("❌ Add to cart error:", error);

            const message = error?.message || "";

            // 🔴 Lỗi tồn kho
            if (message.includes("Kho chỉ còn")) {
                alert(`⚠️ ${message}`);
                return;
            }

            // 🔴 Hết hàng
            if (message.includes("hết hàng")) {
                alert("❌ Sản phẩm đã hết hàng");
                return;
            }

            // 🔴 Sản phẩm tạm ngừng bán
            if (message.includes("tạm ngừng")) {
                alert(`⚠️ ${message}`);
                return;
            }

            // 🔴 Lỗi khác
            alert("❌ Không thể thêm vào giỏ hàng");
        }
    };

    const handleSubmitReview = async () => {
        if (!currentUserId) return navigate('/login');
        if (!validOrderId) return alert("Bạn cần mua và nhận hàng thành công để đánh giá.");
        if (!newComment.trim()) return alert("Vui lòng nhập nội dung.");
        setIsSubmittingReview(true);
        try {
            await reviewService.create({
                product_id: Number(id),
                user_id: currentUserId,
                rating: newRating,
                comment: newComment,
                order_id: validOrderId
            });
            alert("Đánh giá thành công!");
            setNewComment('');
            setNewRating(5);
            fetchData();
        } catch (error: any) {
            console.error(error);
            alert("Lỗi: " + (error.response?.data?.error || error.message));
        }
        setIsSubmittingReview(false);
    };

    const startEdit = (review: Review) => {
        setEditingReviewId(review.id);
        setEditContent(review.comment || '');
        setEditRatingData(review.rating);
    };
    const cancelEdit = () => { setEditingReviewId(null); setEditContent(''); };
    const handleUpdateReview = async (reviewId: number) => {
        try {
            await reviewService.update(reviewId, { rating: editRatingData, comment: editContent });
            alert("Cập nhật thành công!");
            setEditingReviewId(null);
            fetchData();
        } catch { alert("Lỗi cập nhật"); }
    };
    const handleDeleteReview = async (reviewId: number) => {
        if (!window.confirm("Bạn chắc chắn muốn xóa đánh giá này?")) return;
        try {
            await reviewService.remove(reviewId);
            alert("Đã xóa đánh giá!");
            fetchData();
        } catch { alert("Lỗi xóa"); }
    };

    // --- UI RENDER ---
    if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;
    if (!product) return <div className="error-page"><h2>Không tìm thấy sản phẩm!</h2><button onClick={() => navigate('/')}>Về trang chủ</button></div>;
    const isOutOfStock = product.status === 'out_of_stock';

    return (
        <div className="product-detail-container">
            {/* Breadcrumb */}
            <div className="breadcrumb">
                <Link to="/">Trang chủ</Link> 
                <ChevronRight size={14} /> 
                <Link to="/products">Sản phẩm</Link>
                <ChevronRight size={14} /> 
                <span>{product.name}</span>
            </div>

            {/* MAIN INFO */}
            <div className="product-hero-section">
                {/* Left: Image Gallery */}
                <div className="product-gallery-wrapper">
                    {/* ✅ THAY ĐỔI: Main image với navigation arrows */}
                    <div className="main-image-frame">
                        <img 
                            src={getImageUrl(galleryImages[mainImageIndex] || product.image_url)} 
                            alt={product.name} 
                            onError={(e) => { e.currentTarget.src = '/img/default.jpg'; e.currentTarget.onerror=null; }}
                        />
                        {isOutOfStock && <div className="badge-out-stock">HẾT HÀNG</div>}
                        
                        {product.sale_price && Number(product.sale_price) < Number(product.price) && (
                            <div className="badge-sale-new">
                                <div className="sale-percent">
                                    -{Math.round((1 - Number(product.sale_price)/Number(product.price))*100)}%
                                </div>
                                <div className="sale-label">GIẢM GIÁ</div>
                            </div>
                        )}
                        
                        <div className="badge-verified"><ShieldCheck size={16} /> Truy xuất nguồn gốc</div>

                        {/* ✅ THÊM: Left arrow */}
                        {galleryImages.length > 1 && (
                            <button 
                                className="nav-arrow nav-arrow-left"
                                onClick={handlePrevImage}
                                title="Ảnh trước (←)"
                            >
                                <ChevronLeft size={24} />
                            </button>
                        )}

                        {/* ✅ THÊM: Right arrow */}
                        {galleryImages.length > 1 && (
                            <button 
                                className="nav-arrow nav-arrow-right"
                                onClick={handleNextImage}
                                title="Ảnh tiếp theo (→)"
                            >
                                <ChevronRight size={24} />
                            </button>
                        )}

                        {/* ✅ THÊM: Slide counter */}
                        {galleryImages.length > 1 && (
                            <div className="slide-counter">
                                {mainImageIndex + 1} / {galleryImages.length}
                            </div>
                        )}
                    </div>

                    {/* ✅ THÊM: Thumbnail gallery DỮ ĐỂ */}
                    {galleryImages.length > 1 && (
                        <div className="thumbnail-gallery-below">
                            <div className="scroll-hint">
                                <ChevronDown size={16} /> Cuộn để xem thêm ảnh
                            </div>
                            <div className="thumbnail-scroll-container">
                                {galleryImages.map((img, idx) => (
                                    <div
                                        key={idx}
                                        className={`thumb-wrapper-below ${mainImageIndex === idx ? 'active' : ''}`}
                                        onClick={() => setMainImageIndex(idx)}
                                    >
                                        <img 
                                            src={getImageUrl(img)} 
                                            alt={`Ảnh ${idx+1}`} 
                                            className="thumb"
                                            onError={(e)=>{ e.currentTarget.src='/img/default.jpg'; }}
                                        />
                                        {mainImageIndex === idx && <div className="active-indicator"></div>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Info */}
                <div className="product-info-wrapper">
                    <h1 className="product-title">{product.name}</h1>
                    
                    <div className="product-meta-row">
                        <div className="rating-summary">
                            <span className="rating-num">{averageRating}</span>
                            <Star size={16} fill="#FFC107" stroke="none" />
                            <span className="review-count">Xem {reviews.length} đánh giá</span>
                        </div>
                        <div className="sold-count"> | Đã bán: {product.sold_count || 100}+</div>
                    </div>

                    {/* ✅ THÊM: UI giảm giá nổi bật */}
                    <div className="product-price">
                        {product.sale_price && Number(product.sale_price) < Number(product.price) ? (
                            <div className="price-sale-new">
                                <div className="price-row">
                                    <span className="original-price-label">Giá gốc:</span>
                                    <span className="original-price">{Number(product.price).toLocaleString('vi-VN')}₫</span>
                                </div>
                                <div className="price-row sale">
                                    <span className="sale-price-label">Giá bán:</span>
                                    <span className="sale-price">{Number(product.sale_price).toLocaleString('vi-VN')}₫</span>
                                </div>
                                <div className="save-info">
                                    Bạn tiết kiệm: <strong>{(Number(product.price) - Number(product.sale_price)).toLocaleString('vi-VN')}₫</strong>
                                </div>
                            </div>
                        ) : (
                            <div className="price-normal-new">
                                <span className="normal-price">{Number(product.price).toLocaleString('vi-VN')}₫</span>
                            </div>
                        )}
                    </div>

                    <div className="product-short-desc">
                        {product.description?.substring(0, 150)}...
                    </div>

                    <div className="action-area">
                        <div className="quantity-control">
                            <button onClick={() => setQuantity(q => Math.max(1,q-1))}>-</button>
                            <input value={quantity} readOnly/>
                            <button onClick={() => setQuantity(q => q+1)}>+</button>
                        </div>
                        <button 
                            className={`btn-add-to-cart ${isOutOfStock ? 'disabled' : ''}`}
                            onClick={(e) => handleAddToCart(e)} 
                            disabled={isOutOfStock}
                        >
                            <ShoppingCart size={20}/> 
                            {isOutOfStock ? 'HẾT HÀNG' : 'THÊM VÀO GIỎ HÀNG'}
                        </button>
                    </div>

                    <div className="trust-badges">
                        <div className="trust-item"><Truck size={20}/> Giao hàng toàn quốc</div>
                        <div className="trust-item"><CheckCircle size={20}/> Đổi trả trong 24h</div>
                        <div className="trust-item"><ShieldCheck size={20}/> Nông sản sạch 100%</div>
                    </div>
                </div>
            </div>

            {/* TABS */}
            <div className="product-details-tabs">
                <div className="tabs-nav">
                    <button className={activeTab==='desc'?'active':''} onClick={()=>setActiveTab('desc')}>Mô tả chi tiết</button>
                    <button className={activeTab==='blockchain'?'active':''} onClick={()=>setActiveTab('blockchain')}>Nhật ký canh tác</button>
                    <button className={activeTab==='review'?'active':''} onClick={()=>setActiveTab('review')}>Đánh giá ({reviews.length})</button>
                </div>

                <div className="tab-body">
                    {/* Description */}
                    {activeTab==='desc' && (
                        <div className="tab-pane fade-in">
                            <p className="desc-text">{product.description}</p>
                            <ul className="product-attributes-fake">
                                <li><strong>Xuất xứ:</strong> Việt Nam</li>
                                <li><strong>Đơn vị:</strong> {product.unit}</li>
                                <li><strong>Bảo quản:</strong> Nơi khô ráo, thoáng mát</li>
                            </ul>
                        </div>
                    )}

                    {/* Blockchain */}
                    {activeTab==='blockchain' && (
                        <div className="tab-pane fade-in blockchain-pane">
                            {loadingBlockchain ? (
                                <div className="loading-text">Đang tải dữ liệu chuỗi khối...</div>
                            ) : blockchainLogs.length > 0 ? (
                                <div className="timeline-container">
                                    {blockchainLogs.map((log, index)=>(
                                        <div key={index} className="timeline-event">
                                            <div className="timeline-point"><Leaf size={14} color="white"/></div>
                                            <div className="timeline-card">
                                                <div className="timeline-header">
                                                    <h4>{log.action}</h4>
                                                    <span className="time">{new Date(log.date).toLocaleString('vi-VN')}</span>
                                                </div>
                                                <div className="location"><MapPin size={14}/> {log.location}</div>
                                                {log.notes && <p className="notes">"{log.notes}"</p>}
                                                {log.tx_hash && (
                                                    <a href={`https://amoy.polygonscan.com/tx/${log.tx_hash}`} target="_blank" rel="noreferrer" className="tx-link">
                                                        <ShieldCheck size={14}/> Xác thực trên PolygonScan
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-state">Chưa có dữ liệu nhật ký cho lô hàng này.</div>
                            )}
                        </div>
                    )}

                    {/* Reviews */}
                    {activeTab==='review' && (
                        <div className="tab-pane fade-in review-pane">
                            {canReview ? (
                                <div className="write-review-form">
                                    <h4>Viết đánh giá của bạn</h4>
                                    <div className="star-rating-input">
                                        {[1,2,3,4,5].map(i=><Star key={i} size={28} fill={i<=newRating?"#FFC107":"#e4e5e9"} stroke="none" onClick={()=>setNewRating(i)}/>)}
                                    </div>
                                    <textarea value={newComment} onChange={e=>setNewComment(e.target.value)} placeholder="Sản phẩm thế nào? Hãy chia sẻ với mọi người..." />
                                    <button onClick={handleSubmitReview} disabled={isSubmittingReview}>{isSubmittingReview ? 'Đang gửi...' : 'Gửi đánh giá'}</button>
                                </div>
                            ) : !reviews.some(r=>Number(r.user_id)===Number(currentUserId)) && (
                                <div className="review-notice">Bạn cần mua sản phẩm này để viết đánh giá.</div>
                            )}

                            <div className="reviews-list">
                                {reviews.map(r=>{
                                    const isOwner = Number(r.user_id)===Number(currentUserId);
                                    const isEditing = editingReviewId===r.id;
                                    return (
                                        <div key={r.id} className="review-card">
                                            <div className="review-avatar">{r.user_name ? r.user_name[0].toUpperCase() : <User size={20}/>}</div>
                                            <div className="review-body-content">
                                                <div className="review-header">
                                                    <h5>{r.user_name||`Khách hàng #${r.user_id}`}</h5>
                                                    <span className="review-date">{new Date(r.created_at).toLocaleDateString('vi-VN')}</span>
                                                </div>
                                                {isEditing ? (
                                                    <div className="edit-mode-box">
                                                        <div className="rating-select-mini">
                                                            {[1,2,3,4,5].map(i=><Star key={i} size={18} fill={i<=editRatingData?"#FFC107":"#ddd"} onClick={()=>setEditRatingData(i)}/>)}
                                                        </div>
                                                        <textarea value={editContent} onChange={e=>setEditContent(e.target.value)}/>
                                                        <div className="edit-actions">
                                                            <button className="btn-cancel" onClick={cancelEdit}>Hủy</button>
                                                            <button className="btn-save" onClick={()=>handleUpdateReview(r.id)}>Lưu</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="review-stars">{[...Array(5)].map((_,i)=><Star key={i} size={14} fill={i<r.rating?"#FFC107":"#e4e5e9"} stroke="none"/>)}</div>
                                                        <p className="review-text">{r.comment}</p>
                                                    </>
                                                )}
                                                {isOwner && !isEditing && (
                                                    <div className="review-actions-bar">
                                                        <button onClick={()=>startEdit(r)} className="action-link"><Edit2 size={14}/> Sửa</button>
                                                        <button onClick={()=>handleDeleteReview(r.id)} className="action-link delete"><Trash2 size={14}/> Xóa</button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* RELATED PRODUCTS */}
            <section className="related-section">
                <h3>Sản phẩm tương tự</h3>
                <div className="related-grid">
                    {relatedProducts.map(p => (
                        <div key={p.id} className="product-card-mini" onClick={() => navigate(`/product/${p.id}`)}>
                            <div className="img-wrap">
                                <img 
                                    src={getImageUrl(p.image_url)} 
                                    alt={p.name} 
                                    onError={(e) => {e.currentTarget.src = '/img/default.jpg';}} 
                                />
                            </div>
                            <div className="info-wrap">
                                <h5>{p.name}</h5>
                                <div className="price">{Number(p.price).toLocaleString('vi-VN')}₫</div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default ProductDetail;