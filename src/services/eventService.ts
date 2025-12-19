/**
 * Service quản lý các custom events trong ứng dụng
 * Giúp cập nhật real-time giữa các component
 */

export const eventService = {
  /**
   * Dispatch event khi giỏ hàng thay đổi
   * Sử dụng sau khi: thêm/xóa/cập nhật số lượng trong giỏ
   */
  emitCartUpdated: () => {
    window.dispatchEvent(new Event('cart-updated'));
  },

  /**
   * Dispatch event khi thông báo thay đổi
   * @param unreadCount - Số lượng thông báo chưa đọc (optional)
   */
  emitNotificationUpdated: (unreadCount?: number) => {
    if (unreadCount !== undefined) {
      window.dispatchEvent(new CustomEvent('notification-updated', { detail: unreadCount }));
    } else {
      window.dispatchEvent(new Event('notification-updated'));
    }
  },

  /**
   * Lắng nghe event giỏ hàng
   * @param callback - Hàm callback khi event được trigger
   */
  onCartUpdated: (callback: () => void) => {
    window.addEventListener('cart-updated', callback);
    return () => window.removeEventListener('cart-updated', callback);
  },

  /**
   * Lắng nghe event thông báo
   * @param callback - Hàm callback khi event được trigger
   */
  onNotificationUpdated: (callback: (e?: any) => void) => {
    window.addEventListener('notification-updated', callback);
    return () => window.removeEventListener('notification-updated', callback);
  }
};
