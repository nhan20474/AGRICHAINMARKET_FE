import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate , useSearchParams} from 'react-router-dom';
import { ShoppingCart, Eye, Filter, X, Star } from 'lucide-react';
import { searchService } from '../../services/searchService';
import { categoryService, Category } from '../../services/categoryService';
import { cartService } from '../../services/cartService';
import { flyToCart } from '../../utils/cartAnimation';
import '../../styles/ProductList.css';


type ContextType = { searchTerm: string };

const alphabet = ['ALL', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];

function getUserId() {
    try {
        const userStr = localStorage.getItem('user');
        if (userStr) return Number(JSON.parse(userStr).id);
    } catch { }
    return null;
}

const ProductList: React.FC = () => {
    const { searchTerm } = useOutletContext<ContextType>();
    const userId = getUserId();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // --- Data State ---
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [notify, setNotify] = useState('');

    // --- Filter State ---
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [priceRange, setPriceRange] = useState<{ min: number | '', max: number | '' }>({ min: '', max: '' });
    const [selectedOrigin, setSelectedOrigin] = useState<string>('');
    const [sortBy, setSortBy] = useState<string>('newest');
    const [alphaFilter, setAlphaFilter] = useState<string>('ALL');

    // --- Pagination State ---
    const [page, setPage] = useState(1);
    const itemsPerPage = 12;

    // Load Data
    useEffect(() => {
        categoryService.getAll().then(setCategories).catch(console.error);
    }, []);

    useEffect(() => {
        const categoryNameFromUrl = searchParams.get('category'); // Lấy tên từ URL (VD: Rau củ)
        const categoryIdFromUrl = searchParams.get('categoryId'); // Hoặc lấy ID nếu bạn truyền ID

        if (categories.length > 0) {
            if (categoryIdFromUrl) {
                 setSelectedCategoryId(Number(categoryIdFromUrl));
            } else if (categoryNameFromUrl) {
                // Tìm ID dựa trên tên danh mục (cần decode vì URL mã hóa tiếng Việt)
                const decodedName = decodeURIComponent(categoryNameFromUrl).toLowerCase();
                const foundCat = categories.find(c => c.name.toLowerCase() === decodedName);
                if (foundCat) {
                    setSelectedCategoryId(foundCat.id);
                }
            }
        }
    }, [searchParams, categories]);

    useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        try {
            const params = {
                keyword: searchTerm,
                minPrice: priceRange.min !== '' ? Number(priceRange.min) : undefined,
                maxPrice: priceRange.max !== '' ? Number(priceRange.max) : undefined,
                categoryId: selectedCategoryId || undefined,
                location: selectedOrigin || undefined,
                sortBy: sortBy
            };

            const data = await searchService.search(params);

            const mapped = data
                // Chỉ lấy sản phẩm AVAILABLE hoặc OUT_OF_STOCK
                .filter((item: any) => item.status === 'available' || item.status === 'out_of_stock')
                .map((item: any) => ({
                    ...item,
                    image_url: item.image_url || '/img/default.jpg',
                    rating: item.rating != null ? Number(item.rating) : 0,
                    review_count: item.review_count != null ? Number(item.review_count) : 0,
                    origin: item.seller_address || 'Việt Nam'
                }));

            let finalData = mapped;
            if (alphaFilter !== 'ALL') {
                finalData = mapped.filter((p: any) => p.name && p.name.toUpperCase().startsWith(alphaFilter));
            }

            setProducts(finalData);
            setPage(1);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const timeoutId = setTimeout(fetchData, 400);
    return () => clearTimeout(timeoutId);
}, [searchTerm, selectedCategoryId, priceRange, selectedOrigin, sortBy, alphaFilter]);


    const totalPages = Math.ceil(products.length / itemsPerPage);
    const paginatedProducts = products.slice((page - 1) * itemsPerPage, page * itemsPerPage);

    const handleAddToCart = async (product: any, event: React.MouseEvent<HTMLButtonElement>) => {
        if (product.status === 'out_of_stock') {
            setNotify('Sản phẩm đã hết hàng!'); 
            setTimeout(() => setNotify(''), 1200);
            return;
        }

        if (!userId) {
            setNotify('Vui lòng đăng nhập!'); setTimeout(() => setNotify(''), 1200); return;
        }
        
        const button = event.currentTarget;
        
        try {
            // Thêm vào giỏ hàng
            await cartService.addItem(userId, { product_id: product.id, quantity: 1 });
            const updatedCart = await cartService.getCart(userId);
            localStorage.setItem('cart', JSON.stringify(updatedCart || []));
            
            // Hiệu ứng bay vào giỏ hàng
            const imageUrl = product.image_url || '/img/default.jpg';
            flyToCart(button, imageUrl);
            
            // Dispatch event sau 100ms để animation mượt hơn
            setTimeout(() => {
                window.dispatchEvent(new Event('cart-updated'));
            }, 100);
            
            setNotify('Đã thêm vào giỏ!');
        } catch (err) { 
            setNotify('Lỗi thêm giỏ hàng'); 
        }
        setTimeout(() => setNotify(''), 1200);
    };

    const clearFilters = () => {
        setPriceRange({ min: '', max: '' });
        setSelectedOrigin('');
        setSortBy('newest');
        setAlphaFilter('ALL');
        setSelectedCategoryId(null); 
    };

    return (
        <main className="product-page-layout">
            {/* --- SIDEBAR --- */}
            <aside className="filter-sidebar compact">
                <div className="filter-header">
                    <div style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
                        <Filter size={18} /> <span>Bộ lọc</span>
                    </div>
                    {(priceRange.min !== '' || priceRange.max !== '' || selectedOrigin !== '' || selectedCategoryId !== null) && (
                        <button className="btn-clear-filter" onClick={clearFilters} title="Xóa tất cả lọc">
                            <X size={14}/>
                        </button>
                    )}
                </div>

                <div className="filter-group">
                    <label>Danh mục</label>
                    <select className="compact-select" value={selectedCategoryId || ''} onChange={(e) => setSelectedCategoryId(e.target.value ? Number(e.target.value) : null)}>
                        <option value="">Tất cả danh mục</option>
                        {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                </div>

                <div className="filter-group">
                    <label>Khoảng giá</label>
                    <div className="price-range-compact">
                        <input type="number" placeholder="Min" value={priceRange.min} onChange={e => setPriceRange({ ...priceRange, min: e.target.value === '' ? '' : Number(e.target.value) })} />
                        <span>-</span>
                        <input type="number" placeholder="Max" value={priceRange.max} onChange={e => setPriceRange({ ...priceRange, max: e.target.value === '' ? '' : Number(e.target.value) })} />
                    </div>
                </div>

                 <div className="filter-group">
                    <label>Sắp xếp</label>
                    <select className="compact-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                        <option value="newest">Mới nhất</option>
                        <option value="price_asc">Giá tăng dần</option>
                        <option value="price_desc">Giá giảm dần</option>
                    </select>
                </div>
            </aside>

            {/* --- MAIN CONTENT --- */}
            <section className="product-content">
                
                <div className="alpha-filter-bar">
                    <span className="alpha-label">Lọc nhanh:</span>
                    <div className="alpha-list">
                        {alphabet.map(char => (
                            <button key={char} className={`alpha-btn ${alphaFilter === char ? 'active' : ''}`} onClick={() => setAlphaFilter(char)}>{char}</button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="loading-state">Đang tải dữ liệu...</div>
                ) : (
                    <>
                        <div className="results-bar" style={{textAlign: 'right', fontSize: '13px', color: '#777', marginBottom: '10px'}}>
                            Tìm thấy <b>{products.length}</b> sản phẩm
                        </div>
                        
                        {paginatedProducts.length > 0 ? (
                            <div className="product-grid">
                                {paginatedProducts.map(p => (
                                    <div key={p.id} className={`product-card ${p.status === 'out_of_stock' ? 'out-of-stock' : ''}`}>
                                        
                                        {/* Hình ảnh + Nhãn Hết hàng - Click để xem chi tiết */}
                                        <div 
                                            className="product-image-container" 
                                            style={{ position: 'relative', cursor: 'pointer' }}
                                            onClick={() => navigate(`/product/${p.id}`)}
                                        >
                                            {p.sale_price && Number(p.sale_price) < Number(p.price) && (
                                                <div style={{
                                                    position: 'absolute',
                                                    top: 10,
                                                    right: 10,
                                                    background: '#FF5722',
                                                    color: 'white',
                                                    padding: '4px 8px',
                                                    borderRadius: 4,
                                                    fontSize: 11,
                                                    fontWeight: 'bold',
                                                    zIndex: 10
                                                }}>
                                                    -{Math.round((1 - p.sale_price / p.price) * 100)}%
                                                </div>
                                            )}
                                            <img
                                                src={p.image_url ? (p.image_url.startsWith('/uploads/') ? `http://localhost:3000${p.image_url}` : p.image_url.startsWith('http') ? p.image_url : '/img/default.jpg') : '/img/default.jpg'}
                                                alt={p.name}
                                                className="product-image"
                                                onError={e => { (e.target as HTMLImageElement).src = '/img/default.jpg'; }}
                                            />
                                            {p.status === 'out_of_stock' && (
                                                <div style={{position: 'absolute', top: 10, left: 10, background: '#D32F2F', color: 'white', padding: '4px 8px', borderRadius: 4, fontSize: '11px', fontWeight: 'bold', zIndex: 10, boxShadow: '0 2px 4px rgba(0,0,0,0.2)'}}>HẾT HÀNG</div>
                                            )}
                                        </div>
                                        
                                        {/* Thông tin sản phẩm */}
                                        <div className="product-info">
                                            <h3 
                                                className="product-name" 
                                                title={p.name}
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => navigate(`/product/${p.id}`)}
                                            >
                                                {p.name}
                                            </h3>
                                            
                                            {/* --- RATING HIỂN THỊ --- */}
                                            <div
                                                className="product-rating-row"
                                                style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontSize: 12, minHeight: 20 }}
                                            >
                                                {p.review_count > 0 ? (
                                                    <>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                            <Star 
                                                                size={14} 
                                                                color="#FFC107"
                                                                fill="#FFC107"
                                                            />
                                                            <span style={{ fontWeight: 700, color: '#333' }}>
                                                                {p.rating.toFixed(1)}
                                                            </span>
                                                        </div>
                                                        <span style={{ color: '#999', fontSize: 11 }}>
                                                            ({p.review_count} đánh giá)
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span
                                                        style={{
                                                            background: '#E3F2FD',
                                                            color: '#1976D2',
                                                            padding: '2px 6px',
                                                            borderRadius: 4,
                                                            fontSize: 10,
                                                            fontWeight: 700,
                                                            letterSpacing: 0.5
                                                        }}
                                                    >
                                                        SẢN PHẨM MỚI
                                                    </span>
                                                )}
                                            </div>
                                            {/* ----------------------- */}

                                            {/* --- PRICE (SALE SUPPORT + UI FIX) --- */}
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: 2,
                                                    marginTop: 6,
                                                    minHeight: 32,
                                                }}
                                            >
                                                {p.sale_price && Number(p.sale_price) < Number(p.price) ? (
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 6,
                                                            flexWrap: 'wrap',
                                                            lineHeight: 1.2,
                                                        }}
                                                    >
                                                        <span
                                                            style={{
                                                                textDecoration: 'line-through',
                                                                color: '#9E9E9E',
                                                                fontSize: 13,
                                                                whiteSpace: 'nowrap',
                                                            }}
                                                        >
                                                            {Number(p.price).toLocaleString('vi-VN')}đ
                                                        </span>

                                                        <span
                                                            style={{
                                                                color: '#D32F2F',
                                                                fontWeight: 700,
                                                                fontSize: 15,
                                                                whiteSpace: 'nowrap',
                                                            }}
                                                        >
                                                            {Number(p.sale_price).toLocaleString('vi-VN')}đ
                                                        </span>

                                                        <span
                                                            style={{
                                                                fontSize: 12,
                                                                color: '#666',
                                                                whiteSpace: 'nowrap',
                                                            }}
                                                        >
                                                            /{p.unit}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 4,
                                                            flexWrap: 'wrap',
                                                            lineHeight: 1.2,
                                                        }}
                                                    >
                                                        <span
                                                            style={{
                                                                color: '#333',
                                                                fontWeight: 700,
                                                                fontSize: 15,
                                                                whiteSpace: 'nowrap',
                                                            }}
                                                        >
                                                            {Number(p.price).toLocaleString('vi-VN')}đ
                                                        </span>

                                                        <span
                                                            style={{
                                                                fontSize: 12,
                                                                color: '#666',
                                                                whiteSpace: 'nowrap',
                                                            }}
                                                        >
                                                            /{p.unit}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="product-actions">
                                                <button 
                                                    className={`btn-add ${p.status === 'out_of_stock' ? 'disabled' : ''}`} 
                                                    onClick={(e) => handleAddToCart(p, e)}
                                                    disabled={p.status === 'out_of_stock'}
                                                    style={{
                                                        opacity: p.status === 'out_of_stock' ? 0.6 : 1,
                                                        cursor: p.status === 'out_of_stock' ? 'not-allowed' : 'pointer',
                                                        background: p.status === 'out_of_stock' ? '#ccc' : undefined,
                                                        width: '100%'
                                                    }}
                                                >
                                                    <ShoppingCart size={16} /> {p.status === 'out_of_stock' ? 'Hết' : 'Thêm'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="no-results">Không tìm thấy sản phẩm nào.</div>
                        )}

                        {/* Phân trang */}
                        {totalPages > 1 && (
                            <div className="pagination">
                                <button disabled={page === 1} onClick={() => setPage(page - 1)}>{'<'}</button>
                                {[...Array(totalPages)].map((_, i) => (
                                    <button key={i + 1} className={page === i + 1 ? 'active' : ''} onClick={() => setPage(i + 1)}>{i + 1}</button>
                                ))}
                                <button disabled={page === totalPages} onClick={() => setPage(page + 1)}>{'>'}</button>
                            </div>
                        )}
                    </>
                )}
            </section>

            {notify && <div className="notify-bottom show"><ShoppingCart size={20} /> {notify}</div>}
        </main>
    );
};

export default ProductList;