import React, { useState, useEffect } from 'react';
import API from '../services/api';
import CarLoader from '../components/CarLoader';
import { Shield, Users, Car, Calendar, MapPin, Trash2, AlertCircle, Flag, MessageSquare, Check, X, UserX } from 'lucide-react';

export default function Admin() {
  const [stats, setStats] = useState({ totalUsers: 0, totalCars: 0, totalEvents: 0, totalTrips: 0, totalBookings: 0, totalReports: 0, totalSupportRequests: 0 });
  const [users, setUsers] = useState([]);
  const [recentTrips, setRecentTrips] = useState([]);
  const [reports, setReports] = useState([]);
  const [supportRequests, setSupportRequests] = useState([]);
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
        setStats(statsRes.data.stats || { totalUsers: 0, totalCars: 0, totalEvents: 0, totalTrips: 0, totalBookings: 0, totalReports: 0, totalSupportRequests: 0 });
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
        <div className="travel-card p-4 space-y-1 border border-slate-200 shadow-xs">
          <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">สมาชิก (Users)</div>
          <div className="text-xl font-black text-emerald-700">{stats.totalUsers}</div>
        </div>

        <div className="travel-card p-4 space-y-1 border border-slate-200 shadow-xs">
          <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">รถยนต์ (Cars)</div>
          <div className="text-xl font-black text-teal-700">{stats.totalCars}</div>
        </div>

        <div className="travel-card p-4 space-y-1 border border-slate-200 shadow-xs">
          <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">อีเวนต์ (Events)</div>
          <div className="text-xl font-black text-purple-700">{stats.totalEvents}</div>
        </div>

        <div className="travel-card p-4 space-y-1 border border-slate-200 shadow-xs">
          <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">เที่ยวรถ (Trips)</div>
          <div className="text-xl font-black text-amber-700">{stats.totalTrips}</div>
        </div>

        <div className="travel-card p-4 space-y-1 border border-slate-200 shadow-xs">
          <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">การจอง (Bookings)</div>
          <div className="text-xl font-black text-rose-700">{stats.totalBookings}</div>
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

    </div>
  );
}
