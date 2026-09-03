import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';

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
      <div className="glass-card p-8 rounded-3xl border border-sky-500/20 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-sky-500/20 text-sky-400 mb-2">
            <LogIn className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white">เข้าสู่ระบบ Iko Share</h2>
          <p className="text-sm text-slate-400">ยินดีต้อนรับกลับสู่ชุมชนเดินทางคาร์พูล</p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-sm flex items-start gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">อีเมล</label>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl glass-input">
              <Mail className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="email"
                required
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-transparent border-none text-white text-sm focus:outline-none w-full"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">รหัสผ่าน</label>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl glass-input">
              <Lock className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-transparent border-none text-white text-sm focus:outline-none w-full"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-sky-500/25 transition-all disabled:opacity-50"
          >
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <div className="text-center text-xs text-slate-400">
          ยังไม่มีบัญชีใช้งาน?{' '}
          <Link to="/register" className="text-sky-400 hover:underline font-semibold">
            สมัครสมาชิก
          </Link>
        </div>
      </div>
    </div>
  );
}
