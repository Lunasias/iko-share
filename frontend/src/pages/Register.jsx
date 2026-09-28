import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import TermsModal from '../components/TermsModal';
import { UserPlus, User, Mail, Lock, Phone, AlertCircle, Compass, ShieldCheck } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('Passenger');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const { isTh } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!acceptedTerms) {
      setError(isTh ? 'กรุณาทำเครื่องหมายยอมรับข้อกำหนดการใช้งานและนโยบายความเป็นส่วนตัวก่อนลงทะเบียน' : 'Please accept the Terms of Service and Privacy Policy before registering.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await register(name, email, password, phone, role);
      if (res.success) {
        navigate('/trips');
      } else {
        setError(String(res.message || (isTh ? 'ลงทะเบียนไม่สำเร็จ' : 'Registration failed')));
      }
    } catch (err) {
      setError(String(err.message || (isTh ? 'เกิดข้อผิดพลาดไม่ทราบสาเหตุ' : 'Unknown error occurred')));
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
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            {isTh ? 'ลงทะเบียนสมาชิกใหม่' : 'Create New Account'}
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            {isTh ? 'ร่วมเป็นส่วนหนึ่งของคอมมูนิตี้ท่องเที่ยว Iko Share' : 'Join the Iko Share travel community'}
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 font-semibold">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* USER Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800">{isTh ? 'ชื่อผู้ใช้ (USER)' : 'Username (USER)'}</label>
            <div className="flex items-center gap-2 px-4 py-3 travel-input">
              <User className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="text"
                required
                placeholder={isTh ? "เช่น Somchai_Traveler หรือ สมชาย ใจดี" : "e.g. Somchai_Traveler"}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-transparent border-none text-slate-900 text-sm focus:outline-none w-full placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800">{isTh ? 'อีเมล (Email)' : 'Email'}</label>
            <div className="flex items-center gap-2 px-4 py-3 travel-input">
              <Mail className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="email"
                required
                placeholder={isTh ? "เช่น yourname@example.com" : "e.g. yourname@example.com"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-transparent border-none text-slate-900 text-sm focus:outline-none w-full placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800">{isTh ? 'เบอร์โทรศัพท์ติดต่อ' : 'Contact Phone'}</label>
            <div className="flex items-center gap-2 px-4 py-3 travel-input">
              <Phone className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="tel"
                placeholder={isTh ? "เช่น 0812345678" : "e.g. 0812345678"}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-transparent border-none text-slate-900 text-sm focus:outline-none w-full placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Role Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800">{isTh ? 'เลือกบทบาทหลัก' : 'Select Primary Role'}</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRole('Passenger')}
                className={`py-2.5 px-3 text-xs font-bold rounded-xl border transition-all ${
                  role === 'Passenger' ? 'role-passenger shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {isTh ? 'ผู้โดยสาร' : 'Passenger'}
              </button>
              <button
                type="button"
                onClick={() => setRole('Driver')}
                className={`py-2.5 px-3 text-xs font-bold rounded-xl border transition-all ${
                  role === 'Driver' ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {isTh ? 'คนขับรถ' : 'Driver'}
              </button>
              <button
                type="button"
                onClick={() => setRole('Both')}
                className={`py-2.5 px-3 text-xs font-bold rounded-xl border transition-all ${
                  role === 'Both' ? 'role-both shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {isTh ? 'ทั้งสองอย่าง' : 'Both'}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800">{isTh ? 'รหัสผ่าน' : 'Password'}</label>
            <div className="flex items-center gap-2 px-4 py-3 travel-input">
              <Lock className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="password"
                required
                placeholder={isTh ? "อย่างน้อย 6 ตัวอักษร" : "At least 6 characters"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-transparent border-none text-slate-900 text-sm focus:outline-none w-full placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* PDPA & Terms of Service Acceptance Checkbox */}
          <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
            <input
              type="checkbox"
              id="termsCheckbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
            />
            <label htmlFor="termsCheckbox" className="text-slate-700 font-medium leading-relaxed cursor-pointer select-none">
              {isTh ? (
                <>
                  ฉันได้อ่านและยอมรับ{' '}
                  <button
                    type="button"
                    onClick={() => setTermsModalOpen(true)}
                    className="text-emerald-700 hover:text-emerald-800 font-bold underline cursor-pointer"
                  >
                    ข้อกำหนดการใช้งาน
                  </button>{' '}
                  และ{' '}
                  <button
                    type="button"
                    onClick={() => setTermsModalOpen(true)}
                    className="text-emerald-700 hover:text-emerald-800 font-bold underline cursor-pointer"
                  >
                    นโยบายความเป็นส่วนตัว (PDPA)
                  </button>{' '}
                  รวมถึงข้อจำกัดความรับผิดชอบ (ตกลงสละสิทธิ์เอาผิดเจ้าของเว็บไซต์และผู้ดูแลระบบทุกกรณี)
                </>
              ) : (
                <>
                  I have read and agree to the{' '}
                  <button
                    type="button"
                    onClick={() => setTermsModalOpen(true)}
                    className="text-emerald-700 hover:text-emerald-800 font-bold underline cursor-pointer"
                  >
                    Terms of Service
                  </button>{' '}
                  and{' '}
                  <button
                    type="button"
                    onClick={() => setTermsModalOpen(true)}
                    className="text-emerald-700 hover:text-emerald-800 font-bold underline cursor-pointer"
                  >
                    Privacy Policy (PDPA)
                  </button>
                  , including limitation of liability (waive all rights to claim against site owners and administrators).
                </>
              )}
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || !acceptedTerms}
            className="w-full py-3.5 travel-btn-primary font-bold text-sm disabled:opacity-50 mt-2 shadow-sm"
          >
            {loading ? (isTh ? 'กำลังลงทะเบียน...' : 'Registering...') : (isTh ? 'ยืนยันลงทะเบียนสมาชิก' : 'Sign Up')}
          </button>
        </form>

        <div className="text-center text-xs text-slate-600 font-medium">
          {isTh ? 'มีบัญชีอยู่แล้ว?' : 'Already have an account?'}{' '}
          <Link to="/login" className="text-emerald-700 hover:text-emerald-800 hover:underline font-bold">
            {isTh ? 'เข้าสู่ระบบที่นี่' : 'Sign in here'}
          </Link>
        </div>
      </div>

      <TermsModal
        isOpen={termsModalOpen}
        onClose={() => setTermsModalOpen(false)}
      />
    </div>
  );
}
