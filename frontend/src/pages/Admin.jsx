import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { Shield, Users, Car, Calendar, MapPin, Trash2, AlertCircle, BookmarkCheck } from 'lucide-react';

export default function Admin() {
  const [stats, setStats] = useState({ totalUsers: 0, totalCars: 0, totalEvents: 0, totalTrips: 0, totalBookings: 0 });
  const [users, setUsers] = useState([]);
  const [recentTrips, setRecentTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    setError('');
    try {
      const statsRes = await API.get('/admin/stats');
      if (statsRes.data.success) {
        setStats(statsRes.data.stats || { totalUsers: 0, totalCars: 0, totalEvents: 0, totalTrips: 0, totalBookings: 0 });
        setRecentTrips(statsRes.data.recentTrips || []);
      }

      const usersRes = await API.get('/admin/users');
      if (usersRes.data.success) {
        setUsers(usersRes.data.users || []);
      }
    } catch (err) {
      console.error('Fetch admin data error:', err);
      setError(String(err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ดูแลระบบ'));
    } finally {
      setLoading(false);
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
    return (
      <div className="text-center py-20 space-y-3">
        <div className="inline-block w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 text-sm">กำลังโหลดระบบผู้ดูแลระบบ (Admin Dashboard)...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-8">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400">
          <Shield className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">ระบบจัดการผู้ดูแลระบบ (Admin Dashboard)</h2>
          <p className="text-sm text-slate-400">ภาพรวมสถิติแพลตฟอร์มและการจัดการข้อมูลสมาชิก / เที่ยวรถ</p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-500/20 border border-red-500/30 text-red-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ER Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-sky-500/20 space-y-1">
          <div className="text-slate-400 text-[10px] font-semibold uppercase">สมาชิก (Users)</div>
          <div className="text-2xl font-extrabold text-sky-300">{stats.totalUsers} คน</div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-emerald-500/20 space-y-1">
          <div className="text-slate-400 text-[10px] font-semibold uppercase">รถยนต์ (Cars)</div>
          <div className="text-2xl font-extrabold text-emerald-300">{stats.totalCars} คัน</div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-purple-500/20 space-y-1">
          <div className="text-slate-400 text-[10px] font-semibold uppercase">อีเวนต์ (Events)</div>
          <div className="text-2xl font-extrabold text-purple-300">{stats.totalEvents} งาน</div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-amber-500/20 space-y-1">
          <div className="text-slate-400 text-[10px] font-semibold uppercase">เที่ยวรถ (Trips)</div>
          <div className="text-2xl font-extrabold text-amber-300">{stats.totalTrips} เที่ยว</div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-pink-500/20 space-y-1 col-span-2 sm:col-span-1">
          <div className="text-slate-400 text-[10px] font-semibold uppercase">การจองสำเร็จ (Bookings)</div>
          <div className="text-2xl font-extrabold text-pink-300">{stats.totalBookings} รายการ</div>
        </div>
      </div>

      {/* Modern Table: Recent Trips */}
      <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Car className="w-5 h-5 text-amber-400" />
          <span>เที่ยวเดินทางล่าสุด</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 uppercase">
                <th className="py-3 px-4">Trip ID</th>
                <th className="py-3 px-4">เส้นทาง</th>
                <th className="py-3 px-4">คนขับ</th>
                <th className="py-3 px-4">ทะเบียนรถ</th>
                <th className="py-3 px-4 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {recentTrips.map((t) => (
                <tr key={t.trip_id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-400">#{t.trip_id}</td>
                  <td className="py-3 px-4 font-semibold text-white">{t.origin} ➔ {t.destination}</td>
                  <td className="py-3 px-4 text-slate-300">{t.driver_name}</td>
                  <td className="py-3 px-4 text-slate-300 font-mono">{t.license_plate}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleDeleteTrip(t.trip_id)}
                      className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all"
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
      <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-sky-400" />
          <span>รายการสมาชิกในระบบ</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 uppercase">
                <th className="py-3 px-4">User ID</th>
                <th className="py-3 px-4">ชื่อ</th>
                <th className="py-3 px-4">อีเมล</th>
                <th className="py-3 px-4">เบอร์โทร</th>
                <th className="py-3 px-4">บทบาท</th>
                <th className="py-3 px-4 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {users.map((u) => {
                const uid = u.user_id || u.id;
                return (
                  <tr key={uid} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-400">#{uid}</td>
                    <td className="py-3 px-4 font-semibold text-white">{u.name}</td>
                    <td className="py-3 px-4 text-slate-300">{u.email}</td>
                    <td className="py-3 px-4 text-slate-300">{u.phone || '-'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${u.role === 'Driver' ? 'bg-emerald-500/20 text-emerald-300' : u.role === 'Both' ? 'bg-purple-500/20 text-purple-300' : 'bg-sky-500/20 text-sky-300'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {u.email !== 'admin@ikoshare.com' && (
                        <button
                          onClick={() => handleDeleteUser(uid)}
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all"
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
    </div>
  );
}
