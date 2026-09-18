import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import { MessageSquare, Mail, User, Send, CheckCircle2, AlertCircle, ArrowLeft, Shield, RefreshCw } from 'lucide-react';

export default function ForgotPasswordChat() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [requestType, setRequestType] = useState('delete_account');
  const [message, setMessage] = useState('สวัสดีครับ ลืมรหัสผ่านเข้าใช้งาน ขอลบบัญชีเดิมเพื่อสมัครใหม่ด้วยอีเมลนี้ครับ');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [ticket, setTicket] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await API.post('/support/requests', { email, name, request_type: requestType, message });
      if (res.data.success) {
        setTicket(res.data.request);
      } else {
        setError(String(res.data.message || 'ไม่สามารถส่งข้อความได้'));
      }
    } catch (err) {
      setError(String(err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการส่งข้อความ'));
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
    } catch (err) {
      // keep
    } finally {
      setCheckingStatus(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto my-12 px-4 space-y-6">
      <Link to="/login" className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:underline">
        <ArrowLeft className="w-4 h-4" />
        <span>กลับไปหน้าเข้าสู่ระบบ</span>
      </Link>

      <div className="travel-card p-6 sm:p-8 space-y-6 shadow-md border border-slate-200">
        <div className="text-center space-y-2">
          <div className="inline-flex p-4 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 mb-1">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            ติดต่อแอดมิน: ลืมรหัสผ่าน / ขอลบบัญชี
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            เปิดแชทส่งเรื่องถึงทีมแอดมินเพื่อขอลบบัญชีเดิมและเปิดทางให้สมัครสมาชิกใหม่
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 font-semibold">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {ticket ? (
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-black text-sm text-emerald-800">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>ส่งคำขอถึงแอดมินเรียบร้อยแล้ว</span>
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
                  <div className="font-bold text-emerald-900 text-[11px]">ข้อความตอบกลับจากแอดมิน:</div>
                  <p className="text-slate-800 leading-relaxed">{ticket.admin_reply}</p>
                </div>
              )}
              {ticket.status === 'ดำเนินการแล้ว' ? (
                <div className="p-3 bg-emerald-100 rounded-xl text-center space-y-2">
                  <p className="font-bold text-emerald-900">แอดมินดำเนินการลบบัญชีเดิมเรียบร้อยแล้ว!</p>
                  <Link to="/register" className="inline-block px-4 py-2 travel-btn-primary text-xs font-bold">
                    สมัครสมาชิกใหม่ตอนนี้
                  </Link>
                </div>
              ) : (
                <p className="text-[11px] text-emerald-700 italic">
                  แอดมินจะตรวจสอบและลบบัญชีเดิมให้ เมื่อลบแล้วท่านสามารถใช้อีเมลเดิมสมัครใหม่ได้ทันที
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={handleRefreshStatus}
              disabled={checkingStatus}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border border-slate-300"
            >
              <RefreshCw className={`w-4 h-4 ${checkingStatus ? 'animate-spin' : ''}`} />
              <span>{checkingStatus ? 'กำลังตรวจสอบ...' : 'อัปเดตสถานะล่าสุด'}</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800">อีเมลที่ใช้สมัครสมาชิก (Email)</label>
              <div className="flex items-center gap-2 px-4 py-3 travel-input">
                <Mail className="w-5 h-5 text-slate-400 shrink-0" />
                <input
                  type="email"
                  required
                  placeholder="อีเมล เช่น user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-transparent border-none text-slate-900 text-sm focus:outline-none w-full font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800">ชื่อของคุณ (ไม่บังคับ)</label>
              <div className="flex items-center gap-2 px-4 py-3 travel-input">
                <User className="w-5 h-5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="ชื่อผู้ใช้งานเดิม"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-transparent border-none text-slate-900 text-sm focus:outline-none w-full font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800">ประเภทคำขอ</label>
              <select
                value={requestType}
                onChange={(e) => setRequestType(e.target.value)}
                className="w-full px-4 py-3 travel-input text-xs font-semibold"
              >
                <option value="delete_account">ขอลบบัญชีเดิมเพื่อสมัครใหม่ (แนะนำสำหรับลืมรหัสผ่าน)</option>
                <option value="forgot_password">แจ้งลืมรหัสผ่าน</option>
                <option value="other">เรื่องอื่นๆ</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800">ข้อความถึงแอดมิน</label>
              <textarea
                rows="4"
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-4 py-3 travel-input text-xs resize-none"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 travel-btn-primary font-bold text-sm disabled:opacity-50 mt-2 shadow-sm flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'กำลังส่งเรื่อง...' : 'ส่งคำขอถึงแอดมิน'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
