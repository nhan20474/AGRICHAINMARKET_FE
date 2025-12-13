const API_UPLOAD_URL = 'http://localhost:3000/api/upload';

export const uploadService = {
  async uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(API_UPLOAD_URL, {
      method: 'POST',
      body: formData
    });

    const result = await res.json();
    if (!res.ok || !result.url) {
      throw new Error(result.message || 'Upload ảnh thất bại');
    }
    return result.url;
  }
};
