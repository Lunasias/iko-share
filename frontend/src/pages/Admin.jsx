import React, { useState, useEffect } from 'react';
import API from '../services/api';
import CarLoader from '../components/CarLoader';
import {
  Shield, Users, Car, Calendar, MapPin, Trash2, AlertCircle,
  Flag, MessageSquare, Check, X, UserX, ShieldCheck,
  FileCheck, ExternalLink, Image as ImageIcon, Scale, Lock, Eye,
  CheckCircle2, XCircle, Clock
} from 'lucide-react';

export default function Admin() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCars: 0,
    totalEvents: 0,
    totalTrips: 0,
    totalBookings: 0,
    totalReports: 0,
    totalSupportRequests: 0,
    totalVerificationRequests: 0,
    totalPdpaRequests: 0,
  });
  const [users, setUsers] = useState([]);
  const [recentTrips, setRecentTrips] = useState([]);
  const [reports, setReports] = useState([]);
  const [supportRequests, setSupportRequests] = useState([]);
  const [verificationRequests, setVerificationRequests] = useState([]);
  const [pdpaRequests, setPdpaRequests] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    setError('');
    try {
      const statsRes = await API.get('/admin/stats');
      if (statsRes.data.success) {
        setStats(statsRes.data.stats || {
          totalUsers: 0, totalCars: 0, totalEvents: 0, totalTrips: 0,
          totalBookings: 0, totalReports: 0, totalSupportRequests: 0,
          totalVerificationRequests: 0, totalPdpaRequests: 0,
        });
        setRecentTrips(statsRes.data.recentTrips || []);
      }

      const usersRes = await API.get('/admin/users');
      if (usersRes.data.success) {
        setUsers(usersRes.data.users || []);
      }

      try {
        const reportsRes = await API.get('/admin/reports');
        if (reportsRes.data.success) {
          setReports(reportsRes.data.reports || []);
        }
      } catch (e) {}

      try {
        const supportRes = await API.get('/admin/support-requests');
        if (supportRes.data.success) {
          setSupportRequests(supportRes.data.requests || []);
        }
      } catch (e) {}

      try {
        const verifRes = await API.get('/admin/verification-requests');
        if (verifRes.data.success) {
          setVerificationRequests(verifRes.data.requests || []);
        }
      } catch (e) {}

      try {
        const pdpaRes = await API.get('/admin/pdpa-requests');
        if (pdpaRes.data.success) {
          setPdpaRequests(pdpaRes.data.requests || []);
        }
      } catch (e) {}
    } catch (err) {
      console.error('Fetch admin data error:', err);
      setError(String(err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ดูแลระบบ'));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateReportStatus = async (reportId, status) => {
    try {
      const res = await API.put(`/admin/reports/${reportId}`, { status });
      if (res.data.success) {
        setReports((prev) => prev.map((r) => r.report_id === reportId ? { ...r, status } : r));
      }
    } catch (err) {
      alert(String(err.response?.data?.message || err.message || 'ไม่สามารถอัปเดตรายงานได้'));
    }
  };

  const handleDeleteReportedMessage = async (messageId) => {
    if (!window.confirm('คุณต้องการลบข้อความนี้ออกจากห้องแชทของทริปใช่หรือไม่?')) return;
    try {
      const res = await API.delete(`/admin/messages/${messageId}`);
      if (res.data.success) {
        setSuccessMsg(String(res.data.message));
        fetchAdminData();
      }
    } catch (err) {
      alert(String(err.response?.data?.message || err.message || 'ไม่สามารถลบข้อความได้'));
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm('คุณต้องการลบรายการรายงานนี้ใช่หรือไม่?')) return;
    try {
      const res = await API.delete(`/admin/reports/${reportId}`);
      if (res.data.success) {
        setReports((prev) => prev.filter((r) => r.report_id !== reportId));
      }
    } catch (err) {
      alert(String(err.response?.data?.message || err.message || 'ไม่สามารถลบรายงานได้'));
    }
  };

  const handleResolveSupportAndDeleteUser = async (email, requestId) => {
    if (!window.confirm(`ยืนยันการลบบัญชีผู้ใช้ ${email} ตามคำขอใช่หรือไม่? หลังจากลบแล้วผู้ใช้จะสามารถสมัครใหม่ด้วยอีเมลเดิมได้`)) return;
    try {
      const res = await API.delete(`/admin/users-by-email/${encodeURIComponent(email)}`);
      if (res.data.success) {
        setSuccessMsg(String(res.data.message));
        fetchAdminData();
      } else {
        alert(String(res.data.message));
      }
    } catch (err) {
      alert(String(err.response?.data?.message || err.message || 'ไม่สามารถลบบัญชีตามคำขอได้'));
    }
  };

  const handleUpdateSupportStatus = async (requestId, status, currentReply) => {
    const reply = window.prompt('ข้อความตอบกลับไปยังผู้ใช้ (เว้นว่างไว้เพื่อคงข้อความเดิม):', currentReply || '');
    if (reply === null) return;
    try {
      const res = await API.put(`/admin/support-requests/${requestId}`, { status, admin_reply: reply });
      if (res.data.success) {
        setSupportRequests((prev) => prev.map((s) => s.request_id === requestId ? res.data.request : s));
      }
    } catch (err) {
      alert(String(err.response?.data?.message || err.message || 'ไม่สามารถอัปเดตคำขอได้'));
    }
  };

  const handleDeleteSupportRequest = async (requestId) => {
    if (!window.confirm('คุณต้องการลบคำขอนี้ใช่หรือไม่?')) return;
    try {
      const res = await API.delete(`/admin/support-requests/${requestId}`);
      if (res.data.success) {
        setSupportRequests((prev) => prev.filter((s) => s.request_id !== requestId));
      }
    } catch (err) {
      alert(String(err.response?.data?.message || err.message || 'ไม่สามารถลบคำขอได้'));
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('คุณต้องการลบผู้ใช้งานรายนี้ออกจากระบบใช่หรือไม่?')) return;
    try {
      const res = await API.delete(`/admin/users/${id}`);
      if (res.data.success) {
        setUsers((prev) => prev.filter((u) => (u.user_id || u.id) !== id));
        fetchAdminData();
      }
    } catch (err) {
      alert(String(err.response?.data?.message || err.message || 'ไม่สามารถลบผู้ใช้งานได้'));
    }
  };

  const handleToggleAdminAccess = async (user) => {
    const userId = user.user_id || user.id;
    try {
      const res = await API.put(`/admin/users/${userId}/admin-access`, { is_admin: !user.is_admin });
      if (res.data.success) {
        setUsers((prev) => prev.map((item) => (item.user_id || item.id) === userId ? res.data.user : item));
      }
    } catch (err) {
      alert(String(err.response?.data?.message || err.message || 'ไม่สามารถอัปเดตสิทธิ์ผู้ดูแลระบบได้'));
    }
  };

  const handleToggleUserVerification = async (targetUser) => {
    const userId = targetUser.user_id || targetUser.id;
    try {
      const res = await API.put(`/admin/users/${userId}/verification`, { is_verified: !targetUser.is_verified });
      if (res.data.success) {
        setUsers((prev) => prev.map((item) => (item.user_id || item.id) === userId ? { ...item, is_verified: res.data.user.is_verified } : item));
        setSuccessMsg(res.data.message);
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      alert(String(err.response?.data?.message || err.message || 'ไม่สามารถอัปเดตสถานะความน่าเชื่อถือได้'));
    }
  };

  const handleDeleteTrip = async (tripId) => {
    if (!window.confirm('คุณต้องการลบเที่ยวเดินทางนี้ออกจากระบบใช่หรือไม่?')) return;
    try {
      const res = await API.delete(`/admin/trips/${tripId}`);
      if (res.data.success) {
        setRecentTrips((prev) => prev.filter((t) => t.trip_id !== tripId));
        fetchAdminData();
      }
    } catch (err) {
      alert(String(err.response?.data?.message || err.message || 'ไม่สามารถลบเที่ยวเดินทางได้'));
    }
  };

  const handleReviewVerification = async (requestId, status, currentReply = '') => {
    let reply = '';
    if (status === 'ปฏิเสธ') {
      reply = window.prompt('ระบุเหตุผลที่ไม่อนุมัติ (เช่น รูปถ่ายไม่ชัดเจน, ข้อมูลไม่ตรงตามเกณฑ์):', currentReply || '');
      if (reply === null) return;
    } else {
      const confirmed = window.confirm('ยืนยันอนุมัติตราสัญลักษณ์ความน่าเชื่อถือ (Trust Badge) ให้ผู้ใช้รายนี้ใช่หรือไม่?');
      if (!confirmed) return;
      reply = 'อนุมัติเรียบร้อย เอกสารถูกต้องตามเกณฑ์';
    }

    try {
      const res = await API.put(`/admin/verification-requests/${requestId}/review`, {
        status,
        admin_reply: reply,
      });
      if (res.data.success) {
        setSuccessMsg(res.data.message);
        setTimeout(() => setSuccessMsg(''), 4000);
        fetchAdminData();
      }
    } catch (err) {
      alert(String(err.response?.data?.message || err.message || 'ไม่สามารถบันทึกผลการตรวจสอบได้'));
    }
  };

  const handleUpdatePdpaStatus = async (requestId, newStatus, currentReply = '') => {
    const reply = window.prompt(`ระบุข้อความตอบกลับหรือบันทึกการดำเนินการ (สถานะ: ${newStatus}):`, currentReply || '');
    if (reply === null) return;

    try {
      const res = await API.put(`/admin/pdpa-requests/${requestId}`, {
        status: newStatus,
        admin_reply: reply,
      });
      if (res.data.success) {
        setSuccessMsg(res.data.message);
        setTimeout(() => setSuccessMsg(''), 4000);
        setPdpaRequests((prev) => prev.map((p) => p.request_id === requestId ? res.data.request : p));
      }
    } catch (err) {
      alert(String(err.response?.data?.message || err.message || 'ไม่สามารถอัปเดตคำร้อง PDPA ได้'));
    }
  };

  const handleDeletePdpaRequest = async (requestId) => {
    if (!window.confirm('คุณต้องการลบคำร้องขอใช้สิทธิ PDPA นี้ใช่หรือไม่?')) return;
    try {
      const res = await API.delete(`/admin/pdpa-requests/${requestId}`);
      if (res.data.success) {
        setPdpaRequests((prev) => prev.filter((p) => p.request_id !== requestId));
        setSuccessMsg('ลบรายการคำร้อง PDPA เรียบร้อย');
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      alert(String(err.response?.data?.message || err.message || 'ไม่สามารถลบคำร้องได้'));
    }
  };

  if (loading) {
    return <CarLoader text="กำลังโหลดระบบผู้ดูแลระบบ (Admin Dashboard)..." />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center gap-3">
        <div className="p-3.5 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200">
          <Shield className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
            ระบบจัดการผู้ดูแลระบบ (Admin Dashboard)
          </h2>
          <p className="text-xs text-slate-500 font-medium">ภาพรวมสถิติแพลตฟอร์มและการจัดการข้อมูลสมาชิก / เที่ยวรถ</p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-3 font-semibold">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Success Notification */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-3 font-semibold">
          <Check className="w-5 h-5 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ER Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
        <div className="travel-card p-4 space-y-1 border border-slate-200 shadow-xs">
          <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">สมาชิก (Users)</div>
          <div className="text-xl font-black text-emerald-700">{stats.totalUsers}</div>
        </div>

        <div className="travel-card p-4 space-y-1 border border-slate-200 shadow-xs">
          <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">รถยนต์ (Cars)</div>
          <div className="text-xl font-black text-teal-700">{stats.totalCars}</div>
        </div>

        <div className="travel-card p-4 space-y-1 border border-slate-200 shadow-xs">
          <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">เที่ยวรถ (Trips)</div>
          <div className="text-xl font-black text-amber-700">{stats.totalTrips}</div>
        </div>

        <div className="travel-card p-4 space-y-1 border border-slate-200 shadow-xs">
          <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">การจอง (Bookings)</div>
          <div className="text-xl font-black text-rose-700">{stats.totalBookings}</div>
        </div>

        <div className="travel-card p-4 space-y-1 border border-blue-200 bg-blue-50/40 shadow-xs">
          <div className="text-blue-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-blue-600" />
            <span>ขอ Trust Badge</span>
          </div>
          <div className="text-xl font-black text-blue-800 flex items-center justify-between">
            <span>{stats.totalVerificationRequests || 0}</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">รอตรวจ</span>
          </div>
        </div>

        <div className="travel-card p-4 space-y-1 border border-indigo-200 bg-indigo-50/40 shadow-xs">
          <div className="text-indigo-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
            <Scale className="w-3 h-3 text-indigo-600" />
            <span>คำร้อง PDPA</span>
          </div>
          <div className="text-xl font-black text-indigo-800 flex items-center justify-between">
            <span>{stats.totalPdpaRequests || 0}</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700">รอตรวจ</span>
          </div>
        </div>

        <div className="travel-card p-4 space-y-1 border border-red-200 bg-red-50/40 shadow-xs">
          <div className="text-red-600 text-[10px] font-bold uppercase tracking-wider">รายงานแชทค้าง</div>
          <div className="text-xl font-black text-red-700">{stats.totalReports || 0}</div>
        </div>

        <div className="travel-card p-4 space-y-1 border border-amber-200 bg-amber-50/40 shadow-xs">
          <div className="text-amber-700 text-[10px] font-bold uppercase tracking-wider">คำขอลืมรหัส</div>
          <div className="text-xl font-black text-amber-800">{stats.totalSupportRequests || 0}</div>
        </div>
      </div>

      {/* Table: Recent Trips */}
      <div className="travel-card p-6 space-y-4 border border-slate-200 shadow-xs">
        <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <Car className="w-5 h-5 text-amber-600" />
          <span>เที่ยวเดินทางล่าสุด</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase font-bold">
                <th className="py-3 px-4">Trip ID</th>
                <th className="py-3 px-4">เส้นทาง</th>
                <th className="py-3 px-4">คนขับ</th>
                <th className="py-3 px-4">ทะเบียนรถ</th>
                <th className="py-3 px-4 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800 font-medium">
              {recentTrips.map((t) => (
                <tr key={t.trip_id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-500">#{t.trip_id}</td>
                  <td className="py-3 px-4 font-extrabold text-slate-900">{t.origin} ➔ {t.destination}</td>
                  <td className="py-3 px-4">{t.driver_name}</td>
                  <td className="py-3 px-4 font-mono">{t.license_plate}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleDeleteTrip(t.trip_id)}
                      className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50"
                      title="ลบเที่ยวเดินทาง"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Users Management Table */}
      <div className="travel-card p-6 space-y-4 border border-slate-200 shadow-xs">
        <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-emerald-600" />
          <span>รายการสมาชิกในระบบ (Users)</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase font-bold">
                <th className="py-3 px-4">User ID</th>
                <th className="py-3 px-4">ชื่อ</th>
                <th className="py-3 px-4">อีเมล</th>
                <th className="py-3 px-4">เบอร์โทร</th>
                <th className="py-3 px-4">บทบาทการเดินทาง</th>
                <th className="py-3 px-4">ความน่าเชื่อถือ (Trust Badge)</th>
                <th className="py-3 px-4">สิทธิ์ผู้ดูแลระบบ</th>
                <th className="py-3 px-4 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800 font-medium">
              {users.map((u) => {
                const uid = u.user_id || u.id;
                return (
                  <tr key={uid} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-500">#{uid}</td>
                    <td className="py-3 px-4 font-extrabold text-slate-900">{u.name}</td>
                    <td className="py-3 px-4">{u.email}</td>
                    <td className="py-3 px-4">{u.phone || '-'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        u.role === 'Driver' ? 'role-driver' : u.role === 'Both' ? 'role-both' : 'role-passenger'
                      }`}>
                        {u.role === 'Both' ? 'คนขับและผู้โดยสาร' : u.role === 'Driver' ? 'คนขับ' : 'ผู้โดยสาร'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggleUserVerification(u)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition shadow-2xs ${
                          u.is_verified
                            ? 'bg-blue-100 text-blue-800 border border-blue-300 hover:bg-blue-200'
                            : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                        }`}
                        title="คลิกเพื่อสลับสถานะความน่าเชื่อถือ"
                      >
                        {u.is_verified ? (
                          <>
                            <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span>🛡️ ยืนยันแล้ว</span>
                          </>
                        ) : (
                          <>
                            <Shield className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>รอตรวจสอบ</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        disabled={u.email === 'admin@ikoshare.com'}
                        onClick={() => handleToggleAdminAccess(u)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${u.is_admin ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-slate-100 text-slate-600 border border-slate-200'} disabled:opacity-60`}
                      >
                        {u.is_admin ? 'ผู้ดูแลระบบ' : 'ผู้ใช้ทั่วไป'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {u.email !== 'admin@ikoshare.com' && (
                        <button
                          onClick={() => handleDeleteUser(uid)}
                          className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50"
                          title="ลบสมาชิก"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trust Badge Verification Requests */}
      <div className="travel-card p-6 space-y-4 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-black text-slate-900">
              ตรวจสอบคำขอเครื่องหมายความน่าเชื่อถือ (Trust Badge Requests)
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
              {verificationRequests.filter((v) => v.status === 'รอดำเนินการ').length} รอตรวจสอบ
            </span>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            ตรวจดูรูปหลักฐาน (บัตร ปชช. / ใบขับขี่) และอนุมัติตราสัญลักษณ์ 🛡️ ให้สมาชิก
          </span>
        </div>

        {verificationRequests.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
            ยังไม่มีคำขอยืนยันตัวตนส่งเข้ามา
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase font-bold">
                  <th className="py-3 px-3">วันที่ยื่น</th>
                  <th className="py-3 px-3">ผู้ยื่นคำขอ</th>
                  <th className="py-3 px-3">ประเภทเอกสาร</th>
                  <th className="py-3 px-3">ชื่อ-เลขบัตร</th>
                  <th className="py-3 px-3">รูปถ่ายเอกสาร</th>
                  <th className="py-3 px-3">หมายเหตุ</th>
                  <th className="py-3 px-3">สถานะ</th>
                  <th className="py-3 px-3">การตอบกลับ</th>
                  <th className="py-3 px-3 text-right">ดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800 font-medium">
                {verificationRequests.map((vr) => (
                  <tr key={vr.request_id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(vr.created_at).toLocaleDateString('th-TH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900">
                      <div>{vr.user_name || `User #${vr.user_id}`}</div>
                      <div className="text-[11px] font-normal text-slate-500">{vr.user_email}</div>
                      {vr.user_phone && <div className="text-[10px] text-slate-400">โทร: {vr.user_phone}</div>}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {vr.doc_type}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-800">{vr.real_name}</div>
                      <div className="text-[10px] font-mono text-slate-500">{vr.id_number}</div>
                    </td>
                    <td className="py-3 px-3">
                      {vr.doc_image_url ? (
                        <button
                          type="button"
                          onClick={() => setPreviewImage(vr.doc_image_url)}
                          className="group relative block w-14 h-10 rounded-lg overflow-hidden border border-slate-200 hover:border-blue-400 shadow-2xs"
                          title="คลิกเพื่อดูรูปเอกสารขนาดใหญ่"
                        >
                          <img
                            src={vr.doc_image_url}
                            alt="หลักฐาน"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                            <Eye className="w-3.5 h-3.5" />
                          </div>
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400">ไม่มีรูป</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-[11px] text-slate-600 max-w-xs break-words">
                      {vr.notes || '-'}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        vr.status === 'อนุมัติแล้ว'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : vr.status === 'ปฏิเสธ'
                          ? 'bg-rose-100 text-rose-800 border-rose-200'
                          : 'bg-amber-100 text-amber-800 border-amber-200'
                      }`}>
                        {vr.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[11px] text-slate-600 max-w-xs break-words">
                      {vr.admin_reply || '-'}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {vr.status === 'รอดำเนินการ' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleReviewVerification(vr.request_id, 'อนุมัติแล้ว')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold shadow-xs flex items-center gap-1"
                            title="อนุมัติตราสัญลักษณ์ความน่าเชื่อถือ"
                          >
                            <Check className="w-3 h-3" />
                            <span>อนุมัติ</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReviewVerification(vr.request_id, 'ปฏิเสธ', vr.admin_reply)}
                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold shadow-xs flex items-center gap-1"
                            title="ปฏิเสธคำขอและระบุเหตุผล"
                          >
                            <X className="w-3 h-3" />
                            <span>ไม่อนุมัติ</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleReviewVerification(vr.request_id, vr.status === 'อนุมัติแล้ว' ? 'ปฏิเสธ' : 'อนุมัติแล้ว', vr.admin_reply)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold"
                          title="สลับสถานะ"
                        >
                          เปลี่ยนสถานะ
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PDPA Data Subject Rights Requests */}
      <div className="travel-card p-6 space-y-4 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-black text-slate-900">
              คำร้องขอใช้สิทธิข้อมูลส่วนบุคคล (PDPA Statutory Rights Requests)
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
              พ.ร.บ. 2562
            </span>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            ต้องดำเนินการหรือแจ้งผลตอบกลับแก่เจ้าของข้อมูลภายใน 30 วันตามกฎหมาย
          </span>
        </div>

        {pdpaRequests.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
            ยังไม่มีคำร้องขอใช้สิทธิข้อมูลส่วนบุคคล
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase font-bold">
                  <th className="py-3 px-3">วันที่ยื่น</th>
                  <th className="py-3 px-3">ผู้ยื่นคำร้อง</th>
                  <th className="py-3 px-3">สิทธิที่ขอใช้</th>
                  <th className="py-3 px-3">รายละเอียดคำร้อง</th>
                  <th className="py-3 px-3">สถานะ</th>
                  <th className="py-3 px-3">การตอบกลับ / บันทึกผล</th>
                  <th className="py-3 px-3 text-right">ดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800 font-medium">
                {pdpaRequests.map((pr) => {
                  const rightLabels = {
                    access: 'ขอเข้าถึงและรับสำเนา (Access)',
                    erasure: 'ขอลบหรือทำลายข้อมูล (Erasure)',
                    rectification: 'ขอแก้ไขข้อมูลให้ถูกต้อง (Rectification)',
                    restriction: 'ขอระงับการใช้ข้อมูล (Restriction)',
                    objection: 'ขอคัดค้านการเก็บ/ใช้/เปิดเผย (Objection)',
                    portability: 'ขอโอนย้ายข้อมูล (Portability)',
                    withdraw_consent: 'ขอถอนความยินยอม (Withdraw Consent)',
                  };

                  return (
                    <tr key={pr.request_id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(pr.created_at).toLocaleDateString('th-TH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900">
                        <div>{pr.requester_name}</div>
                        <div className="text-[11px] font-normal text-slate-500">{pr.requester_email}</div>
                        {pr.requester_phone && <div className="text-[10px] text-slate-400">โทร: {pr.requester_phone}</div>}
                        {pr.current_user_name && (
                          <div className="text-[10px] text-indigo-700 font-medium">บัญชีสมาชิก: {pr.current_user_name}</div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-900 border border-indigo-200">
                          {rightLabels[pr.right_type] || pr.right_type}
                        </span>
                      </td>
                      <td className="py-3 px-3 max-w-xs text-[11px] text-slate-700 break-words">
                        {pr.details}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          pr.status === 'ดำเนินการแล้วเสร็จ'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : pr.status === 'กำลังดำเนินการ'
                            ? 'bg-blue-100 text-blue-800 border-blue-200'
                            : pr.status === 'ปฏิเสธคำขอ'
                            ? 'bg-rose-100 text-rose-800 border-rose-200'
                            : 'bg-amber-100 text-amber-800 border-amber-200'
                        }`}>
                          {pr.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 max-w-xs text-[11px] text-slate-600 break-words">
                        {pr.admin_reply || '-'}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <select
                            value={pr.status}
                            onChange={(e) => handleUpdatePdpaStatus(pr.request_id, e.target.value, pr.admin_reply)}
                            className="text-[10px] font-bold px-2 py-1 rounded-lg border border-slate-300 bg-white cursor-pointer hover:border-indigo-400"
                          >
                            <option value="รอดำเนินการ">รอดำเนินการ</option>
                            <option value="กำลังดำเนินการ">กำลังดำเนินการ</option>
                            <option value="ดำเนินการแล้วเสร็จ">ดำเนินการแล้วเสร็จ</option>
                            <option value="ปฏิเสธคำขอ">ปฏิเสธคำขอ</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => handleDeletePdpaRequest(pr.request_id)}
                            className="p-1 text-slate-400 hover:text-red-600"
                            title="ลบคำร้อง"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Reports on Inappropriate Chat Messages */}
      <div className="travel-card p-6 space-y-4 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Flag className="w-5 h-5 text-red-600" />
            <span>รายงานข้อความไม่เหมาะสมในแชท ({reports.length} รายการ)</span>
          </h3>
          <span className="text-xs text-slate-500 font-medium">ข้อความที่ผู้ใช้กดรายงานจะส่งมาตรวจสอบที่นี่</span>
        </div>

        {reports.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
            ไม่มีรายงานข้อความไม่เหมาะสม ทุกบทสนทนาเรียบร้อยดี
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase font-bold">
                  <th className="py-3 px-3">เวลา</th>
                  <th className="py-3 px-3">ผู้รายงาน</th>
                  <th className="py-3 px-3">ผู้ส่งข้อความ</th>
                  <th className="py-3 px-3">ข้อความที่ถูกรายงาน</th>
                  <th className="py-3 px-3">เหตุผล</th>
                  <th className="py-3 px-3">สถานะ</th>
                  <th className="py-3 px-3 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800 font-medium">
                {reports.map((r) => (
                  <tr key={r.report_id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(r.created_at).toLocaleDateString('th-TH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-700">
                      {r.reporter_name || r.reporter_email || '-'}
                    </td>
                    <td className="py-3 px-3 font-bold text-red-700">
                      {r.sender_name || r.sender_email || 'ผู้ใช้ที่ถูกลบ'}
                    </td>
                    <td className="py-3 px-3 max-w-xs">
                      <div className="p-2 bg-red-50 text-red-900 rounded-lg border border-red-200 text-[11px] font-mono break-words">
                        {r.message_text || '(ข้อความถูกลบแล้ว)'}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-[11px] text-slate-600">{r.reason}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        r.status === 'รอดำเนินการ' ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {r.message_id && r.message_text && (
                          <button
                            type="button"
                            onClick={() => handleDeleteReportedMessage(r.message_id)}
                            className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold shadow-xs"
                            title="ลบข้อความนี้ออกจากแชท"
                          >
                            ลบข้อความ
                          </button>
                        )}
                        {r.status === 'รอดำเนินการ' ? (
                          <button
                            type="button"
                            onClick={() => handleUpdateReportStatus(r.report_id, 'ตรวจสอบแล้ว')}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold shadow-xs"
                          >
                            รับทราบ
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleUpdateReportStatus(r.report_id, 'ปิดรายงาน')}
                            className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[10px] font-bold"
                          >
                            ปิดเรื่อง
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteReport(r.report_id)}
                          className="p-1 text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Forgot Password / Account Recreation Support Requests */}
      <div className="travel-card p-6 space-y-4 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-amber-600" />
            <span>คำขอลืมรหัสผ่าน / แชทขอลบบัญชีกับแอดมิน ({supportRequests.length} รายการ)</span>
          </h3>
          <span className="text-xs text-slate-500 font-medium">กดปุ่มเพื่อลบบัญชีเดิมและให้ผู้ใช้สมัครใหม่</span>
        </div>

        {supportRequests.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
            ไม่มีคำขอลืมรหัสผ่านหรือขอลบบัญชีที่รอดำเนินการ
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase font-bold">
                  <th className="py-3 px-3">เวลา</th>
                  <th className="py-3 px-3">อีเมล</th>
                  <th className="py-3 px-3">ประเภท</th>
                  <th className="py-3 px-3">ข้อความจากผู้ใช้</th>
                  <th className="py-3 px-3">ตอบกลับ</th>
                  <th className="py-3 px-3">สถานะ</th>
                  <th className="py-3 px-3 text-right">ดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800 font-medium">
                {supportRequests.map((s) => (
                  <tr key={s.request_id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(s.created_at).toLocaleDateString('th-TH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900">
                      <div>{s.email}</div>
                      {s.matched_user_name && <span className="text-[10px] text-emerald-700">มีบัญชีชื่อ: {s.matched_user_name}</span>}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                        {s.request_type === 'delete_account' ? 'ขอลบบัญชีเพื่อสร้างใหม่' : s.request_type === 'forgot_password' ? 'ลืมรหัสผ่าน' : 'อื่นๆ'}
                      </span>
                    </td>
                    <td className="py-3 px-3 max-w-xs text-[11px] text-slate-700 break-words">{s.message}</td>
                    <td className="py-3 px-3 text-[11px] text-emerald-800 italic">{s.admin_reply || '-'}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        s.status === 'ดำเนินการแล้ว' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {s.email !== 'admin@ikoshare.com' && s.status !== 'ดำเนินการแล้ว' && (
                          <button
                            type="button"
                            onClick={() => handleResolveSupportAndDeleteUser(s.email, s.request_id)}
                            className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold shadow-xs flex items-center gap-1"
                            title="ลบบัญชีเดิมเพื่อให้ผู้ใช้สมัครใหม่ด้วยอีเมลนี้"
                          >
                            <UserX className="w-3 h-3" />
                            <span>ลบบัญชีเดิม</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleUpdateSupportStatus(s.request_id, 'ดำเนินการแล้ว', s.admin_reply)}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold shadow-xs"
                          title="ตอบกลับหรือเปลี่ยนสถานะ"
                        >
                          ตอบกลับ
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSupportRequest(s.request_id)}
                          className="p-1 text-slate-400 hover:text-red-600"
                          title="ลบคำขอ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Document Proof Image Viewer Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-3xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl p-2 flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between p-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-blue-600" />
                รูปเอกสารหลักฐานยืนยันตัวตน
              </span>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 overflow-auto max-h-[75vh] flex items-center justify-center">
              <img
                src={previewImage}
                alt="เอกสารหลักฐานขยาย"
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
