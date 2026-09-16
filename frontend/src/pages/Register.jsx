import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, User, Mail, Lock, Phone, AlertCircle, Compass } from 'lucide-react';

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
      <div className="travel-card p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-4 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 mb-1">
            <Compass className="w-8 h-8 animate-spin-slow" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">ลงทะเบียนสมาชิกใหม่</h2>
          <p className="text-xs text-slate-500 font-medium">ร่วมเป็นส่วนหนึ่งของคอมมูนิตี้ท่องเที่ยว Iko Share</p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 font-semibold">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* USER Field (PDF Page 1 note: เปลี่ยนจาก ชื่อนามสกุลเป็น USER) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800">ชื่อผู้ใช้ (USER)</label>
            <div className="flex items-center gap-2 px-4 py-3 travel-input">
              <User className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="text"
                required
                placeholder="เช่น Somchai_Traveler หรือ สมชาย ใจดี"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-transparent border-none text-slate-900 text-sm focus:outline-none w-full placeholder:text-slate-400"
              />
            </div>
          </div>

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
                className="bg-transparent border-none text-slate-900 text-sm focus:outline-none w-full placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800">เบอร์โทรศัพท์ติดต่อ</label>
            <div className="flex items-center gap-2 px-4 py-3 travel-input">
              <Phone className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="tel"
                placeholder="เช่น 0812345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-transparent border-none text-slate-900 text-sm focus:outline-none w-full placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Role Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800">เลือกบทบาทหลัก</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRole('Passenger')}
                className={`py-2.5 px-3 text-xs font-bold rounded-xl border transition-all ${
                  role === 'Passenger' ? 'role-passenger shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                ผู้โดยสาร
              </button>
              <button
                type="button"
                onClick={() => setRole('Driver')}
                className={`py-2.5 px-3 text-xs font-bold rounded-xl border transition-all ${
                  role === 'Driver' ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                คนขับรถ
              </button>
              <button
                type="button"
                onClick={() => setRole('Both')}
                className={`py-2.5 px-3 text-xs font-bold rounded-xl border transition-all ${
                  role === 'Both' ? 'role-both shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                ทั้งสองอย่าง
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800">รหัสผ่าน</label>
            <div className="flex items-center gap-2 px-4 py-3 travel-input">
              <Lock className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="password"
                required
                placeholder="อย่างน้อย 6 ตัวอักษร"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-transparent border-none text-slate-900 text-sm focus:outline-none w-full placeholder:text-slate-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 travel-btn-primary font-bold text-sm disabled:opacity-50 mt-2"
          >
            {loading ? 'กำลังลงทะเบียน...' : 'ยืนยันลงทะเบียนสมาชิก'}
          </button>
        </form>

        <div className="text-center text-xs text-slate-600 font-medium">
          มีบัญชีอยู่แล้ว?{' '}
          <Link to="/login" className="text-emerald-700 hover:text-emerald-800 hover:underline font-bold">
            เข้าสู่ระบบที่นี่
          </Link>
        </div>
      </div>
    </div>
  );
}
