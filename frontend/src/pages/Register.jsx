import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, User, Mail, Lock, Phone, AlertCircle } from 'lucide-react';

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
      <div className="neu-card p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-4 rounded-2xl neu-inset text-[#6C63FF] mb-2">
            <UserPlus className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-[#3D4852] font-['Plus_Jakarta_Sans',sans-serif]">ลงทะเบียนสมาชิกใหม่</h2>
          <p className="text-xs text-[#6B7280]">ร่วมเป็นส่วนหนึ่งของสังคมการเดินทาง Iko Share</p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 text-xs flex items-start gap-2 font-medium">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#3D4852]">ชื่อ - นามสกุล</label>
            <div className="flex items-center gap-2 px-4 py-3 neu-input">
              <User className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="text"
                required
                placeholder="สมชาย ใจดี"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-transparent border-none text-[#3D4852] text-sm focus:outline-none w-full"
              />
            </div>
          </div>

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
            <label className="text-xs font-bold text-[#3D4852]">เบอร์โทรศัพท์</label>
            <div className="flex items-center gap-2 px-4 py-3 neu-input">
              <Phone className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="tel"
                placeholder="0812345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-transparent border-none text-[#3D4852] text-sm focus:outline-none w-full"
              />
            </div>
          </div>

          {/* Role Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#3D4852]">เลือกบทบาทผู้ใช้งาน</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRole('Passenger')}
                className={`py-2 px-3 text-xs font-bold transition-all ${
                  role === 'Passenger' ? 'neu-inset text-[#6C63FF]' : 'neu-button text-[#6B7280]'
                }`}
              >
                ผู้โดยสาร
              </button>
              <button
                type="button"
                onClick={() => setRole('Driver')}
                className={`py-2 px-3 text-xs font-bold transition-all ${
                  role === 'Driver' ? 'neu-inset text-[#38B2AC]' : 'neu-button text-[#6B7280]'
                }`}
              >
                คนขับรถ
              </button>
              <button
                type="button"
                onClick={() => setRole('Both')}
                className={`py-2 px-3 text-xs font-bold transition-all ${
                  role === 'Both' ? 'neu-inset text-purple-600' : 'neu-button text-[#6B7280]'
                }`}
              >
                ทั้งสองอย่าง
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#3D4852]">รหัสผ่าน</label>
            <div className="flex items-center gap-2 px-4 py-3 neu-input">
              <Lock className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="password"
                required
                placeholder="อย่างน้อย 6 ตัวอักษร"
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
            {loading ? 'กำลังลงทะเบียน...' : 'ยืนยันลงทะเบียน'}
          </button>
        </form>

        <div className="text-center text-xs text-[#6B7280]">
          มีบัญชีอยู่แล้ว?{' '}
          <Link to="/login" className="text-[#6C63FF] hover:underline font-bold">
            เข้าสู่ระบบ
          </Link>
        </div>
      </div>
    </div>
  );
}
