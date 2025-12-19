/**
 * Hiệu ứng morph - Sản phẩm biến thành checkmark
 * @param sourceElement - Element nguồn (nút thêm vào giỏ hoặc ảnh sản phẩm)
 * @param imageUrl - URL ảnh sản phẩm
 */
export const flyToCart = (sourceElement: HTMLElement, imageUrl: string) => {
  const cartIcon = document.querySelector('a.icon-btn-wrapper[href="/cart"]');
  const sourceRect = sourceElement.getBoundingClientRect();

  // Preload ảnh
  const img = new Image();
  img.src = imageUrl;
  
  // Container cho hiệu ứng
  const container = document.createElement('div');
  Object.assign(container.style, {
    position: 'fixed',
    left: `${sourceRect.left + sourceRect.width / 2 - 50}px`,
    top: `${sourceRect.top + sourceRect.height / 2 - 50}px`,
    width: '100px',
    height: '100px',
    zIndex: '9999',
    pointerEvents: 'none',
  });

  // Ảnh sản phẩm - dùng img tag thay vì background
  const productImg = document.createElement('img');
  // Backend ở port 3000, Vite dev ở 5173
  const fullImageUrl = imageUrl.startsWith('http') 
    ? imageUrl 
    : `http://localhost:3000${imageUrl}`;
  productImg.src = fullImageUrl;
  
  Object.assign(productImg.style, {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: '12px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
    transition: 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    display: 'block',
  });

  // Checkmark overlay (ẩn ban đầu)
  const checkmark = document.createElement('div');
  Object.assign(checkmark.style, {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '60px',
    fontWeight: 'bold',
    color: '#fff',
    background: 'linear-gradient(135deg, #4CAF50, #45a049)',
    borderRadius: '50%',
    opacity: '0',
    transform: 'scale(0)',
    transition: 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    boxShadow: '0 10px 30px rgba(76, 175, 80, 0.4)',
  });
  checkmark.innerHTML = '✓';

  container.appendChild(productImg);
  container.appendChild(checkmark);
  document.body.appendChild(container);

  // Animation sequence
  // 1. Bounce lên
  requestAnimationFrame(() => {
    productImg.style.transform = 'scale(1.2) translateY(-20px)';
  });

  // 2. Scale nhỏ + xoay
  setTimeout(() => {
    productImg.style.transform = 'scale(0.3) rotate(90deg)';
    productImg.style.opacity = '0';
    
    // 3. Checkmark xuất hiện
    checkmark.style.opacity = '1';
    checkmark.style.transform = 'scale(1)';
  }, 400);

  // 4. Checkmark bounce
  setTimeout(() => {
    checkmark.style.transform = 'scale(1.15)';
  }, 600);

  setTimeout(() => {
    checkmark.style.transform = 'scale(1)';
  }, 700);

  // 5. Fade out
  setTimeout(() => {
    checkmark.style.opacity = '0';
    checkmark.style.transform = 'scale(0.5)';
  }, 1000);

  // Xóa
  setTimeout(() => {
    container.remove();
  }, 1400);

  // Badge animation
  if (cartIcon) {
    setTimeout(() => {
      const badge = cartIcon.querySelector('.badge');
      if (badge) {
        const badgeEl = badge as HTMLElement;
        badgeEl.style.transition = 'transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        badgeEl.style.transform = 'scale(1.3)';
        
        setTimeout(() => {
          badgeEl.style.transform = 'scale(1)';
          setTimeout(() => {
            badgeEl.style.transition = '';
          }, 300);
        }, 150);
      }
    }, 800);
  }
};
