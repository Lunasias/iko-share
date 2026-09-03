import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, User, Mail, Lock, Phone, AlertCircle, ShieldCheck } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('Passenger');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await register(name, email, password, phone, role);
      if (res.success) {
        navigate('/trips');
      } else {
        setError(String(res.message || 'ลงทะเบียนไม่สำเร็จ'));
      }
    } catch (err) {
      setError(String(err.message || 'เกิดข้อผิดพลาดไม่ทราบสาเหตุ'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-10 px-4">
      <div className="glass-card p-8 rounded-3xl border border-sky-500/20 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-indigo-500/20 text-indigo-400 mb-2">
            <UserPlus className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white">ลงทะเบียนสมาชิกใหม่</h2>
          <p className="text-sm text-slate-400">ร่วมเป็นส่วนหนึ่งของสังคมการเดินทาง Iko Share</p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-sm flex items-start gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">ชื่อ - นามสกุล</label>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl glass-input">
              <User className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="text"
                required
                placeholder="สมชาย ใจดี"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-transparent border-none text-white text-sm focus:outline-none w-full"
              />
            </div>
          </div>

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
            <label className="text-xs font-semibold text-slate-300">เบอร์โทรศัพท์</label>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl glass-input">
              <Phone className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="tel"
                placeholder="0812345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-transparent border-none text-white text-sm focus:outline-none w-full"
              />
            </div>
          </div>

          {/* Role Selection */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">เลือกบทบาทผู้ใช้งาน</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRole('Passenger')}
                className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                  role === 'Passenger' ? 'bg-sky-500/30 border-sky-400 text-sky-200' : 'glass-input text-slate-400'
                }`}
              >
                ผู้โดยสาร
              </button>
              <button
                type="button"
                onClick={() => setRole('Driver')}
                className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                  role === 'Driver' ? 'bg-emerald-500/30 border-emerald-400 text-emerald-200' : 'glass-input text-slate-400'
                }`}
              >
                คนขับรถ
              </button>
              <button
                type="button"
                onClick={() => setRole('Both')}
                className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                  role === 'Both' ? 'bg-purple-500/30 border-purple-400 text-purple-200' : 'glass-input text-slate-400'
                }`}
              >
                ทั้งสองอย่าง
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">รหัสผ่าน</label>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl glass-input">
              <Lock className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="password"
                required
                placeholder="อย่างน้อย 6 ตัวอักษร"
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
            {loading ? 'กำลังลงทะเบียน...' : 'ยืนยันลงทะเบียน'}
          </button>
        </form>

        <div className="text-center text-xs text-slate-400">
          มีบัญชีอยู่แล้ว?{' '}
          <Link to="/login" className="text-sky-400 hover:underline font-semibold">
            เข้าสู่ระบบ
          </Link>
        </div>
      </div>
    </div>
  );
}
