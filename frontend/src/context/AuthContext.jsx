import React, { createContext, useState, useEffect, useContext } from 'react';
import API from '../services/api';

const AuthContext = createContext();

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
      const errMsg = err.response?.data?.message
        ? String(err.response.data.message)
        : String(err.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
      return { success: false, message: errMsg };
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
      const errMsg = err.response?.data?.message
        ? String(err.response.data.message)
        : String(err.message || 'เกิดข้อผิดพลาดในการลงทะเบียน');
      return { success: false, message: errMsg };
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
