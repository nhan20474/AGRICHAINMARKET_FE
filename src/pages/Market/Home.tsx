/* ------------------------------- IMPORT ------------------------------- */
import React, { useEffect, useRef, useState } from "react";
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

/** Normalize product to conform exactly to Product interface types.
 *  Important: sale_price will be `number | undefined` (never null).
 */
const normalizeProductToProduct = (p: any): Product => {
  // price might come as number or string from backend -> force Number
  const priceNum = Number(p.price ?? 0);

  // sale_price might be undefined/null/string/number -> convert to number or undefined
  const rawSale = p.sale_price;
  const saleNum =
    rawSale !== null && rawSale !== undefined && rawSale !== ""
      ? Number(rawSale)
      : undefined;

  // Build Product typed object (keep other fields as-is)
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
    category_id: p.category_id !== undefined && p.category_id !== null ? Number(p.category_id) : undefined,
    created_at: p.created_at,
    updated_at: p.updated_at,
    rating: p.rating !== undefined ? Number(p.rating) : undefined,
    review_count: p.review_count !== undefined ? Number(p.review_count) : undefined,
    sold_count: p.sold_count !== undefined ? Number(p.sold_count) : undefined,
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

        // Normalize items and cast to Product[]
        const normalized: Product[] = (productData || []).map((p: any) =>
          normalizeProductToProduct(p)
        );

        // Only set available products (still Product[])
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

  // Sale products: ensure sale_price is a number and less than price
  const saleProducts = products.filter(
    (p) => typeof p.sale_price === "number" && !Number.isNaN(p.sale_price) && p.sale_price < p.price
  );

  // Featured = products that are NOT sale products (to avoid duplication)
  const featured = products.filter(
    (p) => !(typeof p.sale_price === "number" && !Number.isNaN(p.sale_price) && p.sale_price < p.price)
  ).slice(0, 10);

  const aiSuggestion = products.slice(0, 10);

  /* ------------------------ CLONE LOOP LOGIC ------------------------ */
  const setupCloneLoop = (list: any[]) => {
    if (!list || list.length === 0) return [];
    if (list.length === 1) return list;
    return [list[list.length - 1], ...list, list[0]];
  };

  const cloneBanner = setupCloneLoop(bannerList);
  const cloneFeatured = setupCloneLoop(featured);
  const cloneAI = setupCloneLoop(aiSuggestion);
  const cloneSale = setupCloneLoop(saleProducts);

  /* ----------------------- SCROLL SYNC ----------------------- */
 const handleScrollSync = (ref: React.RefObject<HTMLDivElement>, list: Product[]) => {
  const track = ref.current;
  if (!track || list.length <= 1) return;
  const itemWidth = track.clientWidth; // width 1 item = track width (hoặc tính theo item trong carousel)

  // Scroll tới clone cuối → reset về item đầu thật
  if (track.scrollLeft >= (list.length - 1) * itemWidth) {
    track.style.scrollBehavior = "auto";
    track.scrollLeft = itemWidth; // scroll tới item đầu thật
    track.style.scrollBehavior = "smooth";
  }

  // Scroll tới clone đầu → reset về item cuối thật
  if (track.scrollLeft <= 0) {
    track.style.scrollBehavior = "auto";
    track.scrollLeft = (list.length - 2) * itemWidth;
    track.style.scrollBehavior = "smooth";
  }
};


  /* ---------------------------- BUTTON SCROLL ---------------------------- */
const scrollLeft = (ref: React.RefObject<HTMLDivElement>, list: Product[]) => {
  const track = ref.current;
  if (!track) return;
  track.scrollBy({ left: -track.clientWidth, behavior: "smooth" });
  setTimeout(() => handleScrollSync(ref, list), 100); // sync sau khi scroll xong
};

const scrollRight = (ref: React.RefObject<HTMLDivElement>, list: Product[]) => {
  const track = ref.current;
  if (!track) return;
  track.scrollBy({ left: track.clientWidth, behavior: "smooth" });
  setTimeout(() => handleScrollSync(ref, list), 100);
};


  /* ------------------------- AUTO SCROLL --------------------------- */
  useEffect(() => {
  const intervals = [
    { ref: bannerRef, list: cloneBanner },
    { ref: featuredRef, list: cloneFeatured },
    { ref: aiRef, list: cloneAI },
    { ref: saleRef, list: cloneSale },
  ].map(item => {
    if (!item.list || item.list.length <= 1) return null;
    return window.setInterval(() => scrollRight(item.ref, item.list), 4000);
  });

  return () => intervals.forEach(i => i && clearInterval(i));
}, [cloneBanner, cloneFeatured, cloneAI, cloneSale]);

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
    // price and sale_price are normalized to numbers or undefined
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
          <Star size={12} fill="#FFD700" /> {p.rating || 0}
        </div>

        <button className="btn-cart" onClick={(e) => handleAdd(e, p)}>
          <ShoppingCart size={16} /> Thêm vào giỏ
        </button>
      </div>
    );
  };

  if (loading) return <div className="loading">Đang tải...</div>;

  /* ----------------------------- RENDER ----------------------------- */
  return (
    <main className="home-container">
      {/* ===================== BANNER SLIDER ===================== */}
      <section className="banner-slider">
        {cloneBanner.length === 0 ? (
          <div className="banner-placeholder">Chưa có banner</div>
        ) : (
          <>
            <button className="banner-nav left" onClick={() => scrollLeft(bannerRef, cloneBanner)}>
              <ChevronLeft />
            </button>

            <div className="banner-track" ref={bannerRef}>
              {cloneBanner.map((img, i) => (
                <img key={i} src={getImageUrl(img)} className="banner-img" alt={`banner-${i}`} />
              ))}
            </div>

            <button className="banner-nav right" onClick={() => scrollRight(bannerRef, cloneBanner)}>
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
              onClick={() => navigate(`/products?category=${c.id}`)}
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
          <button className="carousel-btn left" onClick={() => scrollLeft(featuredRef, cloneFeatured)}>
            <ChevronLeft size={20} />
          </button>

          <div className="carousel-track" ref={featuredRef}>
            {cloneFeatured.map((p, i) => (
              <div className="carousel-item" key={`${p.id}-f-${i}`}>
                <ProductCard p={p} />
              </div>
            ))}
          </div>

          <button className="carousel-btn right" onClick={() => scrollRight(featuredRef, cloneFeatured)}>
            <ChevronRight size={20} />
          </button>
        </div>
      </section>

      {/* ===================== GỢI Ý AI ===================== */}
      <section className="carousel-section">
        <h2 className="section-title">Gợi Ý Dựa Trên AI</h2>

        <div className="carousel-container">
          <button className="carousel-btn left" onClick={() => scrollLeft(aiRef, cloneAI)}>
            <ChevronLeft size={20} />
          </button>

          <div className="carousel-track" ref={aiRef}>
            {cloneAI.map((p, i) => (
              <div className="carousel-item" key={`${p.id}-a-${i}`}>
                <ProductCard p={p} />
              </div>
            ))}
          </div>

          <button className="carousel-btn right" onClick={() => scrollRight(aiRef, cloneAI)}>
            <ChevronRight size={20} />
          </button>
        </div>
      </section>

      {/* ================== SẢN PHẨM GIẢM GIÁ ================== */}
      <section className="carousel-section">
        <h2 className="section-title">SẢN PHẨM GIẢM GIÁ</h2>

        <div className="carousel-container">
          <button className="carousel-btn left" onClick={() => scrollLeft(saleRef, cloneSale)}>
            <ChevronLeft size={20} />
          </button>

          <div className="carousel-track" ref={saleRef}>
            {cloneSale.map((p, i) => (
              <div className="carousel-item" key={`${p.id}-s-${i}`}>
                <ProductCard p={p} />
              </div>
            ))}
          </div>

          <button className="carousel-btn right" onClick={() => scrollRight(saleRef, cloneSale)}>
            <ChevronRight size={20} />
          </button>
        </div>
      </section>
    </main>
  );
}
