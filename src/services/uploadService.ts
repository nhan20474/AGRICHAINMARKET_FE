import { API_CONFIG, fetchWithTimeout } from '../config/apiConfig';

export const uploadService = {
  async uploadImage(file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetchWithTimeout(API_CONFIG.UPLOAD_URL, {
        method: 'POST',
        body: formData
      });

      const result = await res.json();
      if (!res.ok || !result.url) {
        throw new Error(result.message || 'Upload ảnh thất bại');
      }
      return result.url;
    } catch (error) {
      console.error('Upload image error:', error);
      throw error;
    }
  }
};
