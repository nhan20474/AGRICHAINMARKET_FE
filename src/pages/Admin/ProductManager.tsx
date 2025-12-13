import React, { useEffect, useState } from "react";
import ProductModal from "../../components/ProductManager/ProductModal";

const API_PRODUCT = "http://localhost:3000/api/products";
const API_ADMIN = "http://localhost:3000/api/admin";
const API_NOTIFY = "http://localhost:3000/api/notifications";
const API_FARMERS = "http://localhost:3000/api/admin/users/farmers";
const API_CATEGORIES = "http://localhost:3000/api/categories";
const API_UPLOAD = "http://localhost:3000/api/upload";
const BASE_URL = "http://localhost:3000";

interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  unit: string;
  image_url?: string;
  extra_images?: string[];
  status: string;
  seller_id?: number;
  seller_name?: string;
  category_id?: number;
  created_at?: string;
  updated_at?: string;
}

export default function ProductManager() {
  const CURRENT_USER_ROLE = localStorage.getItem("role") || "admin";
  const CURRENT_USER_ID = Number(localStorage.getItem("userId")) || 1;

  const [products, setProducts] = useState<Product[]>([]);
  const [sellers, setSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [notifyText, setNotifyText] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [formData, setFormData] = useState<any>({});
  const [uploading, setUploading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // -------------------------
  // Helpers
  // -------------------------
  const toast = (text: string, ms = 3000) => {
    setNotifyText(text);
    setTimeout(() => setNotifyText(""), ms);
  };

  const getImageUrl = (url?: string) => {
    if (!url) return "";
    return url.startsWith("/uploads") ? `${BASE_URL}${url}` : url;
  };

  // -------------------------
  // Load products & sellers
  // -------------------------
  async function loadProducts() {
    setLoading(true);
    try {
      const res = await fetch(API_PRODUCT);
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Load products error:", err);
      toast("Lỗi tải sản phẩm");
    }
    setLoading(false);
  }

  async function loadSellers() {
    if (CURRENT_USER_ROLE !== "admin") {
      setSellers([]);
      return;
    }
    try {
      const res = await fetch(API_FARMERS);
      if (!res.ok) {
        console.warn("farmers API responded", res.status);
        setSellers([]);
        return;
      }
      const data = await res.json();
      setSellers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Load sellers error:", err);
      setSellers([]);
    }
  }

  async function loadCategories() {
    try {
      const res = await fetch(API_CATEGORIES);
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Load categories error:", err);
    }
  }

  useEffect(() => {
    loadProducts();
    loadSellers();
    loadCategories();
  }, []);

  // -------------------------
  // Open modal add/edit
  // -------------------------
  const openAdd = () => {
    setIsEditing(false);
    setFormData({
      name: "",
      price: 0,
      unit: "kg",
      quantity: 100,
      description: "",
      status: "pending_approval",
      image_url: "",
      extra_images: [],
      seller_id: CURRENT_USER_ROLE === "admin" ? "" : CURRENT_USER_ID,
    });
    setShowModal(true);
  };

  const openEdit = (p: Product) => {
    setIsEditing(true);
    setFormData({
      ...p,
      extra_images: Array.isArray(p.extra_images) ? p.extra_images : [],
    });
    setShowModal(true);
  };

  // -------------------------
  // Upload single file helper (if you need to call upload separately)
  // -------------------------
  async function uploadFile(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(API_UPLOAD, { method: "POST", body: fd });
    if (!res.ok) throw new Error("Upload thất bại");
    return res.json(); // expect { fileUrl: '/uploads/...' }
  }

  // -------------------------
  // Save product (called by modal)
  // onSave receives FormData from modal
  // -------------------------
  const handleSave = async (fd: FormData) => {
    try {
      setUploading(true);

      // set seller_id based on role
      if (CURRENT_USER_ROLE !== "admin") {
        fd.set("seller_id", String(CURRENT_USER_ID));
      } else {
        // ensure seller_id exists on formData if admin
        const s = fd.get("seller_id");
        if (!s) {
          setUploading(false);
          toast("Admin phải chọn Người bán (seller).");
          return;
        }
      }

      // If editing, use PUT to /api/products/:id (FormData supports files)
      const isEdit = Boolean(isEditing && formData?.id);
      const url = isEdit ? `${API_PRODUCT}/${formData.id}` : API_PRODUCT;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        body: fd,
      });

      const text = await res.text();
      let json;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        json = { message: text };
      }

      if (!res.ok) {
        console.error("Save product error:", res.status, json);
        toast(json?.error || json?.message || "Lỗi lưu sản phẩm");
        setUploading(false);
        return;
      }

      toast(isEdit ? "✅ Cập nhật sản phẩm" : "✅ Thêm sản phẩm");
      setShowModal(false);
      await loadProducts();
    } catch (err) {
      console.error("Save exception:", err);
      toast("Lỗi khi lưu sản phẩm");
    } finally {
      setUploading(false);
    }
  };

  // -------------------------
  // Delete (soft delete) or permanent
  // -------------------------
  const handleDelete = async (id: number) => {
    if (CURRENT_USER_ROLE !== "admin") {
      alert("⛔ Chỉ Admin mới có quyền xóa sản phẩm.");
      return;
    }
    if (!window.confirm("Xóa sản phẩm (soft delete)?")) return;

    try {
      const res = await fetch(`${API_PRODUCT}/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const txt = await res.text();
        const parsed = (() => {
          try { return JSON.parse(txt); } catch { return txt; }
        })();
        console.error("Delete error:", parsed);
        toast("Không thể xóa sản phẩm");
        return;
      }
      toast("🗑️ Đã xóa (soft)");
      loadProducts();
    } catch (err) {
      console.error("Delete exception:", err);
      toast("Lỗi xóa");
    }
  };

  // -------------------------
  // Hard delete (admin)
  // -------------------------
  const handleHardDelete = async (id: number) => {
    if (!window.confirm("Xóa vĩnh viễn sản phẩm?")) return;
    try {
      const res = await fetch(`${API_PRODUCT}/${id}/permanent`, { method: "DELETE" });
      if (!res.ok) {
        const txt = await res.text();
        console.error("Hard delete error:", txt);
        toast("Không thể xóa vĩnh viễn");
        return;
      }
      toast("Đã xóa vĩnh viễn");
      loadProducts();
    } catch (err) {
      console.error("Hard delete exception:", err);
      toast("Lỗi xóa vĩnh viễn");
    }
  };

  // -------------------------
  // Approve / Reject (review)
  // -------------------------
  const handleReview = async (id: number, action: "approve" | "reject") => {
    const endpoint = action === "approve" ? "approve-product" : "reject-product";
    let reason = "";

    if (action === "reject") {
      const input = window.prompt("Nhập lý do từ chối (để trống nếu không có):");
      if (input === null) return;
      reason = input;
    } else {
      if (!window.confirm("Bạn xác nhận muốn DUYỆT sản phẩm này?")) return;
    }

    try {
      const res = await fetch(`${API_ADMIN}/${endpoint}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      if (!res.ok) {
        const txt = await res.text();
        let err;
        try { err = JSON.parse(txt); } catch { err = txt; }
        console.error("Review error:", err);
        toast("Duyệt thất bại");
        return;
      }

      // Update local list quickly
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, status: action === "approve" ? "available" : "rejected" } : p)));
      toast(action === "approve" ? "✅ Đã duyệt" : "❌ Đã từ chối");
    } catch (err) {
      console.error("Review exception:", err);
      toast("Lỗi khi duyệt/từ chối");
    }
  };

  // -------------------------
  // Request restock (notify seller)
  // -------------------------
  const handleRequestRestock = async (product: Product) => {
    if (!product.seller_id) {
      alert("Không có seller_id");
      return;
    }
    const defaultMsg = `Sản phẩm "${product.name}" hiện chỉ còn ${product.quantity} ${product.unit}. Vui lòng nhập thêm hàng.`;
    const message = window.prompt("Nhập lời nhắn gửi Seller:", defaultMsg);
    if (message === null) return;

    try {
      const res = await fetch(API_NOTIFY, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: product.seller_id,
          sender_id: CURRENT_USER_ID,
          type: "inventory_warning",
          title: "⚠️ Yêu cầu bổ sung hàng",
          message,
          product_id: product.id,
        }),
      });

      if (!res.ok) {
        const txt = await res.text();
        console.error("Notify error:", txt);
        toast("Gửi yêu cầu thất bại");
        return;
      }

      toast(`✅ Đã gửi yêu cầu tới Seller #${product.seller_id}`);
    } catch (err) {
      console.error("Notify exception:", err);
      toast("Lỗi gửi yêu cầu");
    }
  };

  // -------------------------
  // Filtering
  // -------------------------
  const filteredList = products.filter((p) => {
    const matchStatus = filterStatus === "all" || p.status === filterStatus;
    const matchSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchSearch;
  });

  // -------------------------
  // Render
  // -------------------------
  return (
    <div className="dashboard-main-content">
      <h2>Quản lý sản phẩm</h2>

        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
                <input 
                    placeholder="🔍 Tìm tên sản phẩm..." 
                    value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                    style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 4, flex: 1 }}
                />
                <select 
                    value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                    style={{ padding: '8px', border: '1px solid #ddd', borderRadius: 4 }}
                >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="pending_approval">⏳ Chờ duyệt</option>
                    <option value="available">✅ Đang bán</option>
                    <option value="rejected">❌ Đã từ chối</option>
                    <option value="out_of_stock">🚫 Hết hàng</option>
                </select>
                <button onClick={openAdd} style={{ padding: '8px 16px', background: '#2196F3', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}>
                    + Thêm mới
                </button>
            </div>

      <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff" }}>
        <thead style={{ background: "#f8f9fa" }}>
          <tr>
            <th style={{ padding: 12, textAlign: "left" }}>Sản phẩm</th>
            <th style={{ padding: 12 }}>Giá</th>
            <th style={{ padding: 12 }}>Kho</th>
            <th style={{ padding: 12 }}>Người bán</th>
            <th style={{ padding: 12, textAlign: "center" }}>Trạng thái</th>
            <th style={{ padding: 12, textAlign: "right" }}>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {filteredList.map((p) => {
            return (
              <tr key={p.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: 12, display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{ width: 48, height: 48, borderRadius: 6, overflow: "hidden", background: "#f5f5f5" }}>
                    {p.image_url ? <img src={getImageUrl(p.image_url)} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: "#888" }}>ID: {p.id}</div>
                  </div>
                </td>

                <td style={{ padding: 12 }}>{p.price?.toLocaleString()} đ</td>
                <td style={{ padding: 12 }}>{p.quantity} {p.unit}</td>
                <td style={{ padding: 12 }}>{p.seller_name || `#${p.seller_id}`}</td>
                <td style={{ padding: 12, textAlign: "center" }}>
                  <div style={{ padding: "6px 10px", borderRadius: 999, background: p.status === "available" ? "#E8F5E9" : p.status === "pending_approval" ? "#FFF3E0" : "#FFEBEE", color: p.status === "available" ? "#2E7D32" : p.status === "pending_approval" ? "#E65100" : "#C62828", fontWeight: 700 }}>
                    {p.status === "available" ? "Đang bán" : p.status === "pending_approval" ? "Chờ duyệt" : p.status === "rejected" ? "Từ chối" : p.status}
                  </div>
                </td>
                <td style={{ padding: 12, textAlign: "right" }}>
                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    {p.status === "pending_approval" ? (
                      <>
                        <button onClick={() => handleReview(p.id, "approve")} style={{ background: "#4CAF50", color: "#fff", border: "none", padding: "6px 10px" }}>✔ Duyệt</button>
                        <button onClick={() => handleReview(p.id, "reject")} style={{ background: "#F44336", color: "#fff", border: "none", padding: "6px 10px" }}>✘ Từ chối</button>
                        <button onClick={() => openEdit(p)} style={{ background: "#e0e0e0", border: "none", padding: "6px 10px" }}>✏️</button>
                      </>
                    ) : (
                      <>
                        {(p.status === "out_of_stock" || (p.status === "available" && (p.quantity || 0) <= 10)) && (
                          <button onClick={() => handleRequestRestock(p)} style={{ background: "#FF9800", color: "#fff", border: "none", padding: "6px 10px" }}>📦 Nhập</button>
                        )}
                        <button onClick={() => openEdit(p)} style={{ background: "#2196F3", color: "#fff", border: "none", padding: "6px 10px" }}>Sửa</button>
                        {CURRENT_USER_ROLE === "admin" && (
                          <button onClick={() => handleDelete(p.id)} style={{ background: "#fff", border: "1px solid #ccc", color: "#d32f2f", padding: "6px 10px" }}>Xóa</button>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {notifyText && (
        <div style={{ position: "fixed", right: 20, bottom: 20, background: "#333", color: "#fff", padding: "10px 16px", borderRadius: 8 }}>
          {notifyText}
        </div>
      )}

      {showModal && (
        <ProductModal
          isEditing={isEditing}
          formData={formData}
          setFormData={setFormData}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
          uploading={uploading}
          sellers={sellers}
          categories={categories}
          currentRole={CURRENT_USER_ROLE}
        />
      )}
    </div>
  );
}
