import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { Shield, Users, Car, Calendar, MapPin, Trash2, AlertCircle } from 'lucide-react';

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
        <div className="inline-block w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[#6B7280] text-xs font-semibold">กำลังโหลดระบบผู้ดูแลระบบ (Admin Dashboard)...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-8">
      <div className="flex items-center gap-3">
        <div className="p-3.5 rounded-2xl neu-inset text-amber-600">
          <Shield className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-[#3D4852] font-['Plus_Jakarta_Sans',sans-serif]">ระบบจัดการผู้ดูแลระบบ (Admin Dashboard)</h2>
          <p className="text-xs text-[#6B7280]">ภาพรวมสถิติแพลตฟอร์มและการจัดการข้อมูลสมาชิก / เที่ยวรถ</p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 text-xs flex items-center gap-3 font-medium">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ER Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="neu-card p-5 space-y-1">
          <div className="text-[#6B7280] text-[10px] font-bold uppercase tracking-wider">สมาชิก (Users)</div>
          <div className="text-2xl font-black text-[#6C63FF]">{stats.totalUsers} คน</div>
        </div>

        <div className="neu-card p-5 space-y-1">
          <div className="text-[#6B7280] text-[10px] font-bold uppercase tracking-wider">รถยนต์ (Cars)</div>
          <div className="text-2xl font-black text-[#38B2AC]">{stats.totalCars} คัน</div>
        </div>

        <div className="neu-card p-5 space-y-1">
          <div className="text-[#6B7280] text-[10px] font-bold uppercase tracking-wider">อีเวนต์ (Events)</div>
          <div className="text-2xl font-black text-purple-600">{stats.totalEvents} งาน</div>
        </div>

        <div className="neu-card p-5 space-y-1">
          <div className="text-[#6B7280] text-[10px] font-bold uppercase tracking-wider">เที่ยวรถ (Trips)</div>
          <div className="text-2xl font-black text-amber-600">{stats.totalTrips} เที่ยว</div>
        </div>

        <div className="neu-card p-5 space-y-1 col-span-2 sm:col-span-1">
          <div className="text-[#6B7280] text-[10px] font-bold uppercase tracking-wider">การจองสำเร็จ (Bookings)</div>
          <div className="text-2xl font-black text-pink-600">{stats.totalBookings} รายการ</div>
        </div>
      </div>

      {/* Table: Recent Trips */}
      <div className="neu-card p-6 space-y-4">
        <h3 className="text-lg font-bold text-[#3D4852] flex items-center gap-2">
          <Car className="w-5 h-5 text-amber-500" />
          <span>เที่ยวเดินทางล่าสุด</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-300 text-[#6B7280] uppercase font-bold">
                <th className="py-3 px-4">Trip ID</th>
                <th className="py-3 px-4">เส้นทาง</th>
                <th className="py-3 px-4">คนขับ</th>
                <th className="py-3 px-4">ทะเบียนรถ</th>
                <th className="py-3 px-4 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300 text-[#3D4852]">
              {recentTrips.map((t) => (
                <tr key={t.trip_id} className="hover:bg-[#E0E5EC]/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-500">#{t.trip_id}</td>
                  <td className="py-3 px-4 font-extrabold text-[#3D4852]">{t.origin} ➔ {t.destination}</td>
                  <td className="py-3 px-4 font-semibold">{t.driver_name}</td>
                  <td className="py-3 px-4 font-mono">{t.license_plate}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleDeleteTrip(t.trip_id)}
                      className="p-2 rounded-xl neu-button text-red-500 hover:text-red-600"
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
      <div className="neu-card p-6 space-y-4">
        <h3 className="text-lg font-bold text-[#3D4852] flex items-center gap-2">
          <Users className="w-5 h-5 text-[#6C63FF]" />
          <span>รายการสมาชิกในระบบ</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-300 text-[#6B7280] uppercase font-bold">
                <th className="py-3 px-4">User ID</th>
                <th className="py-3 px-4">ชื่อ</th>
                <th className="py-3 px-4">อีเมล</th>
                <th className="py-3 px-4">เบอร์โทร</th>
                <th className="py-3 px-4">บทบาท</th>
                <th className="py-3 px-4 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300 text-[#3D4852]">
              {users.map((u) => {
                const uid = u.user_id || u.id;
                return (
                  <tr key={uid} className="hover:bg-[#E0E5EC]/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-500">#{uid}</td>
                    <td className="py-3 px-4 font-extrabold text-[#3D4852]">{u.name}</td>
                    <td className="py-3 px-4 font-medium">{u.email}</td>
                    <td className="py-3 px-4 font-medium">{u.phone || '-'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold neu-pill ${u.role === 'Driver' ? 'text-[#2C7A7B]' : u.role === 'Both' ? 'text-purple-600' : 'text-[#6C63FF]'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {u.email !== 'admin@ikoshare.com' && (
                        <button
                          onClick={() => handleDeleteUser(uid)}
                          className="p-2 rounded-xl neu-button text-red-500 hover:text-red-600"
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
