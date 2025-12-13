// src/components/Layout/Footer.tsx

import React from 'react';
import '../styles/Footer.css'; // Đảm bảo đường dẫn CSS đúng

const Footer: React.FC = () => {
    return (
        <>
            {/* 🔹 FOOTER */}
            <footer className="market-footer">
                <div className="footer-col">
                    <h4>🧭 THÔNG TIN</h4>
                    <ul>
                        <li>Giới thiệu AgriChain</li>
                        <li>Chính sách bảo mật</li>
                        <li>Điều khoản sử dụng</li>
                    </ul>
                </div>
                <div className="footer-col">
                    <h4>💬 HỖ TRỢ</h4>
                    <ul>
                        <li>Hỏi đáp (FAQ)</li>
                        <li>Hướng dẫn mua hàng</li>
                        <li>Chính sách đổi trả</li>
                    </ul>
                </div>
                <div className="footer-col contact-info">
                    <h4>📞 LIÊN HỆ</h4>
                    <p>Email: support@agri.vn</p>
                    <p>Hotline: **0123 456 789**</p>
                    <p>Địa chỉ: TP. Hồ Chí Minh, Việt Nam</p>
                </div>
                <div className="footer-col newsletter">
                    <h4>Đăng ký nhận tin</h4>
                    <p>Nhận các ưu đãi mới nhất từ AgriChain Market.</p>
                    <input type="email" placeholder="Nhập email của bạn..." />
                    <button>Đăng ký</button>
                </div>
            </footer>

            <div className="footer-bottom">
                &copy; 2025 AgriChain Market. All rights reserved.
            </div>
        </>
    );
};

export default Footer;