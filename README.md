# 🌾 Hệ Thống Quản Lý Nông Sản

Nền tảng kết nối nông dân với người tiêu dùng, tích hợp Blockchain để truy xuất nguồn gốc và AI hỗ trợ định giá.

## 📋 Mục Lục

- [Giới thiệu](#giới-thiệu)
- [Tính năng](#tính-năng)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
- [Cài đặt](#cài-đặt)
- [Cách chạy dự án](#cách-chạy-dự-án)
- [Cấu trúc thư mục](#cấu-trúc-thư-mục)
- [Phân quyền người dùng](#phân-quyền-người-dùng)
- [Screenshots](#screenshots)
- [API Documentation](#api-documentation)
- [Đóng góp](#đóng-góp)
- [License](#license)

## 🎯 Giới Thiệu

Hệ thống quản lý nông sản là nền tảng marketplace kết nối trực tiếp giữa nông dân và người tiêu dùng, giúp:

- ✅ Nông dân bán sản phẩm trực tiếp, tăng lợi nhuận
- ✅ Người tiêu dùng mua hàng an toàn, rõ nguồn gốc
- ✅ Minh bạch hóa chuỗi cung ứng qua Blockchain
- ✅ Hỗ trợ AI gợi ý giá và phân tích thị trường

## ✨ Tính Năng

### 🔐 Quản lý người dùng
- Đăng ký/Đăng nhập với 3 vai trò: Admin, Nông dân, Người tiêu dùng
- Phân quyền rõ ràng theo role-based access control
- Xác thực email và bảo mật tài khoản

### 🌾 Nông dân
- Đăng tải sản phẩm (hình ảnh, mô tả, giá, số lượng)
- Quản lý kho hàng và tồn kho
- Theo dõi đơn hàng và doanh thu cá nhân
- Tạo QR code truy xuất nguồn gốc sản phẩm
- AI gợi ý giá bán hợp lý

### 🛒 Người tiêu dùng
- Tìm kiếm sản phẩm theo loại, giá, vị trí, mùa vụ
- Đặt hàng và thanh toán trực tuyến
- Quét QR code để xem lịch sử sản phẩm
- Đánh giá và phản hồi sản phẩm
- Theo dõi trạng thái đơn hàng real-time

### 👨‍💼 Admin
- Quản lý toàn bộ users, products, orders
- Dashboard thống kê tổng quan
- Duyệt và kiểm duyệt sản phẩm
- Giám sát giao dịch và báo cáo

### 🔗 Blockchain & AI
- Truy xuất nguồn gốc minh bạch
- AI phân tích xu hướng mùa vụ
- Đánh giá chất lượng sản phẩm qua hình ảnh
- Cá nhân hóa trải nghiệm mua sắm

## 🚀 Công Nghệ Sử Dụng

### Frontend
- **React 18.2.0** - Thư viện UI hiện đại
- **TypeScript 5.6.3** - Type safety và IntelliSense
- **Vite 5.4.10** - Build tool nhanh chóng
- **React Router DOM 6.27.0** - Routing SPA
- **CSS3** - Styling với Gradients, Animations, Flexbox, Grid

### Development Tools
- **@vitejs/plugin-react 4.3.1** - Plugin React cho Vite
- **@types/react & @types/react-dom** - TypeScript definitions

### Testing (Optional)
- **@testing-library/react 16.3.0** - Component testing
- **@testing-library/jest-dom 6.9.1** - Custom Jest matchers
- **@testing-library/user-event 13.5.0** - User interaction testing

### Future Integrations
- **Backend**: Node.js + Express hoặc NestJS
- **Database**: PostgreSQL + MongoDB
- **Blockchain**: Ethereum/Hyperledger
- **AI/ML**: TensorFlow.js, Python (FastAPI)
- **Payment**: Stripe, VNPay, Momo
- **Cloud**: AWS S3, Firebase Storage

## 💻 Yêu Cầu Hệ Thống

- **Node.js**: >= 18.x (LTS recommended)
- **npm**: >= 9.x hoặc **yarn**: >= 1.22.x
- **RAM**: >= 4GB
- **Disk**: >= 500MB free space
- **Browser**: Chrome/Firefox/Safari/Edge (latest version)

## 📦 Cài Đặt

### Bước 1: Clone Repository

```bash
# Clone qua HTTPS
git clone https://github.com/nhan20474/Do_An_Chuyen_Nganh.git

# Hoặc clone qua SSH
git clone git@github.com:nhan20474/Do_An_Chuyen_Nganh.git

# Di chuyển vào thư mục dự án
cd Do_An_Chuyen_Nganh/do_an_chuyen_nganh
```

### Bước 2: Cài Đặt Dependencies

```bash
# Sử dụng npm
npm install

# Hoặc sử dụng yarn
yarn install
```

### Bước 3: Cấu Hình Environment (Optional)

Tạo file `.env.local` trong thư mục root:

```env
# API Endpoint (khi có backend)
VITE_API_URL=http://localhost:3000/api

# Firebase Config (nếu dùng)
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_PROJECT_ID=your_project_id

# Blockchain Config
VITE_BLOCKCHAIN_RPC_URL=http://localhost:8545
```

## 🎮 Cách Chạy Dự Án

### Development Mode

```bash
# Chạy dev server với Vite
npm start
# hoặc
npm run dev

# Server sẽ chạy tại: http://localhost:5173
```

### Production Build

```bash
# Build cho production
npm run build

# Preview production build
npm run preview
```

### Testing (khi có tests)

```bash
# Chạy unit tests
npm test

# Chạy tests với coverage
npm run test:coverage
```

### Linting & Formatting

```bash
# Check code style (khi có ESLint)
npm run lint

# Auto-fix linting issues
npm run lint:fix
```

## 📁 Cấu Trúc Thư Mục

```
do_an_chuyen_nganh/
├── public/              # Thư mục chứa file tĩnh
│   ├── index.html      # Template HTML chính
│   ├── manifest.json   # Metadata của web app
│   └── robots.txt      # File cấu hình cho search engines
├── src/                 # Thư mục chứa source code
│   ├── App.js          # Component chính
│   ├── App.css         # Styles cho App component
│   ├── index.js        # Entry point của ứng dụng
│   ├── index.css       # Global styles
│   ├── setupTests.js   # Cấu hình test
│   └── reportWebVitals.js  # Đo lường performance
├── package.json        # Quản lý dependencies và scripts
└── README.md          # File hướng dẫn này
```

## 📜 Phân Quyền Người Dùng

Hệ thống có 3 loại người dùng với các quyền hạn khác nhau:

| Vai Trò | Quyền Hạn |
|---------|-----------|
| Admin   | Toàn quyền quản lý hệ thống |
| Nông dân | Quản lý sản phẩm và đơn hàng của mình |
| Người tiêu dùng | Xem và đặt hàng sản phẩm |

## 📸 Screenshots

![Dashboard](screenshots/dashboard.png)
*Hình ảnh Dashboard của Admin*

![Product Page](screenshots/product_page.png)
*Hình ảnh trang sản phẩm của Người tiêu dùng*

## 📚 API Documentation

Tài liệu API sẽ được cung cấp khi có backend.

## 🤝 Đóng Góp

Nếu bạn muốn đóng góp cho dự án:

1. Fork repository
2. Tạo branch mới (`git checkout -b feature/TenTinhNang`)
3. Commit thay đổi (`git commit -m 'Thêm tính năng mới'`)
4. Push lên branch (`git push origin feature/TenTinhNang`)
5. Tạo Pull Request

## 📝 License

This project is licensed under the MIT License.

## 📞 Liên Hệ & Hỗ Trợ

- Repository: [https://github.com/nhan20474/Do_An_Chuyen_Nganh](https://github.com/nhan20474/Do_An_Chuyen_Nganh)
- Issues: Tạo issue trên GitHub nếu gặp vấn đề

## 📖 Tài Liệu Tham Khảo

- [React Documentation](https://react.dev/)
- [Create React App Documentation](https://create-react-app.dev/)
- [Testing Library Documentation](https://testing-library.com/)
