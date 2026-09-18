import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Mail, Lock, AlertCircle, Compass } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(email, password);
      if (res.success) {
        navigate('/trips');
      } else {
        setError(String(res.message || 'เข้าสู่ระบบไม่สำเร็จ'));
      }
    } catch (err) {
      setError(String(err.message || 'เกิดข้อผิดพลาดไม่ทราบสาเหตุ'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 px-4">
      <div className="travel-card p-8 space-y-6 shadow-md border border-slate-200">
        <div className="text-center space-y-2">
          <div className="inline-flex p-4 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 mb-1">
            <Compass className="w-8 h-8 animate-spin-slow" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">เข้าสู่ระบบ Iko Share</h2>
          <p className="text-xs text-slate-500 font-medium">ยินดีต้อนรับกลับสู่ชุมชนเดินทางท่องเที่ยว</p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 font-semibold">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800">อีเมล (Email)</label>
            <div className="flex items-center gap-2 px-4 py-3 travel-input">
              <Mail className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="email"
                required
                placeholder="เช่น yourname@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-transparent border-none text-slate-900 text-sm focus:outline-none w-full placeholder:text-slate-400 font-medium"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">รหัสผ่าน</label>
              <Link to="/forgot-password" className="text-[11px] text-emerald-700 hover:underline font-bold">
                ลืมรหัสผ่าน? แจ้งแอดมิน
              </Link>
            </div>
            <div className="flex items-center gap-2 px-4 py-3 travel-input">
              <Lock className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-transparent border-none text-slate-900 text-sm focus:outline-none w-full placeholder:text-slate-400 font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 travel-btn-primary font-bold text-sm disabled:opacity-50 mt-2 shadow-sm"
          >
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <div className="text-center text-xs text-slate-600 font-medium">
          ยังไม่มีบัญชีใช้งาน?{' '}
          <Link to="/register" className="text-emerald-700 hover:text-emerald-800 hover:underline font-bold">
            สมัครสมาชิกที่นี่
          </Link>
        </div>
      </div>
    </div>
  );
}
