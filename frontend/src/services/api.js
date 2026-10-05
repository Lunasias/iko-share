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

// In-flight GET request deduplication:
// If multiple components request the same endpoint concurrently (e.g. /trips or /events during page load),
// reuse the active in-flight promise to avoid duplicate network roundtrips.
const inflightGetRequests = new Map();
const originalGet = API.get.bind(API);

API.get = function (url, config = {}) {
  if (config.dedupe !== false) {
    const key = url + (config.params ? JSON.stringify(config.params) : '');
    if (inflightGetRequests.has(key)) {
      return inflightGetRequests.get(key);
    }
    const reqPromise = originalGet(url, config).finally(() => {
      inflightGetRequests.delete(key);
    });
    inflightGetRequests.set(key, reqPromise);
    return reqPromise;
  }
  return originalGet(url, config);
};

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
