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
      <div className="neu-card p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-4 rounded-2xl neu-inset text-[#6C63FF] mb-2">
            <LogIn className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-[#3D4852] font-['Plus_Jakarta_Sans',sans-serif]">เข้าสู่ระบบ Iko Share</h2>
          <p className="text-xs text-[#6B7280]">ยินดีต้อนรับกลับสู่ชุมชนเดินทางคาร์พูล</p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 text-xs flex items-start gap-2 font-medium">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#3D4852]">อีเมล</label>
            <div className="flex items-center gap-2 px-4 py-3 neu-input">
              <Mail className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="email"
                required
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-transparent border-none text-[#3D4852] text-sm focus:outline-none w-full"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#3D4852]">รหัสผ่าน</label>
            <div className="flex items-center gap-2 px-4 py-3 neu-input">
              <Lock className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-transparent border-none text-[#3D4852] text-sm focus:outline-none w-full"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 neu-button-primary font-bold text-sm disabled:opacity-50 mt-2"
          >
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <div className="text-center text-xs text-[#6B7280]">
          ยังไม่มีบัญชีใช้งาน?{' '}
          <Link to="/register" className="text-[#6C63FF] hover:underline font-bold">
            สมัครสมาชิก
          </Link>
        </div>
      </div>
    </div>
  );
}
