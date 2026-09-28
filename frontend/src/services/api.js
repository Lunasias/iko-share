import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
  timeout: 15000, // 15-second timeout to handle slow networks and prevent hanging requests (#BUG-102)
  headers: {
    'Content-Type': 'application/json',
  },
});

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('iko_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      error.userFriendlyMessage = 'การเชื่อมต่อใช้เวลานานเกินไป (Timeout) กรุณาตรวจสอบสัญญาณอินเทอร์เน็ตแล้วลองใหม่อีกครั้ง';
    }
    return Promise.reject(error);
  }
);

// Helper for Image / File uploads to Image Storage Service
export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('image', file);
  const response = await API.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 30000, // 30s timeout for image uploads
  });
  return response.data;
};


export default API;
