import React, { createContext, useState, useEffect, useContext } from 'react';
import API from '../services/api';

const AuthContext = createContext();

const extractErrorMessage = (err, fallback) => {
  if (!err) return fallback;
  const data = err.response?.data;
  if (data) {
    if (typeof data.message === 'string' && data.message.trim()) return data.message;
    if (typeof data.error === 'string' && data.error.trim()) return data.error;
    if (data.error && typeof data.error.message === 'string' && data.error.message.trim()) {
      return data.error.message;
    }
    if (typeof data.msg === 'string' && data.msg.trim()) return data.msg;
    if (typeof data === 'string' && data.trim() && data.length < 300) return data;
  }
  if (typeof err.message === 'string' && err.message.trim()) {
    if (err.message.includes('504') || err.message.toLowerCase().includes('timeout')) {
      return 'การเชื่อมต่อเซิร์ฟเวอร์ใช้เวลานานเกินไป กรุณาลองใหม่อีกครั้ง';
    }
    if (err.message.includes('500')) {
      return 'เกิดข้อผิดพลาดที่ระบบเซิร์ฟเวอร์ (500) กรุณาลองใหม่อีกครั้ง';
    }
    return err.message;
  }
  return fallback;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('iko_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await API.get('/auth/me');
      if (res.data.success) {
        setUser(res.data.user);
      } else {
        localStorage.removeItem('iko_token');
        setUser(null);
      }
    } catch (err) {
      console.error('Check auth error:', err);
      localStorage.removeItem('iko_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const res = await API.post('/auth/login', { email, password });
      if (res.data.success) {
        localStorage.setItem('iko_token', res.data.token);
        setUser(res.data.user);
        return { success: true };
      }
      return { success: false, message: String(res.data.message || 'เข้าสู่ระบบไม่สำเร็จ') };
    } catch (err) {
      return { success: false, message: extractErrorMessage(err, 'เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบอีเมลหรือรหัสผ่าน') };
    }
  };

  const register = async (name, email, password, phone, role) => {
    try {
      const res = await API.post('/auth/register', { name, email, password, phone, role });
      if (res.data.success) {
        localStorage.setItem('iko_token', res.data.token);
        setUser(res.data.user);
        return { success: true };
      }
      return { success: false, message: String(res.data.message || 'ลงทะเบียนไม่สำเร็จ') };
    } catch (err) {
      return { success: false, message: extractErrorMessage(err, 'เกิดข้อผิดพลาดในการลงทะเบียน') };
    }
  };

  const logout = () => {
    localStorage.removeItem('iko_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
