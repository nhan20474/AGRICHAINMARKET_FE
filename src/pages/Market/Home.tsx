/* ------------------------------- IMPORT ------------------------------- */
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Star, ShoppingCart } from "lucide-react";

import "../../styles/Home.css";
import { cartService } from "../../services/cartService";
import { productService, Product } from "../../services/productService";
import { panelService, Panel } from "../../services/panelService";

/* ------------------------------- HELPERS ------------------------------- */
function getUserId() {
  try {
    const userStr = localStorage.getItem("user");
    if (userStr) return Number(JSON.parse(userStr).id);
  } catch {}
  return null;
}
const getImageUrl = (url?: string) => {
  if (!url) return "/img/default-product.jpg";
  if (url.startsWith("http")) return url;
  return `http://localhost:3000${url}`;
};

const normalizeProductToProduct = (p: any): Product => {
  const priceNum = Number(p.price ?? 0);
  const rawSale = p.sale_price;
  const saleNum =
    rawSale !== null && rawSale !== undefined && rawSale !== ""
      ? Number(rawSale)
      : undefined;

  const normalized: Product = {
    id: Number(p.id),
    name: String(p.name ?? ""),
    description: p.description,
    price: priceNum,
    sale_price: saleNum === undefined || Number.isNaN(saleNum) ? undefined : saleNum,
    quantity: Number(p.quantity ?? 0),
    unit: String(p.unit ?? ""),
    image_url: p.image_url,
    extra_images: p.extra_images,
    status: String(p.status ?? ""),
    seller_id: Number(p.seller_id ?? 0),
    category_id: p.category_id ? Number(p.category_id) : undefined,
    created_at: p.created_at,
    updated_at: p.updated_at,
    rating: p.rating ? Number(p.rating) : undefined,
    review_count: p.review_count ? Number(p.review_count) : undefined,
    sold_count: p.sold_count ? Number(p.sold_count) : undefined,
    seller_name: p.seller_name,
    category_name: p.category_name,
  };
  return normalized;
};

/* --------------------------- COMPONENT PAGE --------------------------- */
export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [panels, setPanels] = useState<Panel[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State để tạm dừng auto scroll khi hover
  const [isPaused, setIsPaused] = useState(false);

  const navigate = useNavigate();

  const bannerRef = useRef<HTMLDivElement>(null);
  const featuredRef = useRef<HTMLDivElement>(null);
  const aiRef = useRef<HTMLDivElement>(null);
  const saleRef = useRef<HTMLDivElement>(null);

  /* --------------------------- LOAD DATA --------------------------- */
  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        const [productData, panelData] = await Promise.all([
          productService.getAll(),
          panelService.getAll(),
        ]);

        if (!mounted) return;

        const normalized: Product[] = (productData || []).map((p: any) =>
          normalizeProductToProduct(p)
        );

        setProducts(normalized.filter((p) => p.status === "available"));
        setPanels(panelData || []);
      } catch (err) {
        console.error("Error loading homepage:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      mounted = false;
    };
  }, []);

  /* ----------------------------- DATA ------------------------------ */
  const bannerList = panels.find((p) => p.page === "banner")?.images || [];
  const categories = panels.filter((p) => p.page === "categories");

  const saleProducts = products.filter(
    (p) => typeof p.sale_price === "number" && !Number.isNaN(p.sale_price) && p.sale_price < p.price
  );

  const featured = products.filter(
    (p) => !(typeof p.sale_price === "number" && !Number.isNaN(p.sale_price) && p.sale_price < p.price)
  ).slice(0, 10);

  const aiSuggestion = products.slice(0, 10);

  /* ------------------------ CLONE LOOP LOGIC (BANNER ONLY) ------------------------ */
  // Chỉ dùng clone loop cho Banner vì banner hiển thị 1 hình/lần
  const setupBannerLoop = (list: any[]) => {
    if (!list || list.length === 0) return [];
    if (list.length === 1) return list;
    return [list[list.length - 1], ...list, list[0]];
  };

  const cloneBanner = setupBannerLoop(bannerList);
  
  // Các list sản phẩm KHÔNG dùng clone loop để tránh lỗi hiển thị
  // Nếu muốn infinite loop cho product, cần thư viện như Swiper hoặc logic phức tạp hơn
  
  /* ----------------------- SCROLL SYNC (BANNER ONLY) ----------------------- */
  const handleBannerScrollSync = () => {
    const track = bannerRef.current;
    if (!track || cloneBanner.length <= 1) return;
    
    const itemWidth = track.clientWidth; // Banner luôn full width container

    // Scroll tới clone cuối → reset về item đầu thật
    if (track.scrollLeft >= (cloneBanner.length - 1) * itemWidth - 10) { // -10 sai số
      track.style.scrollBehavior = "auto";
      track.scrollLeft = itemWidth;
      track.style.scrollBehavior = "smooth";
    }

    // Scroll tới clone đầu → reset về item cuối thật
    if (track.scrollLeft <= 0) {
      track.style.scrollBehavior = "auto";
      track.scrollLeft = (cloneBanner.length - 2) * itemWidth;
      track.style.scrollBehavior = "smooth";
    }
  };

  /* ---------------------------- BUTTON SCROLL ---------------------------- */
  const scrollContainer = (ref: React.RefObject<HTMLDivElement>, direction: 'left' | 'right', isBanner = false) => {
    const track = ref.current;
    if (!track) return;
    
    // Nếu là banner thì scroll theo chiều rộng container (1 item)
    // Nếu là product list thì scroll theo khoảng 300px hoặc chiều rộng container
    const scrollAmount = isBanner ? track.clientWidth : 300; 

    if (direction === 'left') {
      track.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    } else {
      track.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }

    if (isBanner) {
      setTimeout(handleBannerScrollSync, 300);
    }
  };

  /* ------------------------- AUTO SCROLL --------------------------- */
  useEffect(() => {
    if (isPaused) return; // Nếu đang hover thì không chạy auto scroll

    // 1. Banner Auto Scroll (Infinite Loop)
    const bannerInterval = setInterval(() => {
      if (bannerRef.current && cloneBanner.length > 1) {
        scrollContainer(bannerRef, 'right', true);
      }
    }, 4000);

    // 2. Products Auto Scroll (Chạy đến cuối rồi quay lại đầu)
    const productAutoScroll = (ref: React.RefObject<HTMLDivElement>, list: any[]) => {
       if (!ref.current || list.length === 0) return;
       const track = ref.current;
       // Nếu đã cuộn đến cuối (cộng thêm sai số nhỏ)
       if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 10) {
          track.scrollTo({ left: 0, behavior: "smooth" });
       } else {
          scrollContainer({ current: track }, 'right', false);
       }
    };

    const featuredInterval = setInterval(() => productAutoScroll(featuredRef, featured), 5000);
    const aiInterval = setInterval(() => productAutoScroll(aiRef, aiSuggestion), 6000); // Lệch thời gian cho tự nhiên
    const saleInterval = setInterval(() => productAutoScroll(saleRef, saleProducts), 5500);

    return () => {
      clearInterval(bannerInterval);
      clearInterval(featuredInterval);
      clearInterval(aiInterval);
      clearInterval(saleInterval);
    };
  }, [cloneBanner, featured, aiSuggestion, saleProducts, isPaused]);

  /* ----------------------------- ADD CART ------------------------------ */
  const handleAdd = async (e: any, product: Product) => {
    e.stopPropagation();
    const uid = getUserId();
    if (!uid) return navigate("/login");
    try {
      await cartService.addItem(uid, {
        product_id: product.id,
        quantity: 1,
      });
      alert("Đã thêm vào giỏ");
    } catch (err) {
      console.error("Add to cart error:", err);
      alert("Thêm giỏ hàng thất bại");
    }
  };

  /* ---------------------------- PRODUCT CARD ---------------------------- */
  const ProductCard = ({ p }: { p: Product }) => {
    const price = Number(p.price ?? 0);
    const sale = p.sale_price !== undefined ? Number(p.sale_price) : undefined;
    const isSale = typeof sale === "number" && !Number.isNaN(sale) && sale < price;
    const discountPercent = isSale ? Math.round(((price - (sale as number)) / price) * 100) : 0;

    return (
      <div className="product-card" onClick={() => navigate(`/product/${p.id}`)}>
        <div className="product-img-wrapper">
          <img src={getImageUrl(p.image_url)} className="product-img" alt={p.name} />
          {isSale && <span className="badge-discount">-{discountPercent}%</span>}
        </div>

        <h3 className="product-name">{p.name}</h3>

        <div className="price-row">
          {!isSale ? (
            <span className="price">{price.toLocaleString()}đ</span>
          ) : (
            <>
              <span className="price-sale">{(sale as number).toLocaleString()}đ</span>
              <span className="price-old">{price.toLocaleString()}đ</span>
            </>
          )}
        </div>

        <div className="meta-row">
          <Star size={12} fill="#FFD700" textAnchor="middle" strokeWidth={0} /> 
          <span style={{ marginLeft: 4, fontSize: 12 }}>{p.rating || 0}</span>
        </div>

        <button className="btn-cart" onClick={(e) => handleAdd(e, p)}>
          <ShoppingCart size={16} /> Thêm
        </button>
      </div>
    );
  };

  if (loading) return <div className="loading">Đang tải...</div>;

  /* ----------------------------- RENDER ----------------------------- */
  return (
    <main 
      className="home-container"
      // Tạm dừng auto scroll khi chuột ở trong khu vực main
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* ===================== BANNER SLIDER ===================== */}
      <section className="banner-slider">
        {cloneBanner.length === 0 ? (
          <div className="banner-placeholder">Chưa có banner</div>
        ) : (
          <>
            <button className="banner-nav left" onClick={() => scrollContainer(bannerRef, 'left', true)}>
              <ChevronLeft />
            </button>

            {/* Banner cần sự kiện scroll để sync loop */}
            <div className="banner-track" ref={bannerRef} onScroll={handleBannerScrollSync}>
              {cloneBanner.map((img, i) => (
                <img key={i} src={getImageUrl(img)} className="banner-img" alt={`banner-${i}`} />
              ))}
            </div>

            <button className="banner-nav right" onClick={() => scrollContainer(bannerRef, 'right', true)}>
              <ChevronRight />
            </button>
          </>
        )}
      </section>

      {/* =================== DANH MỤC =================== */}
      <section className="category-section">
        <h2 className="section-title">DANH MỤC NÔNG SẢN</h2>
        <div className="category-grid">
          {categories.map((c) => (
            <div
              key={c.id}
              className="category-item"
              onClick={() => navigate(`/products?category=${encodeURIComponent(c.name)}`)}
              >
              <img src={getImageUrl(c.images?.[0])} alt={c.name} />
              <span>{c.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ================== SẢN PHẨM NỔI BẬT ================== */}
      <section className="carousel-section">
        <h2 className="section-title">SẢN PHẨM NỔI BẬT</h2>
        <div className="carousel-container">
          <button className="carousel-btn left" onClick={() => scrollContainer(featuredRef, 'left')}>
            <ChevronLeft size={20} />
          </button>
          <div className="carousel-track" ref={featuredRef}>
            {featured.map((p) => (
              <div className="carousel-item" key={p.id}>
                <ProductCard p={p} />
              </div>
            ))}
          </div>
          <button className="carousel-btn right" onClick={() => scrollContainer(featuredRef, 'right')}>
            <ChevronRight size={20} />
          </button>
        </div>
      </section>

      {/* ===================== GỢI Ý AI ===================== */}
      <section className="carousel-section">
        <h2 className="section-title">Gợi Ý Dựa Trên AI</h2>
        <div className="carousel-container">
          <button className="carousel-btn left" onClick={() => scrollContainer(aiRef, 'left')}>
            <ChevronLeft size={20} />
          </button>
          <div className="carousel-track" ref={aiRef}>
            {aiSuggestion.map((p) => (
              <div className="carousel-item" key={p.id}>
                <ProductCard p={p} />
              </div>
            ))}
          </div>
          <button className="carousel-btn right" onClick={() => scrollContainer(aiRef, 'right')}>
            <ChevronRight size={20} />
          </button>
        </div>
      </section>

      {/* ================== SẢN PHẨM GIẢM GIÁ ================== */}
      <section className="carousel-section">
        <h2 className="section-title">SẢN PHẨM GIẢM GIÁ</h2>
        <div className="carousel-container">
          <button className="carousel-btn left" onClick={() => scrollContainer(saleRef, 'left')}>
            <ChevronLeft size={20} />
          </button>
          <div className="carousel-track" ref={saleRef}>
            {saleProducts.map((p) => (
              <div className="carousel-item" key={p.id}>
                <ProductCard p={p} />
              </div>
            ))}
          </div>
          <button className="carousel-btn right" onClick={() => scrollContainer(saleRef, 'right')}>
            <ChevronRight size={20} />
          </button>
        </div>
      </section>
    </main>
  );
}