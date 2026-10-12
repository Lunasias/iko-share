import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import { useTheme } from '../context/ThemeContext';
import {
  Mail, Phone, Lock, KeyRound, Send, CheckCircle2,
  AlertCircle, ArrowLeft, Shield, RefreshCw, MessageSquare
} from 'lucide-react';

export default function ForgotPasswordChat() {
  const { isTh } = useTheme();

  // Active tab: 'reset' (self-service reset) | 'support' (contact admin)
  const [activeTab, setActiveTab] = useState('reset');

  // Self-service reset password state
  const [resetEmail, setResetEmail] = useState('');
  const [resetPhone, setResetPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState('');

  // Support ticket state (fallback)
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [requestType, setRequestType] = useState('forgot_password');
  const [message, setMessage] = useState(isTh ? 'สวัสดีครับ ลืมรหัสผ่านเข้าใช้งาน ต้องการความช่วยเหลือในการกู้คืนบัญชีครับ' : 'Hello, I forgot my password and need help recovering my account.');
  const [submitting, setSubmitting] = useState(false);
  const [supportError, setSupportError] = useState('');
  const [ticket, setTicket] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  // Handle self-service password reset
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setResetError('');

    if (newPassword.length < 6) {
      setResetError(isTh ? 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร' : 'New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetError(isTh ? 'รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน' : 'Passwords do not match');
      return;
    }

    setResetSubmitting(true);
    try {
      const res = await API.post('/auth/reset-password', {
        email: resetEmail.trim(),
        phone: resetPhone.trim(),
        new_password: newPassword,
      });

      if (res.data.success) {
        setResetSuccess(true);
      } else {
        setResetError(String(res.data.message || 'ไม่สามารถรีเซ็ตรหัสผ่านได้'));
      }
    } catch (err) {
      setResetError(String(err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน'));
    } finally {
      setResetSubmitting(false);
    }
  };

  // Handle admin support ticket submission
  const handleSupportSubmit = async (e) => {
    e.preventDefault();
    setSupportError('');
    setSubmitting(true);
    try {
      const res = await API.post('/support/requests', {
        email: email.trim(),
        name: name.trim(),
        request_type: requestType,
        message,
      });
      if (res.data.success) {
        setTicket(res.data.request);
      } else {
        setSupportError(String(res.data.message || 'ไม่สามารถส่งข้อความได้'));
      }
    } catch (err) {
      setSupportError(String(err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการส่งข้อความ'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRefreshStatus = async () => {
    if (!ticket) return;
    setCheckingStatus(true);
    try {
      const res = await API.get(`/support/requests/${ticket.request_id}?email=${encodeURIComponent(ticket.email)}`);
      if (res.data.success) {
        setTicket(res.data.request);
      }
    } catch {
      // keep
    } finally {
      setCheckingStatus(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto my-12 px-4 space-y-6">
      <Link to="/login" className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:underline">
        <ArrowLeft className="w-4 h-4" />
        <span>{isTh ? 'กลับไปหน้าเข้าสู่ระบบ' : 'Back to Login'}</span>
      </Link>

      <div className="travel-card p-6 sm:p-8 space-y-6 shadow-md border border-slate-200">
        <div className="text-center space-y-2">
          <div className="inline-flex p-4 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 mb-1">
            <KeyRound className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            {isTh ? 'ระบบกู้คืนและตั้งรหัสผ่านใหม่' : 'Reset & Recover Password'}
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            {isTh
              ? 'ตั้งรหัสผ่านใหม่ได้ทันทีด้วยอีเมลและเบอร์โทรศัพท์ที่ลงทะเบียนไว้'
              : 'Reset your password immediately with your verified email and phone number'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl text-xs font-bold gap-1 border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('reset')}
            className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'reset'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>{isTh ? 'ตั้งรหัสผ่านใหม่' : 'Reset Password'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('support')}
            className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'support'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>{isTh ? 'ติดต่อแอดมิน' : 'Contact Support'}</span>
          </button>
        </div>

        {/* TAB 1: Self-Service Reset */}
        {activeTab === 'reset' && (
          <div>
            {resetSuccess ? (
              <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-emerald-950">
                    {isTh ? 'ตั้งรหัสผ่านใหม่สำเร็จแล้ว!' : 'Password Reset Successfully!'}
                  </h3>
                  <p className="text-xs text-emerald-800 font-medium">
                    {isTh
                      ? 'คุณสามารถใช้รหัสผ่านใหม่เข้าสู่ระบบได้ทันที'
                      : 'You can now log in using your new password immediately.'}
                  </p>
                </div>
                <Link
                  to="/login"
                  className="inline-block w-full py-3.5 travel-btn-primary font-bold text-xs shadow-md"
                >
                  {isTh ? 'เข้าสู่ระบบด้วยรหัสผ่านใหม่' : 'Proceed to Login'}
                </Link>
              </div>
            ) : (
              <form onSubmit={handleResetSubmit} className="space-y-4">
                {resetError && (
                  <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 font-semibold">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                    <span>{resetError}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">
                    {isTh ? 'อีเมลที่ลงทะเบียนไว้' : 'Registered Email'}
                  </label>
                  <div className="flex items-center gap-2 px-4 py-3 travel-input h-12">
                    <Mail className="w-5 h-5 text-slate-400 shrink-0" />
                    <input
                      type="email"
                      required
                      placeholder={isTh ? "เช่น user@example.com" : "e.g. user@example.com"}
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="bg-transparent border-none text-slate-900 text-sm focus:outline-none w-full font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">
                    {isTh ? 'เบอร์โทรศัพท์ที่ลงทะเบียนไว้' : 'Registered Phone Number'}
                  </label>
                  <div className="flex items-center gap-2 px-4 py-3 travel-input h-12">
                    <Phone className="w-5 h-5 text-slate-400 shrink-0" />
                    <input
                      type="tel"
                      required
                      placeholder={isTh ? "เช่น 0812345678" : "e.g. 0812345678"}
                      value={resetPhone}
                      onChange={(e) => setResetPhone(e.target.value)}
                      className="bg-transparent border-none text-slate-900 text-sm focus:outline-none w-full font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">
                    {isTh ? 'รหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)' : 'New Password (min 6 chars)'}
                  </label>
                  <div className="flex items-center gap-2 px-4 py-3 travel-input h-12">
                    <Lock className="w-5 h-5 text-slate-400 shrink-0" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="bg-transparent border-none text-slate-900 text-sm focus:outline-none w-full font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">
                    {isTh ? 'ยืนยันรหัสผ่านใหม่อีกครั้ง' : 'Confirm New Password'}
                  </label>
                  <div className="flex items-center gap-2 px-4 py-3 travel-input h-12">
                    <Lock className="w-5 h-5 text-slate-400 shrink-0" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="bg-transparent border-none text-slate-900 text-sm focus:outline-none w-full font-medium"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={resetSubmitting}
                  className="w-full py-3.5 travel-btn-primary font-bold text-sm disabled:opacity-50 mt-2 shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{resetSubmitting ? (isTh ? 'กำลังบันทึกรหัสผ่านใหม่...' : 'Resetting...') : (isTh ? 'ยืนยันและเปลี่ยนรหัสผ่านทันที' : 'Reset Password Now')}</span>
                </button>
              </form>
            )}
          </div>
        )}

        {/* TAB 2: Support Ticket Fallback */}
        {activeTab === 'support' && (
          <div>
            {supportError && (
              <div className="p-3.5 mb-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                <span>{supportError}</span>
              </div>
            )}

            {ticket ? (
              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-black text-sm text-emerald-800">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span>{isTh ? 'ส่งคำขอถึงแอดมินเรียบร้อยแล้ว' : 'Ticket Submitted'}</span>
                    </div>
                    <span className="font-mono text-[11px] text-emerald-700 font-bold">Ticket #{ticket.request_id}</span>
                  </div>
                  <div className="space-y-1 text-[11px] font-medium text-emerald-800">
                    <div><strong>อีเมล:</strong> {ticket.email}</div>
                    <div><strong>สถานะ:</strong>{' '}
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        ticket.status === 'ดำเนินการแล้ว' ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'
                      }`}>{ticket.status}</span>
                    </div>
                  </div>
                  {ticket.admin_reply && (
                    <div className="p-3 bg-white rounded-xl border border-emerald-300 space-y-1">
                      <div className="font-bold text-emerald-900 text-[11px]">{isTh ? 'ข้อความตอบกลับจากแอดมิน:' : 'Admin Reply:'}</div>
                      <p className="text-slate-800 leading-relaxed">{ticket.admin_reply}</p>
                    </div>
                  )}
                  {ticket.status === 'ดำเนินการแล้ว' ? (
                    <div className="p-3 bg-emerald-100 rounded-xl text-center space-y-2">
                      <p className="font-bold text-emerald-900">{isTh ? 'แอดมินดำเนินการเรียบร้อยแล้ว!' : 'Admin has resolved this request!'}</p>
                      <Link to="/register" className="inline-block px-4 py-2 travel-btn-primary text-xs font-bold">
                        {isTh ? 'ไปที่หน้าสมัครสมาชิก' : 'Go to Register'}
                      </Link>
                    </div>
                  ) : (
                    <p className="text-[11px] text-emerald-700 italic">
                      {isTh
                        ? 'แอดมินจะตรวจสอบและช่วยเหลือให้โดยเร็วที่สุด'
                        : 'Admin will review and resolve your request as soon as possible.'}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleRefreshStatus}
                  disabled={checkingStatus}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border border-slate-300 cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${checkingStatus ? 'animate-spin' : ''}`} />
                  <span>{checkingStatus ? (isTh ? 'กำลังตรวจสอบ...' : 'Checking...') : (isTh ? 'อัปเดตสถานะล่าสุด' : 'Refresh Status')}</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleSupportSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">{isTh ? 'อีเมลที่ใช้สมัครสมาชิก' : 'Email'}</label>
                  <div className="flex items-center gap-2 px-4 py-3 travel-input h-12">
                    <Mail className="w-5 h-5 text-slate-400 shrink-0" />
                    <input
                      type="email"
                      required
                      placeholder="user@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-transparent border-none text-slate-900 text-sm focus:outline-none w-full font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">{isTh ? 'ชื่อของคุณ (ไม่บังคับ)' : 'Your Name (Optional)'}</label>
                  <div className="flex items-center gap-2 px-4 py-3 travel-input h-12">
                    <MessageSquare className="w-5 h-5 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      placeholder={isTh ? "ชื่อผู้ใช้งานเดิม" : "Your name"}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-transparent border-none text-slate-900 text-sm focus:outline-none w-full font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">{isTh ? 'ประเภทคำขอ' : 'Request Type'}</label>
                  <select
                    value={requestType}
                    onChange={(e) => setRequestType(e.target.value)}
                    className="w-full px-4 py-3 travel-input text-xs font-semibold h-12"
                  >
                    <option value="forgot_password">{isTh ? 'แจ้งลืมรหัสผ่าน / ขอความช่วยเหลือ' : 'Forgot Password'}</option>
                    <option value="delete_account">{isTh ? 'ขอลบบัญชีเดิมเพื่อสมัครใหม่' : 'Delete Account'}</option>
                    <option value="other">{isTh ? 'เรื่องอื่นๆ' : 'Other'}</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">{isTh ? 'ข้อความถึงแอดมิน' : 'Message to Admin'}</label>
                  <textarea
                    rows="3"
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-4 py-3 travel-input text-xs resize-none"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 travel-btn-primary font-bold text-sm disabled:opacity-50 mt-2 shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? (isTh ? 'กำลังส่งเรื่อง...' : 'Sending...') : (isTh ? 'ส่งคำขอถึงแอดมิน' : 'Submit Ticket')}</span>
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
