# 📋 HƯỚNG DẪN SỬA CÁC VẤN ĐỀ CODEBASE

## 🔴 11 VẤN ĐỀ ĐÃ PHÁT HIỆN

### 1️⃣ **Hardcoded API URLs (20+ locations)**

**Files ảnh hưởng:**
- `src/services/orderService.ts`
- `src/services/productService.ts`
- `src/services/shippingService.ts`
- `src/pages/Farmer/MyProducts.tsx`
- `src/pages/Admin/Dashboard.tsx`
- `src/utils/cartAnimation.ts`
- Và 5+ files khác

**Hướng sửa - BƯỚC 1:**
```typescript
// Thay thế này:
const API_BASE = 'http://localhost:3000/api/orders';

// Bằng cái này:
import { API_CONFIG } from '@/config/apiConfig';
const API_BASE = API_CONFIG.ORDERS;
```

**Hướng sửa - BƯỚC 2:**
Tạo file `.env.local` (copy từ `.env.example`):
```
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
VITE_UPLOAD_URL=http://localhost:3000/api/upload
```

---

### 2️⃣ **Sử dụng `any` type quá nhiều**

**Files ảnh hưởng:**
- `src/pages/Market/OrderHistory.tsx` (dòng 63, 80, 144, 150)
- `src/pages/Public/TracePage.tsx` (dòng 10-11)
- `src/pages/Market/ProductDetail.tsx` (dòng 25, 29, 47)
- `src/pages/Market/Productlist.tsx` (dòng 30, 86-87)

**Hướng sửa:**
```typescript
// ❌ Sai
data.forEach((row: any) => { ... })

// ✅ Đúng
import { Order, OrderItem } from '@/types';
data.forEach((row: Order) => { ... })
```

---

### 3️⃣ **localStorage không có error handling**

**Files ảnh hưởng:**
- `src/pages/Market/OrderHistory.tsx` (dòng 29)
- `src/pages/Market/ShippingList.tsx` (dòng 44)
- `src/pages/Farmer/MyProducts.tsx` (dòng 281)
- `src/Layout/Header.tsx` (dòng 128)

**Hướng sửa:**
```typescript
// ❌ Sai
const user = JSON.parse(localStorage.getItem('user') || '');
const userId = user.id;

// ✅ Đúng
import { safeJsonParse } from '@/config/apiConfig';

function getUserId(): number | null {
    const user = safeJsonParse<AuthUser>(
        localStorage.getItem('user'),
        { id: 0 } as AuthUser
    );
    return user.id ? Number(user.id) : null;
}
```

---

### 4️⃣ **Missing API error handling**

**Files ảnh hưởng:**
- `src/pages/Admin/Dashboard.tsx` (dòng 73)
- `src/pages/Admin/ProductManager.tsx` (dòng 58)
- `src/services/categoryService.ts`
- `src/pages/Admin/Categories.tsx`

**Hướng sửa:**
```typescript
// ❌ Sai
const res = await fetch(API_URL);
const data = await res.json(); // Crash nếu API lỗi!

// ✅ Đúng
import { fetchWithTimeout, handleApiResponse } from '@/config/apiConfig';

const res = await fetchWithTimeout(API_URL);
const data = await handleApiResponse<YourType>(res);
```

---

### 5️⃣ **Socket.io hardcoded URL**

**Files ảnh hưởng:**
- `src/pages/Market/OrderHistory.tsx` (dòng 146)

**Hướng sửa:**
```typescript
// ❌ Sai
const socket = io('http://localhost:3000');

// ✅ Đúng
import { API_CONFIG } from '@/config/apiConfig';
const socket = io(API_CONFIG.SOCKET_URL);
```

---

### 6️⃣ **Race condition - Memory leak trong async**

**Files ảnh hưởng:**
- `src/pages/Farmer/MyProducts.tsx` (dòng 100+)
- `src/pages/Admin/Dashboard.tsx` (component useEffect)
- `src/pages/Market/Home.tsx` (useEffect)

**Hướng sửa:**
```typescript
// ❌ Sai
useEffect(() => {
    const fetchData = async () => {
        const data = await fetch(...).then(r => r.json());
        setData(data); // Có thể warning nếu component unmount
    };
    fetchData();
}, []);

// ✅ Đúng
useEffect(() => {
    let mounted = true; // Track mounted state
    
    const fetchData = async () => {
        try {
            const data = await fetch(...).then(r => r.json());
            if (mounted) setData(data); // Chỉ update khi mounted
        } catch (e) {
            if (mounted) setError(e);
        }
    };
    
    fetchData();
    
    return () => { 
        mounted = false; // Cleanup
    };
}, []);
```

---

### 7️⃣ **Loose typing - Record<string, any>**

**Files ảnh hưởng:**
- `src/pages/Admin/ProductManager.tsx`
- `src/pages/Farmer/MyProducts.tsx` (dòng 82+)
- `src/pages/Admin/Dashboard.tsx`

**Hướng sửa:**
```typescript
// ❌ Sai
const [stats, setStats] = useState<Record<string, any>>({});

// ✅ Đúng
import { ReportStats } from '@/types';

interface OverviewStats extends ReportStats {
    total_products: number;
}

const [stats, setStats] = useState<OverviewStats>({
    total_revenue: 0,
    total_orders: 0,
    pending_orders: 0,
    completed_orders: 0,
    total_products: 0,
});
```

---

### 8️⃣ **Vô hạn loop - Socket event listeners**

**Files ảnh hưởng:**
- `src/pages/Market/OrderHistory.tsx` (dòng 140+)
- Bất kỳ component nào dùng socket.on()

**Hướng sửa:**
```typescript
// ❌ Sai
useEffect(() => {
    if (userId) {
        socket.emit('register', userId);
        socket.on('notification', (data) => {
            console.log('Got:', data);
            fetchOrders(); // Mỗi lần trigger, listener thêm 1 cái nữa!
        });
    }
}, [userId]); // Không cleanup

// ✅ Đúng
useEffect(() => {
    let socket: any;
    
    if (userId) {
        socket = io(API_CONFIG.SOCKET_URL);
        socket.emit('register', userId);
        
        socket.off('notification'); // ✅ Remove old listeners
        socket.on('notification', (data: any) => {
            if (data.type === 'order_tracking' && data.order_id) {
                // Update chỉ 1 đơn hàng thay vì reload all
                setOrders(prev => prev.map(order => 
                    order.id === data.order_id 
                        ? { ...order, status: data.new_status }
                        : order
                ));
            }
        });
    }
    
    return () => {
        if (socket) {
            socket.off('notification'); // ✅ Cleanup listener
            socket.disconnect();
        }
    };
}, [userId]); // Dependency array
```

---

### 9️⃣ **XSS vulnerability - unsafe HTML**

**Files ảnh hưởng:**
- Bất kỳ file nào dynamic render content từ API mà không sanitize

**Hướng sửa:**
```typescript
// ❌ Sai - có thể bị XSS nếu API bị hack
<div dangerouslySetInnerHTML={{ __html: product.description }} />

// ✅ Đúng
<div>{product.description}</div> // React tự escape

// Nếu cần HTML, dùng DOMPurify:
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ 
    __html: DOMPurify.sanitize(product.description) 
}} />
```

---

### 🔟 **Fetch timeout không có**

**Files ảnh hưởng:**
- Tất cả fetch calls (20+ locations)

**Hướng sửa:**
```typescript
// Thay vì
fetch(url)

// Dùng
import { fetchWithTimeout } from '@/config/apiConfig';
fetchWithTimeout(url, {}, 10000) // 10 second timeout
```

---

### 1️⃣1️⃣ **cartAnimation.ts hardcoded URL**

**File ảnh hưởng:**
- `src/utils/cartAnimation.ts` (dòng 36)

**Hướng sửa:**
```typescript
// ❌ Sai
const fullImageUrl = imageUrl.startsWith('http') 
    ? imageUrl 
    : `http://localhost:3000${imageUrl}`;

// ✅ Đúng
import { API_CONFIG } from '@/config/apiConfig';

const fullImageUrl = imageUrl.startsWith('http') 
    ? imageUrl 
    : `${API_CONFIG.BASE_URL}${imageUrl}`;
```

---

## ✅ HƯỚNG DẪN THỰC HIỆN AN TOÀN (Không sụp đổ code)

### **BƯỚC 1: Chuẩn bị (5 phút)**
```bash
# 1. Tạo file config (đã tạo trong PR)
# 2. Tạo file types (đã tạo trong PR)
# 3. Tạo .env.local từ .env.example
cp .env.example .env.local
```

### **BƯỚC 2: Sửa services (20 phút)**
Sửa từng file service một, thay `hardcoded URL` bằng `API_CONFIG`:
```
1. src/services/orderService.ts
2. src/services/productService.ts
3. src/services/shippingService.ts
4. src/services/reviewService.ts
5. ... và 10+ file khác
```

**Cách sửa an toàn:**
- Thay từng constant URL một
- Test từng endpoint bằng Postman
- Commit sau mỗi service

### **BƯỚC 3: Sửa pages (30 phút)**
- Thay `any` type bằng interface từ `@/types`
- Thay `JSON.parse()` bằng `safeJsonParse()`
- Thêm cleanup trong socket listeners
- Thêm `mounted` flag trong useEffect

### **BƯỚC 4: Test (15 phút)**
```bash
npm run dev
# Test từng feature:
# - Login/Register
# - View products
# - Add to cart
# - Order history
# - Admin dashboard
```

---

## 🎯 PRIORITY (SỬA CÁI NÀO TRƯỚC)

### **HIGH (Sửa ngay)** 🔴
1. API Config - Consolidate URLs
2. Error handling - Prevent crashes
3. Socket cleanup - Fix memory leaks
4. localStorage safety - Prevent parse errors

### **MEDIUM (Sửa tuần này)** 🟡
5. Replace `any` with types
6. Add fetch timeout
7. Memory leak prevention

### **LOW (Sửa khi có thời gian)** 🟢
8. XSS protection
9. Code cleanup
10. Performance optimization

---

## 📚 TÀI LIỆU TỰA NHU

- `src/config/apiConfig.ts` - API configuration & helpers
- `src/types/index.ts` - Shared TypeScript interfaces
- `.env.example` - Environment variables template

---

## 💡 MẸO DEBUGING

### Kiểm tra API URL:
```typescript
console.log('API URL:', API_CONFIG.BASE_URL);
```

### Kiểm tra localStorage:
```typescript
console.log('User:', localStorage.getItem('user'));
```

### Kiểm tra socket connection:
```typescript
socket.on('connect', () => console.log('✅ Socket connected'));
socket.on('disconnect', () => console.log('❌ Socket disconnected'));
```

---

## ⚠️ TRÁNH CÁI NÀY

❌ Không delete/rename files mà không cập nhật import  
❌ Không bỏ cleanup trong useEffect  
❌ Không để `any` type trong code mới  
❌ Không hardcode URL trong component  
❌ Không skip error handling

---

**Sau khi implement xong các fix này, codebase sẽ:**
✅ An toàn hơn (no XSS, safe JSON parse)  
✅ Dễ bảo trì (centralized config)  
✅ Type-safe hơn (less `any`)  
✅ Performant hơn (timeout, cleanup)  
✅ Dễ scale (environment variables)
