/**
 * Safe localStorage wrapper với error handling
 * Giúp tránh các lỗi khi parse JSON hoặc truy cập localStorage
 */

/**
 * Safely get item từ localStorage
 * @param key - Tên key
 * @returns Giá trị hoặc null nếu không tìm thấy
 */
export const safeGetItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error(`Failed to get item from localStorage (${key}):`, error);
    return null;
  }
};

/**
 * Safely parse JSON từ localStorage
 * @param key - Tên key
 * @param defaultValue - Giá trị mặc định nếu parse thất bại
 * @returns Object hoặc defaultValue
 */
export const safeGetJSON = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    return JSON.parse(item) as T;
  } catch (error) {
    console.error(`Failed to parse JSON from localStorage (${key}):`, error);
    return defaultValue;
  }
};

/**
 * Safely set item vào localStorage
 * @param key - Tên key
 * @param value - Giá trị (string)
 * @returns true nếu thành công, false nếu lỗi
 */
export const safeSetItem = (key: string, value: string): boolean => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error(`Failed to set item in localStorage (${key}):`, error);
    return false;
  }
};

/**
 * Safely set JSON object vào localStorage
 * @param key - Tên key
 * @param value - Object để stringify
 * @returns true nếu thành công, false nếu lỗi
 */
export const safeSetJSON = (key: string, value: any): boolean => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Failed to set JSON in localStorage (${key}):`, error);
    return false;
  }
};

/**
 * Safely remove item từ localStorage
 * @param key - Tên key
 * @returns true nếu thành công, false nếu lỗi
 */
export const safeRemoveItem = (key: string): boolean => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Failed to remove item from localStorage (${key}):`, error);
    return false;
  }
};

/**
 * Safely clear toàn bộ localStorage
 * @returns true nếu thành công, false nếu lỗi
 */
export const safeClear = (): boolean => {
  try {
    localStorage.clear();
    return true;
  } catch (error) {
    console.error('Failed to clear localStorage:', error);
    return false;
  }
};

/**
 * Helper: Lấy userId từ localStorage
 * @returns userId hoặc null
 */
export const getUserId = (): number | null => {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    const user = JSON.parse(userStr);
    return user?.id || null;
  } catch (error) {
    console.error('Failed to get userId from localStorage:', error);
    return null;
  }
};

/**
 * Helper: Lấy token từ localStorage
 * @returns token hoặc null
 */
export const getToken = (): string | null => {
  try {
    return localStorage.getItem('token');
  } catch (error) {
    console.error('Failed to get token from localStorage:', error);
    return null;
  }
};

/**
 * Helper: Lấy user object từ localStorage
 * @returns User object hoặc null
 */
export const getUser = (): any | null => {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    return JSON.parse(userStr);
  } catch (error) {
    console.error('Failed to get user from localStorage:', error);
    return null;
  }
};

/**
 * Helper: Set user object vào localStorage
 * @param user - User object
 * @returns true nếu thành công
 */
export const setUser = (user: any): boolean => {
  return safeSetJSON('user', user);
};

/**
 * Helper: Set token vào localStorage
 * @param token - Token string
 * @returns true nếu thành công
 */
export const setToken = (token: string): boolean => {
  return safeSetItem('token', token);
};
