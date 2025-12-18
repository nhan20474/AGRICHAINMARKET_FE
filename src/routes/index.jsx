import React, { Suspense, lazy } from 'react';
import { Routes, Route, useParams } from 'react-router-dom';

// Import các component nhỏ, thường xuyên dùng
import Login from '../pages/Auth/Login';
import Register from '../pages/Auth/Register';
import AppLayout from '../Layout/AppLayout';
import ProfilePage from '../pages/Auth/Profile';
import CheckoutPage from '../pages/Market/Checkout';
import ProductManager from '../pages/Admin/ProductManager';
import Categories from '../pages/Admin/Categories';
import OrderHistory from '../pages/Market/OrderHistory';
import Notifications from '../pages/Market/Notifications';
import ShippingList from '../pages/Market/ShippingList';
import OrderShippingDetail from '../pages/Farmer/OrderShippingDetail';
import ProductDetail from '../pages/Market/ProductDetail';
import BroadcastNotification from '../pages/Admin/BroadcastNotification';
import ChatWidget from '../components/ChatWidget';
import PaymentResult from '../pages/Market/PaymentResult';
import ChangePassword from '../pages/Auth/ChangePassword';
import ForgotPassword from '../pages/Auth/ForgotPassword';
import ResetPassword from '../pages/Auth/ResetPassword';
import TracePage from '../pages/Public/TracePage';
import PanelManager from '../pages/Admin/PanelManager';
import DiscountManager from '../pages/Admin/DiscountManager';
import FarmerReport from '../pages/Farmer/FarmerReports';
import AdminReports from '../pages/Admin/AdminReports';
import AdminOrderManager from '../pages/Admin/OrderManager';

// Sử dụng lazy() cho các component lớn
const AdminDashboard = lazy(() => import('../pages/Admin/Dashboard'));
const FarmerDashboard = lazy(() => import('../pages/Farmer/MyProducts'));
const MarketDashboard = lazy(() => import('../pages/Market/Home')); 
const ProductList = lazy(() => import('../pages/Market/Productlist'));
const Cart = lazy(() => import('../pages/Market/Cart'));

const AppRoutes = () => (
  <Suspense fallback={<div style={{ padding: 16 }}>Đang tải...</div>}>
    <Routes>
      
      {/* ✅ Routes không cần Layout (Auth pages + Profile) */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/profile" element={<ProfilePage />} /> {/* ✅ DI CHUYỂN RA ĐÂY */}
      <Route path="/change-password" element={<ChangePassword />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/ping" element={<div style={{ padding: 16 }}>OK</div>} />

      {/* Payment callback routes */}
      <Route path="/payment/success" element={<PaymentResult />} />
      <Route path="/payment/failed" element={<PaymentResult />} />
      <Route path="/trace/:id" element={<TracePage />} />

      {/* Routes cần Layout (Market) */}
      <Route element={<AppLayout />}>
        <Route path="/" element={<MarketDashboard />} />
        <Route path="/shop" element={<MarketDashboard />} />
        <Route path="/market" element={<MarketDashboard />} />
        <Route path="/products" element={<ProductList />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/order-history" element={<OrderHistory />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/shipping-list" element={<ShippingList />} />
        <Route path="/shipping/update/:orderId" element={<OrderShippingDetailWrapper />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/admin/broadcast" element={<BroadcastNotification />} />
      </Route>

      {/* Routes Dashboard */}
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/product-manager" element={<ProductManager />} />
      <Route path="/admin/categories" element={<Categories />} />
      <Route path="/admin/panel-manager" element={<PanelManager />} />
      <Route path="/farmer/products" element={<FarmerDashboard />} />
      <Route path="/admin/discounts" element={<DiscountManager />} />
      <Route path="/farmer/reports" element={<FarmerReport />} />
      <Route path="/admin/reports" element={<AdminReports />} />
      <Route path="/admin/order-manager" element={<AdminOrderManager />} />
      {/* 404 */}
      <Route path="*" element={<div style={{ padding: 16 }}>Not Found</div>} />
    </Routes>
    <ChatWidget />
  </Suspense>
);

// ✅ Wrapper component để lấy orderId từ URL và sellerId từ localStorage
function OrderShippingDetailWrapper() {
  const { orderId } = useParams();
  
  // Lấy sellerId từ localStorage
  const getUserId = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) return Number(JSON.parse(userStr).id);
    } catch {}
    return null;
  };

  const sellerId = getUserId();
  
  if (!sellerId) {
    return (
      <div style={{ padding: 32 }}>
        <h2>Bạn cần đăng nhập để xem trang này</h2>
        <button onClick={() => window.location.href = '/login'}>Đăng nhập</button>
      </div>
    );
  }

  // Truyền sellerId vào component OrderShippingDetail
  return <OrderShippingDetail sellerId={sellerId} orderId={Number(orderId)} />;
}

export default AppRoutes;